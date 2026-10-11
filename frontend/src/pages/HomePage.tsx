import 'bootstrap/dist/css/bootstrap.min.css'

function HomePage() {
  return (
    <>
      <div className="container mt-5">
        <div className="row">
          <div className="col-12">
            <h1 className="mb-4">Home Page</h1>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Welcome to the Elective Web App</h5>
                <p className="card-text">
                  This is the public home page. Navigate to the login page to access protected content.
                </p>
                <a href="/login" className="btn btn-primary">
                  Go to Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HomePage
