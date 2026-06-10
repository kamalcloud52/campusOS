/**
 * Dashboard Page Component
 * Displays aggregated data from 5 sources: assignments, habits, finance, GPA, courses
 * Implements PRD Section DASH-01
 */

import { store, actions } from '../store/globalState.js';
import { dashboardAPI } from '../api/endpoints.js';
import { fetchWithCache, invalidateAfterMutation } from '../api/cacheService.js';
import { showToast } from '../components/Toast.js';
import { formatDate, formatRelativeTime, formatCurrency, formatGPA, getAssignmentStatusClass, getAssignmentStatusText } from '../utils/formatters.js';
import { calculateCumulativeGPA } from '../utils/gpaCalculator.js';
import { CACHE_TTL } from '../utils/constants.js';
import { skeletonCards, skeletonList } from '../components/LoadingSpinner.js';

// State
let refreshInterval = null;
let dashboardData = null;

/**
 * Render dashboard page with skeleton loader
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const isLoading = state.isLoading;
    const data = state.dashboard;
    
    if (isLoading || !data) {
        return renderSkeleton();
    }
    
    return `
        <div class="dashboard-container">
            <!-- Welcome Section -->
            <div class="dashboard-welcome">
                <div class="welcome-text">
                    <h1>Welcome back, ${escapeHtml(state.user?.fullname?.split(' ')[0] || 'Student')}!</h1>
                    <p>Here's your campus overview for today</p>
                </div>
                <div class="welcome-date">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${formatDate(new Date(), 'full')}</span>
                </div>
            </div>
            
            <!-- Stats Grid -->
            <div class="stats-grid">
                ${renderStatsCards(data)}
            </div>
            
            <!-- Main Content Grid -->
            <div class="dashboard-grid">
                <!-- Left Column -->
                <div class="dashboard-col">
                    ${renderUpcomingAssignments(data.assignments)}
                    ${renderHabitTracker(data.habits)}
                </div>
                
                <!-- Right Column -->
                <div class="dashboard-col">
                    ${renderFinanceSummary(data.finance)}
                    ${renderGPASummary(data.gpa)}
                    ${renderRecentCourses(data.courses)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render skeleton loader
 * @returns {string} HTML string
 */
