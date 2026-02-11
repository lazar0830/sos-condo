

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ServiceRequest, MaintenanceTask, Building, ServiceProvider, User, Comment, StatusChange } from '../types';
import { ServiceRequestStatus, UserRole } from '../types';
import { SERVICE_REQUEST_STATUSES } from '../constants';

interface ServiceRequestDetailViewProps {
  request: ServiceRequest;
  task?: MaintenanceTask;
  building?: Building;
  provider?: ServiceProvider;
  currentUser: User;
  onBack: () => void;
  onUpdateRequestStatus: (id: string, status: ServiceRequestStatus) => void;
  onAddComment: (requestId: string, text: string) => void;
  onEditRequest: (request: ServiceRequest) => void;
  onAddDocument: (requestId: string, file: File) => void;
  onDeleteDocument: (requestId: string, documentId: string) => void;
}

type ActivityItem = 
    | { type: 'comment'; date: string; data: Comment }
    | { type: 'status'; date: string; data: StatusChange };


const statusColorMap: { [key in ServiceRequestStatus]: string } = {
    [ServiceRequestStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [ServiceRequestStatus.Accepted]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
    [ServiceRequestStatus.Refused]: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    [ServiceRequestStatus.InProgress]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    [ServiceRequestStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

const ServiceRequestDetailView: React.FC<ServiceRequestDetailViewProps> = ({
  request,
  task,
  building,
  provider,
  currentUser,
  onBack,
  onUpdateRequestStatus,
  onAddComment,
  onEditRequest,
  onAddDocument,
  onDeleteDocument,
}) => {
    const { t } = useTranslation();
    const [newComment, setNewComment] = useState('');
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const combinedActivity = useMemo<ActivityItem[]>(() => {
        const comments: ActivityItem[] = (request.comments || []).map(c => ({ type: 'comment', date: c.createdAt, data: c }));
        const statusChanges: ActivityItem[] = (request.statusHistory || []).map(s => ({ type: 'status', date: s.changedAt, data: s }));
        return [...comments, ...statusChanges].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [request.comments, request.statusHistory]);

    if (!task || !building || !provider) {
        return (
            <div>
                <button onClick={onBack} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-800 mb-6">
                    &larr; {t('serviceRequestDetail.back')}
                </button>
                <p>{t('serviceRequestDetail.loading')}</p>
            </div>
        );
    }
    
    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            onAddComment(request.id, newComment.trim());
            setNewComment('');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onAddDocument(request.id, e.target.files[0]);
        }
    };

    const isProviderUser = currentUser.role === UserRole.ServiceProvider;

    return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        {t('serviceRequestDetail.backToAllRequests')}
      </button>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400">{task.name}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{building.name} - {building.address}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
            {/* --- Details Card --- */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('serviceRequestDetail.requestDetails')}</h3>
                    {!isProviderUser && (
                        <button
                            onClick={() => onEditRequest(request)}
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        >
                        {t('serviceRequestDetail.edit')}
                        </button>
                    )}
                </div>
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="font-semibold text-gray-600 dark:text-gray-300">{t('serviceRequestDetail.provider')}</label>
                        <p className="text-gray-800 dark:text-gray-100">{provider.name}</p>
                    </div>
                    {request.unitNumber && (
                        <div>
                            <label className="font-semibold text-gray-600 dark:text-gray-300">{t('serviceRequestDetail.unit')}</label>
                            <p className="text-gray-800 dark:text-gray-100">{request.unitNumber}</p>
                        </div>
                    )}
                    {request.componentName && (
                        <div>
                            <label className="font-semibold text-gray-600 dark:text-gray-300">{t('serviceRequestDetail.component')}</label>
                            <p className="text-gray-800 dark:text-gray-100">{request.componentName}</p>
                        </div>
                    )}
                    <div>
                        <label className="font-semibold text-gray-600 dark:text-gray-300">{t('serviceRequestDetail.scheduledDate')}</label>
                        <p className="text-gray-800 dark:text-gray-100">{request.scheduledDate ? new Date(request.scheduledDate + 'T12:00:00Z').toLocaleDateString() : t('serviceRequestDetail.notSet')}</p>
                    </div>
                    <div>
                        <label className="font-semibold text-gray-600 dark:text-gray-300">{t('serviceRequestDetail.estimatedCost')}</label>
                        <p className="text-gray-800 dark:text-gray-100">{request.cost ? `$${request.cost.toFixed(2)}` : 'N/A'}</p>
                    </div>
                     <div>
                        <label className="font-semibold text-gray-600 dark:text-gray-300">{t('serviceRequestDetail.status')}</label>
                        <select 
                            value={request.status} 
                            onChange={(e) => onUpdateRequestStatus(request.id, e.target.value as ServiceRequestStatus)}
                            className={`w-full mt-1 p-2 rounded-md text-xs font-medium border-transparent focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-transparent dark:border-transparent ${statusColorMap[request.status]}`}
                        >
                            {SERVICE_REQUEST_STATUSES.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

             {/* --- Documents Card --- */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('serviceRequestDetail.documents')}</h3>
                    <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300">
                        {t('serviceRequestDetail.upload')}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 </div>
                 <div className="space-y-2">
                    {request.documents && request.documents.length > 0 ? (
                        request.documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2 overflow-hidden">
                                    <svg className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-700 dark:text-primary-300 hover:underline truncate" title={doc.name}>
                                        {doc.name}
                                    </a>
                                </div>
                                <button onClick={() => onDeleteDocument(request.id, doc.id)} className="p-1 text-gray-400 hover:text-red-600 rounded-full">
                                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">{t('serviceRequestDetail.noDocuments')}</p>
                    )}
                 </div>
            </div>
        </div>

        {/* --- Comments and Activity Column --- */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('serviceRequestDetail.activityComments')}</h3>
            <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={t('serviceRequestDetail.commentPlaceholder')}
                    required
                ></textarea>
                <div className="flex justify-end mt-2">
                    <button type="submit" className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">
                        {t('serviceRequestDetail.postComment')}
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {combinedActivity.length > 0 ? (
                    combinedActivity.map((item, index) => {
                        if (item.type === 'comment') {
                            const comment = item.data;
                            return (
                                <div key={`comment-${comment.id}`} className="flex space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-bold text-gray-600 dark:text-gray-200 text-sm">
                                            {comment.authorName.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{comment.authorName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(comment.createdAt).toLocaleString()}</p>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{comment.text}</p>
                                    </div>
                                </div>
                            );
                        } else { // 'status'
                            const statusChange = item.data;
                            return (
                                <div key={`status-${index}`} className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                               <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                                        <strong>{statusChange.changedBy}</strong> {t('serviceRequestDetail.changedStatusTo')} <span className={`font-semibold px-1.5 py-0.5 rounded-md ${statusColorMap[statusChange.status]}`}>{statusChange.status}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{new Date(statusChange.changedAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        }
                    })
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('serviceRequestDetail.noActivity')}</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceRequestDetailView;