/**
 * Assignment Modal Component
 * Reusable modal for creating and editing assignments
 */

import { openModal, closeModal } from './Modal.js';
import { validateTitle, validateFutureDate } from '../utils/validators.js';

/**
 * Render assignment form HTML
 * @param {Object} assignment - Existing assignment data (for edit mode)
 * @param {Array} courses - List of courses for dropdown
 * @returns {string} HTML string
 */
function renderForm(assignment = null, courses = []) {
    const isEdit = !!assignment;
    const today = new Date().toISOString().split('T')[0];
    const deadlineValue = assignment?.deadline ? assignment.deadline.split('T')[0] : today;
    
    const courseOptions = courses.map(course => `
        <option value="${course.course_id}" ${assignment?.course_id === course.course_id ? 'selected' : ''}>
            ${escapeHtml(course.course_name)}
        </option>
    `).join('');
    
    const statusOptions = [
        { value: 'pending', label: 'Not Started' },
        { value: 'progress', label: 'In Progress' },
        { value: 'done', label: 'Completed' }
    ];
    
    const statusHtml = statusOptions.map(opt => `
        <option value="${opt.value}" ${assignment?.status === opt.value ? 'selected' : ''}>
            ${opt.label}
        </option>
    `).join('');
    
    return `
        <form id="assignmentForm" class="modal-form">
            <div class="form-group">
                <label for="title">Assignment Title *</label>
                <input type="text" id="title" name="title" 
                       value="${escapeHtml(assignment?.title || '')}"
                       placeholder="e.g., Final Project Proposal" required>
                <div class="form-error" id="title_error"></div>
            </div>
            
            <div class="form-group">
                <label for="course_id">Course *</label>
                <select id="course_id" name="course_id" required>
                    <option value="">Select Course</option>
                    ${courseOptions}
                </select>
                <div class="form-error" id="course_id_error"></div>
            </div>
            
            <div class="form-row">
                <div class="form-group half">
                    <label for="deadline">Deadline *</label>
                    <input type="date" id="deadline" name="deadline" 
                           value="${deadlineValue}" required>
                    <div class="form-error" id="deadline_error"></div>
                </div>
                
                ${isEdit ? `
                    <div class="form-group half">
                        <label for="status">Status</label>
                        <select id="status" name="status">
                            ${statusHtml}
                        </select>
                    </div>
                ` : ''}
            </div>
            
            <div class="form-group">
                <label for="description">Description (Optional)</label>
                <textarea id="description" name="description" rows="4"
                          placeholder="Add any additional details about this assignment...">${escapeHtml(assignment?.description || '')}</textarea>
                <div class="form-error" id="description_error"></div>
            </div>
        </form>
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
 * Validate form data
 * @param {FormData} formData - Form data
 * @returns {Object} Validation result
 */
function validateForm(formData) {
    const errors = {};
    
    const title = formData.get('title')?.trim();
    const courseId = formData.get('course_id');
    const deadline = formData.get('deadline');
    const description = formData.get('description')?.trim();
    
    const titleValidation = validateTitle(title, 100);
    if (!titleValidation.isValid) {
        errors.title = titleValidation.error;
    }
    
    if (!courseId) {
        errors.course_id = 'Course is required';
    }
    
    const deadlineValidation = validateFutureDate(deadline);
    if (!deadlineValidation.isValid) {
        errors.deadline = deadlineValidation.error;
    }
    
    if (description && description.length > 500) {
        errors.description = 'Description must not exceed 500 characters';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Show field errors
 * @param {Object} errors - Error object
 */
function showErrors(errors) {
    for (const [field, message] of Object.entries(errors)) {
        const errorEl = document.getElementById(`${field}_error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        const inputEl = document.getElementById(field);
        if (inputEl) {
            inputEl.classList.add('error');
        }
    }
}

/**
 * Clear all errors
 */
function clearErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const inputs = document.querySelectorAll('.modal-form input, .modal-form select, .modal-form textarea');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

/**
 * Open create assignment modal
 * @param {Array} courses - List of courses
 * @returns {Promise<Object|null>} Assignment data or null if cancelled
 */
export async function createAssignmentModal(courses = []) {
    if (courses.length === 0) {
        // Show error if no courses exist
        return new Promise((resolve) => {
            openModal({
                title: 'Cannot Add Assignment',
                content: '<p>You need to add a course before creating assignments.</p>',
                size: 'sm',
                buttons: [
                    { text: 'OK', class: 'btn-primary', action: 'confirm' }
                ],
                onClose: () => resolve(null)
            });
        });
    }
    
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Add New Assignment',
            content: renderForm(null, courses),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Save Assignment', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('assignmentForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                title: formData.get('title')?.trim(),
                                course_id: formData.get('course_id'),
                                deadline: formData.get('deadline'),
                                description: formData.get('description')?.trim() || '',
                                status: 'pending'
                            });
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                }
            }
        });
        
        function setupFormListeners() {
            const form = document.getElementById('assignmentForm');
            if (!form) return;
            
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    const field = input.getAttribute('name') || input.id;
                    const errorEl = document.getElementById(`${field}_error`);
                    if (errorEl) {
                        errorEl.textContent = '';
                        errorEl.style.display = 'none';
                    }
                    input.classList.remove('error');
                });
            });
            
            const confirmBtn = document.querySelector('[data-modal-action="confirm"]');
            if (confirmBtn) {
                confirmBtn.onclick = (e) => {
                    e.preventDefault();
                    clearErrors();
                    
                    const formData = new FormData(form);
                    const validation = validateForm(formData);
                    
                    if (validation.isValid) {
                        if (!isResolved) {
                            isResolved = true;
                            closeModal(true);
                        }
                    } else {
                        showErrors(validation.errors);
                    }
                };
            }
        }
    });
}

/**
 * Open edit assignment modal
 * @param {Object} assignment - Existing assignment data
 * @param {Array} courses - List of courses
 * @returns {Promise<Object|null>} Updated assignment data or null if cancelled
 */
export async function editAssignmentModal(assignment, courses = []) {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Edit Assignment',
            content: renderForm(assignment, courses),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Update Assignment', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('assignmentForm');
                        if (form) {
                            const formData = new FormData(form);
                            const updates = {
                                title: formData.get('title')?.trim(),
                                course_id: formData.get('course_id'),
                                deadline: formData.get('deadline'),
                                description: formData.get('description')?.trim() || ''
                            };
                            const status = formData.get('status');
                            if (status) {
                                updates.status = status;
                            }
                            resolve(updates);
                        } else {
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                }
            }
        });
        
        function setupFormListeners() {
            const form = document.getElementById('assignmentForm');
            if (!form) return;
            
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    const field = input.getAttribute('name') || input.id;
                    const errorEl = document.getElementById(`${field}_error`);
                    if (errorEl) {
                        errorEl.textContent = '';
                        errorEl.style.display = 'none';
                    }
                    input.classList.remove('error');
                });
            });
            
            const confirmBtn = document.querySelector('[data-modal-action="confirm"]');
            if (confirmBtn) {
                confirmBtn.onclick = (e) => {
                    e.preventDefault();
                    clearErrors();
                    
                    const formData = new FormData(form);
                    const validation = validateForm(formData);
                    
                    if (validation.isValid) {
                        if (!isResolved) {
                            isResolved = true;
                            closeModal(true);
                        }
                    } else {
                        showErrors(validation.errors);
                    }
                };
            }
        }
    });
}

export const AssignmentModal = {
    create: createAssignmentModal,
    edit: editAssignmentModal
};
