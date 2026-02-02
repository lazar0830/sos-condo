

import React, { useState } from 'react';
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
    <Modal isOpen={true} onClose={onClose} title="Add New Maintenance Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">Task Name</label>
          <input
            type="text"
            id="taskName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="taskDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            required
          ></textarea>
        </div>
        {/* FIX: Add an input field for the 'specialty' property. */}
        <div>
          <label htmlFor="taskSpecialty" className="block text-sm font-medium text-gray-700">Specialty</label>
          <select
            id="taskSpecialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            required
          >
            {SERVICE_PROVIDER_SPECIALTIES.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="taskRecurrence" className="block text-sm font-medium text-gray-700">Recurrence</label>
          <select
            id="taskRecurrence"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            {RECURRENCE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            Add Task
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;