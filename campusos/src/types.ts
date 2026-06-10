export type Priority = 'Low' | 'Medium' | 'High';
export type AssignmentStatus = 'Pending' | 'Completed';
export type TransactionType = 'Income' | 'Expense';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  sks: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | ''; // Empty string means ongoing/no grade yet
  semester: number;
}

export interface Assignment {
  id: string;
  title: string;
  courseId: string; // References Course.id
  dueDate: string;
  priority: Priority;
  status: AssignmentStatus;
  description?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface GASConfig {
  webAppUrl: string;
  isEnabled: boolean;
}
