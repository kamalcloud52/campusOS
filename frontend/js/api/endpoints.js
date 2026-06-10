/**
 * API Endpoints Definition
 * Maps all API actions to their respective functions
 * Implements PRD Section 2.2 routing requirements
 * LAST UPDATED: Phase 9 - Complete with all endpoints
 */

import { apiGet, apiPost } from './client.js';

// ============================================
// Authentication Endpoints
// ============================================

export const authAPI = {
    /**
     * User login
     * @param {string} email - User email
     * @param {string} password - User password
     */
    login: (email, password) => apiPost('login', { email, password }),
    
    /**
     * User registration
     * @param {object} userData - User registration data
     */
    register: (userData) => apiPost('register', userData),
    
    /**
     * Logout (optional server-side token invalidation)
     */
    logout: () => apiPost('logout', {})
};

// ============================================
// Dashboard Endpoints
// ============================================

export const dashboardAPI = {
    /**
     * Get aggregated dashboard data
     * Fetches from 5 sources: assignments, habits, finance, GPA, courses
     */
    getDashboard: () => apiGet('getDashboard')
};

// ============================================
// Courses Endpoints
// ============================================

export const coursesAPI = {
    /**
     * Get all courses for current user
     */
    getAll: () => apiGet('getCourses'),
    
    /**
     * Add a new course
     * @param {object} courseData - Course data (course_name, credits, lecturer, semester)
     */
    add: (courseData) => apiPost('addCourse', courseData),
    
    /**
     * Update existing course
     * @param {string} courseId - Course ID
     * @param {object} updates - Updated course data
     */
    update: (courseId, updates) => apiPost('updateCourse', { course_id: courseId, ...updates }),
    
    /**
     * Delete a course
     * @param {string} courseId - Course ID
     */
    delete: (courseId) => apiPost('deleteCourse', { course_id: courseId })
};

// ============================================
// Assignments Endpoints
// ============================================

export const assignmentsAPI = {
    /**
     * Get all assignments for current user
     */
    getAll: () => apiGet('getAssignments'),
    
    /**
     * Add a new assignment
     * @param {object} assignmentData - Assignment data
     */
    add: (assignmentData) => apiPost('addAssignment', assignmentData),
    
    /**
     * Update full assignment
     * @param {string} assignmentId - Assignment ID
     * @param {object} updates - Updated assignment data
     */
    update: (assignmentId, updates) => apiPost('updateAssignment', { assignment_id: assignmentId, ...updates }),
    
    /**
     * Update assignment status (for drag & drop kanban)
     * @param {string} assignmentId - Assignment ID
     * @param {string} status - New status (pending/progress/done)
     */
    updateStatus: (assignmentId, status) => apiPost('updateAssignmentStatus', { assignment_id: assignmentId, status }),
    
    /**
     * Delete an assignment
     * @param {string} assignmentId - Assignment ID
     */
    delete: (assignmentId) => apiPost('deleteAssignment', { assignment_id: assignmentId })
};

// ============================================
// Grades Endpoints
// ============================================

export const gradesAPI = {
    /**
     * Get all grades for current user
     */
    getAll: () => apiGet('getGrades'),
    
    /**
     * Add or update a grade
     * @param {object} gradeData - Grade data (course_id, semester, grade, credits)
     */
    add: (gradeData) => apiPost('addGrade', gradeData),
    
    /**
     * Delete a grade
     * @param {string} gradeId - Grade ID
     */
    delete: (gradeId) => apiPost('deleteGrade', { grade_id: gradeId })
};

// ============================================
// Finance Endpoints
// ============================================

