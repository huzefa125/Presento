import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import {
  LayoutDashboard, Users, Building2, DollarSign, TrendingUp, Presentation,
  Activity, List, Settings, Briefcase, FileText, Menu, X as XIcon, LogOut, Bell, MessageSquare, UserPlus
} from 'lucide-react';

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Navigation items with routes
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/super-admin' },
    { id: 'users', label: 'Users', icon: Users, path: '/super-admin/users' },
    { id: 'add-user', label: 'Add User', icon: UserPlus, path: '/super-admin/add-user' },
    { id: 'institutions', label: 'Institutions', icon: Building2, path: '/super-admin/institutions' },
    { id: 'payments', label: 'Payments', icon: DollarSign, path: '/super-admin/payments' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: '/super-admin/analytics' },
    { id: 'presentations', label: 'Presentations', icon: Presentation, path: '/super-admin/presentations' },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare, path: '/super-admin/testimonials' },
    { id: 'system', label: 'System', icon: Activity, path: '/super-admin/system' },
    { id: 'activity', label: 'Activity Logs', icon: List, path: '/super-admin/activity' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/super-admin/settings' },
    { id: 'jobs', label: 'Job Postings', icon: Briefcase, path: '/super-admin/jobs' },
    { id: 'applications', label: 'Applications', icon: FileText, path: '/super-admin/applications' }
  ];

  useEffect(() => {
    const token = sessionStorage.getItem('superAdminToken');
    if (token) {
      verifyToken(token);
    } else {
      navigate('/super-admin/login', { replace: true });
    }
  }, [navigate]);

  const verifyToken = async (token) => {
    try {
      const response = await api.get('/super-admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem('superAdminToken');
        setIsAuthenticated(false);
        navigate('/super-admin/login', { replace: true });
      }
    } catch (error) {
      sessionStorage.removeItem('superAdminToken');
      setIsAuthenticated(false);
      navigate('/super-admin/login', { replace: true });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('superAdminToken');
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/super-admin/login', { replace: true });
  };

  const currentPath = location.pathname;
  const activeItem = navItems.find(item => {
    if (item.path === '/super-admin') {
      return currentPath === '/super-admin' || currentPath === '/super-admin/';
    }
    return currentPath === item.path || currentPath.startsWith(item.path + '/');
  }) || navItems[0];

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-canvas-soft text-ink font-sans">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50
        w-64 bg-canvas border-r border-hairline
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Logo */}
          <div className="p-6 border-b border-hairline">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-[var(--shadow-level-1)]">
                  <span className="text-xl font-bold text-on-primary">𝑖</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-ink">
                    Presento
                  </h1>
                  <p className="text-xs text-ink-faint">Super Admin</p>
                </div>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-canvas-soft text-ink-muted rounded-md"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 sidebar-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path ||
                (item.path !== '/super-admin' && currentPath.startsWith(item.path));
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-md border-l-2
                    transition-all duration-200
                    ${isActive
                      ? 'bg-canvas-soft text-primary border-primary font-semibold'
                      : 'border-transparent text-ink-muted hover:text-ink hover:bg-canvas-soft'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-hairline">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-soft transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex flex-col min-w-0 lg:ml-64 min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-xl border-b border-hairline flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 hover:bg-canvas-soft text-ink-muted rounded-md"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hidden lg:block p-2 hover:bg-canvas-soft text-ink-muted rounded-md"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-ink">
                    {activeItem.label}
                  </h2>
                  <p className="text-sm text-ink-muted">Manage your platform</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {notifications.length > 0 && (
                  <button className="relative p-2 hover:bg-canvas-soft text-ink-muted rounded-md">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent-pink rounded-full" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-canvas-soft min-h-0">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;

