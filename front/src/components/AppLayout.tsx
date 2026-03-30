import { Link, NavLink, Outlet } from "react-router-dom"
import { useAuth } from "../authentication/useAuth"
import { useTranslation } from 'react-i18next'
import logo from "../assets/logo.png"
import { LanguageSelector } from "./LanguageSelector"

const navItems = [
  { to: "/", label: "Dashboard", icon: "⊞" },
  { to: "/games", label: "Library", icon: "📚" },
  { to: "/sessions/new", label: "Planner", icon: "📅" },
  { to: "/history", label: "History", icon: "⏳" }
]

export const AppLayout = () => {
  const { user } = useAuth()
  const { t, i18n } = useTranslation()


  return (
    <div className="layout">
      {/* Top Navigation for Desktop */}
      <header className="topbar">
        <Link to="/" className="brand">
          <img src={logo} alt="Friendv4 Logo" className="logo-img" />
          <span className="brand-text"></span>
        </Link>
        
        <nav className="nav desktop-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              {t(`nav.${item.label.toLowerCase()}`)}
            </NavLink>
          ))}
        </nav>
        
        <div className="topbar-actions">
          <LanguageSelector />
          <button className="icon-btn">🔔</button>
          <button className="icon-btn">⚙️</button>
          <div className="user-avatar" title={user?.displayName || "User"}>
            {user?.displayName?.charAt(0) || "U"}
          </div>
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="mobile-nav">
        {navItems.map((item) => (
          <NavLink key={`mobile-${item.to}`} to={item.to} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <span className="icon">{item.icon}</span>
            <span className="label">{t(`nav.${item.label.toLowerCase()}`)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
