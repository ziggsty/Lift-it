import { NavLink } from 'react-router-dom'
import '../App.css'
 
const navItems = [
  { label: 'Home', path: '/dashboard' },
  { label: 'Workout', path: '/workout' },
  { label: 'Meals', path: '/meals' },
  { label: 'Login', path: '/login' }
]
 
function Navigation() {
  return (
    <ul className="nav nav-underline justify-content-end">
      {navItems.map((item) => (
        <li className="nav-item" key={item.path}>
          <NavLink to={item.path} className="nav-link text-dark">
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
 
export default Navigation