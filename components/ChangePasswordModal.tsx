import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';
import Modal from './Modal';

interface ChangePasswordModalProps {
  user: User;
  onClose: () => void;
  onChangePassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onClose, onChangePassword }) => {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const pwd = newPassword ?? '';
    const confirm = confirmPassword ?? '';

    if (!pwd || !confirm) {
      setError(t('modals.changePassword.requiredFieldsAlert'));
      return;
    }

    if (pwd.length < 6) {
      setError(t('modals.changePassword.passwordTooShort'));
      return;
    }

    if (pwd !== confirm) {
      setError(t('modals.changePassword.passwordsDoNotMatch'));
      return;
    }

    const userId = user?.id;
    if (!userId) {
      setError(t('modals.changePassword.errorChangingPassword'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await onChangePassword(userId, pwd);
      if (result.success) {
        onClose();
      } else {
        setError(result.error || t('modals.changePassword.errorChangingPassword'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('modals.changePassword.errorChangingPassword'));
    } finally {
      setIsLoading(false);
    }
  };

  const displayName = user?.username ?? user?.email ?? '';
  const displayEmail = user?.email ?? '';

  return (
    <Modal isOpen={true} onClose={onClose} title={t('modals.changePassword.title', { name: displayName })}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('modals.changePassword.description', { email: displayEmail })}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('modals.changePassword.newPassword')}
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            required
            minLength={6}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t('modals.changePassword.passwordHint')}
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('modals.changePassword.confirmPassword')}
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end pt-4 space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('modals.common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? t('modals.changePassword.changing') : t('modals.changePassword.changePassword')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
