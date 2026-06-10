/**
 * Goals & Habits Page Component
 * Manages daily/weekly habits with streak tracking
 * Implements PRD Section GOAL-01
 */

import { store, actions } from '../store/globalState.js';
import { habitsAPI } from '../api/endpoints.js';
import { fetchWithCache, invalidateAfterMutation } from '../api/cacheService.js';
import { showToast } from '../components/Toast.js';
import { confirmModal } from '../components/Modal.js';
import { HabitModal } from '../components/HabitModal.js';
import { CACHE_TTL, HABIT_TARGET_OPTIONS } from '../utils/constants.js';
import { formatDate } from '../utils/formatters.js';
import { skeletonList } from '../components/LoadingSpinner.js';

// State
let currentFilter = 'all';
let chartInstance = null;

/**
 * Render habits page
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const isLoading = state.isLoading;
    const habits = state.habits || [];
    
    if (isLoading && !habits.length) {
        return renderSkeleton();
    }
    
    // Filter habits
    let filteredHabits = habits;
    if (currentFilter === 'daily') {
        filteredHabits = habits.filter(h => h.target === 'daily');
    } else if (currentFilter === 'weekly') {
        filteredHabits = habits.filter(h => h.target === 'weekly');
    }
    
    // Calculate statistics
    const stats = calculateStats(habits);
    const today = new Date().toISOString().split('T')[0];
    
    return `
        <div class="habits-container">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h1>Habit Tracker</h1>
                    <p>Build consistent habits and track your streaks</p>
                </div>
                <button id="addHabitBtn" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Add Habit
                </button>
            </div>
            
            <!-- Stats Cards -->
            <div class="habits-stats-grid">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-fire"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.totalStreak}</div>
                        <div class="stat-label">Total Streak Days</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.completedToday}</div>
                        <div class="stat-label">Completed Today</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-calendar-week"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.totalHabits}</div>
                        <div class="stat-label">Active Habits</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-trophy"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.bestStreak}</div>
                        <div class="stat-label">Best Streak</div>
                    </div>
                </div>
            </div>
            
            <!-- Filter Tabs -->
            <div class="habits-filter-tabs">
                <button class="filter-tab ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                    <i class="fas fa-list"></i>
                    All Habits
                </button>
                <button class="filter-tab ${currentFilter === 'daily' ? 'active' : ''}" data-filter="daily">
                    <i class="fas fa-sun"></i>
                    Daily
                </button>
                <button class="filter-tab ${currentFilter === 'weekly' ? 'active' : ''}" data-filter="weekly">
                    <i class="fas fa-calendar-week"></i>
                    Weekly
                </button>
            </div>
            
            <!-- Habits Grid -->
            <div class="habits-grid">
                ${filteredHabits.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-seedling"></i>
                        <h3>No Habits Yet</h3>
                        <p>Add your first habit to start building consistency.</p>
                        <button class="btn btn-primary" id="emptyAddHabitBtn">
                            <i class="fas fa-plus"></i>
                            Add Habit
                        </button>
                    </div>
                ` : `
                    ${filteredHabits.map(habit => renderHabitCard(habit, today)).join('')}
                `}
            </div>
            
            <!-- Habit Streak Chart (Optional) -->
            ${habits.length > 0 ? `
                <div class="habits-chart-card">
                    <h3><i class="fas fa-chart-line"></i> Weekly Progress</h3>
                    <div class="chart-container">
                        <canvas id="habitsChart"></canvas>
                    </div>
                </div>
            ` : ''}
            
            <!-- Tips Section -->
            <div class="habits-tips-card">
                <h3><i class="fas fa-lightbulb"></i> Habit Building Tips</h3>
                <div class="tips-list">
                    <div class="tip-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Start with small, achievable habits</span>
                    </div>
                    <div class="tip-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Be consistent - same time every day</span>
                    </div>
                    <div class="tip-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Track your progress to stay motivated</span>
                    </div>
                    <div class="tip-item">
                        <i class="fas fa-check-circle"></i>
                        <span>Don't break the streak - it builds momentum</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render single habit card
 * @param {Object} habit - Habit data
 * @param {string} today - Today's date
 * @returns {string} HTML string
 */
