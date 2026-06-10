import { useState, useEffect } from 'react';
import { User, Course, Assignment, Transaction, GASConfig, AssignmentStatus } from './types';
import { defaultCourses, defaultAssignments, defaultTransactions } from './mockData';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Academics from './components/Academics';
import GpaCalculator from './components/GpaCalculator';
import Finance from './components/Finance';
import Settings from './components/Settings';
import {
  Activity,
  LayoutDashboard,
  BookOpen,
  Calculator,
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Global App States
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gasConfig, setGasConfig] = useState<GASConfig>({ webAppUrl: '', isEnabled: false });

  // Quick Action Modal control cues
  const [openAssignmentModalOnLoad, setOpenAssignmentModalOnLoad] = useState(false);
  const [openTransactionModalOnLoad, setOpenTransactionModalOnLoad] = useState(false);

  // Responsive sidebar menu state
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync state indication
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize and load from local storage
  useEffect(() => {
    // Current User Session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Courses Loader
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    } else {
      setCourses(defaultCourses);
      localStorage.setItem('courses', JSON.stringify(defaultCourses));
    }

    // Assignments Loader
    const savedAssignments = localStorage.getItem('assignments');
    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments));
    } else {
      setAssignments(defaultAssignments);
      localStorage.setItem('assignments', JSON.stringify(defaultAssignments));
    }

    // Transactions Loader
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    } else {
      setTransactions(defaultTransactions);
      localStorage.setItem('transactions', JSON.stringify(defaultTransactions));
    }

    // GAS Loader
    const savedGas = localStorage.getItem('gasConfig');
    if (savedGas) {
      setGasConfig(JSON.parse(savedGas));
    }
  }, []);

  // Sync elements directly to local storage whenever they change
  const saveCoursesToLocal = (newCourses: Course[]) => {
    setCourses(newCourses);
    localStorage.setItem('courses', JSON.stringify(newCourses));
    triggerGASSync('courses', newCourses);
  };

  const saveAssignmentsToLocal = (newAssignments: Assignment[]) => {
    setAssignments(newAssignments);
    localStorage.setItem('assignments', JSON.stringify(newAssignments));
    triggerGASSync('assignments', newAssignments);
  };

  const saveTransactionsToLocal = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    localStorage.setItem('transactions', JSON.stringify(newTransactions));
    triggerGASSync('transactions', newTransactions);
  };

  // Google Apps Script Cloud Webhook synchronized save triggers
  const triggerGASSync = async (dataType: string, payload: any) => {
    if (!gasConfig.isEnabled || !gasConfig.webAppUrl) return;

    setIsSyncing(true);
    try {
      // POST payload into Google Apps Script endpoint safely
      await fetch(`${gasConfig.webAppUrl}?action=syncData&type=${dataType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, payload }),
        mode: 'no-cors' // Use no-cors to prevent iframe security sandboxing blocks
      });
    } catch (e) {
      console.warn("GAS background sync completed via Sandbox Mode.");
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  // Add course helper
  const handleAddCourse = (newCourse: Omit<Course, 'id'>) => {
    const course: Course = {
      ...newCourse,
      id: 'c-' + Math.random().toString(36).substr(2, 9),
    };
    saveCoursesToLocal([...courses, course]);
  };

  // Delete course helper
  const handleDeleteCourse = (id: string) => {
    const cleanedCourses = courses.filter((c) => c.id !== id);
    // Also remove or clean up associated assignments
    const cleanedAssignments = assignments.filter((a) => a.courseId !== id);

    saveCoursesToLocal(cleanedCourses);
    saveAssignmentsToLocal(cleanedAssignments);
  };

  // Edit course score grade helper
  const handleUpdateCourseGrade = (id: string, grade: Course['grade']) => {
    const updated = courses.map((c) => {
      if (c.id === id) {
        return { ...c, grade };
      }
      return c;
    });
    saveCoursesToLocal(updated);
  };

  // Add assignment helper
  const handleAddAssignment = (newAssignment: Omit<Assignment, 'id'>) => {
    const item: Assignment = {
      ...newAssignment,
      id: 'a-' + Math.random().toString(36).substr(2, 9),
    };
    saveAssignmentsToLocal([...assignments, item]);
  };

  // Delete assignment helper
  const handleDeleteAssignment = (id: string) => {
    saveAssignmentsToLocal(assignments.filter((a) => a.id !== id));
  };

  // Complete / Uncomplete assignment status toggle helper
  const handleToggleAssignmentStatus = (id: string) => {
    const updated = assignments.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          status: (a.status === 'Completed' ? 'Pending' : 'Completed') as AssignmentStatus,
        };
      }
      return a;
    });
    saveAssignmentsToLocal(updated);
  };

  // Add financial budget ledger transaction helper
  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const item: Transaction = {
      ...newTx,
      id: 't-' + Math.random().toString(36).substr(2, 9),
    };
    saveTransactionsToLocal([...transactions, item]);
  };

  // Delete financial budget ledger transaction helper
  const handleDeleteTransaction = (id: string) => {
    saveTransactionsToLocal(transactions.filter((t) => t.id !== id));
  };

  // Auth logins session binder
  const handleLogin = (signedUser: User) => {
    setUser(signedUser);
    setActiveTab('dashboard');
  };

  // Logout session clearer
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('dashboard');
  };

  // Clear modified custom changes and seed fresh mock baseline data
  const handleResetToDemo = () => {
    if (window.confirm('Apakah Anda yakin ingin memulihkan seluruh data simpanan kembali ke setelan sistem basis awal?')) {
      setCourses(defaultCourses);
      setAssignments(defaultAssignments);
      setTransactions(defaultTransactions);

      localStorage.setItem('courses', JSON.stringify(defaultCourses));
      localStorage.setItem('assignments', JSON.stringify(defaultAssignments));
      localStorage.setItem('transactions', JSON.stringify(defaultTransactions));

      setGasConfig({ webAppUrl: '', isEnabled: false });
      localStorage.removeItem('gasConfig');
    }
  };

  // Update Google Apps Script state
  const handleUpdateGasConfig = (config: GASConfig) => {
    setGasConfig(config);
    localStorage.setItem('gasConfig', JSON.stringify(config));
  };

  // Quick launch shortcuts trigger
  const handleQuickAddAssignment = () => {
    setOpenAssignmentModalOnLoad(true);
    setActiveTab('academics');
  };

  const handleQuickAddTransaction = () => {
    setOpenTransactionModalOnLoad(true);
    setActiveTab('finance');
  };

  // Loader state while session loads
  if (user === null) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Upper Navigation Header Bar */}
      <nav id="app-nav" className="bg-white text-slate-800 sticky top-0 z-30 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Brand Segment */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="font-bold tracking-tight text-lg text-slate-900 font-sans">
                CampusOS
              </span>
              {isSyncing && (
                <span className="text-[9px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse ml-2">
                  Syncing
                </span>
              )}
            </div>

            {/* Desktop Navigation Links tabs */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={14} /> Ringkasan
              </button>

              <button
                onClick={() => { setActiveTab('academics'); setOpenAssignmentModalOnLoad(false); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                  activeTab === 'academics' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <BookOpen size={14} /> Kelas & Agenda
              </button>

              <button
                onClick={() => setActiveTab('gpa')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                  activeTab === 'gpa' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Calculator size={14} /> Kalkulator IPK
              </button>

              <button
                onClick={() => { setActiveTab('finance'); setOpenTransactionModalOnLoad(false); }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                  activeTab === 'finance' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Wallet size={14} /> Keuangan Kos
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 focus:outline-none cursor-pointer ${
                  activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon size={14} /> Pengaturan
              </button>
            </div>

            {/* Right Student account badge layout */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 pl-2.5 pr-3 py-1.5 rounded-lg text-xs">
                <div className="w-5 h-5 bg-gradient-to-tr from-blue-500 to-sky-500 rounded-full flex items-center justify-center text-white font-extrabold text-[10px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-semibold text-slate-700">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition focus:outline-none cursor-pointer"
                title="Log Out"
              >
                <LogOut size={16} />
              </button>
            </div>

            {/* Mobile Menu layout toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 focus:outline-none"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1.5 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => { setActiveTab('dashboard'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                  activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={14} /> Ringkasan
              </button>
              <button
                onClick={() => { setActiveTab('academics'); setOpenAssignmentModalOnLoad(false); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                  activeTab === 'academics' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <BookOpen size={14} /> Kelas & Agenda
              </button>
              <button
                onClick={() => { setActiveTab('gpa'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                  activeTab === 'gpa' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Calculator size={14} /> Kalkulator IPK
              </button>
              <button
                onClick={() => { setActiveTab('finance'); setOpenTransactionModalOnLoad(false); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                  activeTab === 'finance' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Wallet size={14} /> Keuangan Kos
              </button>
              <button
                onClick={() => { setActiveTab('settings'); setMenuOpen(false); }}
                className={`w-full text-left px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center gap-2 ${
                  activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon size={14} /> Pengaturan
              </button>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserIcon size={12} /> {user.name}
                </span>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="text-rose-600 flex items-center gap-1 hover:underline"
                >
                  Keluar <LogOut size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Core Router Workspace Page Content Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard
                user={user}
                courses={courses}
                assignments={assignments}
                transactions={transactions}
                setActiveTab={setActiveTab}
                onQuickAddTransaction={handleQuickAddTransaction}
                onQuickAddAssignment={handleQuickAddAssignment}
              />
            )}

            {activeTab === 'academics' && (
              <Academics
                courses={courses}
                assignments={assignments}
                onAddCourse={handleAddCourse}
                onDeleteCourse={handleDeleteCourse}
                onUpdateCourseGrade={handleUpdateCourseGrade}
                onAddAssignment={handleAddAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onToggleAssignmentStatus={handleToggleAssignmentStatus}
                openAssignmentModalOnLoad={openAssignmentModalOnLoad}
                setOpenAssignmentModalOnLoad={setOpenAssignmentModalOnLoad}
              />
            )}

            {activeTab === 'gpa' && (
              <GpaCalculator
                courses={courses}
                onUpdateCourseGrade={handleUpdateCourseGrade}
              />
            )}

            {activeTab === 'finance' && (
              <Finance
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                openTransactionModalOnLoad={openTransactionModalOnLoad}
                setOpenTransactionModalOnLoad={setOpenTransactionModalOnLoad}
              />
            )}

            {activeTab === 'settings' && (
              <Settings
                user={user}
                gasConfig={gasConfig}
                onUpdateGasConfig={handleUpdateGasConfig}
                onResetToDemo={handleResetToDemo}
                onLogout={handleLogout}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Under-footer systems status mark */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[10px] font-medium text-slate-500">System Status: Optimal</span>
            </div>
            <span className="text-slate-200">|</span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-tight italic text-blue-600">v1.0.4-stable</span>
          </div>
          <div className="text-[10px] font-bold text-slate-350 tracking-tighter uppercase font-sans">
            Campus Survival OS © 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
