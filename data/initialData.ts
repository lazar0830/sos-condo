
import { ServiceProvider, Building, MaintenanceTask, ServiceRequest, User, UserRole, Component, Unit, Document, Expense, Notification } from '../types';

// --- USERS ---
export const initialUsers: User[] = [
  // Super Admin
  { id: 'user-superadmin', email: 'superadmin@soscondo.com', username: 'Sam Super', role: UserRole.SuperAdmin, password: 'S.O.S.Condo!2024' },
  
  // Admins
  { id: 'user-admin1', email: 'admin1@soscondo.com', username: 'Alex Admin', role: UserRole.Admin, password: 'password123', createdBy: 'user-superadmin' },
  { id: 'user-admin2', email: 'admin2@soscondo.com', username: 'Brenda Boss', role: UserRole.Admin, password: 'password123', createdBy: 'user-superadmin' },
  
  // Property Managers
  { id: 'user-manager1', email: 'manager1@soscondo.com', username: 'Pat Manager', role: UserRole.PropertyManager, password: 'password123', createdBy: 'user-admin1' },
  { id: 'user-manager2', email: 'manager2@soscondo.com', username: 'Morgan Manager', role: UserRole.PropertyManager, password: 'password123', createdBy: 'user-admin1' },
  { id: 'user-manager3', email: 'manager3@soscondo.com', username: 'Taylor Property', role: UserRole.PropertyManager, password: 'password123', createdBy: 'user-admin2' },
  { id: 'user-manager4', email: 'manager4@soscondo.com', username: 'Casey Condo', role: UserRole.PropertyManager, password: 'password123', createdBy: 'user-admin2' },

  // Service Providers
  { id: 'user-plumber', email: 'plumber@soscondo.com', username: 'Pipe Pro', role: UserRole.ServiceProvider, password: 'password123' },
  { id: 'user-electric', email: 'electric@soscondo.com', username: 'Elec Expert', role: UserRole.ServiceProvider, password: 'password123' },
  { id: 'user-inspector', email: 'inspector@soscondo.com', username: 'Inspect It', role: UserRole.ServiceProvider, password: 'password123' },
  { id: 'user-hvac', email: 'hvac@soscondo.com', username: 'HVAC Hero', role: UserRole.ServiceProvider, password: 'password123' },
];

// --- SERVICE PROVIDERS ---
export const initialProviders: ServiceProvider[] = [
    { id: 'provider-plumbing-1', userId: 'user-plumber', name: 'Pipe Pro Plumbing', email: 'plumber@soscondo.com', specialty: 'Plumbing', phone: '555-0101', address: '123 Drain St, Waterton', contactPerson: 'Pipe Pro', createdBy: 'user-superadmin' },
    { id: 'provider-electric-1', userId: 'user-electric', name: 'Electric Experts Inc.', email: 'electric@soscondo.com', specialty: 'Electrical', phone: '555-0102', address: '456 Volt Ave, Circuit City', contactPerson: 'Elec Expert', createdBy: 'user-superadmin' },
    { id: 'provider-inspector-1', userId: 'user-inspector', name: 'Inspect It Right', email: 'inspector@soscondo.com', specialty: 'Building Inspector', phone: '555-0103', address: '789 Foundation Rd, Structon', contactPerson: 'Inspect It', createdBy: 'user-superadmin' },
    { id: 'provider-hvac-1', userId: 'user-hvac', name: 'HVAC Heroes', email: 'hvac@soscondo.com', specialty: 'HVAC', phone: '555-0104', address: '101 Airflow Blvd, Coolville', contactPerson: 'HVAC Hero', createdBy: 'user-superadmin' },
];

// --- BUILDINGS ---
export const initialBuildings: Building[] = [];

// --- UNITS ---
export const initialUnits: Unit[] = [];

// --- COMPONENTS ---
export const initialComponents: Component[] = [];

// --- MAINTENANCE TASKS ---
export const initialTasks: MaintenanceTask[] = [];

// --- SERVICE REQUESTS ---
export const initialServiceRequests: ServiceRequest[] = [];

// --- CONTINGENCY FUND DOCUMENTS ---
export const initialContingencyDocuments: Document[] = [];

// --- CONTINGENCY FUND EXPENSES ---
export const initialExpenses: Expense[] = [];

// --- NOTIFICATIONS ---
export const initialNotifications: Notification[] = [];
