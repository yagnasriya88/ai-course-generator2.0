from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

from app.database import get_database
from app.models.course import Course, LessonStub, ModuleOutline
from app.models.lesson import ContentBlock, Lesson, QuizQuestion
from app.services import lesson_service

COLLECTION = "courses"
PLATFORM_OWNER_ID = "platform"


async def create_course(course: Course) -> Course:
    db = get_database()
    doc = course.model_dump(by_alias=True, exclude={"id"})
    result = await db[COLLECTION].insert_one(doc)
    course.id = str(result.inserted_id)
    return course


async def get_course(course_id: str) -> Course | None:
    try:
        object_id = ObjectId(course_id)
    except InvalidId:
        return None
    db = get_database()
    doc = await db[COLLECTION].find_one({"_id": object_id})
    return Course(**doc) if doc else None


async def list_courses(owner_id: str, limit: int = 20) -> list[Course]:
    db = get_database()
    cursor = (
        db[COLLECTION].find({"owner_id": owner_id}).sort("created_at", -1).limit(limit)
    )
    return [Course(**doc) async for doc in cursor]


async def list_quiz_summaries(owner_id: str) -> list[dict]:
    """Flattens every module that has a quiz across all of the owner's courses.
    There's no standalone quiz entity — quizzes live nested in Course.modules[]."""
    db = get_database()
    cursor = db[COLLECTION].find(
        {"owner_id": owner_id}, {"title": 1, "modules": 1}
    )
    summaries: list[dict] = []
    async for doc in cursor:
        course_id = str(doc["_id"])
        for module in doc.get("modules", []):
            if not module.get("quiz"):
                continue
            summaries.append(
                {
                    "course_id": course_id,
                    "course_title": doc.get("title", ""),
                    "module_id": module.get("id"),
                    "module_title": module.get("title", ""),
                    "quiz_completed": module.get("quiz_completed", False),
                    "quiz_score": module.get("quiz_score"),
                    "quiz_total": module.get("quiz_total"),
                }
            )
    return summaries


async def mark_lesson_enriched(course_id: str, module_id: str, lesson_id: str) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {
            "_id": ObjectId(course_id),
            "modules.id": module_id,
            "modules.lessons.id": lesson_id,
        },
        {"$set": {"modules.$[m].lessons.$[l].is_enriched": True}},
        array_filters=[{"m.id": module_id}, {"l.id": lesson_id}],
    )


async def set_lesson_completed(course_id: str, lesson_id: str, completed: bool) -> tuple[list[str], bool]:
    """Returns the updated id list plus whether this call actually changed the
    completion state (vs. a redundant repeat toggle) — callers use `changed`
    to decide whether to award/claw back rewards exactly once per transition."""
    db = get_database()
    before = await db[COLLECTION].find_one({"_id": ObjectId(course_id)}, {"completed_lesson_ids": 1})
    was_completed = lesson_id in (before.get("completed_lesson_ids", []) if before else [])

    op = {"$addToSet": {"completed_lesson_ids": lesson_id}} if completed else {
        "$pull": {"completed_lesson_ids": lesson_id}
    }
    doc = await db[COLLECTION].find_one_and_update(
        {"_id": ObjectId(course_id)},
        op,
        return_document=ReturnDocument.AFTER,
    )
    ids = doc["completed_lesson_ids"] if doc else []
    changed = completed != was_completed
    return ids, changed


async def set_module_quiz(course_id: str, module_id: str, quiz: list[QuizQuestion]) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(course_id), "modules.id": module_id},
        {"$set": {"modules.$[m].quiz": [q.model_dump() for q in quiz]}},
        array_filters=[{"m.id": module_id}],
    )


async def set_module_quiz_result(
    course_id: str, module_id: str, *, completed: bool, score: int, total: int
) -> None:
    db = get_database()
    await db[COLLECTION].update_one(
        {"_id": ObjectId(course_id), "modules.id": module_id},
        {
            "$set": {
                "modules.$[m].quiz_completed": completed,
                "modules.$[m].quiz_score": score,
                "modules.$[m].quiz_total": total,
            }
        },
        array_filters=[{"m.id": module_id}],
    )


async def get_platform_templates() -> list[Course]:
    db = get_database()
    cursor = db[COLLECTION].find({"owner_id": PLATFORM_OWNER_ID, "is_platform": True})
    return [Course(**doc) async for doc in cursor]


async def user_has_clone(owner_id: str, template_id: str) -> bool:
    db = get_database()
    doc = await db[COLLECTION].find_one(
        {"owner_id": owner_id, "template_id": template_id}, {"_id": 1}
    )
    return doc is not None


