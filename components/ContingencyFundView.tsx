

import React, { useRef, useState, useMemo } from 'react';
import type { Document, Expense, Building, Component } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface ContingencyFundViewProps {
  documents: Document[];
  onAddDocument: (file: File) => void;
  onDeleteDocument: (documentId: string) => void;
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'buildingName' | 'componentName'>) => void;
  onDeleteExpense: (expenseId: string) => void;
  buildings: Building[];
  components: Component[];
}

const buildingColors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#6366f1', '#14b8a6'];

const ContingencyFundView: React.FC<ContingencyFundViewProps> = ({ 
  documents, onAddDocument, onDeleteDocument, 
  expenses, onAddExpense, onDeleteExpense, buildings, components 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const [newExpense, setNewExpense] = useState({
    buildingId: '',
    componentId: '',
    year: new Date().getFullYear().toString(),
    cost: '',
  });
  
  const [graphBuildingFilter, setGraphBuildingFilter] = useState<string>('all');

  const buildingColorMap = useMemo(() => {
    const map: { [id: string]: string } = {};
    buildings.forEach((building, index) => {
        map[building.id] = buildingColors[index % buildingColors.length];
    });
    return map;
  }, [buildings]);

  const availableComponents = useMemo(() => {
    if (!newExpense.buildingId) return [];
    return components.filter(c => c.buildingId === newExpense.buildingId);
  }, [newExpense.buildingId, components]);

  const graphData = useMemo(() => {
    const filteredExpenses = expenses.filter(expense => 
        graphBuildingFilter === 'all' || expense.buildingId === graphBuildingFilter
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
  }, [expenses, graphBuildingFilter]);

  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'buildingId') {
      setNewExpense(prev => ({ ...prev, buildingId: value, componentId: '' }));
    } else {
      setNewExpense(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.buildingId || !newExpense.componentId || !newExpense.year || !newExpense.cost) {
        alert('Please fill out all fields.');
        return;
    }
    onAddExpense({
        buildingId: newExpense.buildingId,
        componentId: newExpense.componentId,
        year: parseInt(newExpense.year, 10),
        cost: parseFloat(newExpense.cost),
    });
    setNewExpense({
        buildingId: '',
        componentId: '',
        year: new Date().getFullYear().toString(),
        cost: '',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddDocument(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleConfirmDeleteDoc = () => {
    if (deletingDocument) {
      onDeleteDocument(deletingDocument.id);
      setDeletingDocument(null);
    }
  };

  const handleConfirmDeleteExpense = () => {
    if (deletingExpense) {
      onDeleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const sortedExpenses = [...expenses].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">Fonds de prévoyance</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">Manage documents and expense distribution for the contingency fund.</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Projected Contingency Fund</h3>
                <div>
                    <label htmlFor="graphBuildingFilter" className="sr-only">Filter by building</label>
                    <select 
                        id="graphBuildingFilter" 
                        value={graphBuildingFilter}
                        onChange={(e) => setGraphBuildingFilter(e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    >
                        <option value="all">All Buildings</option>
                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
            </div>
            {graphData.labels.length > 0 ? (
                <div>
                    <div className="flex" style={{ height: '300px' }}>
                        <div className="flex flex-col justify-between text-right pr-4 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
                            {graphData.yAxisLabels.map((label, index) => (
                                <div key={index}>${label.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                            ))}
                            <div>$0</div>
                        </div>
                        <div className="flex-1 pl-4 flex justify-around border-b border-gray-200 dark:border-gray-700">
                            {graphData.labels.map(year => {
                                const yearData = graphData.costsByYear[year];
                                const totalYearCost = yearData.total;
                                const height = graphData.maxCost > 0 ? (totalYearCost / graphData.maxCost) * 100 : 0;
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
                                                    // FIX: Cast `cost` to number to prevent type errors when performing arithmetic operations.
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
                         {graphData.labels.map(year => (
                            <div key={year} className="w-1/2 max-w-[60px] text-center text-sm font-medium text-gray-700 dark:text-gray-300">{year}</div>
                        ))}
                    </div>
                     <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                        {graphBuildingFilter === 'all' && graphData.buildingsInChart.length > 1 && (
                            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mb-4">
                                {graphData.buildingsInChart.map(buildingId => {
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
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Projected Cost:</span>
                            <span className="ml-2 text-lg font-bold text-gray-800 dark:text-gray-100">${graphData.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-2">No Expense Data</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Add expenses in the section below to see the projection chart.</p>
                </div>
            )}
        </div>


        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Répartition de dépenses</h3>
            <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-2">
                    <label htmlFor="buildingId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Building</label>
                    <select id="buildingId" name="buildingId" value={newExpense.buildingId} onChange={handleExpenseChange} className="mt-1 block w-full input" required>
                        <option value="" disabled>Select a building...</option>
                        {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="componentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Component</label>
                    <select id="componentId" name="componentId" value={newExpense.componentId} onChange={handleExpenseChange} className="mt-1 block w-full input" required disabled={!newExpense.buildingId}>
                        <option value="" disabled>{newExpense.buildingId ? 'Select a component...' : 'Select a building first'}</option>
                        {availableComponents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                    <input type="number" id="year" name="year" value={newExpense.year} onChange={handleExpenseChange} className="mt-1 block w-full input" required min="1900" />
                </div>
                 <div>
                    <label htmlFor="cost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost</label>
                    <input type="number" id="cost" name="cost" value={newExpense.cost} onChange={handleExpenseChange} className="mt-1 block w-full input" required step="0.01" min="0" placeholder="0.00"/>
                </div>
                <div className="md:col-span-5">
                    <button type="submit" className="w-full md:w-auto justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none">
                        Add Expense
                    </button>
                </div>
            </form>
            
            {sortedExpenses.length > 0 && (
                <div className="mt-8 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Building</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Component</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Year</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cost</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedExpenses.map(expense => (
                                <tr key={expense.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{expense.buildingName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.componentName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{expense.year}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">${expense.cost.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => setDeletingExpense(expense)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Documents</h3>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Upload Document
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {sortedDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">File Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Uploaded</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedDocuments.map(doc => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="h-6 w-6 text-gray-400 dark:text-gray-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 truncate" title={doc.name}>
                            {doc.name}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => setDeletingDocument(doc)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0V7.5m-2.25 0h4.5m-4.5 0a3.375 3.375 0 01-3.375 3.375H5.625a3.375 3.375 0 01-3.375-3.375V5.625a3.375 3.375 0 013.375-3.375h3.375c1.25 0 2.375.404 3.25 1.087m-3.25-1.087h-1.5a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h1.5a1.125 1.125 0 001.125-1.125v-1.5A1.125 1.125 0 0010.5 4.5h-1.5m10.5 1.5H14.25" />
                </svg>
              <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-2">No Documents Found</h4>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Upload your first contingency fund document to see it here.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`.input { appearance: none; background-color: #fff; border-radius: 0.375rem; border: 1px solid #D1D5DB; padding: 0.5rem 0.75rem; width: 100%; color: #111827; } .input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; } .input:disabled { background-color: #F3F4F6; cursor: not-allowed; } .dark .input { background-color: #374151; border-color: #4B5563; color: #F9FAFB; } .dark .input:disabled { background-color: #1F2937; color: #6B7280; }`}</style>
      {deletingDocument && (
        <ConfirmationModal
          isOpen={!!deletingDocument}
          onClose={() => setDeletingDocument(null)}
          onConfirm={handleConfirmDeleteDoc}
          title="Confirm Document Deletion"
          message={`Are you sure you want to permanently delete "${deletingDocument.name}"? This action cannot be undone.`}
          confirmButtonText="Delete Document"
        />
      )}
      {deletingExpense && (
        <ConfirmationModal
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onConfirm={handleConfirmDeleteExpense}
          title="Confirm Expense Deletion"
          message={`Are you sure you want to permanently delete this expense entry for ${deletingExpense.componentName}? This action cannot be undone.`}
          confirmButtonText="Delete Expense"
        />
      )}
    </>
  );
};

export default ContingencyFundView;