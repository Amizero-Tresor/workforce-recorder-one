'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useRouter, usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Clock,
  Users,
  FolderOpen,
  LogOut,
  Search,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import Image from 'next/image';
import amoLogo from '@/assets/amoLogo.jpg';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWorker = user?.role === 'WORKER';
  const isAdmin =
    user?.role === 'COMPANY_ADMIN' || user?.role === 'CORPORATE_ADMIN';

  const workerNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Clock, label: 'Time Log', href: '/time-log' },
    { icon: FolderOpen, label: 'Projects', href: '/projects' },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Clock, label: 'Time Log', href: '/admin/time-logs' },
    { icon: Users, label: 'Staff', href: '/admin/workers' },
    { icon: FolderOpen, label: 'Projects', href: '/admin/projects' },
  ];

  const navItems = isWorker ? workerNavItems : adminNavItems;

  const handleNavigation = (href: string) => {
    router.push(href);
    setIsMobileOpen(false); // Close mobile menu after navigation
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  // Don't render theme-dependent classes until mounted
  if (!mounted) {
    return (
      <div className="fixed lg:static inset-y-0 left-0 z-50 w-64 border-r flex flex-col transform transition-all duration-300 ease-in-out bg-white border-gray-200 -translate-x-full lg:translate-x-0">
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12">
              <Image
                src={amoLogo}
                alt="AMO Logo"
                className="w-full h-full object-contain"
                sizes="(max-width: 768px) 40px, 48px"
              />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-gray-900">AMO</h2>
              <p className="text-xs text-gray-500">Workforce Manager</p>
            </div>
          </div>
        </div>
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200">
          <h2 className="font-semibold text-sm lg:text-base text-gray-900">
            {isWorker ? 'Staff Dashboard' : 'Admin Dashboard'}
          </h2>
        </div>
        <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1 overflow-y-auto">
          {/* Loading skeleton */}
        </nav>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-[#171717] rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 border-r flex flex-col transform transition-all duration-300 ease-in-out',
          'bg-white dark:bg-[#171717] border-gray-200 dark:border-gray-700',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12">
              <Image
                src={amoLogo}
                alt="AMO Logo"
                className="w-full h-full object-contain"
                sizes="(max-width: 768px) 40px, 48px"
              />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                AMO
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Workforce Manager
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Title */}
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white">
            {isWorker ? 'Staff Dashboard' : 'Admin Dashboard'}
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 lg:px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  'w-full flex items-center space-x-3 px-3 py-2.5 lg:py-3 rounded-lg text-left transition-all duration-200 text-sm lg:text-base',
                  isActive
                    ? 'bg-[#008080] text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <item.icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-3 lg:p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-700 dark:text-white">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === 'WORKER' ? 'Staff' : 'Admin'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200 flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
