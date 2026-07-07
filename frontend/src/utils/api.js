const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Clerk session tokens expire in ~60s, so we can't cache one — this holds a
// `getToken` function (from Clerk's useAuth()) that AuthContext wires up on
// sign-in, and every request calls it fresh. Clerk's SDK internally caches
// and silently refreshes the underlying token, so calling it per-request is
// cheap.
let tokenGetter = null

export function setTokenGetter(fn) {
  tokenGetter = fn
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  const token = tokenGetter ? await tokenGetter() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...options,
    headers,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message =
      typeof body?.detail === 'string'
        ? body.detail
        : body?.detail
          ? JSON.stringify(body.detail)
          : `Request failed: ${res.status} ${res.statusText}`
    const error = new Error(message)
    // Attaches the raw error body (e.g. guardrail rejections' reason/suggestion/
    // suggested_type) for callers that need more than the flattened message —
    // existing catch blocks that only read err.message are unaffected.
    error.body = body
    throw error
  }
  return res.status === 204 ? null : res.json()
}

// Auth — sign-in/sign-up itself is handled by Clerk; this just resolves the
// authenticated Clerk session to (or creates) our own user profile.
export const getMe = () => request('/auth/me')

export const exportMyData = () => request('/auth/me/export')

// Courses
// Course generation runs on a persistent job queue (can take a minute+) —
// this only enqueues the request and returns the job immediately; poll
// getGenerationJob(job._id) for status instead of waiting on this call.
export const generateCourse = (payload) =>
  request('/courses/generate', { method: 'POST', body: JSON.stringify(payload) })

export const getGenerationJob = (jobId) => request(`/courses/jobs/${jobId}`)

export const listCourses = () => request('/courses')

export const getDashboard = () => request('/dashboard')

export const listQuizzes = () => request('/courses/quizzes')

export const getCourse = (courseId) => request(`/courses/${courseId}`)

// Lessons — GET auto-enriches (quiz/videos/visuals) on first view server-side
export const getLesson = (lessonId) => request(`/lessons/${lessonId}`)

export const getModuleQuiz = (courseId, moduleId) =>
  request(`/courses/${courseId}/modules/${moduleId}/quiz`, { method: 'POST' })

export const submitModuleQuiz = (courseId, moduleId, answers) =>
  request(`/courses/${courseId}/modules/${moduleId}/quiz/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  })

export const generateVisuals = (lessonId) =>
  request(`/lessons/${lessonId}/visuals/generate`, { method: 'POST' })

export const discoverVideos = (lessonId) =>
  request(`/lessons/${lessonId}/videos/discover`, { method: 'POST' })

export const getVideoNotes = (lessonId, videoUrl) =>
  request(`/lessons/${lessonId}/videos/notes`, {
    method: 'POST',
    body: JSON.stringify({ video_url: videoUrl }),
  })

export const askAboutVideo = (lessonId, videoUrl, question) =>
  request(`/lessons/${lessonId}/videos/ask`, {
    method: 'POST',
    body: JSON.stringify({ video_url: videoUrl, question }),
  })

export const generateHinglish = (lessonId) =>
  request(`/lessons/${lessonId}/hinglish`, { method: 'POST' })

export const askTutor = (lessonId, question) =>
  request(`/lessons/${lessonId}/tutor/ask`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  })

export const askGeneralChat = (question) =>
  request('/chat/ask', { method: 'POST', body: JSON.stringify({ question }) })

export const setLessonCompleted = (lessonId, completed) =>
  request(`/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ completed }),
  })

// Knowledge Canvas — diagram generation runs on the same style of persistent
// job queue as course generation; enqueue-then-poll instead of waiting inline.
export const generateDiagram = (payload) =>
  request('/diagrams/generate', { method: 'POST', body: JSON.stringify(payload) })

export const getDiagramJob = (jobId) => request(`/diagrams/jobs/${jobId}`)

export const listDiagramJobs = () => request('/diagrams/jobs')

export const listDiagrams = () => request('/diagrams')

export const getDiagram = (diagramId) => request(`/diagrams/${diagramId}`)

export const updateDiagram = (diagramId, payload) =>
  request(`/diagrams/${diagramId}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteDiagram = (diagramId) => request(`/diagrams/${diagramId}`, { method: 'DELETE' })

export const duplicateDiagram = (diagramId) =>
  request(`/diagrams/${diagramId}/duplicate`, { method: 'POST' })

export const aiEditDiagram = (diagramId, instruction) =>
  request(`/diagrams/${diagramId}/ai-edit`, {
    method: 'POST',
    body: JSON.stringify({ instruction }),
  })

export { API_BASE_URL, request }