async def clone_course_for_user(template: Course, owner_id: str) -> Course:
    """Deep-copies a platform template into a real, independently-owned Course
    so every existing owner-scoped route (detail, lesson, quiz, completion,
    rewards) works on it completely unchanged."""
    new_modules: list[ModuleOutline] = []
    lessons_to_save: list[Lesson] = []

    for module in template.modules:
        new_module_id = str(ObjectId())
        new_stubs: list[LessonStub] = []

        for stub in module.lessons:
            template_lesson = await lesson_service.get_lesson(stub.id)
            new_lesson_id = str(ObjectId())
            new_stubs.append(LessonStub(id=new_lesson_id, title=stub.title, is_enriched=True))
            if template_lesson:
                lessons_to_save.append(
                    Lesson(
                        id=new_lesson_id,
                        course_id="",  # filled in once the clone has an id
                        module_id=new_module_id,
                        title=template_lesson.title,
                        objectives=list(template_lesson.objectives),
                        content=[ContentBlock(**b.model_dump()) for b in template_lesson.content],
                        videos=list(template_lesson.videos),
                        visual_aids=list(template_lesson.visual_aids),
                        hinglish=template_lesson.hinglish,
                        is_enriched=True,
                        auto_enriched=True,
                    )
                )

        new_modules.append(
            ModuleOutline(
                id=new_module_id,
                title=module.title,
                lessons=new_stubs,
                quiz=[QuizQuestion(**q.model_dump()) for q in module.quiz],
            )
        )

    clone = Course(
        owner_id=owner_id,
        title=template.title,
        description=template.description,
        tags=list(template.tags),
        level=template.level,
        goals=template.goals,
        study_time=template.study_time,
        modules=new_modules,
        cover_image_url=template.cover_image_url,
        is_platform=True,
        template_id=template.id,
    )
    saved = await create_course(clone)

    for lesson in lessons_to_save:
        lesson.course_id = saved.id
        await lesson_service.create_lesson(lesson)

    return saved


async def ensure_platform_courses_for_user(owner_id: str) -> None:
    templates = await get_platform_templates()
    for template in templates:
        if not await user_has_clone(owner_id, template.id):
            await clone_course_for_user(template, owner_id)


async def list_courses_for_user(owner_id: str, limit: int = 20) -> list[Course]:
    await ensure_platform_courses_for_user(owner_id)
    return await list_courses(owner_id, limit=limit)


