import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Register from './pages/RegisterPage'
import WorkoutPage from './pages/WorkoutPage'
import MealsPage from './pages/MealsPage'
import 'bootstrap/dist/css/bootstrap.min.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/workout" element={<WorkoutPage />} />
        <Route path="/meals" element={<MealsPage />} />
      </Routes>
    </Router>
  )
}

export default App
