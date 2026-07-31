import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">Attendance Manager</div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        {user.role === 'admin' && (
          <>
            <Link to="/admin/departments">Departments</Link>
            <Link to="/admin/employees">Employees</Link>
            <Link to="/admin/attendance">Attendance Report</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <span>
          {user.name} <em>({user.role})</em>
        </span>
        <button onClick={handleLogout}>Log out</button>
      </div>
    </nav>
  );
}
