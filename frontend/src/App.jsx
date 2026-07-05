import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateCourse from './pages/CreateCourse'
import CourseList from './pages/CourseList'
import Course from './pages/Course'
import Lesson from './pages/Lesson'
import VideoDetail from './pages/VideoDetail'
import GenerationJobs from './pages/GenerationJobs'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateCourse />} />
          <Route path="/jobs" element={<GenerationJobs />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/course/:courseId" element={<Course />} />
          <Route path="/course/:courseId/lesson/:lessonId" element={<Lesson />} />
          <Route
            path="/course/:courseId/lesson/:lessonId/video/:videoIndex"
            element={<VideoDetail />}
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
