import { useFirestoreData } from './useFirestoreData';
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
  }, authenticated);

  return firestoreData;
}
