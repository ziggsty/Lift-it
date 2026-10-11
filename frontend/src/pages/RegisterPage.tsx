import Register from '../components/Register'
import { userService } from '../services/api'

function RegisterPage() {
  const handleRegister = async (data: { name : string; email: string; password: string }) => {
    try {
      const newUser = await userService.createUser(data)
    console.log('User registered:', newUser)

      window.location.href = '/login';
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }
  return (
    <Register 
      onSubmit={handleRegister}
      title="Create Account"
      redirectPath="/login"
    />
  )
}

export default RegisterPage;