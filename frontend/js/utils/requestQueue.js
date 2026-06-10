/**
 * Request Queue Module
 * Manages concurrent requests to prevent overload on Google Apps Script
 * Implements PRD Section 4.2 Request Queue requirements
 */

// Configuration
const DEFAULT_MAX_CONCURRENT = 3;
const DEFAULT_PRIORITY_LEVELS = {
    HIGH: 0,
    NORMAL: 1,
    LOW: 2
};

// Priority mapping for different request types
const REQUEST_PRIORITY = {
    // High priority - user interactions that need immediate response
    login: DEFAULT_PRIORITY_LEVELS.HIGH,
    register: DEFAULT_PRIORITY_LEVELS.HIGH,
    updateAssignmentStatus: DEFAULT_PRIORITY_LEVELS.HIGH, // Drag & drop
    addNote: DEFAULT_PRIORITY_LEVELS.HIGH,
    updateNote: DEFAULT_PRIORITY_LEVELS.HIGH,
    deleteNote: DEFAULT_PRIORITY_LEVELS.HIGH,
    
    // Normal priority - standard CRUD operations
    addCourse: DEFAULT_PRIORITY_LEVELS.NORMAL,
    updateCourse: DEFAULT_PRIORITY_LEVELS.NORMAL,
    deleteCourse: DEFAULT_PRIORITY_LEVELS.NORMAL,
    addAssignment: DEFAULT_PRIORITY_LEVELS.NORMAL,
    updateAssignment: DEFAULT_PRIORITY_LEVELS.NORMAL,
    deleteAssignment: DEFAULT_PRIORITY_LEVELS.NORMAL,
    addGrade: DEFAULT_PRIORITY_LEVELS.NORMAL,
    deleteGrade: DEFAULT_PRIORITY_LEVELS.NORMAL,
    addTransaction: DEFAULT_PRIORITY_LEVELS.NORMAL,
    deleteTransaction: DEFAULT_PRIORITY_LEVELS.NORMAL,
    addHabit: DEFAULT_PRIORITY_LEVELS.NORMAL,
    updateHabitStreak: DEFAULT_PRIORITY_LEVELS.NORMAL,
    deleteHabit: DEFAULT_PRIORITY_LEVELS.NORMAL,
    updateUserProfile: DEFAULT_PRIORITY_LEVELS.NORMAL,
    changePassword: DEFAULT_PRIORITY_LEVELS.NORMAL,
    
    // Low priority - data fetching that can wait
    getDashboard: DEFAULT_PRIORITY_LEVELS.LOW,
    getCourses: DEFAULT_PRIORITY_LEVELS.LOW,
    getAssignments: DEFAULT_PRIORITY_LEVELS.LOW,
    getGrades: DEFAULT_PRIORITY_LEVELS.LOW,
    getFinance: DEFAULT_PRIORITY_LEVELS.LOW,
    getFinanceSummary: DEFAULT_PRIORITY_LEVELS.LOW,
    getActivities: DEFAULT_PRIORITY_LEVELS.LOW,
    getHabits: DEFAULT_PRIORITY_LEVELS.LOW,
    getNotes: DEFAULT_PRIORITY_LEVELS.LOW,
    getUserProfile: DEFAULT_PRIORITY_LEVELS.LOW
};

/**
 * Get priority for a specific action
 * @param {string} action - API action name
 * @returns {number} Priority level (lower = higher priority)
 */
function getPriorityForAction(action) {
    return REQUEST_PRIORITY[action] !== undefined ? REQUEST_PRIORITY[action] : DEFAULT_PRIORITY_LEVELS.NORMAL;
}

/**
 * Request Queue Class
 * Manages queuing and execution of API requests with concurrency control
 */
class RequestQueue {
    constructor(maxConcurrent = DEFAULT_MAX_CONCURRENT) {
        this.queue = [];
        this.activeCount = 0;
        this.maxConcurrent = maxConcurrent;
        this.isPaused = false;
        this.statistics = {
            totalQueued: 0,
            totalProcessed: 0,
            totalFailed: 0,
            averageWaitTime: 0
        };
    }
    
