import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useActivityPing } from '../hooks/useActivityPing';

export function Layout() {
  const { logout } = useAuth();
  useActivityPing();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__dot" aria-hidden="true" />
          Docker Dashboard
        </div>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Containers
          </NavLink>
          <NavLink to="/images" className={({ isActive }) => (isActive ? 'active' : '')}>
            Images
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            Admin
          </NavLink>
        </nav>
        <div className="app-header__session">
          <button className="btn btn--ghost" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
