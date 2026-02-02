
import React, { useState, useEffect } from 'react';
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
        alert("Email, display name, and password are required for new users.");
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
    <Modal isOpen={true} onClose={onClose} title={isEditing ? `Edit ${user.role}` : `Add New ${role}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Login Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full input"
            required
            disabled={isEditing}
          />
        </div>
         <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full input"
            required
          />
        </div>
        {!isEditing && (
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full input"
                placeholder={isEditing ? 'Leave blank to keep current password' : ''}
                required={!isEditing}
              />
            </div>
        )}
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:text-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            Save User
          </button>
        </div>
      </form>
      <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .input:disabled { background-color: #F3F4F6; color: #6B7280; cursor: not-allowed; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; } .dark .input:disabled { background-color: #1F2937; color: #4B5563; }`}</style>
    </Modal>
  );
};

export default EditUserModal;