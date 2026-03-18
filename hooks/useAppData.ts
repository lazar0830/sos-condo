import { useFirestoreData } from './useFirestoreData';
import type { ComponentCategoriesData } from '../services/firestoreService';
import {
  initialBuildings,
  initialTasks,
  initialServiceRequests,
  initialComponents,
  initialUnits,
  initialContingencyDocuments,
  initialExpenses,
  initialNotifications,
} from '../data/initialData';

export function useAppData(authenticated: boolean) {
  const firestoreData = useFirestoreData({
    users: [],
    buildings: initialBuildings,
    tasks: initialTasks,
    providers: [],
    requests: initialServiceRequests,
    components: initialComponents,
    units: initialUnits,
    contingencyDocs: initialContingencyDocuments,
    expenses: initialExpenses,
    notifications: initialNotifications,
    componentCategories: {} as ComponentCategoriesData,
    componentTemplates: [],
  }, authenticated);

  return firestoreData;
}
