/**
 * Note Modal Component
 * Reusable modal for creating, editing, and viewing notes
 * Supports rich text content
 */

import { openModal, closeModal } from './Modal.js';
import { validateTitle, validateNoteContent } from '../utils/validators.js';
import { NOTE_CATEGORIES } from '../utils/constants.js';

/**
 * Render note form HTML
 * @param {Object} note - Existing note data (for edit mode)
 * @param {string} mode - 'create', 'edit', or 'view'
 * @returns {string} HTML string
 */
function renderForm(note = null, mode = 'create') {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const isCreate = mode === 'create';
    
    const categoryOptions = NOTE_CATEGORIES.map(cat => `
        <option value="${cat}" ${note?.category === cat ? 'selected' : ''}>
            ${cat}
        </option>
    `).join('');
    
    const readonlyAttr = isView ? 'readonly' : '';
    const disabledAttr = isView ? 'disabled' : '';
    
    return `
        <form id="noteForm" class="modal-form">
            <div class="form-group">
                <label for="title">Title *</label>
                <input type="text" id="title" name="title" 
                       value="${escapeHtml(note?.title || '')}"
                       placeholder="Enter note title"
                       ${readonlyAttr}
                       required>
                <div class="form-error" id="title_error"></div>
            </div>
            
            <div class="form-group">
                <label for="category">Category</label>
                <select id="category" name="category" ${disabledAttr}>
                    <option value="Other" ${!note?.category ? 'selected' : ''}>Select Category</option>
                    ${categoryOptions}
                </select>
                <div class="form-error" id="category_error"></div>
            </div>
            
            <div class="form-group">
                <label for="content">Content</label>
                <div class="rich-text-toolbar ${isView ? 'hidden' : ''}" id="richTextToolbar">
                    <button type="button" data-command="bold" title="Bold"><i class="fas fa-bold"></i></button>
                    <button type="button" data-command="italic" title="Italic"><i class="fas fa-italic"></i></button>
                    <button type="button" data-command="underline" title="Underline"><i class="fas fa-underline"></i></button>
                    <span class="toolbar-sep"></span>
                    <button type="button" data-command="insertUnorderedList" title="Bullet List"><i class="fas fa-list-ul"></i></button>
                    <button type="button" data-command="insertOrderedList" title="Numbered List"><i class="fas fa-list-ol"></i></button>
                    <span class="toolbar-sep"></span>
                    <button type="button" data-command="createLink" title="Insert Link"><i class="fas fa-link"></i></button>
                    <button type="button" data-command="unlink" title="Remove Link"><i class="fas fa-unlink"></i></button>
                </div>
                <div id="contentEditor" 
                     contenteditable="${!isView}"
                     class="rich-text-editor ${isView ? 'readonly' : ''}"
                     placeholder="Write your note content here...">
                    ${note?.content || ''}
                </div>
                <textarea id="content" name="content" style="display: none;">${escapeHtml(note?.content || '')}</textarea>
                <div class="form-error" id="content_error"></div>
                <small>You can format your text using the toolbar above.</small>
            </div>
            
            ${isView ? `
                <div class="note-metadata">
                    <div class="meta-item">
                        <i class="fas fa-calendar-alt"></i>
                        <span>Created: ${formatDate(note?.created_at, 'datetime') || '-'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-edit"></i>
                        <span>Updated: ${formatDate(note?.updated_at, 'datetime') || '-'}</span>
                    </div>
                </div>
            ` : ''}
        </form>
    `;
}

/**
 * Format date helper
 */
function formatDate(dateStr, format = 'datetime') {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    if (format === 'date') {
        return date.toLocaleDateString('id-ID');
    }
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
 * Setup rich text editor
 * @param {boolean} isView - Whether in view mode
 */
function setupRichTextEditor(isView = false) {
    const editor = document.getElementById('contentEditor');
    const textarea = document.getElementById('content');
    const toolbar = document.getElementById('richTextToolbar');
    
    if (!editor) return;
    
    if (isView) {
        editor.setAttribute('contenteditable', 'false');
        if (toolbar) toolbar.style.display = 'none';
        return;
    }
    
    // Sync content to textarea before submit
    const syncContent = () => {
        if (textarea && editor) {
            textarea.value = editor.innerHTML;
        }
    };
    
    editor.addEventListener('input', syncContent);
    editor.addEventListener('blur', syncContent);
    
    // Setup toolbar buttons
    if (toolbar) {
        const buttons = toolbar.querySelectorAll('[data-command]');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const command = btn.getAttribute('data-command');
                
                if (command === 'createLink') {
                    const url = prompt('Enter URL:', 'https://');
                    if (url) {
                        document.execCommand(command, false, url);
                    }
                } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
                    document.execCommand(command, false, null);
                } else {
                    document.execCommand(command, false, null);
                }
                editor.focus();
                syncContent();
            });
        });
    }
    
    // Initial sync
    syncContent();
}

