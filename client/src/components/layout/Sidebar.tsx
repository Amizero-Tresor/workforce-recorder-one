'use client';

import { useState } from 'react';
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
  X
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

  const isWorker = user?.role === 'WORKER';
  const isAdmin = user?.role === 'COMPANY_ADMIN' || user?.role === 'CORPORATE_ADMIN';

  const workerNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Clock, label: 'Time Log', href: '/time-log' },
    { icon: FolderOpen, label: 'Projects', href: '/projects' },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: Clock, label: 'Time Log', href: '/admin/time-logs' },
    { icon: Users, label: 'Workers', href: '/admin/workers' },
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
      <div className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 border-r flex flex-col transform transition-all duration-300 ease-in-out',
        theme === 'dark' 
          ? 'bg-[#171717] border-gray-700' 
          : 'bg-white border-gray-200',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        className
      )}>
        {/* Header */}
        <div className={cn(
          'p-4 lg:p-6 border-b',
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        )}>
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
              <h2 className={cn(
                'text-lg font-bold',
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              )}>
                AMO
              </h2>
              <p className={cn(
                'text-xs',
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              )}>
                Workforce Manager
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Title */}
        <div className={cn(
          'px-4 lg:px-6 py-3 lg:py-4 border-b',
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        )}>
          <h2 className={cn(
            'font-semibold text-sm lg:text-base',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {isWorker ? 'Worker Dashboard' : 'Admin Dashboard'}
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
                    : theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={cn(
          'p-3 lg:p-4 border-t',
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                theme === 'dark' ? 'bg-gray-600' : 'bg-gray-300'
              )}>
                <span className={cn(
                  'text-xs font-medium',
                  theme === 'dark' ? 'text-white' : 'text-gray-700'
                )}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs lg:text-sm font-medium truncate',
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                )}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className={cn(
                  'text-xs truncate',
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                )}>
                  {user?.role === 'WORKER' ? 'Worker' : 'Admin'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className={cn(
                'p-1.5 flex-shrink-0 rounded-full transition-colors duration-200',
                theme === 'dark' 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
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