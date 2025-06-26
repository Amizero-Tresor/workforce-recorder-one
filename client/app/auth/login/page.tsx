'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
    } catch (error) {
      // Error is handled in the login function
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Floating Geometric Shapes */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-white/20 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-white/15 rotate-45 animate-bounce delay-700"></div>
        <div className="absolute bottom-32 left-40 w-3 h-3 bg-white/25 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 right-20 w-5 h-5 bg-white/20 rotate-45 animate-bounce delay-500"></div>
        
        {/* Network Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <line x1="50" y1="100" x2="150" y2="80" stroke="url(#lineGradient)" strokeWidth="2" className="animate-pulse" />
          <line x1="150" y1="80" x2="250" y2="120" stroke="url(#lineGradient)" strokeWidth="2" className="animate-pulse delay-300" />
          <line x1="100" y1="200" x2="200" y2="180" stroke="url(#lineGradient)" strokeWidth="2" className="animate-pulse delay-600" />
          <line x1="200" y1="180" x2="300" y2="220" stroke="url(#lineGradient)" strokeWidth="2" className="animate-pulse delay-900" />
          <line x1="80" y1="300" x2="180" y2="280" stroke="url(#lineGradient)" strokeWidth="2" className="animate-pulse delay-1200" />
        </svg>
      </div>

      <div className="relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 dark:border-gray-700/20">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl mb-6 shadow-lg">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">
            AMO
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 uppercase tracking-wider font-medium">
            Analytica Magnum Opus
          </p>
          <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full mx-auto mt-3"></div>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-gray-600 dark:text-gray-300">Sign in to your workforce management account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 text-gray-900 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" />
              )}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
            <a href="#" className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            loading={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Demo Credentials:</h3>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <p><strong>Corporate Admin:</strong> corporate.admin@techcorp.com</p>
            <p><strong>Company Admin:</strong> admin1@techcorp-solutions.com</p>
            <p><strong>Worker:</strong> worker1@techcorp-solutions.com</p>
            <p><strong>Password:</strong> TempPass123!</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Analytica Magnum Opus. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}