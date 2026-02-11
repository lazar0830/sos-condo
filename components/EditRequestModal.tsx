import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceRequest, ServiceProvider, MaintenanceTask, Building } from '../types';
import { ServiceRequestStatus } from '../types';
import { SERVICE_REQUEST_STATUSES } from '../constants';
import Modal from './Modal';

interface EditRequestModalProps {
  request: ServiceRequest;
  providers: ServiceProvider[];
  tasks: MaintenanceTask[];
  buildings: Building[];
  onClose: () => void;
  onSave: (request: ServiceRequest) => void;
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({ request, providers, tasks, buildings, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    providerId: request.providerId,
    notes: request.notes,
    status: request.status,
    cost: request.cost?.toString() || '',
    specialty: request.specialty,
  });

  useEffect(() => {
    setFormData({
      providerId: request.providerId,
      notes: request.notes,
      status: request.status,
      cost: request.cost?.toString() || '',
      specialty: request.specialty,
    });
  }, [request]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...request,
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
    });
    onClose();
  };

  const task = tasks.find(t => t.id === request.taskId);
  const building = buildings.find(b => b.id === task?.buildingId);

  return (
    <Modal isOpen={true} onClose={onClose} title={t('modals.editRequest.title', { name: task?.name || '' })}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('modals.editRequest.property')}</h4>
              <p className="text-md font-semibold text-gray-800 dark:text-gray-200">{building?.name}</p>
            </div>
             <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('modals.editRequest.task')}</h4>
              <p className="text-md font-semibold text-gray-800 dark:text-gray-200">{task?.name}</p>
            </div>
             <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('modals.editRequest.specialty')}</h4>
              <p className="text-md font-semibold text-gray-800 dark:text-gray-200">{formData.specialty}</p>
            </div>
            {request.scheduledDate && (
                <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('modals.editRequest.scheduledDate')}</h4>
                    <p className="text-md font-semibold text-gray-800 dark:text-gray-200">{new Date(request.scheduledDate + 'T12:00:00Z').toLocaleDateString()}</p>
                </div>
            )}
            <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('modals.editRequest.dateSent')}</h4>
                <p className="text-md font-semibold text-gray-800 dark:text-gray-200">{new Date(request.sentAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="providerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editRequest.serviceProvider')}</label>
                <select
                  id="providerId"
                  name="providerId"
                  value={formData.providerId}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                  required
                >
                  <option value="" disabled>{t('modals.common.selectProvider')}</option>
                  {providers.filter(p => p.specialty === formData.specialty).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
                  ))}
                </select>
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editRequest.status')}</label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                >
                    {SERVICE_REQUEST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
             <div className="md:col-span-2">
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editRequest.cost')}</label>
                <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                    </div>
                    <input 
                        type="number" 
                        name="cost" 
                        id="cost" 
                        value={formData.cost} 
                        onChange={handleChange} 
                        className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pl-7 pr-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none" 
                        placeholder="0.00" 
                        step="0.01" 
                        min="0" 
                    />
                </div>
            </div>
            <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editRequest.additionalNotes')}</label>
                <textarea 
                    id="notes" 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    rows={3} 
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none" 
                    placeholder={t('modals.editRequest.notesPlaceholder')}
                ></textarea>
            </div>
        </div>
        
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            {t('modals.common.cancel')}
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {t('modals.common.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditRequestModal;