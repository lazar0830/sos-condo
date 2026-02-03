import React, { useState, useRef, useEffect } from 'react';
import type { View, Theme } from '../App';
import type { User, Notification } from '../types';
import { UserRole } from '../types';

interface SideNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  currentUser: User;
  onLogout: () => void;
  isMobileNavOpen: boolean;
  onCloseMobileNav: () => void;
  theme: Theme;
  onThemeChange: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNotificationClick: (view: string, id: string) => void;
}

const NavItem: React.FC<{
    viewId: View;
    currentView: View;
    onNavigate: (view: View) => void;
    icon: React.ReactNode;
    text: string;
}> = ({ viewId, currentView, onNavigate, icon, text }) => {
    const isActive = viewId === currentView;
    const linkClasses = `w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150 ${
        isActive
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
    }`;
    return (
        <button onClick={() => onNavigate(viewId)} className={linkClasses}>
            {icon}
            <span className="ml-3">{text}</span>
        </button>
    );
};

const ICONS: Record<View, React.ReactNode> = {
    dashboard: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 18v-2.25a2.25 2.25 0 00-2.25-2.25h-2.25a2.25 2.25 0 00-2.25 2.25V18z" /></svg>,
    financials: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
    properties: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
    tasks: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    requests: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
    providers: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.471-2.471a.563.563 0 01.8 0l2.471 2.471a.563.563 0 010 .8l-2.471 2.471a.563.563 0 01-.8 0l-2.471-2.471a.563.563 0 010-.8zM11.42 15.17L5.877 21m0 0a2.652 2.652 0 01-3.75-3.75L8.15 11.421a.563.563 0 01.8 0l2.471 2.471a.563.563 0 010 .8z" /></svg>,
    tools: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
    account: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    management: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0h9.75m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>,
    components: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 18v-2.25a2.25 2.25 0 00-2.25-2.25h-2.25a2.25 2.25 0 00-2.25 2.25V18zM17.25 6.75v3.75m0 0l-3.75-3.75M17.25 10.5l3.75-3.75M3.75 15.75v-2.25a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.25m-6.75 0h6.75" /></svg>,
    contingencyFund: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
    notifications: <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>,
};

const SideNav: React.FC<SideNavProps> = ({ 
  currentView, onNavigate, currentUser, onLogout, 
  isMobileNavOpen, onCloseMobileNav, theme, onThemeChange,
  notifications, onMarkAsRead, onMarkAllAsRead, onNotificationClick 
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const recentUnread = notifications.filter(n => !n.isRead).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  
  const managerNavItems: { id: View, name: string }[] = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'contingencyFund', name: 'Fonds de prévoyance' },
    { id: 'properties', name: 'All Properties' },
    { id: 'components', name: 'Components' },
    { id: 'tasks', name: 'Maintenance Tasks' },
    { id: 'financials', name: 'Maintenance Cost' },
    { id: 'requests', name: 'Service Requests' },
    { id: 'providers', name: 'Service Providers' },
    { id: 'tools', name: 'Tools' },
  ];
  
  const providerNavItems: { id: View, name: string }[] = [
      { id: 'dashboard', name: 'My Jobs' }
  ]

  const navItems = (currentUser.role === UserRole.ServiceProvider) ? providerNavItems : managerNavItems;

  const handleNavigate = (view: View) => {
    onNavigate(view);
    onCloseMobileNav();
  };

  const handleLogout = () => {
    onLogout();
    onCloseMobileNav();
  };

  const handleNotificationItemClick = (notification: Notification) => {
    if (!notification.isRead) {
        onMarkAsRead(notification.id);
    }
    if (notification.link) {
        onNotificationClick(notification.link.view, notification.link.id);
    }
    setPopoverOpen(false);
    onCloseMobileNav();
  };

  return (
    <>
      {isMobileNavOpen && (
        <div 
          onClick={onCloseMobileNav} 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
          aria-hidden="true" 
        />
      )}
      <aside className={`w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isMobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <svg className="h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
          <h1 className="ml-2 text-2xl font-bold text-gray-800 dark:text-gray-100">
            S.O.S.<span className="text-primary-600">Condo</span>
          </h1>
        </div>
        
        <nav className="sidenav-nav flex-grow p-4 space-y-1 overflow-y-auto min-h-0">
          {navItems.map(item => (
              <NavItem
                  key={item.id}
                  viewId={item.id}
                  currentView={currentView}
                  onNavigate={handleNavigate}
                  icon={ICONS[item.id]}
                  text={item.name}
              />
          ))}
          {[UserRole.SuperAdmin, UserRole.Admin].includes(currentUser.role) && (
              <NavItem
                  key="management"
                  viewId="management"
                  currentView={currentView}
                  onNavigate={handleNavigate}
                  icon={ICONS['management']}
                  text="App Management"
              />
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2">
                <div className="flex-1 flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                  <button
                    onClick={onThemeChange}
                    className={`p-1.5 w-1/2 rounded-full text-sm font-medium flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400'}`}
                    aria-label="Switch to Light Theme"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 7.072l.707-.707a1 1 0 10-1.414-1.414l-.707.707a1 1 0 101.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" /></svg>
                  </button>
                  <button
                    onClick={onThemeChange}
                    className={`p-1.5 w-1/2 rounded-full text-sm font-medium flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-gray-800 shadow-sm text-primary-400' : 'text-gray-400'}`}
                    aria-label="Switch to Dark Theme"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                  </button>
                </div>
                <div ref={popoverRef} className="relative flex-shrink-0 ml-4">
                    <button onClick={() => setPopoverOpen(!popoverOpen)} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                        <span className="sr-only">View notifications</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 transform -translate-y-1/2 translate-x-1/2 rounded-full text-white shadow-solid bg-red-500 border-2 border-white dark:border-gray-800"></span>}
                    </button>
                    {popoverOpen && (
                        <div className="origin-top-right absolute right-0 bottom-full mb-2 w-80 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700">
                            <div className="p-2">
                                <div className="flex justify-between items-center px-2 py-1">
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Notifications</h4>
                                    {unreadCount > 0 && <button onClick={() => { onMarkAllAsRead(); setPopoverOpen(false); }} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">Mark all as read</button>}
                                </div>
                                <div className="mt-1 max-h-80 overflow-y-auto">
                                    {recentUnread.length > 0 ? recentUnread.map(notif => (
                                        <button key={notif.id} onClick={() => handleNotificationItemClick(notif)} className="w-full text-left p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notif.title}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{notif.message}</p>
                                        </button>
                                    )) : <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No unread notifications.</p>}
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                                    <button onClick={() => { handleNavigate('notifications'); setPopoverOpen(false); }} className="w-full text-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">View all notifications</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

              <NavItem
                  viewId="account"
                  currentView={currentView}
                  onNavigate={handleNavigate}
                  icon={ICONS.account}
                  text="My Account"
              />
              <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  <span className="ml-3">Logout</span>
              </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{currentUser.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideNav;