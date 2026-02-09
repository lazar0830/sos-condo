
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateTurnoverChecklist } from '../services/geminiService';

const ACTIVITY_OPTIONS: { value: string; key: string }[] = [
  { value: 'New Tenant Move-in', key: 'activityNewTenantMoveIn' },
  { value: 'Tenant Move-out', key: 'activityTenantMoveOut' },
  { value: 'Routine Inspection', key: 'activityRoutineInspection' },
  { value: 'Painting', key: 'activityPainting' },
  { value: 'Appliance Upgrade', key: 'activityApplianceUpgrade' },
];

const ToolsView: React.FC = () => {
  const { t } = useTranslation();
  const [unitNumber, setUnitNumber] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [activityType, setActivityType] = useState('New Tenant Move-in');
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber || !propertyType) {
      setError(t('tools.fillAllFields'));
      return;
    }
    setIsLoading(true);
    setError('');
    setChecklist('');
    const result = await generateTurnoverChecklist(unitNumber, propertyType, activityType);
    if (result.startsWith('Error:')) {
        setError(result);
    } else {
        setChecklist(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('tools.title')}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{t('tools.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">{t('tools.unitChecklistGenerator')}</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('tools.unitChecklistDescription')}</p>
        
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label htmlFor="unitNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tools.unitNumber')}</label>
            <input
              type="text"
              id="unitNumber"
              value={unitNumber}
              onChange={(e) => setUnitNumber(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
              placeholder={t('tools.unitNumberPlaceholder')}
              required
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tools.propertyType')}</label>
            <input
              type="text"
              id="propertyType"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
              placeholder={t('tools.propertyTypePlaceholder')}
              required
            />
          </div>
           <div className="md:col-span-1">
            <label htmlFor="activityType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tools.typeOfActivity')}</label>
            <select
              id="activityType"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-gray-100"
              required
            >
                {ACTIVITY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{t(`tools.${opt.key}`)}</option>)}
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full md:w-auto justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
          >
            {isLoading ? (
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('tools.generating')}
                </div>
            ) : t('tools.generateChecklist')}
          </button>
        </form>
      </div>

      {(checklist || error || isLoading) && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('tools.generatedChecklist')}</h3>
            {isLoading && (
                <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">{t('tools.generatingCustomized')}</div>
                </div>
            )}
            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 rounded-md">{error}</div>}
            {checklist && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-4 rounded-md font-sans text-gray-700 dark:text-gray-300">{checklist}</pre>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default ToolsView;