import { useState } from 'react'
import Navigation from '../components/Navigation'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Modal } from 'react-bootstrap'

function MealsPage() {
    const [showModal, setShowModal] = useState(false)
    return (
        <>
            <div className="container-fluid py-3 px-5">
                <div className="row align-items-center">
                    <div className="col-4">
                        <h1 className="mb-0 bbh-bartle-regular">Meal</h1>
                    </div>
                    <div className="col-8">
                        <div className="row">
                            <Navigation />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mt-4">
                <div className="row">

                    <div className="col-4">
                        <div className="card" style={{ height: '200px' }}>
                            <div className="card-body">
                                <h1>Calorie</h1>
                            </div>
                        </div>
                    </div>

                    <div className="col-4">
                        <div className="card" style={{ height: '200px' }}>
                            <div className="card-body">
                                <h1>Protein</h1>
                            </div>
                        </div>
                    </div>

                    <div className="col-4">
                        <div className="card" style={{ height: '200px' }}>
                            <div className="card-body">
                                <h1>Carbohydrate</h1>
                            </div>
                        </div>
                    </div>

                </div>
            </div>


            <div className="container mt-4">
                <div className="card" style={{ height: '200px' }}>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-6">
                                <h1>Meal Diary</h1>
                            </div>
                            <div className="col-6">
                                <button className="btn btn-primary" onClick={() => setShowModal(true)}>Log Meal</button>
                            </div>
                            <div className="row">

                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={showModal} size="lg" centered onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Meal</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="col-12">
                            <input type="text" className="form-control" placeholder="Search meals..." />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="mealName" className="form-label">Meal Name</label>
                            <input type="text" className="form-control" id="mealName" placeholder="e.g., Grilled Chicken Salad" />
                        </div>
                        <div className="mb-3">
                            <label htmlFor="mealType" className="form-label">Meal Type</label>
                            <select className="form-select" id="mealType">
                                <option value="">Select meal type</option>
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snack">Snack</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary mt-3">Add Meal</button>
                    </form>
                </Modal.Body>
            </Modal>
        </>
    )
}

export default MealsPage