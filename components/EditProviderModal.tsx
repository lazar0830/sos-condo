import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceProvider } from '../types';
import Modal from './Modal';
import { SERVICE_PROVIDER_SPECIALTIES } from '../constants';

interface EditProviderModalProps {
  provider: ServiceProvider | null;
  onClose: () => void;
  onSave: (provider: Omit<ServiceProvider, 'id'> | ServiceProvider) => void;
}

const EditProviderModal: React.FC<EditProviderModalProps> = ({ provider, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Omit<ServiceProvider, 'id'>>({
    name: '',
    email: '',
    specialty: SERVICE_PROVIDER_SPECIALTIES[0],
    phone: '',
    address: '',
    website: '',
    notes: '',
    businessOwner: '',
    contactPerson: '',
    // FIX: Add missing required property 'createdBy' to satisfy the Omit<ServiceProvider, 'id'> type.
    createdBy: '',
  });

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name,
        email: provider.email,
        specialty: provider.specialty,
        phone: provider.phone || '',
        address: provider.address || '',
        website: provider.website || '',
        notes: provider.notes || '',
        businessOwner: provider.businessOwner || '',
        contactPerson: provider.contactPerson || '',
        // FIX: Add missing required property 'createdBy' to satisfy the Omit<ServiceProvider, 'id'> type.
        createdBy: provider.createdBy,
        userId: provider.userId,
        logoUrl: provider.logoUrl,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        specialty: SERVICE_PROVIDER_SPECIALTIES[0],
        phone: '',
        address: '',
        website: '',
        notes: '',
        businessOwner: '',
        contactPerson: '',
        // FIX: Add missing required property 'createdBy' to satisfy the Omit<ServiceProvider, 'id'> type.
        createdBy: '',
      });
    }
  }, [provider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (provider) {
      onSave({ ...provider, ...formData });
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={provider ? t('modals.editProvider.titleEdit') : t('modals.editProvider.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.providerName')}</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full input" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.email')}</label>
            <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full input" required />
          </div>
          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.specialty')}</label>
            <input 
                list="specialties" 
                name="specialty" 
                id="specialty" 
                value={formData.specialty} 
                onChange={handleChange} 
                className="mt-1 block w-full input"
                required
            />
            <datalist id="specialties">
                {SERVICE_PROVIDER_SPECIALTIES.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.phone')}</label>
            <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full input" />
          </div>
           <div>
            <label htmlFor="businessOwner" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.businessOwner')}</label>
            <input type="text" name="businessOwner" id="businessOwner" value={formData.businessOwner} onChange={handleChange} className="mt-1 block w-full input" />
          </div>
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.contactPerson')}</label>
            <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} className="mt-1 block w-full input" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.address')}</label>
            <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full input" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.website')}</label>
            <input type="url" name="website" id="website" value={formData.website} onChange={handleChange} className="mt-1 block w-full input" placeholder="https://example.com" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editProvider.notes')}</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full input"></textarea>
          </div>
        </div>
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            {t('modals.common.cancel')}
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {t('modals.editProvider.saveProvider')}
          </button>
        </div>
      </form>
       <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }`}</style>
    </Modal>
  );
};

export default EditProviderModal;