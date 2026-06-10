/**
 * Session Management Module
 * Handles token storage, validation, and auto-logout
 * Implements PRD Sections AUTH-03, AUTH-04
 */

import { store, actions } from '../store/globalState.js';
import { STORAGE_KEYS, ROUTES } from './constants.js';
import { showToast } from '../components/Toast.js';

// Session configuration
const SESSION_CONFIG = {
    TOKEN_EXPIRY_DAYS: 7,           // Token expires in 7 days (PRD AUTH-02)
    REFRESH_THRESHOLD_MINUTES: 60,   // Refresh token if expiry < 60 minutes
    AUTO_LOGOUT_INACTIVITY_MINUTES: 30, // Auto logout after 30 minutes inactivity
    CHECK_INTERVAL_SECONDS: 60       // Check session every 60 seconds
};

// Store inactivity timer
let inactivityTimer = null;
let sessionCheckInterval = null;

/**
 * Save session to localStorage
 * @param {string} token - Session token
 * @param {object} user - User data
 * @param {boolean} remember - Remember me flag
 */
export function saveSession(token, user, remember = false) {
    const sessionData = {
        token,
        user,
        expiresAt: calculateExpiryDate(SESSION_CONFIG.TOKEN_EXPIRY_DAYS),
        createdAt: Date.now(),
        remember
    };
    
    if (remember) {
        // Persistent storage
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        localStorage.setItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`, sessionData.expiresAt);
    } else {
        // Session-only storage (cleared on browser close)
        sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
        sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        sessionStorage.setItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`, sessionData.expiresAt);
    }
    
    // Update store
    actions.setAuth(user, token);
    
    // Start session monitoring
    startSessionMonitoring();
    
    // Reset inactivity timer
    resetInactivityTimer();
    
    return sessionData;
}

/**
 * Calculate expiry date from now
 * @param {number} days - Number of days from now
 * @returns {string} ISO date string
 */
function calculateExpiryDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

/**
 * Get current session
 * @returns {object|null} Session data or null
 */
export function getSession() {
    // Check sessionStorage first (session-only)
    let token = sessionStorage.getItem(STORAGE_KEYS.TOKEN);
    let userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
    let expiryStr = sessionStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`);
    let isPersistent = false;
    
    // Then check localStorage (persistent/remember me)
    if (!token) {
        token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        userStr = localStorage.getItem(STORAGE_KEYS.USER);
        expiryStr = localStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`);
        isPersistent = true;
    }
    
    if (!token || !userStr) {
        return null;
    }
    
    // Check expiry
    if (expiryStr && new Date(expiryStr) < new Date()) {
        clearSession();
        return null;
    }
    
    try {
        const user = JSON.parse(userStr);
        return { token, user, isPersistent };
    } catch (error) {
        console.error('Failed to parse session user:', error);
        return null;
    }
}

/**
 * Check if session is valid
 * @returns {boolean} True if session is valid
 */
export function isSessionValid() {
    const session = getSession();
    if (!session) return false;
    
    const state = store.getState();
    return state.isAuthenticated && state.token === session.token;
}

/**
 * Clear session (logout)
 * @param {boolean} redirectToLogin - Redirect to login page
 */
export function clearSession(redirectToLogin = true) {
    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`);
    
    // Clear store
    actions.clearAuth();
    
    // Stop monitoring
    stopSessionMonitoring();
    
    // Redirect to login
    if (redirectToLogin && window.location.hash !== ROUTES.LOGIN && window.location.hash !== ROUTES.REGISTER) {
        window.location.hash = ROUTES.LOGIN;
    }
}

/**
 * Logout user (with server-side invalidation)
 * @param {boolean} redirectToLogin - Redirect to login page
 */
export async function logout(redirectToLogin = true) {
    const state = store.getState();
    const token = state.token || localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    // Try to invalidate token on server
    if (token) {
        try {
            const { apiPost } = await import('../api/client.js');
            await apiPost('logout', {}, { bypassQueue: true });
        } catch (error) {
            console.warn('Server logout failed:', error.message);
        }
    }
    
    // Clear local session
    clearSession(redirectToLogin);
    
    // Show toast
    showToast('You have been logged out', 'info');
}

/**
 * Refresh session (extend expiry)
 * Called periodically to keep session alive
 */
export async function refreshSession() {
    const session = getSession();
    if (!session) return false;
    
    // Check if token needs refresh (expiring soon)
    const expiryStr = localStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`) ||
                      sessionStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`);
    
    if (expiryStr) {
        const expiryDate = new Date(expiryStr);
        const now = new Date();
        const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
        
        // Refresh if less than threshold
        if (hoursUntilExpiry < SESSION_CONFIG.REFRESH_THRESHOLD_MINUTES / 60) {
            // In a real implementation, you would call a refresh token endpoint
            // For now, we'll just log
            console.log('Session refresh needed soon');
        }
    }
    
    // Reset inactivity timer
    resetInactivityTimer();
    
    return true;
}

/**
 * Reset inactivity timer
 */
function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    
    inactivityTimer = setTimeout(() => {
        console.log('Inactivity timeout - auto logging out');
        showToast('Session expired due to inactivity', 'warning');
        clearSession(true);
    }, SESSION_CONFIG.AUTO_LOGOUT_INACTIVITY_MINUTES * 60 * 1000);
}

/**
 * Start session monitoring (check expiry, inactivity)
 */
export function startSessionMonitoring() {
    // Stop existing monitoring
    stopSessionMonitoring();
    
    // Set up activity listeners to reset inactivity timer
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
        window.addEventListener(event, resetInactivityTimer);
    });
    
    // Set up periodic session check
    sessionCheckInterval = setInterval(() => {
        const session = getSession();
        if (!session) {
            // No session, stop monitoring
            stopSessionMonitoring();
            return;
        }
        
        // Check expiry
        const expiryStr = localStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`) ||
                          sessionStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`);
        
        if (expiryStr && new Date(expiryStr) < new Date()) {
            console.log('Session expired - auto logging out');
            clearSession(true);
            showToast('Session expired. Please login again.', 'warning');
        }
    }, SESSION_CONFIG.CHECK_INTERVAL_SECONDS * 1000);
    
    // Initial inactivity timer start
    resetInactivityTimer();
}

/**
 * Stop session monitoring
 */
function stopSessionMonitoring() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        sessionCheckInterval = null;
    }
    
    // Remove activity listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
    });
}

/**
 * Handle 401 Unauthorized response from API
 * Called from API client when receiving 401
 */
export function handleUnauthorized() {
    console.warn('401 Unauthorized - Clearing session');
    clearSession(true);
    showToast('Session expired. Please login again.', 'warning');
}

/**
 * Get token for API requests
 * @returns {string|null} Token or null
 */
export function getToken() {
    const state = store.getState();
    if (state.token) return state.token;
    
    // Fallback to storage
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
}

/**
 * Check if token is about to expire
 * @returns {boolean} True if token needs refresh
 */
export function isTokenExpiringSoon() {
    const expiryStr = localStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`) ||
                      sessionStorage.getItem(`${STORAGE_KEYS.CACHE_PREFIX}session_expiry`);
    
    if (!expiryStr) return false;
    
    const expiryDate = new Date(expiryStr);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate - now) / (1000 * 60 * 60);
    
    return hoursUntilExpiry < SESSION_CONFIG.REFRESH_THRESHOLD_MINUTES / 60;
}

// Export default
export default {
    saveSession,
    getSession,
    isSessionValid,
    clearSession,
    logout,
    refreshSession,
    handleUnauthorized,
    getToken,
    isTokenExpiringSoon,
    startSessionMonitoring
};
