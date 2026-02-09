import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceProvider, User } from '../types';
import { UserRole } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface ServiceProvidersViewProps {
  providers: ServiceProvider[];
  onAddProvider: () => void;
  onSelectProvider: (id: string) => void;
  onDeleteProvider: (id: string) => void;
  currentUser: User;
}

const ServiceProvidersView: React.FC<ServiceProvidersViewProps> = ({ providers, onAddProvider, onSelectProvider, onDeleteProvider, currentUser }) => {
  const { t } = useTranslation();
  const [deletingProvider, setDeletingProvider] = useState<ServiceProvider | null>(null);

  const handleOpenConfirmDelete = (provider: ServiceProvider) => {
    setDeletingProvider(provider);
  };

  const handleConfirmDelete = () => {
    if (deletingProvider) {
      onDeleteProvider(deletingProvider.id);
      setDeletingProvider(null);
    }
  };
  
  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('serviceProviders.title')}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400">{t('serviceProviders.subtitle')}</p>
          </div>
           <button
            onClick={onAddProvider}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('serviceProviders.addProvider')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div key={provider.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
              <div 
                className="p-6 flex-grow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start space-x-4"
                onClick={() => onSelectProvider(provider.id)}
              >
                 {provider.logoUrl ? (
                    <img src={provider.logoUrl} alt={`${provider.name} logo`} className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-700 flex-shrink-0" />
                ) : (
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                        <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.056 1.02.086 1.5.086 1.818 0 3.558-.59 4.9-1.586m-1.54 6.362a9.094 9.094 0 01-1.54-.298m-9.456 0a9.094 9.094 0 01-1.54.298m7.533-3.467a9.094 9.094 0 00-3.022.217m-1.01-1.498a9.094 9.094 0 00-2.218.42m12.333a9.094 9.094 0 00-3.48-1.79a4.5 4.5 0 10-8.108 3.582M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
                        </svg>
                    </div>
                )}
                <div className="flex-grow">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 mb-2">{provider.specialty}</span>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{provider.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <p className="flex items-center">
                        <svg className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                        <span className="truncate">{provider.email}</span>
                      </p>
                      {provider.phone && (
                        <p className="flex items-center">
                          <svg className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.067a1.5 1.5 0 01-1.17 1.734l-1.056.352a1.5 1.5 0 00-1.176 1.734l.716 3.067a1.5 1.5 0 01-1.17 1.734l-1.056.352a1.5 1.5 0 00-1.176 1.734l.716 3.067A1.5 1.5 0 013.5 18h1.148a1.5 1.5 0 011.465-1.175l.716-3.067a1.5 1.5 0 011.17-1.734l1.056-.352a1.5 1.5 0 001.176-1.734l-.716-3.067a1.5 1.5 0 011.17-1.734l1.056-.352a1.5 1.5 0 001.176-1.734l-.716-3.067A1.5 1.5 0 0115.352 2H16.5A1.5 1.5 0 0118 3.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 16.5v-13z" /></svg>
                          {provider.phone}
                        </p>
                      )}
                    </div>
                </div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 text-right">
                 {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin || provider.createdBy === currentUser.id) && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenConfirmDelete(provider); }} 
                        className="px-3 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                    >
                        {t('serviceProviders.delete')}
                    </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {deletingProvider && (
        <ConfirmationModal
          isOpen={!!deletingProvider}
          onClose={() => setDeletingProvider(null)}
          onConfirm={handleConfirmDelete}
          title={t('serviceProviders.confirmDeletion')}
          message={t('serviceProviders.confirmDeletionMessage', { name: deletingProvider.name })}
          confirmButtonText={t('serviceProviders.deleteProvider')}
        />
      )}
    </>
  );
};

export default ServiceProvidersView;