/**
 * Modal Component
 * Reusable modal dialog for forms, confirmations, and alerts
 */

/**
 * Modal configuration
 * @typedef {Object} ModalOptions
 * @property {string} title - Modal title
 * @property {string} content - Modal content HTML
 * @property {string} size - Modal size: 'sm', 'md', 'lg', 'xl'
 * @property {boolean} closable - Show close button (default: true)
 * @property {boolean} closeOnOverlay - Close when clicking overlay (default: true)
 * @property {Array} buttons - Footer buttons configuration
 * @property {Function} onOpen - Callback when modal opens
 * @property {Function} onClose - Callback when modal closes
 */

let currentModal = null;
let overlayElement = null;

/**
 * Create modal overlay if not exists
 */
function ensureOverlay() {
    if (!overlayElement) {
        overlayElement = document.createElement('div');
        overlayElement.className = 'modal-overlay';
        document.body.appendChild(overlayElement);
    }
    return overlayElement;
}

/**
 * Build modal HTML
 * @param {ModalOptions} options - Modal options
 * @returns {string} HTML string
 */
function buildModalHTML(options) {
    const sizeClass = options.size ? `modal-${options.size}` : 'modal-md';
    const showCloseBtn = options.closable !== false;
    
    let buttonsHtml = '';
    if (options.buttons && options.buttons.length) {
        buttonsHtml = `
            <div class="modal-footer">
                ${options.buttons.map(btn => `
                    <button class="btn ${btn.class || 'btn-secondary'}" data-modal-action="${btn.action || 'custom'}">
                        ${btn.icon ? `<i class="fas ${btn.icon}"></i>` : ''}
                        ${btn.text}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    return `
        <div class="modal ${sizeClass}">
            <div class="modal-header">
                <h3 class="modal-title">${escapeHtml(options.title)}</h3>
                ${showCloseBtn ? '<button class="modal-close" data-modal-close>&times;</button>' : ''}
            </div>
            <div class="modal-body">
                ${options.content}
            </div>
            ${buttonsHtml}
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
 * Open modal
 * @param {ModalOptions} options - Modal options
 * @returns {Promise} Promise that resolves when modal closes
 */
export function openModal(options) {
    return new Promise((resolve) => {
        // Close existing modal if open
        if (currentModal) {
            closeModal();
        }
        
        const overlay = ensureOverlay();
        const modalHtml = buildModalHTML(options);
        
        overlay.innerHTML = modalHtml;
        overlay.classList.add('active');
        
        currentModal = {
            overlay,
            resolve,
            options,
            closeOnOverlay: options.closeOnOverlay !== false
        };
        
        // Setup event listeners
        setupModalEvents(options);
        
        // Call onOpen callback
        if (options.onOpen && typeof options.onOpen === 'function') {
            options.onOpen();
        }
    });
}

/**
 * Setup modal event listeners
 */
function setupModalEvents(options) {
    if (!currentModal) return;
    
    const overlay = currentModal.overlay;
    
    // Close button
    const closeBtn = overlay.querySelector('[data-modal-close]');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeModal());
    }
    
    // Overlay click
    if (currentModal.closeOnOverlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }
    
    // Button actions
    const buttons = overlay.querySelectorAll('[data-modal-action]');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-modal-action');
            if (action === 'confirm') {
                closeModal(true);
            } else if (action === 'cancel') {
                closeModal(false);
            } else if (action === 'custom') {
                // Custom action - resolve with button data
                closeModal({ action, button: btn });
            } else {
                closeModal(true);
            }
        });
    });
    
    // Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Store for cleanup
    currentModal.handleEscape = handleEscape;
}

/**
 * Close modal
 * @param {any} result - Result to resolve promise with
 */
export function closeModal(result = null) {
    if (!currentModal) return;
    
    const { overlay, resolve, options, handleEscape } = currentModal;
    
    overlay.classList.remove('active');
    
    // Call onClose callback
    if (options.onClose && typeof options.onClose === 'function') {
        options.onClose(result);
    }
    
    // Cleanup
    if (handleEscape) {
        document.removeEventListener('keydown', handleEscape);
    }
    
    // Clear content after animation
    setTimeout(() => {
        overlay.innerHTML = '';
        resolve(result);
        currentModal = null;
    }, 200);
}

/**
 * Show confirmation modal
 * @param {string} title - Modal title
 * @param {string} message - Confirmation message
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 * @returns {Promise<boolean>} True if confirmed
 */
export function confirmModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return openModal({
        title,
        content: `<p>${escapeHtml(message)}</p>`,
        size: 'sm',
        buttons: [
            { text: cancelText, class: 'btn-outline', action: 'cancel' },
            { text: confirmText, class: 'btn-primary', action: 'confirm' }
        ]
    }).then(result => result === true);
}

/**
 * Show alert modal
 * @param {string} title - Modal title
 * @param {string} message - Alert message
 * @param {string} buttonText - Button text
 * @returns {Promise<void>}
 */
export function alertModal(title, message, buttonText = 'OK') {
    return openModal({
        title,
        content: `<p>${escapeHtml(message)}</p>`,
        size: 'sm',
        closable: false,
        buttons: [
            { text: buttonText, class: 'btn-primary', action: 'confirm' }
        ]
    });
}

/**
 * Show form modal
 * @param {string} title - Modal title
 * @param {string} formHtml - Form HTML
 * @param {Function} onSubmit - Submit handler
 * @returns {Promise}
 */
export function formModal(title, formHtml, onSubmit) {
    return openModal({
        title,
        content: formHtml,
        size: 'md',
        buttons: [
            { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
            { text: 'Save', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
        ],
        onClose: (result) => {
            if (result === true && onSubmit) {
                const form = document.querySelector('.modal form');
                if (form) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    onSubmit(data);
                }
            }
        }
    });
}

/**
 * Show loading modal
 * @param {string} message - Loading message
 * @returns {object} Controls to close modal
 */
export function showLoadingModal(message = 'Loading...') {
    openModal({
        title: 'Please Wait',
        content: `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>${escapeHtml(message)}</p>
            </div>
        `,
        closable: false,
        closeOnOverlay: false
    });
    
    return {
        close: () => closeModal()
    };
}

export default {
    openModal,
    closeModal,
    confirmModal,
    alertModal,
    formModal,
    showLoadingModal
};
