
import React, { useState, useEffect } from 'react';
import { Unit, OccupantType } from '../types';
import Modal from './Modal';

interface EditUnitModalProps {
  unit: Unit | null;
  buildingId: string;
  onClose: () => void;
  onSave: (unit: Omit<Unit, 'id' | 'images'> | Unit) => void;
}

const EditUnitModal: React.FC<EditUnitModalProps> = ({ unit, buildingId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    unitNumber: '',
    occupant: { name: '', type: OccupantType.Renter, startDate: '', endDate: '' }
  });
  const isEditing = !!unit;

  useEffect(() => {
    if (unit) {
      setFormData({
        unitNumber: unit.unitNumber,
        occupant: {
          name: unit.occupant?.name || '',
          type: unit.occupant?.type || OccupantType.Renter,
          startDate: unit.occupant?.startDate || '',
          endDate: unit.occupant?.endDate || '',
        }
      });
    } else {
      setFormData({
        unitNumber: '',
        occupant: { name: '', type: OccupantType.Renter, startDate: '', endDate: '' }
      });
    }
  }, [unit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('occupant.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({ ...prev, occupant: { ...prev.occupant, [field]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unitNumber.trim()) {
        alert("Unit number cannot be empty.");
        return;
    }

    const occupantData = {
      name: formData.occupant.name.trim(),
      type: formData.occupant.type,
      startDate: formData.occupant.startDate,
      endDate: formData.occupant.endDate || undefined,
    };
    const finalOccupant = occupantData.name ? occupantData : undefined;
    
    if (isEditing) {
        onSave({ ...unit!, unitNumber: formData.unitNumber.trim(), occupant: finalOccupant });
    } else {
        onSave({ buildingId, unitNumber: formData.unitNumber.trim(), occupant: finalOccupant });
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Unit' : 'Add New Unit'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Unit Number / Name</label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleChange}
            className="mt-1 block w-full input"
            placeholder="e.g., 101, PH-2, Suite B"
            required
          />
        </div>

        <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <legend className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Occupant Information (Optional)</legend>
            <div className="space-y-4">
                <div>
                    <label htmlFor="occupant.name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Occupant Name</label>
                    <input type="text" id="occupant.name" name="occupant.name" value={formData.occupant.name} onChange={handleChange} className="mt-1 block w-full input" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className='md:col-span-1'>
                        <label htmlFor="occupant.type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Occupant Type</label>
                        <select id="occupant.type" name="occupant.type" value={formData.occupant.type} onChange={handleChange} className="mt-1 block w-full input">
                            <option value={OccupantType.Renter}>Renter</option>
                            <option value={OccupantType.Owner}>Owner</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="occupant.startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                        <input type="date" id="occupant.startDate" name="occupant.startDate" value={formData.occupant.startDate} onChange={handleChange} className="mt-1 block w-full input" />
                    </div>
                    <div>
                        <label htmlFor="occupant.endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                        <input type="date" id="occupant.endDate" name="occupant.endDate" value={formData.occupant.endDate} onChange={handleChange} className="mt-1 block w-full input" />
                    </div>
                </div>
            </div>
        </fieldset>

        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {isEditing ? 'Save Changes' : 'Add Unit'}
          </button>
        </div>
      </form>
      <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }`}</style>
    </Modal>
  );
};

export default EditUnitModal;