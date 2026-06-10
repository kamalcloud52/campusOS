/**
 * Sidebar Component
 * Mobile-first navigation sidebar with active route highlighting
 */

import { ROUTES } from '../utils/constants.js';
import { store, actions } from '../store/globalState.js';
import { isAuthenticated } from '../router.js';

/**
 * Navigation items configuration
 */
const NAV_ITEMS = [
    { route: ROUTES.DASHBOARD, icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
    { route: ROUTES.ACADEMIC, icon: 'fas fa-book', label: 'Academic' },
    { route: ROUTES.GPA, icon: 'fas fa-chart-line', label: 'GPA Tracker' },
    { route: ROUTES.FINANCE, icon: 'fas fa-wallet', label: 'Finance' },
    { route: ROUTES.ORGANIZATION, icon: 'fas fa-users', label: 'Organization' },
    { route: ROUTES.GOALS, icon: 'fas fa-bullseye', label: 'Goals & Habits' },
    { route: ROUTES.NOTES, icon: 'fas fa-sticky-note', label: 'Notes' },
    { route: ROUTES.PROFILE, icon: 'fas fa-user', label: 'Profile' }
];

/**
 * Render sidebar HTML
 * @returns {string} HTML string
 */
function render() {
    const currentRoute = window.location.hash || '#/dashboard';
    const authenticated = isAuthenticated();
    
    if (!authenticated) {
        return '<div class="app-sidebar"></div>';
    }
    
    const navItemsHtml = NAV_ITEMS.map(item => {
        const isActive = currentRoute === item.route || 
                        (item.route === ROUTES.DASHBOARD && currentRoute === '#/');
        const activeClass = isActive ? 'active' : '';
        
        return `
            <a href="${item.route}" class="sidebar-nav-item ${activeClass}" data-route="${item.route}">
                <i class="${item.icon}"></i>
                <span>${item.label}</span>
            </a>
        `;
    }).join('');
    
    return `
        <aside class="app-sidebar">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <i class="fas fa-graduation-cap"></i>
                    <span>Campus Survival OS</span>
                </div>
                <button class="sidebar-close" id="sidebarClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <nav class="sidebar-nav">
                ${navItemsHtml}
            </nav>
            
            <div class="sidebar-footer">
                <div class="sidebar-version">
                    <i class="fas fa-code-branch"></i>
                    <span>v1.0.0</span>
                </div>
            </div>
        </aside>
    `;
}

/**
 * Highlight active navigation item based on current route
 */
function highlightActiveRoute() {
    const currentRoute = window.location.hash || '#/dashboard';
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    
    navItems.forEach(item => {
        const itemRoute = item.getAttribute('data-route');
        const isActive = currentRoute === itemRoute || 
                        (itemRoute === ROUTES.DASHBOARD && currentRoute === '#/');
        
        if (isActive) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Setup navigation click handlers
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const route = item.getAttribute('href');
            if (route) {
                window.location.hash = route;
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                    closeSidebar();
                }
            }
        });
    });
}

/**
 * Close sidebar
 */
function closeSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    if (sidebar) {
        sidebar.classList.remove('open');
    }
    actions.closeSidebar();
}

/**
 * Setup close button
 */
function setupCloseButton() {
    const closeBtn = document.getElementById('sidebarClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSidebar);
    }
}

/**
 * Setup click outside to close (mobile)
 */
function setupClickOutside() {
    const sidebar = document.querySelector('.app-sidebar');
    if (!sidebar) return;
    
    // Close when clicking overlay (will be implemented in main layout)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            const isSidebar = sidebar.contains(e.target);
            const isToggle = e.target.closest('.sidebar-toggle');
            
            if (!isSidebar && !isToggle && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        }
    });
}

/**
 * Handle window resize - auto close sidebar on desktop
 */
function setupResizeHandler() {
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            const sidebar = document.querySelector('.app-sidebar');
            if (sidebar) {
                sidebar.classList.remove('open');
            }
        }
    });
}

/**
 * Subscribe to route changes for highlighting
 */
function subscribeToRouteChanges() {
    window.addEventListener('hashchange', () => {
        highlightActiveRoute();
    });
}

/**
 * Initialize sidebar component
 * @param {HTMLElement} container - Container element
 */
export function initSidebar(container) {
    if (!container) return;
    
    container.innerHTML = render();
    
    setupNavigation();
    setupCloseButton();
    setupClickOutside();
    setupResizeHandler();
    subscribeToRouteChanges();
    highlightActiveRoute();
}

/**
 * Update sidebar (re-render on auth change)
 */
export function updateSidebar() {
    const container = document.querySelector('.app-sidebar')?.parentElement;
    if (container) {
        initSidebar(container);
    }
}

export default { initSidebar, updateSidebar, closeSidebar };
