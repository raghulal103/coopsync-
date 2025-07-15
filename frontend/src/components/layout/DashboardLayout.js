import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiFolder,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiTrendingUp,
  FiShield,
  FiBox,
  FiTrash2,
  FiGift,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiBell,
  FiUser
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTenant } from '../../context/TenantContext';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { current: tenant } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: FiHome },
    { name: 'Users', href: '/dashboard/users', icon: FiUsers },
    { name: 'Roles', href: '/dashboard/roles', icon: FiShield },
    { name: 'Projects', href: '/dashboard/projects', icon: FiFolder },
    { name: 'Tasks', href: '/dashboard/tasks', icon: FiClock },
    { name: 'Labour', href: '/dashboard/labour', icon: FiUsers },
    { name: 'Attendance', href: '/dashboard/attendance', icon: FiClock },
    { name: 'Payroll', href: '/dashboard/payroll', icon: FiDollarSign },
    { name: 'Accounts', href: '/dashboard/accounts', icon: FiFileText },
    { name: 'Transactions', href: '/dashboard/transactions', icon: FiTrendingUp },
    { name: 'GST', href: '/dashboard/gst', icon: FiFileText },
    { name: 'Assets', href: '/dashboard/assets', icon: FiBox },
    { name: 'Scrap', href: '/dashboard/scrap', icon: FiTrash2 },
    { name: 'Dividends', href: '/dashboard/dividends', icon: FiGift },
    { name: 'Audit', href: '/dashboard/audit', icon: FiShield },
    { name: 'Settings', href: '/dashboard/settings', icon: FiSettings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const isActive = (href) => {
    return location.pathname === href || (href !== '/dashboard' && location.pathname.startsWith(href));
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-primary-600">
          <h1 className="text-white text-lg font-semibold">
            {tenant?.name || 'Cooperative ERP'}
          </h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white lg:hidden"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-700 lg:hidden"
                >
                  <FiMenu className="h-6 w-6" />
                </button>
                <h2 className="ml-4 text-xl font-semibold text-gray-900 lg:ml-0">
                  {navigation.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h2>
              </div>

              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg"
                >
                  {theme === 'light' ? <FiMoon className="h-5 w-5" /> : <FiSun className="h-5 w-5" />}
                </button>

                {/* Notifications */}
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg relative">
                  <FiBell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="relative">
                  <button className="flex items-center text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <FiUser className="h-4 w-4 text-white" />
                    </div>
                    <span className="ml-2 text-gray-700 font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                  </button>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-lg"
                  title="Logout"
                >
                  <FiLogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;