'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLogin?: boolean;
}

export function PasswordChangeModal({ isOpen, onClose, isFirstLogin = false }: PasswordChangeModalProps) {
  const { changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    return {
      isValid: minLength && hasUpper && hasLower && hasNumber && hasSpecial,
      requirements: {
        minLength,
        hasUpper,
        hasLower,
        hasNumber,
        hasSpecial,
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate passwords
    const newPasswordValidation = validatePassword(formData.newPassword);
    if (!newPasswordValidation.isValid) {
      setErrors({ newPassword: 'Password does not meet requirements' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await changePassword(formData.currentPassword, formData.newPassword);
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onClose();
    } catch (error) {
      // Error is handled in the changePassword function
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(formData.newPassword);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isFirstLogin ? () => {} : onClose}
      title={isFirstLogin ? 'Set Your Password' : 'Change Password'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {isFirstLogin && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              🔐 For security reasons, you must set a new password before accessing the system.
            </p>
          </div>
        )}

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.current ? (
                <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.newPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.new ? (
                <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.newPassword}</p>
          )}
        </div>

        {/* Password Requirements */}
        {formData.newPassword && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</h4>
            <div className="space-y-1">
              {Object.entries({
                'At least 8 characters': passwordValidation.requirements.minLength,
                'One uppercase letter': passwordValidation.requirements.hasUpper,
                'One lowercase letter': passwordValidation.requirements.hasLower,
                'One number': passwordValidation.requirements.hasNumber,
                'One special character (@$!%*?&)': passwordValidation.requirements.hasSpecial,
              }).map(([requirement, met]) => (
                <div key={requirement} className={`flex items-center text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  <span className="mr-2">{met ? '✅' : '⭕'}</span>
                  {requirement}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.confirmPassword ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPasswords.confirm ? (
                <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          {!isFirstLogin && (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            loading={loading}
            disabled={!passwordValidation.isValid || formData.newPassword !== formData.confirmPassword}
          >
            {isFirstLogin ? 'Set Password' : 'Change Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}