    /**
     * Add a request to the queue
     * @param {Function} requestFn - Function that returns a Promise
     * @param {string} action - API action name (for priority)
     * @param {object} options - Additional options (timeout, retryCount)
     * @returns {Promise} Promise that resolves with request result
     */
    add(requestFn, action = 'unknown', options = {}) {
        const priority = getPriorityForAction(action);
        const timeout = options.timeout || 30000;
        const maxRetries = options.maxRetries || 0;
        
        return new Promise((resolve, reject) => {
            const queueItem = {
                id: this.generateId(),
                requestFn,
                action,
                priority,
                timeout,
                maxRetries,
                retryCount: 0,
                resolve,
                reject,
                enqueuedAt: Date.now()
            };
            
            // Insert based on priority (higher priority = lower number)
            let inserted = false;
            for (let i = 0; i < this.queue.length; i++) {
                if (this.queue[i].priority > priority) {
                    this.queue.splice(i, 0, queueItem);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                this.queue.push(queueItem);
            }
            
            this.statistics.totalQueued++;
            this.updateWaitTimeStats(queueItem);
            
            // Try to process queue
            this.process();
            
            // Log queue status in development
            if (import.meta.env?.DEV) {
                console.debug(`[Queue] Added ${action} (priority: ${priority}). Queue size: ${this.queue.length}, Active: ${this.activeCount}`);
            }
        });
    }
    
    /**
     * Generate unique ID for queue item
     */
    generateId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Update average wait time statistics
     */
    updateWaitTimeStats(item) {
        // Will be updated when request completes
        item.waitStart = Date.now();
    }
    
    /**
     * Process the queue - execute next request if under limit
     */
    async process() {
        // Don't process if paused or at max concurrent
        if (this.isPaused) return;
        if (this.activeCount >= this.maxConcurrent) return;
        if (this.queue.length === 0) return;
        
        // Get next item from queue
        const item = this.queue.shift();
        this.activeCount++;
        
        // Calculate wait time
        const waitTime = Date.now() - item.enqueuedAt;
        
        if (import.meta.env?.DEV) {
            console.debug(`[Queue] Processing ${item.action} (wait: ${waitTime}ms). Active: ${this.activeCount}/${this.maxConcurrent}`);
        }
        
        // Execute with timeout
        this.executeWithTimeout(item);
    }
    
    /**
     * Execute request with timeout and retry logic
     */
    async executeWithTimeout(item) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Request timeout after ${item.timeout}ms: ${item.action}`));
            }, item.timeout);
        });
        
        try {
            const result = await Promise.race([
                item.requestFn(),
                timeoutPromise
            ]);
            
            // Success
            this.statistics.totalProcessed++;
            item.resolve(result);
            
            if (import.meta.env?.DEV) {
                console.debug(`[Queue] Completed ${item.action}. Active: ${this.activeCount - 1}/${this.maxConcurrent}`);
            }
            
        } catch (error) {
            // Check if we should retry
            if (item.retryCount < item.maxRetries) {
                item.retryCount++;
                item.enqueuedAt = Date.now(); // Reset enqueue time
                
                console.warn(`[Queue] Retrying ${item.action} (${item.retryCount}/${item.maxRetries})`);
                
                // Re-queue with same priority
                let inserted = false;
                for (let i = 0; i < this.queue.length; i++) {
                    if (this.queue[i].priority > item.priority) {
                        this.queue.splice(i, 0, item);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) {
                    this.queue.unshift(item); // Retry with higher priority
                }
                
                this.activeCount--;
                this.process();
                return;
            }
            
            // Failed after all retries
            this.statistics.totalFailed++;
            item.reject(error);
            
            console.error(`[Queue] Failed ${item.action}:`, error.message);
        }
        
        this.activeCount--;
        
        // Process next request
        this.process();
    }
    
    /**
     * Pause queue processing
     */
    pause() {
        this.isPaused = true;
        console.debug('[Queue] Paused');
    }
    
    /**
     * Resume queue processing
     */
    resume() {
        this.isPaused = false;
        console.debug('[Queue] Resumed');
        this.process();
    }
    
    /**
     * Clear all pending requests from queue
     */
    clear() {
        const pendingCount = this.queue.length;
        
        // Reject all pending promises
        for (const item of this.queue) {
            item.reject(new Error('Queue cleared'));
        }
        
        this.queue = [];
        console.debug(`[Queue] Cleared ${pendingCount} pending requests`);
    }
    
    /**
     * Get current queue status
     */
    getStatus() {
        return {
            activeCount: this.activeCount,
            queuedCount: this.queue.length,
            maxConcurrent: this.maxConcurrent,
            isPaused: this.isPaused,
            queue: this.queue.map(item => ({
                id: item.id,
                action: item.action,
                priority: item.priority,
                waitTime: Date.now() - item.enqueuedAt
            })),
            statistics: { ...this.statistics }
        };
    }
    
    /**
     * Get queue statistics
     */
    getStats() {
        return {
            ...this.statistics,
            currentQueueSize: this.queue.length,
            currentActive: this.activeCount,
            utilization: (this.activeCount / this.maxConcurrent) * 100
        };
    }
    
    /**
     * Set max concurrent requests
     */
    setMaxConcurrent(max) {
        if (max > 0) {
            this.maxConcurrent = max;
            console.debug(`[Queue] Max concurrent set to ${max}`);
            this.process();
        }
    }
    
    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.queue.length === 0 && this.activeCount === 0;
    }
    
    /**
     * Wait for all pending requests to complete
     */
    async waitForAll() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.isEmpty()) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
}

// Create singleton instance
const requestQueue = new RequestQueue(DEFAULT_MAX_CONCURRENT);

/**
 * Helper function to add request to queue
 * @param {Function} requestFn - Function that returns a Promise
 * @param {string} action - API action name
 * @param {object} options - Additional options
 * @returns {Promise} Promise that resolves with request result
 */
export function enqueueRequest(requestFn, action = 'unknown', options = {}) {
    return requestQueue.add(requestFn, action, options);
}

/**
 * Get current queue status
 */
export function getQueueStatus() {
    return requestQueue.getStatus();
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
    return requestQueue.getStats();
}

/**
 * Pause queue processing
 */
export function pauseQueue() {
    requestQueue.pause();
}

/**
 * Resume queue processing
 */
export function resumeQueue() {
    requestQueue.resume();
}

/**
 * Clear all pending requests
 */
export function clearQueue() {
    requestQueue.clear();
}

/**
 * Set max concurrent requests
 */
export function setMaxConcurrent(max) {
    requestQueue.setMaxConcurrent(max);
}

/**
 * Wait for all requests to complete
 */
export function waitForAllRequests() {
    return requestQueue.waitForAll();
}

// Export the queue instance for advanced use cases
export { requestQueue, DEFAULT_MAX_CONCURRENT, DEFAULT_PRIORITY_LEVELS, getPriorityForAction };

export default {
    enqueueRequest,
    getQueueStatus,
    getQueueStats,
    pauseQueue,
    resumeQueue,
    clearQueue,
    setMaxConcurrent,
    waitForAllRequests,
    requestQueue
};
