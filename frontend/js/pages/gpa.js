/**
 * GPA Tracker Page Component
 * Manages grades, calculates IPS per semester and IPK cumulative
 * Implements PRD Sections GPA-01 and GPA-02
 */

import { store, actions } from '../store/globalState.js';
import { gradesAPI } from '../api/endpoints.js';
import { fetchWithCache, invalidateAfterMutation } from '../api/cacheService.js';
import { showToast } from '../components/Toast.js';
import { openModal, confirmModal } from '../components/Modal.js';
import { GradeModal } from '../components/GradeModal.js';
import { CACHE_TTL } from '../utils/constants.js';
import { 
    calculateAllSemestersGPA, 
    calculateRequiredGPA,
    getPerformanceDescription,
    getGPAColor,
    getGradeLetterFromNumeric
} from '../utils/gpaCalculator.js';
import { formatGPA, formatNumber } from '../utils/formatters.js';
import { skeletonTable } from '../components/LoadingSpinner.js';

// State
let currentSemesterFilter = 'all';
let chartInstance = null;

/**
 * Render GPA page
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const isLoading = state.isLoading;
    const grades = state.grades || [];
    const courses = state.courses || [];
    
    if (isLoading && !grades.length) {
        return renderSkeleton();
    }
    
    // Calculate GPA data
    const gpaData = calculateAllSemestersGPA(grades);
    const cumulativeGPA = gpaData.cumulative.gpa;
    const performanceDesc = getPerformanceDescription(cumulativeGPA);
    const gpaColorClass = getGPAColor(cumulativeGPA);
    
    // Filter semesters if needed
    let semestersToShow = gpaData.semesters;
    if (currentSemesterFilter !== 'all') {
        semestersToShow = semestersToShow.filter(s => s === currentSemesterFilter);
    }
    
    return `
        <div class="gpa-container">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h1>GPA Tracker</h1>
                    <p>Track your academic performance across semesters</p>
                </div>
                <button id="addGradeBtn" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Add Grade
                </button>
            </div>
            
            <!-- Cumulative GPA Card -->
            <div class="cumulative-gpa-card ${gpaColorClass}">
                <div class="cumulative-gpa-content">
                    <div class="cumulative-gpa-value">
                        <span class="gpa-number">${formatGPA(cumulativeGPA)}</span>
                        <span class="gpa-label">Cumulative GPA</span>
                    </div>
                    <div class="cumulative-gpa-stats">
                        <div class="stat">
                            <span class="stat-value">${gpaData.cumulative.totalCourses}</span>
                            <span class="stat-label">Courses</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">${gpaData.cumulative.totalCredits}</span>
                            <span class="stat-label">Credits</span>
                        </div>
                    </div>
                    <div class="cumulative-gpa-message">
                        <i class="fas fa-chart-line"></i>
                        ${performanceDesc}
                    </div>
                </div>
            </div>
            
            <!-- Semester Filter -->
            <div class="semester-filter">
                <label>Filter by Semester:</label>
                <select id="semesterFilter">
                    <option value="all" ${currentSemesterFilter === 'all' ? 'selected' : ''}>All Semesters</option>
                    ${gpaData.semesters.map(s => `
                        <option value="${s}" ${currentSemesterFilter === s ? 'selected' : ''}>
                            ${escapeHtml(s)}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <!-- GPA Chart Container -->
            <div class="gpa-chart-container">
                <canvas id="gpaChart"></canvas>
            </div>
            
            <!-- Semester Cards -->
            <div class="semester-cards">
                ${semestersToShow.map(semester => {
                    const semesterData = gpaData.bySemester[semester];
                    const semesterGpa = semesterData?.gpa || 0;
                    const semesterColorClass = getGPAColor(semesterGpa);
                    
                    // Get grades for this semester
                    const semesterGrades = grades.filter(g => g.semester === semester);
                    
                    return `
                        <div class="semester-card">
                            <div class="semester-card-header">
                                <h3>${escapeHtml(semester)}</h3>
                                <div class="semester-gpa ${semesterColorClass}">
                                    <span class="gpa-value">${formatGPA(semesterGpa)}</span>
                                    <span class="gpa-label">IPS</span>
                                </div>
                            </div>
                            <div class="semester-card-stats">
                                <div class="stat">
                                    <span class="stat-value">${semesterData?.totalCredits || 0}</span>
                                    <span class="stat-label">Credits</span>
                                </div>
                                <div class="stat">
                                    <span class="stat-value">${semesterData?.courseCount || 0}</span>
                                    <span class="stat-label">Courses</span>
                                </div>
                            </div>
                            <div class="semester-grades-table-container">
                                <table class="grades-table">
                                    <thead>
                                        <tr>
                                            <th>Course</th>
                                            <th>Credits</th>
                                            <th>Grade</th>
                                            <th>Points</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${semesterGrades.map(grade => {
                                            const course = courses.find(c => c.course_id === grade.course_id);
                                            const gradePoints = (parseFloat(grade.grade) || 0) * (parseFloat(grade.credits) || 0);
                                            return `
                                                <tr data-grade-id="${grade.grade_id}">
                                                    <td class="course-name">${escapeHtml(course?.course_name || 'Unknown Course')}</td>
                                                    <td>${grade.credits}</td>
                                                    <td class="grade-cell">
                                                        <span class="grade-badge grade-${getGradeClass(grade.grade)}">
                                                            ${formatGPA(grade.grade)} (${getGradeLetterFromNumeric(grade.grade)})
                                                        </span>
                                                    </td>
                                                    <td>${formatNumber(gradePoints)}</td>
                                                    <td class="actions-cell">
                                                        <button class="icon-btn edit-grade" data-grade-id="${grade.grade_id}" title="Edit">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="icon-btn delete-grade" data-grade-id="${grade.grade_id}" title="Delete">
                                                            <i class="fas fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                    <tfoot>
                                        <tr class="total-row">
                                            <td><strong>Total</strong></td>
                                            <td><strong>${semesterData?.totalCredits || 0}</strong></td>
                                            <td><strong>${formatGPA(semesterGpa)}</strong></td>
                                            <td><strong>${formatNumber(semesterData?.totalPoints || 0)}</strong></td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${semestersToShow.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>No Grades Yet</h3>
                    <p>Add your first grade to start tracking your GPA.</p>
                    <button class="btn btn-primary" id="emptyAddGradeBtn">
                        <i class="fas fa-plus"></i>
                        Add Grade
                    </button>
                </div>
            ` : ''}
            
            <!-- GPA Target Calculator Section -->
            <div class="gpa-target-card">
                <h3><i class="fas fa-bullseye"></i> GPA Target Calculator</h3>
                <p>Calculate what GPA you need in remaining credits to achieve your target</p>
                <div class="target-calculator">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Target GPA</label>
                            <input type="number" id="targetGPA" step="0.1" min="0" max="4" placeholder="3.5">
                        </div>
                        <div class="form-group">
                            <label>Remaining Credits</label>
                            <input type="number" id="remainingCredits" step="1" min="0" placeholder="30">
                        </div>
                        <div class="form-group" style="display: flex; align-items: flex-end;">
                            <button id="calculateTargetBtn" class="btn btn-primary">
                                <i class="fas fa-calculator"></i>
                                Calculate
                            </button>
                        </div>
                    </div>
                    <div id="targetResult" class="target-result" style="display: none;"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get grade CSS class
 * @param {number} grade - Grade value
 * @returns {string} CSS class
 */
