

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaintenanceTask } from '../types';
// FIX: Import TaskStatus to provide a default status for new tasks.
import { Recurrence, TaskStatus } from '../types';
// FIX: Import SERVICE_PROVIDER_SPECIALTIES to provide options for the new specialty field.
import { RECURRENCE_OPTIONS, SERVICE_PROVIDER_SPECIALTIES } from '../constants';
import Modal from './Modal';

interface AddTaskModalProps {
  buildingId: string;
  onClose: () => void;
  onAddTask: (task: Omit<MaintenanceTask, 'id'>) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ buildingId, onClose, onAddTask }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>(Recurrence.OneTime);
  // FIX: Add state for the missing 'specialty' property.
  const [specialty, setSpecialty] = useState(SERVICE_PROVIDER_SPECIALTIES[0] || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && description) {
      // FIX: Include the missing 'specialty' and 'status' properties in the new task object.
      onAddTask({ buildingId, name, description, recurrence, specialty, status: TaskStatus.New });
      onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={t('modals.addTask.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.addTask.taskName')}</label>
          <input
            type="text"
            id="taskName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full input"
            required
          />
        </div>
        <div>
          <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.addTask.description')}</label>
          <textarea
            id="taskDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full input"
            required
          ></textarea>
        </div>
        {/* FIX: Add an input field for the 'specialty' property. */}
        <div>
          <label htmlFor="taskSpecialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.addTask.specialty')}</label>
          <select
            id="taskSpecialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1 block w-full input"
            required
          >
            {SERVICE_PROVIDER_SPECIALTIES.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="taskRecurrence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.addTask.recurrence')}</label>
          <select
            id="taskRecurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            className="mt-1 block w-full input"
          >
            {RECURRENCE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            {t('modals.common.cancel')}
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {t('modals.addTask.addTask')}
          </button>
        </div>
      </form>
      <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }`}</style>
    </Modal>
  );
};

export default AddTaskModal;