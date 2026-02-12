import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceRequest, MaintenanceTask, Building, ServiceProvider } from '../types';
import { ServiceRequestStatus } from '../types';
import { SERVICE_REQUEST_STATUSES } from '../constants';
import ConfirmationModal from './ConfirmationModal';

interface ServiceRequestsViewProps {
  requests: ServiceRequest[];
  tasks: MaintenanceTask[];
  buildings: Building[];
  providers: ServiceProvider[];
  onSelectRequest: (requestId: string) => void;
  onDeleteServiceRequest: (requestId: string) => void;
}

const specialtyColors = ['bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300','bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300','bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300','bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300','bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300','bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300','bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300','bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300','bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300','bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300','bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300','bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300'];
const getSpecialtyColor = (specialty: string) => {
  if (!specialty) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  let hash = 0;
  for (let i = 0; i < specialty.length; i++) {
    hash = specialty.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % specialtyColors.length);
  return specialtyColors[index];
};

const statusToKey: Record<ServiceRequestStatus, string> = {
  [ServiceRequestStatus.Sent]: 'statusSent',
  [ServiceRequestStatus.Accepted]: 'statusAccepted',
  [ServiceRequestStatus.Refused]: 'statusRefused',
  [ServiceRequestStatus.InProgress]: 'statusInProgress',
  [ServiceRequestStatus.Completed]: 'statusCompleted',
};

interface Filters {
  selectedBuildingIds: string[];
  selectedProviderIds: string[];
  selectedStatuses: ServiceRequestStatus[];
}

const FilterPill: React.FC<{ onRemove: () => void, children: React.ReactNode }> = ({ onRemove, children }) => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-x-1.5 py-1.5 px-3 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
      {children}
      <button type="button" onClick={onRemove} className="flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-600 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-900 hover:text-primary-700 dark:hover:text-primary-200 focus:outline-none focus:bg-primary-700 focus:text-white">
        <span className="sr-only">{t('serviceRequests.removeFilter')}</span>
        <svg className="h-3 w-3" stroke="currentColor" fill="none" viewBox="0 0 8 8">
            <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
        </svg>
      </button>
    </span>
  );
};

