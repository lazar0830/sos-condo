
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaintenanceTask, Building } from '../types';
import { TaskStatus } from '../types';

interface FinancialSummaryViewProps {
  tasks: MaintenanceTask[];
  buildings: Building[];
}

type SortableKeys = 'buildingName' | 'name' | 'status' | 'taskDate' | 'cost';

const statusToKey: Record<TaskStatus, string> = {
  [TaskStatus.New]: 'statusNew',
  [TaskStatus.Sent]: 'statusSent',
  [TaskStatus.OnHold]: 'statusOnHold',
  [TaskStatus.Completed]: 'statusCompleted',
};

const statusColorMap: { [key in TaskStatus]: string } = {
  [TaskStatus.New]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  [TaskStatus.Sent]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  [TaskStatus.OnHold]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  [TaskStatus.Completed]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
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

const FinancialSummaryView: React.FC<FinancialSummaryViewProps> = ({ tasks, buildings }) => {
  const { t } = useTranslation();
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' } | null>({ key: 'taskDate', direction: 'descending' });

  const getBuildingName = (buildingId: string) => buildings.find(b => b.id === buildingId)?.name || t('maintenanceCost.unknownBuilding');

  const financialTasks = useMemo(() => {
    return tasks
      .filter(t => t.taskDate && t.cost != null)
      .map(t => ({
        ...t,
        buildingName: getBuildingName(t.buildingId),
        year: new Date(t.taskDate + 'T12:00:00Z').getFullYear().toString(),
      }));
  }, [tasks, buildings]);
  
  const sortedTasks = useMemo(() => {
    let sortableItems = [...financialTasks];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [financialTasks, sortConfig]);

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
  }, [financialTasks, getBuildingName]);
  
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

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const totalCost = useMemo(() => financialTasks.reduce((sum, task) => sum + (task.cost || 0), 0), [financialTasks]);

  const SortableHeader: React.FC<{ sortKey: SortableKeys, children: React.ReactNode }> = ({ sortKey, children }) => {
    const isSorted = sortConfig?.key === sortKey;
    const sortIcon = isSorted ? (sortConfig?.direction === 'ascending' ? '▲' : '▼') : '↕';
    return (
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => requestSort(sortKey)}>
        <div className="flex items-center">
            {children}
            <span className="ml-2 text-gray-400">{sortIcon}</span>
        </div>
      </th>
    );
  };
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('maintenanceCost.title')}</h2>
        <p className="text-lg text-gray-500 dark:text-gray-400">{t('maintenanceCost.subtitle')}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('maintenanceCost.projectedMaintenanceCost')}</h3>
        <div className="space-y-6">
          {costsByBuilding.length > 0 ? (
            costsByBuilding.map(({ buildingName, totalCost, costsByYear }) => (
              <div key={buildingName}>
                <div className="grid grid-cols-12 gap-x-4 items-center">
                  <div className="col-span-3 text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{buildingName}</div>
                  <div className="col-span-7">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 flex overflow-hidden">
                      {Object.entries(costsByYear)
                        .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
                        .map(([year, cost]) => (
                        <div
                          key={year}
                          className="h-4"
                          style={{
                            backgroundColor: yearColorMap[year] || '#cccccc',
                            // FIX: Cast `cost` to number to prevent type errors when performing arithmetic operations.
                            width: maxCost > 0 ? `${(((cost as number)) / maxCost) * 100}%` : '0%',
                          }}
                          // FIX: Cast `cost` to number and use toFixed(2) for consistent currency formatting.
                          title={`${year}: $${((cost as number)).toFixed(2)}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2 text-sm font-semibold text-gray-800 dark:text-gray-100 text-right">
                    {/* FIX: Use toFixed(2) for consistent currency formatting. */}
                    ${totalCost.toFixed(2)}
                  </div>
                </div>
                <div className="mt-2 ml-[25%] flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {Object.entries(costsByYear)
                    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
                    .map(([year, cost]) => (
                      <div key={year} className="flex items-center">
                        <span
                          className="w-3 h-3 rounded-sm mr-1.5"
                          style={{ backgroundColor: yearColorMap[year] || '#cccccc' }}
                        ></span>
                        {/* FIX: Cast `cost` to number and use toFixed(2) for consistent currency formatting. */}
                        <span>{year}: <strong>${((cost as number)).toFixed(2)}</strong></span>
                      </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">{t('maintenanceCost.noCostData')}</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <SortableHeader sortKey="buildingName">{t('maintenanceCost.property')}</SortableHeader>
                <SortableHeader sortKey="name">{t('maintenanceCost.task')}</SortableHeader>
                <SortableHeader sortKey="status">{t('maintenanceCost.status')}</SortableHeader>
                <SortableHeader sortKey="taskDate">{t('maintenanceCost.date')}</SortableHeader>
                <SortableHeader sortKey="cost">{t('maintenanceCost.cost')}</SortableHeader>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.length > 0 ? sortedTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{task.buildingName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{task.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColorMap[task.status]}`}>
                      {t(`maintenanceCost.${statusToKey[task.status]}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(task.taskDate + 'T12:00:00Z').toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-semibold">{task.cost != null ? `$${task.cost.toFixed(2)}` : t('maintenanceCost.unknownBuilding')}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    <div className="max-w-md mx-auto">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
                        </svg>
                        <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-2">{t('maintenanceCost.noFinancialData')}</h4>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('maintenanceCost.noFinancialDataHint')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {sortedTasks.length > 0 && (
                <tfoot className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t('maintenanceCost.total')}</td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-gray-100">${totalCost.toFixed(2)}</td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryView;