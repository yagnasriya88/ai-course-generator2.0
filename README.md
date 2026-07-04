# 📚 Text-to-Learn

**Turn a single prompt into a full, structured course** — modules, lessons, videos, an AI tutor, and quizzes that track real progress.

---

## ✨ Features

| | |
|---|---|
| 🧠 **AI-generated courses** | Describe any topic and a crew of AI agents plans modules and writes lessons for you |
| 🎥 **Rich lessons** | Every lesson is auto-enriched with embedded videos and visual aids |
| 💬 **AI tutor** | Ask questions about any lesson and get contextual answers on demand |
| 🇮🇳 **Hinglish mode** | Get lesson explanations in Hinglish for easier understanding |
| ✅ **Module quizzes** | Each module unlocks a quiz once its lessons are complete — pass at ≥70% |
| 📊 **Real progress tracking** | Blended lesson + quiz completion, tracked per course and per module |
| 🔐 **Auth built-in** | JWT-based signup/login — courses are private to your account |

---

## 🏗️ Tech Stack

**Frontend** — React 19 · React Router · Tailwind CSS 4 · Framer Motion · Vite

**Backend** — FastAPI · Motor (async MongoDB) · CrewAI · Pydantic

**LLMs** — OpenAI or Gemini (configurable) for course/lesson generation · Gemini for video discovery & Hinglish narration

**Database** — MongoDB

---

## 🏛️ Architecture

```mermaid
flowchart TD
    Client["🖥️ React SPA<br/>frontend/src<br/><sub>Vite · Tailwind · Router · AuthContext</sub>"]

    Client -- "HTTPS · JSON<br/>Bearer JWT" --> Gateway

    Gateway["🚪 FastAPI Gateway<br/>backend/app/main.py<br/><sub>/auth · /courses · /lessons</sub>"]

    Gateway -- "function calls" --> Services

    Services["⚙️ Service Layer<br/>backend/app/services<br/><sub>auth · course · lesson · generation · enrichment</sub>"]

    Services --> Mongo
    Services --> Agents

    Mongo["🗄️ MongoDB<br/><sub>via Motor · users · courses</sub>"]

    Agents["🤖 CrewAI Agent Crew<br/>backend/app/agents<br/><sub>planner · module · quiz · tutor · hinglish · video</sub>"]

    Agents -- "LLM_PROVIDER switch" --> OpenAI
    Agents -- "always on" --> Gemini

    OpenAI["🧠 OpenAI<br/><sub>gpt-4o-mini — course &amp; lesson text</sub>"]
    Gemini["🎬 Gemini<br/><sub>video discovery · visual aids · Hinglish TTS</sub>"]

    classDef client fill:#2563eb,color:#fff,stroke:#1d4ed8;
    classDef server fill:#eef2ff,color:#1e293b,stroke:#c7d2fe;
    classDef data fill:#ecfdf5,color:#065f46,stroke:#a7f3d0;
    classDef external fill:#fffbeb,color:#92400e,stroke:#fcd34d,stroke-dasharray: 4 3;

    class Client client
    class Gateway,Services,Agents server
    class Mongo data
    class OpenAI,Gemini external
```

*Dashed nodes leave our infrastructure and call third-party APIs.*

---

## 🚀 Getting Started

### 1. Start MongoDB

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in GEMINI_API_KEY / OPENAI_API_KEY / JWT_SECRET
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** 🎉

---

## 📁 Project Structure

```
backend/
  app/
    agents/      # CrewAI agents — course planning, lessons, quizzes, tutor, videos
    routes/       # FastAPI endpoints (auth, courses, lessons)
    services/     # Business logic + MongoDB access
    models/       # Pydantic schemas
frontend/
  src/
    pages/        # Route-level views (Home, Course, Lesson, Login, Signup...)
    components/   # Reusable UI (Sidebar, QuizPanel, panels, blocks...)
    context/       # Auth context
    utils/        # API client, progress calculations
```

---

## 🔑 Environment Variables

See [`backend/.env.example`](backend/.env.example) — requires a `GEMINI_API_KEY` at minimum, plus `OPENAI_API_KEY` if using OpenAI for course generation (`LLM_PROVIDER=openai`, the default).
