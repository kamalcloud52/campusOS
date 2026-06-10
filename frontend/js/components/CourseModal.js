/**
 * Course Modal Component
 * Reusable modal for creating and editing courses
 */

import { openModal, closeModal } from './Modal.js';
import { validateCourseName, validateCredits } from '../utils/validators.js';
import { SEMESTER_OPTIONS } from '../utils/constants.js';

/**
 * Render course form HTML
 * @param {Object} course - Existing course data (for edit mode)
 * @returns {string} HTML string
 */
function renderForm(course = null) {
    const isEdit = !!course;
    const semesterOptions = SEMESTER_OPTIONS.map(opt => `
        <option value="${opt.label}" ${course?.semester === opt.label ? 'selected' : ''}>
            ${opt.label}
        </option>
    `).join('');
    
    return `
        <form id="courseForm" class="modal-form">
            <div class="form-group">
                <label for="course_name">Course Name *</label>
                <input type="text" id="course_name" name="course_name" 
                       value="${escapeHtml(course?.course_name || '')}"
                       placeholder="e.g., Web Development" required>
                <div class="form-error" id="course_name_error"></div>
            </div>
            
            <div class="form-row">
                <div class="form-group half">
                    <label for="credits">Credits *</label>
                    <input type="number" id="credits" name="credits" 
                           value="${course?.credits || ''}"
                           min="1" max="6" step="1" required>
                    <div class="form-error" id="credits_error"></div>
                </div>
                
                <div class="form-group half">
                    <label for="semester">Semester *</label>
                    <select id="semester" name="semester" required>
                        <option value="">Select Semester</option>
                        ${semesterOptions}
                    </select>
                    <div class="form-error" id="semester_error"></div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="lecturer">Lecturer</label>
                <input type="text" id="lecturer" name="lecturer" 
                       value="${escapeHtml(course?.lecturer || '')}"
                       placeholder="e.g., Dr. John Doe">
                <div class="form-error" id="lecturer_error"></div>
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
    
    const courseName = formData.get('course_name')?.trim();
    const credits = formData.get('credits');
    const semester = formData.get('semester');
    
    const nameValidation = validateCourseName(courseName);
    if (!nameValidation.isValid) {
        errors.course_name = nameValidation.error;
    }
    
    const creditsValidation = validateCredits(credits);
    if (!creditsValidation.isValid) {
        errors.credits = creditsValidation.error;
    }
    
    if (!semester) {
        errors.semester = 'Semester is required';
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
    
    const inputs = document.querySelectorAll('.modal-form input, .modal-form select');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

/**
 * Open create course modal
 * @returns {Promise<Object|null>} Course data or null if cancelled
 */
export async function createCourseModal() {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Add New Course',
            content: renderForm(),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Save Course', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('courseForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                course_name: formData.get('course_name')?.trim(),
                                credits: parseInt(formData.get('credits')),
                                semester: formData.get('semester'),
                                lecturer: formData.get('lecturer')?.trim() || ''
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
            const form = document.getElementById('courseForm');
            if (!form) return;
            
            // Clear errors on input
            const inputs = form.querySelectorAll('input, select');
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
            
            // Override confirm button behavior
            const confirmBtn = document.querySelector('[data-modal-action="confirm"]');
            if (confirmBtn) {
                const originalClick = confirmBtn.onclick;
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
 * Open edit course modal
 * @param {Object} course - Existing course data
 * @returns {Promise<Object|null>} Updated course data or null if cancelled
 */
export async function editCourseModal(course) {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Edit Course',
            content: renderForm(course),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Update Course', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('courseForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                course_name: formData.get('course_name')?.trim(),
                                credits: parseInt(formData.get('credits')),
                                semester: formData.get('semester'),
                                lecturer: formData.get('lecturer')?.trim() || ''
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
            const form = document.getElementById('courseForm');
            if (!form) return;
            
            const inputs = form.querySelectorAll('input, select');
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

export const CourseModal = {
    create: createCourseModal,
    edit: editCourseModal
};
