/**
 * Dashboard Service
 * Handles dashboard data fetching and aggregation
 * Implements PRD Section DASH-01
 */

import { apiGet } from '../api/client.js';
import { CacheManager, fetchWithCache } from '../api/cacheService.js';
import { CACHE_TTL } from '../utils/constants.js';

/**
 * Fetch complete dashboard data
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<Object>} Dashboard data
 */
export async function fetchDashboard(forceRefresh = false) {
    const cacheKey = 'dashboard_full';
    const ttl = CACHE_TTL.DASHBOARD;
    
    if (!forceRefresh) {
        const cached = CacheManager.get(cacheKey);
        if (cached) {
            return { data: cached, fromCache: true };
        }
    }
    
    try {
        const response = await apiGet('getDashboard');
        
        if (response.success && response.data) {
            CacheManager.set(cacheKey, response.data, ttl);
            return { data: response.data, fromCache: false };
        }
        
        throw new Error(response.message || 'Failed to fetch dashboard');
    } catch (error) {
        console.error('Dashboard fetch error:', error);
        throw error;
    }
}

/**
 * Fetch dashboard with parallel requests (alternative to single endpoint)
 * Used if backend doesn't have aggregated endpoint
 * @returns {Promise<Object>} Aggregated dashboard data
 */
export async function fetchDashboardParallel() {
    const endpoints = [
        { action: 'getAssignments', key: 'assignments' },
        { action: 'getHabits', key: 'habits' },
        { action: 'getFinance', key: 'finance' },
        { action: 'getGrades', key: 'grades' },
        { action: 'getCourses', key: 'courses' }
    ];
    
    const results = await Promise.all(
        endpoints.map(async ({ action, key }) => {
            try {
                const response = await apiGet(action);
                return { key, data: response.success ? response.data : [] };
            } catch (error) {
                console.error(`Failed to fetch ${key}:`, error);
                return { key, data: [] };
            }
        })
    );
    
    const dashboardData = {};
    results.forEach(({ key, data }) => {
        dashboardData[key] = data;
    });
    
    // Process assignments for upcoming
    dashboardData.upcomingAssignments = processUpcomingAssignments(dashboardData.assignments || []);
    
    // Process habits for streak summary
    dashboardData.habitSummary = processHabitSummary(dashboardData.habits || []);
    
    // Process finance for monthly summary
    dashboardData.financeSummary = processFinanceSummary(dashboardData.finance || []);
    
    // Process grades for GPA
    dashboardData.gpaSummary = processGPASummary(dashboardData.grades || []);
    
    return dashboardData;
}

/**
 * Process assignments to find upcoming ones
 * @param {Array} assignments - List of assignments
 * @returns {Object} Upcoming assignments summary
 */
function processUpcomingAssignments(assignments) {
    const now = new Date();
    const sevenDaysLater = new Date(now);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    
    const upcoming = assignments
        .filter(a => {
            const deadline = new Date(a.deadline);
            return deadline >= now && deadline <= sevenDaysLater && a.status !== 'done';
        })
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);
    
    const dueToday = assignments.filter(a => {
        const deadline = new Date(a.deadline);
        return deadline.toDateString() === now.toDateString() && a.status !== 'done';
    }).length;
    
    return {
        upcoming,
        totalPending: assignments.filter(a => a.status !== 'done').length,
        dueToday
    };
}

/**
 * Process habits for streak summary
 * @param {Array} habits - List of habits
 * @returns {Object} Habit summary
 */
function processHabitSummary(habits) {
    const totalStreak = habits.reduce((sum, h) => sum + (parseInt(h.streak) || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h => h.last_completed === today).length;
    
    return {
        habits,
        totalHabits: habits.length,
        totalStreak,
        completedToday
    };
}

/**
 * Process finance for monthly summary
 * @param {Array} transactions - List of transactions
 * @returns {Object} Finance summary
 */
function processFinanceSummary(transactions) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let income = 0;
    let expense = 0;
    
    for (const t of transactions) {
        if (t.date && t.date.startsWith(currentMonth)) {
            const amount = parseFloat(t.amount) || 0;
            if (t.type === 'income') {
                income += amount;
            } else if (t.type === 'expense') {
                expense += amount;
            }
        }
    }
    
    return {
        month: currentMonth,
        income,
        expense,
        balance: income - expense
    };
}

/**
 * Process grades for GPA summary
 * @param {Array} grades - List of grades
 * @returns {Object} GPA summary
 */
function processGPASummary(grades) {
    let totalPoints = 0;
    let totalCredits = 0;
    
    for (const grade of grades) {
        const credits = parseFloat(grade.credits) || 0;
        const gradeValue = parseFloat(grade.grade) || 0;
        totalPoints += gradeValue * credits;
        totalCredits += credits;
    }
    
    const cumulativeGPA = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    return {
        cumulativeGPA: Math.round(cumulativeGPA * 100) / 100,
        totalCourses: grades.length,
        totalCredits
    };
}

export default {
    fetchDashboard,
    fetchDashboardParallel
};
