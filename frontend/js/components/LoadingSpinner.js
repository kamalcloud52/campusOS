/**
 * Loading Spinner & Skeleton Loader Components
 * Implements PRD Section 4.2 loading states
 */

/**
 * Show global loading spinner
 * @param {string} message - Optional loading message
 */
export function showGlobalLoading(message = 'Loading...') {
    let loader = document.getElementById('globalLoader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        document.body.appendChild(loader);
    }
    
    loader.innerHTML = `
        <div class="loader-overlay">
            <div class="loader-content">
                <div class="loading-spinner"></div>
                <p>${escapeHtml(message)}</p>
            </div>
        </div>
    `;
    loader.style.display = 'flex';
}

/**
 * Hide global loading spinner
 */
export function hideGlobalLoading() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = 'none';
    }
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
 * Create skeleton card loader
 * @param {number} count - Number of skeleton cards
 * @returns {string} HTML string
 */
export function skeletonCards(count = 3) {
    return `
        <div class="skeleton-grid">
            ${Array(count).fill().map(() => `
                <div class="skeleton-card">
                    <div class="skeleton skeleton-title" style="width: 70%; height: 20px;"></div>
                    <div class="skeleton" style="height: 60px; margin-top: 12px;"></div>
                    <div class="skeleton" style="width: 40%; height: 16px; margin-top: 12px;"></div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Create skeleton list loader
 * @param {number} count - Number of skeleton items
 * @returns {string} HTML string
 */
export function skeletonList(count = 5) {
    return `
        <div class="skeleton-list">
            ${Array(count).fill().map(() => `
                <div class="skeleton-list-item">
                    <div class="skeleton skeleton-avatar" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                    <div class="skeleton-list-content">
                        <div class="skeleton" style="width: 60%; height: 16px;"></div>
                        <div class="skeleton" style="width: 40%; height: 12px; margin-top: 8px;"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Create skeleton table loader
 * @param {number} rows - Number of skeleton rows
 * @param {number} columns - Number of skeleton columns
 * @returns {string} HTML string
 */
export function skeletonTable(rows = 5, columns = 4) {
    return `
        <div class="skeleton-table">
            <div class="skeleton-table-header">
                ${Array(columns).fill().map(() => `
                    <div class="skeleton" style="height: 20px;"></div>
                `).join('')}
            </div>
            ${Array(rows).fill().map(() => `
                <div class="skeleton-table-row">
                    ${Array(columns).fill().map(() => `
                        <div class="skeleton" style="height: 16px;"></div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Create inline button loader
 * @param {HTMLElement} button - Button element
 * @param {string} loadingText - Text to show while loading
 */
export function setButtonLoading(button, loadingText = 'Loading...') {
    if (!button) return;
    
    const originalText = button.innerHTML;
    button.disabled = true;
    button.setAttribute('data-original-text', originalText);
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    
    return function reset() {
        button.disabled = false;
        button.innerHTML = button.getAttribute('data-original-text') || originalText;
    };
}

/**
 * Create page-specific skeleton loader
 * @param {string} page - Page name
 * @returns {string} HTML string
 */
export function pageSkeleton(page) {
    const skeletons = {
        dashboard: `
            <div class="dashboard-skeleton">
                <div class="skeleton-grid grid-4">
                    ${Array(4).fill().map(() => `
                        <div class="skeleton-card">
                            <div class="skeleton" style="width: 50%; height: 20px;"></div>
                            <div class="skeleton" style="width: 70%; height: 40px; margin-top: 12px;"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="skeleton-grid grid-2">
                    ${Array(2).fill().map(() => `
                        <div class="skeleton-card">
                            <div class="skeleton" style="width: 40%; height: 20px; margin-bottom: 16px;"></div>
                            ${Array(3).fill().map(() => `
                                <div class="skeleton" style="height: 40px; margin-bottom: 8px;"></div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
        `,
        academic: skeletonCards(4),
        notes: skeletonList(5),
        finance: skeletonTable(5, 4),
        default: skeletonCards(3)
    };
    
    return skeletons[page] || skeletons.default;
}

/**
 * Create skeleton for assignment kanban board
 * @returns {string} HTML string
 */
export function skeletonKanban() {
    return `
        <div class="kanban-skeleton" style="display: flex; gap: 20px; overflow-x: auto;">
            ${['pending', 'progress', 'done'].map(status => `
                <div class="kanban-column" style="flex: 1; min-width: 280px;">
                    <div class="skeleton" style="height: 40px; margin-bottom: 16px;"></div>
                    ${Array(2).fill().map(() => `
                        <div class="skeleton-card" style="margin-bottom: 12px;">
                            <div class="skeleton" style="height: 20px; width: 70%; margin-bottom: 8px;"></div>
                            <div class="skeleton" style="height: 16px; width: 50%;"></div>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

// CSS for skeleton loaders (add to main.css)
export const skeletonStyles = `
.skeleton-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.skeleton-grid-2 {
    grid-template-columns: repeat(2, 1fr);
}

.skeleton-grid-4 {
    grid-template-columns: repeat(4, 1fr);
}

.skeleton-card {
    background: white;
    border-radius: var(--radius-lg);
    padding: 16px;
    box-shadow: var(--shadow-sm);
}

.skeleton-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border-radius: var(--radius-md);
    margin-bottom: 8px;
}

.skeleton-list-content {
    flex: 1;
}

.skeleton-table {
    background: white;
    border-radius: var(--radius-lg);
    overflow: hidden;
}

.skeleton-table-header,
.skeleton-table-row {
    display: grid;
    gap: 16px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--gray-200);
}

.global-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loader-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
}

.loader-content {
    background: white;
    border-radius: var(--radius-lg);
    padding: 24px;
    text-align: center;
    min-width: 200px;
}

@media (max-width: 768px) {
    .skeleton-grid-4 {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .skeleton-grid-2 {
        grid-template-columns: 1fr;
    }
}
`;

export default {
    showGlobalLoading,
    hideGlobalLoading,
    skeletonCards,
    skeletonList,
    skeletonTable,
    setButtonLoading,
    pageSkeleton,
    skeletonKanban
};
