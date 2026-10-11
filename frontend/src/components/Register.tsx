import { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

interface RegisterProps {
    onSubmit?: (data: { name: string; email: string; password: string }) => void
    title?: string
    redirectPath?: string

}


function Register({ onSubmit, title = 'Register' }: RegisterProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            if (onSubmit) {
                await onSubmit({ name, email, password })
            }
        } catch (err) {
            setError('Registration failed')
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="col-md-6 col-lg-4">
                <div className="card shadow">
                    <div className="card-body p-4">
                        <h2 className="card-title text-center mb-4">{title}</h2>

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}

                    <form onSubmit={handleSubmit}>    
                        <div className="mb-3">
                            <label htmlFor="name" className="form-label">Name</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Enter your name"
                            />
                        </div>
                        
                        
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    className="form-control"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="password" className="form-label">
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
                                />
                            </div>
                        
                            <button
                                type="submit"
                                className="btn btn-primary w-100"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Registering...' : 'Register'}
                            </button>
                        </form>


                        <div className="mt-3 text-center">
                            <span className="text-muted">Already have an account? </span>
                            <a href="/login" className="text-decoration-none">
                                Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register;