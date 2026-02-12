


import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Component, Building, ComponentImage, Unit } from '../types';
import { ComponentType } from '../types';
import { COMPONENT_TYPES } from '../constants';

const typeToKey: Record<ComponentType, string> = {
  [ComponentType.Building]: 'typeBuilding',
  [ComponentType.Site]: 'typeSite',
  [ComponentType.Unit]: 'typeUnit',
};
import type { ComponentCategoriesData } from '../services/firestoreService';
import { validateImageFile, uploadComponentImage } from '../services/storageService';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';

interface EditComponentModalProps {
  component: Component | null;
  buildings: Building[];
  units: Unit[];
  componentCategories?: ComponentCategoriesData;
  onClose: () => void;
  onSave: (component: Omit<Component, 'id'> | Component) => void;
  onDelete: (componentId: string) => void;
  preselectedBuildingId?: string | null;
}

const EditComponentModal: React.FC<EditComponentModalProps> = ({ component, buildings, units, componentCategories = {}, onClose, onSave, onDelete, preselectedBuildingId }) => {
  const { t } = useTranslation();
  const isEditing = !!component;
  const [formData, setFormData] = useState({
    name: '',
    buildingId: '',
    location: '',
    type: ComponentType.Building,
    parentCategory: '',
    subCategory: '',
    brand: '',
    modelNumber: '',
    serialNumber: '',
    installationDate: '',
    warrantyEndDate: '',
    notes: '',
    images: [] as ComponentImage[],
    unitId: '',
    unitNumber: '',
  });
  const [pendingImageFiles, setPendingImageFiles] = useState<{ id: string; file: File }[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const parentCategories = useMemo(() => {
    if (!formData.type) return [];
    const cats = componentCategories[formData.type as ComponentType];
    return cats ? Object.keys(cats) : [];
  }, [formData.type, componentCategories]);

  const subCategories = useMemo(() => {
    if (!formData.type || !formData.parentCategory) return [];
    const cats = componentCategories[formData.type as ComponentType];
    const parentCatData = cats ? cats[formData.parentCategory] : null;
    return parentCatData ? Object.keys(parentCatData) : [];
  }, [formData.type, formData.parentCategory, componentCategories]);

  const componentNames = useMemo(() => {
    if (!formData.type || !formData.parentCategory || !formData.subCategory) return [];
    const cats = componentCategories[formData.type as ComponentType];
    const parentCatData = cats ? cats[formData.parentCategory] : null;
    const subCatData = parentCatData ? parentCatData[formData.subCategory] : null;
    return subCatData || [];
  }, [formData.type, formData.parentCategory, formData.subCategory, componentCategories]);

  const buildingUnits = useMemo(() => {
    if (!formData.buildingId) return [];
    return units.filter(u => u.buildingId === formData.buildingId);
  }, [formData.buildingId, units]);


  useEffect(() => {
    setPendingImageFiles([]);
    setImageError(null);
    if (component) {
      setFormData({
        name: component.name,
        buildingId: component.buildingId,
        location: component.location || '',
        type: component.type,
        parentCategory: component.parentCategory,
        subCategory: component.subCategory,
        brand: component.brand || '',
        modelNumber: component.modelNumber || '',
        serialNumber: component.serialNumber || '',
        installationDate: component.installationDate || '',
        warrantyEndDate: component.warrantyEndDate || '',
        notes: component.notes || '',
        images: component.images || [],
        unitId: component.unitId || '',
        unitNumber: component.unitNumber || '',
      });
    } else {
      setFormData({
        name: '',
        buildingId: preselectedBuildingId || (buildings.length > 0 ? buildings[0].id : ''),
        location: '',
        type: '' as any,
        parentCategory: '',
        subCategory: '',
        brand: '',
        modelNumber: '',
        serialNumber: '',
        installationDate: '',
        warrantyEndDate: '',
        notes: '',
        images: [],
        unitId: '',
        unitNumber: '',
      });
    }
  }, [component, buildings, preselectedBuildingId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'buildingId' && value !== formData.buildingId) {
        setFormData(prev => ({
            ...prev,
            buildingId: value,
            unitId: '',
            unitNumber: ''
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as ComponentType;
    setFormData(prev => ({
        ...prev,
        type: newType,
        parentCategory: '',
        subCategory: '',
        name: '',
    }));
  };

  const handleParentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newParentCat = e.target.value;
    setFormData(prev => ({
        ...prev,
        parentCategory: newParentCat,
        subCategory: '',
        name: '',
    }));
  };
  
  const handleSubCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubCat = e.target.value;
    setFormData(prev => ({
        ...prev,
        subCategory: newSubCat,
        name: ''
    }));
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const unitId = e.target.value;
    const unit = buildingUnits.find(u => u.id === unitId);
    setFormData(prev => ({
        ...prev,
        unitId: unitId,
        unitNumber: unit ? unit.unitNumber : ''
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const newItems: { id: string; file: File; preview: ComponentImage }[] = [];
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setImageError(validation.error || 'imageInvalid');
        return;
      }
      const id = crypto.randomUUID();
      newItems.push({
        id,
        file,
        preview: { id, url: URL.createObjectURL(file as Blob), uploadedAt: new Date().toISOString() },
      });
    }
    setPendingImageFiles(prev => [...prev, ...newItems.map(i => ({ id: i.id, file: i.file }))]);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newItems.map(i => i.preview)] }));
  };

  const handleRemoveImage = (imageId: string) => {
    setPendingImageFiles(prev => prev.filter(p => p.id !== imageId));
    setFormData(prev => ({ ...prev, images: prev.images.filter(img => img.id !== imageId) }));
    setImageError(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.buildingId) {
        alert(t('modals.common.fillAllFields'));
        return;
    }
    setIsSubmitting(true);
    setImageError(null);
    try {
      let images = formData.images;
      if (pendingImageFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          pendingImageFiles.map(async ({ id, file }) => {
            const url = await uploadComponentImage(file, component?.id);
            return { id, url };
          })
        );
        images = formData.images.map(img => {
          const uploaded = uploadedUrls.find(u => u.id === img.id);
          return uploaded ? { ...img, url: uploaded.url } : img;
        });
      }
      const dataToSave = { ...formData, images };
      if (component) {
        onSave({ ...component, ...dataToSave });
      } else {
        onSave(dataToSave as Omit<Component, 'id'>);
      }
      onClose();
    } catch (err) {
      setImageError('imageUploadFailed');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleConfirmDelete = () => {
    if (component) {
      onDelete(component.id);
      setIsConfirmingDelete(false);
      onClose();
    }
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={isEditing ? t('modals.editComponent.titleEdit') : t('modals.editComponent.titleAdd')}>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                  <label htmlFor="buildingId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.property')}</label>
                  <select name="buildingId" id="buildingId" value={formData.buildingId} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" required>
                      <option value="" disabled>{t('modals.common.selectProperty')}</option>
                      {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
              </div>
              <div className="md:col-span-2 border-t dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.type')}</label>
                    <select name="type" id="type" value={formData.type} onChange={handleTypeChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" required>
                        <option value="" disabled>{t('modals.editComponent.selectType')}</option>
                        {COMPONENT_TYPES.map(cType => <option key={cType} value={cType}>{t(`components.${typeToKey[cType]}`)}</option>)}
                    </select>
                  </div>
                   <div>
                    <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.parentCategory')}</label>
                    <select name="parentCategory" id="parentCategory" value={formData.parentCategory} onChange={handleParentCategoryChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" disabled={parentCategories.length === 0} required>
                        <option value="">{t('modals.editComponent.selectCategory')}</option>
                        {parentCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                   <div>
                    <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.subCategory')}</label>
                    <select name="subCategory" id="subCategory" value={formData.subCategory} onChange={handleSubCategoryChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" disabled={subCategories.length === 0} required>
                        <option value="">{t('modals.editComponent.selectCategory')}</option>
                        {subCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
              </div>

               <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.componentName')}</label>
                  {componentNames.length > 0 ? (
                    <select name="name" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" required>
                        <option value="">{t('modals.editComponent.selectComponent')}</option>
                        {componentNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  ) : (
                    <input
                        type="text"
                        name="name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                        required
                        placeholder={formData.subCategory ? t('modals.editComponent.enterComponentName') : t('modals.editComponent.selectCategoriesFirst')}
                        disabled={!formData.subCategory}
                    />
                  )}
              </div>

               <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.locationOptional')}</label>
                  <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" placeholder="e.g., Rooftop, Unit 502, Boiler Room" />
              </div>
              <div>
                  <label htmlFor="unitId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.unitOptional')}</label>
                  <select
                      name="unitId"
                      id="unitId"
                      value={formData.unitId}
                      onChange={handleUnitChange}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={!formData.buildingId || buildingUnits.length === 0}
                  >
                      <option value="">
                          {!formData.buildingId 
                              ? t('modals.editComponent.selectPropertyFirst')
                              : buildingUnits.length > 0 
                                  ? t('modals.editComponent.selectUnit')
                                  : t('modals.editComponent.noUnitsInProperty')}
                      </option>
                      {buildingUnits.map(u => (
                          <option key={u.id} value={u.id}>{u.unitNumber}</option>
                      ))}
                  </select>
              </div>

              <div className="md:col-span-2 border-t dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.brandOptional')}</label>
                  <input type="text" name="brand" id="brand" value={formData.brand} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label htmlFor="modelNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.modelOptional')}</label>
                  <input type="text" name="modelNumber" id="modelNumber" value={formData.modelNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.serialOptional')}</label>
                  <input type="text" name="serialNumber" id="serialNumber" value={formData.serialNumber} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" />
                </div>
                <div>
                    <label htmlFor="installationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.installationDateOptional')}</label>
                    <input type="date" name="installationDate" id="installationDate" value={formData.installationDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" />
                </div>
                <div>
                    <label htmlFor="warrantyEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.warrantyEndDateOptional')}</label>
                    <input type="date" name="warrantyEndDate" id="warrantyEndDate" value={formData.warrantyEndDate} onChange={handleChange} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed" />
                </div>
              </div>
              <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.notesOptional')}</label>
                  <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed"></textarea>
              </div>
              <div className="md:col-span-2 border-t dark:border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('modals.editComponent.images')}</label>
                <div className="mt-2">
                    <label htmlFor="image-upload" className="cursor-pointer bg-white dark:bg-gray-700 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <span>{t('modals.editComponent.uploadImages')}</span>
                        <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp, image/gif" multiple onChange={handleImageChange} />
                    </label>
                </div>
                {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {formData.images.map(image => (
                            <div key={image.id} className="relative group aspect-square">
                                <img src={image.url} alt={`Component image ${image.id}`} className="w-full h-full object-cover rounded-md border dark:border-gray-700" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors flex items-center justify-center rounded-md">
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(image.id)}
                                        className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Delete image"
                                    >
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {imageError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t(`modals.editBuilding.${imageError}`)}</p>
                )}
              </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700 mt-4">
            <div>
              {isEditing && (
                <button 
                  type="button" 
                  onClick={() => setIsConfirmingDelete(true)}
                  className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {t('modals.editComponent.deleteComponent')}
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none">{t('modals.common.cancel')}</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? t('modals.editBuilding.uploading') : t('modals.editComponent.saveComponent')}</button>
            </div>
          </div>
        </form>
      </Modal>
      {component && (
        <ConfirmationModal
          isOpen={isConfirmingDelete}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={handleConfirmDelete}
          title={t('modals.editComponent.confirmDeletionTitle')}
          message={t('modals.editComponent.confirmDeletionMessage', { name: component.name })}
          confirmButtonText={t('modals.editComponent.deleteComponent')}
        />
      )}
    </>
  );
};

export default EditComponentModal;
