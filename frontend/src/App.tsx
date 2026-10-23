import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  LogOut,
  Building2,
  Clock,
  Layers,
  Wrench,
  Boxes,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  Lock,
  User,
  Coffee,
  Zap,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  PieChart as PieChartIcon,
  BarChart3,
  ListTodo,
  Check,
  CalendarDays,
  Activity,
  MessageSquare,
  AlertTriangle,
  Gauge,
  Users,
  CheckSquare,
  Square,
  Menu,
  ArrowLeft,
  DollarSign,
  ShieldAlert,
  SlidersHorizontal,
  ExternalLink,
  ChevronLeft,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Send,
  Eye,
  Edit3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface AuthUser {
  username: string;
  email: string;
  fullName: string;
  role: 'CEO' | 'Supervisor' | 'Logistics Admin' | 'Employee';
  securityClearance: number;
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('haalar_token'));
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('haalar_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login form state
  const [loginUsername, setLoginUsername] = useState('ceo');
  const [loginPassword, setLoginPassword] = useState('Haalar@2026!');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Layout & Navigation State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState<string>('executive');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Dedicated Detail Views / Sub-Pages
  // 'workspace' | 'doctype_list' | 'task_detail' | 'all_employees' | 'employee_detail' | 'expenses_ledger'
  const [currentView, setCurrentView] = useState<string>('workspace');
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<any>(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<any>(null);

  // DocType list view
  const [activeDocType, setActiveDocType] = useState<string | null>(null);
  const [docList, setDocList] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Modals & Inlines
  const [showModal, setShowModal] = useState<string | null>(null);
  const [modalFormData, setModalFormData] = useState<any>({});
  const [activeNoteInput, setActiveNoteInput] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Equipment request specific modal state
  const [selectedAssetForRequest, setSelectedAssetForRequest] = useState<any>(null);

  // Utility bill editing modal state
  const [editingBill, setEditingBill] = useState<any>(null);

  // Telemetry data from backend
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  // Visualizations & Filters
  const [expensePeriod, setExpensePeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [equipmentView, setEquipmentView] = useState<'status' | 'category'>('status');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any>(null);
  const [ganttFilter, setGanttFilter] = useState<'all' | 'PRJ-2026-0001' | 'PRJ-2026-0002'>('all');
  const [expensesLedgerTab, setExpensesLedgerTab] = useState<'all' | 'utilities' | 'kitchen' | 'claims'>('all');

  // Working Hours (09:00 AM - 04:00 PM) check & demo override toggle
  const [demoTimeOverride, setDemoTimeOverride] = useState<boolean>(true); // default true for testing convenience

  const isWorkingHours = useMemo(() => {
    if (demoTimeOverride) return true;
    const now = new Date();
    const hours = now.getHours();
    return hours >= 9 && hours < 16;
  }, [demoTimeOverride]);

  // Fetch workspaces & metrics whenever token or user changes
  useEffect(() => {
    if (token && currentUser) {
      fetchWorkspaces();
      if (currentUser.role === 'CEO') setActiveWorkspace('executive');
      else if (currentUser.role === 'Supervisor') setActiveWorkspace('supervisor');
      else if (currentUser.role === 'Logistics Admin') setActiveWorkspace('operations');
      else setActiveWorkspace('my_space');
    }
  }, [token, currentUser]);

  const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('haalar_token', data.token);
        localStorage.setItem('haalar_user', JSON.stringify(data.user));
        setToken(data.token);
        setCurrentUser(data.user);
        setCurrentView('workspace');
        showToast(`Welcome back, ${data.user.fullName}!`, 'success');
      } else {
        setLoginError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      setLoginError('Could not connect to authentication gateway.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('haalar_token');
    localStorage.removeItem('haalar_user');
    setToken(null);
    setCurrentUser(null);
    setActiveDocType(null);
    setWorkspaceData(null);
    setCurrentView('workspace');
  };

  const fetchWorkspaces = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/desk/workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (data.success) {
        setWorkspaceData(data);
        if (data.attendanceCalendar?.days && data.attendanceCalendar.days.length > 0) {
          const todayObj = data.attendanceCalendar.days.find((d: any) => d.day === 21);
          setSelectedCalendarDay(todayObj || data.attendanceCalendar.days[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    }
  };

  // Open DocType list view
  const openDocTypeList = async (doctype: string) => {
    setActiveDocType(doctype);
    setCurrentView('doctype_list');
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctype/${doctype}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDocList(data.data);
      } else {
        showToast(data.message || 'Access restricted', 'error');
        setCurrentView('workspace');
        setActiveDocType(null);
      }
    } catch (err) {
      showToast('Failed to fetch records', 'error');
    } finally {
      setLoadingDocs(false);
    }
  };

  // Clock In / Out
  const handleClockAction = async (type: 'IN' | 'OUT') => {
    if (!isWorkingHours) {
      showToast('Punches permitted strictly between 09:00 AM and 04:00 PM.', 'error');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const res = await fetch(`${API_BASE}/api/doctype/tab_attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          employee: currentUser?.fullName,
          employee_name: currentUser?.fullName,
          attendance_date: today,
          status: 'Present',
          in_time: now,
          working_hours: type === 'IN' ? 0.0 : 8.5,
          docstatus: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Clocked ${type} registered at ${now}!`, 'success');
        fetchWorkspaces();
        if (activeDocType === 'tab_attendance') openDocTypeList('tab_attendance');
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Clock action failed', 'error');
    }
  };

  // Toggle Component Checkbox
  const handleToggleComponent = async (compId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/doctype/tab_task_component/${compId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchWorkspaces();
        if (selectedTaskDetail) {
          // Refresh task detail if open
          setSelectedTaskDetail((prev: any) => {
            if (!prev) return null;
            const updatedComps = prev.components.map((c: any) =>
              c.name === compId ? { ...c, is_completed: c.is_completed === 1 ? 0 : 1 } : c
            );
            const done = updatedComps.filter((c: any) => c.is_completed === 1).length;
            return {
              ...prev,
              components: updatedComps,
              completedComponents: done,
              progress: Math.round((done / updatedComps.length) * 100)
            };
          });
        }
      } else {
        showToast(data.message || 'Toggle failed', 'error');
      }
    } catch (err) {
      showToast('Component toggle error', 'error');
    }
  };

  // Save Component Blocker Note
  const handleSaveComponentNote = async (compId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/doctype/tab_task_component/${compId}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: noteText })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Engineering note recorded.', 'success');
        setActiveNoteInput(null);
        setNoteText('');
        fetchWorkspaces();
      } else {
        showToast(data.message || 'Failed to save note', 'error');
      }
    } catch (err) {
      showToast('Note save error', 'error');
    }
  };

  // Create new DocType entry
  const handleCreateDoc = async (doctype: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/doctype/${doctype}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(modalFormData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setShowModal(null);
        setModalFormData({});
        fetchWorkspaces();
        if (activeDocType === doctype) openDocTypeList(doctype);
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Failed to save document', 'error');
    }
  };

  // Approve / Reject Equipment Request
  const handleApproveAssetRequest = async (requestId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/doctype/tab_asset_request/${requestId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchWorkspaces();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Approval action failed', 'error');
    }
  };

  const handleRejectAssetRequest = async (requestId: string) => {
    const reason = window.prompt('Enter rejection / prohibition remark:', 'Higher priority calibration scheduled.');
    if (!reason) return;
    try {
      const res = await fetch(`${API_BASE}/api/doctype/tab_asset_request/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchWorkspaces();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Rejection action failed', 'error');
    }
  };

  // Return Asset to Store
  const handleReturnAsset = async (assetId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/doctype/tab_asset/${assetId}/return`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        fetchWorkspaces();
      } else {
        showToast(data.message, 'error');
      }
    } catch (err) {
      showToast('Return action failed', 'error');
    }
  };

  // Update Utility Bill Status
  const handleUpdateUtilityBill = async () => {
    if (!editingBill) return;
    try {
      const res = await fetch(`${API_BASE}/api/doctype/tab_utility_bill/${editingBill.name}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingBill)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Utility Bill ${editingBill.name} updated.`, 'success');
        setEditingBill(null);
        fetchWorkspaces();
        if (activeDocType === 'tab_utility_bill') openDocTypeList('tab_utility_bill');
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showToast('Bill update failed', 'error');
    }
  };

  // ===========================================================================
  // SEARCH BAR (AWESOMEBAR) AUTOCOMPLETE DATA
  // ===========================================================================
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    // 1. Workspaces
    const wsMatches = (workspaceData?.workspaces || []).filter((w: any) =>
      w.title.toLowerCase().includes(q)
    );

    // 2. Registers
    const registers = [
      { id: 'tab_attendance', title: 'Attendance Log', icon: Clock },
      { id: 'tab_asset', title: 'Equipment & Tools', icon: Wrench },
      { id: 'tab_task', title: 'Tasks Register', icon: ListTodo },
      { id: 'tab_project', title: 'Classified Projects', icon: Layers, roles: ['CEO', 'Supervisor'] },
      { id: 'tab_kitchen_expense', title: 'Canteen & Kitchen', icon: Coffee, roles: ['CEO', 'Logistics Admin'] },
      { id: 'tab_utility_bill', title: 'Utility Invoices', icon: Zap, roles: ['CEO', 'Logistics Admin'] },
      { id: 'tab_item', title: 'Component Stock', icon: Boxes, roles: ['CEO', 'Logistics Admin'] },
      { id: 'tab_employee', title: 'Employee Directory', icon: User, roles: ['CEO'] }
    ];

    const regMatches = registers.filter(
      r =>
        (!r.roles || r.roles.includes(currentUser?.role || '')) &&
        r.title.toLowerCase().includes(q)
    );

    // 3. Records from telemetry
    const taskMatches = (workspaceData?.tasks || []).filter((t: any) =>
      t.task_subject?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q)
    );

    const assetMatches = (workspaceData?.allAssets || []).filter((a: any) =>
      a.asset_name?.toLowerCase().includes(q) || a.name?.toLowerCase().includes(q) || a.serial_no?.toLowerCase().includes(q)
    );

    const empMatches = (workspaceData?.allEmployees || []).filter((e: any) =>
      e.employee_name?.toLowerCase().includes(q) || e.designation?.toLowerCase().includes(q) || e.name?.toLowerCase().includes(q)
    );

    return {
      workspaces: wsMatches,
      registers: regMatches,
      tasks: taskMatches.slice(0, 3),
      assets: assetMatches.slice(0, 3),
      employees: empMatches.slice(0, 3),
      hasResults:
        wsMatches.length > 0 ||
        regMatches.length > 0 ||
        taskMatches.length > 0 ||
        assetMatches.length > 0 ||
        empMatches.length > 0
    };
  }, [searchQuery, workspaceData, currentUser]);

  // Telemetry variables
  const tasksList: any[] = workspaceData?.tasks || [];
  const projectPhases: any[] = workspaceData?.projectPhases || [];
  const teamWorkload: any[] = workspaceData?.teamWorkload || [];
  const inventoryBulletGauges: any[] = workspaceData?.inventoryBulletGauges || [];
  const evmData = workspaceData?.evmData;
  const equipmentStats = workspaceData?.equipmentStats;
  const expenseTrends = workspaceData?.expenseTrends;
  const attendanceCalendar = workspaceData?.attendanceCalendar;
  const allEmployees: any[] = workspaceData?.allEmployees || [];
  const allAssets: any[] = workspaceData?.allAssets || [];
  const assetRequests: any[] = workspaceData?.assetRequests || [];
  const expensesLedger = workspaceData?.expensesLedger;

  // Filter project phases for Gantt chart
  const filteredPhases = ganttFilter === 'all'
    ? projectPhases
    : projectPhases.filter(p => p.project === ganttFilter);

  // ===========================================================================
  // 1. STRICT LOGIN SCREEN (WHEN UNAUTHENTICATED)
  // ===========================================================================
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-100 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              H
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Haalar Desk</h1>
              <p className="text-xs text-gray-500">Defense & Aerospace Resource Management</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Username or Email</label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="e.g. ceo, usman, bilal, zainab, taha, nouman"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm disabled:opacity-50"
            >
              {loginLoading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-gray-100 text-xs text-gray-600 space-y-2">
              <span className="font-semibold text-gray-700 block">Preset Test Credentials:</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => { setLoginUsername('ceo'); setLoginPassword('Haalar@2026!'); }}
                  className="p-1.5 border border-gray-200 rounded text-left hover:bg-gray-50"
                >
                  <span className="font-bold block text-gray-900">CEO (Sohail)</span>
                  <span className="text-gray-500">Executive Sovereignty</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginUsername('usman'); setLoginPassword('Haalar@2026!'); }}
                  className="p-1.5 border border-gray-200 rounded text-left hover:bg-gray-50"
                >
                  <span className="font-bold block text-gray-900">Supervisor (Usman)</span>
                  <span className="text-gray-500">Hardware & Task Phases</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginUsername('bilal'); setLoginPassword('Haalar@2026!'); }}
                  className="p-1.5 border border-gray-200 rounded text-left hover:bg-gray-50"
                >
                  <span className="font-bold block text-gray-900">Logistics (Bilal)</span>
                  <span className="text-gray-500">Components & Utility Bills</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginUsername('zainab'); setLoginPassword('Haalar@2026!'); }}
                  className="p-1.5 border border-gray-200 rounded text-left hover:bg-gray-50"
                >
                  <span className="font-bold block text-gray-900">Employee (Zainab)</span>
                  <span className="text-gray-500">Firmware & Equipment</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginUsername('taha'); setLoginPassword('Haalar@2026!'); }}
                  className="p-1.5 border border-gray-200 rounded text-left hover:bg-gray-50"
                >
                  <span className="font-bold block text-gray-900">Employee (Taha)</span>
                  <span className="text-gray-500">Prototyping Lead</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginUsername('nouman'); setLoginPassword('Haalar@2026!'); }}
                  className="p-1.5 border border-gray-200 rounded text-left hover:bg-gray-50"
                >
                  <span className="font-bold block text-gray-900">Employee (Nouman)</span>
                  <span className="text-gray-500">Embedded Systems</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col text-gray-800">
      {/* Toast Notification — POSITIONED AT BOTTOM RIGHT */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold flex items-center space-x-2 border transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOP DESK NAVIGATION BAR (ERPNEXT AWESOMEBAR) */}
      <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          {/* Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            H
          </div>
          <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:inline">
            Haalar Desk
          </span>
          <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-mono">
            {currentUser.role}
          </span>
        </div>

        {/* Search Bar / Awesomebar with live functional autocomplete */}
        <div className="flex-1 max-w-md mx-4 relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search or jump to DocType, Task, Equipment, Employee..."
              value={searchQuery}
              onFocus={() => setSearchDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchDropdownOpen(true);
              }}
              className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white text-xs pl-8 pr-7 py-1.5 rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchDropdownOpen(false);
                }}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown Popover */}
          {searchDropdownOpen && searchResults && (
            <div className="absolute left-0 right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 text-xs space-y-2 max-h-80 overflow-y-auto">
              {!searchResults.hasResults ? (
                <div className="p-3 text-center text-gray-400 text-xs">
                  No matching records or DocTypes found.
                </div>
              ) : (
                <>
                  {/* Matching Workspaces */}
                  {searchResults.workspaces.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Workspaces
                      </div>
                      {searchResults.workspaces.map((ws: any) => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            setActiveWorkspace(ws.id);
                            setCurrentView('workspace');
                            setSearchDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 rounded-lg text-gray-800 flex items-center justify-between"
                        >
                          <span className="font-semibold">{ws.title}</span>
                          <span className="text-[10px] text-gray-400 font-mono">Workspace</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Registers */}
                  {searchResults.registers.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Master Registers
                      </div>
                      {searchResults.registers.map((r: any) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            openDocTypeList(r.id);
                            setSearchDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 rounded-lg text-gray-800 flex items-center justify-between"
                        >
                          <span className="font-semibold">{r.title}</span>
                          <span className="text-[10px] text-blue-600 font-mono">DocType</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Tasks */}
                  {searchResults.tasks.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Matching Tasks
                      </div>
                      {searchResults.tasks.map((t: any) => (
                        <button
                          key={t.name}
                          onClick={() => {
                            setSelectedTaskDetail(t);
                            setCurrentView('task_detail');
                            setSearchDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 rounded-lg text-gray-800 flex items-center justify-between"
                        >
                          <span className="font-medium truncate max-w-[260px]">{t.task_subject}</span>
                          <span className="text-[10px] text-purple-600 font-mono font-bold">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Equipment */}
                  {searchResults.assets.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Bench Equipment
                      </div>
                      {searchResults.assets.map((a: any) => (
                        <button
                          key={a.name}
                          onClick={() => {
                            openDocTypeList('tab_asset');
                            setSearchDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 rounded-lg text-gray-800 flex items-center justify-between"
                        >
                          <span className="font-medium truncate max-w-[260px]">{a.asset_name}</span>
                          <span className="text-[10px] text-emerald-600 font-mono">{a.status}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Matching Employees */}
                  {searchResults.employees.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                        Staff Members
                      </div>
                      {searchResults.employees.map((e: any) => (
                        <button
                          key={e.name}
                          onClick={() => {
                            setSelectedEmployeeDetail(e);
                            setCurrentView('employee_detail');
                            setSearchDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left px-2.5 py-1.5 hover:bg-blue-50 rounded-lg text-gray-800 flex items-center justify-between"
                        >
                          <span className="font-medium">{e.employee_name}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{e.designation}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden md:block">
            <span className="text-xs font-semibold text-gray-900 block leading-tight">
              {currentUser.fullName}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              Clearance Level {currentUser.securityClearance}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLLAPSIBLE LEFT WORKSPACE SIDEBAR */}
        {sidebarOpen && (
          <aside className="w-60 bg-white border-r border-gray-200 p-3 space-y-1 flex-shrink-0 overflow-y-auto transition-all duration-300">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5">
              Workspaces
            </div>

            {workspaceData?.workspaces.map((ws: any) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws.id);
                  setCurrentView('workspace');
                  setActiveDocType(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeWorkspace === ws.id && currentView === 'workspace'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {ws.id === 'executive' ? (
                    <Building2 className="w-4 h-4 text-blue-600" />
                  ) : ws.id === 'supervisor' ? (
                    <UserCheck className="w-4 h-4 text-amber-600" />
                  ) : ws.id === 'operations' ? (
                    <Boxes className="w-4 h-4 text-purple-600" />
                  ) : (
                    <User className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{ws.title}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </button>
            ))}

            {/* Master Registers */}
            <div className="pt-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5">
              Master Registers
            </div>

            <button
              onClick={() => openDocTypeList('tab_attendance')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeDocType === 'tab_attendance'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Attendance Log</span>
            </button>

            <button
              onClick={() => openDocTypeList('tab_asset')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeDocType === 'tab_asset'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>Equipment & Tools</span>
            </button>

            <button
              onClick={() => openDocTypeList('tab_task')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeDocType === 'tab_task'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ListTodo className="w-4 h-4 text-blue-600" />
              <span>Tasks Register</span>
            </button>

            {(currentUser.role === 'CEO' || currentUser.role === 'Supervisor') && (
              <button
                onClick={() => openDocTypeList('tab_project')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeDocType === 'tab_project'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Classified Projects</span>
              </button>
            )}

            {(currentUser.role === 'CEO' || currentUser.role === 'Logistics Admin') && (
              <>
                <button
                  onClick={() => openDocTypeList('tab_kitchen_expense')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeDocType === 'tab_kitchen_expense'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span>Canteen / Kitchen</span>
                </button>

                <button
                  onClick={() => openDocTypeList('tab_utility_bill')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeDocType === 'tab_utility_bill'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Zap className="w-4 h-4 text-orange-600" />
                  <span>Utility Invoices</span>
                </button>

                <button
                  onClick={() => openDocTypeList('tab_item')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                    activeDocType === 'tab_item'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Boxes className="w-4 h-4 text-purple-600" />
                  <span>Component Stock</span>
                </button>
              </>
            )}

            {currentUser.role === 'CEO' && (
              <button
                onClick={() => openDocTypeList('tab_employee')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeDocType === 'tab_employee'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="w-4 h-4 text-gray-700" />
                <span>Employee Directory</span>
              </button>
            )}
          </aside>
        )}

        {/* WORKSPACE CANVAS / CURRENT VIEW */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* =========================================================================
              VIEW 1: DOCTYPE LIST VIEW (EXCEL-STYLE TABLE)
              ========================================================================= */}
          {currentView === 'doctype_list' && activeDocType && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setCurrentView('workspace');
                      setActiveDocType(null);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500"
                  >
                    ✕
                  </button>
                  <h2 className="text-lg font-bold text-gray-900 capitalize">
                    {activeDocType.replace('tab_', '').replace('_', ' ')} Register
                  </h2>
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono">
                    {docList.length} Records
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openDocTypeList(activeDocType)}
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded"
                    title="Refresh"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setShowModal(activeDocType);
                      setModalFormData({});
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center space-x-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New {activeDocType.replace('tab_', '').replace('_', ' ')}</span>
                  </button>
                </div>
              </div>

              {/* Excel-like Table View */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {loadingDocs ? (
                  <div className="p-8 text-center text-xs text-gray-500">Loading records...</div>
                ) : docList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-500">No records found.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                      <tr>
                        <th className="p-3 border-r border-gray-200 w-32 font-mono">ID / SERIES</th>
                        <th className="p-3 border-r border-gray-200">DETAILS</th>
                        <th className="p-3 border-r border-gray-200">METRICS / VALUES</th>
                        <th className="p-3 border-r border-gray-200">ASSIGNED / OWNER</th>
                        <th className="p-3 w-32">STATUS / ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-800">
                      {docList.map((row) => (
                        <tr key={row.name} className="hover:bg-blue-50/40">
                          <td className="p-3 border-r border-gray-200 font-mono font-bold text-blue-700">
                            {row.name}
                          </td>
                          <td className="p-3 border-r border-gray-200">
                            <span className="font-semibold block text-gray-900">
                              {row.employee_name ||
                                row.asset_name ||
                                row.project_name ||
                                row.task_subject ||
                                row.description ||
                                row.item_name}
                            </span>
                            <span className="text-[11px] text-gray-500">
                              {row.department ||
                                row.asset_category ||
                                row.utility_type ||
                                row.vendor_store ||
                                row.item_group ||
                                (row.progress !== undefined ? `Progress: ${row.progress}%` : '')}
                            </span>
                          </td>
                          <td className="p-3 border-r border-gray-200 font-mono">
                            {row.amount_pkr
                              ? `Rs. ${Number(row.amount_pkr).toLocaleString()} PKR`
                              : row.gross_purchase_amount_pkr
                              ? `Rs. ${Number(row.gross_purchase_amount_pkr).toLocaleString()} PKR`
                              : row.salary_pkr
                              ? `Salary: Rs. ${Number(row.salary_pkr).toLocaleString()}`
                              : row.total_budget_pkr
                              ? `Budget: Rs. ${Number(row.total_budget_pkr).toLocaleString()}`
                              : row.attendance_date
                              ? `${row.attendance_date} (In: ${row.in_time || 'N/A'})`
                              : row.current_stock
                              ? `${row.current_stock} ${row.stock_uom} @ Rs. ${row.standard_rate_pkr}`
                              : row.progress !== undefined
                              ? `${row.progress}% Completed`
                              : '-'}
                          </td>
                          <td className="p-3 border-r border-gray-200 text-gray-600">
                            {row.custodian_name ||
                              row.lead_engineer_name ||
                              row.assigned_to_name ||
                              row.recorded_by ||
                              row.owner ||
                              '-'}
                          </td>
                          <td className="p-3 flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                row.status === 'Present' ||
                                row.status === 'Available' ||
                                row.status === 'Paid' ||
                                row.status === 'Approved' ||
                                row.status === 'Active' ||
                                row.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.status === 'In-Use' ||
                                    row.status === 'Pending' ||
                                    row.status === 'Working'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {row.status || (row.docstatus === 1 ? 'Submitted' : 'Draft')}
                            </span>

                            {/* Logistics / CEO Update button for utility bills */}
                            {activeDocType === 'tab_utility_bill' && (
                              <button
                                onClick={() => setEditingBill(row)}
                                className="ml-2 p-1 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded"
                                title="Update Bill Status"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: DEDICATED TASK / GANTT DETAIL VIEW
              Shows which employees and equipment are linked to this task with full WBS
              ========================================================================= */}
          {currentView === 'task_detail' && selectedTaskDetail && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <button
                  onClick={() => setCurrentView('workspace')}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to {activeWorkspace === 'executive' ? 'Executive Desk' : 'Supervisor Desk'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    {selectedTaskDetail.name}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${
                      selectedTaskDetail.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Priority: {selectedTaskDetail.priority}
                  </span>
                </div>
              </div>

              {/* Task Header Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedTaskDetail.task_subject}</h2>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      Classified Project: <strong>{selectedTaskDetail.project_name}</strong> ({selectedTaskDetail.project})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 block">Deliverable Timeline</span>
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {selectedTaskDetail.start_date} → {selectedTaskDetail.due_date}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {selectedTaskDetail.description || 'Defense engineering task deliverable with multi-phase verification.'}
                </p>

                {/* Progress Metric */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700">Engineering Completion Progress</span>
                    <span className="text-blue-700 font-mono font-bold">{selectedTaskDetail.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${selectedTaskDetail.progress || 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Two Column Layout: Assigned Employees & Linked Bench Equipment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Related Employees */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-gray-900">Assigned Engineering Personnel</h3>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                          {selectedTaskDetail.assigned_to_name?.substring(0, 2).toUpperCase() || 'EN'}
                        </div>
                        <div>
                          <span className="font-bold text-xs text-gray-900 block">{selectedTaskDetail.assigned_to_name}</span>
                          <span className="text-[11px] text-gray-500 font-mono">Lead Engineer • {selectedTaskDetail.assigned_to}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Lead Assignee
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-500">
                      Collaborating Specialists: <strong>Taha Rehman (Prototyping)</strong>, <strong>Maryam Siddiqui (QA)</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Related Bench Equipment */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                    <Wrench className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900">Required Bench Equipment & Machinery</h3>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">
                        {selectedTaskDetail.equipment_required || 'Keysight 4-Channel InfiniiVision Oscilloscope'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono text-[10px] font-bold">
                        In-Use on Bench
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 space-y-0.5 font-mono">
                      <div>Serial: <strong>SN-KEY-2026-09</strong></div>
                      <div>Calibration Expiry: <strong className="text-emerald-700">2027-04-15 (Certified)</strong></div>
                      <div>Location: <strong>RF Testing Lab — Bench A</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Components / WBS Checklist with Delay Blocker Notes */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <ListTodo className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-gray-900">Phase Components & Deliverable Checklists</h3>
                  </div>
                  <span className="text-xs font-mono text-gray-500">
                    {selectedTaskDetail.completedComponents || 0} / {selectedTaskDetail.totalComponents || selectedTaskDetail.components?.length || 4} Completed
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedTaskDetail.components?.map((comp: any) => (
                    <div
                      key={comp.name}
                      className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        comp.is_completed === 1 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleComponent(comp.name)}
                          className="mt-0.5 text-blue-600 hover:text-blue-800"
                        >
                          {comp.is_completed === 1 ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <div>
                          <span className={`font-semibold ${comp.is_completed === 1 ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {comp.component_title}
                          </span>
                          {comp.notes && (
                            <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1 flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                              <span><strong>Lab Note:</strong> {comp.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-gray-500">
                        {comp.is_completed === 1 ? `Completed ${comp.completed_at?.substring(0, 16) || ''}` : 'In Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 3: ALL EMPLOYEES DIRECTORY GRID (ACCESSIBLE VIA "VIEW MORE")
              ========================================================================= */}
          {currentView === 'all_employees' && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <button
                  onClick={() => setCurrentView('workspace')}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Executive Desk</span>
                </button>

                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded font-bold font-mono">
                    {allEmployees.length} Registered Staff Members
                  </span>
                  {currentUser.role === 'CEO' && (
                    <button
                      onClick={() => {
                        setShowModal('tab_employee');
                        setModalFormData({
                          date_of_joining: '2026-10-22',
                          department: 'Hardware & RF Engineering'
                        });
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Employee</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Grid of All Employees */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allEmployees.map((emp: any) => (
                  <div
                    key={emp.name}
                    onClick={() => {
                      setSelectedEmployeeDetail(emp);
                      setCurrentView('employee_detail');
                    }}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition cursor-pointer space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {emp.employee_name?.substring(0, 2).toUpperCase() || 'EM'}
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-sm text-gray-900 block truncate">{emp.employee_name}</span>
                        <span className="text-xs text-gray-500 truncate block">{emp.designation}</span>
                      </div>
                    </div>

                    <div className="text-[11px] space-y-1 font-mono text-gray-600 pt-2 border-t border-gray-100">
                      <div>Code: <strong className="text-blue-700">{emp.name}</strong></div>
                      <div>Dept: <strong className="text-gray-800">{emp.department}</strong></div>
                      <div>Joined: <strong className="text-gray-800">{emp.date_of_joining || '2024-01-15'}</strong></div>
                      {emp.salary_pkr && (
                        <div>Salary: <strong className="text-emerald-700">Rs. {Number(emp.salary_pkr).toLocaleString()}</strong></div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-between items-center text-xs text-blue-600 font-semibold border-t border-gray-100">
                      <span>View Full Profile Dossier</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: COMPREHENSIVE EMPLOYEE DOSSIER DETAIL VIEW
              Personal profile, active task, past projects, and monthly involvement graph
              ========================================================================= */}
          {currentView === 'employee_detail' && selectedEmployeeDetail && (
            <div className="space-y-6 max-w-5xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <button
                  onClick={() => setCurrentView('all_employees')}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to All Employees Directory</span>
                </button>

                <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded border border-blue-200">
                  {selectedEmployeeDetail.name} • {selectedEmployeeDetail.status}
                </span>
              </div>

              {/* Dossier Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
                      {selectedEmployeeDetail.employee_name?.substring(0, 2).toUpperCase() || 'EM'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedEmployeeDetail.employee_name}</h2>
                      <p className="text-xs text-gray-500 font-medium">{selectedEmployeeDetail.designation} • {selectedEmployeeDetail.department}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs font-mono space-y-1">
                    <div>Joined: <strong className="text-gray-900">{selectedEmployeeDetail.date_of_joining || '2024-01-15'}</strong></div>
                    <div>Email: <strong className="text-blue-700">{selectedEmployeeDetail.user_id || 'N/A'}</strong></div>
                    <div>Phone: <strong className="text-gray-900">{selectedEmployeeDetail.cell_number || '+92-300-XXXXXXX'}</strong></div>
                  </div>
                </div>

                {/* Salary (CEO only) */}
                {selectedEmployeeDetail.salary_pkr && (
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex justify-between items-center text-xs font-mono">
                    <span className="text-emerald-800 font-semibold">Executive Payroll Compensation:</span>
                    <span className="text-base font-bold text-emerald-800">
                      Rs. {Number(selectedEmployeeDetail.salary_pkr).toLocaleString()} PKR / Month
                    </span>
                  </div>
                )}

                {/* Active Deliverable */}
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  <span className="text-gray-500 block text-[11px] uppercase tracking-wider font-semibold">Current Active Deliverable</span>
                  <span className="text-sm font-bold text-gray-900 block mt-0.5">
                    {selectedEmployeeDetail.current_task || 'Assigned to active engineering prototyping and lab testing'}
                  </span>
                </div>
              </div>

              {/* Two Columns: Project History & Visual Timeline Line Graph */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Projects Worked On */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Project History & Experience</h3>
                  </div>

                  <div className="space-y-2">
                    {(selectedEmployeeDetail.past_projects || ['Radar DSP High-Speed Core', 'Telemetry ECU Flight System']).map((proj: string, idx: number) => (
                      <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs flex items-center justify-between">
                        <span className="font-semibold text-gray-800">{proj}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono font-bold">
                          Completed / Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Monthly & Annual Project Involvement Graph */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-gray-900">Project Activity & Deliveries Trend</h3>
                  </div>

                  <div className="h-48 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={
                          selectedEmployeeDetail.project_activity_timeline || [
                            { month: 'May', projects: 1 },
                            { month: 'Jun', projects: 2 },
                            { month: 'Jul', projects: 2 },
                            { month: 'Aug', projects: 3 },
                            { month: 'Sep', projects: 3 },
                            { month: 'Oct', projects: 4 }
                          ]
                        }
                        margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#888888" fontSize={11} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          formatter={(v: any) => [`${v} Active Projects`, 'Workload']}
                          contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }}
                        />
                        <Line type="monotone" dataKey="projects" name="Projects" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 5: COMPREHENSIVE COMPANY EXPENSES & EVM FULL LEDGER (CEO VIEW)
              Accessible via "View More" on the EVM Card
              ========================================================================= */}
          {currentView === 'expenses_ledger' && expensesLedger && (
            <div className="space-y-6 max-w-6xl">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <button
                  onClick={() => setCurrentView('workspace')}
                  className="flex items-center space-x-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Executive Desk</span>
                </button>

                <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                  {(['all', 'utilities', 'kitchen', 'claims'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setExpensesLedgerTab(tab)}
                      className={`px-3 py-1 rounded-md capitalize transition ${
                        expensesLedgerTab === tab ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Solvency Header Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <span className="text-gray-500 block mb-1">Total Facilities & Burn Realized</span>
                  <span className="text-xl font-bold text-gray-900">
                    Rs. {workspaceData?.financialSummary ? Number(workspaceData.financialSummary.totalBurnPKR).toLocaleString() : '649,500'}
                  </span>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <span className="text-gray-500 block mb-1">Allocated Contract Budgets</span>
                  <span className="text-xl font-bold text-blue-700">
                    Rs. {workspaceData?.financialSummary ? Number(workspaceData.financialSummary.projectAllocatedPKR).toLocaleString() : '28,300,000'}
                  </span>
                </div>
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <span className="text-gray-500 block mb-1">Remaining Net Margin Solvency</span>
                  <span className="text-xl font-bold text-emerald-700">
                    Rs. {workspaceData?.financialSummary ? Number(workspaceData.financialSummary.projectBalancePKR).toLocaleString() : '21,650,000'}
                  </span>
                </div>
              </div>

              {/* Utility Bills Table */}
              {(expensesLedgerTab === 'all' || expensesLedgerTab === 'utilities') && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span>Municipal Utility Invoices & Power Backup Expenses</span>
                  </h3>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                      <tr>
                        <th className="p-2.5 font-mono">ID</th>
                        <th className="p-2.5">TYPE / PROVIDER</th>
                        <th className="p-2.5">CONSUMER NO</th>
                        <th className="p-2.5">AMOUNT (PKR)</th>
                        <th className="p-2.5">DUE DATE</th>
                        <th className="p-2.5">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {expensesLedger.utilityBills.map((bill: any) => (
                        <tr key={bill.name} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono font-bold text-blue-700">{bill.name}</td>
                          <td className="p-2.5 font-semibold text-gray-900">{bill.utility_type}</td>
                          <td className="p-2.5 font-mono text-gray-600">{bill.consumer_no}</td>
                          <td className="p-2.5 font-mono font-bold">Rs. {Number(bill.amount_pkr).toLocaleString()}</td>
                          <td className="p-2.5 font-mono text-gray-600">{bill.due_date}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Kitchen Expenses Table */}
              {(expensesLedgerTab === 'all' || expensesLedgerTab === 'kitchen') && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                    <Coffee className="w-4 h-4 text-amber-600" />
                    <span>Canteen, Tea & Refreshments Ledger</span>
                  </h3>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                      <tr>
                        <th className="p-2.5 font-mono">ID</th>
                        <th className="p-2.5">DESCRIPTION</th>
                        <th className="p-2.5">STORE / VENDOR</th>
                        <th className="p-2.5">AMOUNT (PKR)</th>
                        <th className="p-2.5">DATE</th>
                        <th className="p-2.5">RECORDED BY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {expensesLedger.kitchenExpenses.map((kit: any) => (
                        <tr key={kit.name} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono font-bold text-blue-700">{kit.name}</td>
                          <td className="p-2.5 font-semibold text-gray-900">{kit.description}</td>
                          <td className="p-2.5 text-gray-600">{kit.vendor_store}</td>
                          <td className="p-2.5 font-mono font-bold">Rs. {Number(kit.amount_pkr).toLocaleString()}</td>
                          <td className="p-2.5 font-mono text-gray-600">{kit.expense_date}</td>
                          <td className="p-2.5 text-gray-600">{kit.recorded_by || 'Logistics'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW: FULL GANTT TIMELINE & WBS SCHEDULE (DEDICATED FULL VIEW)
              ========================================================================= */}
          {currentView === 'full_gantt' && (
            <div className="space-y-5 max-w-6xl">
              {/* Top Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCurrentView('workspace')}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 transition flex items-center space-x-1.5 text-xs font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Cockpit</span>
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span>Classified Projects Gantt Timeline & WBS Schedule</span>
                    </h1>
                    <p className="text-xs text-gray-500">
                      Multi-phase execution schedule, milestone critical paths & lab bench gear
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex bg-gray-100 p-0.5 rounded text-[11px] font-semibold">
                    <button
                      onClick={() => setGanttFilter('all')}
                      className={`px-2.5 py-1 rounded ${
                        ganttFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      All Projects
                    </button>
                    <button
                      onClick={() => setGanttFilter('PRJ-2026-0001')}
                      className={`px-2.5 py-1 rounded ${
                        ganttFilter === 'PRJ-2026-0001' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Radar DSP
                    </button>
                    <button
                      onClick={() => setGanttFilter('PRJ-2026-0002')}
                      className={`px-2.5 py-1 rounded ${
                        ganttFilter === 'PRJ-2026-0002' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Telemetry ECU
                    </button>
                  </div>

                  {(currentUser?.role === 'Supervisor' || currentUser?.role === 'CEO') && (
                    <button
                      onClick={() => {
                        setShowModal('tab_task');
                        setModalFormData({
                          project: 'PRJ-2026-0001',
                          priority: 'High',
                          status: 'Working',
                          progress: 0,
                          start_date: '2026-10-22',
                          due_date: '2026-11-10',
                          numPhases: 4,
                          phases: [
                            'Phase 1: Architecture & Schematic Capture',
                            'Phase 2: High-Speed PCB Layout & DRC',
                            'Phase 3: Cleanroom SMD Assembly',
                            'Phase 4: Environmental & HIL Testing'
                          ],
                          equipment_required: 'Tektronix 4-Channel 1GHz Phosphor Oscilloscope (ASSET-0001)'
                        });
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Start Task (With Phases)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Gantt Timeline Calendar Scale */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="overflow-x-auto">
                  <div className="min-w-[760px] space-y-4">
                    <div className="grid grid-cols-12 gap-1 text-[11px] font-mono text-gray-500 border-b border-gray-200 pb-2 text-center">
                      <div className="col-span-4 text-left font-sans font-bold text-gray-700">
                        PHASE / TASK DELIVERABLE
                      </div>
                      <div className="col-span-1">OCT W1</div>
                      <div className="col-span-1">OCT W2</div>
                      <div className="col-span-1">OCT W3</div>
                      <div className="col-span-1 bg-blue-50/70 text-blue-700 font-bold rounded">
                        OCT W4 (NOW)
                      </div>
                      <div className="col-span-1">NOV W1</div>
                      <div className="col-span-1">NOV W2</div>
                      <div className="col-span-1">NOV W3</div>
                      <div className="col-span-1">NOV W4</div>
                    </div>

                    {/* Render Phases & Nested Tasks */}
                    <div className="space-y-3">
                      {filteredPhases.map((phase: any) => {
                        const childTasks = tasksList.filter(t => t.project === phase.project);

                        return (
                          <div key={phase.name} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                              <div className="flex items-center space-x-2">
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-mono text-blue-700">{phase.name}</span>
                                <span>{phase.phase_name}</span>
                                <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                  ◆ {phase.milestone}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3 text-[11px] font-mono">
                                <span>{phase.start_date} → {phase.due_date}</span>
                                <span className={`px-2 py-0.5 rounded font-semibold ${
                                  phase.progress === 100
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : phase.progress > 0
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {phase.progress}% Done
                                </span>
                              </div>
                            </div>

                            {/* Child Tasks — Clicking opens Task Detail page */}
                            <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                              {childTasks.map((task: any) => {
                                const progressPercent = task.progress || 0;
                                const completed = task.completedComponents || 0;
                                const total = task.totalComponents || 4;

                                return (
                                  <div
                                    key={task.name}
                                    onClick={() => {
                                      setSelectedTaskDetail(task);
                                      setCurrentView('task_detail');
                                    }}
                                    className="grid grid-cols-12 gap-1 items-center text-xs cursor-pointer hover:bg-white p-1.5 rounded transition border border-transparent hover:border-gray-200"
                                    title="Click to view full Task details, assigned equipment & personnel"
                                  >
                                    <div className="col-span-4 pr-2">
                                      <div className="font-semibold text-gray-800 truncate flex items-center space-x-1">
                                        <span>{task.task_subject}</span>
                                        <ExternalLink className="w-3 h-3 text-blue-500 opacity-60 flex-shrink-0" />
                                      </div>
                                      <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-1">
                                        <User className="w-2.5 h-2.5" />
                                        <span>{task.assigned_to_name}</span>
                                        <span>• {completed}/{total} components</span>
                                      </div>
                                    </div>

                                    <div className="col-span-8 relative py-1">
                                      <div className="w-full bg-gray-200/80 rounded-md h-5 relative overflow-hidden border border-gray-300/70 flex items-center px-2">
                                        <div
                                          className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                            progressPercent >= 90
                                              ? 'bg-emerald-500'
                                              : progressPercent >= 60
                                              ? 'bg-blue-600'
                                              : progressPercent >= 25
                                              ? 'bg-amber-500'
                                              : 'bg-rose-500'
                                          }`}
                                          style={{ width: `${progressPercent}%` }}
                                        />
                                        <div className="relative z-10 flex items-center justify-between w-full text-[10px] font-mono font-bold text-white drop-shadow-xs">
                                          <span className="truncate max-w-[200px] text-gray-900 bg-white/70 px-1 rounded text-[9px]">
                                            {task.name}: {task.priority}
                                          </span>
                                          <span className="text-gray-900 bg-white/70 px-1 rounded text-[9px]">
                                            {progressPercent}% ({completed}/{total} done)
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 6: NORMAL WORKSPACE DASHBOARD VIEW
              ========================================================================= */}
          {currentView === 'workspace' && (
            <div className="space-y-6 max-w-6xl">
              {/* Workspace Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {activeWorkspace === 'executive'
                      ? 'Executive Directorate Desk'
                      : activeWorkspace === 'supervisor'
                      ? 'Engineering Supervisor Desk'
                      : activeWorkspace === 'operations'
                      ? 'Logistics, Warehouse & Facility Operations'
                      : 'My Employee Workspace'}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Haalar Services — Humak Industrial Facility, Islamabad
                  </p>
                </div>

                {/* Clock In / Out with 9 AM – 4 PM Working Hours Check */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleClockAction('IN')}
                    disabled={!isWorkingHours}
                    title={!isWorkingHours ? 'Punches permitted strictly between 09:00 AM and 04:00 PM' : 'Record Check-In'}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition ${
                      isWorkingHours
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Clock In</span>
                  </button>

                  <button
                    onClick={() => handleClockAction('OUT')}
                    disabled={!isWorkingHours}
                    title={!isWorkingHours ? 'Punches permitted strictly between 09:00 AM and 04:00 PM' : 'Record Check-Out'}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isWorkingHours
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    <span>Clock Out</span>
                  </button>

                  {/* Demo Working Hours Override Switch */}
                  <button
                    type="button"
                    onClick={() => setDemoTimeOverride(!demoTimeOverride)}
                    title="Toggle demo override for testing clock-in outside 9am-4pm"
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold border transition ${
                      demoTimeOverride
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}
                  >
                    {demoTimeOverride ? '9am-4pm: Active (Demo)' : '9am-4pm: Enforced'}
                  </button>
                </div>
              </div>

              {/* Number Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {workspaceData?.workspaces
                  .find((w: any) => w.id === activeWorkspace)
                  ?.numberCards.map((card: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                    >
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        {card.label}
                      </span>
                      <span className="text-xl font-bold text-gray-900 font-mono block">
                        {card.value}
                      </span>
                    </div>
                  ))}
              </div>

              {/* =========================================================================
                  EXECUTIVE WORKSPACE: HIGH-DENSITY ZERO-SCROLL 6-TILE COCKPIT
                  ========================================================================= */}
              {activeWorkspace === 'executive' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* TILE 1: Mission-Critical Tasks & Schedule (WBS Pulse) */}
                  <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-200 transition">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Active Projects & WBS</h3>
                          <p className="text-[10px] text-gray-500">Critical mission deliverables</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentView('full_gantt')}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 transition hover:underline"
                        title="Open full interactive Gantt timeline"
                      >
                        <span>Full Gantt</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {tasksList.slice(0, 2).map((task: any) => {
                        const progressPercent = task.progress || 0;
                        const completed = task.completedComponents || 0;
                        const total = task.totalComponents || 4;

                        return (
                          <div
                            key={task.name}
                            onClick={() => {
                              setSelectedTaskDetail(task);
                              setCurrentView('task_detail');
                            }}
                            className="p-2 rounded-lg bg-gray-50/70 hover:bg-blue-50/40 border border-gray-200/80 hover:border-blue-200 cursor-pointer transition space-y-1.5"
                            title="Click to view task details, assigned engineers & bench gear"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-gray-900 truncate max-w-[190px]">
                                {task.task_subject}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                task.priority === 'Urgent'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                              <span>Lead: <strong className="text-gray-700">{task.assigned_to_name?.split(' ')[0]}</strong></span>
                              <span>Due: {task.exp_end_date || '2026-11-15'}</span>
                            </div>

                            <div className="space-y-0.5">
                              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-300 ${
                                    progressPercent >= 75 ? 'bg-emerald-500' : progressPercent >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-mono text-gray-400">
                                <span>{completed}/{total} phases complete</span>
                                <span className="font-bold text-gray-700">{progressPercent}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{tasksList.length} total active tasks</span>
                      <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Milestones on Track</span>
                      </span>
                    </div>
                  </div>

                  {/* TILE 2: Corporate Financials & EVM Contract Performance */}
                  <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-200 transition">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Financial Health & EVM</h3>
                          <p className="text-[10px] text-gray-500">Contract efficiency & burn</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentView('expenses_ledger')}
                        className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 flex items-center space-x-0.5 transition hover:underline"
                        title="Open full itemized expenses ledger"
                      >
                        <span>Full Ledger</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                        <span className="text-[10px] text-emerald-700 font-semibold block">Cost Index (CPI)</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-bold font-mono text-emerald-900">
                            {evmData?.summary?.overallCPI || '1.08'}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700">Under Budget</span>
                        </div>
                      </div>
                      <div className="p-2 bg-blue-50/60 border border-blue-100 rounded-lg">
                        <span className="text-[10px] text-blue-700 font-semibold block">Schedule Index (SPI)</span>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-base font-bold font-mono text-blue-900">
                            {evmData?.summary?.overallSPI || '1.00'}
                          </span>
                          <span className="text-[9px] font-bold text-blue-700">On Time</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-16 w-full">
                      {evmData?.monthlyCurves ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={evmData.monthlyCurves} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                            <Line type="monotone" dataKey="plannedValue" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1.5} dot={false} />
                            <Line type="monotone" dataKey="earnedValue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="actualCost" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Tooltip formatter={(v: any) => [`Rs. ${(Number(v)/1000000).toFixed(1)}M`, '']} />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-[10px]">Loading EVM...</div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500 font-mono">
                      <span>Burn: <strong className="text-gray-900">Rs. {((workspaceData?.financialSummary?.totalBurnPKR || 562300)/1000).toFixed(0)}k</strong></span>
                      <span>Margin: <strong className="text-emerald-700">+Rs. {((workspaceData?.financialSummary?.projectBalancePKR || 2640000)/1000000).toFixed(2)}M</strong></span>
                    </div>
                  </div>

                  {/* TILE 3: Equipment Fleet Utilization (Donut Chart) */}
                  <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-purple-200 transition">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                          <PieChartIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Equipment Fleet</h3>
                          <p className="text-[10px] text-gray-500">Test bench & lab machinery</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setEquipmentView(equipmentView === 'status' ? 'category' : 'status')}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                          title="Toggle between Status and Category view"
                        >
                          {equipmentView === 'status' ? 'Status' : 'Category'}
                        </button>
                        <button
                          onClick={() => openDocTypeList('tab_asset')}
                          className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 flex items-center space-x-0.5 transition hover:underline"
                          title="Open complete equipment register"
                        >
                          <span>List</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="h-24 flex items-center justify-center">
                      {equipmentStats ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={
                                equipmentView === 'status'
                                  ? (equipmentStats.byStatus || [])
                                  : (equipmentStats.byCategory || []).map((c: any) => ({ ...c, value: c.count }))
                              }
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={28}
                              outerRadius={42}
                              paddingAngle={4}
                            >
                              {(equipmentView === 'status'
                                ? (equipmentStats.byStatus || [])
                                : (equipmentStats.byCategory || [])
                              ).map((entry: any, index: number) => (
                                <Cell key={`cell-cockpit-${index}`} fill={entry.color || '#8b5cf6'} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(val: any, name: any, item: any) => [
                                equipmentView === 'status'
                                  ? `${val} Units`
                                  : `${val} Units (Rs. ${(item.payload?.value_pkr || 0).toLocaleString()})`,
                                name
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-gray-400 text-[10px]">Loading fleet metrics...</div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-gray-50 rounded p-1">
                        <span className="text-[9px] text-gray-500 block">Total</span>
                        <span className="font-bold text-xs text-gray-900 font-mono">{equipmentStats?.totalAssets || allAssets.length}</span>
                      </div>
                      <div className="bg-emerald-50 rounded p-1">
                        <span className="text-[9px] text-emerald-700 block">Available</span>
                        <span className="font-bold text-xs text-emerald-900 font-mono">
                          {equipmentStats?.byStatus?.find((s: any) => s.name === 'Available')?.value || 0}
                        </span>
                      </div>
                      <div className="bg-blue-50 rounded p-1">
                        <span className="text-[9px] text-blue-700 block">In-Use</span>
                        <span className="font-bold text-xs text-blue-900 font-mono">
                          {equipmentStats?.byStatus?.find((s: any) => s.name === 'In-Use')?.value || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TILE 4: Engineering Team Workload */}
                  <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-200 transition">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Engineering Workload</h3>
                          <p className="text-[10px] text-gray-500">Personnel capacity & headroom</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCurrentView('all_employees')}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-0.5 transition hover:underline"
                        title="View all 12+ employee cards & dossiers"
                      >
                        <span>All Staff ({allEmployees.length})</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {teamWorkload.slice(0, 2).map((member: any) => (
                        <div key={member.empId} className="p-2 rounded-lg bg-gray-50/70 border border-gray-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-gray-900">{member.fullName?.split(' ')[0]} ({member.designation?.split(' ')[0]})</span>
                            <span className="text-[10px] font-mono font-bold text-gray-700">{member.totalAllocationPercent}% Load</span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden flex">
                            {member.projectAllocations.map((alloc: any, i: number) => (
                              <div
                                key={i}
                                style={{ width: `${alloc.percent}%`, backgroundColor: alloc.color }}
                                className="h-full border-r border-white/40"
                                title={`${alloc.project}: ${alloc.percent}%`}
                              />
                            ))}
                            <div style={{ width: `${member.headroomPercent}%` }} className="h-full bg-gray-200" title={`Headroom: ${member.headroomPercent}%`} />
                          </div>

                          <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                            <span>Bench: {member.benchLocation?.split('-')[0]}</span>
                            <span className="text-emerald-700 font-semibold">{member.headroomPercent}% Headroom</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                      <span>{Math.max(0, allEmployees.length - 2)} other staff at nominal load</span>
                      <span className="text-indigo-700 font-semibold">100% Bench Attendance</span>
                    </div>
                  </div>

                  {/* TILE 5: Aerospace Component Safety */}
                  <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-amber-200 transition">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                          <Boxes className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Component Inventory</h3>
                          <p className="text-[10px] text-gray-500">Safety stock & supply lead-times</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openDocTypeList('tab_item')}
                        className="text-[11px] font-semibold text-amber-600 hover:text-amber-800 flex items-center space-x-0.5 transition hover:underline"
                        title="Open component inventory register"
                      >
                        <span>Store</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {inventoryBulletGauges.slice(0, 2).map((item: any) => {
                        const stockPercent = Math.min(100, Math.round((item.currentStock / (item.safetyStock * 2.5)) * 100));

                        return (
                          <div key={item.itemCode} className="p-2 rounded-lg bg-gray-50/70 border border-gray-200/80 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-xs text-gray-900 truncate max-w-[170px]" title={item.itemName}>
                                {item.itemName}
                              </span>
                              <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1 rounded border border-blue-200">
                                {item.leadTimeDays}d lead
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                              <div
                                className={`h-full ${item.status === 'Optimal' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                style={{ width: `${stockPercent}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-[9px] font-mono text-gray-500">
                              <span>Stock: <strong className="text-gray-800">{item.currentStock} {item.uom}</strong></span>
                              <span>Buffer: <strong>{item.safetyStock} {item.uom}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                      <span>Warehouse: Humak Bay</span>
                      <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        <span>Buffers Healthy</span>
                      </span>
                    </div>
                  </div>

                  {/* TILE 6: Executive Approvals Queue */}
                  <div className="bg-white border border-gray-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-rose-200 transition">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Authorization Queue</h3>
                          <p className="text-[10px] text-gray-500">Pending sign-offs & checkouts</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openDocTypeList('tab_asset_request')}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center space-x-0.5 transition hover:underline"
                        title="View all requests register"
                      >
                        <span>All ({assetRequests.length})</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      {assetRequests.filter((r: any) => r.status === 'Pending' || r.status === 'Pending Approval').length > 0 ? (
                        assetRequests
                          .filter((r: any) => r.status === 'Pending' || r.status === 'Pending Approval')
                          .slice(0, 2)
                          .map((req: any) => (
                            <div key={req.name} className="p-2 rounded-lg bg-amber-50/50 border border-amber-200/80 space-y-1.5">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="font-semibold text-xs text-gray-900 block truncate max-w-[150px]">{req.asset_name}</span>
                                  <span className="text-[10px] text-gray-500 font-mono">By {req.requested_by_name?.split(' ')[0]}</span>
                                </div>
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[9px] font-bold">
                                  Pending
                                </span>
                              </div>

                              <div className="flex items-center space-x-1.5 pt-0.5">
                                <button
                                  onClick={() => handleApproveAssetRequest(req.name)}
                                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition flex items-center justify-center space-x-1"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => handleRejectAssetRequest(req.name)}
                                  className="flex-1 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded text-[10px] font-bold transition flex items-center justify-center space-x-1"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-3 bg-emerald-50/40 border border-emerald-100 rounded-lg space-y-1">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs text-emerald-900">All Operational Clearances Approved</span>
                          <p className="text-[10px] text-gray-500">No outstanding tool checkouts or requisitions</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                      <span>CEO & Lead Authority</span>
                      <span className="text-gray-700 font-mono font-bold">
                        {assetRequests.filter((r: any) => r.status === 'Approved').length} Approved this cycle
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  GANTT CHART: SUPERVISOR DESK
                  Clicking any task opens the dedicated full Task Detail Page
                  ========================================================================= */}
              {activeWorkspace === 'supervisor' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-blue-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Classified Projects Gantt Timeline & WBS Schedule
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Click any task to inspect linked engineers, required bench equipment & WBS details
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex bg-gray-100 p-0.5 rounded text-[11px] font-semibold">
                        <button
                          onClick={() => setGanttFilter('all')}
                          className={`px-2 py-0.5 rounded ${
                            ganttFilter === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                          }`}
                        >
                          All Projects
                        </button>
                        <button
                          onClick={() => setGanttFilter('PRJ-2026-0001')}
                          className={`px-2 py-0.5 rounded ${
                            ganttFilter === 'PRJ-2026-0001' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                          }`}
                        >
                          Radar DSP
                        </button>
                        <button
                          onClick={() => setGanttFilter('PRJ-2026-0002')}
                          className={`px-2 py-0.5 rounded ${
                            ganttFilter === 'PRJ-2026-0002' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600'
                          }`}
                        >
                          Telemetry ECU
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setShowModal('tab_task');
                          setModalFormData({
                            project: 'PRJ-2026-0001',
                            priority: 'High',
                            status: 'Working',
                            progress: 0,
                            start_date: '2026-10-22',
                            due_date: '2026-11-10',
                            numPhases: 4,
                            phases: [
                              'Phase 1: Architecture & Schematic Capture',
                              'Phase 2: High-Speed PCB Layout & DRC',
                              'Phase 3: Cleanroom SMD Assembly',
                              'Phase 4: Environmental & HIL Testing'
                            ],
                            equipment_required: 'Tektronix 4-Channel 1GHz Phosphor Oscilloscope (ASSET-0001)'
                          });
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center space-x-1 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Start Task (With Phases)</span>
                      </button>
                    </div>
                  </div>

                  {/* Gantt Timeline Calendar Scale */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[760px] space-y-4">
                      <div className="grid grid-cols-12 gap-1 text-[11px] font-mono text-gray-500 border-b border-gray-200 pb-2 text-center">
                        <div className="col-span-4 text-left font-sans font-bold text-gray-700">
                          PHASE / TASK DELIVERABLE
                        </div>
                        <div className="col-span-1">OCT W1</div>
                        <div className="col-span-1">OCT W2</div>
                        <div className="col-span-1">OCT W3</div>
                        <div className="col-span-1 bg-blue-50/70 text-blue-700 font-bold rounded">
                          OCT W4 (NOW)
                        </div>
                        <div className="col-span-1">NOV W1</div>
                        <div className="col-span-1">NOV W2</div>
                        <div className="col-span-1">NOV W3</div>
                        <div className="col-span-1">NOV W4</div>
                      </div>

                      {/* Render Phases & Nested Tasks */}
                      <div className="space-y-3">
                        {filteredPhases.map((phase: any) => {
                          const childTasks = tasksList.filter(t => t.project === phase.project);

                          return (
                            <div key={phase.name} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 space-y-2.5">
                              <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                                <div className="flex items-center space-x-2">
                                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                  <span className="font-mono text-blue-700">{phase.name}</span>
                                  <span>{phase.phase_name}</span>
                                  <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                    ◆ {phase.milestone}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-3 text-[11px] font-mono">
                                  <span>{phase.start_date} → {phase.due_date}</span>
                                  <span className={`px-2 py-0.5 rounded font-semibold ${
                                    phase.progress === 100
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : phase.progress > 0
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {phase.progress}% Done
                                  </span>
                                </div>
                              </div>

                              {/* Child Tasks — Clicking opens Task Detail page */}
                              <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                                {childTasks.map((task: any) => {
                                  const progressPercent = task.progress || 0;
                                  const completed = task.completedComponents || 0;
                                  const total = task.totalComponents || 4;

                                  return (
                                    <div
                                      key={task.name}
                                      onClick={() => {
                                        setSelectedTaskDetail(task);
                                        setCurrentView('task_detail');
                                      }}
                                      className="grid grid-cols-12 gap-1 items-center text-xs cursor-pointer hover:bg-white p-1 rounded transition"
                                      title="Click to view full Task details, assigned equipment & personnel"
                                    >
                                      <div className="col-span-4 pr-2">
                                        <div className="font-semibold text-gray-800 truncate flex items-center space-x-1">
                                          <span>{task.task_subject}</span>
                                          <ExternalLink className="w-3 h-3 text-blue-500 opacity-60 flex-shrink-0" />
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono flex items-center space-x-1">
                                          <User className="w-2.5 h-2.5" />
                                          <span>{task.assigned_to_name}</span>
                                          <span>• {completed}/{total} components</span>
                                        </div>
                                      </div>

                                      <div className="col-span-8 relative py-1">
                                        <div className="w-full bg-gray-200/80 rounded-md h-5 relative overflow-hidden border border-gray-300/70 flex items-center px-2">
                                          <div
                                            className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                                              progressPercent >= 90
                                                ? 'bg-emerald-500'
                                                : progressPercent >= 60
                                                ? 'bg-blue-600'
                                                : progressPercent >= 25
                                                ? 'bg-amber-500'
                                                : 'bg-rose-500'
                                            }`}
                                            style={{ width: `${progressPercent}%` }}
                                          />
                                          <div className="relative z-10 flex items-center justify-between w-full text-[10px] font-mono font-bold text-white drop-shadow-xs">
                                            <span className="truncate max-w-[200px] text-gray-900 bg-white/70 px-1 rounded text-[9px]">
                                              {task.name}: {task.priority}
                                            </span>
                                            <span className="text-gray-900 bg-white/70 px-1 rounded text-[9px]">
                                              {progressPercent}% ({completed}/{total} done)
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  TEAM WORKLOAD CAPACITY METERS (SUPERVISOR DESK)
                  ========================================================================= */}
              {activeWorkspace === 'supervisor' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Engineering Team Workload & Multi-Project Bandwidth
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Real-time personnel capacity meters (Top engineering leads shown below)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentView('all_employees')}
                      className="px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-semibold border border-purple-200 flex items-center space-x-1 transition"
                    >
                      <span>View More Employees ({allEmployees.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Allocation Meters Grid for Top Leads */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {teamWorkload.slice(0, 3).map((member: any) => (
                      <div key={member.empId} className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-xs text-gray-900 block">{member.fullName}</span>
                            <span className="text-[11px] text-gray-500">{member.designation}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            member.totalAllocationPercent > 85
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {member.status}
                          </span>
                        </div>

                        {/* Stacked Capacity Meter */}
                        <div>
                          <div className="flex justify-between text-[11px] font-mono mb-1">
                            <span className="text-gray-600">Total Load: <strong>{member.totalAllocationPercent}%</strong></span>
                            <span className="text-emerald-700 font-bold">{member.headroomPercent}% Headroom</span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
                            {member.projectAllocations.map((alloc: any, i: number) => (
                              <div
                                key={i}
                                title={`${alloc.project}: ${alloc.percent}%`}
                                style={{ width: `${alloc.percent}%`, backgroundColor: alloc.color }}
                                className="h-full border-r border-white/40"
                              />
                            ))}
                            <div
                              title={`Available Headroom: ${member.headroomPercent}%`}
                              style={{ width: `${member.headroomPercent}%` }}
                              className="h-full bg-gray-200"
                            />
                          </div>
                        </div>

                        {/* Project Split Legend */}
                        <div className="space-y-1 text-[10px] font-mono pt-1 border-t border-gray-200/60">
                          {member.projectAllocations.map((alloc: any, i: number) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: alloc.color }} />
                                <span className="text-gray-700 truncate max-w-[130px]">{alloc.project}</span>
                              </div>
                              <span className="font-bold text-gray-900">{alloc.percent}%</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-1.5 text-[10px] text-gray-500 border-t border-gray-200/60 flex items-center justify-between">
                          <span>Bench: <strong className="text-gray-800">{member.benchLocation}</strong></span>
                          <span>Tasks: <strong className="text-blue-700">{member.activeTasksCount}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View More Button at bottom of section */}
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setCurrentView('all_employees')}
                      className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-gray-500" />
                      <span>View All {allEmployees.length} Employee Cards & Project Histories</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  INVENTORY SAFETY STOCK & LEAD-TIME BULLET GAUGES (LOGISTICS DESK)
                  Includes "+ New Component Stock Item" modal trigger for Logistics
                  ========================================================================= */}
              {activeWorkspace === 'operations' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Gauge className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          Aerospace Component Inventory Safety Buffer & Lead-Time Bullet Gauges
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Buffer thresholds for critical long-lead military ICs, FPGAs and connectors
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowModal('tab_item');
                        setModalFormData({
                          stock_uom: 'PCS',
                          item_group: 'Integrated Circuits (ICs)',
                          reorder_level: 20,
                          lead_time_weeks: 8,
                          bin_location: 'SAFE-RACK-02'
                        });
                      }}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Component Item</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {inventoryBulletGauges.map((item: any) => {
                      const criticalPct = (item.criticalMin / item.optimalMax) * 100;
                      const reorderPct = (item.reorderPoint / item.optimalMax) * 100;
                      const currentPct = Math.min(100, (item.currentStock / item.optimalMax) * 100);

                      return (
                        <div key={item.itemCode} className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                            <div>
                              <span className="font-mono font-bold text-blue-700 mr-2">{item.itemCode}</span>
                              <span className="font-bold text-gray-900">{item.itemName}</span>
                              <span className="text-gray-500 text-[11px] ml-2 font-mono">
                                (Unit: Rs. {Number(item.unitRatePKR).toLocaleString()})
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 text-[11px] font-mono">
                              <span className={`px-2 py-0.5 rounded font-bold ${
                                item.statusColor === 'rose'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : item.statusColor === 'amber'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {item.status}
                              </span>
                              <span className="text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                Lead Time: {item.leadTimeWeeks} Wks
                              </span>
                            </div>
                          </div>

                          <div className="relative pt-1 pb-1">
                            <div className="w-full h-4 rounded overflow-hidden flex relative bg-gray-200">
                              <div style={{ width: `${criticalPct}%` }} className="h-full bg-rose-200/80" title="Critical Stockout Zone" />
                              <div style={{ width: `${reorderPct - criticalPct}%` }} className="h-full bg-amber-200/80" title="Reorder Warning Zone" />
                              <div style={{ width: `${100 - reorderPct}%` }} className="h-full bg-emerald-200/80" title="Healthy Buffer Zone" />

                              <div
                                className="absolute top-0 bottom-0 w-2.5 bg-gray-900 rounded-xs shadow-md border border-white"
                                style={{ left: `calc(${currentPct}% - 5px)` }}
                                title={`Current Stock: ${item.currentStock} ${item.stockUom}`}
                              />
                            </div>

                            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                              <span>0</span>
                              <span className="text-rose-700 font-bold">Min: {item.criticalMin} {item.stockUom}</span>
                              <span className="text-amber-700 font-bold">Reorder: {item.reorderPoint} {item.stockUom}</span>
                              <span className="text-emerald-700 font-bold">Target Max: {item.optimalMax} {item.stockUom}</span>
                              <span className="font-bold text-gray-900">Current: {item.currentStock} {item.stockUom}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  EQUIPMENT REQUESTS & CHECKOUT HUB (FOR SUPERVISOR & LOGISTICS)
                  ========================================================================= */}
              {(activeWorkspace === 'supervisor' || activeWorkspace === 'operations') && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-indigo-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Equipment Checkout & Authorization Requests</h3>
                        <p className="text-[11px] text-gray-500">Employee applications to checkout high-value lab gear</p>
                      </div>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                      {assetRequests.length} Applications Logged
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {assetRequests.map((req: any) => (
                      <div key={req.name} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-blue-700">{req.name}</span>
                            <span className="font-bold text-gray-900">{req.asset_name}</span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              req.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'Pending Approval'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600">
                            Requested by: <strong>{req.requested_by_name}</strong> • Purpose: <em>{req.purpose}</em> ({req.start_date} to {req.return_date})
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {req.status === 'Pending Approval' && (
                            <>
                              <button
                                onClick={() => handleApproveAssetRequest(req.name)}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700"
                              >
                                Approve Checkout
                              </button>
                              <button
                                onClick={() => handleRejectAssetRequest(req.name)}
                                className="px-2.5 py-1 bg-white border border-rose-300 text-rose-700 rounded text-[11px] font-bold hover:bg-rose-50"
                              >
                                Prohibit / Reject
                              </button>
                            </>
                          )}
                          {req.status === 'Approved' && (
                            <button
                              onClick={() => handleReturnAsset(req.asset)}
                              className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 rounded text-[11px] font-bold hover:bg-gray-100"
                            >
                              Check-In / Return to Store
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  EMPLOYEE SCREEN ("MY WORKSPACE"):
                  1. ATTENDANCE CALENDAR (October 2026 with Green/Red blocks)
                  2. DELIVERABLES WITH COMPONENT CHECKBOXES & BLOCKER NOTE INPUT
                  3. EQUIPMENT SECTION (WITH APPLY FOR EQUIPMENT BUTTON & LIVE AVAILABILITY CHECK)
                  ========================================================================= */}
              {activeWorkspace === 'my_space' && attendanceCalendar && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="w-4 h-4 text-emerald-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          My Attendance Calendar — {attendanceCalendar.month}
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Presence tracking (Green = Present, Red = Absent, Amber = Leave)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>{attendanceCalendar.presentCount} Days Present</span>
                      </span>

                      <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                        <span>{attendanceCalendar.absentCount} Absent</span>
                      </span>

                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg flex items-center space-x-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                        <span>{attendanceCalendar.leaveCount} Approved Leave</span>
                      </span>
                    </div>
                  </div>

                  {/* Calendar 7-Day Grid */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider py-1 border-b border-gray-100">
                      <div>Thu</div>
                      <div>Fri</div>
                      <div>Sat</div>
                      <div>Sun</div>
                      <div>Mon</div>
                      <div>Tue</div>
                      <div>Wed</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {attendanceCalendar.days.map((d: any) => {
                        const isSelected = selectedCalendarDay?.day === d.day;
                        let blockStyle = 'bg-gray-50 text-gray-400 border-gray-200';

                        if (d.status === 'Present') {
                          blockStyle = 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100';
                        } else if (d.status === 'Absent') {
                          blockStyle = 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100';
                        } else if (d.status === 'Leave') {
                          blockStyle = 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';
                        } else if (d.status === 'Weekend') {
                          blockStyle = 'bg-gray-100/60 text-gray-400 border-gray-200';
                        }

                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => setSelectedCalendarDay(d)}
                            className={`p-2 rounded-lg border text-left transition relative flex flex-col justify-between h-16 ${blockStyle} ${
                              isSelected ? 'ring-2 ring-blue-500 font-bold' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold">{d.day}</span>
                              {d.status === 'Present' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                              {d.status === 'Absent' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                              {d.status === 'Leave' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                            </div>

                            <div className="text-[10px] leading-tight font-mono">
                              {d.status === 'Present' ? (
                                <span className="text-emerald-700 font-semibold">{d.checkIn || '08:48 AM'}</span>
                              ) : d.status === 'Absent' ? (
                                <span className="text-rose-700 font-semibold">Absent</span>
                              ) : d.status === 'Leave' ? (
                                <span className="text-amber-700 font-semibold">Leave</span>
                              ) : (
                                <span className="text-gray-400">{d.dayName}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Day Punch Detail Box */}
                  {selectedCalendarDay && (
                    <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            selectedCalendarDay.status === 'Present'
                              ? 'bg-emerald-500'
                              : selectedCalendarDay.status === 'Absent'
                              ? 'bg-rose-500'
                              : selectedCalendarDay.status === 'Leave'
                              ? 'bg-amber-500'
                              : 'bg-gray-400'
                          }`}
                        />
                        <div>
                          <span className="font-bold text-gray-900">
                            {selectedCalendarDay.date} ({selectedCalendarDay.dayName})
                          </span>
                          <span className="text-gray-500 ml-2">
                            Status: <strong className="text-gray-800">{selectedCalendarDay.status}</strong>
                          </span>
                          {selectedCalendarDay.note && (
                            <span className="text-rose-600 block text-[11px] font-medium">
                              {selectedCalendarDay.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-gray-600 font-mono text-[11px]">
                        <span>Check In: <strong className="text-gray-900">{selectedCalendarDay.checkIn || 'N/A'}</strong></span>
                        <span>Check Out: <strong className="text-gray-900">{selectedCalendarDay.checkOut || 'N/A'}</strong></span>
                        <span>Hours: <strong className="text-emerald-700">{selectedCalendarDay.hours || 0} hrs</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  EMPLOYEE ASSIGNED DELIVERABLES & COMPONENT CHECKLISTS
                  ========================================================================= */}
              {activeWorkspace === 'my_space' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <ListTodo className="w-4 h-4 text-blue-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">
                          My Assigned Deliverables & Phase Components
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Click each deliverable checkbox to mark progress; record notes if blocked
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                      {tasksList.length} Tasks Assigned
                    </span>
                  </div>

                  <div className="space-y-4">
                    {tasksList.map((task: any) => {
                      const completedCount = task.completedComponents || 0;
                      const totalCount = task.totalComponents || task.components?.length || 4;
                      const progressPct = task.progress || Math.round((completedCount / totalCount) * 100);

                      return (
                        <div key={task.name} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 pb-2 border-b border-gray-200">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-blue-700">{task.name}</span>
                                <span className="font-bold text-gray-900 text-sm">{task.task_subject}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  task.priority === 'Urgent'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <span className="text-gray-500 text-[11px] font-mono">
                                Project: <strong>{task.project_name}</strong> • Due: <strong>{task.due_date}</strong>
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 text-xs font-mono">
                              <span className="font-bold text-gray-700">
                                {completedCount} / {totalCount} Components Done
                              </span>
                              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold">
                                {progressPct}%
                              </span>
                            </div>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* Deliverables Checklist */}
                          <div className="space-y-2 pt-1">
                            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider block">
                              Task Deliverables / Component Checklist:
                            </span>

                            {task.components?.map((comp: any) => (
                              <div
                                key={comp.name}
                                className={`p-2.5 rounded-lg border transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                  comp.is_completed === 1
                                    ? 'bg-emerald-50/70 border-emerald-200 text-gray-800'
                                    : 'bg-white border-gray-200 hover:border-blue-400'
                                }`}
                              >
                                <div className="flex items-start space-x-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleComponent(comp.name)}
                                    className="mt-0.5 text-blue-600 hover:text-blue-800 flex-shrink-0"
                                  >
                                    {comp.is_completed === 1 ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                    )}
                                  </button>

                                  <div>
                                    <span className={`block font-medium ${
                                      comp.is_completed === 1 ? 'line-through text-gray-500' : 'text-gray-900'
                                    }`}>
                                      {comp.component_title}
                                    </span>

                                    {comp.notes && (
                                      <span className="inline-flex items-center space-x-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 mt-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        <span><strong>Lab Note:</strong> {comp.notes}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  {comp.is_completed === 1 ? (
                                    <span className="text-[10px] text-emerald-700 font-mono font-semibold">
                                      Completed {comp.completed_at?.substring(11, 16) || ''}
                                    </span>
                                  ) : (
                                    <>
                                      {activeNoteInput === comp.name ? (
                                        <div className="flex items-center space-x-1">
                                          <input
                                            type="text"
                                            placeholder="Enter blocker / status note..."
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            className="px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none w-48"
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => handleSaveComponentNote(comp.name)}
                                            className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-semibold hover:bg-blue-700"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => { setActiveNoteInput(null); setNoteText(''); }}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveNoteInput(comp.name);
                                            setNoteText(comp.notes || '');
                                          }}
                                          className="px-2 py-1 border border-gray-200 rounded text-[11px] text-gray-600 hover:bg-gray-100 flex items-center space-x-1"
                                        >
                                          <MessageSquare className="w-3 h-3 text-gray-400" />
                                          <span>{comp.notes ? 'Edit Note' : 'Add Note / Blocker'}</span>
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* =========================================================================
                  EMPLOYEE EQUIPMENT SECTION & REALISTIC CHECKOUT APPLICATION
                  Filters out unavailable tools upfront & blocks application with alert
                  ========================================================================= */}
              {activeWorkspace === 'my_space' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-indigo-600" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">My Bench Equipment & Tool Authorization</h3>
                        <p className="text-[11px] text-gray-500">Apply for high-precision lab tools with real-time availability check</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowModal('apply_asset');
                        setSelectedAssetForRequest(null);
                        setModalFormData({
                          start_date: '2026-10-23',
                          return_date: '2026-10-30',
                          purpose: ''
                        });
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 flex items-center space-x-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Apply for Equipment</span>
                    </button>
                  </div>

                  {/* Currently Assigned Gear */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                      Equipment Currently Checked Out in Your Custody:
                    </span>

                    {allAssets
                      .filter((a: any) => a.custodian_name?.toLowerCase().includes(currentUser.fullName.toLowerCase()))
                      .map((asset: any) => (
                        <div key={asset.name} className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-blue-700">{asset.name}</span>
                              <span className="font-bold text-gray-900">{asset.asset_name}</span>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                In Custody
                              </span>
                            </div>
                            <span className="text-gray-500 text-[11px] font-mono">
                              SN: {asset.serial_no} • Bench Location: <strong>{asset.location}</strong>
                            </span>
                          </div>

                          <button
                            onClick={() => handleReturnAsset(asset.name)}
                            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-[11px] font-bold hover:bg-gray-100"
                          >
                            Return to Store
                          </button>
                        </div>
                      ))}

                    {/* Pending Requests by this employee */}
                    {assetRequests.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                          Your Active Equipment Applications:
                        </span>
                        {assetRequests.map((req: any) => (
                          <div key={req.name} className="p-2.5 bg-gray-50/70 border border-gray-200 rounded text-xs flex justify-between items-center mb-1.5">
                            <div>
                              <span className="font-bold text-gray-900">{req.asset_name}</span>
                              <span className="text-[11px] text-gray-500 block">Purpose: {req.purpose}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              req.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'Pending Approval'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Action Shortcuts */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Common Everyday Actions</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <button
                    onClick={() => {
                      setShowModal('tab_attendance');
                      setModalFormData({});
                    }}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-500 text-left transition"
                  >
                    <Clock className="w-4 h-4 text-emerald-600 mb-1" />
                    <span className="font-bold text-gray-900 block">Record Attendance</span>
                    <span className="text-[11px] text-gray-500">Log entry or exit</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowModal('tab_asset');
                      setModalFormData({});
                    }}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-500 text-left transition"
                  >
                    <Wrench className="w-4 h-4 text-indigo-600 mb-1" />
                    <span className="font-bold text-gray-900 block">New Equipment</span>
                    <span className="text-[11px] text-gray-500">Register bench asset</span>
                  </button>

                  {(currentUser.role === 'CEO' || currentUser.role === 'Logistics Admin') && (
                    <button
                      onClick={() => {
                        setShowModal('tab_kitchen_expense');
                        setModalFormData({});
                      }}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-500 text-left transition"
                    >
                      <Coffee className="w-4 h-4 text-amber-600 mb-1" />
                      <span className="font-bold text-gray-900 block">Log Kitchen Receipt</span>
                      <span className="text-[11px] text-gray-500">Tea, milk, refreshments</span>
                    </button>
                  )}

                  {(currentUser.role === 'CEO' || currentUser.role === 'Logistics Admin') && (
                    <button
                      onClick={() => {
                        setShowModal('tab_utility_bill');
                        setModalFormData({});
                      }}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-500 text-left transition"
                    >
                      <Zap className="w-4 h-4 text-orange-600 mb-1" />
                      <span className="font-bold text-gray-900 block">Log Utility Bill</span>
                      <span className="text-[11px] text-gray-500">IESCO, SNGPL, Internet</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODALS SECTION (TASK CREATION WITH PHASES, EQUIPMENT APPLICATION,
          COMPONENT STOCK, UTILITY BILL UPDATE, EMPLOYEE CREATION)
          ========================================================================= */}

      {/* 1. APPLY FOR EQUIPMENT MODAL (WITH LIVE AVAILABILITY CHECK & WARNING) */}
      {showModal === 'apply_asset' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">
                Equipment Checkout Application
              </h3>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Select Equipment</label>
                <select
                  value={modalFormData.asset || ''}
                  onChange={(e) => {
                    const chosen = allAssets.find((a: any) => a.name === e.target.value);
                    setSelectedAssetForRequest(chosen || null);
                    setModalFormData({
                      ...modalFormData,
                      asset: e.target.value,
                      asset_name: chosen?.asset_name || '',
                      requested_by: currentUser.username,
                      requested_by_name: currentUser.fullName
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Equipment from Lab Inventory --</option>
                  {allAssets.map((asset: any) => (
                    <option key={asset.name} value={asset.name}>
                      {asset.name}: {asset.asset_name} ({asset.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* LIVE AVAILABILITY CHECK & WARNING */}
              {selectedAssetForRequest && (
                <div
                  className={`p-3 rounded-lg border flex items-start space-x-2.5 ${
                    selectedAssetForRequest.status === 'Available'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {selectedAssetForRequest.status === 'Available' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {selectedAssetForRequest.status === 'Available'
                        ? 'Equipment is Available in Lab Store'
                        : `Equipment Not Available (${selectedAssetForRequest.status})`}
                    </span>
                    <span className="text-[11px] block mt-0.5">
                      {selectedAssetForRequest.status === 'Available'
                        ? `Stored at ${selectedAssetForRequest.location}. Calibration certified until ${selectedAssetForRequest.calibration_due_date}.`
                        : `Currently in custody of ${selectedAssetForRequest.custodian_name || 'an active bench technician'}. Cannot be checked out at this time.`}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Technical Purpose / Project Work</label>
                <input
                  type="text"
                  placeholder="e.g. S-Band Filter S-Parameter Measurement for Project Sentinel"
                  value={modalFormData.purpose || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Required From Date</label>
                  <input
                    type="date"
                    value={modalFormData.start_date || '2026-10-23'}
                    onChange={(e) => setModalFormData({ ...modalFormData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Expected Return Date</label>
                  <input
                    type="date"
                    value={modalFormData.return_date || '2026-10-30'}
                    onChange={(e) => setModalFormData({ ...modalFormData, return_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedAssetForRequest || selectedAssetForRequest.status !== 'Available'}
                onClick={() => handleCreateDoc('tab_asset_request')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedAssetForRequest && selectedAssetForRequest.status === 'Available'
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Submit Application to Supervisor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUPERVISOR TASK CREATION (WITH DEFAULT 4 PHASES & EQUIPMENT ASSIGNMENT) */}
      {showModal === 'tab_task' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">
                Create New Engineering Task & Specify WBS Phases
              </h3>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Task Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Avionics High-Speed SPI Flash Controller Verification"
                  value={modalFormData.task_subject || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, task_subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Project</label>
                  <select
                    value={modalFormData.project || 'PRJ-2026-0001'}
                    onChange={(e) => {
                      const pName =
                        e.target.value === 'PRJ-2026-0001'
                          ? 'Radar DSP High-Speed Digital Processing Core'
                          : e.target.value === 'PRJ-2026-0002'
                          ? 'Telemetry ECU & Avionics Interface Unit'
                          : 'Facility & Lab Maintenance';
                      setModalFormData({
                        ...modalFormData,
                        project: e.target.value,
                        project_name: pName
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PRJ-2026-0001">PRJ-2026-0001 (Radar DSP)</option>
                    <option value="PRJ-2026-0002">PRJ-2026-0002 (Telemetry ECU)</option>
                    <option value="PRJ-FAC-01">Facility & Lab Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Assign Lead Engineer</label>
                  <select
                    value={modalFormData.assigned_to || 'HR-EMP-0004'}
                    onChange={(e) => {
                      const emp = allEmployees.find((emp: any) => emp.name === e.target.value);
                      setModalFormData({
                        ...modalFormData,
                        assigned_to: e.target.value,
                        assigned_to_name: emp ? emp.employee_name : 'Zainab'
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {allEmployees.map((emp: any) => (
                      <option key={emp.name} value={emp.name}>
                        {emp.employee_name} ({emp.designation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Related Equipment Needed */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Related Bench Equipment</label>
                <select
                  value={modalFormData.equipment_required || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, equipment_required: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Required Bench Instrument --</option>
                  {allAssets.map((asset: any) => (
                    <option key={asset.name} value={`${asset.asset_name} (${asset.name})`}>
                      {asset.name}: {asset.asset_name} ({asset.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={modalFormData.priority || 'High'}
                    onChange={(e) => setModalFormData({ ...modalFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={modalFormData.due_date || '2026-11-10'}
                    onChange={(e) => setModalFormData({ ...modalFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Specification of Phases (Default 4 Phases) */}
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px]">
                    Specify Deliverable Phases (By Default 4 Phases)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = modalFormData.phases || [];
                      setModalFormData({
                        ...modalFormData,
                        phases: [...cur, `Phase ${cur.length + 1}: Technical Validation Milestone`]
                      });
                    }}
                    className="text-blue-600 hover:text-blue-800 text-[11px] font-bold"
                  >
                    + Add Another Phase
                  </button>
                </div>

                <div className="space-y-2">
                  {(modalFormData.phases || [
                    'Phase 1: Architecture & Schematic Review',
                    'Phase 2: High-Speed Layout & DRC',
                    'Phase 3: Cleanroom Assembly',
                    'Phase 4: Environmental Stress Testing'
                  ]).map((phaseText: string, pIdx: number) => (
                    <div key={pIdx} className="flex items-center space-x-2">
                      <span className="font-mono text-gray-400 font-bold w-5">{pIdx + 1}.</span>
                      <input
                        type="text"
                        value={phaseText}
                        onChange={(e) => {
                          const updated = [...(modalFormData.phases || [])];
                          updated[pIdx] = e.target.value;
                          setModalFormData({ ...modalFormData, phases: updated });
                        }}
                        className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateDoc('tab_task')}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                Save Task & Generate WBS Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. LOGISTICS COMPONENT STOCK ADDITION MODAL (`tab_item`) */}
      {showModal === 'tab_item' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">
                Register New Aerospace Component Item
              </h3>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Manufacturer Part Number (MPN)</label>
                  <input
                    type="text"
                    placeholder="e.g. XC7A100T-2CSG324I"
                    value={modalFormData.item_code || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, item_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Component Category</label>
                  <select
                    value={modalFormData.item_group || 'Integrated Circuits (ICs)'}
                    onChange={(e) => setModalFormData({ ...modalFormData, item_group: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Integrated Circuits (ICs)">Integrated Circuits (ICs)</option>
                    <option value="Passive Components">Passive Components</option>
                    <option value="Aerospace Harnessing">Aerospace Harnessing</option>
                    <option value="Mechanical Hardware">Mechanical Hardware</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Item Description / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Xilinx Artix-7 FPGA 101K Logic Cells 324-BGA"
                  value={modalFormData.item_name || ''}
                  onChange={(e) => setModalFormData({ ...modalFormData, item_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={modalFormData.current_stock || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, current_stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    value={modalFormData.reorder_level || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, reorder_level: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Standard Rate (PKR)</label>
                  <input
                    type="number"
                    value={modalFormData.standard_rate_pkr || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, standard_rate_pkr: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Warehouse Bin Location</label>
                  <input
                    type="text"
                    placeholder="e.g. SAFE-RACK-02"
                    value={modalFormData.bin_location || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, bin_location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Supplier Lead Time (Weeks)</label>
                  <input
                    type="number"
                    placeholder="e.g. 12"
                    value={modalFormData.lead_time_weeks || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, lead_time_weeks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateDoc('tab_item')}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                Save Component to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. UTILITY BILL STATUS UPDATE MODAL */}
      {editingBill && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">
                Update Utility Bill — {editingBill.name}
              </h3>
              <button onClick={() => setEditingBill(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Provider & Consumer No</label>
                <div className="p-2.5 bg-gray-50 rounded border border-gray-200 font-mono">
                  {editingBill.utility_type} • {editingBill.consumer_no}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payment Status</label>
                <select
                  value={editingBill.status}
                  onChange={(e) => setEditingBill({ ...editingBill, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-semibold"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid / Due</option>
                  <option value="In Review">In Review</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Bill Amount (PKR)</label>
                <input
                  type="number"
                  value={editingBill.amount_pkr || ''}
                  onChange={(e) => setEditingBill({ ...editingBill, amount_pkr: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date of Payment</label>
                <input
                  type="date"
                  value={editingBill.paid_date || '2026-10-22'}
                  onChange={(e) => setEditingBill({ ...editingBill, paid_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingBill(null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateUtilityBill}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                Save Payment Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CEO EMPLOYEE ADDITION MODAL (`tab_employee`) */}
      {showModal === 'tab_employee' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">
                Add New Defense Engineering Staff Member
              </h3>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Hamza"
                    value={modalFormData.first_name || ''}
                    onChange={(e) =>
                      setModalFormData({
                        ...modalFormData,
                        first_name: e.target.value,
                        employee_name: `${e.target.value} ${modalFormData.last_name || ''}`
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Tariq"
                    value={modalFormData.last_name || ''}
                    onChange={(e) =>
                      setModalFormData({
                        ...modalFormData,
                        last_name: e.target.value,
                        employee_name: `${modalFormData.first_name || ''} ${e.target.value}`
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Email / User Login</label>
                  <input
                    type="email"
                    placeholder="e.g. hamza@haalar.com"
                    value={modalFormData.user_id || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, user_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">CNIC Number</label>
                  <input
                    type="text"
                    placeholder="61101-XXXXXXX-X"
                    value={modalFormData.cnic || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, cnic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    value={modalFormData.department || 'Hardware & RF Engineering'}
                    onChange={(e) => setModalFormData({ ...modalFormData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Hardware & RF Engineering">Hardware & RF Engineering</option>
                    <option value="Embedded Systems & Firmware">Embedded Systems & Firmware</option>
                    <option value="Mechanical Bay & Prototyping">Mechanical Bay & Prototyping</option>
                    <option value="Administration & Logistics">Administration & Logistics</option>
                    <option value="Quality Assurance & Standards">Quality Assurance & Standards</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Designation Title</label>
                  <input
                    type="text"
                    placeholder="e.g. RF Antenna Specialist"
                    value={modalFormData.designation || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 185000"
                    value={modalFormData.salary_pkr || ''}
                    onChange={(e) => setModalFormData({ ...modalFormData, salary_pkr: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    value={modalFormData.date_of_joining || '2026-10-22'}
                    onChange={(e) => setModalFormData({ ...modalFormData, date_of_joining: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateDoc('tab_employee')}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                Add Employee to Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. OTHER STANDARD MODALS: KITCHEN, UTILITY, ASSET, ATTENDANCE */}
      {showModal && !['apply_asset', 'tab_task', 'tab_item', 'tab_employee'].includes(showModal) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900 capitalize">
                New {showModal.replace('tab_', '').replace('_', ' ')}
              </h3>
              <button onClick={() => setShowModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs max-h-[75vh] overflow-y-auto">
              {showModal === 'tab_kitchen_expense' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Item Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Daily Engineering Team Tea, Milk & Sugar"
                      value={modalFormData.description || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Store / Vendor</label>
                    <input
                      type="text"
                      placeholder="e.g. Humak Wholesale Mart"
                      value={modalFormData.vendor_store || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, vendor_store: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Amount (PKR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 4500"
                      value={modalFormData.amount_pkr || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, amount_pkr: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </>
              )}

              {showModal === 'tab_utility_bill' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Utility Type</label>
                    <select
                      value={modalFormData.utility_type || 'Electricity (IESCO)'}
                      onChange={(e) => setModalFormData({ ...modalFormData, utility_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Electricity (IESCO)">Electricity (IESCO)</option>
                      <option value="Sui Gas (SNGPL)">Sui Gas (SNGPL)</option>
                      <option value="Fiber Internet (PTCL Dedicated)">Fiber Internet (PTCL Dedicated)</option>
                      <option value="Generator Diesel">Generator Diesel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Consumer / Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 04-14123-9988771-U"
                      value={modalFormData.consumer_no || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, consumer_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Amount (PKR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 342000"
                      value={modalFormData.amount_pkr || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, amount_pkr: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={modalFormData.due_date || '2026-10-28'}
                      onChange={(e) => setModalFormData({ ...modalFormData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              {showModal === 'tab_asset' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Equipment Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rohde & Schwarz Spectrum Analyzer"
                      value={modalFormData.asset_name || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, asset_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SN-RNS-2026-99"
                      value={modalFormData.serial_no || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, serial_no: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={modalFormData.asset_category || 'RF & Spectrum Test Equipment'}
                      onChange={(e) => setModalFormData({ ...modalFormData, asset_category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Oscilloscopes & Logic Analyzers">Oscilloscopes & Logic Analyzers</option>
                      <option value="RF & Spectrum Test Equipment">RF & Spectrum Test Equipment</option>
                      <option value="SMD Assembly & Soldering">SMD Assembly & Soldering</option>
                      <option value="Machining & CNC Prototyping">Machining & CNC Prototyping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Purchase Price (PKR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 8200000"
                      value={modalFormData.gross_purchase_amount_pkr || ''}
                      onChange={(e) => setModalFormData({ ...modalFormData, gross_purchase_amount_pkr: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </>
              )}

              {showModal === 'tab_attendance' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Employee</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.fullName}
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Status</label>
                    <select
                      value={modalFormData.status || 'Present'}
                      onChange={(e) => setModalFormData({ ...modalFormData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="Present">Present (Full Day)</option>
                      <option value="Half Day">Half Day</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Punch Time</label>
                    <input
                      type="text"
                      value={modalFormData.in_time || '08:48 AM'}
                      onChange={(e) => setModalFormData({ ...modalFormData, in_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowModal(null)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateDoc(showModal)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm"
              >
                Save & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
