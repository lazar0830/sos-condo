import { db } from '../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
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

const COLLECTIONS = {
  users: 'users',
  buildings: 'buildings',
  units: 'units',
  components: 'components',
  tasks: 'tasks',
  providers: 'providers',
  requests: 'requests',
  expenses: 'expenses',
  contingency_docs: 'contingency_docs',
  notifications: 'notifications',
} as const;

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// --- Users ---
export async function getUsers(): Promise<User[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.users));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
}

export async function getUserById(id: string): Promise<User | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, COLLECTIONS.users, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as User;
}

export async function setUser(user: User): Promise<void> {
  if (!db) return;
  const { id, ...data } = user;
  await setDoc(doc(db, COLLECTIONS.users, id), stripUndefined(data));
}

export async function deleteUser(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.users, id));
}

// --- Buildings ---
export async function getBuildings(): Promise<Building[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.buildings));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Building));
}

export async function setBuilding(building: Building): Promise<void> {
  if (!db) return;
  const { id, ...data } = building;
  await setDoc(doc(db, COLLECTIONS.buildings, id), stripUndefined(data));
}

export async function deleteBuilding(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.buildings, id));
}

// --- Units ---
export async function getUnits(): Promise<Unit[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.units));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit));
}

export async function setUnit(unit: Unit): Promise<void> {
  if (!db) return;
  const { id, ...data } = unit;
  await setDoc(doc(db, COLLECTIONS.units, id), stripUndefined(data));
}

export async function deleteUnit(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.units, id));
}

// --- Components ---
export async function getComponents(): Promise<Component[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.components));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Component));
}

export async function setComponent(component: Component): Promise<void> {
  if (!db) return;
  const { id, ...data } = component;
  await setDoc(doc(db, COLLECTIONS.components, id), stripUndefined(data));
}

export async function deleteComponent(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.components, id));
}

// --- Tasks ---
export async function getTasks(): Promise<MaintenanceTask[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.tasks));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaintenanceTask));
}

export async function setTask(task: MaintenanceTask): Promise<void> {
  if (!db) return;
  const { id, ...data } = task;
  await setDoc(doc(db, COLLECTIONS.tasks, id), stripUndefined(data));
}

export async function deleteTask(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.tasks, id));
}

// --- Providers ---
export async function getProviders(): Promise<ServiceProvider[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.providers));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceProvider));
}

export async function setProvider(provider: ServiceProvider): Promise<void> {
  if (!db) return;
  const { id, ...data } = provider;
  await setDoc(doc(db, COLLECTIONS.providers, id), stripUndefined(data));
}

export async function deleteProvider(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.providers, id));
}

// --- Requests ---
export async function getRequests(): Promise<ServiceRequest[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.requests));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest));
}

export async function setRequest(request: ServiceRequest): Promise<void> {
  if (!db) return;
  const { id, ...data } = request;
  await setDoc(doc(db, COLLECTIONS.requests, id), stripUndefined(data));
}

export async function deleteRequest(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.requests, id));
}

// --- Expenses ---
export async function getExpenses(): Promise<Expense[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.expenses));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
}

export async function setExpense(expense: Expense): Promise<void> {
  if (!db) return;
  const { id, ...data } = expense;
  await setDoc(doc(db, COLLECTIONS.expenses, id), stripUndefined(data));
}

export async function deleteExpense(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.expenses, id));
}

// --- Contingency docs ---
export async function getContingencyDocuments(): Promise<Document[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.contingency_docs));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
}

export async function setContingencyDocument(docData: Document): Promise<void> {
  if (!db) return;
  const { id, ...data } = docData;
  await setDoc(doc(db, COLLECTIONS.contingency_docs, id), stripUndefined(data));
}

export async function deleteContingencyDocument(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, COLLECTIONS.contingency_docs, id));
}

// --- Notifications ---
export async function getNotifications(): Promise<Notification[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, COLLECTIONS.notifications));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
}

export async function setNotification(notification: Notification): Promise<void> {
  if (!db) return;
  const { id, ...data } = notification;
  await setDoc(doc(db, COLLECTIONS.notifications, id), stripUndefined(data));
}

// --- Real-time subscriptions (for live updates) ---
export function subscribeToUsers(cb: (users: User[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.users), (snap) => {
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() } as User));
    cb(users);
  });
}

export function subscribeToBuildings(cb: (buildings: Building[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.buildings), (snap) => {
    const buildings = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Building));
    cb(buildings);
  });
}

export function subscribeToUnits(cb: (units: Unit[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.units), (snap) => {
    const units = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unit));
    cb(units);
  });
}

export function subscribeToComponents(cb: (components: Component[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.components), (snap) => {
    const components = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Component));
    cb(components);
  });
}

export function subscribeToTasks(cb: (tasks: MaintenanceTask[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.tasks), (snap) => {
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() } as MaintenanceTask));
    cb(tasks);
  });
}

export function subscribeToProviders(cb: (providers: ServiceProvider[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.providers), (snap) => {
    const providers = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceProvider));
    cb(providers);
  });
}

export function subscribeToRequests(cb: (requests: ServiceRequest[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.requests), (snap) => {
    const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest));
    cb(requests);
  });
}

export function subscribeToExpenses(cb: (expenses: Expense[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.expenses), (snap) => {
    const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
    cb(expenses);
  });
}

export function subscribeToContingencyDocs(cb: (docs: Document[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.contingency_docs), (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Document));
    cb(docs);
  });
}

export function subscribeToNotifications(cb: (notifications: Notification[]) => void): Unsubscribe | null {
  if (!db) return null;
  return onSnapshot(collection(db, COLLECTIONS.notifications), (snap) => {
    const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Notification));
    cb(notifications);
  });
}
