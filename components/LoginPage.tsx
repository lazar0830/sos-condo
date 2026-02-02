
import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const success = await onLogin(email, password);
    if (!success && !error) { // Don't override specific errors from parent
      setError('Invalid email or password.');
    }
    setIsLoading(false);
  };

  const TestCredential: React.FC<{user: string, pass: string, role: string}> = ({user, pass, role}) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-300 font-semibold w-32">{role}</span>
        <div className="flex-grow flex justify-between items-center ml-4 flex-wrap gap-x-4">
            <span className="text-gray-600 dark:text-gray-400">Email: <strong className="font-mono">{user}</strong></span>
            <span className="text-gray-600 dark:text-gray-400">Pass: <strong className="font-mono">{pass}</strong></span>
        </div>
        <button 
            type="button"
            onClick={() => { setEmail(user); setPassword(pass); }}
            className="ml-4 text-xs text-primary-600 hover:text-primary-800 dark:hover:text-primary-400 font-semibold"
        >
            Use
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full mx-auto">
            <div className="flex justify-center items-center space-x-3 mb-6">
                 <svg className="h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                    S.O.S.<span className="text-primary-600">Condo</span>
                </h1>
            </div>
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-6">Login to your account</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Address
                    </label>
                    <div className="mt-1">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    </div>
                </div>

                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                    </label>
                    <div className="mt-1">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    </div>
                </div>

                {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}

                <div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
                    >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                </div>
                </form>

                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                    <div>
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">You can use the following sample credentials to log in:</p>
                        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border dark:border-gray-600">
                            <TestCredential role="Super Admin" user="superadmin@soscondo.com" pass="S.O.S.Condo!2024" />
                            <TestCredential role="Admin" user="admin1@soscondo.com" pass="password123" />
                            <TestCredential role="Admin" user="admin2@soscondo.com" pass="password123" />
                            <TestCredential role="Prop. Manager" user="manager1@soscondo.com" pass="password123" />
                            <TestCredential role="Prop. Manager" user="manager2@soscondo.com" pass="password123" />
                            <TestCredential role="Prop. Manager" user="manager3@soscondo.com" pass="password123" />
                            <TestCredential role="Prop. Manager" user="manager4@soscondo.com" pass="password123" />
                            <TestCredential role="Service Provider" user="plumber@soscondo.com" pass="password123" />
                            <TestCredential role="Service Provider" user="electric@soscondo.com" pass="password123" />
                            <TestCredential role="Service Provider" user="inspector@soscondo.com" pass="password123" />
                            <TestCredential role="Service Provider" user="hvac@soscondo.com" pass="password123" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;