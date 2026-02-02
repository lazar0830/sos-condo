

import React, { useRef, useMemo, useState } from 'react';
import type { Unit, Building, Component, MaintenanceTask, ServiceRequest, ServiceProvider } from '../types';
import CreateRequestModal from './CreateRequestModal';
import { ServiceRequestStatus, TaskStatus } from '../types';

interface UnitDetailViewProps {
  unit: Unit;
  building: Building;
  components: Component[];
  tasks: MaintenanceTask[];
  serviceRequests: ServiceRequest[];
  providers: ServiceProvider[];
  onBack: () => void;
  onOpenUnitModal: (unit: Unit | null, buildingId: string) => void;
  onAddUnitImages: (unitId: string, files: FileList) => void;
  onDeleteUnitImage: (unitId: string, imageId: string) => void;
  onSelectComponent: (componentId: string) => void;
  onSelectRequest: (requestId: string) => void;
  onOpenTaskModal: (task: MaintenanceTask | null, buildingId: string) => void;
  onAddServiceRequest: (request: Omit<ServiceRequest, 'id' | 'comments' | 'documents' | 'statusHistory'>) => void;
}

const DetailItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{value || <span className="text-gray-400 dark:text-gray-500">N/A</span>}</p>
    </div>
);

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

// FIX: An object literal cannot have multiple properties with the same name.
// The `TaskStatus` and `ServiceRequestStatus` enums share member string values for 'Sent' and 'Completed',
// which causes duplicate keys in the object literal. The duplicate properties have been removed.
const statusColorMap: { [key in ServiceRequestStatus | TaskStatus]: string } = {
    [TaskStatus.New]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    [TaskStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [TaskStatus.OnHold]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [TaskStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [ServiceRequestStatus.Accepted]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    [ServiceRequestStatus.Refused]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    [ServiceRequestStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
};


const UnitDetailView: React.FC<UnitDetailViewProps> = ({ 
    unit, building, components, tasks, serviceRequests, providers, onBack, 
    onOpenUnitModal, onAddUnitImages, onDeleteUnitImage, onSelectComponent, onSelectRequest,
    onOpenTaskModal, onAddServiceRequest
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [taskForRequest, setTaskForRequest] = useState<MaintenanceTask | null>(null);
  const [isCreateRequestModalOpen, setIsCreateRequestModalOpen] = useState(false);
  
  const unitComponents = useMemo(() => components.filter(c => c.unitId === unit.id), [components, unit.id]);
  const unitTasks = useMemo(() => tasks.filter(t => t.unitId === unit.id), [tasks, unit.id]);
  const unitTaskIds = useMemo(() => new Set(unitTasks.map(t => t.id)), [unitTasks]);
  const unitServiceRequests = useMemo(() => serviceRequests.filter(sr => unitTaskIds.has(sr.taskId)), [serviceRequests, unitTaskIds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddUnitImages(unit.id, e.target.files);
      e.target.value = '';
    }
  };

  const handleCreateRequestClick = (task: MaintenanceTask) => {
    setTaskForRequest(task);
    setIsCreateRequestModalOpen(true);
  };
  
  const buildingForRequest = taskForRequest ? building : null;

  const getProviderName = (providerId: string) => providers.find(p => p.id === providerId)?.name || 'N/A';
  const getTaskName = (taskId: string) => tasks.find(t => t.id === taskId)?.name || 'N/A';

  return (
    <>
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        Back to {building.name}
      </button>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400">Unit {unit.unitNumber}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{building.name} - {building.address}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Occupant</h3>
                    <button onClick={() => onOpenUnitModal(unit, building.id)} className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">
                        {unit.occupant ? 'Edit' : 'Add'}
                    </button>
                </div>
                {unit.occupant ? (
                    <dl className="space-y-4">
                        <DetailItem label="Name" value={unit.occupant.name} />
                        <DetailItem label="Occupant Type" value={unit.occupant.type} />
                        <DetailItem label="Start Date" value={unit.occupant.startDate ? new Date(unit.occupant.startDate + 'T12:00:00Z').toLocaleDateString() : null} />
                        <DetailItem label="End Date" value={unit.occupant.endDate ? new Date(unit.occupant.endDate + 'T12:00:00Z').toLocaleDateString() : null} />
                    </dl>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No occupant information has been added.</p>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Images</h3>
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300">Upload</button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" multiple/>
                </div>
                 {unit.images && unit.images.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {unit.images.map(image => (
                            <div key={image.id} className="relative group aspect-square">
                                <img src={image.url} alt={`Unit image ${image.id}`} className="w-full h-full object-cover rounded-md border dark:border-gray-700" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors flex items-center justify-center rounded-md">
                                    <button onClick={() => onDeleteUnitImage(unit.id, image.id)} className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete image">
                                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No images uploaded.</p>
                )}
            </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Components in this Unit</h3>
                {unitComponents.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {unitComponents.map(c => (
                            <li key={c.id} onClick={() => onSelectComponent(c.id)} className="py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-6 px-6">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{c.parentCategory} / {c.subCategory}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No components assigned to this unit.</p>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Maintenance Tasks</h3>
                    <button onClick={() => onOpenTaskModal(null, building.id)} className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">
                        Add New Task
                    </button>
                </div>
                {unitTasks.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 -mx-6">
                        {unitTasks.map(t => (
                            <li key={t.id} className="py-3 px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex justify-between items-start cursor-pointer" onClick={() => onOpenTaskModal(t, building.id)}>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.description}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {t.taskDate ? new Date(t.taskDate + 'T12:00:00Z').toLocaleDateString() : 'Recurring'}
                                        </p>
                                        <p className="text-xs">
                                            <span className={`px-2 py-0.5 rounded-full ${getSpecialtyColor(t.specialty)}`}>{t.specialty}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 text-right">
                                    <button onClick={() => handleCreateRequestClick(t)} className="px-3 py-1 text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none dark:bg-primary-900/50 dark:text-primary-300 dark:hover:bg-primary-900">
                                        Create Service Request
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned to this unit.</p>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Service Requests</h3>
                {unitServiceRequests.length > 0 ? (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700 -mx-6">
                        {unitServiceRequests.map(sr => (
                            <li key={sr.id} onClick={() => onSelectRequest(sr.id)} className="py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 px-6 transition-colors">
                                 <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getTaskName(sr.taskId)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">To: {getProviderName(sr.providerId)}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {sr.scheduledDate ? new Date(sr.scheduledDate + 'T12:00:00Z').toLocaleDateString() : new Date(sr.sentAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[sr.status]}`}>{sr.status}</span>
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No service requests for this unit.</p>
                )}
            </div>
        </div>
      </div>
    </div>
    {isCreateRequestModalOpen && taskForRequest && buildingForRequest && (
        <CreateRequestModal
          building={buildingForRequest}
          task={taskForRequest}
          providers={providers}
          onClose={() => setIsCreateRequestModalOpen(false)}
          onAddServiceRequest={onAddServiceRequest}
        />
    )}
    </>
  );
};

export default UnitDetailView;