function renderHabitCard(habit, today) {
    const isCompleted = habit.last_completed === today;
    const targetIcon = habit.target === 'daily' ? 'fa-sun' : 'fa-calendar-week';
    const targetLabel = habit.target === 'daily' ? 'Daily' : 'Weekly';
    
    // Calculate streak status
    const streakClass = habit.streak >= 7 ? 'streak-hot' : habit.streak >= 3 ? 'streak-warm' : '';
    
    return `
        <div class="habit-card ${isCompleted ? 'completed' : ''}" data-habit-id="${habit.habit_id}">
            <div class="habit-card-header">
                <div class="habit-icon">
                    <i class="fas ${targetIcon}"></i>
                </div>
                <div class="habit-info">
                    <h4 class="habit-title">${escapeHtml(habit.title)}</h4>
                    <div class="habit-meta">
                        <span class="habit-target ${habit.target}">
                            <i class="fas ${targetIcon}"></i>
                            ${targetLabel}
                        </span>
                        <span class="habit-created">
                            <i class="fas fa-calendar-alt"></i>
                            Since ${formatDate(habit.created_at, 'date')}
                        </span>
                    </div>
                </div>
                <div class="habit-actions">
                    <button class="icon-btn edit-habit" data-habit-id="${habit.habit_id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete-habit" data-habit-id="${habit.habit_id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="habit-card-body">
                <div class="streak-display ${streakClass}">
                    <div class="streak-icon">
                        <i class="fas fa-fire"></i>
                    </div>
                    <div class="streak-info">
                        <div class="streak-value">${habit.streak || 0}</div>
                        <div class="streak-label">Day Streak</div>
                    </div>
                </div>
                
                <button class="habit-check-btn ${isCompleted ? 'checked' : ''}" 
                        data-habit-id="${habit.habit_id}" 
                        ${isCompleted ? 'disabled' : ''}>
                    <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-circle'}"></i>
                    <span>${isCompleted ? 'Completed Today' : 'Mark Complete'}</span>
                </button>
            </div>
            
            ${habit.target === 'weekly' ? `
                <div class="habit-weekly-note">
                    <i class="fas fa-info-circle"></i>
                    <small>Weekly habits track completion by week</small>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Render skeleton loader
 * @returns {string} HTML string
 */
function renderSkeleton() {
    return `
        <div class="habits-container">
            <div class="page-header">
                <div>
                    <div class="skeleton" style="width: 150px; height: 32px;"></div>
                    <div class="skeleton" style="width: 200px; height: 20px; margin-top: 8px;"></div>
                </div>
            </div>
            <div class="habits-stats-grid">
                ${[1, 2, 3, 4].map(() => `
                    <div class="skeleton" style="height: 100px; border-radius: 16px;"></div>
                `).join('')}
            </div>
            ${skeletonList(3)}
        </div>
    `;
}

/**
 * Calculate habit statistics
 * @param {Array} habits - List of habits
 * @returns {Object} Statistics
 */
function calculateStats(habits) {
    let totalStreak = 0;
    let bestStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    let completedToday = 0;
    
    for (const habit of habits) {
        const streak = parseInt(habit.streak) || 0;
        totalStreak += streak;
        if (streak > bestStreak) bestStreak = streak;
        if (habit.last_completed === today) completedToday++;
    }
    
    return {
        totalStreak,
        bestStreak,
        completedToday,
        totalHabits: habits.length
    };
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
 * Load habits data
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadHabits(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getHabits',
            () => habitsAPI.getAll(),
            {},
            CACHE_TTL.COURSES,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const habits = result.data.data || result.data;
            actions.setHabits(habits);
            return habits;
        }
    } catch (error) {
        console.error('Load habits error:', error);
        showToast('Failed to load habits', 'error');
    } finally {
        actions.setLoading(false);
    }
    
    return [];
}

/**
 * Add new habit
 * @param {Object} habitData - Habit data
 */
