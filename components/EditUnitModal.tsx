
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Unit, OccupantType } from '../types';
import Modal from './Modal';

interface EditUnitModalProps {
  unit: Unit | null;
  buildingId: string;
  onClose: () => void;
  onSave: (unit: Omit<Unit, 'id' | 'images'> | Unit) => void;
}

const EditUnitModal: React.FC<EditUnitModalProps> = ({ unit, buildingId, onClose, onSave }) => {
  const { t } = useTranslation();
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
        alert(t('modals.editUnit.unitNumberEmpty'));
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
    <Modal isOpen={true} onClose={onClose} title={isEditing ? t('modals.editUnit.titleEdit') : t('modals.editUnit.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUnit.unitNumber')}</label>
          <input
            type="text"
            id="unitNumber"
            name="unitNumber"
            value={formData.unitNumber}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            placeholder={t('modals.editUnit.unitNumberPlaceholder')}
            required
          />
        </div>

        <fieldset className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <legend className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">{t('modals.editUnit.occupantInformation')}</legend>
            <div className="space-y-4">
                <div>
                    <label htmlFor="occupant.name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUnit.occupantName')}</label>
                    <input type="text" id="occupant.name" name="occupant.name" value={formData.occupant.name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className='md:col-span-1'>
                        <label htmlFor="occupant.type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUnit.occupantType')}</label>
                        <select id="occupant.type" name="occupant.type" value={formData.occupant.type} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none">
                            <option value={OccupantType.Renter}>{t('modals.editUnit.renter')}</option>
                            <option value={OccupantType.Owner}>{t('modals.editUnit.owner')}</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="occupant.startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUnit.startDate')}</label>
                        <input type="date" id="occupant.startDate" name="occupant.startDate" value={formData.occupant.startDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none" />
                    </div>
                    <div>
                        <label htmlFor="occupant.endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editUnit.endDate')}</label>
                        <input type="date" id="occupant.endDate" name="occupant.endDate" value={formData.occupant.endDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none" />
                    </div>
                </div>
            </div>
        </fieldset>

        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            {t('modals.common.cancel')}
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {isEditing ? t('modals.common.saveChanges') : t('modals.editUnit.addUnit')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditUnitModal;