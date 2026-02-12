

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building } from '../types';
import Modal from './Modal';
import { validateImageFile, uploadBuildingImage } from '../services/storageService';

interface EditBuildingModalProps {
  building: Building | null;
  onClose: () => void;
  onSave: (building: Omit<Building, 'id'> | Building) => void;
}

const EditBuildingModal: React.FC<EditBuildingModalProps> = ({ building, onClose, onSave }) => {
  const { t } = useTranslation();
  const isEditing = !!building;
  const [formData, setFormData] = useState<Omit<Building, 'id'> | Building>(() => {
    return building || { name: '', address: '', imageUrl: '', createdBy: '' };
  });
  const [imagePreview, setImagePreview] = useState<string | null>(building?.imageUrl || null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (building) {
      setFormData(building);
      setImagePreview(building.imageUrl || null);
      setPendingImageFile(null);
    } else {
      setFormData({ name: '', address: '', imageUrl: '', createdBy: '' });
      setImagePreview(null);
      setPendingImageFile(null);
    }
    setImageError(null);
  }, [building]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || 'imageInvalid');
      return;
    }
    setPendingImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setPendingImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, imageUrl: '' }));
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) return;
    setIsSubmitting(true);
    setImageError(null);
    try {
      let imageUrl = formData.imageUrl || '';
      if (pendingImageFile) {
        imageUrl = await uploadBuildingImage(pendingImageFile, building?.id);
      }
      onSave({ ...formData, imageUrl });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setImageError(['imageTypeInvalid', 'imageSizeTooLarge'].includes(msg) ? msg : 'imageUploadFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isEditing ? t('modals.editBuilding.titleEdit') : t('modals.editBuilding.titleAdd')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editBuilding.propertyName')}</label>
          <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none" required />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editBuilding.address')}</label>
          <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editBuilding.propertyImage')}</label>
          <div className="mt-1 flex items-center space-x-4">
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Property Preview" className="h-20 w-20 object-cover rounded-md" />
                <button type="button" onClick={handleRemoveImage} className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600" aria-label={t('modals.editBuilding.removeImage')}>
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
            <div>
              <label htmlFor="image-upload" className="cursor-pointer inline-block bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span>{imagePreview ? t('modals.editBuilding.change') : t('modals.editBuilding.uploadImage')}</span>
                <input ref={fileInputRef} id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
              </label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('modals.editBuilding.imageHint')}</p>
            </div>
          </div>
          {imageError && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t(`modals.editBuilding.${imageError}`)}</p>
          )}
        </div>
        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">
            {t('modals.common.cancel')}
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? t('modals.editBuilding.uploading') : isEditing ? t('modals.common.saveChanges') : t('modals.editBuilding.addProperty')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditBuildingModal;
