

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Building, Component } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface BuildingDashboardProps {
  buildings: Building[];
  onAddBuilding: () => void;
  onSelectBuilding: (id: string) => void;
  components: Component[];
  onSelectComponent: (id: string) => void;
  onDeleteBuilding: (buildingId: string) => void;
}

const BuildingDashboard: React.FC<BuildingDashboardProps> = ({ buildings, onAddBuilding, onSelectBuilding, components, onSelectComponent, onDeleteBuilding }) => {
  const { t } = useTranslation();
  const [deletingBuilding, setDeletingBuilding] = useState<Building | null>(null);

  const hasAnyComponents = components.length > 0;

  const handleConfirmDelete = () => {
    if (deletingBuilding) {
      onDeleteBuilding(deletingBuilding.id);
      setDeletingBuilding(null);
    }
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-primary-400 mb-2">{t('properties.title')}</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400">{t('properties.subtitle')}</p>
            </div>
            <button
                onClick={onAddBuilding}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
                {t('properties.addProperty')}
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {buildings.map((building) => (
            <div
              key={building.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden group flex flex-col"
            >
              <div 
                onClick={() => onSelectBuilding(building.id)} 
                className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors flex-grow"
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
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">{building.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">{building.address}</p>
                </div>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 text-right">
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeletingBuilding(building); }} 
                  className="px-3 py-1 text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900"
                >
                  {t('properties.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">{t('properties.buildingComponents')}</h3>
          {hasAnyComponents ? (
            <div className="space-y-8">
              {buildings.map(building => {
                const buildingComponents = components.filter(c => c.buildingId === building.id);
                if (buildingComponents.length === 0) return null;

                return (
                  <div key={building.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <h4 className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 text-lg font-semibold text-gray-700 dark:text-gray-200 border-b dark:border-gray-700">{building.name}</h4>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {buildingComponents.map(component => (
                        <li
                          key={component.id}
                          onClick={() => onSelectComponent(component.id)}
                          className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{component.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{component.parentCategory} / {component.subCategory}</p>
                          </div>
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 18v-2.25a2.25 2.25 0 00-2.25-2.25h-2.25a2.25 2.25 0 00-2.25 2.25V18zM17.25 6.75v3.75m0 0l-3.75-3.75M17.25 10.5l3.75-3.75M3.75 15.75v-2.25a2.25 2.25 0 012.25-2.25h2.25a2.25 2.25 0 012.25 2.25v2.25m-6.75 0h6.75" />
              </svg>
              <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-2">{t('properties.noComponentsFound')}</h4>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{t('properties.noComponentsHint')}</p>
            </div>
          )}
        </div>
      </div>
      {deletingBuilding && (
        <ConfirmationModal
          isOpen={!!deletingBuilding}
          onClose={() => setDeletingBuilding(null)}
          onConfirm={handleConfirmDelete}
          title={t('properties.confirmDeletion')}
          message={t('properties.confirmDeletionMessage', { name: deletingBuilding.name })}
          confirmButtonText={t('properties.deleteProperty')}
        />
      )}
    </>
  );
};

export default BuildingDashboard;