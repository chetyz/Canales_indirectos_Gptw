import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  Users,
  Plus
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    ...(!isAdmin ? [{ to: '/create-lead', icon: Plus, label: 'Crear Lead' }] : []),
    { to: '/notifications', icon: Bell, label: 'Notificaciones' },
    { to: '/profile', icon: User, label: 'Perfil' },
    ...(isAdmin ? [{ to: '/admin', icon: Settings, label: 'Panel Admin' }] : [])
  ];

  return (
    <div className="min-h-screen fade-in">
      {/* Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="navbar-brand">
              <div className="navbar-logo">
                GPW
              </div>
              <h1 className="navbar-title">
                Great Place to Work
              </h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">{user?.firstName} {user?.lastName}</span>
                {isAdmin && (
                  <span className="ml-2 badge badge-admin">
                    Admin
                  </span>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="nav-link hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-t">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-link flex-col text-center ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-8">
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;