function renderSkeleton() {
    return `
        <div class="dashboard-container">
            <div class="dashboard-welcome">
                <div class="skeleton" style="width: 200px; height: 32px;"></div>
                <div class="skeleton" style="width: 150px; height: 20px; margin-top: 8px;"></div>
            </div>
            
            <div class="stats-grid">
                ${skeletonCards(4)}
            </div>
            
            <div class="dashboard-grid">
                <div class="dashboard-col">
                    <div class="card">
                        <div class="card-header">
                            <div class="skeleton" style="width: 120px; height: 24px;"></div>
                        </div>
                        <div class="card-body">
                            ${skeletonList(3)}
                        </div>
                    </div>
                    <div class="card" style="margin-top: 20px;">
                        <div class="card-header">
                            <div class="skeleton" style="width: 100px; height: 24px;"></div>
                        </div>
                        <div class="card-body">
                            ${skeletonList(3)}
                        </div>
                    </div>
                </div>
                <div class="dashboard-col">
                    <div class="card">
                        <div class="card-header">
                            <div class="skeleton" style="width: 140px; height: 24px;"></div>
                        </div>
                        <div class="card-body">
                            <div class="skeleton" style="height: 80px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render stats cards (total pending, due today, total income/expense, GPA)
 * @param {Object} data - Dashboard data
 * @returns {string} HTML string
 */
function renderStatsCards(data) {
    const assignments = data.assignments || {};
    const finance = data.finance || {};
    const gpa = data.gpa || {};
    
    const stats = [
        {
            icon: 'fas fa-tasks',
            label: 'Pending Tasks',
            value: assignments.total_pending || 0,
            color: 'primary',
            change: assignments.due_today ? `${assignments.due_today} due today` : null
        },
        {
            icon: 'fas fa-chart-line',
            label: 'Current GPA',
            value: formatGPA(gpa.cumulative_gpa || 0),
            color: gpa.cumulative_gpa >= 3.0 ? 'success' : gpa.cumulative_gpa >= 2.0 ? 'warning' : 'danger',
            change: `${gpa.total_courses || 0} courses`
        },
        {
            icon: 'fas fa-wallet',
            label: 'Monthly Balance',
            value: formatCurrency(finance.balance || 0),
            color: (finance.balance || 0) >= 0 ? 'success' : 'danger',
            change: `Income: ${formatCurrency(finance.income || 0)}`
        },
        {
            icon: 'fas fa-fire',
            label: 'Habit Streak',
            value: (data.habits?.total_streak || 0).toString(),
            color: 'warning',
            change: `${data.habits?.completed_today || 0} completed today`
        }
    ];
    
    return stats.map(stat => `
        <div class="stat-card stat-card-${stat.color}">
            <div class="stat-icon">
                <i class="${stat.icon}"></i>
            </div>
            <div class="stat-info">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
                ${stat.change ? `<div class="stat-change">${stat.change}</div>` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Render upcoming assignments widget
 * @param {Object} assignmentsData - Assignments data
 * @returns {string} HTML string
 */
function renderUpcomingAssignments(assignmentsData) {
    const upcoming = assignmentsData?.upcoming || [];
    
    if (upcoming.length === 0) {
        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-clock"></i> Upcoming Assignments</h3>
                    <a href="#/academic" class="btn-link">View All</a>
                </div>
                <div class="card-body empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No upcoming assignments!</p>
                    <small>You're all caught up</small>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-clock"></i> Upcoming Assignments</h3>
                <a href="#/academic" class="btn-link">View All</a>
            </div>
            <div class="card-body">
                <div class="assignment-list">
                    ${upcoming.map(assignment => `
                        <div class="assignment-item ${getAssignmentStatusClass(assignment.status)}">
                            <div class="assignment-info">
                                <div class="assignment-title">${escapeHtml(assignment.title)}</div>
                                <div class="assignment-meta">
                                    <span class="assignment-course">${escapeHtml(assignment.course_name || 'Course')}</span>
                                    <span class="assignment-deadline">
                                        <i class="fas fa-calendar-alt"></i>
                                        ${formatRelativeTime(assignment.deadline)}
                                    </span>
                                </div>
                            </div>
                            <div class="assignment-status">
                                <span class="status-badge status-${assignment.status}">
                                    ${getAssignmentStatusText(assignment.status)}
                                </span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render habit tracker widget
 * @param {Object} habitsData - Habits data
 * @returns {string} HTML string
 */
function renderHabitTracker(habitsData) {
    const habits = habitsData?.habits || [];
    
    if (habits.length === 0) {
        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-fire"></i> Habit Tracker</h3>
                    <a href="#/goals" class="btn-link">Add Habit</a>
                </div>
                <div class="card-body empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>No habits yet</p>
                    <small>Add your first habit to start tracking</small>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-fire"></i> Habit Tracker</h3>
                <a href="#/goals" class="btn-link">Manage</a>
            </div>
            <div class="card-body">
                <div class="habit-list">
                    ${habits.slice(0, 5).map(habit => `
                        <div class="habit-item">
                            <div class="habit-info">
                                <div class="habit-title">${escapeHtml(habit.title)}</div>
                                <div class="habit-streak">
                                    <i class="fas fa-fire"></i>
                                    <span>${habit.streak || 0} day streak</span>
                                </div>
                            </div>
                            <button class="habit-check-btn" data-habit-id="${habit.habit_id}">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render finance summary widget
 * @param {Object} financeData - Finance data
 * @returns {string} HTML string
 */
function renderFinanceSummary(financeData) {
    const income = financeData?.income || 0;
    const expense = financeData?.expense || 0;
    const balance = financeData?.balance || 0;
    const month = financeData?.month || '';
    
    const expensePercent = income > 0 ? (expense / income) * 100 : 0;
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-wallet"></i> Finance Summary</h3>
                <a href="#/finance" class="btn-link">Details</a>
            </div>
            <div class="card-body">
                <div class="finance-summary">
                    <div class="finance-balance ${balance >= 0 ? 'positive' : 'negative'}">
                        <span class="balance-label">Balance</span>
                        <span class="balance-value">${formatCurrency(balance)}</span>
                        <small>${month}</small>
                    </div>
                    <div class="finance-stats">
                        <div class="finance-stat income">
                            <i class="fas fa-arrow-up"></i>
                            <div>
                                <div class="stat-label">Income</div>
                                <div class="stat-value">${formatCurrency(income)}</div>
                            </div>
                        </div>
                        <div class="finance-stat expense">
                            <i class="fas fa-arrow-down"></i>
                            <div>
                                <div class="stat-label">Expense</div>
                                <div class="stat-value">${formatCurrency(expense)}</div>
                            </div>
                        </div>
                    </div>
                    ${income > 0 ? `
                        <div class="finance-progress">
                            <div class="progress-label">Expense / Income</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(expensePercent, 100)}%"></div>
                            </div>
                            <div class="progress-percent">${expensePercent.toFixed(1)}%</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render GPA summary widget
 * @param {Object} gpaData - GPA data
 * @returns {string} HTML string
 */
function renderGPASummary(gpaData) {
    const gpa = gpaData?.cumulative_gpa || 0;
    const totalCourses = gpaData?.total_courses || 0;
    const totalCredits = gpaData?.total_credits || 0;
    
    let gpaClass = 'gpa-low';
    let gpaMessage = 'Needs Improvement';
    
    if (gpa >= 3.5) {
        gpaClass = 'gpa-excellent';
        gpaMessage = 'Excellent!';
    } else if (gpa >= 3.0) {
        gpaClass = 'gpa-good';
        gpaMessage = 'Very Good';
    } else if (gpa >= 2.5) {
        gpaClass = 'gpa-satisfactory';
        gpaMessage = 'Satisfactory';
    } else if (gpa >= 2.0) {
        gpaClass = 'gpa-low';
        gpaMessage = 'Room for Improvement';
    }
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-graduation-cap"></i> Academic Summary</h3>
                <a href="#/gpa" class="btn-link">Details</a>
            </div>
            <div class="card-body">
                <div class="gpa-summary ${gpaClass}">
                    <div class="gpa-value">
                        <span class="gpa-number">${formatGPA(gpa)}</span>
                        <span class="gpa-label">Cumulative GPA</span>
                    </div>
                    <div class="gpa-stats">
                        <div class="gpa-stat">
                            <span class="stat-number">${totalCourses}</span>
                            <span class="stat-label">Courses</span>
                        </div>
                        <div class="gpa-stat">
                            <span class="stat-number">${totalCredits}</span>
                            <span class="stat-label">Credits</span>
                        </div>
                    </div>
                    <div class="gpa-message">${gpaMessage}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render recent courses widget
 * @param {Array} courses - Courses data
 * @returns {string} HTML string
 */
function renderRecentCourses(courses) {
    const recentCourses = courses?.slice(0, 3) || [];
    
    if (recentCourses.length === 0) {
        return `
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-book"></i> Recent Courses</h3>
                    <a href="#/academic" class="btn-link">Add Course</a>
                </div>
                <div class="card-body empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>No courses yet</p>
                    <small>Add your first course to get started</small>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-header">
                <h3><i class="fas fa-book"></i> Recent Courses</h3>
                <a href="#/academic" class="btn-link">View All</a>
            </div>
            <div class="card-body">
                <div class="course-list">
                    ${recentCourses.map(course => `
                        <div class="course-item">
                            <div class="course-icon">
                                <i class="fas fa-book-open"></i>
                            </div>
                            <div class="course-info">
                                <div class="course-name">${escapeHtml(course.course_name)}</div>
                                <div class="course-meta">
                                    <span><i class="fas fa-chalkboard-user"></i> ${escapeHtml(course.lecturer || 'TBA')}</span>
                                    <span><i class="fas fa-layer-group"></i> ${course.credits} Credits</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Escape HTML helper
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Handle habit check button click
 * @param {string} habitId - Habit ID
 */
async function handleHabitCheck(habitId) {
    try {
        const { habitsAPI } = await import('../api/endpoints.js');
        const response = await habitsAPI.updateStreak(habitId);
        
        if (response.success) {
            showToast('Habit completed! Streak updated!', 'success');
            // Refresh dashboard
            await loadDashboardData(true);
        } else {
            showToast(response.message || 'Failed to update habit', 'error');
        }
    } catch (error) {
        console.error('Habit check error:', error);
        showToast('Failed to update habit', 'error');
    }
}

/**
 * Setup event listeners after render
 */
function setupEventListeners() {
    // Habit check buttons
    const habitButtons = document.querySelectorAll('.habit-check-btn');
    habitButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const habitId = btn.getAttribute('data-habit-id');
            if (habitId) {
                await handleHabitCheck(habitId);
            }
        });
    });
}

/**
 * Load dashboard data with cache
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadDashboardData(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getDashboard',
            () => dashboardAPI.getDashboard(),
            {},
            CACHE_TTL.DASHBOARD,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const dashboardData = result.data.data || result.data;
            actions.setDashboard(dashboardData);
            
            // Show cache indicator if from cache
            if (result.fromCache) {
                console.debug('Dashboard data from cache');
            }
        } else {
            throw new Error(result.data?.message || 'Failed to load dashboard');
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        showToast('Failed to load dashboard data', 'error');
        actions.setDashboard(null);
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Start auto-refresh interval (every 2 minutes as per PRD)
 */
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        // Only refresh if page is visible
        if (!document.hidden) {
            loadDashboardData(false);
        }
    }, CACHE_TTL.DASHBOARD);
}

/**
 * Stop auto-refresh interval
 */
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * Page lifecycle - before render
 * @returns {boolean} True if can render
 */
async function beforeRender() {
    const state = store.getState();
    
    // Load dashboard data if not exists or stale
    if (!state.dashboard || state.isStale?.dashboard) {
        await loadDashboardData(false);
    }
    
    return true;
}

/**
 * Page lifecycle - after render
 */
async function afterRender() {
    setupEventListeners();
    startAutoRefresh();
}

/**
 * Page cleanup when navigating away
 */
export function cleanup() {
    stopAutoRefresh();
}

// Export page component
const DashboardPage = {
    render,
    beforeRender,
    afterRender,
    cleanup
};

export default DashboardPage;
