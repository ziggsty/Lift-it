import Login from '../components/Login'
import { loginUser } from '../services/api'

function LoginPage() {
  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const data = await loginUser(credentials)
      console.log('Login successful:', data)

      localStorage.setItem('user', JSON.stringify(data))
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  return (
    <Login
      onLogin={handleLogin}
      title="Welcome Back"
      redirectPath="/dashboard"
    />
  )
}

export default LoginPage
