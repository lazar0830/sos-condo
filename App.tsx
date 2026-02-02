
import React, { useState, useEffect } from 'react';
import type { Building, MaintenanceTask, ServiceProvider, ServiceRequest, User, Comment, Document, StatusChange, Component, ComponentImage, Unit, Expense, Notification as NotificationType } from './types';
import { UserRole, ServiceRequestStatus, Recurrence, TaskStatus } from './types';
import { initGemini } from './services/geminiService';
import useLocalStorage from './hooks/useLocalStorage';
import { initialUsers, initialBuildings, initialProviders, initialTasks, initialServiceRequests, initialComponents, initialUnits, initialContingencyDocuments, initialExpenses, initialNotifications } from './data/initialData';

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
import EditServiceProviderUserModal from './components/EditServiceProviderUserModal';
import EditRequestModal from './components/EditRequestModal';
import EditBuildingModal from './components/EditBuildingModal';
import EditTaskModal from './components/EditTaskModal';
import EditUserModal from './components/EditUserModal';
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

export type View = 'dashboard' | 'financials' | 'properties' | 'tasks' | 'requests' | 'providers' | 'account' | 'management' | 'components' | 'tools' | 'contingencyFund' | 'notifications';
export type Theme = 'light' | 'dark';

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const App: React.FC = () => {
  const [geminiReady, setGeminiReady] = useState(false);
    
  useEffect(() => {
    setGeminiReady(initGemini());
  }, []);

  // --- Data State (Local Storage) ---
  const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
  const [buildings, setBuildings] = useLocalStorage<Building[]>('buildings', initialBuildings);
  const [tasks, setTasks] = useLocalStorage<MaintenanceTask[]>('tasks', initialTasks);
  const [providers, setProviders] = useLocalStorage<ServiceProvider[]>('providers', initialProviders);
  const [serviceRequests, setServiceRequests] = useLocalStorage<ServiceRequest[]>('requests', initialServiceRequests);
  const [components, setComponents] = useLocalStorage<Component[]>('components', initialComponents);
  const [units, setUnits] = useLocalStorage<Unit[]>('units', initialUnits);
  const [contingencyDocuments, setContingencyDocuments] = useLocalStorage<Document[]>('contingency_docs', initialContingencyDocuments);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialExpenses);
  const [notifications, setNotifications] = useLocalStorage<NotificationType[]>('notifications', initialNotifications);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

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

  const handleResetData = () => {
    if (window.confirm("Are you sure you want to reset all data to the initial state? This action cannot be undone.")) {
        setUsers(initialUsers);
        setBuildings(initialBuildings);
        setTasks(initialTasks);
        setProviders(initialProviders);
        setServiceRequests(initialServiceRequests);
        setComponents(initialComponents);
        setUnits(initialUnits);
        setContingencyDocuments(initialContingencyDocuments);
        setExpenses(initialExpenses);
        setNotifications(initialNotifications);
        setNotification({ type: 'success', message: "App data has been reset." });
        if (currentUser && !initialUsers.find(u => u.id === currentUser.id)) {
            setCurrentUser(null);
        }
    }
  };

  // --- Handlers ---
  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    // Mock login logic
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
        setCurrentUser(user);
        return true;
    }
    return false;
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleSaveBuilding = (buildingData: Omit<Building, 'id'> | Building) => {
    if ('id' in buildingData) {
        setBuildings(prev => prev.map(b => b.id === buildingData.id ? buildingData : b));
    } else {
        const newBuilding = { 
            ...buildingData, 
            id: crypto.randomUUID(),
            createdBy: buildingData.createdBy || currentUser?.id || 'system' 
        };
        setBuildings(prev => [...prev, newBuilding]);
    }
    setNotification({ type: 'success', message: 'Property saved successfully!' });
    handleCloseBuildingModal();
  };

  const handleDeleteBuilding = (buildingId: string) => {
    setBuildings(prev => prev.filter(b => b.id !== buildingId));
    // Cascade delete related items
    setTasks(prev => prev.filter(t => t.buildingId !== buildingId));
    setComponents(prev => prev.filter(c => c.buildingId !== buildingId));
    setUnits(prev => prev.filter(u => u.buildingId !== buildingId));
    // Note: Requests are linked to tasks, so they become orphaned or we delete them too
    const tasksToDelete = tasks.filter(t => t.buildingId === buildingId).map(t => t.id);
    setServiceRequests(prev => prev.filter(r => !tasksToDelete.includes(r.taskId)));
    
    setSelectedBuildingId(null);
    setNotification({ type: 'success', message: `Property deleted.` });
  };

  const handleSaveUnit = (unitData: Omit<Unit, 'id' | 'images'> | Unit) => {
    if ('id' in unitData) {
        setUnits(prev => prev.map(u => u.id === unitData.id ? unitData as Unit : u));
    } else {
        const newUnit: Unit = { ...unitData, id: crypto.randomUUID(), images: [] };
        setUnits(prev => [...prev, newUnit]);
    }
    setNotification({ type: 'success', message: 'Unit saved successfully!' });
    handleCloseUnitModal();
  };
  
  const handleDeleteUnit = (unitId: string) => {
    const isUsedInTask = tasks.some(t => t.unitId === unitId);
    const isUsedInComponent = components.some(c => c.unitId === unitId);
    if (isUsedInTask || isUsedInComponent) {
      setNotification({ type: 'error', message: 'Cannot delete unit. It is currently associated with tasks or components.' });
      return;
    }
    setUnits(prev => prev.filter(u => u.id !== unitId));
    setNotification({ type: 'success', message: 'Unit deleted successfully.' });
  };
  
  const handleAddUnitImages = async (unitId: string, files: FileList) => {
    const imagePromises = Array.from(files).map(async file => {
      const base64 = await fileToBase64(file);
      return {
        id: crypto.randomUUID(),
        url: base64,
        uploadedAt: new Date().toISOString(),
      };
    });
    const newImages = await Promise.all(imagePromises);
    
    setUnits(prev => prev.map(u => {
        if (u.id === unitId) {
            return { ...u, images: [...u.images, ...newImages] };
        }
        return u;
    }));
    setNotification({ type: 'success', message: `${newImages.length} image(s) added.` });
  };

  const handleDeleteUnitImage = (unitId: string, imageId: string) => {
    setUnits(prev => prev.map(u => {
        if (u.id === unitId) {
            return { ...u, images: u.images.filter(img => img.id !== imageId) };
        }
        return u;
    }));
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

  const handleSaveTask = (taskData: Omit<MaintenanceTask, 'id'> | MaintenanceTask) => {
    const isMasterRecurring = taskData.recurrence !== Recurrence.OneTime;
    
    if ('id' in taskData) {
        // Updating existing task
        const updatedTask = taskData;
        
        if (isMasterRecurring) {
             // If master, we might need to regenerate instances if dates/recurrence changed
             // For simplicity in this demo, we'll update the master and if it has instances, maybe update them?
             // Complex logic skipped for local storage demo simplicity. We just update the object.
             setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        } else {
             setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
        }
    } else {
        // Creating new task
        const newTaskId = crypto.randomUUID();
        // FIX: Explicitly cast to MaintenanceTask to avoid strict UUID type inference issues
        const newTask = { ...taskData, id: newTaskId } as MaintenanceTask;
        
        // FIX: Explicitly type the array to MaintenanceTask[]
        let newTasksToAdd: MaintenanceTask[] = [newTask];
        
        if (isMasterRecurring) {
            const instances = generateRecurringTasks(newTask).map(inst => ({
                ...inst,
                id: crypto.randomUUID()
            }));
            newTasksToAdd = [newTask, ...instances];
        }
        
        setTasks(prev => [...prev, ...newTasksToAdd]);
    }

    setNotification({ type: 'success', message: 'Task saved successfully!' });
    handleCloseTaskModal();
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => {
        const taskToDelete = prev.find(t => t.id === taskId);
        if (taskToDelete && taskToDelete.recurrence !== Recurrence.OneTime) {
            // Delete master and all instances
            return prev.filter(t => t.id !== taskId && t.recurringTaskId !== taskId);
        }
        return prev.filter(t => t.id !== taskId);
    });
    setNotification({ type: 'success', message: 'Task deleted successfully!' });
  };

  const handleSaveComponent = (componentData: Omit<Component, 'id'> | Component) => {
    if ('id' in componentData) {
        setComponents(prev => prev.map(c => c.id === componentData.id ? componentData : c));
    } else {
        const newComponent = { ...componentData, id: crypto.randomUUID() };
        setComponents(prev => [...prev, newComponent]);
    }
    setNotification({ type: 'success', message: 'Component saved successfully!' });
    handleCloseComponentModal();
  };

  const handleDeleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    setNotification({ type: 'success', message: 'Component deleted successfully.' });
    setSelectedComponentId(null);
  };

  const handleAddComponentImage = async (componentId: string, files: FileList) => {
    const imagePromises = Array.from(files).map(async file => {
      const base64 = await fileToBase64(file);
      return {
        id: crypto.randomUUID(),
        url: base64,
        uploadedAt: new Date().toISOString(),
      };
    });

    const newImages = await Promise.all(imagePromises);
    setComponents(prev => prev.map(c => {
        if (c.id === componentId) {
            return { ...c, images: [...c.images, ...newImages] };
        }
        return c;
    }));
    setNotification({ type: 'success', message: `${newImages.length} image(s) added.` });
  };

  const handleDeleteComponentImage = (componentId: string, imageId: string) => {
    setComponents(prev => prev.map(c => {
        if (c.id === componentId) {
            return { ...c, images: c.images.filter(img => img.id !== imageId) };
        }
        return c;
    }));
    setNotification({ type: 'success', message: 'Image deleted.' });
  };

  const handleAddServiceRequest = (request: Omit<ServiceRequest, 'id' | 'comments' | 'documents' | 'statusHistory'>) => {
    if (!currentUser) return;
    const sourceTask = tasks.find(t => t.id === request.taskId);
    
    const newRequest: ServiceRequest = {
        ...request,
        id: crypto.randomUUID(),
        comments: [],
        documents: [],
        statusHistory: [{
            status: ServiceRequestStatus.Sent,
            changedAt: new Date().toISOString(),
            changedBy: currentUser.username,
        }],
        unitId: sourceTask?.unitId,
        unitNumber: sourceTask?.unitNumber,
    };
    
    setServiceRequests(prev => [...prev, newRequest]);
    
    // Update task status
    if (sourceTask) {
        setTasks(prev => prev.map(t => t.id === sourceTask.id ? { ...t, status: TaskStatus.Sent } : t));
    }
    
    setNotification({ type: 'success', message: 'Service request sent!' });
  };
  
  const handleUpdateServiceRequestStatus = (id: string, status: ServiceRequestStatus) => {
    if (!currentUser) return;
    
    setServiceRequests(prev => prev.map(req => {
        if (req.id === id) {
            const newStatusChange = {
                status: status,
                changedAt: new Date().toISOString(),
                changedBy: currentUser.username
            };
            return {
                ...req,
                status,
                statusHistory: [...(req.statusHistory || []), newStatusChange]
            };
        }
        return req;
    }));

    // Side effects for Task status
    const req = serviceRequests.find(r => r.id === id);
    if (req) {
        const task = tasks.find(t => t.id === req.taskId);
        if (task) {
            let newTaskStatus = task.status;
            if (status === ServiceRequestStatus.Accepted) newTaskStatus = TaskStatus.OnHold;
            else if (status === ServiceRequestStatus.Refused) newTaskStatus = TaskStatus.New;
            else if (status === ServiceRequestStatus.Completed) newTaskStatus = TaskStatus.Completed;
            
            if (newTaskStatus !== task.status) {
                setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newTaskStatus } : t));
            }
        }
    }
    setNotification({ type: 'success', message: 'Request status updated.' });
  };

  const handleUpdateRequest = (request: ServiceRequest) => {
    setServiceRequests(prev => prev.map(r => r.id === request.id ? request : r));
    setNotification({ type: 'success', message: 'Service request updated.' });
    handleCloseRequestModal();
  };

  const handleDeleteProvider = (providerId: string) => {
    setProviders(prev => prev.filter(p => p.id !== providerId));
    setNotification({ type: 'success', message: 'Provider deleted successfully!' });
  };
  
  const handleSaveUser = (userData: Omit<User, 'id'> | User, password?: string): boolean => {
    if (!currentUser) return false;
    
    if ('id' in userData) {
        setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
    } else {
        const newUser = { ...userData, id: crypto.randomUUID(), password: password };
        setUsers(prev => [...prev, newUser]);
    }
    setNotification({ type: 'success', message: 'User saved successfully.' });
    handleCloseUserModal();
    return true;
  };
  
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
        setNotification({ type: 'error', message: "You cannot delete your own account."});
        return;
    }
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === UserRole.SuperAdmin) {
        setNotification({ type: 'error', message: "The Super Admin account cannot be deleted."});
        return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    setNotification({ type: 'success', message: 'User profile deleted.' });
  };
  
  const handleSaveProviderAndUser = (data: { providerData: Omit<ServiceProvider, 'id'> | ServiceProvider, userData: { email: string, username: string, password?: string } }) => {
    if (!currentUser) return false;
    
    let userId = data.providerData.userId;
    
    // Create or Update User
    if (userId) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, username: data.userData.username, email: data.userData.email } : u));
    } else {
        const newUserId = crypto.randomUUID();
        const newUser: User = { 
            id: newUserId, 
            email: data.userData.email, 
            username: data.userData.username, 
            role: UserRole.ServiceProvider,
            password: data.userData.password || 'password123', // Default or provided
            createdBy: currentUser.id
        };
        setUsers(prev => [...prev, newUser]);
        userId = newUserId;
    }
    
    // Create or Update Provider
    if ('id' in data.providerData) {
        const updatedProvider = { ...data.providerData, userId };
        setProviders(prev => prev.map(p => p.id === updatedProvider.id ? updatedProvider : p));
    } else {
        const newProvider = { 
            ...data.providerData, 
            id: crypto.randomUUID(),
            userId,
            createdBy: currentUser.id 
        };
        setProviders(prev => [...prev, newProvider]);
    }

    setNotification({ type: 'success', message: 'Provider and User saved successfully.' });
    handleCloseProviderUserModal();
    return true;
  };

  const handleUpdateCurrentUser = async (data: { email?: string; username?: string; }) => {
    if (!currentUser) return { success: false, message: 'No user logged in.' };
    
    setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
            return { ...u, ...data };
        }
        return u;
    }));
    
    // Update local session
    setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    
    return { success: true, message: 'Account updated successfully.' };
  };

  const handleSaveProviderProfile = (provider: ServiceProvider) => {
    setProviders(prev => prev.map(p => p.id === provider.id ? provider : p));
    setNotification({ type: 'success', message: 'Provider profile updated.' });
  };

  const handleAddComment = (requestId: string, commentText: string) => {
    if (!currentUser) return;
    
    const newComment: Comment = {
      id: crypto.randomUUID(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      text: commentText,
      createdAt: new Date().toISOString(),
    };
    
    setServiceRequests(prev => prev.map(req => {
        if (req.id === requestId) {
            return { ...req, comments: [...req.comments, newComment] };
        }
        return req;
    }));
    setNotification({ type: 'success', message: 'Comment added.' });
  };

  const handleAddDocument = async (requestId: string, file: File) => {
    if (!currentUser) return;
    
    const base64 = await fileToBase64(file);
    const newDocument: Document = {
      id: crypto.randomUUID(),
      name: file.name,
      url: base64,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.username,
    };
    
    setServiceRequests(prev => prev.map(req => {
        if (req.id === requestId) {
            return { ...req, documents: [...req.documents, newDocument] };
        }
        return req;
    }));
    setNotification({ type: 'success', message: 'Document uploaded.' });
  };

  const handleDeleteDocument = (requestId: string, documentId: string) => {
    setServiceRequests(prev => prev.map(req => {
        if (req.id === requestId) {
            return { ...req, documents: req.documents.filter(doc => doc.id !== documentId) };
        }
        return req;
    }));
    setNotification({ type: 'success', message: 'Document deleted.' });
  };

  const handleAddContingencyDocument = async (file: File) => {
    if (!currentUser) return;
    const base64 = await fileToBase64(file);
    const newDocument: Document = {
      id: crypto.randomUUID(),
      name: file.name,
      url: base64,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.username,
    };
    setContingencyDocuments(prev => [...prev, newDocument]);
    setNotification({ type: 'success', message: 'Document uploaded successfully.' });
  };

  const handleDeleteContingencyDocument = (documentId: string) => {
    setContingencyDocuments(prev => prev.filter(doc => doc.id !== documentId));
    setNotification({ type: 'success', message: 'Document deleted.' });
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'createdAt' | 'buildingName' | 'componentName'>) => {
    const building = buildings.find(b => b.id === expenseData.buildingId);
    const component = components.find(c => c.id === expenseData.componentId);

    if (!building || !component) {
        setNotification({ type: 'error', message: 'Invalid building or component selected.' });
        return;
    }

    const newExpense = {
        ...expenseData,
        id: crypto.randomUUID(),
        buildingName: building.name,
        componentName: component.name,
        createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [...prev, newExpense]);
    setNotification({ type: 'success', message: 'Expense added successfully.' });
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    setNotification({ type: 'success', message: 'Expense deleted.' });
  };

    // --- Notification Handlers ---
  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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

  if (!currentUser) {
    return (
      <>
        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // --- Data Scoping for Admin Role ---
  let visibleBuildings = buildings;
  let visibleTasks = tasks;
  let visibleComponents = components;
  let visibleUnits = units;
  let visibleServiceRequests = serviceRequests;
  let visibleExpenses = expenses;
  let visibleNotifications = notifications.filter(n => n.userId === currentUser.id);
  
  if (currentUser.role === UserRole.Admin) {
      const managedManagerIds = users
          .filter(u => u.role === UserRole.PropertyManager && u.createdBy === currentUser.id)
          .map(u => u.id);
      
      const visibleUserIds = [...managedManagerIds, currentUser.id];

      visibleBuildings = buildings.filter(b => b.createdBy && visibleUserIds.includes(b.createdBy));
      const visibleBuildingIds = new Set(visibleBuildings.map(b => b.id));

      visibleTasks = tasks.filter(t => visibleBuildingIds.has(t.buildingId));
      const visibleTaskIds = new Set(visibleTasks.map(t => t.id));

      visibleComponents = components.filter(c => visibleBuildingIds.has(c.buildingId));
      visibleUnits = units.filter(u => visibleBuildingIds.has(u.buildingId));
      visibleServiceRequests = serviceRequests.filter(sr => visibleTaskIds.has(sr.taskId));
      visibleExpenses = expenses.filter(e => visibleBuildingIds.has(e.buildingId));
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
          providers={providers} 
          serviceRequests={visibleServiceRequests} 
          expenses={visibleExpenses}
          onEditTask={handleOpenTaskModal} 
          onSelectRequest={handleSelectRequest} 
          onDeleteTask={handleDeleteTask} 
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
        return <ContingencyFundView documents={contingencyDocuments} onAddDocument={handleAddContingencyDocument} onDeleteDocument={handleDeleteContingencyDocument} expenses={visibleExpenses} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} buildings={visibleBuildings} components={visibleComponents} />;
      case 'properties':
        if (selectedUnit && selectedUnitBuilding) {
            return <UnitDetailView 
                unit={selectedUnit}
                building={selectedUnitBuilding}
                components={visibleComponents}
                tasks={visibleTasks}
                serviceRequests={visibleServiceRequests}
                providers={providers}
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
          <BuildingDetailView building={selectedBuilding} tasks={buildingTasks} providers={providers} onOpenTaskModal={handleOpenTaskModal} onAddServiceRequest={handleAddServiceRequest} getTaskServiceRequests={getTaskServiceRequests} onBack={() => setSelectedBuildingId(null)} onEditBuilding={handleOpenBuildingModal} onSelectRequest={handleSelectRequest} components={visibleComponents.filter(c => c.buildingId === selectedBuildingId)} onSelectComponent={handleSelectComponent} onDeleteBuilding={handleDeleteBuilding} units={visibleUnits.filter(u => u.buildingId === selectedBuildingId)} onOpenUnitModal={handleOpenUnitModal} onDeleteUnit={handleDeleteUnit} onOpenComponentModal={handleOpenComponentModal} onSelectUnit={handleSelectUnit} />
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
                providers={providers}
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
            onAddComponent={() => handleOpenComponentModal(null)}
            onSelectComponent={handleSelectComponent}
        />;
      case 'tasks':
        return <MaintenanceTasksView tasks={visibleTasks} buildings={visibleBuildings} providers={providers} onEditTask={handleOpenTaskModal} onAddTask={() => handleOpenTaskModal(null)} onDeleteTask={handleDeleteTask} onAddServiceRequest={handleAddServiceRequest} />;
      case 'requests':
        if (selectedRequest) {
          const task = visibleTasks.find(t => t.id === selectedRequest.taskId);
          const building = visibleBuildings.find(b => b.id === task?.buildingId);
          const provider = providers.find(p => p.id === selectedRequest.providerId);
          return <ServiceRequestDetailView request={selectedRequest} task={task} building={building} provider={provider} currentUser={currentUser} onBack={() => setSelectedRequestId(null)} onUpdateRequestStatus={handleUpdateServiceRequestStatus} onAddComment={handleAddComment} onEditRequest={handleOpenRequestModal} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} />;
        }
        return <ServiceRequestsView requests={visibleServiceRequests} tasks={visibleTasks} buildings={visibleBuildings} providers={providers} onSelectRequest={handleSelectRequest} />;
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
                providers={providers} 
                onSelectProvider={handleSelectProvider}
                onAddProvider={() => handleOpenProviderUserModal(null)} 
                onDeleteProvider={handleDeleteProvider} 
                currentUser={currentUser}
            />
        );
       case 'tools':
         return <ToolsView />;
      case 'account':
        return <MyAccountView currentUser={currentUser} onUpdateCurrentUser={handleUpdateCurrentUser} onSaveProvider={handleSaveProviderProfile} serviceProviderProfile={providers.find(p => p.userId === currentUser.id)} />;
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
            providers={providers} 
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
        return <MyAccountView currentUser={currentUser} onUpdateCurrentUser={handleUpdateCurrentUser} onSaveProvider={handleSaveProviderProfile} serviceProviderProfile={providerProfile} />;
    }
    if (currentUser.role === UserRole.ServiceProvider) {
        return renderProviderContent();
    }
    return renderManagerContent();
  }

  return (
    <div className="flex h-screen text-gray-800 dark:text-gray-200">
      <SideNav 
        currentView={view} 
        onNavigate={handleNavigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileNavOpen={isMobileNavOpen}
        onCloseMobileNav={() => setIsMobileNavOpen(false)}
        theme={theme}
        onThemeChange={handleThemeChange}
        notifications={visibleNotifications}
        onMarkAsRead={handleMarkNotificationRead}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onNotificationClick={handleNotificationClick}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
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
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
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
        <EditRequestModal request={editingRequest} providers={providers} tasks={tasks} buildings={buildings} onClose={handleCloseRequestModal} onSave={handleUpdateRequest} />
      )}
      {isBuildingModalOpen && (
        <EditBuildingModal building={editingBuilding} onClose={handleCloseBuildingModal} onSave={handleSaveBuilding} />
      )}
      {isTaskModalOpen && (
        <EditTaskModal task={editingTask} buildings={buildings} providers={providers} components={components} units={units} onClose={handleCloseTaskModal} onSave={handleSaveTask} preselectedBuildingId={preselectedBuildingId} preselectedComponentId={preselectedComponentId} onDelete={handleDeleteTask} />
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
          buildings={buildings}
          units={units}
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
    </div>
  );
};

export default App;