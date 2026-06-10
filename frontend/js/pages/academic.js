/**
 * Academic Page Component
 * Manages courses and assignments with tabbed interface
 * Implements PRD Sections ACAD-01 and ACAD-02
 */

import { store, actions } from '../store/globalState.js';
import { coursesAPI, assignmentsAPI } from '../api/endpoints.js';
import { fetchWithCache, invalidateAfterMutation } from '../api/cacheService.js';
import { showToast } from '../components/Toast.js';
import { openModal, confirmModal } from '../components/Modal.js';
import { CACHE_TTL } from '../utils/constants.js';
import { formatDate, formatRelativeTime, getAssignmentStatusClass, getAssignmentStatusText } from '../utils/formatters.js';
import { CourseModal } from '../components/CourseModal.js';
import { AssignmentModal } from '../components/AssignmentModal.js';
import { KanbanBoard } from '../components/KanbanBoard.js';
import { skeletonTable, skeletonCards } from '../components/LoadingSpinner.js';

// State
let currentTab = 'courses';
let currentFilter = 'all';
let currentCourseFilter = 'all';

/**
 * Render academic page
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const isLoading = state.isLoading;
    const courses = state.courses || [];
    const assignments = state.assignments || [];
    
    if (isLoading && !courses.length && !assignments.length) {
        return renderSkeleton();
    }
    
    // Get unique courses for filter dropdown
    const courseOptions = courses.map(c => ({ id: c.course_id, name: c.course_name }));
    
    // Filter assignments
    let filteredAssignments = [...assignments];
    if (currentCourseFilter !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.course_id === currentCourseFilter);
    }
    if (currentFilter !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.status === currentFilter);
    }
    
    const stats = {
        totalCourses: courses.length,
        totalCredits: courses.reduce((sum, c) => sum + (parseInt(c.credits) || 0), 0),
        totalAssignments: assignments.length,
        completedAssignments: assignments.filter(a => a.status === 'done').length,
        pendingAssignments: assignments.filter(a => a.status !== 'done').length
    };
    
    return `
        <div class="academic-container">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h1>Academic Management</h1>
                    <p>Manage your courses and assignments</p>
                </div>
                <div class="header-actions">
                    <button id="addCourseBtn" class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Add Course
                    </button>
                    <button id="addAssignmentBtn" class="btn btn-outline">
                        <i class="fas fa-tasks"></i>
                        Add Assignment
                    </button>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="stats-grid academic-stats">
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-book"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.totalCourses}</div>
                        <div class="stat-label">Courses</div>
                        <div class="stat-change">${stats.totalCredits} total credits</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-tasks"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.totalAssignments}</div>
                        <div class="stat-label">Assignments</div>
                        <div class="stat-change">${stats.completedAssignments} completed</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-clock"></i></div>
                    <div class="stat-info">
                        <div class="stat-value">${stats.pendingAssignments}</div>
                        <div class="stat-label">Pending</div>
                        <div class="stat-change">Need attention</div>
                    </div>
                </div>
            </div>
            
            <!-- Tab Navigation -->
            <div class="tab-navigation">
                <button class="tab-btn ${currentTab === 'courses' ? 'active' : ''}" data-tab="courses">
                    <i class="fas fa-book"></i>
                    Courses
                </button>
                <button class="tab-btn ${currentTab === 'assignments' ? 'active' : ''}" data-tab="assignments">
                    <i class="fas fa-tasks"></i>
                    Assignments
                </button>
                <button class="tab-btn ${currentTab === 'kanban' ? 'active' : ''}" data-tab="kanban">
                    <i class="fas fa-columns"></i>
                    Kanban Board
                </button>
            </div>
            
            <!-- Courses Tab -->
            <div id="coursesTab" class="tab-content ${currentTab === 'courses' ? 'active' : ''}">
                ${renderCoursesTab(courses)}
            </div>
            
            <!-- Assignments Tab -->
            <div id="assignmentsTab" class="tab-content ${currentTab === 'assignments' ? 'active' : ''}">
                ${renderAssignmentsTab(filteredAssignments, courseOptions)}
            </div>
            
            <!-- Kanban Tab -->
            <div id="kanbanTab" class="tab-content ${currentTab === 'kanban' ? 'active' : ''}">
                <div id="kanbanBoardContainer"></div>
            </div>
        </div>
    `;
}

/**
 * Render courses tab
 * @param {Array} courses - List of courses
 * @returns {string} HTML string
 */
