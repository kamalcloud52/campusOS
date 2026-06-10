/**
 * Global State Management - Observer Pattern
 * Centralized state store for the application
 */

import { STORAGE_KEYS } from '../utils/constants.js';

const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    dashboard: null,
    courses: [],
    assignments: [],
    grades: [],
    transactions: [],
    habits: [],
    notes: [],
    isLoading: false,
    error: null,
    sidebarOpen: false,
    lastFetch: {
        dashboard: null,
        courses: null,
        assignments: null,
        grades: null,
        finance: null,
        habits: null,
        notes: null,
        profile: null
    }
};

class Store {
    constructor() {
        this.state = { ...initialState };
        this.listeners = [];
    }
    
    getState() {
        return { ...this.state };
    }
    
    getSlice(key) {
        return this.state.hasOwnProperty(key) ? this.state[key] : null;
    }
    
    setState(newState, silent = false) {
        const oldState = { ...this.state };
        Object.assign(this.state, newState);
        if (!silent) {
            this.notifyListeners(oldState, this.state);
        }
    }
    
    subscribe(listener) {
        if (typeof listener !== 'function') {
            throw new Error('Listener must be a function');
        }
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    
    notifyListeners(oldState, newState) {
        this.listeners.forEach(listener => {
            try {
                listener(newState, oldState);
            } catch (error) {
                console.error('Error in state listener:', error);
            }
        });
    }
    
    resetState() {
        this.setState(initialState);
        this.listeners = [];
    }
    
    clearUserData() {
        this.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            dashboard: null,
            courses: [],
            assignments: [],
            grades: [],
            transactions: [],
            habits: [],
            notes: [],
            lastFetch: {
                dashboard: null,
                courses: null,
                assignments: null,
                grades: null,
                finance: null,
                habits: null,
                notes: null,
                profile: null
            }
        });
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);
    }
    
    setAuth(user, token) {
        this.setState({
            user,
            token,
            isAuthenticated: true,
            error: null
        });
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
    
    clearAuth() {
        this.clearUserData();
    }
    
    setLoading(isLoading) {
        this.setState({ isLoading });
    }
    
    setError(error) {
        this.setState({ error });
    }
    
    clearError() {
        this.setState({ error: null });
    }
    
    updateLastFetch(key) {
        this.setState({
            lastFetch: {
                ...this.state.lastFetch,
                [key]: Date.now()
            }
        });
    }
    
    isStale(key, ttl) {
        const lastFetch = this.state.lastFetch[key];
        if (!lastFetch) return true;
        return Date.now() - lastFetch > ttl;
    }
    
    async dispatch(action, ...args) {
        this.setLoading(true);
        this.clearError();
        try {
            const result = await action(this, ...args);
            this.setLoading(false);
            return result;
        } catch (error) {
            this.setError(error.message || 'An error occurred');
            this.setLoading(false);
            throw error;
        }
    }
    
    restoreSession() {
        let token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
        let userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
        if (!token) {
            token = localStorage.getItem(STORAGE_KEYS.TOKEN);
            userStr = localStorage.getItem(STORAGE_KEYS.USER);
        }
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                this.setState({
                    user,
                    token,
                    isAuthenticated: true
                });
                return true;
            } catch (error) {
                console.error('Failed to restore session:', error);
                localStorage.removeItem(STORAGE_KEYS.TOKEN);
                localStorage.removeItem(STORAGE_KEYS.USER);
                sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
                sessionStorage.removeItem(STORAGE_KEYS.USER);
            }
        }
        return false;
    }
    
    setDashboard(data) {
        this.setState({ dashboard: data });
        this.updateLastFetch('dashboard');
    }
    
    setCourses(courses) {
        this.setState({ courses });
        this.updateLastFetch('courses');
    }
    
    addCourse(course) {
        const current = this.getState().courses;
        this.setState({ courses: [...current, course] });
    }
    
    updateCourse(courseId, updates) {
        const current = this.getState().courses;
        const updated = current.map(c => 
            c.course_id === courseId ? { ...c, ...updates } : c
        );
        this.setState({ courses: updated });
    }
    
    deleteCourse(courseId) {
        const current = this.getState().courses;
        this.setState({ courses: current.filter(c => c.course_id !== courseId) });
    }
    
    setAssignments(assignments) {
        this.setState({ assignments });
        this.updateLastFetch('assignments');
    }
    
    addAssignment(assignment) {
        const current = this.getState().assignments;
        this.setState({ assignments: [assignment, ...current] });
    }
    
    updateAssignment(assignmentId, updates) {
        const current = this.getState().assignments;
        const updated = current.map(a => 
            a.assignment_id === assignmentId ? { ...a, ...updates } : a
        );
        this.setState({ assignments: updated });
    }
    
    deleteAssignment(assignmentId) {
        const current = this.getState().assignments;
        this.setState({ assignments: current.filter(a => a.assignment_id !== assignmentId) });
    }
    
    setGrades(grades) {
        this.setState({ grades });
        this.updateLastFetch('grades');
    }
    
    addGrade(grade) {
        const current = this.getState().grades;
        this.setState({ grades: [...current, grade] });
    }
    
    deleteGrade(gradeId) {
        const current = this.getState().grades;
        this.setState({ grades: current.filter(g => g.grade_id !== gradeId) });
    }
    
    setTransactions(transactions) {
        this.setState({ transactions });
        this.updateLastFetch('finance');
    }
    
    addTransaction(transaction) {
        const current = this.getState().transactions;
        this.setState({ transactions: [transaction, ...current] });
    }
    
    deleteTransaction(transactionId) {
        const current = this.getState().transactions;
        this.setState({ transactions: current.filter(t => t.transaction_id !== transactionId) });
    }
    
    setHabits(habits) {
        this.setState({ habits });
        this.updateLastFetch('habits');
    }
    
    addHabit(habit) {
        const current = this.getState().habits;
        this.setState({ habits: [...current, habit] });
    }
    
    updateHabit(habitId, updates) {
        const current = this.getState().habits;
        const updated = current.map(h => 
            h.habit_id === habitId ? { ...h, ...updates } : h
        );
        this.setState({ habits: updated });
    }
    
    deleteHabit(habitId) {
        const current = this.getState().habits;
        this.setState({ habits: current.filter(h => h.habit_id !== habitId) });
    }
    
    setNotes(notes) {
        this.setState({ notes });
        this.updateLastFetch('notes');
    }
    
    addNote(note) {
        const current = this.getState().notes;
        this.setState({ notes: [note, ...current] });
    }
    
    updateNote(noteId, updates) {
        const current = this.getState().notes;
        const updated = current.map(n => 
            n.note_id === noteId ? { ...n, ...updates } : n
        );
        this.setState({ notes: updated });
    }
    
    deleteNote(noteId) {
        const current = this.getState().notes;
        this.setState({ notes: current.filter(n => n.note_id !== noteId) });
    }
    
    toggleSidebar() {
        this.setState({ sidebarOpen: !this.state.sidebarOpen });
    }
    
    closeSidebar() {
        this.setState({ sidebarOpen: false });
    }
    
    openSidebar() {
        this.setState({ sidebarOpen: true });
    }
}

