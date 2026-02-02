
import React from 'react';

const SecretsSetupGuide: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-center mb-6">
        <svg className="h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
        Firebase Configuration Required
      </h2>
      <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
        This application requires a connection to Firebase to function. 
        Please configure your environment variables with your Firebase project keys.
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Required Environment Variables:</h3>
        <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre">
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
API_KEY=... (Gemini API Key)
        </pre>
      </div>

      <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
        <p>1. Create a project at <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">console.firebase.google.com</a>.</p>
        <p>2. Enable <strong>Authentication</strong> (Email/Password).</p>
        <p>3. Create a <strong>Firestore Database</strong> (Test mode).</p>
        <p>4. Create a <strong>Storage Bucket</strong> (Test mode).</p>
        <p>5. Copy the config from Project Settings into your environment variables.</p>
      </div>
    </div>
  );
};

export default SecretsSetupGuide;