function getGradeClass(grade) {
    const g = parseFloat(grade);
    if (isNaN(g)) return 'e';
    if (g >= 3.5) return 'a';
    if (g >= 2.5) return 'b';
    if (g >= 1.5) return 'c';
    if (g >= 1.0) return 'd';
    return 'e';
}

/**
 * Render skeleton loader
 * @returns {string} HTML string
 */
function renderSkeleton() {
    return `
        <div class="gpa-container">
            <div class="page-header">
                <div>
                    <div class="skeleton" style="width: 150px; height: 32px;"></div>
                    <div class="skeleton" style="width: 200px; height: 20px; margin-top: 8px;"></div>
                </div>
            </div>
            <div class="skeleton" style="height: 150px; border-radius: 16px; margin-bottom: 24px;"></div>
            ${skeletonTable(4, 4)}
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
 * Load grades data
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadGrades(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getGrades',
            () => gradesAPI.getAll(),
            {},
            CACHE_TTL.GRADES,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const grades = result.data.data || result.data;
            actions.setGrades(grades);
            return grades;
        }
    } catch (error) {
        console.error('Load grades error:', error);
        showToast('Failed to load grades', 'error');
    } finally {
        actions.setLoading(false);
    }
    
    return [];
}

/**
 * Load courses for grade dropdown
 */
async function loadCourses() {
    const state = store.getState();
    if (!state.courses || state.courses.length === 0) {
        const { coursesAPI } = await import('../api/endpoints.js');
        try {
            const result = await fetchWithCache(
                'getCourses',
                () => coursesAPI.getAll(),
                {},
                CACHE_TTL.COURSES,
                false
            );
            if (result.data && result.data.success !== false) {
                const courses = result.data.data || result.data;
                actions.setCourses(courses);
            }
        } catch (error) {
            console.error('Load courses for grades error:', error);
        }
    }
}

/**
 * Add new grade
 * @param {Object} gradeData - Grade data
 */
async function addGrade(gradeData) {
    actions.setLoading(true);
    
    try {
        const response = await gradesAPI.add(gradeData);
        
        if (response.success) {
            showToast('Grade added successfully', 'success');
            invalidateAfterMutation('addGrade');
            await loadGrades(true);
            renderChart();
            return true;
        } else {
            showToast(response.message || 'Failed to add grade', 'error');
            return false;
        }
    } catch (error) {
        console.error('Add grade error:', error);
        showToast('Failed to add grade', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Delete grade
 * @param {string} gradeId - Grade ID
 */
async function deleteGrade(gradeId) {
    const confirmed = await confirmModal(
        'Delete Grade',
        'Are you sure you want to delete this grade? This will affect your GPA calculation.',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return false;
    
    actions.setLoading(true);
    
    try {
        const response = await gradesAPI.delete(gradeId);
        
        if (response.success) {
            showToast('Grade deleted successfully', 'success');
            invalidateAfterMutation('deleteGrade');
            await loadGrades(true);
            renderChart();
            return true;
        } else {
            showToast(response.message || 'Failed to delete grade', 'error');
            return false;
        }
    } catch (error) {
        console.error('Delete grade error:', error);
        showToast('Failed to delete grade', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Render GPA chart using Chart.js
 */
async function renderChart() {
    const canvas = document.getElementById('gpaChart');
    if (!canvas) return;
    
    const state = store.getState();
    const grades = state.grades || [];
    const gpaData = calculateAllSemestersGPA(grades);
    
    // Destroy existing chart
    if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        // Load Chart.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
        script.onload = () => createChart(gpaData);
        document.head.appendChild(script);
    } else {
        createChart(gpaData);
    }
}

/**
 * Create chart instance
 * @param {Object} gpaData - GPA calculation data
 */
function createChart(gpaData) {
    const canvas = document.getElementById('gpaChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const semesters = gpaData.semesters;
    const gpaValues = semesters.map(s => gpaData.bySemester[s]?.gpa || 0);
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: semesters.map(s => {
                // Shorten semester label for display
                return s.replace(' - Odd Semester', ' Odd').replace(' - Even Semester', ' Even');
            }),
            datasets: [{
                label: 'Semester GPA (IPS)',
                data: gpaValues,
                backgroundColor: gpaValues.map(gpa => {
                    if (gpa >= 3.5) return 'rgba(16, 185, 129, 0.7)';
                    if (gpa >= 3.0) return 'rgba(59, 130, 246, 0.7)';
                    if (gpa >= 2.5) return 'rgba(245, 158, 11, 0.7)';
                    if (gpa >= 2.0) return 'rgba(249, 115, 22, 0.7)';
                    return 'rgba(239, 68, 68, 0.7)';
                }),
                borderColor: gpaValues.map(gpa => {
                    if (gpa >= 3.5) return 'rgb(16, 185, 129)';
                    if (gpa >= 3.0) return 'rgb(59, 130, 246)';
                    if (gpa >= 2.5) return 'rgb(245, 158, 11)';
                    if (gpa >= 2.0) return 'rgb(249, 115, 22)';
                    return 'rgb(239, 68, 68)';
                }),
                borderWidth: 1,
                borderRadius: 8
            }, {
                label: 'Cumulative GPA (IPK)',
                data: semesters.map(() => gpaData.cumulative.gpa),
                type: 'line',
                borderColor: 'rgb(139, 92, 246)',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 6
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
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.raw.toFixed(2);
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 4,
                    title: {
                        display: true,
                        text: 'GPA Score'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Semester'
                    }
                }
            }
        }
    });
}

/**
 * Calculate and display target GPA
 */
function calculateTarget() {
    const targetGPA = parseFloat(document.getElementById('targetGPA').value);
    const remainingCredits = parseFloat(document.getElementById('remainingCredits').value);
    
    if (isNaN(targetGPA) || targetGPA < 0 || targetGPA > 4) {
        showToast('Please enter a valid target GPA (0-4)', 'error');
        return;
    }
    
    if (isNaN(remainingCredits) || remainingCredits < 0) {
        showToast('Please enter valid remaining credits', 'error');
        return;
    }
    
    const state = store.getState();
    const grades = state.grades || [];
    const result = calculateRequiredGPA(grades, targetGPA, remainingCredits);
    
    const resultDiv = document.getElementById('targetResult');
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="target-result-content ${result.possible ? 'success' : 'error'}">
                <i class="fas ${result.possible ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
                <div>
                    <strong>${result.possible ? 'Achievable!' : 'Not Achievable'}</strong>
                    <p>${result.message}</p>
                    ${result.possible ? `<small>Current GPA: ${result.currentGPA.toFixed(2)} | Required GPA: ${result.requiredGPA.toFixed(2)}</small>` : ''}
                </div>
            </div>
        `;
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Add grade button
    const addGradeBtn = document.getElementById('addGradeBtn');
    const emptyAddGradeBtn = document.getElementById('emptyAddGradeBtn');
    
    const handleAddGrade = async () => {
        const state = store.getState();
        const courses = state.courses || [];
        
        if (courses.length === 0) {
            showToast('Please add courses before adding grades', 'warning');
            return;
        }
        
        const result = await GradeModal.create(courses);
        if (result) {
            await addGrade(result);
        }
    };
    
    if (addGradeBtn) addGradeBtn.addEventListener('click', handleAddGrade);
    if (emptyAddGradeBtn) emptyAddGradeBtn.addEventListener('click', handleAddGrade);
    
    // Edit grade buttons
    document.querySelectorAll('.edit-grade').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const gradeId = btn.getAttribute('data-grade-id');
            const state = store.getState();
            const grade = state.grades?.find(g => g.grade_id === gradeId);
            const courses = state.courses || [];
            
            if (grade) {
                const result = await GradeModal.edit(grade, courses);
                if (result) {
                    // Delete old and add new (simplified - in production use update endpoint)
                    await deleteGrade(gradeId);
                    await addGrade(result);
                }
            }
        });
    });
    
    // Delete grade buttons
    document.querySelectorAll('.delete-grade').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const gradeId = btn.getAttribute('data-grade-id');
            await deleteGrade(gradeId);
        });
    });
    
    // Semester filter
    const semesterFilter = document.getElementById('semesterFilter');
    if (semesterFilter) {
        semesterFilter.addEventListener('change', (e) => {
            currentSemesterFilter = e.target.value;
            refreshPage();
        });
    }
    
    // Target calculator
    const calculateBtn = document.getElementById('calculateTargetBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateTarget);
    }
}

/**
 * Refresh page content
 */
async function refreshPage() {
    const container = document.querySelector('.gpa-container');
    if (container) {
        const state = store.getState();
        const grades = state.grades || [];
        const courses = state.courses || [];
        const gpaData = calculateAllSemestersGPA(grades);
        
        // Re-render
        const newHtml = render();
        container.innerHTML = newHtml;
        
        // Re-attach event listeners
        setupEventListeners();
        
        // Re-render chart
        await renderChart();
    }
}

/**
 * Page lifecycle - before render
 */
async function beforeRender() {
    // Load courses first (needed for grade dropdown)
    await loadCourses();
    // Load grades
    await loadGrades(false);
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
const GPAPage = {
    render,
    beforeRender,
    afterRender,
    cleanup
};

export default GPAPage;