export const store = new Store();

export function useSelector(selector) {
    const state = store.getState();
    return selector(state);
}

export function useDispatch() {
    return store.dispatch.bind(store);
}

export const actions = {
    setAuth: (user, token) => store.setAuth(user, token),
    clearAuth: () => store.clearAuth(),
    setLoading: (isLoading) => store.setLoading(isLoading),
    setError: (error) => store.setError(error),
    clearError: () => store.clearError(),
    updateLastFetch: (key) => store.updateLastFetch(key),
    toggleSidebar: () => store.toggleSidebar(),
    closeSidebar: () => store.closeSidebar(),
    openSidebar: () => store.openSidebar(),
    setDashboard: (data) => store.setDashboard(data),
    setCourses: (courses) => store.setCourses(courses),
    addCourse: (course) => store.addCourse(course),
    updateCourse: (courseId, updates) => store.updateCourse(courseId, updates),
    deleteCourse: (courseId) => store.deleteCourse(courseId),
    setAssignments: (assignments) => store.setAssignments(assignments),
    addAssignment: (assignment) => store.addAssignment(assignment),
    updateAssignment: (assignmentId, updates) => store.updateAssignment(assignmentId, updates),
    deleteAssignment: (assignmentId) => store.deleteAssignment(assignmentId),
    setGrades: (grades) => store.setGrades(grades),
    addGrade: (grade) => store.addGrade(grade),
    deleteGrade: (gradeId) => store.deleteGrade(gradeId),
    setTransactions: (transactions) => store.setTransactions(transactions),
    addTransaction: (transaction) => store.addTransaction(transaction),
    deleteTransaction: (transactionId) => store.deleteTransaction(transactionId),
    setHabits: (habits) => store.setHabits(habits),
    addHabit: (habit) => store.addHabit(habit),
    updateHabit: (habitId, updates) => store.updateHabit(habitId, updates),
    deleteHabit: (habitId) => store.deleteHabit(habitId),
    setNotes: (notes) => store.setNotes(notes),
    addNote: (note) => store.addNote(note),
    updateNote: (noteId, updates) => store.updateNote(noteId, updates),
    deleteNote: (noteId) => store.deleteNote(noteId),
    setState: (newState) => store.setState(newState)
};

// Debug helper
window.__store = store;
