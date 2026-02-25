
import React, { useState, useEffect } from 'react';
import type { Building, MaintenanceTask, ServiceProvider, ServiceRequest, User, Comment, Document, StatusChange, Component, ComponentImage, Unit, Expense, Notification as NotificationType } from './types';
import { UserRole, ServiceRequestStatus, Recurrence, TaskStatus } from './types';
import { initGemini } from './services/geminiService';
import { useAppData } from './hooks/useAppData';
import * as fs from './services/firestoreService';
import * as authService from './services/authService';
import i18n from './i18n';
import { functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';
import { uploadUnitImage, uploadComponentImage, uploadRequestDocument, uploadContingencyDocument } from './services/storageService';
import { initialBuildings, initialTasks, initialServiceRequests, initialComponents, initialUnits, initialContingencyDocuments, initialExpenses, initialNotifications } from './data/initialData';

import SideNav from './components/SideNav';
import BuildingDashboard from './components/BuildingDashboard';
import BuildingDetailView from './components/BuildingDetailView';
import ServiceProvidersView from './components/ServiceProvidersView';
import ServiceProviderDetailView from './components/ServiceProviderDetailView';
import ServiceRequestsView from './components/ServiceRequestsView';
import ServiceRequestDetailView from './components/ServiceRequestDetailView';
import MaintenanceTasksView from './components/MaintenanceTasksView';
import DashboardView from './components/DashboardView';
import FinancialSummaryView from './components/FinancialSummaryView';
import ServiceProviderDashboard from './components/ServiceProviderDashboard';
import MyAccountView from './components/MyAccountView';
import AppManagementView from './components/AppManagementView';
import PropertyManagersView from './components/PropertyManagersView';
import EditServiceProviderUserModal from './components/EditServiceProviderUserModal';
import EditRequestModal from './components/EditRequestModal';
import EditBuildingModal from './components/EditBuildingModal';
import EditTaskModal from './components/EditTaskModal';
import EditUserModal from './components/EditUserModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import Notification from './components/Notification';
import LoginPage from './components/LoginPage';
import ComponentsView from './components/ComponentsView';
import EditComponentModal from './components/EditComponentModal';
import ComponentDetailView from './components/ComponentDetailView';
import ToolsView from './components/ToolsView';
import EditUnitModal from './components/EditUnitModal';
import ContingencyFundView from './components/ContingencyFundView';
import UnitDetailView from './components/UnitDetailView';
import NotificationsView from './components/NotificationsView';

export type View = 'dashboard' | 'financials' | 'properties' | 'tasks' | 'requests' | 'providers' | 'propertyManagers' | 'account' | 'management' | 'components' | 'tools' | 'contingencyFund' | 'notifications';
export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [geminiReady, setGeminiReady] = useState(false);
    
  useEffect(() => {
    setGeminiReady(initGemini());
  }, []);

  // Auth State (must be before useAppData, which subscribes only when authenticated)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = authService.subscribeToAuth(async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(null);
      } else {
        const profile = await fs.getUserById(fbUser.uid);
        setCurrentUser(profile || null);
        if (profile?.language) {
          i18n.changeLanguage(profile.language);
        }
      }
      setAuthChecked(true);
    });
    return () => { unsub?.(); };
  }, []);

  // --- Data: Firestore only (subscribes only when authenticated) ---
  const {
    users,
    buildings,
    tasks,
    providers,
    serviceRequests,
    components,
    units,
    contingencyDocuments,
    expenses,
    notifications,
    componentCategories,
  } = useAppData(!!currentUser);

  // UI State
  const [view, setView] = useState<View>('dashboard');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Persistence for Theme
  const [theme, setTheme] = useState<Theme>(() => {
      if (typeof window !== 'undefined') {
          return (window.localStorage.getItem('sos-condo-theme') as Theme) || 'dark';
      }
      return 'dark';
  });

  // Modal State
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ServiceProvider | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ServiceRequest | null>(null);
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MaintenanceTask | null>(null);
  const [preselectedBuildingId, setPreselectedBuildingId] = useState<string | null>(null);
  const [preselectedComponentId, setPreselectedComponentId] = useState<string | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userModalRole, setUserModalRole] = useState<UserRole.Admin | UserRole.PropertyManager>(UserRole.PropertyManager);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);
  const [isProviderUserModalOpen, setIsProviderUserModalOpen] = useState(false);
  const [isComponentModalOpen, setIsComponentModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitModalBuildingId, setUnitModalBuildingId] = useState<string | null>(null);
  
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('sos-condo-theme', theme);
  }, [theme]);

  const handleThemeChange = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleLanguageChange = async (lang: string) => {
    if (!currentUser) return;
    await fs.updateUser(currentUser.id, { language: lang });
    setCurrentUser(prev => prev ? { ...prev, language: lang } : null);
  };

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data to the initial state? This action cannot be undone.")) {
      setNotification({ type: 'success', message: "Reset is not supported. Use Firebase Console to clear data if needed." });
    }
  };

  const handleLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await authService.signIn(email, password);
    if (result.user) {
      setCurrentUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const handleLogout = async () => {
    await authService.logOut();
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleSaveBuilding = async (buildingData: Omit<Building, 'id'> | Building) => {
    const building: Building = 'id' in buildingData
      ? buildingData as Building
      : { ...buildingData, id: crypto.randomUUID(), createdBy: buildingData.createdBy || currentUser?.id || 'system' } as Building;
    await fs.setBuilding(building);
    setNotification({ type: 'success', message: 'Property saved successfully!' });
    handleCloseBuildingModal();
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    const tasksToDelete = tasks.filter(t => t.buildingId === buildingId);
    for (const t of tasksToDelete) await fs.deleteTask(t.id);
    const reqsToDelete = serviceRequests.filter(r => tasksToDelete.some(t => t.id === r.taskId));
    for (const r of reqsToDelete) await fs.deleteRequest(r.id);
    for (const c of components.filter(c => c.buildingId === buildingId)) await fs.deleteComponent(c.id);
    for (const u of units.filter(u => u.buildingId === buildingId)) await fs.deleteUnit(u.id);
    for (const e of expenses.filter(e => e.buildingId === buildingId)) await fs.deleteExpense(e.id);
    await fs.deleteBuilding(buildingId);
    setSelectedBuildingId(null);
    setNotification({ type: 'success', message: 'Property deleted.' });
  };

  const handleSaveUnit = async (unitData: Omit<Unit, 'id' | 'images'> | Unit) => {
    const unit: Unit = 'id' in unitData ? unitData as Unit : { ...unitData, id: crypto.randomUUID(), images: [] };
    await fs.setUnit(unit);
    setNotification({ type: 'success', message: 'Unit saved successfully!' });
    handleCloseUnitModal();
  };

  const handleDeleteUnit = async (unitId: string) => {
    const isUsedInTask = tasks.some(t => t.unitId === unitId);
    const isUsedInComponent = components.some(c => c.unitId === unitId);
    if (isUsedInTask || isUsedInComponent) {
      setNotification({ type: 'error', message: 'Cannot delete unit. It is currently associated with tasks or components.' });
      return;
    }
    await fs.deleteUnit(unitId);
    setNotification({ type: 'success', message: 'Unit deleted successfully.' });
  };

  const handleAddUnitImages = async (unitId: string, files: FileList) => {
    try {
      const imagePromises = Array.from(files).map(async file => {
        const url = await uploadUnitImage(file, unitId);
        return { id: crypto.randomUUID(), url, uploadedAt: new Date().toISOString() };
      });
      const newImages = await Promise.all(imagePromises);
      const unit = units.find(u => u.id === unitId);
      if (!unit) return;
      const updated = { ...unit, images: [...(unit.images || []), ...newImages] };
      await fs.setUnit(updated);
      setNotification({ type: 'success', message: `${newImages.length} image(s) added.` });
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to upload image(s).' });
    }
  };

  const handleDeleteUnitImage = async (unitId: string, imageId: string) => {
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;
    const updated = { ...unit, images: unit.images.filter(img => img.id !== imageId) };
    await fs.setUnit(updated);
    setNotification({ type: 'success', message: 'Image deleted.' });
  };

  // Helper for Recurring Task Generation
  const generateRecurringTasks = (masterTask: MaintenanceTask): Omit<MaintenanceTask, 'id'>[] => {
    const instances: Omit<MaintenanceTask, 'id'>[] = [];
    if (!masterTask.startDate || !masterTask.endDate) return instances;

    let currentDate = new Date(`${masterTask.startDate}T12:00:00Z`);
    const lastDate = new Date(`${masterTask.endDate}T12:00:00Z`);

    while (currentDate <= lastDate) {
        const instance: Omit<MaintenanceTask, 'id' | 'startDate' | 'endDate'> & { startDate?: string; endDate?: string } = {
            ...masterTask,
            recurrence: Recurrence.OneTime,
            taskDate: currentDate.toISOString().split('T')[0],
            recurringTaskId: masterTask.id,
            status: TaskStatus.New,
        };
        delete instance.startDate;
        delete instance.endDate;
        
        instances.push(instance);

        switch (masterTask.recurrence) {
            case Recurrence.Weekly: currentDate.setDate(currentDate.getDate() + 7); break;
            case Recurrence.BiWeekly: currentDate.setDate(currentDate.getDate() + 14); break;
            case Recurrence.Monthly: currentDate.setMonth(currentDate.getMonth() + 1); break;
            case Recurrence.Quarterly: currentDate.setMonth(currentDate.getMonth() + 3); break;
            case Recurrence.SemiAnnually: currentDate.setMonth(currentDate.getMonth() + 6); break;
            case Recurrence.Annually: currentDate.setFullYear(currentDate.getFullYear() + 1); break;
            default: return instances;
        }
    }
    return instances;
  };

  const handleSaveTask = async (taskData: Omit<MaintenanceTask, 'id'> | MaintenanceTask) => {
    const isMasterRecurring = taskData.recurrence !== Recurrence.OneTime;
    if ('id' in taskData) {
      await fs.setTask(taskData as MaintenanceTask);
    } else {
      const newTaskId = crypto.randomUUID();
      const newTask = { ...taskData, id: newTaskId } as MaintenanceTask;
      await fs.setTask(newTask);
      if (isMasterRecurring) {
        const instances = generateRecurringTasks(newTask).map(inst => ({ ...inst, id: crypto.randomUUID() }));
        for (const t of instances) await fs.setTask(t as MaintenanceTask);
      }
    }
    setNotification({ type: 'success', message: 'Task saved successfully!' });
    handleCloseTaskModal();
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    
    // Collect all task IDs to delete (including recurring instances)
    const taskIdsToDelete: string[] = [];
    if (taskToDelete?.recurrence !== Recurrence.OneTime) {
      taskIdsToDelete.push(...tasks.filter(t => t.recurringTaskId === taskId || t.id === taskId).map(t => t.id));
    } else {
      taskIdsToDelete.push(taskId);
    }
    
    // Delete all related service requests first
    const relatedRequests = serviceRequests.filter(sr => taskIdsToDelete.includes(sr.taskId));
    for (const request of relatedRequests) {
      await fs.deleteRequest(request.id);
    }
    
    // Then delete the tasks
    for (const id of taskIdsToDelete) {
      await fs.deleteTask(id);
    }
    
    const deletedRequestCount = relatedRequests.length;
    const message = deletedRequestCount > 0 
      ? `Task deleted successfully! ${deletedRequestCount} related service request(s) also removed.`
      : 'Task deleted successfully!';
    setNotification({ type: 'success', message });
  };

  const handleSaveComponent = async (componentData: Omit<Component, 'id'> | Component) => {
    const component: Component = 'id' in componentData ? componentData as Component : { ...componentData, id: crypto.randomUUID(), images: (componentData as Component).images ?? [] };
    await fs.setComponent(component);
    setNotification({ type: 'success', message: 'Component saved successfully!' });
    handleCloseComponentModal();
  };

  const handleDeleteComponent = async (componentId: string) => {
    await fs.deleteComponent(componentId);
    setNotification({ type: 'success', message: 'Component deleted successfully.' });
    setSelectedComponentId(null);
  };

  const handleAddComponentImage = async (componentId: string, files: FileList) => {
    try {
      const imagePromises = Array.from(files).map(async file => {
        const url = await uploadComponentImage(file, componentId);
        return { id: crypto.randomUUID(), url, uploadedAt: new Date().toISOString() };
      });
      const newImages = await Promise.all(imagePromises);
      const component = components.find(c => c.id === componentId);
      if (!component) return;
      const updated = { ...component, images: [...(component.images || []), ...newImages] };
      await fs.setComponent(updated);
      setNotification({ type: 'success', message: `${newImages.length} image(s) added.` });
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to upload image(s).' });
    }
  };

  const handleDeleteComponentImage = async (componentId: string, imageId: string) => {
    const component = components.find(c => c.id === componentId);
    if (!component) return;
    const updated = { ...component, images: component.images.filter(img => img.id !== imageId) };
    await fs.setComponent(updated);
    setNotification({ type: 'success', message: 'Image deleted.' });
  };

  const handleAddServiceRequest = async (request: Omit<ServiceRequest, 'id' | 'comments' | 'documents' | 'statusHistory'>) => {
    if (!currentUser) return;
    const sourceTask = tasks.find(t => t.id === request.taskId);
    const newRequest: ServiceRequest = {
        ...request,
        id: crypto.randomUUID(),
        comments: [],
        documents: [],
        statusHistory: [{ status: ServiceRequestStatus.Sent, changedAt: new Date().toISOString(), changedBy: currentUser.username }],
        unitId: sourceTask?.unitId,
        unitNumber: sourceTask?.unitNumber,
    };
    await fs.setRequest(newRequest);
    if (sourceTask) await fs.setTask({ ...sourceTask, status: TaskStatus.Sent });
    setNotification({ type: 'success', message: 'Service request sent!' });
  };

  const handleUpdateServiceRequestStatus = async (id: string, status: ServiceRequestStatus) => {
    if (!currentUser) return;
    const req = serviceRequests.find(r => r.id === id);
    if (!req) return;
    const updated = { ...req, status, statusHistory: [...(req.statusHistory || []), { status, changedAt: new Date().toISOString(), changedBy: currentUser.username }] };
    await fs.setRequest(updated);
    const task = tasks.find(t => t.id === req.taskId);
    if (task) {
      let newTaskStatus = task.status;
      if (status === ServiceRequestStatus.Accepted) newTaskStatus = TaskStatus.OnHold;
      else if (status === ServiceRequestStatus.Refused) newTaskStatus = TaskStatus.New;
      else if (status === ServiceRequestStatus.Completed) newTaskStatus = TaskStatus.Completed;
      if (newTaskStatus !== task.status) await fs.setTask({ ...task, status: newTaskStatus });
    }
    setNotification({ type: 'success', message: 'Request status updated.' });
  };

  const handleUpdateRequest = async (request: ServiceRequest) => {
    await fs.setRequest(request);
    setNotification({ type: 'success', message: 'Service request updated.' });
    handleCloseRequestModal();
  };

  const handleDeleteProvider = async (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider && currentUser && (currentUser.role === UserRole.Admin || currentUser.role === UserRole.PropertyManager)) {
      if (provider.createdBy !== currentUser.id) {
        setNotification({ type: 'error', message: 'You can only delete service providers you created.' });
        return;
      }
    }
    // Delete all service requests associated with this provider first
    const relatedRequests = serviceRequests.filter(sr => sr.providerId === providerId);
    for (const request of relatedRequests) {
      await fs.deleteRequest(request.id);
    }
    
    // Then delete the provider
    await fs.deleteProvider(providerId);
    
    const deletedRequestCount = relatedRequests.length;
    const message = deletedRequestCount > 0 
      ? `Provider deleted successfully! ${deletedRequestCount} related service request(s) also removed.`
      : 'Provider deleted successfully!';
    setNotification({ type: 'success', message });
  };

  const handleDeleteOrphanedRequests = async (requestIds: string[]) => {
    for (const requestId of requestIds) {
      await fs.deleteRequest(requestId);
    }
    setNotification({ type: 'success', message: `${requestIds.length} orphaned service request(s) deleted successfully!` });
  };

  const handleDeleteServiceRequest = async (requestId: string) => {
    await fs.deleteRequest(requestId);
    if (selectedRequestId === requestId) setSelectedRequestId(null);
    setNotification({ type: 'success', message: 'Service request deleted.' });
  };

  const handleSaveUser = async (userData: Omit<User, 'id'> | User, password?: string): Promise<boolean> => {
    if (!currentUser) return false;
    const isNew = !('id' in userData);
    if (isNew && password) {
      const role = (userData as Omit<User, 'id'>).role as 'Admin' | 'Property Manager';
      const result = await authService.createUserForAdmin(
        (userData as Omit<User, 'id'>).email,
        password,
        (userData as Omit<User, 'id'>).username,
        role,
        currentUser.id
      );
      if (result.error) {
        setNotification({ type: 'error', message: result.error });
        return false;
      }
      setNotification({ type: 'success', message: 'User created successfully. They can now log in.' });
      handleCloseUserModal();
      return true;
    }
    if (!isNew) {
      const user = userData as User;
      await fs.setUser(user);
      setNotification({ type: 'success', message: 'User updated successfully.' });
    }
    handleCloseUserModal();
    return true;
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser?.id) { setNotification({ type: 'error', message: "You cannot delete your own account."}); return; }
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === UserRole.SuperAdmin) { setNotification({ type: 'error', message: "The Super Admin account cannot be deleted."}); return; }
    if (userToDelete?.role === UserRole.PropertyManager && currentUser.role === UserRole.Admin && userToDelete.createdBy !== currentUser.id) {
      setNotification({ type: 'error', message: 'You can only delete property managers you created.' });
      return;
    }
    await fs.deleteUser(userId);
    setNotification({ type: 'success', message: 'User profile deleted.' });
  };

  const handleSaveProviderAndUser = async (data: { providerData: Omit<ServiceProvider, 'id'> | ServiceProvider, userData: { email: string, username: string, password?: string } }): Promise<boolean> => {
    if (!currentUser) return false;
    let userId: string;
    if (data.providerData.userId) {
      userId = data.providerData.userId;
      const existingUser = users.find(u => u.id === userId);
      if (existingUser) {
        const u = { ...existingUser, username: data.userData.username, email: data.userData.email };
        await fs.setUser(u);
      }
    } else {
      const password = data.userData.password || 'password123';
      const result = await authService.createUserForAdmin(
        data.userData.email,
        password,
        data.userData.username,
        'Service Provider',
        currentUser.id
      );
      if (result.error) {
        setNotification({ type: 'error', message: result.error });
        return false;
      }
      userId = result.uid!;
    }
    const provider: ServiceProvider = 'id' in data.providerData
      ? { ...data.providerData, userId } as ServiceProvider
      : { ...data.providerData, id: crypto.randomUUID(), userId, createdBy: currentUser.id } as ServiceProvider;
    await fs.setProvider(provider);
    setNotification({ type: 'success', message: 'Provider and User saved successfully. They can now log in.' });
    handleCloseProviderUserModal();
    return true;
  };

  const handleUpdateCurrentUser = async (data: { email?: string; username?: string; }) => {
    if (!currentUser) return { success: false, message: 'No user logged in.' };
    const updated = { ...currentUser, ...data };
    await fs.setUser(updated);
    setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    return { success: true, message: 'Account updated successfully.' };
  };

  const handleSaveProviderProfile = async (provider: ServiceProvider) => {
    await fs.setProvider(provider);
    setNotification({ type: 'success', message: 'Provider profile updated.' });
  };

  const handleAddComment = async (requestId: string, commentText: string) => {
    if (!currentUser) return;
    const newComment: Comment = { id: crypto.randomUUID(), authorId: currentUser.id, authorName: currentUser.username, text: commentText, createdAt: new Date().toISOString() };
    const req = serviceRequests.find(r => r.id === requestId);
    if (!req) return;
    const updated = { ...req, comments: [...req.comments, newComment] };
    await fs.setRequest(updated);
    setNotification({ type: 'success', message: 'Comment added.' });
  };

  const handleAddDocument = async (requestId: string, file: File) => {
    if (!currentUser) return;
    try {
      const url = await uploadRequestDocument(file, requestId);
      const newDocument: Document = { id: crypto.randomUUID(), name: file.name, url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser.username };
      const req = serviceRequests.find(r => r.id === requestId);
      if (!req) return;
      const updated = { ...req, documents: [...(req.documents || []), newDocument] };
      await fs.setRequest(updated);
      setNotification({ type: 'success', message: 'Document uploaded.' });
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to upload document.' });
    }
  };

  const handleDeleteDocument = async (requestId: string, documentId: string) => {
    const req = serviceRequests.find(r => r.id === requestId);
    if (!req) return;
    const updated = { ...req, documents: req.documents.filter(d => d.id !== documentId) };
    await fs.setRequest(updated);
    setNotification({ type: 'success', message: 'Document deleted.' });
  };

  const handleAddContingencyDocument = async (file: File) => {
    if (!currentUser) return;
    try {
      const url = await uploadContingencyDocument(file);
      const newDocument: Document = { id: crypto.randomUUID(), name: file.name, url, uploadedAt: new Date().toISOString(), uploadedBy: currentUser.username };
      await fs.setContingencyDocument(newDocument);
      setNotification({ type: 'success', message: 'Document uploaded successfully.' });
    } catch (err) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to upload document.' });
    }
  };

  const handleDeleteContingencyDocument = async (documentId: string) => {
    await fs.deleteContingencyDocument(documentId);
    setNotification({ type: 'success', message: 'Document deleted.' });
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'buildingName' | 'componentName'>) => {
    const building = buildings.find(b => b.id === expenseData.buildingId);
    const component = components.find(c => c.id === expenseData.componentId);
    if (!building || !component) { setNotification({ type: 'error', message: 'Invalid building or component selected.' }); return; }
    const newExpense: Expense = {
        ...expenseData,
        id: crypto.randomUUID(),
        buildingName: building.name,
        componentName: component.name,
        createdAt: new Date().toISOString(),
    };
    await fs.setExpense(newExpense);
    setNotification({ type: 'success', message: 'Expense added successfully.' });
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await fs.deleteExpense(expenseId);
    setNotification({ type: 'success', message: 'Expense deleted.' });
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    const n = notifications.find(x => x.id === notificationId);
    if (!n) return;
    const updated = { ...n, isRead: true };
    await fs.setNotification(updated);
  };

  const handleMarkAllNotificationsRead = async () => {
    for (const n of notifications) await fs.setNotification({ ...n, isRead: true });
  };
  
  const handleNotificationClick = (view: string, id: string) => {
    switch(view) {
        case 'requests': handleSelectRequest(id); break;
        case 'tasks': handleNavigate('tasks'); break;
        case 'properties': handleSelectBuilding(id); break;
        default: handleNavigate(view as View); break;
    }
  };


  // --- Modal Handlers ---
  const handleOpenProviderModal = (provider: ServiceProvider | null) => { setEditingProvider(provider); setIsProviderModalOpen(true); };
  const handleCloseProviderModal = () => { setIsProviderModalOpen(false); setEditingProvider(null); };
  const handleOpenRequestModal = (request: ServiceRequest) => { setEditingRequest(request); setIsRequestModalOpen(true); };
  const handleCloseRequestModal = () => { setIsRequestModalOpen(false); setEditingRequest(null); };
  const handleOpenBuildingModal = (building: Building | null) => { setEditingBuilding(building); setIsBuildingModalOpen(true); };
  const handleCloseBuildingModal = () => { setIsBuildingModalOpen(false); setEditingBuilding(null); };
  const handleOpenTaskModal = (task: MaintenanceTask | null, buildingId: string | null = null, componentId: string | null = null) => { 
    setEditingTask(task); 
    setPreselectedBuildingId(buildingId);
    setPreselectedComponentId(componentId); 
    setIsTaskModalOpen(true); 
  };
  const handleCloseTaskModal = () => { 
    setIsTaskModalOpen(false); 
    setEditingTask(null); 
    setPreselectedBuildingId(null);
    setPreselectedComponentId(null);
  };
  const handleOpenUserModal = (user: User | null, role: UserRole.Admin | UserRole.PropertyManager) => { 
    setEditingUser(user); 
    setUserModalRole(role);
    setIsUserModalOpen(true); 
  };
  const handleCloseUserModal = () => { 
    setIsUserModalOpen(false); 
    setEditingUser(null);
  };

  const handleChangePassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!functions || !currentUser) {
      return { success: false, error: 'Not configured or not signed in.' };
    }
    try {
      const changePasswordFn = httpsCallable<
        { userId: string; newPassword: string },
        { success: boolean }
      >(functions, 'changeUserPassword');
      await changePasswordFn({ userId, newPassword });
      setNotification({ type: 'success', message: 'Password changed successfully.' });
      setIsPasswordModalOpen(false);
      setPasswordChangeUser(null);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password.';
      return { success: false, error: msg };
    }
  };

  const handleClosePasswordModal = () => {
    setIsPasswordModalOpen(false);
    setPasswordChangeUser(null);
  };

  /** Opens the change-password modal for the current user (My Account page). */
  const handleOpenChangePasswordForCurrentUser = () => {
    if (!currentUser?.id) return;
    setPasswordChangeUser({
      ...currentUser,
      id: currentUser.id,
      email: currentUser.email ?? '',
      username: currentUser.username ?? currentUser.email ?? '',
    });
    setIsPasswordModalOpen(true);
  };
  const handleOpenProviderUserModal = (provider: ServiceProvider | null) => { setEditingProvider(provider); setIsProviderUserModalOpen(true); };
  const handleCloseProviderUserModal = () => { setIsProviderUserModalOpen(false); setEditingProvider(null); };
  const handleOpenComponentModal = (component: Component | null, buildingId: string | null = null) => { 
    setEditingComponent(component); 
    setPreselectedBuildingId(buildingId);
    setIsComponentModalOpen(true); 
  };
  const handleCloseComponentModal = () => { 
    setIsComponentModalOpen(false); 
    setEditingComponent(null);
    setPreselectedBuildingId(null);
  };
  const handleOpenUnitModal = (unit: Unit | null, buildingId: string) => { 
    setEditingUnit(unit); 
    setUnitModalBuildingId(buildingId);
    setIsUnitModalOpen(true); 
  };
  const handleCloseUnitModal = () => { 
    setIsUnitModalOpen(false); 
    setEditingUnit(null);
    setUnitModalBuildingId(null);
  };

  // --- Navigation ---
  const handleSelectBuilding = (buildingId: string) => { setView('properties'); setSelectedBuildingId(buildingId); setSelectedUnitId(null); };
  const handleSelectProvider = (providerId: string) => { setView('providers'); setSelectedProviderId(providerId); };
  const handleSelectRequest = (requestId: string) => { setView('requests'); setSelectedRequestId(requestId); };
  const handleSelectComponent = (componentId: string) => { setView('components'); setSelectedComponentId(componentId); };
  const handleSelectUnit = (unitId: string) => { setView('properties'); setSelectedUnitId(unitId); };
  const handleNavigate = (newView: View) => { setView(newView); setSelectedBuildingId(null); setSelectedUnitId(null); setSelectedProviderId(null); setSelectedRequestId(null); setSelectedComponentId(null); };

  // --- Render Logic ---
  if (!geminiReady) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="mt-4 text-2xl font-bold text-gray-800">Configuration Error</h2>
                    <p className="mt-2 text-gray-600">
                        The Gemini API key is missing. The application cannot start.
                    </p>
                </div>
            </div>
        </div>
    );
  }

  if (!authChecked || !currentUser) {
    return (
      <>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        {authChecked ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">Loading...</div>
          </div>
        )}
      </>
    );
  }

  // --- Data Scoping: Only Super Admin sees all. Others see only their own data. ---
  let visibleBuildings = buildings;
  let visibleTasks = tasks;
  let visibleComponents = components;
  let visibleUnits = units;
  let visibleServiceRequests = serviceRequests;
  let visibleExpenses = expenses;
  let visibleProviders = providers;
  let visibleContingencyDocuments = contingencyDocuments;
  let visibleNotifications = notifications.filter(n => n.userId === currentUser.id);

  const applyBuildingScope = (buildingIds: Set<string>) => {
    visibleTasks = tasks.filter(t => buildingIds.has(t.buildingId));
    const visibleTaskIds = new Set(visibleTasks.map(t => t.id));
    visibleComponents = components.filter(c => buildingIds.has(c.buildingId));
    visibleUnits = units.filter(u => buildingIds.has(u.buildingId));
    visibleServiceRequests = serviceRequests.filter(sr => visibleTaskIds.has(sr.taskId));
    visibleExpenses = expenses.filter(e => buildingIds.has(e.buildingId));
  };

  if (currentUser.role === UserRole.Admin) {
    const managedManagers = users.filter(u => u.role === UserRole.PropertyManager && u.createdBy === currentUser.id);
    const visibleUserIds = [...managedManagers.map(u => u.id), currentUser.id];
    const visibleUsernames = new Set([currentUser.username, ...managedManagers.map(u => u.username)]);
    visibleBuildings = buildings.filter(b => b.createdBy && visibleUserIds.includes(b.createdBy));
    // Admin sees all providers (global + PM-created)
    visibleContingencyDocuments = contingencyDocuments.filter(d => visibleUsernames.has(d.uploadedBy));
    applyBuildingScope(new Set(visibleBuildings.map(b => b.id)));
  } else if (currentUser.role === UserRole.PropertyManager) {
    visibleBuildings = buildings.filter(b => b.createdBy === currentUser.id);
    // PM sees: providers added by Super Admin/Admin (global), or by themselves
    visibleProviders = providers.filter(p => {
      const creator = users.find(u => u.id === p.createdBy);
      if (!creator) return false;
      if (creator.role === UserRole.SuperAdmin || creator.role === UserRole.Admin) return true;
      return p.createdBy === currentUser.id;
    });
    visibleContingencyDocuments = contingencyDocuments.filter(d => d.uploadedBy === currentUser.username);
    applyBuildingScope(new Set(visibleBuildings.map(b => b.id)));
  }

  const selectedBuilding = visibleBuildings.find(b => b.id === selectedBuildingId);
  const buildingTasks = visibleTasks.filter(t => t.buildingId === selectedBuildingId);
  const getTaskServiceRequests = (taskId: string) => visibleServiceRequests.filter(sr => sr.taskId === taskId);
  
  const selectedProvider = providers.find(p => p.id === selectedProviderId);
  const providerServiceRequests = visibleServiceRequests.filter(r => r.providerId === selectedProviderId);

  const selectedRequest = visibleServiceRequests.find(r => r.id === selectedRequestId);
  const selectedComponent = visibleComponents.find(c => c.id === selectedComponentId);
  const selectedUnit = visibleUnits.find(u => u.id === selectedUnitId);
  const selectedUnitBuilding = buildings.find(b => b.id === selectedUnit?.buildingId);

  // Filter data for Service Provider role
  const providerProfile = providers.find(p => p.userId === currentUser.id);
  const providerRequests = providerProfile ? serviceRequests.filter(r => r.providerId === providerProfile.id) : [];
  const providerTaskIds = [...new Set(providerRequests.map(r => r.taskId))];
  const providerTasks = tasks.filter(t => providerTaskIds.includes(t.id));
  const providerBuildingIds = [...new Set(providerTasks.map(t => t.buildingId))];
  const providerBuildings = buildings.filter(b => providerBuildingIds.includes(b.id));


  const renderManagerContent = () => {
     switch(view) {
      case 'dashboard':
        return <DashboardView 
          buildings={visibleBuildings}
          units={visibleUnits}
          components={visibleComponents}
          tasks={visibleTasks} 
          providers={visibleProviders} 
          serviceRequests={visibleServiceRequests} 
          expenses={visibleExpenses}
          onEditTask={handleOpenTaskModal} 
          onSelectRequest={handleSelectRequest} 
          onDeleteTask={handleDeleteTask} 
          onDeleteServiceRequest={handleDeleteServiceRequest}
          onAddServiceRequest={handleAddServiceRequest} 
          onSelectBuilding={handleSelectBuilding} 
          onAddBuilding={() => handleOpenBuildingModal(null)} 
        />;
      case 'notifications':
        return <NotificationsView
            notifications={visibleNotifications}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onNavigate={handleNotificationClick}
        />;
      case 'financials':
        return <FinancialSummaryView tasks={visibleTasks} buildings={visibleBuildings} />;
      case 'contingencyFund':
        return <ContingencyFundView documents={visibleContingencyDocuments} onAddDocument={handleAddContingencyDocument} onDeleteDocument={handleDeleteContingencyDocument} expenses={visibleExpenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} buildings={visibleBuildings} components={visibleComponents} />;
      case 'properties':
        if (selectedUnit && selectedUnitBuilding) {
            return <UnitDetailView 
                unit={selectedUnit}
                building={selectedUnitBuilding}
                components={visibleComponents}
                tasks={visibleTasks}
                serviceRequests={visibleServiceRequests}
                providers={visibleProviders}
                onBack={() => setSelectedUnitId(null)}
                onOpenUnitModal={handleOpenUnitModal}
                onAddUnitImages={handleAddUnitImages}
                onDeleteUnitImage={handleDeleteUnitImage}
                onSelectComponent={handleSelectComponent}
                onSelectRequest={handleSelectRequest}
                onOpenTaskModal={handleOpenTaskModal}
                onAddServiceRequest={handleAddServiceRequest}
            />
        }
        return selectedBuilding ? (
          <BuildingDetailView building={selectedBuilding} tasks={buildingTasks} providers={visibleProviders} onOpenTaskModal={handleOpenTaskModal} onAddServiceRequest={handleAddServiceRequest} getTaskServiceRequests={getTaskServiceRequests} onBack={() => setSelectedBuildingId(null)} onEditBuilding={handleOpenBuildingModal} onSelectRequest={handleSelectRequest} components={visibleComponents.filter(c => c.buildingId === selectedBuildingId)} onSelectComponent={handleSelectComponent} onDeleteBuilding={handleDeleteBuilding} units={visibleUnits.filter(u => u.buildingId === selectedBuildingId)} onOpenUnitModal={handleOpenUnitModal} onDeleteUnit={handleDeleteUnit} onOpenComponentModal={handleOpenComponentModal} onSelectUnit={handleSelectUnit} />
        ) : (
          <BuildingDashboard 
            buildings={visibleBuildings} 
            onAddBuilding={() => handleOpenBuildingModal(null)} 
            onSelectBuilding={(id) => setSelectedBuildingId(id)}
            components={visibleComponents}
            onSelectComponent={handleSelectComponent}
            onDeleteBuilding={handleDeleteBuilding}
          />
        );
      case 'components':
        if (selectedComponent) {
            const building = visibleBuildings.find(b => b.id === selectedComponent.buildingId);
            const componentTasks = visibleTasks.filter(t => t.componentId === selectedComponent.id);
            return <ComponentDetailView 
                component={selectedComponent}
                building={building}
                tasks={componentTasks}
                serviceRequests={visibleServiceRequests}
                providers={visibleProviders}
                onBack={() => setSelectedComponentId(null)}
                onEditComponent={handleOpenComponentModal}
                onAddImage={handleAddComponentImage}
                onDeleteImage={handleDeleteComponentImage}
                onDeleteComponent={handleDeleteComponent}
                onOpenTaskModal={handleOpenTaskModal}
                onSelectRequest={handleSelectRequest}
                onAddServiceRequest={handleAddServiceRequest}
            />
        }
        return <ComponentsView 
            components={visibleComponents} 
            buildings={visibleBuildings} 
            componentCategories={componentCategories}
            onAddComponent={() => handleOpenComponentModal(null)}
            onSelectComponent={handleSelectComponent}
        />;
      case 'tasks':
        return <MaintenanceTasksView tasks={visibleTasks} buildings={visibleBuildings} providers={visibleProviders} onEditTask={handleOpenTaskModal} onAddTask={() => handleOpenTaskModal(null)} onDeleteTask={handleDeleteTask} onAddServiceRequest={handleAddServiceRequest} />;
      case 'requests':
        if (selectedRequest) {
          const task = visibleTasks.find(t => t.id === selectedRequest.taskId);
          const building = visibleBuildings.find(b => b.id === task?.buildingId);
          const provider = visibleProviders.find(p => p.id === selectedRequest.providerId);
          return <ServiceRequestDetailView request={selectedRequest} task={task} building={building} provider={provider} currentUser={currentUser} onBack={() => setSelectedRequestId(null)} onUpdateRequestStatus={handleUpdateServiceRequestStatus} onAddComment={handleAddComment} onEditRequest={handleOpenRequestModal} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} />;
        }
        return <ServiceRequestsView requests={visibleServiceRequests} tasks={visibleTasks} buildings={visibleBuildings} providers={visibleProviders} onSelectRequest={handleSelectRequest} onDeleteServiceRequest={handleDeleteServiceRequest} />;
      case 'propertyManagers':
        if (![UserRole.SuperAdmin, UserRole.Admin].includes(currentUser.role)) return <div>Access Denied</div>;
        const visibleManagers = currentUser.role === UserRole.SuperAdmin
          ? users.filter(u => u.role === UserRole.PropertyManager)
          : users.filter(u => u.role === UserRole.PropertyManager && u.createdBy === currentUser.id);
        return <PropertyManagersView
            managers={visibleManagers}
            users={users}
            currentUser={currentUser}
            onAddManager={() => handleOpenUserModal(null, UserRole.PropertyManager)}
            onEditManager={(user) => handleOpenUserModal(user, UserRole.PropertyManager)}
            onDeleteManager={handleDeleteUser}
            onChangePassword={(user) => { setPasswordChangeUser(user); setIsPasswordModalOpen(true); }}
        />;
      case 'providers':
        return selectedProvider ? (
            <ServiceProviderDetailView 
                provider={selectedProvider} 
                requests={providerServiceRequests}
                tasks={visibleTasks}
                buildings={visibleBuildings}
                onBack={() => setSelectedProviderId(null)} 
                onEditProvider={handleOpenProviderUserModal}
                onSelectRequest={handleSelectRequest}
                onSaveProvider={handleSaveProviderProfile}
                currentUser={currentUser}
            />
        ) : (
            <ServiceProvidersView 
                providers={visibleProviders} 
                users={users}
                onSelectProvider={handleSelectProvider}
                onAddProvider={() => handleOpenProviderUserModal(null)} 
                onDeleteProvider={handleDeleteProvider} 
                currentUser={currentUser}
            />
        );
       case 'tools':
         return <ToolsView 
           serviceRequests={serviceRequests}
           tasks={tasks}
           providers={providers}
           onDeleteOrphanedRequests={handleDeleteOrphanedRequests}
           currentUser={currentUser}
           onSendTaskReminderNow={async () => {
             if (!functions) return null;
             const fn = httpsCallable<{ language?: string }, { success: boolean; emailsSent?: number; tasksFound?: number; error?: string }>(functions, 'sendTaskReminderEmailsNow');
             const lang = i18n.language?.toLowerCase().substring(0, 2) || 'en';
             const res = await fn({ language: lang });
             return res.data;
           }}
         />;
      case 'account':
        return <MyAccountView currentUser={currentUser} onUpdateCurrentUser={handleUpdateCurrentUser} onSaveProvider={handleSaveProviderProfile} serviceProviderProfile={providers.find(p => p.userId === currentUser.id)} onChangePassword={handleOpenChangePasswordForCurrentUser} />;
      case 'management':
        if (![UserRole.SuperAdmin, UserRole.Admin].includes(currentUser.role)) {
            return <div>Access Denied</div>;
        }
        const adminUsers = users.filter(u => u.role === UserRole.Admin);
        const managersForAdminView = currentUser.role === UserRole.SuperAdmin
            ? users.filter(u => u.role === UserRole.PropertyManager)
            : users.filter(u => u.role === UserRole.PropertyManager && u.createdBy === currentUser.id);

        return <AppManagementView 
            currentUser={currentUser} 
            admins={adminUsers}
            managers={managersForAdminView} 
            providers={visibleProviders} 
            users={users} 
            onAddAdmin={() => handleOpenUserModal(null, UserRole.Admin)}
            onEditAdmin={(user) => handleOpenUserModal(user, UserRole.Admin)}
            onDeleteAdmin={handleDeleteUser}
            onAddManager={() => handleOpenUserModal(null, UserRole.PropertyManager)} 
            onEditManager={(user) => handleOpenUserModal(user, UserRole.PropertyManager)} 
            onDeleteManager={handleDeleteUser} 
            onAddProvider={() => handleOpenProviderUserModal(null)} 
            onEditProvider={handleOpenProviderUserModal} 
            onDeleteProvider={handleDeleteProvider} 
            onResetData={handleResetData}
            onChangePassword={(user) => { setPasswordChangeUser(user); setIsPasswordModalOpen(true); }}
            onChangeProviderPassword={(provider) => {
              if (!provider.userId) return;
              const providerUser = users.find(u => u.id === provider.userId) ?? {
                id: provider.userId,
                email: provider.email ?? '',
                username: provider.name ?? provider.contactPerson ?? '',
                role: UserRole.ServiceProvider,
              } as User;
              setPasswordChangeUser(providerUser);
              setIsPasswordModalOpen(true);
            }}
        />;
      default:
        return null;
    }
  }
  
  const renderProviderContent = () => {
    if (view === 'notifications') {
        return <NotificationsView
            notifications={visibleNotifications}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onNavigate={handleNotificationClick}
        />;
    }
    if (selectedRequest && providerProfile && selectedRequest.providerId === providerProfile.id) {
        const task = tasks.find(t => t.id === selectedRequest.taskId);
        const building = buildings.find(b => b.id === task?.buildingId);
        const provider = providers.find(p => p.id === selectedRequest.providerId);
        return <ServiceRequestDetailView request={selectedRequest} task={task} building={building} provider={provider} currentUser={currentUser} onBack={() => setSelectedRequestId(null)} onUpdateRequestStatus={handleUpdateServiceRequestStatus} onAddComment={handleAddComment} onEditRequest={handleOpenRequestModal} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument}/>;
    }
    return <ServiceProviderDashboard requests={providerRequests} tasks={providerTasks} buildings={providerBuildings} onUpdateRequestStatus={handleUpdateServiceRequestStatus} onSelectRequest={handleSelectRequest} />
  }

  const renderContent = () => {
    if (view === 'account') {
        return <MyAccountView currentUser={currentUser} onUpdateCurrentUser={handleUpdateCurrentUser} onSaveProvider={handleSaveProviderProfile} serviceProviderProfile={providerProfile} onChangePassword={handleOpenChangePasswordForCurrentUser} />;
    }
    if (currentUser.role === UserRole.ServiceProvider) {
        return renderProviderContent();
    }
    return renderManagerContent();
  }

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 dark:text-gray-200">
      <SideNav 
        currentView={view} 
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileNavOpen={isMobileNavOpen}
        onCloseMobileNav={() => setIsMobileNavOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        onLanguageChange={handleLanguageChange}
        notifications={visibleNotifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onNotificationClick={handleNotificationClick}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white dark:bg-gray-800 shadow-sm dark:border-b dark:border-gray-700 z-10">
          <div className="flex justify-between items-center p-4">
            <button onClick={() => handleNavigate('dashboard')} className="flex items-center space-x-2 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md -ml-2 p-2">
              <svg className="h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21" />
              </svg>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                S.O.S.<span className="text-primary-600">Condo</span>
              </h1>
            </button>
            <div className="flex items-center space-x-2">
              <button onClick={() => handleNavigate('dashboard')} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500" aria-label="Go to Dashboard">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125-1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
                </svg>
              </button>
              <button onClick={() => setIsMobileNavOpen(true)} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            {renderContent()}
        </main>
      </div>
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {isProviderUserModalOpen && (
        <EditServiceProviderUserModal 
            provider={editingProvider}
            users={users}
            onClose={handleCloseProviderUserModal}
            onSave={handleSaveProviderAndUser}
        />
      )}
      {isRequestModalOpen && editingRequest && (
        <EditRequestModal request={editingRequest} providers={visibleProviders} tasks={visibleTasks} buildings={visibleBuildings} onClose={handleCloseRequestModal} onSave={handleUpdateRequest} />
      )}
      {isBuildingModalOpen && (
        <EditBuildingModal building={editingBuilding} onClose={handleCloseBuildingModal} onSave={handleSaveBuilding} />
      )}
      {isTaskModalOpen && (
        <EditTaskModal task={editingTask} buildings={visibleBuildings} providers={visibleProviders} components={visibleComponents} units={visibleUnits} onClose={handleCloseTaskModal} onSave={handleSaveTask} preselectedBuildingId={preselectedBuildingId} preselectedComponentId={preselectedComponentId} onDelete={handleDeleteTask} />
      )}
       {[UserRole.SuperAdmin, UserRole.Admin].includes(currentUser.role) && isUserModalOpen && (
        <EditUserModal 
            user={editingUser}
            role={userModalRole} 
            onClose={handleCloseUserModal} 
            onSave={handleSaveUser} 
        />
      )}
      {isComponentModalOpen && (
        <EditComponentModal 
          component={editingComponent}
          buildings={visibleBuildings}
          units={visibleUnits}
          componentCategories={componentCategories}
          onClose={handleCloseComponentModal}
          onSave={handleSaveComponent}
          onDelete={handleDeleteComponent}
          preselectedBuildingId={preselectedBuildingId}
        />
      )}
      {isUnitModalOpen && unitModalBuildingId && (
        <EditUnitModal
          unit={editingUnit}
          buildingId={unitModalBuildingId}
          onClose={handleCloseUnitModal}
          onSave={handleSaveUnit}
        />
      )}
      {isPasswordModalOpen && passwordChangeUser && (
        <ChangePasswordModal
          user={passwordChangeUser}
          onClose={handleClosePasswordModal}
          onChangePassword={handleChangePassword}
        />
      )}
    </div>
  );
};

export default App;