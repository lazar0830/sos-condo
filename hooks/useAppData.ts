import { useEffect, useRef } from 'react';
import { useFirestoreData } from './useFirestoreData';
import { isFirebaseConfigured } from '../firebaseConfig';
import * as fs from '../services/firestoreService';
import {
  initialBuildings,
  initialProviders,
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
    providers: initialProviders,
    requests: initialServiceRequests,
    components: initialComponents,
    units: initialUnits,
    contingencyDocs: initialContingencyDocuments,
    expenses: initialExpenses,
    notifications: initialNotifications,
  }, authenticated);

  const seededRef = useRef(false);
  useEffect(() => {
    if (!isFirebaseConfigured() || firestoreData.loading || seededRef.current) return;
    if (firestoreData.providers.length === 0) {
      seededRef.current = true;
      (async () => {
        for (const p of initialProviders) await fs.setProvider(p);
      })();
    }
  }, [firestoreData.loading, firestoreData.providers.length]);

  return firestoreData;
}
