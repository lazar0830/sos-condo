

import React, { useState, useEffect, useMemo } from 'react';
import type { MaintenanceTask, Building, ServiceProvider, Component, Unit } from '../types';
import { Recurrence, TaskStatus } from '../types';
import { RECURRENCE_OPTIONS, TASK_STATUSES, SERVICE_PROVIDER_SPECIALTIES } from '../constants';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';

interface EditTaskModalProps {
  task: MaintenanceTask | null;
  buildings: Building[];
  providers: ServiceProvider[];
  components: Component[];
  units: Unit[];
  preselectedBuildingId?: string | null;
  preselectedComponentId?: string | null;
  onClose: () => void;
  onSave: (task: Omit<MaintenanceTask, 'id'> | MaintenanceTask) => void;
  onDelete: (taskId: string) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, buildings, providers, components, units, preselectedBuildingId, preselectedComponentId, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    buildingId: preselectedBuildingId || '',
    specialty: '',
    recurrence: Recurrence.OneTime,
    status: TaskStatus.New,
    providerId: '',
    cost: '',
    taskDate: '',
    startDate: '',
    endDate: '',
    componentId: '',
    componentName: '',
    unitId: '',
  });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const allSpecialties = useMemo(() => {
    const providerSpecialties = providers.map(p => p.specialty);
    return [...new Set([...SERVICE_PROVIDER_SPECIALTIES, ...providerSpecialties])].sort();
  }, [providers]);

  const buildingComponents = useMemo(() => {
    if (!formData.buildingId) return [];
    return components.filter(c => c.buildingId === formData.buildingId);
  }, [formData.buildingId, components]);

  const buildingUnits = useMemo(() => {
    if (!formData.buildingId) return [];
    return units.filter(u => u.buildingId === formData.buildingId);
  }, [formData.buildingId, units]);


  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        description: task.description,
        buildingId: task.buildingId,
        specialty: task.specialty,
        recurrence: task.recurrence,
        status: task.status,
        providerId: task.providerId || '',
        cost: task.cost?.toString() || '',
        taskDate: task.taskDate || '',
        startDate: task.startDate || '',
        endDate: task.endDate || '',
        componentId: task.componentId || '',
        componentName: task.componentName || '',
        unitId: task.unitId || '',
      });
    } else {
        const today = new Date().toISOString().split('T')[0];
        const buildingId = preselectedBuildingId || (buildings.length > 0 ? buildings[0].id : '');
        const component = components.find(c => c.id === preselectedComponentId);
        setFormData({
            name: '',
            description: '',
            buildingId: buildingId,
            specialty: allSpecialties[0] || '',
            recurrence: Recurrence.OneTime,
            status: TaskStatus.New,
            providerId: '',
            cost: '',
            taskDate: today,
            startDate: today,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            componentId: preselectedComponentId || '',
            componentName: component ? component.name : '',
            unitId: preselectedComponentId ? components.find(c => c.id === preselectedComponentId)?.unitId || '' : '',
        });
    }
  }, [task, preselectedBuildingId, preselectedComponentId, buildings, components, allSpecialties]);

  useEffect(() => {
    if (formData.providerId) {
      const selectedProvider = providers.find(p => p.id === formData.providerId);
      if (selectedProvider && selectedProvider.specialty !== formData.specialty) {
        setFormData(prev => ({ ...prev, specialty: selectedProvider.specialty }));
      }
    }
  }, [formData.providerId, providers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'buildingId' && value !== formData.buildingId) {
        setFormData(prev => ({
            ...prev,
            buildingId: value,
            componentId: '',
            componentName: '',
            unitId: '',
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleComponentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const componentId = e.target.value;
    const component = buildingComponents.find(c => c.id === componentId);
    setFormData(prev => ({
        ...prev,
        componentId: componentId,
        componentName: component ? component.name : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.buildingId || !formData.specialty || !formData.cost) {
        alert('Please fill out all required fields.');
        return;
    }
    const selectedUnit = buildingUnits.find(u => u.id === formData.unitId);

    let taskData: Partial<MaintenanceTask> = {
      ...formData,
      providerId: formData.providerId || undefined,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      componentId: formData.componentId || undefined,
      componentName: formData.componentId ? formData.componentName : undefined,
      unitId: formData.unitId || undefined,
      unitNumber: selectedUnit ? selectedUnit.unitNumber : undefined,
    };
    
    // Clear irrelevant date fields based on recurrence
    if (formData.recurrence === Recurrence.OneTime) {
      taskData.startDate = undefined;
      taskData.endDate = undefined;
    } else {
      taskData.taskDate = undefined;
    }

    if (task) {
      onSave({ ...task, ...taskData });
    } else {
      onSave(taskData as Omit<MaintenanceTask, 'id'>);
    }
    onClose();
  };
  
  const handleOpenConfirmDelete = () => {
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    if (task) {
      onDelete(task.id);
      setIsConfirmingDelete(false);
      onClose();
    }
  };

  const confirmMessage = task?.recurrence !== Recurrence.OneTime
    ? "This is a master recurring task. Deleting it will also remove all of its future and past scheduled occurrences. This action cannot be undone."
    : "Are you sure you want to permanently delete this task?";


  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={task ? 'Edit Maintenance Task' : 'Add New Maintenance Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Name</label>
                  <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full input" required />
              </div>
              <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                  <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full input"></textarea>
              </div>
              <div>
                  <label htmlFor="buildingId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Property</label>
                  <select name="buildingId" id="buildingId" value={formData.buildingId} onChange={handleChange} className="mt-1 block w-full input" required>
                      <option value="" disabled>Select a property...</option>
                      {buildings.length > 0 ? (
                        buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                      ) : (
                        <option value="" disabled>No properties available</option>
                      )}
                  </select>
              </div>
              <div>
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Specialty</label>
                  <select name="specialty" id="specialty" value={formData.specialty} onChange={handleChange} className="mt-1 block w-full input" required disabled={!!formData.providerId}>
                      <option value="" disabled>Select a specialty...</option>
                      {allSpecialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="providerId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Service Provider (Optional)</label>
                  <select name="providerId" id="providerId" value={formData.providerId} onChange={handleChange} className="mt-1 block w-full input">
                      <option value="">None</option>
                      {providers.filter(p => p.specialty === formData.specialty).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit (Optional)</label>
                  <select
                      name="unitId"
                      id="unitId"
                      value={formData.unitId}
                      onChange={handleChange}
                      className="mt-1 block w-full input"
                      disabled={!formData.buildingId || buildingUnits.length === 0}
                  >
                      <option value="">
                          {!formData.buildingId 
                              ? 'Select a property first' 
                              : buildingUnits.length > 0 
                                  ? 'Select a unit...' 
                                  : 'No units in this property'}
                      </option>
                      {buildingUnits.map(u => (
                          <option key={u.id} value={u.id}>{u.unitNumber}</option>
                      ))}
                  </select>
              </div>
               <div>
                  <label htmlFor="componentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Component (Optional)</label>
                  <select
                      name="componentId"
                      id="componentId"
                      value={formData.componentId}
                      onChange={handleComponentChange}
                      className="mt-1 block w-full input"
                      disabled={!formData.buildingId || buildingComponents.length === 0}
                  >
                      <option value="">
                          {!formData.buildingId 
                              ? 'Select a property first' 
                              : buildingComponents.length > 0 
                                  ? 'Select a component...' 
                                  : 'No components in this property'}
                      </option>
                      {buildingComponents.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
              </div>
               <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select name="status" id="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full input">
                      {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
              </div>
              <div>
                <label htmlFor="recurrence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Recurrence</label>
                <select name="recurrence" id="recurrence" value={formData.recurrence} onChange={handleChange} className="mt-1 block w-full input">
                    {RECURRENCE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {formData.recurrence === Recurrence.OneTime ? (
                   <div>
                      <label htmlFor="taskDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Date</label>
                      <input type="date" name="taskDate" id="taskDate" value={formData.taskDate} onChange={handleChange} className="mt-1 block w-full input" required/>
                  </div>
              ) : (
                  <>
                      <div>
                          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task First Date</label>
                          <input type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full input" required />
                      </div>
                      <div>
                          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task End Date</label>
                          <input type="date" name="endDate" id="endDate" value={formData.endDate} onChange={handleChange} className="mt-1 block w-full input" required />
                      </div>
                  </>
              )}
               <div className="md:col-span-2">
                  <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Cost</label>
                  <div className="mt-1">
                      <input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} className="block w-full input" placeholder="0.00" step="0.01" min="0" required />
                  </div>
              </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <div>
              {task && (
                <button 
                  type="button" 
                  onClick={handleOpenConfirmDelete}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 border border-transparent rounded-md shadow-sm hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">Save Task</button>
            </div>
          </div>
        </form>
         <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; } .dark .input::placeholder { color: #9CA3AF; } .dark .input:disabled { background-color: #1F2937; cursor: not-allowed; }`}</style>
      </Modal>
      {task && (
        <ConfirmationModal
          isOpen={isConfirmingDelete}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Task Deletion"
          message={confirmMessage}
          confirmButtonText="Delete Task"
        />
      )}
    </>
  );
};

export default EditTaskModal;