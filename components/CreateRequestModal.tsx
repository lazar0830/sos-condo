

import React, { useState } from 'react';
import type { Building, MaintenanceTask, ServiceProvider, ServiceRequest } from '../types';
import { ServiceRequestStatus } from '../types';
import { generateServiceRequestEmail } from '../services/geminiService';
import Modal from './Modal';

interface CreateRequestModalProps {
  building: Building;
  task: MaintenanceTask;
  providers: ServiceProvider[];
  onClose: () => void;
  // FIX: Corrected the onAddServiceRequest prop type to match the object being
  // created and passed by this component. The handler expects a request object
  // with a status, but without id, comments, documents, or statusHistory.
  onAddServiceRequest: (request: Omit<ServiceRequest, 'id' | 'comments' | 'documents' | 'statusHistory'>) => void;
  isForOverdueTask?: boolean;
}

const getTwoDaysFromNow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    return date.toISOString().split('T')[0];
};

const CreateRequestModal: React.FC<CreateRequestModalProps> = ({ building, task, providers, onClose, onAddServiceRequest, isForOverdueTask = false }) => {
  const [providerId, setProviderId] = useState(task.providerId || '');
  const [notes, setNotes] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(isForOverdueTask ? getTwoDaysFromNow() : (task.taskDate || ''));


  const handleGenerateEmail = async () => {
    const selectedProvider = providers.find(p => p.id === providerId);
    if (!selectedProvider) {
      alert("Please select a service provider.");
      return;
    }
    setIsLoading(true);
    const emailContent = await generateServiceRequestEmail(building, task, selectedProvider.name, notes, scheduledDate);
    setGeneratedEmail(emailContent);
    setIsLoading(false);
  };

  const handleSendRequest = () => {
    if (!generatedEmail) {
        alert("Please generate the email content first.");
        return;
    }
    if(!providerId) {
        alert("Please select a provider.");
        return;
    }
    const selectedProvider = providers.find(p => p.id === providerId);
    if (!selectedProvider) return;

    onAddServiceRequest({
        taskId: task.id,
        providerId,
        specialty: task.specialty,
        notes,
        generatedEmail,
        sentAt: new Date().toISOString(),
        cost: task.cost,
        scheduledDate: isForOverdueTask ? scheduledDate : task.taskDate,
        isUrgent: isForOverdueTask,
        status: ServiceRequestStatus.Sent,
        componentName: task.componentName,
    });
    setIsSent(true);
    setTimeout(() => {
        onClose();
    }, 2000);
  };

  if (isSent) {
    return (
        <Modal isOpen={true} onClose={onClose} title="Request Sent">
            <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Service request successfully sent!</h3>
                <p className="mt-1 text-gray-500">The modal will close shortly.</p>
            </div>
        </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Request for: ${task.name}`}>
      <div className="space-y-4">
        <div>
            <label htmlFor="provider" className="block text-sm font-medium text-gray-700">Service Provider</label>
            <select
              id="provider"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="mt-1 block w-full input"
              required
            >
              <option value="" disabled>Select a provider...</option>
              {providers.filter(p => p.specialty === task.specialty).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.specialty})</option>
              ))}
            </select>
        </div>
        {isForOverdueTask && (
            <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                <input type="date" id="scheduledDate" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1 block w-full input" required />
                <p className="mt-1 text-xs text-amber-600">This is for an overdue task. Please schedule promptly.</p>
            </div>
        )}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Additional Notes</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 block w-full input" placeholder="e.g., Please call upon arrival."></textarea>
        </div>
        
        <div className="pt-2">
            <button onClick={handleGenerateEmail} disabled={isLoading || !providerId} className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300">
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating with AI...
                    </>
                ) : 'Generate Email Content'}
            </button>
        </div>

        {generatedEmail && (
            <div className="space-y-2 pt-2">
                <label className="block text-sm font-medium text-gray-700">Generated Email Preview</label>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">{generatedEmail}</pre>
                </div>
            </div>
        )}

        <div className="flex justify-end pt-4 space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none">
            Cancel
          </button>
          <button type="button" onClick={handleSendRequest} disabled={!generatedEmail} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none disabled:bg-primary-300">
            Send Request
          </button>
        </div>
      </div>
      <style>{`.input { border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; appearance: none; background-color: #fff; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
    </Modal>
  );
};

export default CreateRequestModal;