const ServiceRequestsView: React.FC<ServiceRequestsViewProps> = ({ requests, tasks, buildings, providers, onSelectRequest, onDeleteServiceRequest }) => {
  const { t } = useTranslation();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [deletingRequest, setDeletingRequest] = useState<ServiceRequest | null>(null);
  const [filters, setFilters] = useState<Filters>({
    selectedBuildingIds: [],
    selectedProviderIds: [],
    selectedStatuses: [],
  });

  const getRequestDetails = (request: ServiceRequest) => {
    const task = tasks.find(t => t.id === request.taskId);
    const building = buildings.find(b => b.id === task?.buildingId);
    const provider = providers.find(p => p.id === request.providerId);
    return { task, building, provider };
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
        const { task } = getRequestDetails(request);
        if (!task) return false;

        if (filters.selectedBuildingIds.length > 0 && !filters.selectedBuildingIds.includes(task.buildingId)) {
            return false;
        }
        if (filters.selectedProviderIds.length > 0 && !filters.selectedProviderIds.includes(request.providerId)) {
            return false;
        }
        if (filters.selectedStatuses.length > 0 && !filters.selectedStatuses.includes(request.status)) {
            return false;
        }
        return true;
    });
  }, [requests, filters, tasks]);

  const handleResetFilters = () => {
    setFilters({
      selectedBuildingIds: [],
      selectedProviderIds: [],
      selectedStatuses: [],
    });
    setFiltersVisible(false);
  };
  
  const handleMultiSelectChange = (key: keyof Filters, value: string) => {
    setFilters(prev => {
        const currentValues = prev[key] as string[];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        return { ...prev, [key]: newValues as any };
    });
  };

  const removeFilter = (key: keyof Filters, valueToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter(v => v !== valueToRemove)
    }));
  };

  const hasActiveFilters = 
    filters.selectedBuildingIds.length > 0 ||
    filters.selectedProviderIds.length > 0 ||
    filters.selectedStatuses.length > 0;

  const statusColorMap: { [key in ServiceRequestStatus]: string } = {
    [ServiceRequestStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [ServiceRequestStatus.Accepted]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    [ServiceRequestStatus.Refused]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    [ServiceRequestStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [ServiceRequestStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };

  const sortedRequests = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...filteredRequests].sort((a, b) => {
        const isAOverdue = a.scheduledDate && new Date(a.scheduledDate + 'T12:00:00Z') < today && a.status !== ServiceRequestStatus.Completed;
        const isBOverdue = b.scheduledDate && new Date(b.scheduledDate + 'T12:00:00Z') < today && b.status !== ServiceRequestStatus.Completed;

        if (isAOverdue && !isBOverdue) return -1;
        if (!isAOverdue && isBOverdue) return 1;
        
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;

        return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
    });
  }, [filteredRequests]);


  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('serviceRequests.title')}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{t('serviceRequests.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="w-full flex justify-between items-center text-left text-lg font-semibold text-gray-700 dark:text-gray-200"
        >
          <span>{t('serviceRequests.filterRequests')}</span>
          <svg className={`w-5 h-5 text-gray-500 transform transition-transform ${filtersVisible ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {filtersVisible && (
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('serviceRequests.byProperty')}</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {buildings.map(b => (
                      <div key={b.id} className="flex items-center">
                        <input id={`prop-${b.id}`} type="checkbox" checked={filters.selectedBuildingIds.includes(b.id)} onChange={() => handleMultiSelectChange('selectedBuildingIds', b.id)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                        <label htmlFor={`prop-${b.id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{b.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('serviceRequests.byProvider')}</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                    {providers.map(p => (
                      <div key={p.id} className="flex items-center">
                        <input id={`prov-${p.id}`} type="checkbox" checked={filters.selectedProviderIds.includes(p.id)} onChange={() => handleMultiSelectChange('selectedProviderIds', p.id)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                        <label htmlFor={`prov-${p.id}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{p.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('serviceRequests.byStatus')}</label>
                  <div className="space-y-2">
                    {SERVICE_REQUEST_STATUSES.map(s => (
                      <div key={s} className="flex items-center">
                        <input id={`status-${s}`} type="checkbox" checked={filters.selectedStatuses.includes(s)} onChange={() => handleMultiSelectChange('selectedStatuses', s)} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                        <label htmlFor={`status-${s}`} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{t(`serviceRequests.${statusToKey[s]}`)}</label>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t dark:border-gray-700 flex justify-end">
                <button onClick={handleResetFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
                    {t('serviceRequests.resetAllFilters')}
                </button>
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="p-3 bg-primary-50/50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-500/30">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 mr-2">{t('serviceRequests.activeFilters')}</span>
                {filters.selectedBuildingIds.map(id => <FilterPill key={id} onRemove={() => removeFilter('selectedBuildingIds', id)}>{buildings.find(b=>b.id===id)?.name}</FilterPill>)}
                {filters.selectedProviderIds.map(id => <FilterPill key={id} onRemove={() => removeFilter('selectedProviderIds', id)}>{providers.find(p=>p.id===id)?.name}</FilterPill>)}
                {filters.selectedStatuses.map(s => <FilterPill key={s} onRemove={() => removeFilter('selectedStatuses', s)}>{t(`serviceRequests.${statusToKey[s]}`)}</FilterPill>)}
                <button onClick={handleResetFilters} className="text-sm text-primary-600 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 font-medium ml-auto px-2">
                    {t('serviceRequests.clearAll')}
                </button>
            </div>
        </div>
      )}


      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceRequests.property')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceRequests.task')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceRequests.specialty')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceRequests.provider')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceRequests.dateSent')}</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceRequests.status')}</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">{t('serviceRequests.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedRequests.length > 0 ? sortedRequests.map(request => {
                const { building, task, provider } = getRequestDetails(request);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = request.scheduledDate && new Date(request.scheduledDate + 'T12:00:00Z') < today && request.status !== ServiceRequestStatus.Completed;
                return (
                  <tr key={request.id} onClick={() => onSelectRequest(request.id)} className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/20' : request.isUrgent ? 'bg-amber-50/50 dark:bg-amber-900/20' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{building?.name || t('serviceRequests.unknown')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                         <div className="flex items-center space-x-2">
                            <span>{task?.name || t('serviceRequests.unknown')}</span>
                            {isOverdue && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">{t('serviceRequests.overdue')}</span>
                            )}
                            {request.isUrgent && !isOverdue && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">{t('serviceRequests.urgent')}</span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecialtyColor(request.specialty)}`}>{request.specialty}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{provider?.name || t('serviceRequests.unknown')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(request.sentAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[request.status]}`}>
                          {t(`serviceRequests.${statusToKey[request.status]}`)}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingRequest(request); }}
                        className="p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 rounded-full transition-colors"
                        aria-label={t('serviceRequests.deleteRequest')}
                      >
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              }              ) : (
                <tr>
                    <td colSpan={7} className="text-center py-10">
                        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">{t('serviceRequests.noRequestsFound')}</h4>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{hasActiveFilters ? t('serviceRequests.noRequestsFilterHint') : t('serviceRequests.noRequestsEmptyHint')}</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deletingRequest && (
        <ConfirmationModal
          isOpen={!!deletingRequest}
          onClose={() => setDeletingRequest(null)}
          onConfirm={() => {
            onDeleteServiceRequest(deletingRequest.id);
            setDeletingRequest(null);
          }}
          title={t('serviceRequests.confirmDeletion')}
          message={t('serviceRequests.confirmDeletionMessage', { name: tasks.find(t => t.id === deletingRequest.taskId)?.name || 'N/A' })}
          confirmButtonText={t('serviceRequests.deleteRequest')}
        />
      )}
    </div>
  );
};

export default ServiceRequestsView;