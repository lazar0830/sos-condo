

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building, MaintenanceTask, ServiceProvider, ServiceRequest } from '../types';
import { ServiceRequestStatus } from '../types';
import { generateServiceRequestEmail } from '../services/geminiService';
import Modal from './Modal';

interface CreateRequestModalProps {
  building: Building;
  task: MaintenanceTask;
  providers: ServiceProvider[];
  onClose: () => void;
  // FIX: Corrected the onAddServiceRequest prop type to match the object being
  // created and passed by this component. The handler expects a request object
  // with a status, but without id, comments, documents, or statusHistory.
  onAddServiceRequest: (request: Omit<ServiceRequest, 'id' | 'comments' | 'documents' | 'statusHistory'>) => void;
  isForOverdueTask?: boolean;
}

const getTwoDaysFromNow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0];
};

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ building, task, providers, onClose, onAddServiceRequest, isForOverdueTask = false }) => {
  const { t, i18n } = useTranslation();
  const [providerId, setProviderId] = useState(task.providerId || '');
  const [notes, setNotes] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(isForOverdueTask ? getTwoDaysFromNow() : (task.taskDate || ''));


  const handleGenerateEmail = async () => {
    const selectedProvider = providers.find(p => p.id === providerId);
    if (!selectedProvider) {
      alert(t('modals.createRequest.selectProviderAlert'));
      return;
    }
    setIsLoading(true);
    const emailContent = await generateServiceRequestEmail(building, task, selectedProvider.name, notes, scheduledDate, i18n.language);
    setGeneratedEmail(emailContent);
    setIsLoading(false);
  };

  const handleSendRequest = () => {
    if (!generatedEmail) {
        alert(t('modals.createRequest.generateEmailAlert'));
        return;
    }
    if(!providerId) {
        alert(t('modals.createRequest.selectProviderRequired'));
        return;
    }
    const selectedProvider = providers.find(p => p.id === providerId);
    if (!selectedProvider) return;

    onAddServiceRequest({
        taskId: task.id,
        providerId,
        specialty: task.specialty,
        notes,
        taskDescription: task.description || undefined,
        generatedEmail,
        sentAt: new Date().toISOString(),
        cost: task.cost,
        scheduledDate: isForOverdueTask ? scheduledDate : task.taskDate,
        isUrgent: isForOverdueTask,
        status: ServiceRequestStatus.Sent,
        componentName: task.componentName,
        language: i18n.language?.substring(0, 2) || 'en',
    });
    setIsSent(true);
    setTimeout(() => {
        onClose();
    }, 2000);
  };

  if (isSent) {
    const selectedProvider = providers.find(p => p.id === providerId);
    return (
        <Modal isOpen={true} onClose={onClose} title={t('modals.createRequest.titleSent')}>
            <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">{t('modals.createRequest.successMessage')}</h3>
                {selectedProvider?.email && (
                  <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('modals.createRequest.sentTo', { name: selectedProvider.name, email: selectedProvider.email })}
                  </p>
                )}
                <p className="mt-1 text-gray-500 dark:text-gray-400">{t('modals.createRequest.closingMessage')}</p>
            </div>
        </Modal>
    );
  }

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none";

  return (
    <Modal isOpen={true} onClose={onClose} title={t('modals.createRequest.title', { name: task.name })}>
      <div className="space-y-4">
        <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.createRequest.serviceProvider')}</label>
            <select
              id="provider"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className={inputClasses}
              required
            >
              <option value="" disabled>{t('modals.common.selectProvider')}</option>
              {providers.filter(p => p.specialty === task.specialty).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
              ))}
            </select>
        </div>
        {isForOverdueTask && (
            <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.createRequest.scheduledDate')}</label>
                <input type="date" id="scheduledDate" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className={inputClasses} required />
                <p className="mt-1 text-xs text-amber-600">{t('modals.createRequest.overdueWarning')}</p>
            </div>
        )}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.createRequest.additionalNotes')}</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClasses} placeholder={t('modals.createRequest.notesPlaceholder')}></textarea>
        </div>
        
        <div className="pt-2">
            <button onClick={handleGenerateEmail} disabled={isLoading || !providerId} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800">
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('modals.createRequest.generatingWithAI')}
                    </>
                ) : t('modals.createRequest.generateEmailContent')}
            </button>
        </div>

        {generatedEmail && (
            <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.createRequest.generatedEmailPreview')}</label>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">{generatedEmail}</pre>
                </div>
            </div>
        )}

        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            {t('modals.common.cancel')}
          </button>
          <button type="button" onClick={handleSendRequest} disabled={!generatedEmail} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none disabled:bg-primary-300 dark:disabled:bg-primary-800">
            {t('modals.createRequest.sendRequest')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateRequestModal;