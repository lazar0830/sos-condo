
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generateTurnoverChecklist } from '../services/geminiService';
import type { ServiceRequest, MaintenanceTask, ServiceProvider, User } from '../types';
import { UserRole } from '../types';

const ACTIVITY_OPTIONS: { value: string; key: string }[] = [
  { value: 'New Tenant Move-in', key: 'activityNewTenantMoveIn' },
  { value: 'Tenant Move-out', key: 'activityTenantMoveOut' },
  { value: 'Routine Inspection', key: 'activityRoutineInspection' },
  { value: 'Painting', key: 'activityPainting' },
  { value: 'Appliance Upgrade', key: 'activityApplianceUpgrade' },
];

interface ToolsViewProps {
  serviceRequests?: ServiceRequest[];
  tasks?: MaintenanceTask[];
  providers?: ServiceProvider[];
  onDeleteOrphanedRequests?: (requestIds: string[]) => Promise<void>;
  currentUser?: User | null;
  onSendTaskReminderNow?: () => Promise<{ success: boolean; emailsSent?: number; tasksFound?: number; error?: string } | null>;
}

const ToolsView: React.FC<ToolsViewProps> = ({ serviceRequests = [], tasks = [], providers = [], onDeleteOrphanedRequests, currentUser, onSendTaskReminderNow }) => {
  const { t } = useTranslation();
  const [unitNumber, setUnitNumber] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [activityType, setActivityType] = useState('New Tenant Move-in');
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState('');
  const [error, setError] = useState('');
  
  // Cleanup utility state
  const [isCleanupLoading, setIsCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{ success: boolean; message: string } | null>(null);

  // Task reminder (30-day) test
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderResult, setReminderResult] = useState<{ success: boolean; emailsSent?: number; tasksFound?: number; error?: string } | null>(null);
  const canRunReminder = currentUser && currentUser.role === UserRole.SuperAdmin && onSendTaskReminderNow;
  const handleSendReminderNow = async () => {
    if (!onSendTaskReminderNow) return;
    setReminderLoading(true);
    setReminderResult(null);
    try {
      const result = await onSendTaskReminderNow();
      setReminderResult(result ?? { success: false, error: 'No result' });
    } catch (err) {
      setReminderResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setReminderLoading(false);
    }
  };

  // Find orphaned service requests
  const orphanedRequests = useMemo(() => {
    const taskIds = new Set(tasks.map(t => t.id));
    const providerIds = new Set(providers.map(p => p.id));
    
    return serviceRequests.filter(sr => {
      const hasValidTask = taskIds.has(sr.taskId);
      const hasValidProvider = providerIds.has(sr.providerId);
      return !hasValidTask || !hasValidProvider;
    }).map(sr => ({
      ...sr,
      missingTask: !taskIds.has(sr.taskId),
      missingProvider: !providerIds.has(sr.providerId),
    }));
  }, [serviceRequests, tasks, providers]);

  const handleCleanup = async () => {
    if (!onDeleteOrphanedRequests || orphanedRequests.length === 0) return;
    
    setIsCleanupLoading(true);
    setCleanupResult(null);
    
    try {
      await onDeleteOrphanedRequests(orphanedRequests.map(r => r.id));
      setCleanupResult({ 
        success: true, 
        message: t('tools.cleanupSuccess', { count: orphanedRequests.length }) 
      });
    } catch (err) {
      setCleanupResult({ 
        success: false, 
        message: t('tools.cleanupError') 
      });
    } finally {
      setIsCleanupLoading(false);
    }
  };

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

      {/* Data Cleanup Utility */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-1">
          <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('tools.dataCleanup')}</h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('tools.dataCleanupDescription')}</p>

        {orphanedRequests.length === 0 ? (
          <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-700 dark:text-green-300 font-medium">{t('tools.noOrphanedData')}</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span className="font-semibold text-amber-800 dark:text-amber-200">
                  {t('tools.orphanedRequestsFound', { count: orphanedRequests.length })}
                </span>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">{t('tools.orphanedRequestsHint')}</p>
            </div>

            {/* List orphaned requests */}
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('tools.requestId')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('tools.issue')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('tools.createdAt')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {orphanedRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono">{req.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {req.missingTask && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                              {t('tools.missingTask')}
                            </span>
                          )}
                          {req.missingProvider && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300">
                              {t('tools.missingProvider')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {req.sentAt ? new Date(req.sentAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cleanup button */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('tools.cleanupWarning')}</p>
              <button
                onClick={handleCleanup}
                disabled={isCleanupLoading || !onDeleteOrphanedRequests}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 dark:disabled:bg-red-800 flex items-center space-x-2"
              >
                {isCleanupLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('tools.cleaning')}</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <span>{t('tools.deleteOrphanedRequests', { count: orphanedRequests.length })}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Cleanup result message */}
        {cleanupResult && (
          <div className={`mt-4 p-3 rounded-md ${cleanupResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300'}`}>
            {cleanupResult.message}
          </div>
        )}
      </div>

      {/* 30-day task reminder (test) - Admin / Super Admin only */}
      {canRunReminder && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-1">
            <svg className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('tools.taskReminder')}</h3>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('tools.taskReminderDescription')}</p>
          <button
            type="button"
            onClick={handleSendReminderNow}
            disabled={reminderLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {reminderLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('tools.reminderSending')}</span>
              </>
            ) : (
              t('tools.sendReminderNow')
            )}
          </button>
          {reminderResult && (
            <div className={`mt-4 p-3 rounded-md ${reminderResult.success ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300'}`}>
              {reminderResult.success
                ? (reminderResult.tasksFound === 0
                  ? t('tools.reminderNoTasks')
                  : t('tools.reminderSuccess', { emailsSent: reminderResult.emailsSent ?? 0, tasksFound: reminderResult.tasksFound ?? 0 }))
                : t('tools.reminderError', { message: reminderResult.error ?? '' })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolsView;