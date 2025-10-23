import { Link, NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../authentication/useAuth"

const navItems = [
  { to: "/", label: "Tableau de bord" },
  { to: "/sessions/new", label: "Nouvelle session" },
  { to: "/games", label: "Ludotheque" }
]

export const AppLayout = () => {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <aside className="sidebar">
        <Link to="/" className="brand">
          BGS
        </Link>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <p className="user-name">{user?.displayName}</p>
            <p className="user-email">{user?.email}</p>
          </div>
          <button type="button" className="btn secondary" onClick={logout}>
            Deconnexion
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
