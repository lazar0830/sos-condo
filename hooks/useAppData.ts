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
import { COMPONENT_CATEGORIES } from '../constants';

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
    const needsProviderSeed = firestoreData.providers.length === 0;
    const needsCategorySeed = Object.keys(firestoreData.componentCategories || {}).length === 0;
    if (needsProviderSeed || needsCategorySeed) {
      seededRef.current = true;
      (async () => {
        if (needsProviderSeed) {
          for (const p of initialProviders) await fs.setProvider(p);
        }
        if (needsCategorySeed) {
          await fs.setComponentCategories(COMPONENT_CATEGORIES);
        }
      })();
    }
  }, [firestoreData.loading, firestoreData.providers.length, firestoreData.componentCategories]);

  return firestoreData;
}
