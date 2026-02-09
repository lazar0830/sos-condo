

import React from 'react';
import type { ServiceProvider, ServiceRequest, MaintenanceTask, Building, User } from '../types';
import { ServiceRequestStatus, UserRole } from '../types';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

interface ServiceProviderDetailViewProps {
  provider: ServiceProvider;
  requests: ServiceRequest[];
  tasks: MaintenanceTask[];
  buildings: Building[];
  onBack: () => void;
  onEditProvider: (provider: ServiceProvider) => void;
  onSelectRequest: (requestId: string) => void;
  onSaveProvider: (provider: ServiceProvider) => void;
  currentUser: User;
}

const statusColorMap: { [key in ServiceRequestStatus]: string } = {
    [ServiceRequestStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [ServiceRequestStatus.Accepted]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    [ServiceRequestStatus.Refused]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    [ServiceRequestStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [ServiceRequestStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

const ServiceProviderDetailView: React.FC<ServiceProviderDetailViewProps> = ({
  provider,
  requests,
  tasks,
  buildings,
  onBack,
  onEditProvider,
  onSelectRequest,
  onSaveProvider,
  currentUser,
}) => {
    
  const getRequestDetails = (request: ServiceRequest) => {
    const task = tasks.find(t => t.id === request.taskId);
    const building = buildings.find(b => b.id === task?.buildingId);
    return { task, building };
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const base64 = await fileToBase64(file);
        onSaveProvider({ ...provider, logoUrl: base64 });
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isAOverdue = a.scheduledDate && new Date(a.scheduledDate + 'T12:00:00Z') < today && a.status !== ServiceRequestStatus.Completed;
    const isBOverdue = b.scheduledDate && new Date(b.scheduledDate + 'T12:00:00Z') < today && b.status !== ServiceRequestStatus.Completed;
    if (isAOverdue && !isBOverdue) return -1;
    if (!isAOverdue && isBOverdue) return 1;
    if (a.isUrgent && !b.isUrgent) return -1;
    if (!a.isUrgent && b.isUrgent) return 1;
    return new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime();
  });

  return (
    <div className="space-y-8">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 mb-6">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            Back to All Providers
        </button>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start space-x-0 sm:space-x-6">
                <div className="relative group flex-shrink-0">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                        {provider.logoUrl ? (
                            <img src={provider.logoUrl} alt={`${provider.name} logo`} className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" />
                        ) : (
                            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <svg className="h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.51.056 1.02.086 1.5.086 1.818 0 3.558-.59 4.9-1.586m-1.54 6.362a9.094 9.094 0 01-1.54-.298m-9.456 0a9.094 9.094 0 01-1.54.298m7.533-3.467a9.094 9.094 0 00-3.022.217m-1.01-1.498a9.094 9.094 0 00-2.218.42m12.333a9.094 9.094 0 00-3.48-1.79a4.5 4.5 0 10-8.108 3.582M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-lg transition-opacity duration-300">
                            <svg className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
                            </svg>
                        </div>
                    </label>
                    <input id="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <div className="flex-grow mt-4 sm:mt-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 mb-2">{provider.specialty}</span>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400">{provider.name}</h2>
                        </div>
                        {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin || provider.createdBy === currentUser.id) && (
                          <button
                              onClick={() => onEditProvider(provider)}
                              className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                          >
                              <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                              </svg>
                              Edit
                          </button>
                        )}
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                            <a href={`mailto:${provider.email}`} className="hover:text-primary-600 dark:hover:text-primary-400 truncate">{provider.email}</a>
                        </div>
                        {provider.phone && (
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.067a1.5 1.5 0 01-1.17 1.734l-1.056.352a1.5 1.5 0 00-1.176 1.734l.716 3.067a1.5 1.5 0 01-1.17 1.734l-1.056.352a1.5 1.5 0 00-1.176 1.734l.716 3.067A1.5 1.5 0 013.5 18h1.148a1.5 1.5 0 011.465-1.175l.716-3.067a1.5 1.5 0 011.17-1.734l1.056-.352a1.5 1.5 0 001.176-1.734l-.716-3.067a1.5 1.5 0 011.17-1.734l1.056-.352a1.5 1.5 0 001.176-1.734l-.716-3.067A1.5 1.5 0 0115.352 2H16.5A1.5 1.5 0 0118 3.5v13a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 16.5v-13z" /></svg>
                            <span>{provider.phone}</span>
                        </div>
                        )}
                        {provider.contactPerson && (
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.99 9.99 0 0010 12c-2.31 0-4.438.784-6.131 2.095z" /></svg>
                            <span>Contact: <strong>{provider.contactPerson}</strong></span>
                        </div>
                        )}
                        {provider.website && (
                            <div className="flex items-center">
                                <svg className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.572 2.098a.75.75 0 01.956-.317l4.5 1.5a.75.75 0 010 1.438l-4.5 1.5a.75.75 0 01-.956-.317L10.5 2.098l2.072-4.29zM3.5 12a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM4.75 14.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM6.25 11.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM7.5 15a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM9.25 10.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zM12.5 10a.75.75 0 000-1.5H3.75a.75.75 0 000 1.5h8.75zM3.75 16.5a.75.75 0 000-1.5h5.5a.75.75 0 000 1.5h-5.5z" clipRule="evenodd" />
                                <path d="M10 20a10 10 0 110-20 10 10 0 010 20zM9 4.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" />
                                </svg>
                                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 dark:hover:text-primary-400 truncate">{provider.website}</a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Assigned Service Requests</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Task</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scheduled Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedRequests.length > 0 ? sortedRequests.map(request => {
                            const { building, task } = getRequestDetails(request);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const isOverdue = request.scheduledDate && new Date(request.scheduledDate + 'T12:00:00Z') < today && request.status !== ServiceRequestStatus.Completed;
                            return (
                                <tr key={request.id} onClick={() => onSelectRequest(request.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{building?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center space-x-2">
                                            <span>{task?.name || 'N/A'}</span>
                                            {isOverdue && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">Overdue</span>
                                            )}
                                            {request.isUrgent && !isOverdue && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">Urgent</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.scheduledDate ? new Date(request.scheduledDate + 'T12:00:00Z').toLocaleDateString() : 'Not set'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[request.status]}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} className="text-center py-10">
                                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">No Service Requests Found</h4>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">This provider has no assigned requests.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ServiceProviderDetailView;