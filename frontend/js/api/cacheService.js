/**
 * Cache Service Module
 * LocalStorage-based caching with TTL (Time-To-Live)
 * Implements PRD Section 4.1 requirements
 */

import { CACHE_TTL, STORAGE_KEYS } from '../utils/constants.js';

// Cache key prefix as defined in PRD
const CACHE_PREFIX = STORAGE_KEYS.CACHE_PREFIX;

// Default TTL values (in milliseconds) from PRD
const DEFAULT_TTL = {
    DASHBOARD: CACHE_TTL.DASHBOARD,
    COURSES: CACHE_TTL.COURSES,
    ASSIGNMENTS: CACHE_TTL.ASSIGNMENTS,
    GRADES: CACHE_TTL.GRADES,
    FINANCE: CACHE_TTL.FINANCE,
    NOTES: CACHE_TTL.NOTES,
    PROFILE: CACHE_TTL.PROFILE
};

// Resource type to TTL mapping
const RESOURCE_TTL_MAP = {
    // Dashboard data (2 minutes)
    dashboard: DEFAULT_TTL.DASHBOARD,
    getDashboard: DEFAULT_TTL.DASHBOARD,
    
    // Courses (5 minutes)
    courses: DEFAULT_TTL.COURSES,
    getCourses: DEFAULT_TTL.COURSES,
    addCourse: DEFAULT_TTL.COURSES,
    updateCourse: DEFAULT_TTL.COURSES,
    deleteCourse: DEFAULT_TTL.COURSES,
    
    // Assignments (1 minute - deadline sensitive)
    assignments: DEFAULT_TTL.ASSIGNMENTS,
    getAssignments: DEFAULT_TTL.ASSIGNMENTS,
    addAssignment: DEFAULT_TTL.ASSIGNMENTS,
    updateAssignmentStatus: DEFAULT_TTL.ASSIGNMENTS,
    updateAssignment: DEFAULT_TTL.ASSIGNMENTS,
    deleteAssignment: DEFAULT_TTL.ASSIGNMENTS,
    
    // Grades (15 minutes - doesn't change often)
    grades: DEFAULT_TTL.GRADES,
    getGrades: DEFAULT_TTL.GRADES,
    addGrade: DEFAULT_TTL.GRADES,
    deleteGrade: DEFAULT_TTL.GRADES,
    
    // Finance (3 minutes)
    finance: DEFAULT_TTL.FINANCE,
    getFinance: DEFAULT_TTL.FINANCE,
    getFinanceSummary: DEFAULT_TTL.FINANCE,
    addTransaction: DEFAULT_TTL.FINANCE,
    deleteTransaction: DEFAULT_TTL.FINANCE,
    
    // Activities (5 minutes)
    activities: DEFAULT_TTL.COURSES,
    getActivities: DEFAULT_TTL.COURSES,
    addActivity: DEFAULT_TTL.COURSES,
    deleteActivity: DEFAULT_TTL.COURSES,
    
    // Habits (5 minutes)
    habits: DEFAULT_TTL.COURSES,
    getHabits: DEFAULT_TTL.COURSES,
    addHabit: DEFAULT_TTL.COURSES,
    updateHabitStreak: DEFAULT_TTL.COURSES,
    deleteHabit: DEFAULT_TTL.COURSES,
    
    // Notes (5 minutes)
    notes: DEFAULT_TTL.NOTES,
    getNotes: DEFAULT_TTL.NOTES,
    addNote: DEFAULT_TTL.NOTES,
    updateNote: DEFAULT_TTL.NOTES,
    deleteNote: DEFAULT_TTL.NOTES,
    
    // Profile (10 minutes)
    profile: DEFAULT_TTL.PROFILE,
    getUserProfile: DEFAULT_TTL.PROFILE,
    updateUserProfile: DEFAULT_TTL.PROFILE
};

/**
 * Generate cache key from action and parameters
 */
