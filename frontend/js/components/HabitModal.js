/**
 * Habit Modal Component
 * Reusable modal for creating and editing habits
 */

import { openModal, closeModal } from './Modal.js';
import { validateTitle } from '../utils/validators.js';
import { HABIT_TARGET_OPTIONS } from '../utils/constants.js';

/**
 * Render habit form HTML
 * @param {Object} habit - Existing habit data (for edit mode)
 * @returns {string} HTML string
 */
function renderForm(habit = null) {
    const targetOptions = HABIT_TARGET_OPTIONS.map(opt => `
        <option value="${opt.value}" ${habit?.target === opt.value ? 'selected' : ''}>
            <i class="fas ${opt.value === 'daily' ? 'fa-sun' : 'fa-calendar-week'}"></i>
            ${opt.label}
        </option>
    `).join('');
    
    return `
        <form id="habitForm" class="modal-form">
            <div class="form-group">
                <label for="title">Habit Name *</label>
                <input type="text" id="title" name="title" 
                       value="${escapeHtml(habit?.title || '')}"
                       placeholder="e.g., Read 30 minutes, Exercise, Meditate"
                       required>
                <div class="form-error" id="title_error"></div>
                <small>Choose a specific, measurable habit</small>
            </div>
            
            <div class="form-group">
                <label for="target">Frequency *</label>
                <select id="target" name="target" required>
                    <option value="">Select Frequency</option>
                    ${targetOptions}
                </select>
                <div class="form-error" id="target_error"></div>
                <small>Daily habits are tracked each day. Weekly habits track once per week.</small>
            </div>
            
            <div class="habit-examples">
                <label>Example Habits:</label>
                <div class="example-chips">
                    <button type="button" class="example-chip" data-example="Morning Meditation">Morning Meditation</button>
                    <button type="button" class="example-chip" data-example="Drink 2L Water">Drink 2L Water</button>
                    <button type="button" class="example-chip" data-example="Study 2 Hours">Study 2 Hours</button>
                    <button type="button" class="example-chip" data-example="Go to Gym">Go to Gym</button>
                    <button type="button" class="example-chip" data-example="Read 20 Pages">Read 20 Pages</button>
                    <button type="button" class="example-chip" data-example="Journal">Journal</button>
                </div>
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
    const target = formData.get('target');
    
    const titleValidation = validateTitle(title, 50);
    if (!titleValidation.isValid) {
        errors.title = titleValidation.error;
    }
    
    if (!target) {
        errors.target = 'Frequency is required';
    } else if (target !== 'daily' && target !== 'weekly') {
        errors.target = 'Frequency must be daily or weekly';
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
 * Setup example chips
 */
function setupExampleChips() {
    const chips = document.querySelectorAll('.example-chip');
    const titleInput = document.getElementById('title');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const example = chip.getAttribute('data-example');
            if (titleInput && example) {
                titleInput.value = example;
                // Trigger input event to clear error
                titleInput.dispatchEvent(new Event('input'));
            }
        });
    });
}

/**
 * Open create habit modal
 * @returns {Promise<Object|null>} Habit data or null if cancelled
 */
export async function createHabitModal() {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Add New Habit',
            content: renderForm(),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Create Habit', class: 'btn-primary', action: 'confirm', icon: 'fa-plus' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('habitForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                title: formData.get('title')?.trim(),
                                target: formData.get('target')
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
            const form = document.getElementById('habitForm');
            if (!form) return;
            
            setupExampleChips();
            
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
 * Open edit habit modal
 * @param {Object} habit - Existing habit data
 * @returns {Promise<Object|null>} Updated habit data or null if cancelled
 */
export async function editHabitModal(habit) {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Edit Habit',
            content: renderForm(habit),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Update Habit', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('habitForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                title: formData.get('title')?.trim(),
                                target: formData.get('target')
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
            const form = document.getElementById('habitForm');
            if (!form) return;
            
            setupExampleChips();
            
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

export const HabitModal = {
    create: createHabitModal,
    edit: editHabitModal
};
