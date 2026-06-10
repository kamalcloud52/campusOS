/**
 * Finance Tracker Page Component
 * Manages income and expense transactions with monthly summaries
 * Implements PRD Sections FIN-01 and FIN-02
 */

import { store, actions } from '../store/globalState.js';
import { financeAPI } from '../api/endpoints.js';
import { fetchWithCache, invalidateAfterMutation } from '../api/cacheService.js';
import { showToast } from '../components/Toast.js';
import { confirmModal } from '../components/Modal.js';
import { TransactionModal } from '../components/TransactionModal.js';
import { CACHE_TTL, FINANCE_CATEGORIES, CHART_COLORS } from '../utils/constants.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { skeletonTable } from '../components/LoadingSpinner.js';

// State
let currentMonth = null;
let chartInstance = null;
let pieChartInstance = null;

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month
 */
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Render finance page
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const isLoading = state.isLoading;
    const transactions = state.transactions || [];
    
    if (isLoading && !transactions.length) {
        return renderSkeleton();
    }
    
    if (!currentMonth) {
        currentMonth = getCurrentMonth();
    }
    
    // Filter transactions by month
    const monthTransactions = transactions.filter(t => 
        t.date && t.date.startsWith(currentMonth)
    );
    
    // Calculate summaries
    const summary = calculateSummary(monthTransactions);
    const expenseByCategory = calculateExpenseByCategory(monthTransactions);
    
    // Get available months from transactions
    const availableMonths = getAvailableMonths(transactions);
    
    return `
        <div class="finance-container">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h1>Finance Tracker</h1>
                    <p>Track your income and expenses</p>
                </div>
                <button id="addTransactionBtn" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Add Transaction
                </button>
            </div>
            
            <!-- Month Selector -->
            <div class="month-selector">
                <button id="prevMonthBtn" class="icon-btn" title="Previous Month">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="month-display">
                    <i class="fas fa-calendar-alt"></i>
                    <span id="currentMonth">${formatMonthDisplay(currentMonth)}</span>
                </div>
                <button id="nextMonthBtn" class="icon-btn" title="Next Month">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <select id="monthSelect" class="month-select">
                    <option value="">Select Month</option>
                    ${availableMonths.map(month => `
                        <option value="${month}" ${month === currentMonth ? 'selected' : ''}>
                            ${formatMonthDisplay(month)}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <!-- Summary Cards -->
            <div class="finance-summary-cards">
                <div class="summary-card income-card">
                    <div class="summary-icon">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <div class="summary-info">
                        <div class="summary-label">Total Income</div>
                        <div class="summary-value">${formatCurrency(summary.income)}</div>
                    </div>
                </div>
                <div class="summary-card expense-card">
                    <div class="summary-icon">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                    <div class="summary-info">
                        <div class="summary-label">Total Expense</div>
                        <div class="summary-value">${formatCurrency(summary.expense)}</div>
                    </div>
                </div>
                <div class="summary-card balance-card ${summary.balance >= 0 ? 'positive' : 'negative'}">
                    <div class="summary-icon">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div class="summary-info">
                        <div class="summary-label">Balance</div>
                        <div class="summary-value">${formatCurrency(summary.balance)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Charts Row -->
            <div class="finance-charts-row">
                <!-- Expense by Category Chart -->
                <div class="chart-card">
                    <h3><i class="fas fa-chart-pie"></i> Expenses by Category</h3>
                    <div class="chart-container">
                        <canvas id="expensePieChart"></canvas>
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div class="quick-stats-card">
                    <h3><i class="fas fa-chart-line"></i> Quick Stats</h3>
                    <div class="quick-stats-list">
                        <div class="quick-stat">
                            <span class="stat-label">Total Transactions</span>
                            <span class="stat-value">${monthTransactions.length}</span>
                        </div>
                        <div class="quick-stat">
                            <span class="stat-label">Average Daily Spend</span>
                            <span class="stat-value">${formatCurrency(summary.avgDailyExpense)}</span>
                        </div>
                        <div class="quick-stat">
                            <span class="stat-label">Savings Rate</span>
                            <span class="stat-value">${summary.savingsRate}%</span>
                        </div>
                        <div class="quick-stat">
                            <span class="stat-label">Top Expense Category</span>
                            <span class="stat-value">${summary.topCategory || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Transactions Table -->
            <div class="transactions-card">
                <div class="card-header">
                    <h3><i class="fas fa-list"></i> Transactions</h3>
                    <div class="transaction-filters">
                        <select id="typeFilter" class="filter-select">
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                </div>
                <div class="transactions-table-container">
                    ${monthTransactions.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-receipt"></i>
                            <h3>No Transactions</h3>
                            <p>Add your first transaction to start tracking your finances.</p>
                            <button class="btn btn-primary" id="emptyAddTransactionBtn">
                                <i class="fas fa-plus"></i>
                                Add Transaction
                            </button>
                        </div>
                    ` : `
                        <table class="transactions-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${monthTransactions.map(transaction => `
                                    <tr data-transaction-id="${transaction.transaction_id}" class="transaction-row ${transaction.type}">
                                        <td>${formatDate(transaction.date, 'date')}</td>
                                        <td class="transaction-notes">
                                            ${escapeHtml(transaction.notes || '-')}
                                            ${transaction.notes ? `<small>${escapeHtml(transaction.notes.substring(0, 50))}</small>` : ''}
                                        </td>
                                        <td>
                                            <span class="category-badge">${escapeHtml(transaction.category)}</span>
                                        </td>
                                        <td class="amount-cell ${transaction.type}">
                                            ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
                                        </td>
                                        <td class="actions-cell">
                                            <button class="icon-btn delete-transaction" data-transaction-id="${transaction.transaction_id}" title="Delete">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="3"><strong>Total</strong></td>
                                    <td class="total-income">Income: ${formatCurrency(summary.income)}</td>
                                    <td></td>
                                </tr>
                                <tr class="total-row">
                                    <td colspan="3"></td>
                                    <td class="total-expense">Expense: ${formatCurrency(summary.expense)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    `}
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
        <div class="finance-container">
            <div class="page-header">
                <div>
                    <div class="skeleton" style="width: 150px; height: 32px;"></div>
                    <div class="skeleton" style="width: 200px; height: 20px; margin-top: 8px;"></div>
                </div>
            </div>
            <div class="finance-summary-cards">
                ${[1, 2, 3].map(() => `
                    <div class="skeleton" style="height: 100px; border-radius: 16px;"></div>
                `).join('')}
            </div>
            ${skeletonTable(5, 4)}
        </div>
    `;
}

/**
 * Calculate summary for transactions
 * @param {Array} transactions - List of transactions
 * @returns {Object} Summary data
 */
function calculateSummary(transactions) {
    let income = 0;
    let expense = 0;
    
    for (const t of transactions) {
        const amount = parseFloat(t.amount) || 0;
        if (t.type === 'income') {
            income += amount;
        } else if (t.type === 'expense') {
            expense += amount;
        }
    }
    
    const balance = income - expense;
    const savingsRate = income > 0 ? ((balance / income) * 100).toFixed(1) : 0;
    
    // Calculate average daily expense
    const daysInMonth = new Date(currentMonth + '-01').getMonth() + 1;
    const avgDailyExpense = expense / daysInMonth;
    
    // Find top expense category
    const expenseByCategory = calculateExpenseByCategory(transactions);
    let topCategory = '-';
    let topAmount = 0;
    for (const [category, amount] of Object.entries(expenseByCategory)) {
        if (amount > topAmount) {
            topAmount = amount;
            topCategory = category;
        }
    }
    
    return {
        income,
        expense,
        balance,
        savingsRate,
        avgDailyExpense: avgDailyExpense || 0,
        topCategory
    };
}

/**
 * Calculate expense by category
 * @param {Array} transactions - List of transactions
 * @returns {Object} Expense by category
 */
function calculateExpenseByCategory(transactions) {
    const expenseByCategory = {};
    
    for (const t of transactions) {
        if (t.type === 'expense') {
            const category = t.category || 'Other';
            const amount = parseFloat(t.amount) || 0;
            expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
        }
    }
    
    return expenseByCategory;
}

/**
 * Get available months from transactions
 * @param {Array} transactions - List of transactions
 * @returns {Array} Unique months in YYYY-MM format
 */
function getAvailableMonths(transactions) {
    const months = new Set();
    for (const t of transactions) {
        if (t.date && t.date.length >= 7) {
            months.add(t.date.substring(0, 7));
        }
    }
    
    // Sort descending (newest first)
    return Array.from(months).sort().reverse();
}

/**
 * Format month display
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} Formatted month
 */
function formatMonthDisplay(month) {
    if (!month) return '';
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
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
 * Load transactions data
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadTransactions(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getFinance',
            () => financeAPI.getAll(currentMonth),
            { month: currentMonth },
            CACHE_TTL.FINANCE,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const transactions = result.data.data || result.data;
            actions.setTransactions(transactions);
            return transactions;
        }
    } catch (error) {
        console.error('Load transactions error:', error);
        showToast('Failed to load transactions', 'error');
    } finally {
        actions.setLoading(false);
    }
    
    return [];
}

/**
 * Add new transaction
 * @param {Object} transactionData - Transaction data
 */
async function addTransaction(transactionData) {
    actions.setLoading(true);
    
    try {
        const response = await financeAPI.add(transactionData);
        
        if (response.success) {
            showToast('Transaction added successfully', 'success');
            invalidateAfterMutation('addTransaction');
            await loadTransactions(true);
            renderPieChart();
            return true;
        } else {
            showToast(response.message || 'Failed to add transaction', 'error');
            return false;
        }
    } catch (error) {
        console.error('Add transaction error:', error);
        showToast('Failed to add transaction', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Delete transaction
 * @param {string} transactionId - Transaction ID
 */
async function deleteTransaction(transactionId) {
    const confirmed = await confirmModal(
        'Delete Transaction',
        'Are you sure you want to delete this transaction?',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return false;
    
    actions.setLoading(true);
    
    try {
        const response = await financeAPI.delete(transactionId);
        
        if (response.success) {
            showToast('Transaction deleted successfully', 'success');
            invalidateAfterMutation('deleteTransaction');
            await loadTransactions(true);
            renderPieChart();
            return true;
        } else {
            showToast(response.message || 'Failed to delete transaction', 'error');
            return false;
        }
    } catch (error) {
        console.error('Delete transaction error:', error);
        showToast('Failed to delete transaction', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Render expense pie chart
 */
async function renderPieChart() {
    const canvas = document.getElementById('expensePieChart');
    if (!canvas) return;
    
    const state = store.getState();
    const transactions = state.transactions || [];
    const monthTransactions = transactions.filter(t => 
        t.date && t.date.startsWith(currentMonth) && t.type === 'expense'
    );
    const expenseByCategory = calculateExpenseByCategory(monthTransactions);
    
    // Destroy existing chart
    if (pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
    }
    
    const categories = Object.keys(expenseByCategory);
    const amounts = categories.map(c => expenseByCategory[c]);
    
    if (categories.length === 0) {
        // Show no data message
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = '#9CA3AF';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data for this month', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => createPieChart(categories, amounts);
        document.head.appendChild(script);
    } else {
        createPieChart(categories, amounts);
    }
}

/**
 * Create pie chart
 * @param {Array} categories - Category labels
 * @param {Array} amounts - Amount values
 */
function createPieChart(categories, amounts) {
    const canvas = document.getElementById('expensePieChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Generate colors
    const colors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    
    pieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors.slice(0, categories.length),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Change month
 * @param {number} delta - Month delta (-1 for prev, 1 for next)
 */
function changeMonth(delta) {
    if (!currentMonth) {
        currentMonth = getCurrentMonth();
    }
    
    const [year, month] = currentMonth.split('-').map(Number);
    let newYear = year;
    let newMonth = month + delta;
    
    if (newMonth < 1) {
        newMonth = 12;
        newYear--;
    } else if (newMonth > 12) {
        newMonth = 1;
        newYear++;
    }
    
    currentMonth = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    refreshPage();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add transaction button
    const addBtn = document.getElementById('addTransactionBtn');
    const emptyAddBtn = document.getElementById('emptyAddTransactionBtn');
    
    const handleAddTransaction = async () => {
        const result = await TransactionModal.create();
        if (result) {
            await addTransaction(result);
        }
    };
    
    if (addBtn) addBtn.addEventListener('click', handleAddTransaction);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleAddTransaction);
    
    // Delete transaction buttons
    document.querySelectorAll('.delete-transaction').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const transactionId = btn.getAttribute('data-transaction-id');
            await deleteTransaction(transactionId);
        });
    });
    
    // Month navigation
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const monthSelect = document.getElementById('monthSelect');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changeMonth(-1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changeMonth(1));
    }
    if (monthSelect) {
        monthSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                currentMonth = e.target.value;
                refreshPage();
            }
        });
    }
    
    // Type filter
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.addEventListener('change', (e) => {
            filterTransactions(e.target.value);
        });
    }
}

/**
 * Filter transactions by type
 * @param {string} type - 'all', 'income', or 'expense'
 */
function filterTransactions(type) {
    const rows = document.querySelectorAll('.transaction-row');
    rows.forEach(row => {
        if (type === 'all') {
            row.style.display = '';
        } else if (type === 'income' && row.classList.contains('income')) {
            row.style.display = '';
        } else if (type === 'expense' && row.classList.contains('expense')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Refresh page content
 */
async function refreshPage() {
    const container = document.querySelector('.finance-container');
    if (container) {
        await loadTransactions(true);
        
        const newHtml = render();
        container.innerHTML = newHtml;
        
        setupEventListeners();
        renderPieChart();
        
        // Update month display
        const monthSpan = document.getElementById('currentMonth');
        if (monthSpan) {
            monthSpan.textContent = formatMonthDisplay(currentMonth);
        }
    }
}

/**
 * Page lifecycle - before render
 */
async function beforeRender() {
    await loadTransactions(false);
    return true;
}

/**
 * Page lifecycle - after render
 */
async function afterRender() {
    setupEventListeners();
    await renderPieChart();
}

/**
 * Page cleanup
 */
function cleanup() {
    if (pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
    }
}

// Export page component
const FinancePage = {
    render,
    beforeRender,
    afterRender,
    cleanup
};

export default FinancePage;
