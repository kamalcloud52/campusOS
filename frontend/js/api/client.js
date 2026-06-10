/**
 * API Client Module
 * Fetch wrapper with auto-retry, token management, and CORS handling
 */

import { API_BASE_URL } from '../utils/constants.js';
import { store, actions } from '../store/globalState.js';
import { enqueueRequest, getQueueStatus as getRequestQueueStatus } from '../utils/requestQueue.js';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;

/**
 * Sleep/delay helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate retry delay with exponential backoff
 */
function getRetryDelay(attempt, responseData) {
    if (responseData && responseData.retryAfter) {
        return responseData.retryAfter * 1000;
    }
    const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1), MAX_RETRY_DELAY);
    return delay;
}

/**
 * Make API call with retry logic
 */
async function makeRequest(url, method, headers, body, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
        const response = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { success: false, message: 'Invalid response from server' };
        }
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.warn('Session expired, redirecting to login');
            localStorage.clear();
            actions.clearAuth();
            window.location.hash = '#/login';
            throw new Error('Session expired. Please login again.');
        }
        
        // Handle rate limiting with retry
        if (response.status === 429 || (data.code === 'QUOTA_EXCEEDED' && data.retryAfter)) {
            if (retryCount < MAX_RETRIES) {
                const delay = getRetryDelay(retryCount + 1, data);
                console.warn(`Rate limited. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await sleep(delay);
                return makeRequest(url, method, headers, body, retryCount + 1);
            } else {
                throw new Error('Too many requests. Please try again later.');
            }
        }
        
        // Handle other server errors with retry
        if (!response.ok && response.status >= 500 && retryCount < MAX_RETRIES) {
            const delay = getRetryDelay(retryCount + 1);
            console.warn(`Server error ${response.status}. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await sleep(delay);
            return makeRequest(url, method, headers, body, retryCount + 1);
        }
        
        return data;
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'TypeError' || error.name === 'AbortError') {
            if (retryCount < MAX_RETRIES) {
                const delay = getRetryDelay(retryCount + 1);
                console.warn(`Network error: ${error.message}. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
                await sleep(delay);
                return makeRequest(url, method, headers, body, retryCount + 1);
            }
        }
        
        throw error;
    }
}

/**
 * Build URL with query parameters
 */
function buildUrl(action, params = {}) {
    const urlParams = new URLSearchParams();
    urlParams.append('action', action);
    
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            urlParams.append(key, value.toString());
        }
    }
    
    const queryString = urlParams.toString();
    const baseUrl = API_BASE_URL || window.API_BASE_URL;
    
    if (!baseUrl) {
        console.error('API_BASE_URL is not configured');
        throw new Error('API configuration missing. Please check environment variables.');
    }
    
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}${queryString}`;
}

/**
 * Internal function to execute API request
 */
async function executeApiRequest(action, params, method) {
    const state = store.getState();
    let token = state.token;
    if (!token) {
        token = localStorage.getItem('campusos_token');
        if (token && !state.token) {
            actions.setState({ token });
        }
    }
    
    const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    let url;
    let body = null;
    
    if (method === 'GET') {
        url = buildUrl(action, params);
    } else {
        url = buildUrl(action);
        const formBody = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                formBody.append(key, typeof value === 'object' ? JSON.stringify(value) : value.toString());
            }
        }
        body = formBody.toString();
    }
    
    console.debug(`API ${method} Request:`, { action, url, params });
    
    const response = await makeRequest(url, method, headers, body);
    
    if (!response.success) {
        const error = new Error(response.message || 'API request failed');
        error.code = response.code;
        error.retryAfter = response.retryAfter;
        throw error;
    }
    
    return response;
}

/**
 * Main API call function with queue support
 */
export async function apiCall(action, params = {}, method = 'GET', options = {}) {
    const { bypassQueue = false, priority } = options;
    
    const requestFn = () => executeApiRequest(action, params, method);
    
    if (bypassQueue) {
        console.debug(`Bypassing queue for action: ${action}`);
        return requestFn();
    }
    
    return enqueueRequest(requestFn, action, { priority });
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(action, params = {}, options = {}) {
    return apiCall(action, params, 'GET', options);
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(action, data = {}, options = {}) {
    return apiCall(action, data, 'POST', options);
}

/**
 * Batch API calls
 */
export async function apiBatch(requests) {
    const results = [];
    const batchSize = 3;
    
    for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async ({ action, params, method = 'GET', options = {} }) => {
                try {
                    const result = await apiCall(action, params, method, options);
                    return { success: true, data: result.data };
                } catch (error) {
                    return { success: false, error: error.message, action };
                }
            })
        );
        results.push(...batchResults);
    }
    
    return results;
}

/**
 * Check API health / ping endpoint
 */
export async function apiPing() {
    try {
        const result = await apiCall('ping', {}, 'GET', { bypassQueue: true });
        return result.success;
    } catch (error) {
        console.warn('API ping failed:', error.message);
        return false;
    }
}

/**
 * Get current request queue status
 */
export function getQueueStatus() {
    return getRequestQueueStatus();
}

// Export semua fungsi
export default {
    apiCall,
    apiGet,
    apiPost,
    apiBatch,
    apiPing,
    getQueueStatus
};
