import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../types';
import { UserRole } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface PropertyManagersViewProps {
  managers: User[];
  users?: User[];
  currentUser: User;
  onAddManager: () => void;
  onEditManager: (user: User) => void;
  onDeleteManager: (userId: string) => void;
}

const PropertyManagersView: React.FC<PropertyManagersViewProps> = ({
  managers,
  users = [],
  currentUser,
  onAddManager,
  onEditManager,
  onDeleteManager,
}) => {
  const { t } = useTranslation();
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('propertyManagers.title')}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">{t('propertyManagers.subtitle')}</p>
        </div>
        <button
          onClick={onAddManager}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('propertyManagers.addPropertyManager')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('propertyManagers.displayName')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('propertyManagers.loginEmail')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('propertyManagers.role')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('propertyManagers.addedBy')}</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('propertyManagers.actions')}</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {managers.length > 0 ? managers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t('propertyManagers.rolePropertyManager')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.createdBy ? (users?.find(u => u.id === user.createdBy)?.username ?? '—') : '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => onEditManager(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">{t('propertyManagers.edit')}</button>
                    {(currentUser.role === UserRole.SuperAdmin || user.createdBy === currentUser.id) && (
                      <button onClick={() => setDeletingUser(user)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">{t('propertyManagers.delete')}</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">{t('propertyManagers.noManagersFound')}</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('propertyManagers.addManagerHint')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deletingUser && (
        <ConfirmationModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => { onDeleteManager(deletingUser.id); setDeletingUser(null); }}
          title={t('propertyManagers.confirmDeletion')}
          message={t('propertyManagers.confirmDeletionMessage', { name: deletingUser.username })}
          confirmButtonText={t('propertyManagers.deleteManager')}
        />
      )}
    </div>
  );
};

export default PropertyManagersView;
