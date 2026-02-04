
import React, { useState, useMemo } from 'react';
import type { Component, Building } from '../types';
import { ComponentType } from '../types';
import { COMPONENT_TYPES } from '../constants';
import type { ComponentCategoriesData } from '../services/firestoreService';

interface ComponentsViewProps {
  components: Component[];
  buildings: Building[];
  componentCategories: ComponentCategoriesData;
  onAddComponent: () => void;
  onSelectComponent: (componentId: string) => void;
}

const ComponentsView: React.FC<ComponentsViewProps> = ({ components, buildings, componentCategories = {}, onAddComponent, onSelectComponent }) => {
  const [typeFilter, setTypeFilter] = useState<ComponentType | ''>('');
  const [parentCategoryFilter, setParentCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');

  const parentCategories = useMemo(() => {
    if (!typeFilter) return [];
    const cats = componentCategories[typeFilter as ComponentType];
    return cats ? Object.keys(cats) : [];
  }, [typeFilter, componentCategories]);

  const subCategories = useMemo(() => {
    if (!typeFilter || !parentCategoryFilter) return [];
    const cats = componentCategories[typeFilter as ComponentType];
    const parentCatData = cats ? cats[parentCategoryFilter] : null;
    return parentCatData ? Object.keys(parentCatData) : [];
  }, [typeFilter, parentCategoryFilter, componentCategories]);

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTypeFilter(e.target.value as ComponentType | '');
    setParentCategoryFilter('');
    setSubCategoryFilter('');
  };
  
  const handleParentCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setParentCategoryFilter(e.target.value);
    setSubCategoryFilter('');
  };

  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      if (typeFilter && component.type !== typeFilter) return false;
      if (parentCategoryFilter && component.parentCategory !== parentCategoryFilter) return false;
      if (subCategoryFilter && component.subCategory !== subCategoryFilter) return false;
      return true;
    });
  }, [components, typeFilter, parentCategoryFilter, subCategoryFilter]);
  
  const getBuildingName = (buildingId: string) => buildings.find(b => b.id === buildingId)?.name || 'Unknown Building';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">Building Components</h2>
          <p className="text-lg text-gray-500 dark:text-gray-400">Track and manage important equipment and assets.</p>
        </div>
        <button
          onClick={onAddComponent}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Component
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={handleTypeChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
            >
              <option value="">All Types</option>
              {COMPONENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="parentCategoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Parent Category</label>
            <select
              id="parentCategoryFilter"
              value={parentCategoryFilter}
              onChange={handleParentCategoryChange}
              disabled={!typeFilter}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-900/50"
            >
              <option value="">All Parent Categories</option>
              {parentCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subCategoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sub Category</label>
            <select
              id="subCategoryFilter"
              value={subCategoryFilter}
              onChange={(e) => setSubCategoryFilter(e.target.value)}
              disabled={!parentCategoryFilter}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-900/50"
            >
              <option value="">All Sub Categories</option>
              {subCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Component Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Building</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand / Model</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredComponents.length > 0 ? filteredComponents.map(component => (
                <tr key={component.id} onClick={() => onSelectComponent(component.id)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{component.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getBuildingName(component.buildingId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{component.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                        <span>{component.parentCategory}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{component.subCategory}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {component.brand || ''}{component.modelNumber ? ` (${component.modelNumber})` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">View Details</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">No Components Found</h4>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{typeFilter || parentCategoryFilter || subCategoryFilter ? 'Try adjusting your filters.' : 'Click "Add Component" to create one.'}</p>
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

export default ComponentsView;