function renderCoursesTab(courses) {
    if (courses.length === 0) {
        return `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>No Courses Yet</h3>
                <p>Add your first course to get started with academic tracking.</p>
                <button class="btn btn-primary" id="emptyAddCourseBtn">
                    <i class="fas fa-plus"></i>
                    Add Course
                </button>
            </div>
        `;
    }
    
    // Group courses by semester
    const groupedCourses = {};
    courses.forEach(course => {
        const semester = course.semester || 'Unknown';
        if (!groupedCourses[semester]) groupedCourses[semester] = [];
        groupedCourses[semester].push(course);
    });
    
    // Sort semesters (newest first)
    const sortedSemesters = Object.keys(groupedCourses).sort((a, b) => b.localeCompare(a));
    
    return `
        <div class="courses-container">
            ${sortedSemesters.map(semester => `
                <div class="semester-section">
                    <h3 class="semester-title">
                        <i class="fas fa-calendar-alt"></i>
                        ${escapeHtml(semester)}
                    </h3>
                    <div class="courses-grid">
                        ${groupedCourses[semester].map(course => `
                            <div class="course-card" data-course-id="${course.course_id}">
                                <div class="course-card-header">
                                    <h4>${escapeHtml(course.course_name)}</h4>
                                    <div class="course-actions">
                                        <button class="icon-btn edit-course" data-course-id="${course.course_id}" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="icon-btn delete-course" data-course-id="${course.course_id}" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="course-card-body">
                                    <div class="course-info">
                                        <span><i class="fas fa-layer-group"></i> ${course.credits} Credits</span>
                                        <span><i class="fas fa-chalkboard-user"></i> ${escapeHtml(course.lecturer || 'TBA')}</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Render assignments tab
 * @param {Array} assignments - Filtered assignments
 * @param {Array} courseOptions - Course options for filter
 * @returns {string} HTML string
 */
function renderAssignmentsTab(assignments, courseOptions) {
    return `
        <div class="assignments-filters">
            <div class="filter-group">
                <label>Course:</label>
                <select id="courseFilter">
                    <option value="all">All Courses</option>
                    ${courseOptions.map(c => `
                        <option value="${c.id}" ${currentCourseFilter === c.id ? 'selected' : ''}>
                            ${escapeHtml(c.name)}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label>Status:</label>
                <select id="statusFilter">
                    <option value="all" ${currentFilter === 'all' ? 'selected' : ''}>All</option>
                    <option value="pending" ${currentFilter === 'pending' ? 'selected' : ''}>Not Started</option>
                    <option value="progress" ${currentFilter === 'progress' ? 'selected' : ''}>In Progress</option>
                    <option value="done" ${currentFilter === 'done' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
        </div>
        
        <div class="assignments-table-container">
            ${assignments.length === 0 ? `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Assignments</h3>
                    <p>Add your first assignment to track your tasks.</p>
                    <button class="btn btn-primary" id="emptyAddAssignmentBtn">
                        <i class="fas fa-plus"></i>
                        Add Assignment
                    </button>
                </div>
            ` : `
                <table class="assignments-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Course</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignments.map(assignment => `
                            <tr data-assignment-id="${assignment.assignment_id}">
                                <td class="assignment-title">${escapeHtml(assignment.title)}</td>
                                <td>${escapeHtml(getCourseName(assignment.course_id))}</td>
                                <td class="deadline-cell ${getDeadlineClass(assignment.deadline)}">
                                    <i class="fas fa-calendar-alt"></i>
                                    ${formatRelativeTime(assignment.deadline)}
                                    <small>${formatDate(assignment.deadline, 'date')}</small>
                                </td>
                                <td>
                                    <select class="status-select" data-assignment-id="${assignment.assignment_id}">
                                        <option value="pending" ${assignment.status === 'pending' ? 'selected' : ''}>Not Started</option>
                                        <option value="progress" ${assignment.status === 'progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="done" ${assignment.status === 'done' ? 'selected' : ''}>Completed</option>
                                    </select>
                                </td>
                                <td class="actions-cell">
                                    <button class="icon-btn edit-assignment" data-assignment-id="${assignment.assignment_id}" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="icon-btn delete-assignment" data-assignment-id="${assignment.assignment_id}" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `}
        </div>
    `;
}

/**
 * Render skeleton loader
 * @returns {string} HTML string
 */
function renderSkeleton() {
    return `
        <div class="academic-container">
            <div class="page-header">
                <div>
                    <div class="skeleton" style="width: 200px; height: 32px;"></div>
                    <div class="skeleton" style="width: 250px; height: 20px; margin-top: 8px;"></div>
                </div>
            </div>
            <div class="stats-grid">
                ${skeletonCards(3)}
            </div>
            <div class="tab-navigation">
                <div class="skeleton" style="width: 100px; height: 40px;"></div>
                <div class="skeleton" style="width: 100px; height: 40px;"></div>
            </div>
            ${skeletonTable(4, 4)}
        </div>
    `;
}

/**
 * Get course name by ID
 * @param {string} courseId - Course ID
 * @returns {string} Course name
 */
function getCourseName(courseId) {
    const state = store.getState();
    const course = state.courses?.find(c => c.course_id === courseId);
    return course?.course_name || 'Unknown Course';
}

/**
 * Get deadline CSS class
 * @param {string} deadline - Deadline date
 * @returns {string} CSS class
 */
function getDeadlineClass(deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'deadline-overdue';
    if (diffDays === 0) return 'deadline-today';
    if (diffDays <= 3) return 'deadline-soon';
    return '';
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
 * Load courses data
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadCourses(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getCourses',
            () => coursesAPI.getAll(),
            {},
            CACHE_TTL.COURSES,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const courses = result.data.data || result.data;
            actions.setCourses(courses);
        }
    } catch (error) {
        console.error('Load courses error:', error);
        showToast('Failed to load courses', 'error');
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Load assignments data
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadAssignments(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getAssignments',
            () => assignmentsAPI.getAll(),
            {},
            CACHE_TTL.ASSIGNMENTS,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const assignments = result.data.data || result.data;
            actions.setAssignments(assignments);
        }
    } catch (error) {
        console.error('Load assignments error:', error);
        showToast('Failed to load assignments', 'error');
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Add new course
 * @param {Object} courseData - Course data
 */
async function addCourse(courseData) {
    actions.setLoading(true);
    
    try {
        const response = await coursesAPI.add(courseData);
        
        if (response.success) {
            showToast('Course added successfully', 'success');
            invalidateAfterMutation('addCourse');
            await loadCourses(true);
            return true;
        } else {
            showToast(response.message || 'Failed to add course', 'error');
            return false;
        }
    } catch (error) {
        console.error('Add course error:', error);
        showToast('Failed to add course', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Update course
 * @param {string} courseId - Course ID
 * @param {Object} updates - Updated data
 */
async function updateCourse(courseId, updates) {
    actions.setLoading(true);
    
    try {
        const response = await coursesAPI.update(courseId, updates);
        
        if (response.success) {
            showToast('Course updated successfully', 'success');
            invalidateAfterMutation('updateCourse');
            await loadCourses(true);
            return true;
        } else {
            showToast(response.message || 'Failed to update course', 'error');
            return false;
        }
    } catch (error) {
        console.error('Update course error:', error);
        showToast('Failed to update course', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Delete course
 * @param {string} courseId - Course ID
 */
async function deleteCourse(courseId) {
    const confirmed = await confirmModal(
        'Delete Course',
        'Are you sure you want to delete this course? All associated assignments will also be deleted.',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return false;
    
    actions.setLoading(true);
    
    try {
        const response = await coursesAPI.delete(courseId);
        
        if (response.success) {
            showToast('Course deleted successfully', 'success');
            invalidateAfterMutation('deleteCourse');
            await Promise.all([loadCourses(true), loadAssignments(true)]);
            return true;
        } else {
            showToast(response.message || 'Failed to delete course', 'error');
            return false;
        }
    } catch (error) {
        console.error('Delete course error:', error);
        showToast('Failed to delete course', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Add new assignment
 * @param {Object} assignmentData - Assignment data
 */
async function addAssignment(assignmentData) {
    actions.setLoading(true);
    
    try {
        const response = await assignmentsAPI.add(assignmentData);
        
        if (response.success) {
            showToast('Assignment added successfully', 'success');
            invalidateAfterMutation('addAssignment');
            await loadAssignments(true);
            return true;
        } else {
            showToast(response.message || 'Failed to add assignment', 'error');
            return false;
        }
    } catch (error) {
        console.error('Add assignment error:', error);
        showToast('Failed to add assignment', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Update assignment
 * @param {string} assignmentId - Assignment ID
 * @param {Object} updates - Updated data
 */
async function updateAssignment(assignmentId, updates) {
    actions.setLoading(true);
    
    try {
        const response = await assignmentsAPI.update(assignmentId, updates);
        
        if (response.success) {
            showToast('Assignment updated successfully', 'success');
            invalidateAfterMutation('updateAssignment');
            await loadAssignments(true);
            return true;
        } else {
            showToast(response.message || 'Failed to update assignment', 'error');
            return false;
        }
    } catch (error) {
        console.error('Update assignment error:', error);
        showToast('Failed to update assignment', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Update assignment status
 * @param {string} assignmentId - Assignment ID
 * @param {string} status - New status
 */
async function updateAssignmentStatus(assignmentId, status) {
    try {
        const response = await assignmentsAPI.updateStatus(assignmentId, status);
        
        if (response.success) {
            invalidateAfterMutation('updateAssignmentStatus');
            await loadAssignments(true);
            return true;
        } else {
            console.error('Status update failed:', response.message);
            return false;
        }
    } catch (error) {
        console.error('Update status error:', error);
        return false;
    }
}

/**
 * Delete assignment
 * @param {string} assignmentId - Assignment ID
 */
async function deleteAssignment(assignmentId) {
    const confirmed = await confirmModal(
        'Delete Assignment',
        'Are you sure you want to delete this assignment?',
        'Delete',
        'Cancel'
    );
    
    if (!confirmed) return false;
    
    actions.setLoading(true);
    
    try {
        const response = await assignmentsAPI.delete(assignmentId);
        
        if (response.success) {
            showToast('Assignment deleted successfully', 'success');
            invalidateAfterMutation('deleteAssignment');
            await loadAssignments(true);
            return true;
        } else {
            showToast(response.message || 'Failed to delete assignment', 'error');
            return false;
        }
    } catch (error) {
        console.error('Delete assignment error:', error);
        showToast('Failed to delete assignment', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Setup course event listeners
 */
function setupCourseEvents() {
    // Edit course buttons
    document.querySelectorAll('.edit-course').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const courseId = btn.getAttribute('data-course-id');
            const state = store.getState();
            const course = state.courses?.find(c => c.course_id === courseId);
            
            if (course) {
                const result = await CourseModal.edit(course);
                if (result) {
                    await updateCourse(courseId, result);
                }
            }
        });
    });
    
    // Delete course buttons
    document.querySelectorAll('.delete-course').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const courseId = btn.getAttribute('data-course-id');
            await deleteCourse(courseId);
        });
    });
}

/**
 * Setup assignment event listeners
 */
function setupAssignmentEvents() {
    // Edit assignment buttons
    document.querySelectorAll('.edit-assignment').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const assignmentId = btn.getAttribute('data-assignment-id');
            const state = store.getState();
            const assignment = state.assignments?.find(a => a.assignment_id === assignmentId);
            
            if (assignment) {
                const result = await AssignmentModal.edit(assignment);
                if (result) {
                    await updateAssignment(assignmentId, result);
                }
            }
        });
    });
    
    // Delete assignment buttons
    document.querySelectorAll('.delete-assignment').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const assignmentId = btn.getAttribute('data-assignment-id');
            await deleteAssignment(assignmentId);
        });
    });
    
    // Status select change
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const assignmentId = select.getAttribute('data-assignment-id');
            const newStatus = select.value;
            await updateAssignmentStatus(assignmentId, newStatus);
        });
    });
}

/**
 * Setup filter events
 */
function setupFilterEvents() {
    const courseFilter = document.getElementById('courseFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (courseFilter) {
        courseFilter.addEventListener('change', (e) => {
            currentCourseFilter = e.target.value;
            refreshPage();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            currentFilter = e.target.value;
            refreshPage();
        });
    }
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = btn.getAttribute('data-tab');
            currentTab = tab;
            refreshPage();
        });
    });
}

/**
 * Setup add buttons
 */
function setupAddButtons() {
    const addCourseBtn = document.getElementById('addCourseBtn');
    const emptyAddCourseBtn = document.getElementById('emptyAddCourseBtn');
    const addAssignmentBtn = document.getElementById('addAssignmentBtn');
    const emptyAddAssignmentBtn = document.getElementById('emptyAddAssignmentBtn');
    
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', async () => {
            const result = await CourseModal.create();
            if (result) {
                await addCourse(result);
            }
        });
    }
    
    if (emptyAddCourseBtn) {
        emptyAddCourseBtn.addEventListener('click', async () => {
            const result = await CourseModal.create();
            if (result) {
                await addCourse(result);
            }
        });
    }
    
    if (addAssignmentBtn) {
        addAssignmentBtn.addEventListener('click', async () => {
            const state = store.getState();
            const result = await AssignmentModal.create(state.courses || []);
            if (result) {
                await addAssignment(result);
            }
        });
    }
    
    if (emptyAddAssignmentBtn) {
        emptyAddAssignmentBtn.addEventListener('click', async () => {
            const state = store.getState();
            const result = await AssignmentModal.create(state.courses || []);
            if (result) {
                await addAssignment(result);
            }
        });
    }
}

