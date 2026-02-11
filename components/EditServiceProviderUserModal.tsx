import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceProvider, User } from '../types';
import Modal from './Modal';
import { SERVICE_PROVIDER_SPECIALTIES } from '../constants';

interface EditServiceProviderUserModalProps {
  provider: ServiceProvider | null;
  users: User[];
  onClose: () => void;
  onSave: (data: { 
    providerData: Omit<ServiceProvider, 'id'> | ServiceProvider, 
    userData: { email: string, username: string, password?: string }
  }) => Promise<boolean> | boolean;
}

const EditServiceProviderUserModal: React.FC<EditServiceProviderUserModalProps> = ({ provider, users, onClose, onSave }) => {
  const { t } = useTranslation();
  const isEditing = !!provider;
  const [providerData, setProviderData] = useState({
    name: '',
    email: '',
    specialty: SERVICE_PROVIDER_SPECIALTIES[0],
    phone: '',
    contactPerson: '',
  });
  const [userData, setUserData] = useState({
    email: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (provider) {
      setProviderData({
        name: provider.name,
        email: provider.email,
        specialty: provider.specialty,
        phone: provider.phone || '',
        contactPerson: provider.contactPerson || '',
      });
      const user = users.find(u => u.id === provider.userId);
      setUserData({
        email: user?.email || '',
        username: user?.username || '',
        password: '', // Never pre-fill password
      });
    } else {
      setProviderData({
        name: '', email: '', specialty: SERVICE_PROVIDER_SPECIALTIES[0], phone: '', contactPerson: ''
      });
      setUserData({ email: '', username: '', password: '' });
    }
  }, [provider, users]);

  const handleProviderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProviderData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerData.name || !providerData.email || !userData.email || !userData.username) {
        alert(t('modals.editServiceProviderUser.allFieldsRequired'));
        return;
    }

    // FIX: Add the 'createdBy' property when creating a new provider to match the 'Omit<ServiceProvider, 'id'>' type.
    const dataToSave = {
        providerData: isEditing ? { ...provider, ...providerData } : { ...providerData, createdBy: '' },
        userData: userData,
    };
    
    const success = await onSave(dataToSave);
    if (success) {
        onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? t('modals.editServiceProviderUser.titleEdit') : t('modals.editServiceProviderUser.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Account Section */}
        <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
            <legend className="px-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{t('modals.editServiceProviderUser.userAccount')}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.loginEmail')}</label>
                    <input type="email" name="email" id="email" value={userData.email} onChange={handleUserChange} className="mt-1 block w-full input" required disabled={isEditing} />
                </div>
                 <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.displayName')}</label>
                    <input type="text" name="username" id="username" value={userData.username} onChange={handleUserChange} className="mt-1 block w-full input" required />
                </div>
                {!isEditing && (
                    <div className="md:col-span-2">
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.password')}</label>
                        <input type="password" name="password" id="password" value={userData.password} onChange={handleUserChange} className="mt-1 block w-full input" placeholder={isEditing ? t('modals.editServiceProviderUser.passwordPlaceholder') : ''} required={!isEditing} />
                    </div>
                )}
            </div>
        </fieldset>

        {/* Provider Profile Section */}
         <fieldset className="border border-gray-300 dark:border-gray-600 p-4 rounded-md">
            <legend className="px-2 text-lg font-semibold text-gray-800 dark:text-gray-100">{t('modals.editServiceProviderUser.providerProfile')}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.providerName')}</label>
                    <input type="text" name="name" id="name" value={providerData.name} onChange={handleProviderChange} className="mt-1 block w-full input" required />
                </div>
                <div>
                    <label htmlFor="providerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.contactEmail')}</label>
                    <input type="email" name="email" id="providerEmail" value={providerData.email} onChange={handleProviderChange} className="mt-1 block w-full input" required />
                </div>
                <div>
                    <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.specialty')}</label>
                    <input 
                        list="specialties"
                        name="specialty" 
                        id="specialty" 
                        value={providerData.specialty} 
                        onChange={handleProviderChange} 
                        className="mt-1 block w-full input"
                        required
                    />
                    <datalist id="specialties">
                        {SERVICE_PROVIDER_SPECIALTIES.map(s => <option key={s} value={s} />)}
                    </datalist>
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.phone')}</label>
                    <input type="tel" name="phone" id="phone" value={providerData.phone} onChange={handleProviderChange} className="mt-1 block w-full input" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editServiceProviderUser.contactPerson')}</label>
                    <input type="text" name="contactPerson" id="contactPerson" value={providerData.contactPerson} onChange={handleProviderChange} className="mt-1 block w-full input" />
                </div>
            </div>
        </fieldset>

        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            {t('modals.common.cancel')}
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {t('modals.editServiceProviderUser.saveProvider')}
          </button>
        </div>
      </form>
       <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; } .input:disabled { background-color: #F3F4F6; color: #6B7280; cursor: not-allowed; } .dark .input:disabled { background-color: #1F2937; color: #4B5563; }`}</style>
    </Modal>
  );
};

export default EditServiceProviderUserModal;