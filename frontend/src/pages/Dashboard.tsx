import { useEffect, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import { userService, type User } from '../services/api'
import Navigation from '../components/Navigation'
import { Carousel } from 'react-bootstrap'
import '../App.css'

function Dashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userService.getUsers()
        setUsers(data)
      } catch (err) {
        setError('Failed to load users')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <>
      <div className="container-fluid py-3 px-5">
        <div className="row align-items-center">
          <div className="col-4">
            <h1 className="mb-0 bbh-bartle-regular">Dashboard</h1>
          </div>
          <div className="col-8">
            <div className="row">
              <Navigation />
            </div>
          </div>
        </div>
      </div>

      <div className="container mt-3">
        <div className="row">
          <div className="col-12">
            <p className="mb-0 finlandica-text-regular text-muted">{currentDate}</p>
            <h5 className="card-title finlandica-text-regular">Welcome, {currentUser.name || 'User'}!</h5>

            <div className="card mb-4">
              <div className="card-body">
                <Carousel interval={3000} controls={false}>
                  <Carousel.Item>
                    <div className="p-4 text-center bg-primary text-white rounded" style={{ height: '280px' }}>
                      <h3>Weekly Performance</h3>

                    </div>
                  </Carousel.Item>
                  <Carousel.Item>
                    <div className="p-4 text-center bg-primary text-white rounded" style={{ height: '280px' }}>
                      <h3>Workout</h3>
                      <p>Track your workouts and stay fit with our exercise tracking system.</p>
                    </div>
                  </Carousel.Item>
                  <Carousel.Item>
                    <div className="p-4 text-center bg-primary text-white rounded" style={{ height: '280px' }}>
                      <h3>Meals</h3>
                      <p>Log your meals and maintain a healthy diet.</p>
                    </div>
                  </Carousel.Item>
                </Carousel>
              </div>
            </div>

            <div className="row">
              <div className="col-6">
                <div className="card mb-4">
                  <div className="card-body">

                    <h5 className="card-title mb-4">Daily Performance</h5>
                    <p className="card-text">Card content goes here.</p>
                  </div>
                </div>
              </div>


              <div className="col-6">
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="card-title mb-4">Nutrition Summary</h5>
                    <p className="card-text">Card content goes here.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card mb-4">
              <div className="card-body">
                <h5 className="card-title mb-4">Target Progress</h5>
                <p className="card-text">Card content goes here.</p>
              </div>
            </div>


          </div>
        </div>
      </div>
    </>
  )
}

export default Dashboard
