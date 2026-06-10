/**
 * Header Component
 * Main navigation header with user menu and mobile sidebar toggle
 */

import { store, actions } from '../store/globalState.js';
import { logout } from '../utils/session.js';
import { ROUTES } from '../utils/constants.js';
import { showToast } from './Toast.js';

let unsubscribe = null;

/**
 * Render header HTML
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const user = state.user;
    const isAuthenticated = state.isAuthenticated;
    
    // Get user initials for avatar
    const userInitials = user?.fullname
        ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : 'U';
    
    return `
        <header class="app-header">
            <div class="header-container">
                <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
                    <i class="fas fa-bars"></i>
                </button>
                
                <div class="header-logo">
                    <a href="#/dashboard">
                        <i class="fas fa-graduation-cap"></i>
                        <span>CampusOS</span>
                    </a>
                </div>
                
                <div class="header-search" id="headerSearch">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search notes, courses..." id="globalSearch">
                </div>
                
                <div class="header-actions">
                    ${isAuthenticated ? `
                        <button class="header-notification" id="notificationBtn" aria-label="Notifications">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                        </button>
                        
                        <div class="user-menu" id="userMenu">
                            <button class="user-menu-trigger" id="userMenuTrigger">
                                <div class="user-avatar">
                                    ${userInitials}
                                </div>
                                <span class="user-name">${escapeHtml(user?.fullname?.split(' ')[0] || 'User')}</span>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            
                            <div class="user-menu-dropdown" id="userMenuDropdown">
                                <div class="user-menu-header">
                                    <div class="user-menu-avatar">${userInitials}</div>
                                    <div class="user-menu-info">
                                        <div class="user-menu-name">${escapeHtml(user?.fullname || 'User')}</div>
                                        <div class="user-menu-email">${escapeHtml(user?.email || '')}</div>
                                    </div>
                                </div>
                                <div class="user-menu-divider"></div>
                                <a href="#/profile" class="user-menu-item">
                                    <i class="fas fa-user"></i>
                                    <span>My Profile</span>
                                </a>
                                <a href="#/settings" class="user-menu-item">
                                    <i class="fas fa-cog"></i>
                                    <span>Settings</span>
                                </a>
                                <div class="user-menu-divider"></div>
                                <button id="logoutBtn" class="user-menu-item logout-item">
                                    <i class="fas fa-sign-out-alt"></i>
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="header-auth-buttons">
                            <a href="#/login" class="btn btn-outline btn-sm">Login</a>
                            <a href="#/register" class="btn btn-primary btn-sm">Sign Up</a>
                        </div>
                    `}
                </div>
            </div>
        </header>
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
 * Toggle user menu dropdown
 */
function setupUserMenu() {
    const trigger = document.getElementById('userMenuTrigger');
    const dropdown = document.getElementById('userMenuDropdown');
    
    if (!trigger || !dropdown) return;
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

/**
 * Setup logout handler
 */
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout(true);
            showToast('Logged out successfully', 'success');
        });
    }
}

/**
 * Setup notification button
 */
function setupNotification() {
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            // Will implement notification panel in future
            showToast('Notifications coming soon', 'info');
        });
    }
}

/**
 * Setup global search
 */
function setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value.trim();
                if (query.length > 2) {
                    // Will implement search results in future
                    console.log('Search:', query);
                }
            }, 300);
        });
    }
}

/**
 * Setup sidebar toggle
 */
function setupSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            actions.toggleSidebar();
            const sidebar = document.querySelector('.app-sidebar');
            if (sidebar) {
                sidebar.classList.toggle('open');
            }
        });
    }
}

/**
 * Update notification badge
 * @param {number} count - Notification count
 */
export function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

/**
 * Update user info in header (when state changes)
 */
function updateUserInfo() {
    const state = store.getState();
    const isAuthenticated = state.isAuthenticated;
    const user = state.user;
    
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    if (isAuthenticated && user) {
        const userInitials = user.fullname
            ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : 'U';
        
        const userNameSpan = document.querySelector('.user-name');
        const userAvatar = document.querySelector('.user-avatar');
        const menuAvatar = document.querySelector('.user-menu-avatar');
        const menuName = document.querySelector('.user-menu-name');
        const menuEmail = document.querySelector('.user-menu-email');
        
        if (userNameSpan) userNameSpan.textContent = user.fullname.split(' ')[0];
        if (userAvatar) userAvatar.textContent = userInitials;
        if (menuAvatar) menuAvatar.textContent = userInitials;
        if (menuName) menuName.textContent = user.fullname;
        if (menuEmail) menuEmail.textContent = user.email;
    }
}

/**
 * Subscribe to state changes
 */
function subscribeToState() {
    if (unsubscribe) {
        unsubscribe();
    }
    
    unsubscribe = store.subscribe((newState) => {
        updateUserInfo();
    });
}

/**
 * Initialize header component
 * @param {HTMLElement} container - Container element
 */
export function initHeader(container) {
    if (!container) return;
    
    container.innerHTML = render();
    
    setupUserMenu();
    setupLogout();
    setupNotification();
    setupGlobalSearch();
    setupSidebarToggle();
    subscribeToState();
}

/**
 * Cleanup header component
 */
export function cleanupHeader() {
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

export default { initHeader, cleanupHeader, updateNotificationBadge };
