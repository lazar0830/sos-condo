import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Notification } from '../types';

interface NotificationsViewProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (view: string, id: string) => void;
}

const ICONS: Record<string, React.ReactNode> = {
    'requests': <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
    'tasks': <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
    'default': <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
};

const getIcon = (view?: string) => {
    return view && ICONS[view] ? ICONS[view] : ICONS['default'];
};

const groupNotificationsByDate = (notifications: Notification[], t: (key: string) => string) => {
  const groups: { [key: string]: Notification[] } = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  notifications.forEach(notification => {
    const notificationDate = new Date(notification.createdAt);
    let key = t('notifications.older');
    if (notificationDate.toDateString() === today.toDateString()) {
      key = t('notifications.today');
    } else if (notificationDate.toDateString() === yesterday.toDateString()) {
      key = t('notifications.yesterday');
    }
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notification);
  });
  return groups;
};

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead, onNavigate }) => {
  const { t } = useTranslation();
  const sortedNotifications = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const groupedNotifications = groupNotificationsByDate(sortedNotifications, t);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      onNavigate(notification.link.view, notification.link.id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('notifications.title')}</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">{t('notifications.subtitle')}</p>
        </div>
        <button
          onClick={onMarkAllAsRead}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('notifications.markAllAsRead')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {Object.keys(groupedNotifications).length > 0 ? (
          Object.entries(groupedNotifications).map(([group, notifs]) => (
            <div key={group}>
              <h3 className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">{group}</h3>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifs.map(notification => (
                  <li key={notification.id}>
                    <button onClick={() => handleNotificationClick(notification)} className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notification.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                      <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 mt-1 h-8 w-8 rounded-full flex items-center justify-center ${!notification.isRead ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                          {getIcon(notification.link?.view)}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${!notification.isRead ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </p>
                          <p className={`text-sm ${!notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="flex-shrink-0 self-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-primary-500"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mt-2">{t('notifications.allCaughtUp')}</h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('notifications.noNewNotifications')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;