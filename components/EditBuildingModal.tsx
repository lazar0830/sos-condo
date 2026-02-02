

import React, { useState, useEffect } from 'react';
import type { Building } from '../types';
import Modal from './Modal';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

interface EditBuildingModalProps {
  building: Building | null;
  onClose: () => void;
  onSave: (building: Omit<Building, 'id'> | Building) => void;
}

const EditBuildingModal: React.FC<EditBuildingModalProps> = ({ building, onClose, onSave }) => {
  const isEditing = !!building;
  const [formData, setFormData] = useState<Omit<Building, 'id'> | Building>(() => {
    // FIX: Add createdBy to satisfy the Omit<Building, 'id'> type for new buildings.
    return building || { name: '', address: '', imageUrl: '', createdBy: '' };
  });
  const [imagePreview, setImagePreview] = useState<string | null>(building?.imageUrl || null);

  useEffect(() => {
    if (building) {
      setFormData(building);
      setImagePreview(building.imageUrl || null);
    } else {
      // FIX: Add createdBy to satisfy the Omit<Building, 'id'> type for new buildings.
      setFormData({ name: '', address: '', imageUrl: '', createdBy: '' });
      setImagePreview(null);
    }
  }, [building]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await fileToBase64(file);
      setImagePreview(base64);
      setFormData(prev => ({ ...prev, imageUrl: base64 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.address) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? 'Edit Property' : 'Add New Property'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Property Name</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full input" required />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full input" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Property Image</label>
          <div className="mt-1 flex items-center space-x-4">
            {imagePreview ? (
              <img src={imagePreview} alt="Property Preview" className="h-20 w-20 object-cover rounded-md" />
            ) : (
              <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <span>Change</span>
              <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
            </label>
          </div>
        </div>
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none">
            {isEditing ? 'Save Changes' : 'Add Property'}
          </button>
        </div>
      </form>
      <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; }`}</style>
    </Modal>
  );
};

export default EditBuildingModal;
