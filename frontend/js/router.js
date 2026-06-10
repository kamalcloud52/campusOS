/**
 * Router Module - Hash-based Routing
 */

import { ROUTES, PUBLIC_ROUTES } from './utils/constants.js';
import { store } from './store/globalState.js';
import { getSession } from './utils/session.js';
import { setPageContent } from './app.js';

// Route definitions
const routes = {
    [ROUTES.DASHBOARD]: () => import('./pages/dashboard.js'),
    [ROUTES.ACADEMIC]: () => import('./pages/academic.js'),
    [ROUTES.GPA]: () => import('./pages/gpa.js'),
    [ROUTES.FINANCE]: () => import('./pages/finance.js'),
    [ROUTES.ORGANIZATION]: () => import('./pages/organization.js'),
    [ROUTES.GOALS]: () => import('./pages/goals.js'),
    [ROUTES.NOTES]: () => import('./pages/notes.js'),
    [ROUTES.PROFILE]: () => import('./pages/profile.js'),
    [ROUTES.LOGIN]: () => import('./pages/login.js'),
    [ROUTES.REGISTER]: () => import('./pages/register.js'),
    '#/': () => import('./pages/dashboard.js')
};

function getCurrentRoute() {
    const hash = window.location.hash || '#/';
    return hash.split('?')[0];
}

function requiresAuth(route) {
    return !PUBLIC_ROUTES.includes(route);
}

function isAuthenticated() {
    const state = store.getState();
    if (state.isAuthenticated && state.token) return true;
    const session = getSession();
    return !!session;
}

function navigate(route, replace = false) {
    if (replace) {
        window.location.replace(route);
    } else {
        window.location.hash = route;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    setPageContent(`
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--warning); margin-bottom: 1rem;"></i>
            <h2>Error</h2>
            <p>${escapeHtml(message)}</p>
            <button onclick="location.reload()" class="btn btn-primary">Reload</button>
        </div>
    `);
}

export async function handleRoute() {
    const route = getCurrentRoute();
    const routeHandler = routes[route];
    
    if (!routeHandler) {
        showError('Page not found');
        return;
    }
    
    // Auth check
    if (requiresAuth(route) && !isAuthenticated()) {
        sessionStorage.setItem('redirectAfterLogin', route);
        navigate(ROUTES.LOGIN, true);
        return;
    }
    
    // Redirect if already logged in
    if ((route === ROUTES.LOGIN || route === ROUTES.REGISTER) && isAuthenticated()) {
        navigate(ROUTES.DASHBOARD, true);
        return;
    }
    
    // Show loading
    setPageContent(`
        <div class="page-loading">
            <div class="loading-spinner"></div>
            <p>Loading...</p>
        </div>
    `);
    
    try {
        const pageModule = await routeHandler();
        const page = pageModule.default || pageModule;
        
        // Before render
        if (page.beforeRender && typeof page.beforeRender === 'function') {
            const canRender = await page.beforeRender();
            if (canRender === false) return;
        }
        
        // Render
        const html = page.render();
        setPageContent(html);
        
        // After render
        if (page.afterRender && typeof page.afterRender === 'function') {
            await page.afterRender();
        }
        
        window.scrollTo(0, 0);
        
    } catch (error) {
        console.error('Router error:', error);
        showError('Failed to load page: ' + error.message);
    }
}

export function initRouter() {
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('load', () => {
        if (!window.location.hash || window.location.hash === '#') {
            window.location.hash = ROUTES.DASHBOARD;
        }
        handleRoute();
    });
    console.log('Router initialized');
}

export { getCurrentRoute, isAuthenticated, navigate };
