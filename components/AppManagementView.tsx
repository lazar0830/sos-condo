import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User, ServiceProvider } from '../types';
import { UserRole } from '../types';
import { SPECIALTY_TO_I18N_KEY } from '../constants';
import ConfirmationModal from './ConfirmationModal';

interface AppManagementViewProps {
  currentUser: User;
  admins: User[];
  managers: User[];
  providers: ServiceProvider[];
  users: User[];
  onAddAdmin: () => void;
  onEditAdmin: (user: User) => void;
  onDeleteAdmin: (userId: string) => void;
  onAddManager: () => void;
  onEditManager: (user: User) => void;
  onDeleteManager: (userId: string) => void;
  onAddProvider: () => void;
  onEditProvider: (provider: ServiceProvider) => void;
  onDeleteProvider: (providerId: string) => void;
  onResetData: () => void;
  onChangePassword: (user: User) => void;
  onChangeProviderPassword: (provider: ServiceProvider) => void;
}

type ActiveTab = 'admins' | 'managers' | 'providers';

const roleToKey: Record<string, string> = {
  [UserRole.Admin]: 'roleAdmin',
  [UserRole.PropertyManager]: 'rolePropertyManager',
  [UserRole.SuperAdmin]: 'roleSuperAdmin',
};

const addButtonKeys: Record<ActiveTab, string> = {
  admins: 'addAdmin',
  managers: 'addPropertyManager',
  providers: 'addServiceProvider',
};