/**
 * Validate form data
 * @param {Object} formData - Form data
 * @returns {Object} Validation result
 */
function validateForm(formData) {
    const errors = {};
    
    const title = formData.get('title')?.trim();
    const content = formData.get('content')?.trim();
    
    const titleValidation = validateTitle(title, 100);
    if (!titleValidation.isValid) {
        errors.title = titleValidation.error;
    }
    
    const contentValidation = validateNoteContent(content);
    if (!contentValidation.isValid) {
        errors.content = contentValidation.error;
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
 * Open create note modal
 * @returns {Promise<Object|null>} Note data or null if cancelled
 */
export async function createNoteModal() {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Create New Note',
            content: renderForm(null, 'create'),
            size: 'lg',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Save Note', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners('create');
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('noteForm');
                        const textarea = document.getElementById('content');
                        if (form && textarea) {
                            const formData = new FormData(form);
                            resolve({
                                title: formData.get('title')?.trim(),
                                category: formData.get('category') || 'Other',
                                content: textarea.value
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
            setupRichTextEditor(false);
            
            const form = document.getElementById('noteForm');
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
                    
                    const textarea = document.getElementById('content');
                    const formData = new FormData(form);
                    if (textarea) {
                        formData.set('content', textarea.value);
                    }
                    
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
 * Open edit note modal
 * @param {Object} note - Existing note data
 * @returns {Promise<Object|null>} Updated note data or null if cancelled
 */
export async function editNoteModal(note) {
    return new Promise((resolve) => {
        let isResolved = false;
        
        openModal({
            title: 'Edit Note',
            content: renderForm(note, 'edit'),
            size: 'lg',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Update Note', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupFormListeners();
            },
            onClose: (result) => {
                if (!isResolved) {
                    isResolved = true;
                    if (result === true) {
                        const form = document.getElementById('noteForm');
                        const textarea = document.getElementById('content');
                        if (form && textarea) {
                            const formData = new FormData(form);
                            resolve({
                                title: formData.get('title')?.trim(),
                                category: formData.get('category') || 'Other',
                                content: textarea.value
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
            setupRichTextEditor(false);
            
            const form = document.getElementById('noteForm');
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
                    
                    const textarea = document.getElementById('content');
                    const formData = new FormData(form);
                    if (textarea) {
                        formData.set('content', textarea.value);
                    }
                    
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
 * Open view note modal (read-only)
 * @param {Object} note - Note data
 * @returns {Promise<void>}
 */
export async function viewNoteModal(note) {
    return new Promise((resolve) => {
        openModal({
            title: note.title,
            content: renderForm(note, 'view'),
            size: 'lg',
            closable: true,
            closeOnOverlay: true,
            buttons: [
                { text: 'Close', class: 'btn-primary', action: 'confirm' }
            ],
            onOpen: () => {
                setupRichTextEditor(true);
            },
            onClose: () => {
                resolve();
            }
        });
    });
}

export const NoteModal = {
    create: createNoteModal,
    edit: editNoteModal,
    view: viewNoteModal
};
