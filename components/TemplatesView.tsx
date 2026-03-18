import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ComponentTemplate } from '../types';
import { ComponentType } from '../types';
import type { ComponentCategoriesData } from '../services/firestoreService';
import { COMPONENT_TYPES } from '../constants';
import Modal from './Modal';
import { parseTemplateExcel, type ParseResult, type ParsedTemplateRow } from '../utils/parseTemplateExcel';

interface TemplatesViewProps {
  componentCategories: ComponentCategoriesData;
  templates: ComponentTemplate[];
  onSaveTemplate: (template: (Omit<ComponentTemplate, 'id'> & { createdBy?: string }) | ComponentTemplate) => void | Promise<void>;
  onDeleteTemplate: (templateId: string) => void | Promise<void>;
}

const typeToKey: Record<ComponentType, string> = {
  [ComponentType.Building]: 'typeBuilding',
  [ComponentType.Site]: 'typeSite',
  [ComponentType.Unit]: 'typeUnit',
};

const TemplatesView: React.FC<TemplatesViewProps> = ({
  componentCategories = {},
  templates,
  onSaveTemplate,
  onDeleteTemplate,
}) => {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<ComponentType | ''>('');
  const [parentCategoryFilter, setParentCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ComponentTemplate | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importParseResult, setImportParseResult] = useState<ParseResult | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [updateExistingOnImport, setUpdateExistingOnImport] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<ComponentTemplate, 'id' | 'createdBy'>>({
    type: ComponentType.Building,
    parentCategory: '',
    subCategory: '',
    componentName: '',
    description: '',
  });

  const parentCategories = useMemo(() => {
    if (!typeFilter) return [];
    const cats = componentCategories[typeFilter as ComponentType];
    return cats ? Object.keys(cats) : [];
  }, [typeFilter, componentCategories]);

  const subCategories = useMemo(() => {
    if (!typeFilter || !parentCategoryFilter) return [];
    const cats = componentCategories[typeFilter as ComponentType];
    const parentCatData = cats ? cats[parentCategoryFilter] : null;
    return parentCatData ? Object.keys(parentCatData) : [];
  }, [typeFilter, parentCategoryFilter, componentCategories]);

  const componentNames = useMemo(() => {
    if (!formData.type || !formData.parentCategory || !formData.subCategory) return [];
    const cats = componentCategories[formData.type as ComponentType];
    const parentCatData = cats ? cats[formData.parentCategory] : null;
    const subCatData = parentCatData ? parentCatData[formData.subCategory] : null;
    return subCatData || [];
  }, [formData.type, formData.parentCategory, formData.subCategory, componentCategories]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (typeFilter && tpl.type !== typeFilter) return false;
      if (parentCategoryFilter && tpl.parentCategory !== parentCategoryFilter) return false;
      if (subCategoryFilter && tpl.subCategory !== subCategoryFilter) return false;
      return true;
    });
  }, [templates, typeFilter, parentCategoryFilter, subCategoryFilter]);

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      type: ComponentType.Building,
      parentCategory: '',
      subCategory: '',
      componentName: '',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (template: ComponentTemplate) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      parentCategory: template.parentCategory,
      subCategory: template.subCategory,
      componentName: template.componentName,
      description: template.description,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setFormData({
        type: value as ComponentType,
        parentCategory: '',
        subCategory: '',
        componentName: '',
        description: '',
      });
    } else if (name === 'parentCategory') {
      setFormData((prev) => ({
        ...prev,
        parentCategory: value,
        subCategory: '',
        componentName: '',
      }));
    } else if (name === 'subCategory') {
      setFormData((prev) => ({
        ...prev,
        subCategory: value,
        componentName: '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.parentCategory || !formData.subCategory || !formData.componentName) {
      alert(t('modals.common.fillAllFields'));
      return;
    }
    setIsSaving(true);
    const payload: Omit<ComponentTemplate, 'id' | 'createdBy'> = {
      type: formData.type,
      parentCategory: formData.parentCategory,
      subCategory: formData.subCategory,
      componentName: formData.componentName,
      description: formData.description,
    };
    try {
      if (editingTemplate) {
        await onSaveTemplate({ ...payload, id: editingTemplate.id, createdBy: editingTemplate.createdBy });
      } else {
        await onSaveTemplate(payload);
      }
      setIsModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (template: ComponentTemplate) => {
    if (!window.confirm(t('templates.confirmDeletion', 'Delete this template?'))) return;
    await onDeleteTemplate(template.id);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    try {
      const result = await parseTemplateExcel(file, componentCategories);
      setImportParseResult(result);
      setImportModalOpen(true);
    } catch (err) {
      alert(t('templates.importError', 'Failed to parse file.'));
    }
    e.target.value = '';
  };

  const handleCloseImportModal = () => {
    setImportModalOpen(false);
    setImportParseResult(null);
    setImportFileName('');
  };

  const validImportRows = useMemo(
    () => (importParseResult?.rows.filter((r) => r.data) ?? []) as ParsedTemplateRow[],
    [importParseResult]
  );

  const findExistingTemplate = (data: Omit<ComponentTemplate, 'id'>) =>
    templates.find(
      (t) =>
        t.type === data.type &&
        t.parentCategory === data.parentCategory &&
        t.subCategory === data.subCategory &&
        t.componentName === data.componentName
    );

  const handleRunImport = async () => {
    if (!validImportRows.length) return;
    setIsImporting(true);
    let created = 0;
    let updated = 0;
    let skipped = 0;
    try {
      for (const row of validImportRows) {
        if (!row.data) continue;
        const existing = findExistingTemplate(row.data);
        if (existing) {
          if (updateExistingOnImport) {
            await onSaveTemplate({ ...row.data, id: existing.id, createdBy: existing.createdBy });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await onSaveTemplate(row.data);
          created++;
        }
      }
      handleCloseImportModal();
      alert(t('templates.importSummary', { created, updated, skipped }));
    } finally {
      setIsImporting(false);
    }
  };

  const modal = isModalOpen ? (
    <Modal
      isOpen={true}
      onClose={handleModalClose}
      title={editingTemplate ? t('templates.editTemplateTitle', 'Edit Template') : t('templates.addTemplateTitle', 'Add New Template')}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.type', 'Type')}
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            >
              {COMPONENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`components.${typeToKey[type]}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.parentCategory', 'Parent Category')}
            </label>
            <select
              id="parentCategory"
              name="parentCategory"
              value={formData.parentCategory}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800"
            >
              <option value="">{t('templates.selectParentCategory', 'Select a category...')}</option>
              {Object.keys(componentCategories[formData.type] || {}).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.subCategory', 'Sub Category')}
            </label>
            <select
              id="subCategory"
              name="subCategory"
              value={formData.subCategory}
              onChange={handleFormChange}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800"
              disabled={!formData.parentCategory}
            >
              <option value="">{t('templates.selectSubCategory', 'Select a category...')}</option>
              {Object.keys(
                (componentCategories[formData.type] || {})[formData.parentCategory] || {},
              ).map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="componentName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.componentName', 'Component Name')}
            </label>
            {componentNames.length > 0 ? (
              <select
                id="componentName"
                name="componentName"
                value={formData.componentName}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-800"
              >
                <option value="">{t('templates.selectComponentName', 'Select a component...')}</option>
                {componentNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="componentName"
                name="componentName"
                type="text"
                value={formData.componentName}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
                placeholder={formData.subCategory ? t('templates.enterComponentName', 'Enter component name') : t('templates.selectCategoriesFirst', 'Select categories first')}
                disabled={!formData.subCategory}
              />
            )}
          </div>
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.templateBody', 'Template')}
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
          >
            {t('modals.common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('templates.savingTemplate', 'Saving...') : t('templates.saveTemplate', 'Save Template')}
          </button>
        </div>
      </form>
    </Modal>
  ) : null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">
            {t('templates.title', 'Component Templates')}
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {t('templates.subtitle', 'Manage blueprints for building components.')}
          </p>
        </div>
        <div className="flex space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('templates.importExcel', 'Import Excel')}
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('templates.addTemplate', 'Add Template')}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.type', 'Type')}
            </label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as ComponentType | '');
                setParentCategoryFilter('');
                setSubCategoryFilter('');
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none"
            >
              <option value="">{t('templates.allTypes', 'All Types')}</option>
              {COMPONENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`components.${typeToKey[type]}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="parentCategoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.parentCategory', 'Parent Category')}
            </label>
            <select
              id="parentCategoryFilter"
              value={parentCategoryFilter}
              onChange={(e) => {
                setParentCategoryFilter(e.target.value);
                setSubCategoryFilter('');
              }}
              disabled={!typeFilter}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-900/50"
            >
              <option value="">{t('templates.allParentCategories', 'All Parent Categories')}</option>
              {parentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subCategoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('templates.subCategory', 'Sub Category')}
            </label>
            <select
              id="subCategoryFilter"
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              disabled={!parentCategoryFilter}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 dark:disabled:bg-gray-900/50"
            >
              <option value="">{t('templates.allSubCategories', 'All Sub Categories')}</option>
              {subCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('templates.componentName', 'Component Name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('templates.type', 'Type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('templates.category', 'Category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('templates.actions', 'Actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {tpl.componentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {t(`components.${typeToKey[tpl.type]}`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span>{tpl.parentCategory}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{tpl.subCategory}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        type="button"
                        onClick={() => openEditModal(tpl)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {t('templates.edit', 'Edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tpl)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {t('templates.delete', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-10">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">
                      {t('templates.noTemplatesFound', 'No templates found')}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {t('templates.noTemplatesHint', 'Use the Add Template button to create your first template.')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal}

      {importModalOpen && importParseResult && (
        <Modal
          isOpen={true}
          onClose={handleCloseImportModal}
          title={t('templates.importModalTitle', 'Import templates from Excel')}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {importFileName}
              {importParseResult.format === 'full'
                ? ` — ${t('templates.importFormatFull', '5 columns: Type, Category, Sub-Category, Component Name, Template')}`
                : ` — ${t('templates.importFormatMinimal', '2 columns: Component Name, Template')}`}
            </p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={updateExistingOnImport}
                onChange={(e) => setUpdateExistingOnImport(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('templates.importUpdateExisting', 'Update existing templates (same component)')}
              </span>
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">#</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                      {t('templates.componentName', 'Component Name')}
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                      {t('templates.importStatus', 'Status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {importParseResult.rows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={row.error ? 'bg-red-50 dark:bg-red-900/10' : 'bg-green-50 dark:bg-green-900/10'}
                    >
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{row.rowIndex}</td>
                      <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                        {(row.data?.componentName ?? (row.raw['Component Name'] ?? row.raw['ComponentName'] ?? '—')) as string}
                      </td>
                      <td className="px-3 py-2">
                        {row.error ? (
                          <span className="text-red-600 dark:text-red-400">{row.error}</span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('templates.importValidCount', '{{count}} valid row(s) will be imported.', {
                count: validImportRows.length,
              })}
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCloseImportModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {t('modals.common.cancel')}
              </button>
              <button
                type="button"
                disabled={!validImportRows.length || isImporting}
                onClick={handleRunImport}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? t('templates.importing', 'Importing...') : t('templates.importConfirm', 'Import')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TemplatesView;