const AppManagementView: React.FC<AppManagementViewProps> = ({ 
    currentUser,
    admins,
    managers, 
    providers,
    users,
    onAddAdmin,
    onEditAdmin,
    onDeleteAdmin,
    onAddManager, 
    onEditManager, 
    onDeleteManager,
    onAddProvider,
    onEditProvider,
    onDeleteProvider,
    onResetData,
    onChangePassword,
    onChangeProviderPassword
}) => {
  const { t } = useTranslation();
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deletingProvider, setDeletingProvider] = useState<ServiceProvider | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>(currentUser.role === UserRole.SuperAdmin ? 'admins' : 'managers');

  const handleConfirmUserDelete = () => {
    if (deletingUser) {
        if (deletingUser.role === UserRole.Admin) {
            onDeleteAdmin(deletingUser.id);
        } else {
            onDeleteManager(deletingUser.id);
        }
      setDeletingUser(null);
    }
  };
  
  const handleConfirmProviderDelete = () => {
    if (deletingProvider) {
      onDeleteProvider(deletingProvider.id);
      setDeletingProvider(null);
    }
  };

  const getTabClass = (tab: ActiveTab) => {
    const baseClass = "px-3 py-2 text-sm font-medium rounded-t-md transition-colors";
    if (tab === activeTab) {
      return `${baseClass} bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-300 border-b-2 border-primary-500`;
    }
    return `${baseClass} text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`;
  };

  const handleAddClick = () => {
    switch(activeTab) {
        case 'admins': return onAddAdmin();
        case 'managers': return onAddManager();
        case 'providers': return onAddProvider();
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('appManagement.title')}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">{t('appManagement.subtitle')}</p>
          </div>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t(`appManagement.${addButtonKeys[activeTab]}`)}
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {currentUser.role === UserRole.SuperAdmin && (
                    <button onClick={() => setActiveTab('admins')} className={getTabClass('admins')}>
                        {t('appManagement.admins')}
                    </button>
                )}
                <button onClick={() => setActiveTab('managers')} className={getTabClass('managers')}>
                    {t('appManagement.propertyManagers')}
                </button>
                {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin || currentUser.role === UserRole.PropertyManager) && (
                    <button onClick={() => setActiveTab('providers')} className={getTabClass('providers')}>
                        {t('appManagement.serviceProviders')}
                    </button>
                )}
            </nav>
        </div>
        
        {activeTab === 'admins' && currentUser.role === UserRole.SuperAdmin && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.displayName')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.loginEmail')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.role')}</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('appManagement.actions')}</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {admins.length > 0 ? admins.map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t(`appManagement.${roleToKey[user.role]}`)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => onEditAdmin(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">{t('appManagement.edit')}</button>
                                {currentUser.role === UserRole.SuperAdmin && (
                                  <button onClick={() => onChangePassword(user)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">{t('appManagement.changePassword')}</button>
                                )}
                                <button onClick={() => setDeletingUser(user)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">{t('appManagement.delete')}</button>
                            </td>
                        </tr>
                        )) : (
                        <tr>
                            <td colSpan={4} className="text-center py-10">
                            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">{t('appManagement.noAdminsFound')}</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('appManagement.addAdminHint')}</p>
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {activeTab === 'managers' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.displayName')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.loginEmail')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.role')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.addedBy')}</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">{t('appManagement.actions')}</span>
                        </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {managers.length > 0 ? managers.map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t(`appManagement.${roleToKey[user.role]}`)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.createdBy ? (users?.find(u => u.id === user.createdBy)?.username ?? '—') : '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => onEditManager(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">{t('appManagement.edit')}</button>
                            {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin) && (
                              <button onClick={() => onChangePassword(user)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">{t('appManagement.changePassword')}</button>
                            )}
                            {(currentUser.role === UserRole.SuperAdmin || user.createdBy === currentUser.id) && (
                              <button onClick={() => setDeletingUser(user)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">{t('appManagement.delete')}</button>
                            )}
                            </td>
                        </tr>
                        )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-10">
                            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">{t('appManagement.noPropertyManagersFound')}</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('appManagement.addManagerHint')}</p>
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'providers' && (currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin || currentUser.role === UserRole.PropertyManager) && (
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.providerName')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.specialty')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.contactEmail')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.contactPerson')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('appManagement.addedBy')}</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">{t('appManagement.actions')}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {providers.length > 0 ? providers.map(provider => (
                        <tr key={provider.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{provider.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{SPECIALTY_TO_I18N_KEY[provider.specialty] ? t(`modals.editTask.${SPECIALTY_TO_I18N_KEY[provider.specialty]}`) : provider.specialty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{provider.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{provider.contactPerson || ''}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{provider.createdBy ? (users?.find(u => u.id === provider.createdBy)?.username ?? '—') : '—'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin || provider.createdBy === currentUser.id) && (
                              <button onClick={() => onEditProvider(provider)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">{t('appManagement.edit')}</button>
                            )}
                            {provider.userId && (currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin) && (
                              <button onClick={() => onChangeProviderPassword(provider)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">{t('appManagement.changePassword')}</button>
                            )}
                            {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin) && (
                              <button onClick={() => setDeletingProvider(provider)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">{t('appManagement.delete')}</button>
                            )}
                            </td>
                        </tr>
                        )) : (
                        <tr>
                            <td colSpan={6} className="text-center py-10">
                            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">{t('appManagement.noServiceProvidersFound')}</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('appManagement.addProviderHint')}</p>
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        )}

        {currentUser.role === UserRole.SuperAdmin && (
            <div className="mt-12 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border border-red-200 dark:border-red-700/50">
              <h3 className="text-xl font-bold text-red-800 dark:text-red-200">{t('appManagement.dangerZone')}</h3>
              <p className="text-red-700 dark:text-red-300 mt-2">{t('appManagement.dangerZoneDescription')}</p>
              <div className="mt-4">
                <button 
                    onClick={onResetData}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    {t('appManagement.resetAllData')}
                </button>
              </div>
            </div>
        )}

      </div>
      {deletingUser && (
        <ConfirmationModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={handleConfirmUserDelete}
          title={t('appManagement.confirmUserDeletion', { role: t(`appManagement.${roleToKey[deletingUser.role]}`) })}
          message={t('appManagement.confirmUserDeletionMessage', { name: deletingUser.username })}
          confirmButtonText={t('appManagement.deleteUser', { role: t(`appManagement.${roleToKey[deletingUser.role]}`) })}
        />
      )}
      {deletingProvider && (
        <ConfirmationModal
          isOpen={!!deletingProvider}
          onClose={() => setDeletingProvider(null)}
          onConfirm={handleConfirmProviderDelete}
          title={t('appManagement.confirmProviderDeletion')}
          message={t('appManagement.confirmProviderDeletionMessage', { name: deletingProvider.name })}
          confirmButtonText={t('appManagement.deleteProvider')}
        />
      )}
    </>
  );
};

export default AppManagementView;