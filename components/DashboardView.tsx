import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building, MaintenanceTask, ServiceProvider, ServiceRequest, Unit, Component, Expense } from '../types';
import { TaskStatus, ServiceRequestStatus } from '../types';
import { SPECIALTY_TO_I18N_KEY } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import CreateRequestModal from './CreateRequestModal';

interface DashboardViewProps {
  buildings: Building[];
  units: Unit[];
  components: Component[];
  tasks: MaintenanceTask[];
  providers: ServiceProvider[];
  serviceRequests: ServiceRequest[];
  expenses: Expense[];
  onEditTask: (task: MaintenanceTask) => void;
  onSelectRequest: (requestId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteServiceRequest: (requestId: string) => void;
  onAddServiceRequest: (request: Omit<ServiceRequest, 'id' | 'comments' | 'documents' | 'statusHistory'>) => void;
  onSelectBuilding: (buildingId: string) => void;
  onAddBuilding: () => void;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
    <div className="bg-primary-100 dark:bg-primary-500/20 rounded-full p-3 text-primary-600 dark:text-primary-400">
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const PaginationControls: React.FC<{ currentPage: number, totalPages: number, onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-1 pt-4 mt-4">
      <div className="flex w-0 flex-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center border-t-2 border-transparent pr-1 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          <svg className="mr-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          {t('dashboard.previous')}
        </button>
      </div>
      <div className="hidden md:flex">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`inline-flex items-center border-t-2 px-4 pt-2 text-sm font-medium ${currentPage === number ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {number}
          </button>
        ))}
      </div>
      <div className="flex w-0 flex-1 justify-end">
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center border-t-2 border-transparent pl-1 pt-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
        >
          {t('dashboard.next')}
          <svg className="ml-3 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

// Colors for chart segments. Using tailwind colors for consistency.
const YEAR_COLORS = [
  '#3b82f6', // primary-500
  '#10b981', // emerald-500
  '#f97316', // orange-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

const buildingChartColors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1', '#14b8a6'];

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


// Map status values (as stored in Firestore) to i18n keys. One entry per unique value (TaskStatus and ServiceRequestStatus share some values).
const statusToKey: Record<string, string> = {
  [TaskStatus.New]: 'statusNew',
  [TaskStatus.Sent]: 'statusSent',
  [TaskStatus.OnHold]: 'statusOnHold',
  [TaskStatus.Completed]: 'statusCompleted',
  [ServiceRequestStatus.Accepted]: 'statusAccepted',
  [ServiceRequestStatus.Refused]: 'statusRefused',
  [ServiceRequestStatus.InProgress]: 'statusInProgress',
};

const DashboardView: React.FC<DashboardViewProps> = ({ buildings, units, components, tasks, providers, serviceRequests, expenses, onEditTask, onSelectRequest, onDeleteTask, onDeleteServiceRequest, onAddServiceRequest, onSelectBuilding, onAddBuilding }) => {
  const { t } = useTranslation();
  const [tasksPage, setTasksPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [deletingTask, setDeletingTask] = useState<MaintenanceTask | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<ServiceRequest | null>(null);
  const [taskForRequest, setTaskForRequest] = useState<MaintenanceTask | null>(null);
  const [contingencyGraphBuildingFilter, setContingencyGraphBuildingFilter] = useState<string>('all');
  const ITEMS_PER_PAGE = 5;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today for accurate date comparison
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  const eventTasks = tasks.filter(t => !!t.taskDate);

  // --- Calculate Stats ---
  // Get overdue and upcoming tasks (non-completed tasks from the past up to 30 days in the future)
  const upcomingTasks = eventTasks.filter(t => {
    if (!t.taskDate || t.status === TaskStatus.Completed) return false;
    const taskDate = new Date(t.taskDate + 'T12:00:00Z');
    return taskDate <= thirtyDaysFromNow;
  });

  const urgentServiceRequests = serviceRequests.filter(sr => {
      if (sr.status === ServiceRequestStatus.Completed || !sr.scheduledDate) return false;
      const requestDate = new Date(sr.scheduledDate + 'T12:00:00Z');
      const isOverdue = requestDate < today;
      const isUpcoming = requestDate >= today && requestDate <= thirtyDaysFromNow;
      return isOverdue || isUpcoming || sr.isUrgent;
  });

  const getBuildingName = (buildingId: string) => buildings.find(b => b.id === buildingId)?.name || 'N/A';

  // --- Start of logic for Financial Chart ---
  const financialTasks = useMemo(() => {
    return tasks
      .filter(t => t.taskDate && t.cost != null)
      .map(t => ({
        ...t,
        buildingName: getBuildingName(t.buildingId),
        year: new Date(t.taskDate + 'T12:00:00Z').getFullYear().toString(),
      }));
  }, [tasks, buildings]);

  const costsByBuilding = useMemo(() => {
    const costMap = new Map<string, { totalCost: number; costsByYear: Record<string, number> }>();
    
    financialTasks.forEach(task => {
      if (task.buildingId && task.cost) {
        if (!costMap.has(task.buildingId)) {
          costMap.set(task.buildingId, { totalCost: 0, costsByYear: {} });
        }
        const buildingData = costMap.get(task.buildingId)!;
        buildingData.totalCost += task.cost;
        buildingData.costsByYear[task.year] = (buildingData.costsByYear[task.year] || 0) + task.cost;
      }
    });

    return Array.from(costMap.entries())
      .map(([buildingId, data]) => ({
        buildingId,
        buildingName: getBuildingName(buildingId),
        totalCost: data.totalCost,
        costsByYear: data.costsByYear,
      }))
      .sort((a, b) => b.totalCost - a.totalCost);
  }, [financialTasks, buildings]);
  
  const allYears = useMemo(() => {
    const years = new Set<string>();
    costsByBuilding.forEach(b => {
      Object.keys(b.costsByYear).forEach(year => years.add(year));
    });
    return Array.from(years).sort();
  }, [costsByBuilding]);
  
  const yearColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allYears.forEach((year, index) => {
      map[year] = YEAR_COLORS[index % YEAR_COLORS.length];
    });
    return map;
  }, [allYears]);

  const maxCost = useMemo(() => {
    if (costsByBuilding.length === 0) return 0;
    return Math.max(...costsByBuilding.map(b => b.totalCost));
  }, [costsByBuilding]);
  // --- End of logic for Financial Chart ---

    // --- Start of logic for Contingency Chart ---
  const buildingColorMap = useMemo(() => {
    const map: { [id: string]: string } = {};
    buildings.forEach((building, index) => {
        map[building.id] = buildingChartColors[index % buildingChartColors.length];
    });
    return map;
  }, [buildings]);

  const contingencyGraphData = useMemo(() => {
    const filteredExpenses = expenses.filter(expense => 
        contingencyGraphBuildingFilter === 'all' || expense.buildingId === contingencyGraphBuildingFilter
    );

    const costsByYear: { [year: number]: { total: number; breakdown: { [buildingId: string]: number } } } = {};
    let totalCost = 0;
    const buildingsInChart = new Set<string>();

    filteredExpenses.forEach(expense => {
        if (!costsByYear[expense.year]) {
            costsByYear[expense.year] = { total: 0, breakdown: {} };
        }
        const yearData = costsByYear[expense.year];
        yearData.breakdown[expense.buildingId] = (yearData.breakdown[expense.buildingId] || 0) + expense.cost;
        yearData.total += expense.cost;
        totalCost += expense.cost;
        buildingsInChart.add(expense.buildingId);
    });

    const sortedYears = Object.keys(costsByYear).map(Number).sort((a, b) => a - b);
    const maxCost = Math.max(0, ...Object.values(costsByYear).map(y => y.total));
    
    const yAxisLabels = [];
    if (maxCost > 0) {
        yAxisLabels.push(maxCost);
        yAxisLabels.push(maxCost * 0.75);
        yAxisLabels.push(maxCost * 0.5);
        yAxisLabels.push(maxCost * 0.25);
    }

    return {
        labels: sortedYears,
        costsByYear,
        totalCost,
        maxCost,
        yAxisLabels,
        buildingsInChart: Array.from(buildingsInChart),
    };
  }, [expenses, contingencyGraphBuildingFilter]);
  // --- End of logic for Contingency Chart ---

  // --- Pagination Logic ---
  const sortedUpcomingTasks = upcomingTasks.sort((a,b) => new Date(a.taskDate!).getTime() - new Date(b.taskDate!).getTime());
  const totalTaskPages = Math.ceil(sortedUpcomingTasks.length / ITEMS_PER_PAGE);
  const currentTasks = sortedUpcomingTasks.slice((tasksPage - 1) * ITEMS_PER_PAGE, tasksPage * ITEMS_PER_PAGE);
  
  const sortedUrgentServiceRequests = urgentServiceRequests.sort((a,b) => {
      const dateA = new Date(a.scheduledDate! + 'T12:00:00Z');
      const dateB = new Date(b.scheduledDate! + 'T12:00:00Z');
      const aIsOverdue = dateA < today;
      const bIsOverdue = dateB < today;

      if (aIsOverdue && !bIsOverdue) return -1;
      if (!aIsOverdue && bIsOverdue) return 1;
      
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      
      return dateA.getTime() - dateB.getTime();
  });
  const totalRequestPages = Math.ceil(sortedUrgentServiceRequests.length / ITEMS_PER_PAGE);
  const currentRequests = sortedUrgentServiceRequests.slice((requestsPage - 1) * ITEMS_PER_PAGE, requestsPage * ITEMS_PER_PAGE);

  const getProviderName = (providerId: string) => providers.find(p => p.id === providerId)?.name || 'N/A';
  const getTaskName = (taskId: string) => tasks.find(t => t.id === taskId)?.name || 'N/A';
  
  const buildingForRequest = taskForRequest ? buildings.find(b => b.id === taskForRequest.buildingId) : null;
  const isSelectedTaskForRequestOverdue = taskForRequest?.taskDate 
    ? new Date(taskForRequest.taskDate + 'T12:00:00Z') < today && taskForRequest.status !== TaskStatus.Completed
    : false;

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('dashboard.title')}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{t('dashboard.subtitle')}</p>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.myProperties')}</h3>
        {buildings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buildings.map((building) => (
                <div
                key={building.id}
                onClick={() => onSelectBuilding(building.id)}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 group flex flex-col"
                >
                {building.imageUrl ? (
                    <img src={building.imageUrl} alt={building.name} className="w-full h-40 object-cover" />
                ) : (
                    <div className="w-full h-40 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <svg className="h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    </div>
                )}
                <div className="p-6 flex-grow">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">{building.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{building.address}</p>
                </div>
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mt-4">{t('dashboard.welcomeTitle')}</h4>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.welcomeSubtitle')}</p>
                <button
                    onClick={onAddBuilding}
                    className="mt-6 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    {t('dashboard.addFirstProperty')}
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dashboard.properties')} value={buildings.length} icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>} />
        <StatCard title={t('dashboard.units')} value={units.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>} />
        <StatCard title={t('dashboard.components')} value={components.length} icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 18v-2.25a2.25 2.25 0 00-2.25-2.25h-2.25a2.25 2.25 0 00-2.25 2.25V18zM17.25 6.75v3.75m0 0l-3.75-3.75M17.25 10.5l3.75-3.75M3.75 15.75v-2.25a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.25m-6.75 0h6.75" /></svg>} />
        <StatCard title={t('dashboard.maintenanceTasks')} value={tasks.length} icon={<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
      </div>

       <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{t('dashboard.projectedContingencyFund')}</h3>
                <div>
                    <label htmlFor="contingencyGraphBuildingFilter" className="sr-only">Filter by building</label>
                    <select 
                        id="contingencyGraphBuildingFilter" 
                        value={contingencyGraphBuildingFilter}
                        onChange={(e) => setContingencyGraphBuildingFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                        <option value="all">{t('dashboard.allBuildings')}</option>
                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>
            {contingencyGraphData.labels.length > 0 ? (
                <div>
                    <div className="flex" style={{ height: '300px' }}>
                        <div className="flex flex-col justify-between text-right pr-4 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                            {contingencyGraphData.yAxisLabels.map((label, index) => (
                                <div key={index}>${label.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            ))}
                            <div>$0</div>
                        </div>
                        <div className="flex-1 pl-4 flex justify-around border-b border-gray-200 dark:border-gray-700">
                            {contingencyGraphData.labels.map(year => {
                                const yearData = contingencyGraphData.costsByYear[year];
                                const totalYearCost = yearData.total;
                                const height = contingencyGraphData.maxCost > 0 ? (totalYearCost / contingencyGraphData.maxCost) * 100 : 0;
                                return (
                                    <div key={year} className="w-1/2 max-w-[60px] px-2 flex flex-col justify-end group relative">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            ${totalYearCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <div
                                            className="w-full flex flex-col rounded-t-md overflow-hidden"
                                            style={{ height: `${height}%` }}
                                        >
                                            {Object.entries(yearData.breakdown)
                                                .sort(([bIdA], [bIdB]) => bIdA.localeCompare(bIdB))
                                                .map(([buildingId, cost]) => {
                                                    {/* FIX: Cast `cost` to number to prevent type errors when performing arithmetic operations. */}
                                                    const segmentHeight = totalYearCost > 0 ? ((cost as number) / totalYearCost) * 100 : 0;
                                                    const building = buildings.find(b => b.id === buildingId);
                                                    return (
                                                        <div
                                                            key={buildingId}
                                                            className="w-full hover:opacity-80 transition-opacity"
                                                            style={{
                                                                height: `${segmentHeight}%`,
                                                                backgroundColor: buildingColorMap[buildingId],
                                                            }}
                                                            // FIX: Cast `cost` to number and use toLocaleString for consistent currency formatting.
                                                            title={`${building?.name}: $${(cost as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                                        ></div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex justify-around pl-16 mt-2">
                         {contingencyGraphData.labels.map(year => (
                            <div key={year} className="w-1/2 max-w-[60px] text-center text-sm font-medium text-gray-700 dark:text-gray-300">{year}</div>
                        ))}
                    </div>
                     <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {/* FIX: Corrected typo in variable name from graphBuildingFilter to contingencyGraphBuildingFilter */}
                        {contingencyGraphBuildingFilter === 'all' && contingencyGraphData.buildingsInChart.length > 1 && (
                            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mb-4">
                                {contingencyGraphData.buildingsInChart.map(buildingId => {
                                    const building = buildings.find(b => b.id === buildingId);
                                    if (!building) return null;
                                    return (
                                        <div key={buildingId} className="flex items-center text-sm">
                                            <span
                                                className="w-3 h-3 rounded-sm mr-2"
                                                style={{ backgroundColor: buildingColorMap[buildingId] }}
                                            ></span>
                                            <span className="text-gray-600 dark:text-gray-400">{building.name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <div className="mt-4 text-center">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('dashboard.totalProjectedCost')}</span>
                            <span className="ml-2 text-lg font-bold text-gray-800 dark:text-gray-100">${contingencyGraphData.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-2">{t('dashboard.noExpenseData')}</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.addExpensesHint')}</p>
                </div>
            )}
        </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.projectedMaintenanceCost')}</h3>
        <div className="space-y-6">
          {costsByBuilding.length > 0 ? (
            costsByBuilding.map(({ buildingName, totalCost, costsByYear }) => (
              <div key={buildingName}>
                <div className="sm:grid sm:grid-cols-12 sm:gap-x-4 sm:items-center">
                  <div className="sm:col-span-3 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{buildingName}</span>
                    <span className="sm:hidden text-sm font-semibold text-gray-800 dark:text-gray-100">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="mt-1 sm:mt-0 sm:col-span-7">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden">
                      {Object.entries(costsByYear)
                        .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
                        .map(([year, cost]) => (
                        <div
                          key={year}
                          className="h-4"
                          style={{
                            backgroundColor: yearColorMap[year] || '#cccccc',
                            width: maxCost > 0 ? `${((cost as number) / maxCost) * 100}%` : '0%',
                          }}
                          title={`${year}: $${(cost as number).toFixed(2)}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="hidden sm:block sm:col-span-2 text-sm font-semibold text-gray-800 dark:text-gray-100 text-right">
                    ${totalCost.toFixed(2)}
                  </div>
                </div>
                <div className="mt-2 sm:ml-[25%] flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {Object.entries(costsByYear)
                    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
                    .map(([year, cost]) => (
                      <div key={year} className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-sm mr-1.5"
                          style={{ backgroundColor: yearColorMap[year] || '#cccccc' }}
                        ></span>
                        <span>{year}: <strong>${(cost as number).toFixed(2)}</strong></span>
                      </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('dashboard.noCostData')}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.upcomingOverdueTasks')}</h3>
          <div className="space-y-4">
            {currentTasks.length > 0 ? currentTasks.map(task => {
              const isOverdue = new Date(task.taskDate! + 'T12:00:00Z') < today;
              return (
              <div key={task.id} className={`rounded-md border hover:border-gray-300 dark:hover:border-gray-600 transition-colors ${isOverdue ? 'border-red-200 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}>
                 <div onClick={() => onEditTask(task)} className="p-4 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-100">{task.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getBuildingName(task.buildingId)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                         {isOverdue && (
                           <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">{t('dashboard.overdue')}</span>
                         )}
                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSpecialtyColor(task.specialty)}`}>{SPECIALTY_TO_I18N_KEY[task.specialty] ? t(`modals.editTask.${SPECIALTY_TO_I18N_KEY[task.specialty]}`) : task.specialty}</span>
                         <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[task.status]}`}>{t(`dashboard.${statusToKey[task.status] ?? 'statusNew'}`)}</span>
                      </div>
                    </div>
                    <p className={`text-sm mt-2 ${isOverdue ? 'text-red-700 dark:text-red-300 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>{t('dashboard.due')} <strong>{new Date(task.taskDate! + 'T12:00:00Z').toLocaleDateString()}</strong></p>
                 </div>
                 <div className="flex items-center justify-end p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); setTaskForRequest(task); }} className="px-3 py-1 text-xs font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 dark:text-primary-300 dark:bg-primary-900/50 dark:hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500">
                      {t('dashboard.createServiceRequest')}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeletingTask(task); }} className="p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 rounded-full transition-colors" aria-label={`Delete ${task.name}`}>
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
              </div>
            )}) : <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('dashboard.noTasksScheduled')}</p>}
          </div>
          {totalTaskPages > 1 && <PaginationControls currentPage={tasksPage} totalPages={totalTaskPages} onPageChange={setTasksPage} />}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('dashboard.upcomingOverdueRequests')}</h3>
           <div className="space-y-4">
            {currentRequests.length > 0 ? currentRequests.map(sr => {
                const requestDate = new Date(sr.scheduledDate! + 'T12:00:00Z');
                const isRequestOverdue = requestDate < today && sr.status !== ServiceRequestStatus.Completed;
                return (
                  <div 
                    key={sr.id}
                    className={`rounded-md border transition-colors ${isRequestOverdue ? 'border-red-200 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/20' : sr.isUrgent ? 'border-amber-200 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20 hover:border-gray-300 dark:hover:border-gray-600'}`}
                  >
                    <div onClick={() => onSelectRequest(sr.id)} className="p-4 cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">{getTaskName(sr.taskId)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.to')} {getProviderName(sr.providerId)}</p>
                        </div>
                         <div className="flex items-center space-x-2 flex-shrink-0">
                              {isRequestOverdue ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">{t('dashboard.overdue')}</span>
                              ) : sr.isUrgent && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">{t('dashboard.urgent')}</span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColorMap[sr.status]}`}>{t(`dashboard.${statusToKey[sr.status] ?? 'statusSent'}`)}</span>
                         </div>
                      </div>
                      <p className={`text-sm mt-2 ${isRequestOverdue ? 'text-red-700 dark:text-red-300 font-bold' : sr.isUrgent ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-gray-600 dark:text-gray-300'}`}>{t('dashboard.scheduled')} <strong>{new Date(sr.scheduledDate! + 'T12:00:00Z').toLocaleDateString()}</strong></p>
                    </div>
                    <div className="flex items-center justify-end p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                      <button onClick={(e) => { e.stopPropagation(); setDeletingRequest(sr); }} className="p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-300 rounded-full transition-colors" aria-label={`Delete ${getTaskName(sr.taskId)}`}>
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )
            }) : <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('dashboard.noOverdueRequests')}</p>}
          </div>
          {totalRequestPages > 1 && <PaginationControls currentPage={requestsPage} totalPages={totalRequestPages} onPageChange={setRequestsPage} />}
        </div>
      </div>

      {taskForRequest && buildingForRequest && (
        <CreateRequestModal
          building={buildingForRequest}
          task={taskForRequest}
          providers={providers}
          onClose={() => setTaskForRequest(null)}
          onAddServiceRequest={onAddServiceRequest}
          isForOverdueTask={isSelectedTaskForRequestOverdue}
        />
      )}

      {deletingTask && (
        <ConfirmationModal
          isOpen={!!deletingTask}
          onClose={() => setDeletingTask(null)}
          onConfirm={() => {
            onDeleteTask(deletingTask.id);
            setDeletingTask(null);
          }}
          title={t('dashboard.confirmTaskDeletion')}
          message={t('dashboard.confirmTaskDeletionMessage', { name: deletingTask.name })}
          confirmButtonText={t('dashboard.deleteTask')}
        />
      )}

      {deletingRequest && (
        <ConfirmationModal
          isOpen={!!deletingRequest}
          onClose={() => setDeletingRequest(null)}
          onConfirm={() => {
            onDeleteServiceRequest(deletingRequest.id);
            setDeletingRequest(null);
          }}
          title={t('dashboard.confirmServiceRequestDeletion')}
          message={t('dashboard.confirmServiceRequestDeletionMessage', { name: getTaskName(deletingRequest.taskId) })}
          confirmButtonText={t('dashboard.deleteServiceRequest')}
        />
      )}
    </div>
  );
};

export default DashboardView;