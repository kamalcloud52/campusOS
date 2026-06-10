/**
 * Transaction Modal Component
 * Reusable modal for creating income/expense transactions
 */

import { openModal, closeModal } from './Modal.js';
import { validateAmount, validateDate } from '../utils/validators.js';
import { FINANCE_CATEGORIES, TRANSACTION_TYPE_OPTIONS } from '../utils/constants.js';

/**
 * Render transaction form HTML
 * @param {Object} transaction - Existing transaction data (for edit mode)
 * @returns {string} HTML string
 */
function renderForm(transaction = null) {
    const today = new Date().toISOString().split('T')[0];
    const type = transaction?.type || 'expense';
    
    // Get categories based on type
    const categories = type === 'income' 
        ? FINANCE_CATEGORIES.INCOME 
        : FINANCE_CATEGORIES.EXPENSE;
    
    const categoryOptions = categories.map(cat => `
        <option value="${cat}" ${transaction?.category === cat ? 'selected' : ''}>
            ${cat}
        </option>
    `).join('');
    
    const typeOptions = TRANSACTION_TYPE_OPTIONS.map(opt => `
        <option value="${opt.value}" ${transaction?.type === opt.value ? 'selected' : ''}>
            <i class="fas ${opt.icon}"></i> ${opt.label}
        </option>
    `).join('');
    
    return `
        <form id="transactionForm" class="modal-form">
            <div class="form-group">
                <label for="type">Transaction Type *</label>
                <select id="type" name="type" required>
                    ${typeOptions}
                </select>
                <div class="form-error" id="type_error"></div>
            </div>
            
            <div class="form-group">
                <label for="category">Category *</label>
                <select id="category" name="category" required>
                    <option value="">Select Category</option>
                    ${categoryOptions}
                </select>
                <div class="form-error" id="category_error"></div>
            </div>
            
            <div class="form-row">
                <div class="form-group half">
                    <label for="amount">Amount *</label>
                    <div class="input-prefix">
                        <span class="prefix">Rp</span>
                        <input type="number" id="amount" name="amount" 
                               value="${transaction?.amount || ''}"
                               step="1000" min="0" placeholder="0" required>
                    </div>
                    <div class="form-error" id="amount_error"></div>
                </div>
                
                <div class="form-group half">
                    <label for="date">Date *</label>
                    <input type="date" id="date" name="date" 
                           value="${transaction?.date || today}" required>
                    <div class="form-error" id="date_error"></div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="notes">Notes (Optional)</label>
                <textarea id="notes" name="notes" rows="3" 
                          placeholder="e.g., Grocery shopping, Freelance payment...">${escapeHtml(transaction?.notes || '')}</textarea>
                <div class="form-error" id="notes_error"></div>
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
 * Update category options when type changes
 */
function setupCategoryUpdate() {
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    
    if (typeSelect && categorySelect) {
        typeSelect.addEventListener('change', () => {
            const type = typeSelect.value;
            const categories = type === 'income' 
                ? FINANCE_CATEGORIES.INCOME 
                : FINANCE_CATEGORIES.EXPENSE;
            
            categorySelect.innerHTML = '<option value="">Select Category</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
    
    const type = formData.get('type');
    const category = formData.get('category');
    const amount = formData.get('amount');
    const date = formData.get('date');
    const notes = formData.get('notes');
    
    if (!type) {
        errors.type = 'Transaction type is required';
    }
    
    if (!category) {
        errors.category = 'Category is required';
    }
    
    if (!amount) {
        errors.amount = 'Amount is required';
    } else {
        const amountValidation = validateAmount(amount);
        if (!amountValidation.isValid) {
            errors.amount = amountValidation.error;
        }
    }
    
    if (!date) {
        errors.date = 'Date is required';
    } else {
        const dateValidation = validateDate(date);
        if (!dateValidation.isValid) {
            errors.date = dateValidation.error;
        }
    }
    
    if (notes && notes.length > 200) {
        errors.notes = 'Notes must not exceed 200 characters';
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
 * Open create transaction modal
 * @returns {Promise<Object|null>} Transaction data or null if cancelled
 */
export async function createTransactionModal() {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Add Transaction',
            content: renderForm(),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Save Transaction', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('transactionForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                type: formData.get('type'),
                                category: formData.get('category'),
                                amount: parseFloat(formData.get('amount')),
                                date: formData.get('date'),
                                notes: formData.get('notes')?.trim() || ''
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
            const form = document.getElementById('transactionForm');
            if (!form) return;
            
            setupCategoryUpdate();
            
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
 * Open edit transaction modal
 * @param {Object} transaction - Existing transaction data
 * @returns {Promise<Object|null>} Updated transaction data or null if cancelled
 */
export async function editTransactionModal(transaction) {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Edit Transaction',
            content: renderForm(transaction),
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Update Transaction', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('transactionForm');
                        if (form) {
                            const formData = new FormData(form);
                            resolve({
                                type: formData.get('type'),
                                category: formData.get('category'),
                                amount: parseFloat(formData.get('amount')),
                                date: formData.get('date'),
                                notes: formData.get('notes')?.trim() || ''
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
            const form = document.getElementById('transactionForm');
            if (!form) return;
            
            setupCategoryUpdate();
            
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

export const TransactionModal = {
    create: createTransactionModal,
    edit: editTransactionModal
};
