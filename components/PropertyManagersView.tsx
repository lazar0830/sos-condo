import React, { useState } from 'react';
import type { User } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface PropertyManagersViewProps {
  managers: User[];
  onAddManager: () => void;
  onEditManager: (user: User) => void;
  onDeleteManager: (userId: string) => void;
}

const PropertyManagersView: React.FC<PropertyManagersViewProps> = ({
  managers,
  onAddManager,
  onEditManager,
  onDeleteManager,
}) => {
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">Property Managers</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">Create, edit, and manage property manager accounts.</p>
        </div>
        <button
          onClick={onAddManager}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Property Manager
        </button>
      </div>

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

      {deletingUser && (
        <ConfirmationModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => { onDeleteManager(deletingUser.id); setDeletingUser(null); }}
          title="Confirm Property Manager Deletion"
          message={`Are you sure you want to delete ${deletingUser.username}? This action cannot be undone.`}
          confirmButtonText="Delete Property Manager"
        />
      )}
    </div>
  );
};

export default PropertyManagersView;