async function addHabit(habitData) {
    actions.setLoading(true);
    
    try {
        const response = await habitsAPI.add(habitData);
        
        if (response.success) {
            showToast('Habit added successfully', 'success');
            invalidateAfterMutation('addHabit');
            await loadHabits(true);
            renderChart();
            return true;
        } else {
            showToast(response.message || 'Failed to add habit', 'error');
            return false;
        }
    } catch (error) {
        console.error('Add habit error:', error);
        showToast('Failed to add habit', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Update habit streak (complete today)
 * @param {string} habitId - Habit ID
 */
async function updateHabitStreak(habitId) {
    try {
        const response = await habitsAPI.updateStreak(habitId);
        
        if (response.success) {
            showToast('Great job! Streak updated!', 'success');
            invalidateAfterMutation('updateHabitStreak');
            await loadHabits(true);
            renderChart();
            return true;
        } else {
            if (response.message === 'Already completed today') {
                showToast('You already completed this habit today!', 'info');
            } else {
                showToast(response.message || 'Failed to update habit', 'error');
            }
            return false;
        }
    } catch (error) {
        console.error('Update streak error:', error);
        showToast('Failed to update habit', 'error');
        return false;
    }
}

/**
 * Delete habit
 * @param {string} habitId - Habit ID
 */
async function deleteHabit(habitId) {
    const confirmed = await confirmModal(
        'Delete Habit',
        'Are you sure you want to delete this habit? Your streak data will be lost.',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return false;
    
    actions.setLoading(true);
    
    try {
        const response = await habitsAPI.delete(habitId);
        
        if (response.success) {
            showToast('Habit deleted successfully', 'success');
            invalidateAfterMutation('deleteHabit');
            await loadHabits(true);
            renderChart();
            return true;
        } else {
            showToast(response.message || 'Failed to delete habit', 'error');
            return false;
        }
    } catch (error) {
        console.error('Delete habit error:', error);
        showToast('Failed to delete habit', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Render habit completion chart
 */
async function renderChart() {
    const canvas = document.getElementById('habitsChart');
    if (!canvas) return;
    
    const state = store.getState();
    const habits = state.habits || [];
    
    if (habits.length === 0) return;
    
    // Get last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
    }
    
    // Calculate completions per day
    const completionsPerDay = last7Days.map(day => {
        // For weekly habits, check if completed this week
        let count = 0;
        for (const habit of habits) {
            if (habit.target === 'daily') {
                if (habit.last_completed === day) count++;
            } else if (habit.target === 'weekly') {
                // Weekly habit: check if completed within the same week
                const completedDate = habit.last_completed;
                if (completedDate) {
                    const weekNum = getWeekNumber(new Date(day));
                    const completedWeekNum = getWeekNumber(new Date(completedDate));
                    if (weekNum === completedWeekNum) count++;
                }
            }
        }
        return count;
    });
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => createChart(last7Days, completionsPerDay);
        document.head.appendChild(script);
    } else {
        createChart(last7Days, completionsPerDay);
    }
}

/**
 * Get week number of date
 * @param {Date} date - Date object
 * @returns {number} Week number
 */
function getWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Create chart
 * @param {Array} labels - Day labels
 * @param {Array} data - Completion data
 */
function createChart(labels, data) {
    const canvas = document.getElementById('habitsChart');
    if (!canvas) return;
    
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    
    const ctx = canvas.getContext('2d');
    const dayNames = labels.map(d => {
        const date = new Date(d);
        return date.toLocaleDateString('id-ID', { weekday: 'short' });
    });
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayNames,
            datasets: [{
                label: 'Habits Completed',
                data: data,
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} habit${context.raw !== 1 ? 's' : ''} completed`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Completions'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add habit button
    const addBtn = document.getElementById('addHabitBtn');
    const emptyAddBtn = document.getElementById('emptyAddHabitBtn');
    
    const handleAddHabit = async () => {
        const result = await HabitModal.create();
        if (result) {
            await addHabit(result);
        }
    };
    
    if (addBtn) addBtn.addEventListener('click', handleAddHabit);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleAddHabit);
    
    // Edit habit buttons
    document.querySelectorAll('.edit-habit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const habitId = btn.getAttribute('data-habit-id');
            const state = store.getState();
            const habit = state.habits?.find(h => h.habit_id === habitId);
            
            if (habit) {
                const result = await HabitModal.edit(habit);
                if (result) {
                    // Delete old and add new (simplified - in production use update endpoint)
                    await deleteHabit(habitId);
                    await addHabit(result);
                }
            }
        });
    });
    
    // Delete habit buttons
    document.querySelectorAll('.delete-habit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const habitId = btn.getAttribute('data-habit-id');
            await deleteHabit(habitId);
        });
    });
    
    // Habit check buttons
    document.querySelectorAll('.habit-check-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const habitId = btn.getAttribute('data-habit-id');
            if (habitId && !btn.disabled) {
                await updateHabitStreak(habitId);
            }
        });
    });
    
    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            currentFilter = tab.getAttribute('data-filter');
            refreshPage();
        });
    });
}

/**
 * Refresh page content
 */
async function refreshPage() {
    const container = document.querySelector('.habits-container');
    if (container) {
        await loadHabits(true);
        
        const newHtml = render();
        container.innerHTML = newHtml;
        
        setupEventListeners();
        await renderChart();
    }
}

/**
 * Page lifecycle - before render
 */
async function beforeRender() {
    await loadHabits(false);
    return true;
}

/**
 * Page lifecycle - after render
 */
async function afterRender() {
    setupEventListeners();
    await renderChart();
}

/**
 * Page cleanup
 */
function cleanup() {
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
}

// Export page component
const GoalsPage = {
    render,
    beforeRender,
    afterRender,
    cleanup
};

export default GoalsPage;