export const financeAPI = {
    /**
     * Get all transactions for current user
     * @param {string} month - Optional month filter (YYYY-MM)
     */
    getAll: (month = null) => {
        const params = month ? { month } : {};
        return apiGet('getFinance', params);
    },
    
    /**
     * Add a new transaction
     * @param {object} transactionData - Transaction data (type, category, amount, date, notes)
     */
    add: (transactionData) => apiPost('addTransaction', transactionData),
    
    /**
     * Delete a transaction
     * @param {string} transactionId - Transaction ID
     */
    delete: (transactionId) => apiPost('deleteTransaction', { transaction_id: transactionId }),
    
    /**
     * Get monthly summary (income, expense, balance)
     * @param {string} month - Month in YYYY-MM format
     */
    getSummary: (month) => apiGet('getFinanceSummary', { month })
};

// ============================================
// Activities Endpoints (Organization)
// ============================================

export const activitiesAPI = {
    /**
     * Get all activities for current user
     */
    getAll: () => apiGet('getActivities'),
    
    /**
     * Add a new activity
     * @param {object} activityData - Activity data (title, type, date, location, description)
     */
    add: (activityData) => apiPost('addActivity', activityData),
    
    /**
     * Delete an activity
     * @param {string} activityId - Activity ID
     */
    delete: (activityId) => apiPost('deleteActivity', { activity_id: activityId })
};

// ============================================
// Habits Endpoints
// ============================================

export const habitsAPI = {
    /**
     * Get all habits for current user
     */
    getAll: () => apiGet('getHabits'),
    
    /**
     * Add a new habit
     * @param {object} habitData - Habit data (title, target)
     */
    add: (habitData) => apiPost('addHabit', habitData),
    
    /**
     * Update habit streak (complete habit for today)
     * @param {string} habitId - Habit ID
     */
    updateStreak: (habitId) => apiPost('updateHabitStreak', { habit_id: habitId }),
    
    /**
     * Delete a habit
     * @param {string} habitId - Habit ID
     */
    delete: (habitId) => apiPost('deleteHabit', { habit_id: habitId })
};

// ============================================
// Notes Endpoints
// ============================================

export const notesAPI = {
    /**
     * Get all notes for current user
     * @param {string} search - Optional search query
     * @param {string} category - Optional category filter
     */
    getAll: (search = '', category = '') => {
        const params = {};
        if (search) params.search = search;
        if (category) params.category = category;
        return apiGet('getNotes', params);
    },
    
    /**
     * Add a new note
     * @param {object} noteData - Note data (title, category, content)
     */
    add: (noteData) => apiPost('addNote', noteData),
    
    /**
     * Update an existing note
     * @param {string} noteId - Note ID
     * @param {object} updates - Updated note data
     */
    update: (noteId, updates) => apiPost('updateNote', { note_id: noteId, ...updates }),
    
    /**
     * Delete a note
     * @param {string} noteId - Note ID
     */
    delete: (noteId) => apiPost('deleteNote', { note_id: noteId }),
    
    /**
     * Archive a note
     * @param {string} noteId - Note ID
     */
    archive: (noteId) => apiPost('updateNote', { note_id: noteId, is_archived: true }),
    
    /**
     * Unarchive a note
     * @param {string} noteId - Note ID
     */
    unarchive: (noteId) => apiPost('updateNote', { note_id: noteId, is_archived: false })
};

// ============================================
// Profile Endpoints
// ============================================

export const profileAPI = {
    /**
     * Get user profile data
     */
    getProfile: () => apiGet('getUserProfile'),
    
    /**
     * Update user profile
     * @param {object} profileData - Profile data (fullname, faculty, major, batch_year)
     */
    updateProfile: (profileData) => apiPost('updateUserProfile', profileData),
    
    /**
     * Change password
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     */
    changePassword: (currentPassword, newPassword) => apiPost('changePassword', { current_password: currentPassword, new_password: newPassword })
};

// ============================================
// Export all APIs as a single object
// ============================================

export const API = {
    auth: authAPI,
    dashboard: dashboardAPI,
    courses: coursesAPI,
    assignments: assignmentsAPI,
    grades: gradesAPI,
    finance: financeAPI,
    activities: activitiesAPI,
    habits: habitsAPI,
    notes: notesAPI,
    profile: profileAPI
};

export default API;
