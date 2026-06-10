import { Course, Assignment, Transaction } from '../types';
import { Award, ClipboardList, Wallet, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Plus, Eye, BookOpen, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  user: { name: string };
  courses: Course[];
  assignments: Assignment[];
  transactions: Transaction[];
  setActiveTab: (tab: string) => void;
  onQuickAddTransaction: () => void;
  onQuickAddAssignment: () => void;
}

export default function Dashboard({
  user,
  courses,
  assignments,
  transactions,
  setActiveTab,
  onQuickAddTransaction,
  onQuickAddAssignment,
}: DashboardProps) {

  // Calculate dynamic GPA
  const calculateGPA = () => {
    let totalGradePoints = 0;
    let totalSksWithGrades = 0;

    courses.forEach((course) => {
      if (course.grade !== '') {
        let points = 0;
        switch (course.grade) {
          case 'A': points = 4; break;
          case 'B': points = 3; break;
          case 'C': points = 2; break;
          case 'D': points = 1; break;
          case 'E': points = 0; break;
        }
        totalGradePoints += points * course.sks;
        totalSksWithGrades += course.sks;
      }
    });

    if (totalSksWithGrades === 0) return 0.00;
    return (totalGradePoints / totalSksWithGrades).toFixed(2);
  };

  const gpaVal = parseFloat(calculateGPA().toString());
  const pendingAssignments = assignments.filter((a) => a.status === 'Pending');
  const urgentAssignments = [...pendingAssignments]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Financial status
  const calculateFinance = () => {
    let income = 0;
    let expense = 0;
    transactions.forEach((t) => {
      if (t.type === 'Income') income += t.amount;
      else expense += t.amount;
    });
    return {
      balance: income - expense,
      income,
      expense
    };
  };

  const { balance, income, expense } = calculateFinance();

  // Helper formatting for Indonesian Rupiah
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get greeting depending on local time
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 11) return 'Selamat Pagi';
    if (hours >= 11 && hours < 15) return 'Selamat Siang';
    if (hours >= 15 && hours < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 text-slate-800 relative overflow-hidden shadow-sm">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-[0.03] bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-blue-600 to-transparent"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-blue-600 font-bold text-[10px] uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100/40">
            Campus Survival OS
          </span>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-900 tracking-tight">
            {getGreeting()}, <span className="font-semibold">{user.name}</span>!
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
            Selamat datang di komando kontrol akademik dan keuangan Anda. Tetap fokus, selesaikan tugas tepat waktu, dan kelola anggaran agar lulus dengan cemerlang!
          </p>
        </div>
      </div>

      {/* Main Core Metrics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* GPA Stats Card */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Indeks Prestasi Kumulatif</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Award size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-light text-slate-900">{gpaVal.toFixed(2)}</span>
              <span className="text-xs text-slate-400 font-semibold font-mono">/ 4.00</span>
            </div>
            {/* GPA feedback label */}
            <div className="mt-3">
              {gpaVal >= 3.5 ? (
                <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold">✓ Cum Laude Ready</span>
              ) : gpaVal >= 3.0 ? (
                <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-[10px] font-bold">✓ Sangat Memuaskan</span>
              ) : gpaVal > 0 ? (
                <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-[10px] font-bold">⚡ Butuh Peningkatan</span>
              ) : (
                <span className="text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full text-[10px] font-bold">Belum Ada Indeks Nilai</span>
              )}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('gpa')}
            className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200/60 rounded-xl text-xs font-semibold tracking-tight transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Play Target IPK
          </button>
        </motion.div>

        {/* Assignments Stats Card */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tugas & Agenda Aktif</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ClipboardList size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-light text-slate-900">{pendingAssignments.length}</span>
              <span className="text-xs text-slate-400 font-semibold">tugas tertunda</span>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
              <Clock size={12} className="text-amber-500" /> Standard Kelulusan Tepat Waktu
            </div>
          </div>
          <button
            onClick={onQuickAddAssignment}
            className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-amber-800 hover:text-amber-900 border border-slate-200/60 rounded-xl text-xs font-semibold tracking-tight transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Tambah Agenda
          </button>
        </motion.div>

        {/* Finance Stats Card */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Survival Wallet</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-light tracking-tight ${balance < 50000 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatRupiah(balance)}
              </span>
            </div>
            <div className="mt-3">
              {balance < 50000 ? (
                <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                  <AlertCircle size={10} /> Mode Hemat Ekstrem
                </span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold">✓ Anggaran Stabil</span>
              )}
            </div>
          </div>
          <button
            onClick={onQuickAddTransaction}
            className="mt-5 w-full py-2 bg-slate-50 hover:bg-slate-100 text-emerald-800 hover:text-emerald-900 border border-slate-200/60 rounded-xl text-xs font-semibold tracking-tight transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={14} /> Catat Pengeluaran
          </button>
        </motion.div>
      </div>

      {/* Two-Column Splitting: Left (Academic & Tasks), Right (Finance & Logs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Academic Urgent tasks */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-slate-800 tracking-tight">Timeline & Agenda Terdekat</h3>
            <button
              onClick={() => setActiveTab('academics')}
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-0.5 focus:outline-none cursor-pointer"
            >
              Lihat Agenda ({assignments.length}) <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {urgentAssignments.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <ClipboardList className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-500">Semua tugasmu sudah tuntas!</p>
                <p className="text-xs text-slate-400 mt-1">Kerja bagus, pertahankan performamu.</p>
              </div>
            ) : (
              urgentAssignments.map((assignment) => {
                const assignedCourse = courses.find((c) => c.id === assignment.courseId);
                const isOverdue = new Date(assignment.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

                return (
                  <div
                    key={assignment.id}
                    className="p-3.5 bg-slate-50/60 border border-slate-100/80 rounded-xl flex items-start gap-3 hover:bg-slate-50/90 transition"
                  >
                    <div className={`p-1.5 rounded-lg text-white mt-0.5 shrink-0 ${
                      assignment.priority === 'High' ? 'bg-rose-500' :
                      assignment.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}>
                      <AlertCircle size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-sm text-slate-800 block truncate">{assignment.title}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          assignment.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                          assignment.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {assignment.priority}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500 font-medium">
                        <span className="text-slate-700">📚 {assignedCourse ? assignedCourse.name : 'Unknown Course'}</span>
                        <span className="text-slate-300">•</span>
                        <span className={`${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                          📅 {isOverdue ? 'Terlewat: ' : 'Tenggat: '} {assignment.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Financial Breakdown & Logs */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-slate-800 tracking-tight">Catat Aktivitas Finansial</h3>
            <button
              onClick={() => setActiveTab('finance')}
              className="text-blue-600 hover:text-blue-700 text-xs font-semibold flex items-center gap-0.5 focus:outline-none cursor-pointer"
            >
              Buku Kas Kos <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <Wallet className="mx-auto text-slate-300 mb-2" size={32} />
                <p className="text-sm font-semibold text-slate-500">Belum ada transaksi</p>
                <p className="text-xs text-slate-400 mt-1">Tekan "Catat Pengeluaran" untuk memulainya.</p>
              </div>
            ) : (
              [...transactions].slice(-4).reverse().map((t) => (
                <div
                  key={t.id}
                  className="p-3 bg-slate-50/40 hover:bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3 transition font-medium"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      t.type === 'Income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {t.type === 'Income' ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}
                    </div>
                    <div className="min-w-0">
                      <span className="block font-semibold text-sm text-slate-800 truncate">{t.description}</span>
                      <span className="block text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                        {t.category} • {t.date}
                      </span>
                    </div>
                  </div>
                  <div className={`font-mono text-xs font-bold text-right shrink-0 ${
                    t.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {t.type === 'Income' ? '+' : '-'} {formatRupiah(t.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tip of the day on campus survival */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
        <span className="text-lg">💡</span>
        <div className="text-xs text-slate-600 leading-relaxed font-sans font-semibold">
          <span className="text-slate-800 font-bold">Tips Kampus Hari Ini:</span> SKS target nilai minimal "B" menjaga IPK Anda tetap di atas 3.00, yang merupakan standar umum untuk beasiswa dan mendaftar lowongan kerja setelah lulus. Selalu sisihkan minimum 10% kiriman bulanan untuk kas darurat!
        </div>
      </div>
    </div>
  );
}
