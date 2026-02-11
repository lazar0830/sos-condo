
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';
import { UserRole } from '../types';
import Modal from './Modal';

interface EditUserModalProps {
  user: User | null;
  role: UserRole.Admin | UserRole.PropertyManager;
  onClose: () => void;
  onSave: (user: Omit<User, 'id'> | User, password?: string) => Promise<boolean> | boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, role, onClose, onSave }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setUsername(user.username);
      setPassword('');
    } else {
      setEmail('');
      setUsername('');
      setPassword('');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || (!isEditing && !password)) {
        alert(t('modals.editUser.requiredFieldsAlert'));
        return;
    }
    
    let userData;
    if (isEditing) {
        userData = { 
            ...user, 
            email,
            username,
        };
    } else {
        userData = {
            email,
            username,
            role: role
        };
    }
    
    const success = await onSave(userData, password);
    if (success) {
        onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? t('modals.editUser.titleEdit', { role: user.role }) : t('modals.editUser.titleAdd', { role })}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUser.loginEmail')}</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
            required
            disabled={isEditing}
          />
        </div>
         <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUser.displayName')}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
            required
          />
        </div>
        {!isEditing && (
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUser.password')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                placeholder={isEditing ? t('modals.editUser.passwordPlaceholder') : ''}
                required={!isEditing}
              />
            </div>
        )}
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600">
            {t('modals.common.cancel')}
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {t('modals.editUser.saveUser')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUserModal;