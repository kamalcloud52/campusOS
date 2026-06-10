/**
 * Grade Modal Component
 * Reusable modal for creating and editing grades
 */

import { openModal, closeModal } from './Modal.js';
import { validateGrade, validateCredits, validateSemester } from '../utils/validators.js';
import { GRADE_OPTIONS, SEMESTER_OPTIONS } from '../utils/constants.js';

/**
 * Render grade form HTML
 * @param {Object} grade - Existing grade data (for edit mode)
 * @param {Array} courses - List of courses for dropdown
 * @returns {string} HTML string
 */
function renderForm(grade = null, courses = []) {
    const isEdit = !!grade;
    
    const courseOptions = courses.map(course => `
        <option value="${course.course_id}" ${grade?.course_id === course.course_id ? 'selected' : ''}>
            ${escapeHtml(course.course_name)} (${course.credits} credits)
        </option>
    `).join('');
    
    const gradeOptions = GRADE_OPTIONS.map(opt => `
        <option value="${opt.value}" ${grade?.grade == opt.value ? 'selected' : ''}>
            ${opt.label}
        </option>
    `).join('');
    
    const semesterOptions = SEMESTER_OPTIONS.map(opt => `
        <option value="${opt.label}" ${grade?.semester === opt.label ? 'selected' : ''}>
            ${opt.label}
        </option>
    `).join('');
    
    return `
        <form id="gradeForm" class="modal-form">
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
                    <label for="semester">Semester *</label>
                    <select id="semester" name="semester" required>
                        <option value="">Select Semester</option>
                        ${semesterOptions}
                    </select>
                    <div class="form-error" id="semester_error"></div>
                </div>
                
                <div class="form-group half">
                    <label for="grade">Grade *</label>
                    <select id="grade" name="grade" required>
                        <option value="">Select Grade</option>
                        ${gradeOptions}
                    </select>
                    <div class="form-error" id="grade_error"></div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="credits">Credits *</label>
                <input type="number" id="credits" name="credits" 
                       value="${grade?.credits || ''}"
                       min="1" max="6" step="1" required>
                <div class="form-error" id="credits_error"></div>
                <small>Credits will auto-fill from course selection</small>
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
 * Auto-fill credits when course is selected
 * @param {Array} courses - List of courses
 */
function setupAutoFillCredits(courses) {
    const courseSelect = document.getElementById('course_id');
    const creditsInput = document.getElementById('credits');
    
    if (courseSelect && creditsInput) {
        courseSelect.addEventListener('change', () => {
            const selectedCourseId = courseSelect.value;
            const selectedCourse = courses.find(c => c.course_id === selectedCourseId);
            if (selectedCourse && selectedCourse.credits) {
                creditsInput.value = selectedCourse.credits;
            }
        });
    }
}

/**
 * Validate form data
 * @param {FormData} formData - Form data
 * @returns {Object} Validation result
 */
function validateForm(formData) {
    const errors = {};
    
    const courseId = formData.get('course_id');
    const semester = formData.get('semester');
    const grade = formData.get('grade');
    const credits = formData.get('credits');
    
    if (!courseId) {
        errors.course_id = 'Course is required';
    }
    
    if (!semester) {
        errors.semester = 'Semester is required';
    } else {
        const semesterValidation = validateSemester(semester);
        if (!semesterValidation.isValid) {
            errors.semester = semesterValidation.error;
        }
    }
    
    if (!grade) {
        errors.grade = 'Grade is required';
    } else {
        const gradeValidation = validateGrade(grade);
        if (!gradeValidation.isValid) {
            errors.grade = gradeValidation.error;
        }
    }
    
    if (!credits) {
        errors.credits = 'Credits are required';
    } else {
        const creditsValidation = validateCredits(credits);
        if (!creditsValidation.isValid) {
            errors.credits = creditsValidation.error;
        }
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
 * Open create grade modal
 * @param {Array} courses - List of courses
 * @returns {Promise<Object|null>} Grade data or null if cancelled
 */
export async function createGradeModal(courses = []) {
    if (courses.length === 0) {
        return new Promise((resolve) => {
            openModal({
                title: 'Cannot Add Grade',
                content: '<p>You need to add courses before adding grades.</p>',
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
            title: 'Add New Grade',
            content: renderForm(null, courses),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Save Grade', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners(courses);
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('gradeForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                course_id: formData.get('course_id'),
                                semester: formData.get('semester'),
                                grade: parseFloat(formData.get('grade')),
                                credits: parseInt(formData.get('credits'))
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
        
        function setupFormListeners(coursesList) {
            const form = document.getElementById('gradeForm');
            if (!form) return;
            
            // Auto-fill credits
            setupAutoFillCredits(coursesList);
            
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
 * Open edit grade modal
 * @param {Object} grade - Existing grade data
 * @param {Array} courses - List of courses
 * @returns {Promise<Object|null>} Updated grade data or null if cancelled
 */
export async function editGradeModal(grade, courses = []) {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Edit Grade',
            content: renderForm(grade, courses),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Update Grade', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners(courses);
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('gradeForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                course_id: formData.get('course_id'),
                                semester: formData.get('semester'),
                                grade: parseFloat(formData.get('grade')),
                                credits: parseInt(formData.get('credits'))
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
        
        function setupFormListeners(coursesList) {
            const form = document.getElementById('gradeForm');
            if (!form) return;
            
            setupAutoFillCredits(coursesList);
            
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

export const GradeModal = {
    create: createGradeModal,
    edit: editGradeModal
};
