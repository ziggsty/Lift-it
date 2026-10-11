import { useState } from 'react'
import Navigation from '../components/Navigation'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Modal } from 'react-bootstrap'
import '../App.css'

function WorkoutPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  return (
    <>
      <div className="container-fluid py-3 px-5">
        <div className="row align-items-center">
          <div className="col-4">
            <h1 className="mb-0 bbh-bartle-regular">Workout</h1>
          </div>
          <div className="col-8">
            <div className="row">
              <Navigation />
            </div>
          </div>
        </div>
      </div>

      {/* Selected Card Display - Separate and Always Visible */}
      <div className="container mt-4">
        <div className="row ">

          <div className="col-6">
            <div className="card" style={{ height: '200px' }}>
              <div className="card-body ">
                <h6>Next Session</h6>
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="card" style={{ height: '200px' }}>
              <div className="card-body">
                <h6>Next Session</h6>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Plan Card */}
      <div className="container mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">

              {/* FIXED HEADER ROW: Keeps Workout and Button perfectly aligned */}
              <div className="row align-items-center mb-4">
                <div className="col">
                  <h3 className="m-0">Plan</h3>
                </div>
                <div className="col text-end">
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    Add Exercise
                  </button>
                </div>
              </div> {/* Correctly closes the header row */}

              {/* LOWER GRID: Changed col-4 to col-md-4 so they stack nicely on mobile instead of breaking */}
              <div className="row">

                {/* Upper Body Column */}
                <div className="col-md-4">
                  <div className="card mb-4" style={{ cursor: 'pointer' }} onClick={() => setSelectedCard('Upper Body')}>
                    <div className="card-body">
                      <h5 className="card-title mb-4">Upper Body</h5>
                      <p className="card-text">Card content goes here.</p>
                    </div>
                  </div>
                </div>

                {/* Lower Body Column 1 */}
                <div className="col-md-4">
                  <div className="card mb-4" style={{ cursor: 'pointer' }} onClick={() => setSelectedCard('Lower Body 1')}>
                    <div className="card-body">
                      <h5 className="card-title mb-4">Lower Body</h5>
                      <p className="card-text">Card content goes here.</p>
                    </div>
                  </div>
                </div>

                {/* Lower Body Column 2 */}
                <div className="col-md-4">
                  <div className="card mb-4" style={{ cursor: 'pointer' }} onClick={() => setSelectedCard('Lower Body 2')}>
                    <div className="card-body">
                      <h5 className="card-title mb-4">Lower Body</h5>
                      <p className="card-text">Card content goes here.</p>
                    </div>
                  </div>
                </div>

              </div> {/* Closes the exercises grid row */}

            </div>
          </div>
        </div>
      </div>

      <Modal show={showModal} size="lg" centered onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Exercise</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <div className="mb-3">
              <label htmlFor="exerciseName" className="form-label">Exercise Name</label>
              <input type="text" className="form-control" id="exerciseName" placeholder="e.g., Bench Press" />
            </div>
            <div className="row">
              <div className="col-md-3 mb-3">
                <label htmlFor="sets" className="form-label">Sets</label>
                <input type="number" className="form-control" id="sets" placeholder="3" />
              </div>
              <div className="col-md-3 mb-3">
                <label htmlFor="reps" className="form-label">Reps</label>
                <input type="number" className="form-control" id="reps" placeholder="10" />
              </div>
              <div className="col-md-3 mb-3">
                <label htmlFor="weight" className="form-label">Weight Lifted (lbs)</label>
                <input type="number" className="form-control" id="weight" placeholder="135" />
              </div>
              <div className="col-md-3 mb-3">
                <label htmlFor="duration" className="form-label">Duration (min)</label>
                <input type="number" className="form-control" id="duration" placeholder="30" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary mt-3">Add Exercise</button>
          </form>
        </Modal.Body>
      </Modal>

      <div className="container mt-5">
        <div className="card mb-3">
          <div className="card-header">
            <h2>History</h2>
          </div>
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-12">

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

}

export default WorkoutPage