function generateCacheKey(action, params = {}) {
    // Create a stable string representation of params
    const paramsString = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    const keyString = paramsString ? `${action}_${paramsString}` : action;
    // Hash the key to avoid invalid localStorage keys (though not strictly necessary)
    // Simple sanitization: remove special characters
    const sanitized = keyString.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${CACHE_PREFIX}${sanitized}`;
}

/**
 * Get TTL for a specific action/resource
 */
function getTTLForAction(action, customTTL = null) {
    if (customTTL !== null) return customTTL;
    return RESOURCE_TTL_MAP[action] || DEFAULT_TTL.DASHBOARD;
}

/**
 * Cache Manager Class
 * Implements PRD Section 4.1 CacheManager
 */
class CacheManager {
    /**
     * Get cached data if not expired
     * @param {string} key - Cache key
     * @returns {any|null} Cached data or null if not found/expired
     */
    static get(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) return null;
            
            const { data, timestamp, ttl } = JSON.parse(cached);
            
            // Check if cache has expired
            if (Date.now() - timestamp > ttl) {
                localStorage.removeItem(key);
                return null;
            }
            
            return data;
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }
    
    /**
     * Store data in cache with TTL
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    static set(key, data, ttl) {
        try {
            const payload = {
                data,
                timestamp: Date.now(),
                ttl
            };
            localStorage.setItem(key, JSON.stringify(payload));
        } catch (error) {
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded, clearing old cache...');
                this.clearExpired();
                // Retry after clearing
                try {
                    localStorage.setItem(key, JSON.stringify(payload));
                } catch (retryError) {
                    console.error('Still cannot write to cache after cleanup:', retryError);
                }
            } else {
                console.error('Cache write error:', error);
            }
        }
    }
    
    /**
     * Remove specific cache entry
     * @param {string} key - Cache key
     */
    static remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    }
    
    /**
     * Clear all expired cache entries
     */
    static clearExpired() {
        try {
            const keys = Object.keys(localStorage);
            let clearedCount = 0;
            
            for (const key of keys) {
                if (key.startsWith(CACHE_PREFIX)) {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        try {
                            const { timestamp, ttl } = JSON.parse(cached);
                            if (Date.now() - timestamp > ttl) {
                                localStorage.removeItem(key);
                                clearedCount++;
                            }
                        } catch (e) {
                            // Invalid cache entry, remove it
                            localStorage.removeItem(key);
                            clearedCount++;
                        }
                    }
                }
            }
            
            if (clearedCount > 0) {
                console.debug(`Cleared ${clearedCount} expired cache entries`);
            }
        } catch (error) {
            console.error('Clear expired cache error:', error);
        }
    }
    
    /**
     * Clear all cache entries
     */
    static clearAll() {
        try {
            const keys = Object.keys(localStorage);
            let clearedCount = 0;
            
            for (const key of keys) {
                if (key.startsWith(CACHE_PREFIX)) {
                    localStorage.removeItem(key);
                    clearedCount++;
                }
            }
            
            console.debug(`Cleared all ${clearedCount} cache entries`);
        } catch (error) {
            console.error('Clear all cache error:', error);
        }
    }
    
    /**
     * Invalidate cache by key pattern
     * @param {string} keyPattern - Pattern to match cache keys
     */
    static invalidate(keyPattern) {
        try {
            const keys = Object.keys(localStorage);
            let invalidatedCount = 0;
            
            for (const key of keys) {
                if (key.startsWith(CACHE_PREFIX) && key.includes(keyPattern)) {
                    localStorage.removeItem(key);
                    invalidatedCount++;
                }
            }
            
            if (invalidatedCount > 0) {
                console.debug(`Invalidated ${invalidatedCount} cache entries matching pattern: ${keyPattern}`);
            }
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }
    
    /**
     * Invalidate by resource type (e.g., 'courses', 'assignments')
     * @param {string} resourceType - Resource type to invalidate
     */
    static invalidateResource(resourceType) {
        // Invalidate exact matches and related endpoints
        const patterns = [
            resourceType,
            `get${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`,
            `add${resourceType.slice(0, -1)}`,
            `update${resourceType.slice(0, -1)}`,
            `delete${resourceType.slice(0, -1)}`
        ];
        
        for (const pattern of patterns) {
            this.invalidate(pattern);
        }
        
        // Also invalidate dashboard as it contains aggregated data
        this.invalidate('dashboard');
        this.invalidate('getDashboard');
    }
    
    /**
     * Check if cache exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean} True if cache exists and is valid
     */
    static has(key) {
        return this.get(key) !== null;
    }
    
    /**
     * Get cache stats
     * @returns {object} Cache statistics
     */
    static getStats() {
        try {
            const keys = Object.keys(localStorage);
            let totalSize = 0;
            let validCount = 0;
            let expiredCount = 0;
            
            for (const key of keys) {
                if (key.startsWith(CACHE_PREFIX)) {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        totalSize += cached.length;
                        try {
                            const { timestamp, ttl } = JSON.parse(cached);
                            if (Date.now() - timestamp > ttl) {
                                expiredCount++;
                            } else {
                                validCount++;
                            }
                        } catch (e) {
                            expiredCount++;
                        }
                    }
                }
            }
            
            return {
                totalEntries: validCount + expiredCount,
                validEntries: validCount,
                expiredEntries: expiredCount,
                totalSizeKB: Math.round(totalSize / 1024),
                prefix: CACHE_PREFIX
            };
        } catch (error) {
            console.error('Get cache stats error:', error);
            return null;
        }
    }
}

/**
 * Fetch with cache - wrapper function
 * @param {string} action - API action name
 * @param {Function} fetchFn - Function that makes the actual API call
 * @param {object} params - Parameters for cache key generation
 * @param {number} customTTL - Optional custom TTL
 * @param {boolean} forceRefresh - Force refresh cache
 * @returns {Promise<any>} Data from cache or fresh fetch
 */
export async function fetchWithCache(action, fetchFn, params = {}, customTTL = null, forceRefresh = false) {
    const cacheKey = generateCacheKey(action, params);
    const ttl = getTTLForAction(action, customTTL);
    
    // Try to get from cache if not forcing refresh
    if (!forceRefresh) {
        const cachedData = CacheManager.get(cacheKey);
        if (cachedData !== null) {
            console.debug(`Cache hit for ${action}`, { cacheKey, ttl });
            return {
                data: cachedData,
                fromCache: true,
                timestamp: Date.now()
            };
        }
    }
    
    console.debug(`Cache miss for ${action}, fetching from API`, { cacheKey, forceRefresh });
    
    // Fetch fresh data
    const response = await fetchFn();
    
    // Cache the response if successful
    if (response && response.success !== false) {
        const dataToCache = response.data !== undefined ? response.data : response;
        CacheManager.set(cacheKey, dataToCache, ttl);
        console.debug(`Cached data for ${action}`, { cacheKey, ttl });
    }
    
    return {
        data: response.data !== undefined ? response.data : response,
        fromCache: false,
        timestamp: Date.now()
    };
}

/**
 * Invalidate cache after mutations (POST/PUT/DELETE)
 * @param {string} action - The mutation action that was performed
 */
export function invalidateAfterMutation(action) {
    console.debug(`Invalidating cache after mutation: ${action}`);
    
    // Map mutation actions to resources that need invalidation
    const invalidationMap = {
        // Auth mutations
        login: ['dashboard', 'profile'],
        register: [],
        logout: ['all'],
        
        // Course mutations
        addCourse: ['courses', 'dashboard'],
        updateCourse: ['courses', 'dashboard'],
        deleteCourse: ['courses', 'dashboard'],
        
        // Assignment mutations
        addAssignment: ['assignments', 'dashboard'],
        updateAssignment: ['assignments', 'dashboard'],
        updateAssignmentStatus: ['assignments', 'dashboard'],
        deleteAssignment: ['assignments', 'dashboard'],
        
        // Grade mutations
        addGrade: ['grades', 'dashboard'],
        deleteGrade: ['grades', 'dashboard'],
        
        // Finance mutations
        addTransaction: ['finance', 'dashboard'],
        deleteTransaction: ['finance', 'dashboard'],
        
        // Activity mutations
        addActivity: ['activities', 'dashboard'],
        deleteActivity: ['activities', 'dashboard'],
        
        // Habit mutations
        addHabit: ['habits', 'dashboard'],
        updateHabitStreak: ['habits', 'dashboard'],
        deleteHabit: ['habits', 'dashboard'],
        
        // Note mutations
        addNote: ['notes'],
        updateNote: ['notes'],
        deleteNote: ['notes'],
        
        // Profile mutations
        updateUserProfile: ['profile'],
        changePassword: ['profile']
    };
    
    const resourcesToInvalidate = invalidationMap[action];
    
    if (!resourcesToInvalidate) {
        // If action not mapped, invalidate related resource by guessing from action name
        const guessedResource = action.replace(/^(add|update|delete)/, '').toLowerCase();
        if (guessedResource && guessedResource !== action) {
            CacheManager.invalidateResource(guessedResource);
        }
        return;
    }
    
    if (resourcesToInvalidate.includes('all')) {
        CacheManager.clearAll();
        console.debug('Invalidated entire cache');
        return;
    }
    
    for (const resource of resourcesToInvalidate) {
        CacheManager.invalidateResource(resource);
    }
}

// Setup automatic cache cleanup on page load (clear expired entries)
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Small delay to not impact initial load
        setTimeout(() => {
            CacheManager.clearExpired();
        }, 3000);
    });
}

// Export CacheManager for direct use
export { CacheManager, generateCacheKey, getTTLForAction, RESOURCE_TTL_MAP };

export default {
    CacheManager,
    fetchWithCache,
    invalidateAfterMutation,
    generateCacheKey,
    getTTLForAction
};
