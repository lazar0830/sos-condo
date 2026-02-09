
import React, { useState } from 'react';
import type { User, ServiceProvider } from '../types';
import { UserRole } from '../types';
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
}

type ActiveTab = 'admins' | 'managers' | 'providers';

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
    onResetData
}) => {
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

  const addButtonText = {
    admins: 'Add Admin',
    managers: 'Add Property Manager',
    providers: 'Add Service Provider',
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
            <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">App Management</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">Create, edit, and manage user accounts.</p>
          </div>
          <button
            onClick={handleAddClick}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {addButtonText[activeTab]}
          </button>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {currentUser.role === UserRole.SuperAdmin && (
                    <button onClick={() => setActiveTab('admins')} className={getTabClass('admins')}>
                        Admins
                    </button>
                )}
                <button onClick={() => setActiveTab('managers')} className={getTabClass('managers')}>
                    Property Managers
                </button>
                {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin) && (
                    <button onClick={() => setActiveTab('providers')} className={getTabClass('providers')}>
                        Service Providers
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
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Display Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {admins.length > 0 ? admins.map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onClick={() => onEditAdmin(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">Edit</button>
                                <button onClick={() => setDeletingUser(user)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                            </td>
                        </tr>
                        )) : (
                        <tr>
                            <td colSpan={4} className="text-center py-10">
                            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">No Admins Found</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Click "Add Admin" to create one.</p>
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Display Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Login Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {managers.length > 0 ? managers.map(user => (
                        <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{user.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.role}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => onEditManager(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">Edit</button>
                            <button onClick={() => setDeletingUser(user)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                            </td>
                        </tr>
                        )) : (
                        <tr>
                            <td colSpan={4} className="text-center py-10">
                            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">No Property Managers Found</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Click "Add Property Manager" to create one.</p>
                            </td>
                        </tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'providers' && (currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin) && (
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialty</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Email</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact Person</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">Actions</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {providers.length > 0 ? providers.map(provider => (
                        <tr key={provider.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{provider.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{provider.specialty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{provider.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{provider.contactPerson || ''}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => onEditProvider(provider)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">Edit</button>
                            <button onClick={() => setDeletingProvider(provider)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                            </td>
                        </tr>
                        )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-10">
                            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">No Service Providers Found</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Click "Add Service Provider" to create one.</p>
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
              <h3 className="text-xl font-bold text-red-800 dark:text-red-200">Danger Zone</h3>
              <p className="text-red-700 dark:text-red-300 mt-2">This action is irreversible. It will delete all current data and reset the application to its initial sample state.</p>
              <div className="mt-4">
                <button 
                    onClick={onResetData}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                    Reset All Application Data
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
          title={`Confirm ${deletingUser.role} Deletion`}
          message={`Are you sure you want to delete ${deletingUser.username}? This action cannot be undone.`}
          confirmButtonText={`Delete ${deletingUser.role}`}
        />
      )}
      {deletingProvider && (
        <ConfirmationModal
          isOpen={!!deletingProvider}
          onClose={() => setDeletingProvider(null)}
          onConfirm={handleConfirmProviderDelete}
          title="Confirm Provider Deletion"
          message={`Are you sure you want to delete ${deletingProvider.name}? This will also delete their associated user account.`}
          confirmButtonText="Delete Provider"
        />
      )}
    </>
  );
};

export default AppManagementView;