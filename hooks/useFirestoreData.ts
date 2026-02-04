import { useState, useEffect } from 'react';
import { isFirebaseConfigured } from '../firebaseConfig';
import * as fs from '../services/firestoreService';
import type { ComponentCategoriesData } from '../services/firestoreService';
import type {
  User,
  Building,
  Unit,
  Component,
  MaintenanceTask,
  ServiceProvider,
  ServiceRequest,
  Expense,
  Document,
  Notification,
} from '../types';

export function useFirestoreData(
  initial: {
    users: User[];
    buildings: Building[];
    units: Unit[];
    components: Component[];
    tasks: MaintenanceTask[];
    providers: ServiceProvider[];
    requests: ServiceRequest[];
    expenses: Expense[];
    contingencyDocs: Document[];
    notifications: Notification[];
    componentCategories?: ComponentCategoriesData;
  },
  enabled: boolean
) {
  const [users, setUsers] = useState<User[]>(initial.users);
  const [buildings, setBuildings] = useState<Building[]>(initial.buildings);
  const [units, setUnits] = useState<Unit[]>(initial.units);
  const [components, setComponents] = useState<Component[]>(initial.components);
  const [tasks, setTasks] = useState<MaintenanceTask[]>(initial.tasks);
  const [providers, setProviders] = useState<ServiceProvider[]>(initial.providers);
  const [requests, setRequests] = useState<ServiceRequest[]>(initial.requests);
  const [expenses, setExpenses] = useState<Expense[]>(initial.expenses);
  const [contingencyDocs, setContingencyDocs] = useState<Document[]>(initial.contingencyDocs);
  const [notifications, setNotifications] = useState<Notification[]>(initial.notifications);
  const [componentCategories, setComponentCategories] = useState<ComponentCategoriesData>(initial.componentCategories || {});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !enabled) {
      setLoading(false);
      return;
    }

    const unsubs: (() => void)[] = [];
    unsubs.push(fs.subscribeToUsers(setUsers) || (() => {}));
    unsubs.push(fs.subscribeToBuildings(setBuildings) || (() => {}));
    unsubs.push(fs.subscribeToUnits(setUnits) || (() => {}));
    unsubs.push(fs.subscribeToComponents(setComponents) || (() => {}));
    unsubs.push(fs.subscribeToTasks(setTasks) || (() => {}));
    unsubs.push(fs.subscribeToProviders(setProviders) || (() => {}));
    unsubs.push(fs.subscribeToRequests(setRequests) || (() => {}));
    unsubs.push(fs.subscribeToExpenses(setExpenses) || (() => {}));
    unsubs.push(fs.subscribeToContingencyDocs(setContingencyDocs) || (() => {}));
    unsubs.push(fs.subscribeToNotifications(setNotifications) || (() => {}));
    unsubs.push(fs.subscribeToComponentCategories(setComponentCategories) || (() => {}));

    setLoading(false);
    return () => unsubs.forEach((u) => u());
  }, [enabled]);

  return {
    users,
    buildings,
    units,
    components,
    tasks,
    providers,
    serviceRequests: requests,
    contingencyDocuments: contingencyDocs,
    expenses,
    notifications,
    componentCategories,
    loading,
  };
}
