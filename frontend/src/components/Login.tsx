
import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import Carousel from 'react-bootstrap/Carousel'
import '../App.css'

interface LoginProps {
  onLogin?: (credentials: { email: string; password: string }) => void
  title?: string
  redirectPath?: string
  showRememberMe?: boolean
  showForgotPassword?: boolean
  customFields?: React.ReactNode
}

function Login({
  onLogin,
  title = 'Login',
  redirectPath = '/dashboard',
  showRememberMe = true,
  showForgotPassword = true,
  customFields
}: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (onLogin) {
        await onLogin({ email, password })
      } else {
        console.log('Login credentials:', { email, password, rememberMe })
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="position-relative vh-100 overflow-hidden">
      <Carousel
        fade
        interval={3000}
        controls={false}
        indicators={false}
        className="vh-100"
      >
        <Carousel.Item>
          <img
            className="d-block w-100 vh-100 object-fit-cover"
            src="/src/assets/Image4.jpg"
            alt="First slide"
          />
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100 vh-100 object-fit-cover"
            src="/src/assets/Image1.jpg"
            alt="Second slide"
          />
        </Carousel.Item>
        <Carousel.Item>
          <img
            className="d-block w-100 vh-100 object-fit-cover"
            src="/src/assets/Image3.jpg"
            alt="Third slide"
          />
        </Carousel.Item>
      </Carousel>

      <div className="position-fixed top-50 start-0 w-100 translate-middle-y" style={{ zIndex: 10 }}>
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h1 className="bbh-bartle-regular" style={{ color: '#d4980c', fontWeight: 'bold', fontSize: '3rem' }}>Consistency</h1>
              <p className="bbh-bartle-regular" style={{ color: '#d4980c', fontSize: '1.2rem' }}>builds results.</p>
            </div>
            <div className="col-md-6">
              <div className="card shadow bg-gray-900 bg-opacity-30" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.15)', maxWidth: '500px', margin: '0 auto' }}>
                <div className="card-body p-4">
                  <h2 className="card-title text-center mb-4" style={{ color: '#fff' }}>{title}</h2>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="email" className="form-label" style={{ color: '#fff' }}>
                        Email address
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Example@example.com"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          color: '#fff'
                        }}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="password" className="form-label" style={{ color: '#fff' }}>
                        Password
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          color: '#fff'
                        }}
                      />
                    </div>

                    {customFields && <div className="mb-3">{customFields}</div>}

                    {showRememberMe && (
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                            color: '#fff'
                          }}
                        />
                        <label className="form-check-label" htmlFor="rememberMe" style={{ color: '#fff' }}>
                          Remember me
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn w-100"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: '#fff'
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                  </form>

                  {showForgotPassword && (
                    <div className="mt-3 text-center">
                      <a href="/forgot-password" className="text-decoration-none" style={{ color: '#fff' }}>
                        Forgot password?
                      </a>
                    </div>
                  )}

                  <div className="mt-3 text-center">
                    <span className="" style={{ color: '#fff' }}>Don't have an account? </span>
                    <a href="/register" className="text-decoration-none" style={{ color: '#fff' }}>
                      Register
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
