import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import ProtectedRoute from './components/ProtectedRoute'

// Route-level code splitting: each page (and everything it imports — Lesson.jsx's
// diagram/math rendering chain alone pulls in mermaid+d3+katex, ~1.3MB) previously
// loaded as one eager bundle on every visit, even to /login. Lazy-loading means a
// page's dependencies are only fetched once someone actually navigates there.
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const SsoCallback = lazy(() => import('./pages/SsoCallback'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CreateCourse = lazy(() => import('./pages/CreateCourse'))
const CourseList = lazy(() => import('./pages/CourseList'))
const Course = lazy(() => import('./pages/Course'))
const Lesson = lazy(() => import('./pages/Lesson'))
const VideoDetail = lazy(() => import('./pages/VideoDetail'))
const KnowledgeCanvas = lazy(() => import('./pages/KnowledgeCanvas'))
const GenerateDiagram = lazy(() => import('./pages/GenerateDiagram'))
const DiagramList = lazy(() => import('./pages/DiagramList'))
const DiagramEditor = lazy(() => import('./pages/DiagramEditor'))

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/sso-callback" element={<SsoCallback />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateCourse />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/course/:courseId" element={<Course />} />
            <Route path="/course/:courseId/lesson/:lessonId" element={<Lesson />} />
            <Route
              path="/course/:courseId/lesson/:lessonId/video/:videoIndex"
              element={<VideoDetail />}
            />
            <Route path="/canvas" element={<KnowledgeCanvas />} />
            <Route path="/canvas/:diagramType" element={<GenerateDiagram />} />
            <Route path="/diagrams" element={<DiagramList />} />
            <Route path="/diagram/:diagramId" element={<DiagramEditor />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
