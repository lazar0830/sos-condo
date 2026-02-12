
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { User, ServiceProvider } from '../types';
import { UserRole } from '../types';
import { SERVICE_PROVIDER_SPECIALTIES, SPECIALTY_TO_I18N_KEY } from '../constants';
import { uploadProviderLogo, validateImageFile } from '../services/storageService';

interface MyAccountViewProps {
  currentUser: User;
  onUpdateCurrentUser: (data: { email?: string; username?: string; }) => Promise<{ success: boolean, message: string }>;
  serviceProviderProfile?: ServiceProvider;
  onSaveProvider: (provider: ServiceProvider) => void;
}

const MyAccountView: React.FC<MyAccountViewProps> = ({ currentUser, onUpdateCurrentUser, serviceProviderProfile, onSaveProvider }) => {
  const { t } = useTranslation();
  // State for account details
  const [email, setEmail] = useState(currentUser.email);
  const [username, setUsername] = useState(currentUser.username);
  
  // State for provider profile
  const [providerData, setProviderData] = useState<ServiceProvider | undefined>(serviceProviderProfile);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  // General message state
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    setProviderData(serviceProviderProfile);
    setLogoPreview(serviceProviderProfile?.logoUrl || null);
    setPendingLogoFile(null);
    setLogoError(null);
    setEmail(currentUser.email);
    setUsername(currentUser.username);
  }, [serviceProviderProfile, currentUser]);

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const result = await onUpdateCurrentUser({ email, username });
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!providerData) return;
    const { name, value } = e.target;
    setProviderData(prev => ({ ...prev!, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoError(null);
    if (!e.target.files?.length || !providerData) return;
    const file = e.target.files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setLogoError(validation.error || 'imageInvalid');
      return;
    }
    setPendingLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };
  
  const handleProviderSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerData) return;
    setMessage(null);
    setLogoError(null);
    try {
      let logoUrl = providerData.logoUrl || '';
      if (pendingLogoFile && providerData.id) {
        logoUrl = await uploadProviderLogo(pendingLogoFile, providerData.id);
        setPendingLogoFile(null);
      }
      onSaveProvider({ ...providerData, logoUrl });
      setMessage({ type: 'success', text: t('myAccount.profileUpdatedSuccess') });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setLogoError(['imageTypeInvalid', 'imageSizeTooLarge'].includes(msg) ? msg : 'imageUploadFailed');
      setMessage({ type: 'error', text: t('modals.editBuilding.imageUploadFailed') });
    }
  };

  const MessageDisplay: React.FC<{ msg: { type: 'success' | 'error', text: string } | null }> = ({ msg }) => {
    if (!msg) return null;
    const baseClasses = "px-4 py-3 rounded-md text-sm";
    const colorClasses = msg.type === 'success' 
        ? "bg-green-100 border border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-700/50 dark:text-green-300"
        : "bg-red-100 border border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-700/50 dark:text-red-300";
    return <div className={`${baseClasses} ${colorClasses}`}>{msg.text}</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('myAccount.title')}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{t('myAccount.subtitle')}</p>
      </div>

      {message && <MessageDisplay msg={message} />}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('myAccount.accountDetails')}</h3>
        <form onSubmit={handleAccountUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.loginEmail')}</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full input" required />
            </div>
             <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.displayName')}</label>
              <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} className="mt-1 block w-full input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.role')}</label>
              <p className="mt-1 block w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-500 dark:text-gray-400">{currentUser.role}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-4 py-2 btn-primary">{t('myAccount.saveChanges')}</button>
          </div>
        </form>
      </div>

      {currentUser.role === UserRole.ServiceProvider && providerData && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('myAccount.serviceProviderProfile')}</h3>
           <form onSubmit={handleProviderSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.providerName')}</label>
                    <input type="text" name="name" id="name" value={providerData.name} onChange={handleProviderChange} className="mt-1 block w-full input" required />
                  </div>
                  <div>
                    <label htmlFor="providerEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.contactEmail')}</label>
                    <input type="email" name="email" id="providerEmail" value={providerData.email} onChange={handleProviderChange} className="mt-1 block w-full input" required />
                  </div>
                  <div>
                    <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.specialty')}</label>
                    <select name="specialty" id="specialty" value={providerData.specialty} onChange={handleProviderChange} className="mt-1 block w-full input">
                      {SERVICE_PROVIDER_SPECIALTIES.map(s => <option key={s} value={s}>{SPECIALTY_TO_I18N_KEY[s] ? t(`modals.editTask.${SPECIALTY_TO_I18N_KEY[s]}`) : s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.phone')}</label>
                    <input type="tel" name="phone" id="phone" value={providerData.phone || ''} onChange={handleProviderChange} className="mt-1 block w-full input" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('myAccount.companyLogo')}</label>
                    <div className="mt-1 flex items-center space-x-4">
                        {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 object-cover rounded-md border border-gray-200 dark:border-gray-700" />
                        ) : (
                        <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                           <svg className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.056 1.02.086 1.5.086 1.818 0 3.558-.59 4.9-1.586m-1.54 6.362a9.094 9.094 0 01-1.54-.298m-9.456 0a9.094 9.094 0 01-1.54.298m7.533-3.467a9.094 9.094 0 00-3.022.217m-1.01-1.498a9.094 9.094 0 00-2.218.42m12.333a9.094 9.094 0 00-3.48-1.79a4.5 4.5 0 10-8.108 3.582M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
                        </svg>
                        </div>
                        )}
                        <label htmlFor="logo-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span>{t('myAccount.change')}</span>
                        <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp, image/gif" onChange={handleLogoChange} />
                        </label>
                    </div>
                    {logoError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t(`modals.editBuilding.${logoError}`)}</p>}
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" className="px-4 py-2 btn-primary">{t('myAccount.saveProfile')}</button>
                </div>
            </form>
        </div>
      )}
      <style>{`
        .input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }
        .btn-primary { border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); color: #fff; background-color: #2563eb; } .btn-primary:hover { background-color: #1d4ed8; }
      `}</style>
    </div>
  );
};

export default MyAccountView;