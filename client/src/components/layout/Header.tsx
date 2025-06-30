'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Bell, User, LogOut, Lock, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Dropdown } from '@/components/ui/Dropdown';
import { PasswordChangeModal } from '@/components/ui/PasswordChangeModal';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Show password change modal for first login
      if (user.isFirstLogin) {
        setShowPasswordModal(true);
      }
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  return (
    <>
      <header className="bg-white dark:bg-[#171717] border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Role badge and title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <div className="bg-gray-400 dark:bg-gray-600 text-white px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-medium inline-block">
              {user?.role === 'WORKER'
                ? 'Staff'
                : user?.role === 'COMPANY_ADMIN'
                ? 'Company Admin'
                : 'Corporate Admin'}
            </div>
            <h1 className="text-lg lg:text-2xl font-semibold text-gray-900 dark:text-white truncate">
              {user?.role === 'WORKER' ? 'Staff Dashboard' : 'Admin Dashboard'}
            </h1>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Theme Toggle - only render after mount to prevent hydration mismatch */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-1.5 lg:p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors duration-200"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <Dropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                className="right-0 mt-2 w-72 lg:w-80 bg-white dark:bg-[#171717] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                          !notification.isRead
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                      >
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </Dropdown>
            </div>

            {/* User Profile */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <User className="w-3 h-3 lg:w-5 lg:h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32 lg:max-w-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === 'WORKER'
                    ? 'Staff'
                    : user?.role === 'COMPANY_ADMIN'
                    ? 'Company Admin'
                    : 'Corporate Admin'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-1 lg:space-x-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="p-1.5 lg:p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title="Change Password"
              >
                <Lock className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="p-1.5 lg:p-2 text-gray-400 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        isFirstLogin={user?.isFirstLogin}
      />
    </>
  );
}
