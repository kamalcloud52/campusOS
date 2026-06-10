/**
 * Campus Survival OS - Main Entry Point
 * Vanilla JS SPA with hash-based routing
 */

import { initRouter } from './router.js';
import { store, actions } from './store/globalState.js';
import { getSession, startSessionMonitoring } from './utils/session.js';
import { initHeader } from './components/Header.js';
import { initSidebar } from './components/Sidebar.js';

let appInitialized = false;

/**
 * Register Service Worker for PWA features
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}

/**
 * Render main layout wrapper
 */
function renderLayout() {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;
    
    if (appContainer.querySelector('.app-container')) {
        return;
    }
    
    appContainer.innerHTML = `
        <div class="app-container">
            <div class="header-container-wrapper"></div>
            <div class="sidebar-container-wrapper"></div>
            <main class="main-content" id="mainContent">
                <div class="page-container" id="pageContainer">
                    <div class="app-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading Campus Survival OS...</p>
                    </div>
                </div>
            </main>
        </div>
    `;
}

/**
 * Get page container element
 */
export function getPageContainer() {
    return document.getElementById('pageContainer');
}

/**
 * Set page content
 */
export function setPageContent(html) {
    const container = getPageContainer();
    if (container) {
        container.innerHTML = html;
    }
}

/**
 * Initialize session on app start
 */
function initializeSession() {
    const session = getSession();
    
    if (session) {
        const { token, user } = session;
        actions.setAuth(user, token);
        console.log('Session restored for user:', user.email);
        startSessionMonitoring();
        return true;
    }
    
    console.log('No active session found');
    return false;
}

/**
 * Initialize components (header, sidebar)
 */
function initializeComponents() {
    const headerWrapper = document.querySelector('.header-container-wrapper');
    const sidebarWrapper = document.querySelector('.sidebar-container-wrapper');
    
    if (headerWrapper) {
        initHeader(headerWrapper);
    }
    if (sidebarWrapper) {
        initSidebar(sidebarWrapper);
    }
}

/**
 * Show fatal error when app cannot initialize
 */
function showFatalError(message) {
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; text-align: center;">
                <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: var(--error); margin-bottom: 1rem;"></i>
                <h2 style="margin-bottom: 0.5rem;">Initialization Failed</h2>
                <p style="color: var(--gray-500); margin-bottom: 1rem;">${escapeHtml(message)}</p>
                <button onclick="location.reload()" class="btn btn-primary">
                    <i class="fas fa-sync-alt"></i>
                    Reload Page
                </button>
            </div>
        `;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize the application
 */
async function initApp() {
    if (appInitialized) {
        console.warn('App already initialized');
        return;
    }
    
    console.log('Campus Survival OS - Initializing application...');
    
    try {
        renderLayout();
        initializeSession();
        initializeComponents();
        initRouter();
        
        try {
            registerServiceWorker();
        } catch (swError) {
            console.warn('Service Worker registration skipped:', swError.message);
        }
        
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
        });
        
        appInitialized = true;
        console.log('Campus Survival OS - Application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showFatalError(error.message);
    }
}

// Start the application
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

export { store, actions };
