import React, { useState } from 'react';
import { Course, Assignment, Priority, AssignmentStatus } from '../types';
import { BookOpen, Calendar, AlertCircle, Plus, Search, Trash2, CheckSquare, Square, Tag, Eye, ChevronDown, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AcademicsProps {
  courses: Course[];
  assignments: Assignment[];
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onDeleteCourse: (id: string) => void;
  onUpdateCourseGrade: (id: string, grade: Course['grade']) => void;
  onAddAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  onDeleteAssignment: (id: string) => void;
  onToggleAssignmentStatus: (id: string) => void;
  openAssignmentModalOnLoad: boolean;
  setOpenAssignmentModalOnLoad: (open: boolean) => void;
}

export default function Academics({
  courses,
  assignments,
  onAddCourse,
  onDeleteCourse,
  onUpdateCourseGrade,
  onAddAssignment,
  onDeleteAssignment,
  onToggleAssignmentStatus,
  openAssignmentModalOnLoad,
  setOpenAssignmentModalOnLoad,
}: AcademicsProps) {
  const [subTab, setSubTab] = useState<'assignments' | 'courses'>('assignments');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals visibility
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [addAssignmentOpen, setAddAssignmentOpen] = useState(openAssignmentModalOnLoad);

  // New Course inputs
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSks, setNewSks] = useState(3);
  const [newSemester, setNewSemester] = useState(2);
  const [newGrade, setNewGrade] = useState<'A' | 'B' | 'C' | 'D' | 'E' | ''>('');

  // New Assignment inputs
  const [newTitle, setNewTitle] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('Medium');
  const [newDesc, setNewDesc] = useState('');

  // Filtering Assignments
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');

  // GPA mapping
  const letterPoints = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'E': 0, '': 0 };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) return;
    onAddCourse({
      code: newCode.toUpperCase(),
      name: newName,
      sks: Number(newSks),
      semester: Number(newSemester),
      grade: newGrade,
    });
    // Reset
    setNewCode('');
    setNewName('');
    setNewSks(3);
    setNewSemester(2);
    setNewGrade('');
    setAddCourseOpen(false);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedCourseId || !newDueDate) return;
    onAddAssignment({
      title: newTitle,
      courseId: selectedCourseId,
      dueDate: newDueDate,
      priority: newPriority,
      status: 'Pending',
      description: newDesc,
    });
    // Reset
    setNewTitle('');
    setSelectedCourseId('');
    setNewDueDate('');
    setNewPriority('Medium');
    setNewDesc('');
    setAddAssignmentOpen(false);
    setOpenAssignmentModalOnLoad(false);
  };

  // Pre-load default course selection if only 1 exists
  const handleOpenAssignmentModal = () => {
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
    setAddAssignmentOpen(true);
  };

  // Filtered lists
  const filteredAssignments = assignments.filter((item) => {
    const matchedSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchedStatus = statusFilter === 'All' ? true : item.status === statusFilter;
    const matchedPriority = priorityFilter === 'All' ? true : item.priority === priorityFilter;
    return matchedSearch && matchedStatus && matchedPriority;
  });

  const filteredCourses = courses.filter((item) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and top tab selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex bg-slate-50 p-1 rounded-lg w-fit self-start border border-slate-200/40">
          <button
            onClick={() => { setSubTab('assignments'); setSearchQuery(''); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'assignments' ? 'bg-white text-blue-600 shadow-xs border border-slate-200/20' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList size={14} /> Agenda Tugas ({assignments.filter((a) => a.status === 'Pending').length})
          </button>
          <button
            onClick={() => { setSubTab('courses'); setSearchQuery(''); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              subTab === 'courses' ? 'bg-white text-blue-600 shadow-xs border border-slate-200/20' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={14} /> Daftar Kuliah ({courses.length})
          </button>
        </div>

        {/* Buttons to trigger creation modals */}
        <div className="flex items-center gap-2">
          {subTab === 'assignments' ? (
            <button
              onClick={handleOpenAssignmentModal}
              disabled={courses.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Plus size={15} /> Tugas Baru
            </button>
          ) : (
            <button
              onClick={() => setAddCourseOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} /> Tambah Kuliah
            </button>
          )}
        </div>
      </div>

      {courses.length === 0 && subTab === 'assignments' && (
        <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-xl text-xs font-medium flex items-start gap-2">
          <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Pemberitahuan:</span> Anda belum menambahkan kelas/mata kuliah. Daftarkan kelas Anda terlebih dulu sebelum mencatat tugas kuliah.
          </div>
        </div>
      )}

      {/* Main Academics Subsections */}
      {subTab === 'assignments' ? (
        // ASSIGNMENTS MANAGER
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search inputs and Filters */}
            <div className="relative col-span-1 sm:col-span-1 font-medium text-slate-700">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari tugas..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs font-semibold placeholder-slate-450"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">Status:</span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="All">Semua Tugas</option>
                <option value="Pending">Sedang Berjalan</option>
                <option value="Completed">Selesai</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">Prioritas:</span>
              <select
                value={priorityFilter}
                onChange={(e: any) => setPriorityFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="All">Semua Prioritas</option>
                <option value="High">Tinggi (High)</option>
                <option value="Medium">Sedang (Medium)</option>
                <option value="Low">Rendah (Low)</option>
              </select>
            </div>
          </div>

          {/* Assignments list representation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <BookOpen className="mx-auto text-slate-300 mb-3" size={40} />
                <h4 className="font-bold text-slate-700 text-sm">Tidak ada tugas ditemukan</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Sengaja menyaring atau belum mencatat pekerjaan kuliah? Tekan "Tugas Baru" untuk menambahkannya.</p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const assignedCourse = courses.find((c) => c.id === assignment.courseId);
                const isOverdue = new Date(assignment.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) && assignment.status === 'Pending';

                return (
                  <motion.div
                    key={assignment.id}
                    layoutId={`ass-${assignment.id}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-4 bg-white rounded-xl border ${
                      assignment.status === 'Completed' ? 'border-slate-100/80 opacity-75' : 'border-slate-200/60 shadow-sm'
                    } relative flex flex-col justify-between font-medium`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2.5">
                        <button
                          onClick={() => onToggleAssignmentStatus(assignment.id)}
                          className="text-slate-400 hover:text-blue-600 transition shrink-0 mt-0.5 focus:outline-none cursor-pointer"
                        >
                          {assignment.status === 'Completed' ? (
                            <CheckSquare className="text-blue-600 shrink-0" size={18} />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                        <div className="min-w-0 flex-grow">
                          <h4 className={`font-semibold text-sm text-slate-800 leading-snug ${
                            assignment.status === 'Completed' ? 'line-through text-slate-400' : ''
                          }`}>
                            {assignment.title}
                          </h4>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-1">
                            <BookOpen size={12} className="text-slate-400" />
                            {assignedCourse ? `${assignedCourse.code} - ${assignedCourse.name}` : 'Mata Kuliah Tidak Diketahui'}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 select-none ${
                          assignment.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100/40' :
                          assignment.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100/40' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/40'
                        }`}>
                          {assignment.priority}
                        </span>
                      </div>

                      {assignment.description && (
                        <p className="mt-3 text-xs text-slate-500 leading-relaxed bg-slate-50/75 p-2.5 rounded-lg border border-slate-100">
                          {assignment.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold font-mono">
                        <Calendar size={13} className="text-slate-400" />
                        <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                          {isOverdue ? 'Terlambat: ' : ''} {assignment.dueDate}
                        </span>
                      </div>
                      <button
                        onClick={() => onDeleteAssignment(assignment.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition hover:bg-rose-50 focus:outline-none cursor-pointer"
                        title="Hapus Tugas"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        // COURSES MANAGER
        <div className="space-y-4">
          <div className="relative max-w-sm font-medium text-slate-700 font-sans">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mata kuliah..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs font-semibold placeholder-slate-450"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-xs">
                <BookOpen className="mx-auto text-slate-300 mb-3" size={40} />
                <h4 className="font-bold text-slate-700 text-sm">Tidak ada mata kuliah ditemukan</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Silakan tambahkan jadwal kelas Semester Anda menggunakan tombol "Tambah Kuliah".</p>
              </div>
            ) : (
              filteredCourses.map((course) => {
                const courseAssignments = assignments.filter((a) => a.courseId === course.id);
                const pendingCount = courseAssignments.filter((a) => a.status === 'Pending').length;

                return (
                  <div
                    key={course.id}
                    className="p-5 bg-white border border-slate-200/65 rounded-xl shadow-xs relative flex flex-col justify-between hover:border-slate-350 transition font-medium text-slate-700"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5 mb-2">
                        <span className="font-bold text-[10px] bg-slate-50 text-slate-500 border border-slate-200/60 px-2.5 py-0.5 rounded font-mono">
                          {course.code}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <button
                            onClick={() => onDeleteCourse(course.id)}
                            className="hover:text-rose-600 transition p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Hapus Kuliah"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 min-h-[40px] leading-tight">
                        {course.name}
                      </h4>

                      <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-semibold text-slate-550 border-t border-slate-100 pt-3">
                        <div>
                          <span className="block text-slate-400 text-[9px] uppercase tracking-wider">BOBOT KREDIT</span>
                          <span className="text-slate-800 font-bold">{course.sks} SKS</span>
                        </div>
                        <div>
                          <span className="block text-slate-400 text-[9px] uppercase tracking-wider">SEMESTER</span>
                          <span className="text-slate-800 font-bold">Semester {course.semester}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider select-none">NILAI SELESAI</span>
                        <select
                          value={course.grade}
                          onChange={(e: any) => onUpdateCourseGrade(course.id, e.target.value)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-250 text-slate-800 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                        >
                          <option value="">Berlangsung</option>
                          <option value="A">A (4.0)</option>
                          <option value="B">B (3.0)</option>
                          <option value="C">C (2.0)</option>
                          <option value="D">D (1.0)</option>
                          <option value="E">E (0.0)</option>
                        </select>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500 bg-slate-50/70 p-2 border border-slate-100 rounded-lg">
                        <span>Tugas Kuliah:</span>
                        <span className={`font-bold ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {pendingCount} Pending
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* Modal View for Adding Courses */}
      <AnimatePresence>
        {addCourseOpen && (
          <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200/80 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-base">Tambah Mata Kuliah</h3>
                <button 
                  onClick={() => setAddCourseOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 focus:outline-none cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Kode Matkul</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Contoh: IF-202"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Nama Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Dasar Algoritma & Struktur Data"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Bobot SKS</label>
                    <select
                      value={newSks}
                      onChange={(e) => setNewSks(Number(e.target.value))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="1">1 SKS</option>
                      <option value="2">2 SKS</option>
                      <option value="3">3 SKS</option>
                      <option value="4">4 SKS</option>
                      <option value="5">5 SKS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Semester</label>
                    <select
                      value={newSemester}
                      onChange={(e) => setNewSemester(Number(e.target.value))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Nilai (Jika Sudah Selesai)</label>
                  <select
                    value={newGrade}
                    onChange={(e: any) => setNewGrade(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Masih Berlangsung (Ongoing)</option>
                    <option value="A">A (Istimewa)</option>
                    <option value="B">B (Baik)</option>
                    <option value="C">C (Cukup)</option>
                    <option value="D">D (Kurang)</option>
                    <option value="E">E (Gagal/Mengulang)</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddCourseOpen(false)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition focus:outline-none border border-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition focus:outline-none cursor-pointer"
                  >
                    Simpan Kuliah
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal View for Adding Assignments */}
      <AnimatePresence>
        {addAssignmentOpen && (
          <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]">
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-xl shadow-xl border border-slate-200/80 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-base">Tambah Agenda Tugas Baru</h3>
                <button 
                  onClick={() => { setAddAssignmentOpen(false); setOpenAssignmentModalOnLoad(false); }} 
                  className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 focus:outline-none cursor-pointer"
                >
                  X
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Judul Tugas / Praktikum</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Laporan Mingguan Basis Data"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Diasosiasikan Dengan Kelas</label>
                  <select
                    required
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Tanggal Tenggat</label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Tingkat Prioritas</label>
                    <select
                      value={newPriority}
                      onChange={(e: any) => setNewPriority(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                      <option value="Low">Low (Rendah)</option>
                      <option value="Medium">Medium (Sedang)</option>
                      <option value="High">High (Mendesak)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Deskripsi / Detail Tugas</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Contoh: Mengumpulkan diagram relasi entitas, query normalisasi, dan link GitHub..."
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs font-semibold placeholder:text-slate-450 focus:outline-none focus:border-blue-500 min-h-[85px] max-h-[160px]"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => { setAddAssignmentOpen(false); setOpenAssignmentModalOnLoad(false); }}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold transition focus:outline-none border border-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition focus:outline-none cursor-pointer"
                  >
                    Simpan Agenda
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
