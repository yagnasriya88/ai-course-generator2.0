import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import CourseList from './pages/CourseList'
import Course from './pages/Course'
import Lesson from './pages/Lesson'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<CourseList />} />
          <Route path="/course/:courseId" element={<Course />} />
          <Route path="/course/:courseId/lesson/:lessonId" element={<Lesson />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
