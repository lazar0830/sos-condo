

export enum Recurrence {
  OneTime = 'One-Time',
  Weekly = 'Weekly',
  BiWeekly = 'Bi-Weekly',
  Monthly = 'Monthly',
  Quarterly = 'Quarterly',
  SemiAnnually = 'Semi-Annually',
  Annually = 'Annually',
}

export enum TaskStatus {
  New = 'New',
  Sent = 'Sent',
  OnHold = 'On Hold',
  Completed = 'Completed',
}

export enum ServiceRequestStatus {
  Sent = 'Sent',
  Accepted = 'Accepted',
  Refused = 'Refused',
  InProgress = 'In Progress',
  Completed = 'Completed',
}

// FIX: Add UserRole enum for different user types in the application.
// This was missing, causing type errors in multiple components.
export enum UserRole {
  SuperAdmin = 'Super Admin',
  Admin = 'Admin',
  PropertyManager = 'Property Manager',
  ServiceProvider = 'Service Provider',
}

// New enum for Component Type
export enum ComponentType {
  Building = 'Building',
  Site = 'Site',
  Unit = 'Unit',
}

export enum OccupantType {
  Owner = 'Owner',
  Renter = 'Renter',
}


// FIX: Add User interface for user profile data.
// This was missing, causing type errors in multiple components.
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  password?: string;
  createdBy?: string; // ID of the user who created this user
}

export interface Building {
  id: string;
  name: string;
  address: string;
  imageUrl?: string;
  createdBy: string; // ID of the user who created this building
}

export interface Unit {
  id: string;
  buildingId: string;
  unitNumber: string;
  images: ComponentImage[];
  occupant?: {
    name: string;
    type: OccupantType;
    startDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
  };
}

export interface ComponentImage {
  id: string;
  url: string; // Firebase Storage URL or legacy base64 data URL
  caption?: string;
  uploadedAt: string;
}

export interface Component {
  id: string;
  buildingId: string;
  name: string;
  location?: string;
  type: ComponentType;
  parentCategory: string;
  subCategory: string;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  installationDate?: string; // YYYY-MM-DD
  warrantyEndDate?: string; // YYYY-MM-DD
  notes?: string;
  images: ComponentImage[];
  unitId?: string;
  unitNumber?: string;
}

export interface MaintenanceTask {
  id:string;
  buildingId: string;
  name: string;
  description: string;
  specialty: string;
  recurrence: Recurrence;
  status: TaskStatus;
  cost?: number;
  providerId?: string;
  taskDate?: string; // YYYY-MM-DD for one-time tasks
  startDate?: string; // YYYY-MM-DD for recurring tasks
  endDate?: string; // YYYY-MM-DD for recurring tasks
  recurringTaskId?: string; // The ID of the master recurring task
  componentId?: string;
  componentName?: string;
  unitId?: string;
  unitNumber?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  specialty: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  businessOwner?: string;
  contactPerson?: string;
  logoUrl?: string;
  // FIX: Add optional userId to link a service provider profile to a user account.
  // This was missing, causing property access errors.
  userId?: string;
  createdBy: string; // ID of the user who created this provider
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  url: string; // base64 data URL
  uploadedAt: string;
  uploadedBy: string;
}

export interface StatusChange {
    status: ServiceRequestStatus;
    changedAt: string;
    changedBy: string;
}

export interface ServiceRequest {
  id: string;
  taskId: string;
  providerId: string;
  specialty: string;
  notes: string;
  generatedEmail: string;
  sentAt: string;
  status: ServiceRequestStatus;
  cost?: number;
  scheduledDate?: string;
  comments: Comment[];
  isUrgent?: boolean;
  documents: Document[];
  statusHistory: StatusChange[];
  componentName?: string;
  unitId?: string;
  unitNumber?: string;
  // Email tracking fields (set by Cloud Function)
  emailSent?: boolean;
  emailSentAt?: string;
  emailMessageId?: string;
  emailError?: string;
}

export interface Expense {
  id: string;
  buildingId: string;
  buildingName: string;
  componentId: string;
  componentName: string;
  year: number;
  cost: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: {
    view: string;
    id: string;
  };
}