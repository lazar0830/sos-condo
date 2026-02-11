

import React, { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Component, Building, MaintenanceTask, ServiceProvider, ServiceRequest } from '../types';
import { ServiceRequestStatus, Recurrence, TaskStatus } from '../types';
import ConfirmationModal from './ConfirmationModal';
import CreateRequestModal from './CreateRequestModal';

interface ComponentDetailViewProps {
  component: Component;
  building?: Building;
  tasks: MaintenanceTask[];
  serviceRequests: ServiceRequest[];
  providers: ServiceProvider[];
  onBack: () => void;
  onEditComponent: (component: Component) => void;
  onAddImage: (componentId: string, files: FileList) => void;
  onDeleteImage: (componentId: string, imageId: string) => void;
  onDeleteComponent: (componentId: string) => void;
  onOpenTaskModal: (task: MaintenanceTask | null, buildingId?: string | null, componentId?: string | null) => void;
  onSelectRequest: (requestId: string) => void;
  onAddServiceRequest: (request: Omit<ServiceRequest, 'id' | 'comments' | 'documents' | 'statusHistory'>) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || <span className="text-gray-400 dark:text-gray-500">N/A</span>}</p>
  </div>
);

const serviceRequestStatusColorMap: { [key in ServiceRequestStatus]: string } = {
    [ServiceRequestStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [ServiceRequestStatus.Accepted]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    [ServiceRequestStatus.Refused]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    [ServiceRequestStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [ServiceRequestStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

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

const taskStatusColorMap: { [key in TaskStatus]: string } = {
  [TaskStatus.New]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  [TaskStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  [TaskStatus.OnHold]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  [TaskStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

const recurrenceColorMap: { [key: string]: string } = {
  'One-Time': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  'Weekly': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  'Bi-Weekly': 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
  'Monthly': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Quarterly': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  'Semi-Annually': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  'Annually': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};


const ComponentDetailView: React.FC<ComponentDetailViewProps> = ({
  component,
  building,
  tasks,
  serviceRequests,
  providers,
  onBack,
  onEditComponent,
  onAddImage,
  onDeleteImage,
  onDeleteComponent,
  onOpenTaskModal,
  onSelectRequest,
  onAddServiceRequest,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  const componentServiceRequests = useMemo(() => {
    const taskIds = tasks.map(t => t.id);
    return serviceRequests
      .filter(sr => taskIds.includes(sr.taskId))
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }, [tasks, serviceRequests]);

  const getProviderName = (providerId: string) => providers.find(p => p.id === providerId)?.name || 'N/A';
  const getTaskName = (taskId: string) => tasks.find(t => t.id === taskId)?.name || 'N/A';

  const handleConfirmDelete = () => {
    onDeleteComponent(component.id);
    setIsConfirmingDelete(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddImage(component.id, e.target.files);
      // Reset the input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  const handleCreateRequestClick = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setIsCreateRequestModalOpen(true);
  };

  if (!component) {
    return <div>Component not found.</div>;
  }

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        {t('componentDetail.backToAllComponents')}
      </button>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400">{component.name}</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">
              {building?.name}{component.location && ` — ${component.location}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
                onClick={() => onEditComponent(component)}
                className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
                <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                </svg>
                {t('componentDetail.edit')}
            </button>
            <button
                onClick={() => setIsConfirmingDelete(true)}
                className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
                {t('componentDetail.delete')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 pb-3 border-b dark:border-gray-700">{t('componentDetail.details')}</h3>
            <dl className="space-y-4">
              <DetailItem label={t('componentDetail.type')} value={component.type} />
              <DetailItem label={t('componentDetail.category')} value={`${component.parentCategory} / ${component.subCategory}`} />
              <DetailItem label={t('componentDetail.brand')} value={component.brand} />
              <DetailItem label={t('componentDetail.modelNumber')} value={component.modelNumber} />
              <DetailItem label={t('componentDetail.serialNumber')} value={component.serialNumber} />
              <DetailItem label={t('componentDetail.installationDate')} value={component.installationDate ? new Date(component.installationDate + 'T12:00:00Z').toLocaleDateString() : null} />
              <DetailItem label={t('componentDetail.warrantyEndDate')} value={component.warrantyEndDate ? new Date(component.warrantyEndDate + 'T12:00:00Z').toLocaleDateString() : null} />
            </dl>
          </div>
           {component.notes && (
             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{t('componentDetail.notes')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{component.notes}</p>
             </div>
           )}
        </div>
        
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('componentDetail.images')}</h3>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {t('componentDetail.addImages')}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/gif"
                        multiple
                    />
                </div>
                {component.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {component.images.map(image => (
                            <div key={image.id} className="relative group aspect-square">
                                <img src={image.url} alt={image.caption || `Component image ${image.id}`} className="w-full h-full object-cover rounded-md border dark:border-gray-700" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors flex items-center justify-center rounded-md">
                                    <button
                                        onClick={() => onDeleteImage(component.id, image.id)}
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
                ) : (
                    <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mt-2">{t('componentDetail.noImagesYet')}</h4>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('componentDetail.addImagesHint')}</p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('componentDetail.associatedMaintenance')}</h3>
                    <button
                        onClick={() => onOpenTaskModal(null, component.buildingId, component.id)}
                        className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {t('componentDetail.addTask')}
                    </button>
                </div>
                 {tasks.length > 0 ? (
                    <div className="space-y-4">
                        {tasks.map(task => {
                            const isMasterRecurring = task.recurrence !== Recurrence.OneTime;
                            const taskServiceRequests = componentServiceRequests.filter(sr => sr.taskId === task.id);
                            const provider = providers.find(p => p.id === task.providerId);
                            
                            return (
                                <div key={task.id} className="p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex flex-col md:flex-row justify-between">
                                        <div onClick={() => onOpenTaskModal(task, component.buildingId, component.id)} className="cursor-pointer flex-grow">
                                            <div className="flex items-center space-x-3 mb-2 flex-wrap gap-y-2">
                                                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{task.name}</h4>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${taskStatusColorMap[task.status]}`}>{task.status}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${recurrenceColorMap[task.recurrence]}`}>{task.recurrence}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecialtyColor(task.specialty)}`}>{task.specialty}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm">{task.description}</p>
                                            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-4 flex-wrap">
                                                {provider && <span>{t('componentDetail.provider')} <strong>{provider.name}</strong></span>}
                                                {task.cost != null && <span>{t('componentDetail.cost')} <strong>${task.cost.toFixed(2)}</strong></span>}
                                                {task.taskDate && <span className="font-semibold">{t('componentDetail.date')} {new Date(task.taskDate + 'T12:00:00Z').toLocaleDateString()}</span>}
                                                {isMasterRecurring && task.startDate && task.endDate && <span className="font-semibold">{t('componentDetail.range')} {new Date(task.startDate + 'T12:00:00Z').toLocaleDateString()} {t('componentDetail.to')} {new Date(task.endDate + 'T12:00:00Z').toLocaleDateString()}</span>}
                                            </div>
                                            {taskServiceRequests.length > 0 && (
                                                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                {t('componentDetail.serviceRequestsSent', { count: taskServiceRequests.length })}
                                                </div>
                                            )}
                                        </div>
                                        {!isMasterRecurring && (
                                            <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0 self-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleCreateRequestClick(task); }}
                                                    className="w-full md:w-auto px-3 py-2 text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-900"
                                                >
                                                    {t('componentDetail.createServiceRequest')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                     <div className="text-center py-6">
                        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">{t('componentDetail.noLinkedTasks')}</h4>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('componentDetail.noLinkedTasksHint')}</p>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('componentDetail.associatedServiceRequests')}</h3>
                {componentServiceRequests.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('componentDetail.tableTask')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('componentDetail.tableProvider')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('componentDetail.tableScheduled')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('componentDetail.tableStatus')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {componentServiceRequests.map(request => (
                        <tr key={request.id} onClick={() => onSelectRequest(request.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{getTaskName(request.taskId)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getProviderName(request.providerId)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.scheduledDate ? new Date(request.scheduledDate + 'T12:00:00Z').toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${serviceRequestStatusColorMap[request.status]}`}>{request.status}</span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                ) : (
                <div className="text-center py-6">
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">{t('componentDetail.noServiceRequests')}</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{t('componentDetail.noServiceRequestsHint')}</p>
                </div>
                )}
            </div>

        </div>
      </div>

      {isConfirmingDelete && (
        <ConfirmationModal
          isOpen={isConfirmingDelete}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={handleConfirmDelete}
          title={t('componentDetail.confirmDeletionTitle')}
          message={t('componentDetail.confirmDeletionMessage', { name: component.name })}
          confirmButtonText={t('componentDetail.deleteComponent')}
        />
      )}
      {isCreateRequestModalOpen && selectedTask && building && (
        <CreateRequestModal
            building={building}
            task={selectedTask}
            providers={providers}
            onClose={() => setIsCreateRequestModalOpen(false)}
            onAddServiceRequest={onAddServiceRequest}
        />
      )}
    </div>
  );
};

export default ComponentDetailView;