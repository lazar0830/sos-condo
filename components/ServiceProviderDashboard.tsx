

import React from 'react';
import type { ServiceRequest, MaintenanceTask, Building } from '../types';
import { ServiceRequestStatus } from '../types';

interface ServiceProviderDashboardProps {
  requests: ServiceRequest[];
  tasks: MaintenanceTask[];
  buildings: Building[];
  onUpdateRequestStatus: (id: string, status: ServiceRequestStatus) => void;
  onSelectRequest: (id: string) => void;
}

const specialtyColors = ['bg-sky-100 text-sky-800','bg-amber-100 text-amber-800','bg-rose-100 text-rose-800','bg-fuchsia-100 text-fuchsia-800','bg-cyan-100 text-cyan-800','bg-lime-100 text-lime-800','bg-violet-100 text-violet-800','bg-emerald-100 text-emerald-800','bg-indigo-100 text-indigo-800','bg-teal-100 text-teal-800','bg-pink-100 text-pink-800','bg-orange-100 text-orange-800'];
const getSpecialtyColor = (specialty: string) => {
  if (!specialty) return 'bg-gray-100 text-gray-800';
  let hash = 0;
  for (let i = 0; i < specialty.length; i++) {
    hash = specialty.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % specialtyColors.length);
  return specialtyColors[index];
};

const ServiceProviderDashboard: React.FC<ServiceProviderDashboardProps> = ({ requests, tasks, buildings, onUpdateRequestStatus, onSelectRequest }) => {
  const getRequestDetails = (request: ServiceRequest) => {
    const task = tasks.find(t => t.id === request.taskId);
    const building = buildings.find(b => b.id === task?.buildingId);
    return { task, building };
  };

  const statusColorMap: { [key in ServiceRequestStatus]: string } = {
    [ServiceRequestStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [ServiceRequestStatus.Accepted]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    [ServiceRequestStatus.Refused]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    [ServiceRequestStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [ServiceRequestStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  };

  const sortedRequests = [...requests].sort((a, b) => {
    const dateA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : new Date(a.sentAt).getTime();
    const dateB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : new Date(b.sentAt).getTime();
    return dateA - dateB;
  });
  
  const ActionButtons: React.FC<{ request: ServiceRequest }> = ({ request }) => {
    const handleButtonClick = (e: React.MouseEvent, newStatus: ServiceRequestStatus) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        onUpdateRequestStatus(request.id, newStatus);
    };

    switch (request.status) {
        case ServiceRequestStatus.Sent:
            return (
                <>
                    <button onClick={(e) => handleButtonClick(e, ServiceRequestStatus.Accepted)} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700">Accept</button>
                    <button onClick={(e) => handleButtonClick(e, ServiceRequestStatus.Refused)} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Refuse</button>
                </>
            );
        case ServiceRequestStatus.Accepted:
            return (
                <>
                    <button onClick={(e) => handleButtonClick(e, ServiceRequestStatus.InProgress)} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600">Start Work</button>
                    <button onClick={(e) => handleButtonClick(e, ServiceRequestStatus.Completed)} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">Mark Completed</button>
                </>
            );
        case ServiceRequestStatus.InProgress:
            return (
                <button onClick={(e) => handleButtonClick(e, ServiceRequestStatus.Completed)} className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">Mark Completed</button>
            );
        default:
            return null; // No actions for Refused or Completed
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">My Service Requests</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">Here are the jobs assigned to you.</p>
      </div>

      {sortedRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRequests.map(request => {
            const { building, task } = getRequestDetails(request);
            return (
              <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <div onClick={() => onSelectRequest(request.id)} className="p-6 flex-grow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{building?.name || 'N/A'}</p>
                          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{task?.name || 'N/A'}</h3>
                      </div>
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[request.status]}`}>
                          {request.status}
                        </span>
                  </div>
                  <div className="mt-2 space-y-3 text-sm">
                      <div>
                          <p className="font-semibold text-gray-600 dark:text-gray-300">Scheduled Date</p>
                          <p className="text-gray-800 dark:text-gray-100">{request.scheduledDate 
                            ? new Date(request.scheduledDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                            : 'Not yet scheduled'
                          }</p>
                      </div>
                      <div>
                          <p className="font-semibold text-gray-600 dark:text-gray-300">Location</p>
                          <p className="text-gray-800 dark:text-gray-100">{building?.address || 'N/A'}</p>
                      </div>
                      <div>
                          <p className="font-semibold text-gray-600 dark:text-gray-300">Manager Notes</p>
                          <p className="text-gray-500 dark:text-gray-400 italic">{request.notes || 'No additional notes.'}</p>
                      </div>
                  </div>
                </div>
                {(request.status === ServiceRequestStatus.Sent || request.status === ServiceRequestStatus.Accepted || request.status === ServiceRequestStatus.InProgress) && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex items-center justify-end space-x-2">
                        <ActionButtons request={request} />
                    </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mt-2">No service requests assigned</h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1">You currently have no jobs in the system.</p>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderDashboard;