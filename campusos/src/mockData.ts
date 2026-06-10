import { Course, Assignment, Transaction } from './types';

export const defaultCourses: Course[] = [
  { id: 'c1', code: 'IF-101', name: 'Algoritma & Struktur Data', sks: 4, grade: 'A', semester: 1 },
  { id: 'c2', code: 'IF-102', name: 'Matematika Diskrit', sks: 3, grade: 'B', semester: 1 },
  { id: 'c3', code: 'IF-103', name: 'Dasar Pemrograman', sks: 3, grade: 'A', semester: 1 },
  { id: 'c4', code: 'IF-201', name: 'Arsitektur Komputer', sks: 3, grade: 'C', semester: 2 },
  { id: 'c5', code: 'IF-202', name: 'Basis Data Terdistribusi', sks: 4, grade: '', semester: 2 },
  { id: 'c6', code: 'IF-203', name: 'Pemrograman Web Kontemporer', sks: 3, grade: '', semester: 2 },
];

export const defaultAssignments: Assignment[] = [
  {
    id: 'a1',
    title: 'Implementasi Binary Search Tree',
    courseId: 'c1',
    dueDate: '2026-06-15',
    priority: 'High',
    status: 'Completed',
    description: 'Buat kelas BST lengkap dengan fungsi insert, delete, and balance transversing.'
  },
  {
    id: 'a2',
    title: 'Laporan Tugas Mandiri Graph & Tree',
    courseId: 'c2',
    dueDate: '2026-06-12',
    priority: 'Medium',
    status: 'Pending',
    description: 'Selesaikan 5 soal pembuktian relasi ekuivalen pada graf terarah.'
  },
  {
    id: 'a3',
    title: 'Desain Skema ERD e-Commerce',
    courseId: 'c5',
    dueDate: '2026-06-20',
    priority: 'High',
    status: 'Pending',
    description: 'Buat ERD minimal 12 entitas dengan relasi normalisasi tingkat 3NF.'
  },
  {
    id: 'a4',
    title: 'Aplikasi Portofolio React + Tailwind',
    courseId: 'c6',
    dueDate: '2026-06-25',
    priority: 'High',
    status: 'Pending',
    description: 'Buat portofolio interaktif multi-bahasa menggunakan state management sederhana.'
  },
  {
    id: 'a5',
    title: 'Kuis Logika Boolean',
    courseId: 'c2',
    dueDate: '2026-06-18',
    priority: 'Low',
    status: 'Pending',
    description: 'Kerjakan evaluasi di portal perkuliahan bab Aljabar Boolean.'
  }
];

export const defaultTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'Income',
    amount: 1500000,
    category: 'Saku Bulanan',
    description: 'Transferan uang bulanan dari orang tua',
    date: '2026-06-01'
  },
  {
    id: 't2',
    type: 'Expense',
    amount: 120000,
    category: 'Makanan & Minuman',
    description: 'Makan malam bareng anak-anak kos',
    date: '2026-06-02'
  },
  {
    id: 't3',
    type: 'Expense',
    amount: 35000,
    category: 'Peralatan Kuliah',
    description: 'Fotokopi modul kuliah dan beli binder',
    date: '2026-06-03'
  },
  {
    id: 't4',
    type: 'Expense',
    amount: 450000,
    category: 'Buku & Referensi',
    description: 'Buku teks Algoritma CLRS edisi terbaru',
    date: '2026-06-05'
  },
  {
    id: 't5',
    type: 'Income',
    amount: 250000,
    category: 'Proyek Sampingan',
    description: 'Bantu benerin website UKM kampus',
    date: '2026-06-08'
  },
  {
    id: 't6',
    type: 'Expense',
    amount: 25000,
    category: 'Internet / Pulsa',
    description: 'Paket kuota internet darurat kuota malam',
    date: '2026-06-09'
  }
];
