/**
 * Application Constants
 * LAST UPDATED: Fixed API_BASE_URL reading
 */

// ============================================
// API Configuration - Support multiple sources
// ============================================

// Try multiple sources for API URL
export const API_BASE_URL = (() => {
    // 1. Check window.API_BASE_URL (manual set)
    if (window.API_BASE_URL) {
        console.log('API_URL: from window.API_BASE_URL');
        return window.API_BASE_URL;
    }
    
    // 2. Check import.meta.env (Vite)
    if (import.meta.env && import.meta.env.VITE_API_BASE_URL) {
        console.log('API_URL: from import.meta.env');
        return import.meta.env.VITE_API_BASE_URL;
    }
    
    // 3. Check localStorage (for dynamic updates)
    const stored = localStorage.getItem('campusos_api_url');
    if (stored) {
        console.log('API_URL: from localStorage');
        return stored;
    }
    
    // 4. Fallback - show error but don't crash
    console.error('API_BASE_URL not configured! Set window.API_BASE_URL');
    return '';
})();

// Export helper to set API URL dynamically (for testing)
export function setApiUrl(url) {
    window.API_BASE_URL = url;
    localStorage.setItem('campusos_api_url', url);
    console.log('API_URL set to:', url);
}

// Rest of constants remain the same...
export const CACHE_TTL = {
    DASHBOARD: 2 * 60 * 1000,
    COURSES: 5 * 60 * 1000,
    ASSIGNMENTS: 1 * 60 * 1000,
    GRADES: 15 * 60 * 1000,
    FINANCE: 3 * 60 * 1000,
    NOTES: 5 * 60 * 1000,
    PROFILE: 10 * 60 * 1000
};

export const STORAGE_KEYS = {
    TOKEN: 'campusos_token',
    USER: 'campusos_user',
    CACHE_PREFIX: 'campusos_'
};

export const ROUTES = {
    DASHBOARD: '#/dashboard',
    ACADEMIC: '#/academic',
    GPA: '#/gpa',
    FINANCE: '#/finance',
    ORGANIZATION: '#/organization',
    GOALS: '#/goals',
    NOTES: '#/notes',
    PROFILE: '#/profile',
    LOGIN: '#/login',
    REGISTER: '#/register'
};

export const PUBLIC_ROUTES = [
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    '#/'
];

export const ASSIGNMENT_STATUS = {
    PENDING: 'pending',
    IN_PROGRESS: 'progress',
    DONE: 'done'
};

export const ASSIGNMENT_STATUS_OPTIONS = [
    { value: 'pending', label: 'Not Started', icon: 'fa-circle', color: '#9CA3AF' },
    { value: 'progress', label: 'In Progress', icon: 'fa-spinner', color: '#F59E0B' },
    { value: 'done', label: 'Completed', icon: 'fa-check-circle', color: '#10B981' }
];

export const TRANSACTION_TYPES = {
    INCOME: 'income',
    EXPENSE: 'expense'
};

export const TRANSACTION_TYPE_OPTIONS = [
    { value: 'income', label: 'Income', icon: 'fa-arrow-down', color: '#10B981' },
    { value: 'expense', label: 'Expense', icon: 'fa-arrow-up', color: '#EF4444' }
];

export const FINANCE_CATEGORIES = {
    INCOME: ['Allowance', 'Freelance', 'Part-time Job', 'Scholarship', 'Salary', 'Gift', 'Other'],
    EXPENSE: ['Food', 'Transport', 'Books', 'Stationery', 'Printing', 'Subscription', 'Entertainment', 'Shopping', 'Healthcare', 'Other']
};

export const GRADE_MAP = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'E': 0.0
};

export const GRADE_OPTIONS = [
    { value: 4.0, label: 'A (4.0)' },
    { value: 3.7, label: 'A- (3.7)' },
    { value: 3.3, label: 'B+ (3.3)' },
    { value: 3.0, label: 'B (3.0)' },
    { value: 2.7, label: 'B- (2.7)' },
    { value: 2.3, label: 'C+ (2.3)' },
    { value: 2.0, label: 'C (2.0)' },
    { value: 1.7, label: 'C- (1.7)' },
    { value: 1.0, label: 'D (1.0)' },
    { value: 0.0, label: 'E (0.0)' }
];

export const HABIT_TARGET = {
    DAILY: 'daily',
    WEEKLY: 'weekly'
};

export const HABIT_TARGET_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
];

export const NOTE_CATEGORIES = [
    'Lecture',
    'Assignment',
    'Exam',
    'Personal',
    'Idea',
    'Other'
];

export const FACULTY_OPTIONS = [
    'Faculty of Engineering',
    'Faculty of Economics and Business',
    'Faculty of Computer Science',
    'Faculty of Law',
    'Faculty of Medicine',
    'Faculty of Psychology',
    'Faculty of Education',
    'Faculty of Arts and Humanities',
    'Faculty of Social and Political Sciences',
    'Faculty of Mathematics and Natural Sciences',
    'Faculty of Agriculture',
    'Faculty of Pharmacy',
    'Faculty of Public Health',
    'Other'
];

export const SEMESTER_OPTIONS = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: '3', label: 'Semester 3' },
    { value: '4', label: 'Semester 4' },
    { value: '5', label: 'Semester 5' },
    { value: '6', label: 'Semester 6' },
    { value: '7', label: 'Semester 7' },
    { value: '8', label: 'Semester 8' }
];

export const getBatchYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
        options.push({ value: year, label: year.toString() });
    }
    return options;
};

export const AVATAR_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100]
};

export const DATE_FORMATS = {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_LONG: 'DD MMMM YYYY',
    API: 'YYYY-MM-DD'
};

export const CHART_COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#8B5CF6',
    gray: '#9CA3AF',
    income: '#10B981',
    expense: '#EF4444'
};

export const DEBOUNCE_DELAY = 300;
export const TOAST_DURATION = 3000;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const SUPPORTED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain'
];

export const PASSWORD_REQUIREMENTS = [
    'Minimum 8 characters',
    'At least 1 uppercase letter',
    'At least 1 lowercase letter',
    'At least 1 number'
];

export const VALIDATION = {
    MAX_NAME_LENGTH: 100,
    MIN_NAME_LENGTH: 3,
    MAX_TITLE_LENGTH: 100,
    MIN_TITLE_LENGTH: 3,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_NOTE_CONTENT_LENGTH: 50000,
    MAX_CREDITS: 6,
    MIN_CREDITS: 1,
    MAX_AMOUNT: 100000000,
    MIN_AMOUNT: 0.01,
    MAX_SEMESTER: 14,
    MIN_SEMESTER: 1,
    MIN_BATCH_YEAR: 2000
};
