

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceProvider, ServiceRequest, MaintenanceTask, Building, User } from '../types';
import { ServiceRequestStatus, UserRole } from '../types';
import { SPECIALTY_TO_I18N_KEY, SERVICE_REQUEST_STATUS_TO_I18N_KEY } from '../constants';
import { uploadProviderLogo } from '../services/storageService';

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
  onChangePassword?: (provider: ServiceProvider) => void;
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
  onChangePassword,
}) => {
  const { t } = useTranslation();
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
    
  const getRequestDetails = (request: ServiceRequest) => {
    const task = tasks.find(t => t.id === request.taskId);
    const building = buildings.find(b => b.id === task?.buildingId);
    return { task, building };
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setLogoUploading(true);
    setLogoError(null);
    try {
      const url = await uploadProviderLogo(file, provider.id);
      onSaveProvider({ ...provider, logoUrl: url });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setLogoError(['imageTypeInvalid', 'imageSizeTooLarge'].includes(msg) ? msg : 'imageUploadFailed');
    } finally {
      setLogoUploading(false);
      e.target.value = '';
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
            {t('serviceProviderDetail.backToAllProviders')}
        </button>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start space-x-0 sm:space-x-6">
                <div className="flex-shrink-0">
                    <div className="relative group">
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
                    <input id="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp, image/gif" onChange={handleLogoUpload} disabled={logoUploading} />
                    {logoUploading && <span className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg text-white text-sm">{t('modals.editBuilding.uploading')}</span>}
                    </div>
                    {logoError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{t(`modals.editBuilding.${logoError}`)}</p>}
                </div>
                <div className="flex-grow mt-4 sm:mt-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300 mb-2">{SPECIALTY_TO_I18N_KEY[provider.specialty] ? t(`modals.editTask.${SPECIALTY_TO_I18N_KEY[provider.specialty]}`) : provider.specialty}</span>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400">{provider.name}</h2>
                        </div>
                        <div className="flex items-center space-x-2">
                          {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin || provider.createdBy === currentUser.id) && (
                            <>
                              {provider.userId && onChangePassword && (currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.Admin) && (
                                <button
                                    onClick={() => onChangePassword(provider)}
                                    className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-blue-400 dark:hover:bg-gray-600"
                                >
                                    <svg className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                                    </svg>
                                    {t('serviceProviderDetail.changePassword')}
                                </button>
                              )}
                              <button
                                  onClick={() => onEditProvider(provider)}
                                  className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                              >
                                  <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                  </svg>
                                  {t('serviceProviderDetail.edit')}
                              </button>
                            </>
                          )}
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                            <a href={`mailto:${provider.email}`} className="hover:text-primary-600 dark:hover:text-primary-400 truncate">{provider.email}</a>
                        </div>
                        {provider.phone && (
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{provider.phone}</span>
                        </div>
                        )}
                        {provider.contactPerson && (
                        <div className="flex items-center">
                            <svg className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.99 9.99 0 0010 12c-2.31 0-4.438.784-6.131 2.095z" /></svg>
                            <span>{t('serviceProviderDetail.contact')}: <strong>{provider.contactPerson}</strong></span>
                        </div>
                        )}
                        {provider.website && (
                            <div className="flex items-center">
                                {/* Light mode: outline globe */}
                                <svg
                                  className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0 dark:hidden"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                </svg>
                                {/* Dark mode: filled globe */}
                                <svg
                                  className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0 hidden dark:block"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                >
                                  <path d="M21.721 12.752a9.711 9.711 0 0 0-.945-5.003 12.754 12.754 0 0 1-4.339 2.708 18.991 18.991 0 0 1-.214 4.772 17.165 17.165 0 0 0 5.498-2.477ZM14.634 15.55a17.324 17.324 0 0 0 .332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 0 0 .332 4.647 17.385 17.385 0 0 0 5.268 0ZM9.772 17.119a18.963 18.963 0 0 0 4.456 0A17.182 17.182 0 0 1 12 21.724a17.18 17.18 0 0 1-2.228-4.605ZM7.777 15.23a18.87 18.87 0 0 1-.214-4.774 12.753 12.753 0 0 1-4.34-2.708 9.711 9.711 0 0 0-.944 5.004 17.165 17.165 0 0 0 5.498 2.477ZM21.356 14.752a9.765 9.765 0 0 1-7.478 6.817 18.64 18.64 0 0 0 1.988-4.718 18.627 18.627 0 0 0 5.49-2.098ZM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 0 0 1.988 4.718 9.765 9.765 0 0 1-7.478-6.816ZM13.878 2.43a9.755 9.755 0 0 1 6.116 3.986 11.267 11.267 0 0 1-3.746 2.504 18.63 18.63 0 0 0-2.37-6.49ZM12 2.276a17.152 17.152 0 0 1 2.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0 1 12 2.276ZM10.122 2.43a18.629 18.629 0 0 0-2.37 6.49 11.266 11.266 0 0 1-3.746-2.504 9.754 9.754 0 0 1 6.116-3.985Z" />
                                </svg>
                                <a
                                  href={provider.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:text-primary-600 dark:hover:text-primary-400 truncate"
                                >
                                  {provider.website}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('serviceProviderDetail.assignedServiceRequests')}</h3>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceProviderDetail.tableProperty')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceProviderDetail.tableTask')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceProviderDetail.tableScheduledDate')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('serviceProviderDetail.tableStatus')}</th>
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
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">{t('serviceProviderDetail.overdue')}</span>
                                            )}
                                            {request.isUrgent && !isOverdue && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">{t('serviceProviderDetail.urgent')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.scheduledDate ? new Date(request.scheduledDate + 'T12:00:00Z').toLocaleDateString() : t('serviceProviderDetail.notSet')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[request.status]}`}>
                                            {SERVICE_REQUEST_STATUS_TO_I18N_KEY[request.status] ? t(`serviceRequests.${SERVICE_REQUEST_STATUS_TO_I18N_KEY[request.status]}`) : request.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={4} className="text-center py-10">
                                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">{t('serviceProviderDetail.noServiceRequestsFound')}</h4>
                                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('serviceProviderDetail.noAssignedRequests')}</p>
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