def _ml_course_template() -> tuple[Course, list[Lesson]]:
    """Hand-authored, not Gemini-generated — a full-fledged ML-intro course
    (5 modules x 3 lessons, 4-question quizzes) seeded once at startup so no
    API quota is spent on it. Each module gets a pre-populated quiz so
    `get_or_generate_module_quiz`'s `if module.quiz: return module.quiz`
    early-return also skips agent calls."""

    def block(**kwargs) -> ContentBlock:
        return ContentBlock(**kwargs)

    def mcq(question, options, correct_answer, explanation) -> QuizQuestion:
        return QuizQuestion(
            id=str(ObjectId()),
            type="mcq",
            question=question,
            options=options,
            correct_answer=correct_answer,
            explanation=explanation,
        )

    lessons_spec = [
        {
            "module_title": "What Is Machine Learning?",
            "lessons": [
                {
                    "title": "Machine Learning in the Real World",
                    "objectives": [
                        "Recognize everyday products that use ML",
                        "Explain how ML differs from traditional rule-based programming",
                        "Name the three main types of ML",
                    ],
                    "content": [
                        block(type="heading", text="From Rules to Learning"),
                        block(
                            type="paragraph",
                            text=(
                                "Traditional programs follow explicit rules written by a human. "
                                "Machine learning systems instead learn patterns from data. As "
                                "Tom Mitchell put it: a program learns from experience E with "
                                "respect to task T and performance measure P, if its performance "
                                "at T, measured by P, improves with experience E."
                            ),
                        ),
                        block(type="heading", text="Types of Machine Learning"),
                        block(
                            type="paragraph",
                            text="Supervised learning trains on labeled examples — e.g. spam detection, where each email is labeled spam or not.",
                        ),
                        block(
                            type="paragraph",
                            text="Unsupervised learning finds structure in unlabeled data — e.g. grouping customers into segments without predefined categories.",
                        ),
                        block(
                            type="paragraph",
                            text="Reinforcement learning learns via reward and penalty — e.g. an agent that gets better at a game through trial and error.",
                        ),
                        block(
                            type="exercise",
                            text="List three apps you used today and guess which type of ML (if any) powers a feature in each.",
                        ),
                        block(
                            type="takeaway",
                            text="ML lets systems improve from data instead of being explicitly programmed for every case.",
                        ),
                    ],
                },
                {
                    "title": "The Machine Learning Workflow",
                    "objectives": [
                        "List the stages of a typical ML pipeline",
                        "Explain why data is split into training and test sets",
                        "Understand what 'training a model' means at a high level",
                    ],
                    "content": [
                        block(type="heading", text="From Data to Deployment"),
                        block(
                            type="paragraph",
                            text="A typical pipeline: collect data, clean it, engineer features, split into train/test sets, train a model, evaluate it, then deploy it.",
                        ),
                        block(type="heading", text="Why Split the Data?"),
                        block(
                            type="paragraph",
                            text="If you evaluate a model on data it already memorized during training, you can't tell whether it actually generalizes to new examples — that's what a held-out test set measures.",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "from sklearn.model_selection import train_test_split\n"
                                "X_train, X_test, y_train, y_test = train_test_split(\n"
                                "    X, y, test_size=0.2, random_state=42\n"
                                ")"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="Why do you think test_size is usually 20-30%, not 50%?",
                        ),
                        block(
                            type="takeaway",
                            text="A model is only useful if it generalizes to data it hasn't seen — that's what the test set measures.",
                        ),
                    ],
                },
                {
                    "title": "Types of Machine Learning Problems",
                    "objectives": [
                        "Distinguish classification, regression, clustering, and recommendation problems",
                        "Match a real-world scenario to the right problem type",
                        "Understand what 'ranking' and 'generation' problems are",
                    ],
                    "content": [
                        block(type="heading", text="Naming the Problem Before Solving It"),
                        block(
                            type="paragraph",
                            text="Before picking an algorithm, figure out what kind of problem you're solving — the problem type determines which tools even apply.",
                        ),
                        block(
                            type="paragraph",
                            text="Classification predicts a category (spam or not-spam). Regression predicts a number (tomorrow's temperature). Clustering groups similar items without labels (customer segments). Recommendation ranks items for a user (movies you might like). Generation produces new content (text, images) rather than a label at all.",
                        ),
                        block(
                            type="exercise",
                            text="Match each to a problem type: (1) predicting a house's sale price, (2) grouping news articles by topic with no predefined categories, (3) suggesting the next video to watch.",
                        ),
                        block(
                            type="takeaway",
                            text="Naming the problem type first narrows down which algorithms and evaluation metrics are even relevant.",
                        ),
                    ],
                },
            ],
            "quiz": [
                mcq(
                    "What is the main difference between traditional programming and machine learning?",
                    [
                        "ML learns patterns from data instead of following explicit rules",
                        "ML always runs faster than traditional programs",
                        "Traditional programs cannot use data at all",
                        "There is no real difference",
                    ],
                    "ML learns patterns from data instead of following explicit rules",
                    "Traditional programs follow rules written by a human; ML systems learn patterns directly from data.",
                ),
                mcq(
                    "Which type of ML learns from labeled examples?",
                    ["Supervised learning", "Unsupervised learning", "Reinforcement learning", "None of these"],
                    "Supervised learning",
                    "Supervised learning trains on examples that already have the correct answer (label) attached.",
                ),
                mcq(
                    "Why do we hold out a separate test set instead of evaluating on the training data?",
                    [
                        "To measure whether the model generalizes to unseen data",
                        "Because training data is too large to evaluate on",
                        "It's required by every ML library",
                        "To make training faster",
                    ],
                    "To measure whether the model generalizes to unseen data",
                    "Evaluating on data the model already saw during training can't reveal whether it actually generalizes.",
                ),
                mcq(
                    "Grouping customers into segments with no predefined categories is an example of:",
                    ["Classification", "Regression", "Clustering", "Ranking"],
                    "Clustering",
                    "Clustering finds structure in unlabeled data without predefined categories — exactly what customer segmentation does.",
                ),
            ],
        },
        {
            "module_title": "Data & Features",
            "lessons": [
                {
                    "title": "Understanding Data for ML",
                    "objectives": [
                        "Distinguish structured vs. unstructured data",
                        "Define what a 'feature' and a 'label' are",
                        "Read a simple tabular dataset",
                    ],
                    "content": [
                        block(type="heading", text="Structured vs. Unstructured Data"),
                        block(
                            type="paragraph",
                            text="Structured data lives in tables/spreadsheets (rows and columns). Unstructured data includes images, free text, and audio.",
                        ),
                        block(type="heading", text="Features and Labels"),
                        block(
                            type="paragraph",
                            text="Features are the inputs describing an example; the label is the answer you want to predict — e.g. predicting house price (label) from size and location (features).",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "import pandas as pd\n"
                                "df = pd.read_csv('houses.csv')\n"
                                "X = df[['size_sqft', 'bedrooms']]\n"
                                "y = df['price']"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="For a dataset predicting whether an email is spam, name two possible features and the label.",
                        ),
                        block(
                            type="takeaway",
                            text="Good features often matter more than a fancy algorithm.",
                        ),
                    ],
                },
                {
                    "title": "Data Cleaning and Preprocessing",
                    "objectives": [
                        "Identify common data quality problems: missing values, outliers, inconsistent formats",
                        "Explain common strategies for handling missing data",
                        "Understand why feature scaling matters for some algorithms",
                    ],
                    "content": [
                        block(type="heading", text="Real Data Is Messy"),
                        block(
                            type="paragraph",
                            text="Real-world datasets have missing values, typos, duplicate rows, and outliers. Cleaning this up is often the most time-consuming part of an ML project.",
                        ),
                        block(
                            type="paragraph",
                            text="Common strategies for missing values: drop the row, drop the column, or fill in a reasonable value (like the column's mean or median) — each has tradeoffs depending on how much data you'd lose.",
                        ),
                        block(
                            type="paragraph",
                            text="Feature scaling (e.g. normalizing values to a 0-1 range) matters for algorithms that use distances, like k-nearest neighbors — otherwise a feature measured in the thousands can dominate one measured in single digits.",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "from sklearn.preprocessing import StandardScaler\n"
                                "df['age'] = df['age'].fillna(df['age'].median())\n"
                                "scaler = StandardScaler()\n"
                                "X_scaled = scaler.fit_transform(X)"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="A column has 2% missing values and another has 60% missing. Would you treat them the same way? Why or why not?",
                        ),
                        block(
                            type="takeaway",
                            text="Clean data beats a fancier model trained on messy data almost every time.",
                        ),
                    ],
                },
                {
                    "title": "Feature Engineering Basics",
                    "objectives": [
                        "Explain what feature engineering is and why it matters",
                        "Describe one-hot encoding for categorical variables",
                        "Recognize an example of a derived/engineered feature",
                    ],
                    "content": [
                        block(type="heading", text="Turning Raw Data into Useful Signals"),
                        block(
                            type="paragraph",
                            text="Feature engineering is the process of creating new input features, or transforming existing ones, to make patterns easier for a model to learn.",
                        ),
                        block(
                            type="paragraph",
                            text="Categorical variables (like 'city' or 'color') usually need to be converted to numbers. One-hot encoding creates a separate 0/1 column per category, avoiding the false impression that categories have a numeric order.",
                        ),
                        block(
                            type="paragraph",
                            text="Derived features combine existing columns into a more useful signal — e.g. turning a raw timestamp into 'day of week' or 'hour of day' when time-of-day patterns matter more than the exact moment.",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "df = pd.get_dummies(df, columns=['city'])\n"
                                "df['hour_of_day'] = df['timestamp'].dt.hour"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="For a dataset predicting bike rental demand, propose one derived feature that might help beyond the raw timestamp.",
                        ),
                        block(
                            type="takeaway",
                            text="A well-engineered feature can do more for accuracy than switching to a more complex algorithm.",
                        ),
                    ],
                },
            ],
            "quiz": [
                mcq(
                    "A model performs very well on training data but poorly on new data. This is called:",
                    ["Underfitting", "Overfitting", "Regularization", "Feature engineering"],
                    "Overfitting",
                    "Overfitting happens when a model memorizes the training data instead of learning patterns that generalize.",
                ),
                mcq(
                    "Which technique converts a categorical column like 'city' into numeric 0/1 columns?",
                    ["Standard scaling", "One-hot encoding", "Train/test split", "Gradient descent"],
                    "One-hot encoding",
                    "One-hot encoding creates a separate binary column per category, avoiding a false sense of numeric order.",
                ),
                mcq(
                    "Why does feature scaling matter for distance-based algorithms like k-nearest neighbors?",
                    [
                        "It makes the code run faster",
                        "A feature measured in large numbers can dominate the distance calculation",
                        "It removes the need for a test set",
                        "It converts regression problems into classification problems",
                    ],
                    "A feature measured in large numbers can dominate the distance calculation",
                    "Without scaling, features with larger raw magnitudes can unfairly dominate distance calculations.",
                ),
                mcq(
                    "Turning a raw timestamp into an 'hour of day' column is an example of:",
                    ["Data leakage", "Feature engineering", "Overfitting", "Cross-validation"],
                    "Feature engineering",
                    "Deriving a more useful signal (hour of day) from a raw column (timestamp) is a classic feature engineering example.",
                ),
            ],
        },
        {
            "module_title": "Model Fundamentals",
            "lessons": [
                {
                    "title": "Overfitting, Underfitting, and the Bias-Variance Tradeoff",
                    "objectives": [
                        "Define overfitting and underfitting with an analogy",
                        "Explain the bias-variance tradeoff at a conceptual level",
                        "Recognize signs of overfitting in practice",
                    ],
                    "content": [
                        block(type="heading", text="When a Model Memorizes Instead of Learns"),
                        block(
                            type="paragraph",
                            text="Overfitting is like a student who memorizes past exam answers instead of understanding the concepts — they do great on old exams and poorly on new ones.",
                        ),
                        block(
                            type="paragraph",
                            text="Underfitting is the opposite: a model too simple to capture the underlying pattern at all, performing poorly everywhere.",
                        ),
                        block(
                            type="paragraph",
                            text="The bias-variance tradeoff, in plain language: simpler models tend to underfit (high bias), while overly complex models tend to overfit (high variance). The goal is a sweet spot in between.",
                        ),
                        block(
                            type="exercise",
                            text="A model gets 99% accuracy on training data but 60% on test data — what's likely happening, and what's one way to fix it?",
                        ),
                        block(
                            type="takeaway",
                            text="The real goal isn't a perfect training score — it's a model that generalizes.",
                        ),
                    ],
                },
                {
                    "title": "Linear Regression and Classification Basics",
                    "objectives": [
                        "Explain linear regression conceptually",
                        "Distinguish regression from classification tasks",
                        "Recognize when to use each",
                    ],
                    "content": [
                        block(type="heading", text="Predicting Numbers: Linear Regression"),
                        block(
                            type="paragraph",
                            text="Linear regression fits a line (or plane, with more features) to predict a continuous value, like a price.",
                        ),
                        block(type="heading", text="Predicting Categories: Classification"),
                        block(
                            type="paragraph",
                            text="Classification predicts a category instead of a number — e.g. spam vs. not-spam. Logistic regression, despite the name, is actually a classification algorithm.",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "from sklearn.linear_model import LinearRegression\n"
                                "model = LinearRegression()\n"
                                "model.fit(X_train, y_train)\n"
                                "predictions = model.predict(X_test)"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="Is 'will this customer churn?' a regression or classification problem? Why?",
                        ),
                        block(
                            type="takeaway",
                            text="Regression predicts a number; classification predicts a category — the task defines which one you need.",
                        ),
                    ],
                },
                {
                    "title": "Decision Trees and Ensemble Methods",
                    "objectives": [
                        "Explain how a decision tree makes predictions",
                        "Understand the intuition behind random forests",
                        "Describe boosting at a conceptual level",
                    ],
                    "content": [
                        block(type="heading", text="Learning by Asking Questions"),
                        block(
                            type="paragraph",
                            text="A decision tree predicts by asking a sequence of yes/no questions about the features (e.g. 'is income > $50k?') until it reaches a final prediction at a leaf node.",
                        ),
                        block(
                            type="paragraph",
                            text="A single tree can overfit easily. A random forest trains many trees on random subsets of the data and features, then averages their predictions — this typically generalizes much better than any single tree.",
                        ),
                        block(
                            type="paragraph",
                            text="Boosting takes a different approach: it trains models sequentially, where each new model focuses on correcting the mistakes of the previous ones. Gradient boosting (e.g. XGBoost, LightGBM) is a widely used, high-performing boosting approach.",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "from sklearn.ensemble import RandomForestClassifier\n"
                                "model = RandomForestClassifier(n_estimators=100)\n"
                                "model.fit(X_train, y_train)"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="Why might averaging predictions from many slightly-different trees generalize better than trusting a single deep tree?",
                        ),
                        block(
                            type="takeaway",
                            text="Combining many weak or overfit-prone models (ensembling) is one of the most reliable ways to improve accuracy.",
                        ),
                    ],
                },
            ],
            "quiz": [
                mcq(
                    "A model that is too simple to capture the underlying pattern, performing poorly everywhere, is:",
                    ["Overfit", "Underfit", "Well-regularized", "Ensembled"],
                    "Underfit",
                    "Underfitting means the model is too simple to capture the real pattern in the data.",
                ),
                mcq(
                    "Predicting a house's price is a ______ problem, while predicting whether an email is spam is a ______ problem.",
                    [
                        "regression; classification",
                        "classification; regression",
                        "clustering; regression",
                        "regression; clustering",
                    ],
                    "regression; classification",
                    "House price is a continuous number (regression); spam/not-spam is a category (classification).",
                ),
                mcq(
                    "What does a random forest do differently from a single decision tree?",
                    [
                        "It trains many trees on random subsets and averages their predictions",
                        "It removes the need for training data entirely",
                        "It only works on regression problems",
                        "It guarantees zero overfitting",
                    ],
                    "It trains many trees on random subsets and averages their predictions",
                    "Random forests combine many trees trained on random subsets of data/features, which generalizes better than one tree.",
                ),
                mcq(
                    "In boosting, each new model is trained to:",
                    [
                        "Correct the mistakes of the previous models",
                        "Ignore the previous models entirely",
                        "Only look at features the previous models ignored",
                        "Replace the training data with new data",
                    ],
                    "Correct the mistakes of the previous models",
                    "Boosting trains models sequentially, with each new model focused on the errors of the ones before it.",
                ),
            ],
        },
        {
            "module_title": "Training & Optimization",
            "lessons": [
                {
                    "title": "How Models Learn: Loss Functions and Gradient Descent",
                    "objectives": [
                        "Explain what a loss function measures",
                        "Describe gradient descent at a conceptual level",
                        "Understand what the learning rate controls",
                    ],
                    "content": [
                        block(type="heading", text="Measuring How Wrong a Model Is"),
                        block(
                            type="paragraph",
                            text="A loss function measures how far a model's predictions are from the true values — training is the process of adjusting the model to make this loss as small as possible.",
                        ),
                        block(
                            type="paragraph",
                            text="Gradient descent is the standard way to do this adjustment: it repeatedly nudges the model's parameters in the direction that reduces the loss, like walking downhill toward a valley.",
                        ),
                        block(
                            type="paragraph",
                            text="The learning rate controls the size of each step. Too large, and training can overshoot and never settle; too small, and training takes a very long time to converge.",
                        ),
                        block(
                            type="exercise",
                            text="If training loss is bouncing around wildly instead of steadily decreasing, what hyperparameter would you suspect first?",
                        ),
                        block(
                            type="takeaway",
                            text="Training a model is really just gradually reducing a loss function, one small step at a time.",
                        ),
                    ],
                },
                {
                    "title": "Regularization Techniques",
                    "objectives": [
                        "Explain why regularization helps prevent overfitting",
                        "Distinguish L1 and L2 regularization at a conceptual level",
                        "Understand dropout as a regularization idea for neural networks",
                    ],
                    "content": [
                        block(type="heading", text="Discouraging the Model from Overreacting"),
                        block(
                            type="paragraph",
                            text="Regularization adds a penalty for overly complex models, discouraging them from fitting noise in the training data.",
                        ),
                        block(
                            type="paragraph",
                            text="L2 regularization (ridge) shrinks all coefficients toward zero smoothly. L1 regularization (lasso) can shrink some coefficients all the way to exactly zero, effectively performing feature selection.",
                        ),
                        block(
                            type="paragraph",
                            text="Dropout, used in neural networks, randomly turns off a fraction of neurons during each training step — forcing the network to not rely too heavily on any single neuron, which reduces overfitting.",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "from sklearn.linear_model import Ridge\n"
                                "model = Ridge(alpha=1.0)\n"
                                "model.fit(X_train, y_train)"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="Why might L1 regularization be especially useful when you suspect only a few of your 100 features actually matter?",
                        ),
                        block(
                            type="takeaway",
                            text="Regularization trades a little training accuracy for a lot more generalization.",
                        ),
                    ],
                },
                {
                    "title": "Hyperparameter Tuning and Cross-Validation",
                    "objectives": [
                        "Distinguish parameters from hyperparameters",
                        "Explain k-fold cross-validation",
                        "Understand why tuning on the test set directly is a mistake",
                    ],
                    "content": [
                        block(type="heading", text="The Settings You Choose Before Training"),
                        block(
                            type="paragraph",
                            text="Parameters (like a linear model's coefficients) are learned automatically during training. Hyperparameters (like the learning rate, or the number of trees in a forest) are chosen by you before training starts.",
                        ),
                        block(
                            type="paragraph",
                            text="K-fold cross-validation splits the training data into k parts, trains on k-1 of them and validates on the remaining one, and repeats this k times — giving a more reliable estimate of performance than a single train/validation split.",
                        ),
                        block(
                            type="paragraph",
                            text="Tuning hyperparameters directly against the test set is a common mistake: it leaks information from the test set into your choices, making your final evaluation overly optimistic. Cross-validation (on a validation set, not the test set) avoids this.",
                        ),
                        block(
                            type="code",
                            language="python",
                            text=(
                                "from sklearn.model_selection import cross_val_score\n"
                                "scores = cross_val_score(model, X_train, y_train, cv=5)\n"
                                "print(scores.mean())"
                            ),
                        ),
                        block(
                            type="exercise",
                            text="Why does repeatedly tweaking your model based on test-set performance eventually make the test set no longer a fair, unbiased evaluation?",
                        ),
                        block(
                            type="takeaway",
                            text="Keep the test set untouched until the very end — use cross-validation to make tuning decisions instead.",
                        ),
                    ],
                },
            ],
            "quiz": [
                mcq(
                    "What does a loss function measure?",
                    [
                        "How far the model's predictions are from the true values",
                        "How many features the model uses",
                        "How long training takes",
                        "The size of the dataset",
                    ],
                    "How far the model's predictions are from the true values",
                    "The loss function quantifies prediction error, which training tries to minimize.",
                ),
                mcq(
                    "If the learning rate is set too high during gradient descent, what typically happens?",
                    [
                        "Training converges instantly with no risk",
                        "Training can overshoot and fail to settle",
                        "The loss function changes shape",
                        "The model automatically switches algorithms",
                    ],
                    "Training can overshoot and fail to settle",
                    "Steps that are too large can overshoot the minimum repeatedly instead of converging.",
                ),
                mcq(
                    "Which regularization technique can shrink some coefficients all the way to exactly zero?",
                    ["L2 (ridge)", "L1 (lasso)", "Dropout", "Cross-validation"],
                    "L1 (lasso)",
                    "L1 regularization can zero out coefficients entirely, effectively performing feature selection.",
                ),
                mcq(
                    "Why is it a mistake to tune hyperparameters directly against the test set?",
                    [
                        "It makes training slower",
                        "It leaks test-set information into your choices, biasing the final evaluation",
                        "The test set is usually too small to use",
                        "It's not actually a mistake",
                    ],
                    "It leaks test-set information into your choices, biasing the final evaluation",
                    "Repeatedly tuning against the test set makes your final performance estimate overly optimistic and unreliable.",
                ),
            ],
        },
        {
            "module_title": "Evaluation & Real-World ML",
            "lessons": [
                {
                    "title": "Evaluating Models & Where to Go Next",
                    "objectives": [
                        "Define accuracy, precision, and recall at a conceptual level",
                        "Understand why accuracy alone can be misleading",
                        "Identify a next-step learning path",
                    ],
                    "content": [
                        block(type="heading", text="Is the Model Actually Good?"),
                        block(
                            type="paragraph",
                            text="Accuracy is simply the percent of predictions the model got right.",
                        ),
                        block(
                            type="paragraph",
                            text="But accuracy can be misleading: a model that always predicts 'no disease' on a dataset where disease is rare can still be 99% accurate — while missing every real case. That's why precision and recall matter for imbalanced problems.",
                        ),
                        block(
                            type="exercise",
                            text="A model that always predicts 'not fraud' is 99.9% accurate on a dataset where fraud is rare — is it a good model? Why not?",
                        ),
                        block(
                            type="takeaway",
                            text="Choose your evaluation metric based on what mistakes actually cost you.",
                        ),
                    ],
                },
                {
                    "title": "Introduction to Neural Networks and Deep Learning",
                    "objectives": [
                        "Describe a neural network at a conceptual level",
                        "Explain what makes a network 'deep'",
                        "Recognize a few common deep learning applications",
                    ],
                    "content": [
                        block(type="heading", text="Layers of Simple Units"),
                        block(
                            type="paragraph",
                            text="A neural network is made of layers of simple units ('neurons') that each combine their inputs and pass the result through a nonlinear function, then feed forward to the next layer.",
                        ),
                        block(
                            type="paragraph",
                            text="A network is called 'deep' when it has many hidden layers stacked between the input and output. More layers let the network learn increasingly abstract features — early layers might detect edges in an image, later layers might detect whole objects.",
                        ),
                        block(
                            type="paragraph",
                            text="Deep learning powers many modern applications: image recognition (convolutional neural networks), language models (transformers), and speech recognition, among others.",
                        ),
                        block(
                            type="exercise",
                            text="Why might a deep network with many layers be more prone to overfitting than a simple linear model, and what technique from this course could help?",
                        ),
                        block(
                            type="takeaway",
                            text="Deep learning is a way of automatically learning layered, increasingly abstract features directly from raw data.",
                        ),
                    ],
                },
                {
                    "title": "ML in Production: Ethics, Bias, and Deployment",
                    "objectives": [
                        "Explain how bias can enter a model through its training data",
                        "Understand the basic idea of monitoring a deployed model",
                        "Recognize why ML systems need ongoing maintenance, not just a one-time launch",
                    ],
                    "content": [
                        block(type="heading", text="A Model Is Only as Fair as Its Data"),
                        block(
                            type="paragraph",
                            text="If historical data reflects past biases (e.g. biased hiring decisions), a model trained on it can learn and perpetuate those same biases — even without ever being told someone's protected characteristics directly.",
                        ),
                        block(
                            type="paragraph",
                            text="Once deployed, a model's performance can quietly degrade over time as real-world data drifts away from what it was trained on — this is called 'model drift,' and it's why production ML systems need ongoing monitoring, not a one-time launch and forget.",
                        ),
                        block(
                            type="paragraph",
                            text="Responsible ML practice includes auditing training data for bias, testing model performance across different subgroups, and having a plan to retrain or roll back when performance drifts.",
                        ),
                        block(
                            type="exercise",
                            text="Name one way bias could enter a resume-screening model, and one way you might detect it before deployment.",
                        ),
                        block(
                            type="takeaway",
                            text="Shipping a model is the beginning of its lifecycle, not the end — fairness and performance both need ongoing attention.",
                        ),
                    ],
                },
            ],
            "quiz": [
                mcq(
                    "Which metric would you prioritize when missing a positive case (e.g., a disease) is very costly?",
                    ["Accuracy", "Recall", "Training speed", "Number of features"],
                    "Recall",
                    "Recall measures how many actual positive cases were caught — critical when missing one is costly.",
                ),
                mcq(
                    "What makes a neural network 'deep'?",
                    [
                        "It uses a very large dataset",
                        "It has many hidden layers stacked between input and output",
                        "It only works on image data",
                        "It never overfits",
                    ],
                    "It has many hidden layers stacked between input and output",
                    "'Deep' refers to having many stacked hidden layers, which lets the network learn increasingly abstract features.",
                ),
                mcq(
                    "How can bias enter a machine learning model?",
                    [
                        "Only if a developer intentionally programs it in",
                        "Through biased patterns already present in the training data",
                        "Bias is impossible in ML systems",
                        "Only in unsupervised learning",
                    ],
                    "Through biased patterns already present in the training data",
                    "Models learn whatever patterns exist in their training data, including historical biases, even unintentionally.",
                ),
                mcq(
                    "Why do deployed ML models need ongoing monitoring?",
                    [
                        "Because model drift can cause performance to degrade as real-world data changes",
                        "Because models automatically delete themselves after a fixed time",
                        "Monitoring is only needed during training, not after deployment",
                        "Because cloud providers require it",
                    ],
                    "Because model drift can cause performance to degrade as real-world data changes",
                    "Real-world data can drift from the training distribution over time, quietly degrading a model's performance.",
                ),
            ],
        },
    ]

    modules: list[ModuleOutline] = []
    lessons: list[Lesson] = []

    for spec in lessons_spec:
        module_id = str(ObjectId())
        stubs: list[LessonStub] = []
        for lesson_spec in spec["lessons"]:
            lesson_id = str(ObjectId())
            stubs.append(LessonStub(id=lesson_id, title=lesson_spec["title"], is_enriched=True))
            lessons.append(
                Lesson(
                    id=lesson_id,
                    course_id="",
                    module_id=module_id,
                    title=lesson_spec["title"],
                    objectives=lesson_spec["objectives"],
                    content=lesson_spec["content"],
                    is_enriched=True,
                    auto_enriched=True,
                )
            )
        modules.append(
            ModuleOutline(
                id=module_id,
                title=spec["module_title"],
                lessons=stubs,
                quiz=spec["quiz"],
            )
        )

    course = Course(
        owner_id=PLATFORM_OWNER_ID,
        title="Introduction to Machine Learning",
        description=(
            "A full, beginner-friendly tour of machine learning — from core concepts and "
            "data/feature engineering through model fundamentals, training and optimization, "
            "and real-world evaluation, ethics, and deployment."
        ),
        tags=["machine-learning", "beginner"],
        level="beginner",
        modules=modules,
        is_platform=True,
        template_id=None,
    )
    return course, lessons


async def ensure_platform_template_exists() -> None:
    db = get_database()
    existing = await db[COLLECTION].find_one(
        {"owner_id": PLATFORM_OWNER_ID, "title": "Introduction to Machine Learning"}
    )
    if existing:
        return

    course, lessons = _ml_course_template()
    saved = await create_course(course)
    for lesson in lessons:
        lesson.course_id = saved.id
        await lesson_service.create_lesson(lesson)