/**
 * Initialize kanban board
 */
function initKanbanBoard() {
    const container = document.getElementById('kanbanBoardContainer');
    if (container && currentTab === 'kanban') {
        const state = store.getState();
        const assignments = state.assignments || [];
        const courses = state.courses || [];
        
        const kanban = new KanbanBoard(container, assignments, courses);
        kanban.onStatusChange = async (assignmentId, newStatus) => {
            await updateAssignmentStatus(assignmentId, newStatus);
        };
        kanban.render();
    }
}

/**
 * Refresh page content
 */
async function refreshPage() {
    const container = document.getElementById('coursesTab');
    if (container) {
        const state = store.getState();
        const courses = state.courses || [];
        const assignments = state.assignments || [];
        const courseOptions = courses.map(c => ({ id: c.course_id, name: c.course_name }));
        
        // Filter assignments
        let filteredAssignments = [...assignments];
        if (currentCourseFilter !== 'all') {
            filteredAssignments = filteredAssignments.filter(a => a.course_id === currentCourseFilter);
        }
        if (currentFilter !== 'all') {
            filteredAssignments = filteredAssignments.filter(a => a.status === currentFilter);
        }
        
        // Update tabs content
        const coursesTab = document.getElementById('coursesTab');
        const assignmentsTab = document.getElementById('assignmentsTab');
        
        if (coursesTab && currentTab === 'courses') {
            coursesTab.innerHTML = renderCoursesTab(courses);
            setupCourseEvents();
        }
        
        if (assignmentsTab && currentTab === 'assignments') {
            assignmentsTab.innerHTML = renderAssignmentsTab(filteredAssignments, courseOptions);
            setupAssignmentEvents();
            setupFilterEvents();
        }
        
        if (currentTab === 'kanban') {
            initKanbanBoard();
        }
        
        // Re-setup add buttons
        setupAddButtons();
    }
}

/**
 * Page lifecycle - before render
 */
async function beforeRender() {
    const state = store.getState();
    
    // Load data if not exists
    if (!state.courses || state.courses.length === 0) {
        await loadCourses(false);
    }
    if (!state.assignments || state.assignments.length === 0) {
        await loadAssignments(false);
    }
    
    return true;
}

/**
 * Page lifecycle - after render
 */
async function afterRender() {
    setupCourseEvents();
    setupAssignmentEvents();
    setupFilterEvents();
    setupTabNavigation();
    setupAddButtons();
    initKanbanBoard();
}

// Export page component
const AcademicPage = {
    render,
    beforeRender,
    afterRender
};

export default AcademicPage;
