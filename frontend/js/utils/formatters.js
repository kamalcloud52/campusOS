/**
 * Formatters Module
 * Date, currency, GPA, and text formatting utilities
 * Implements PRD requirements for consistent data display
 */

/**
 * Format date to Indonesian format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type: 'full', 'date', 'time', 'datetime', 'relative'
 * @returns {string} Formatted date string
 */
export function formatDate(date, format = 'full') {
    if (!date) return '-';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const options = {
        full: { year: 'numeric', month: 'long', day: 'numeric' },
        date: { year: 'numeric', month: 'numeric', day: 'numeric' },
        time: { hour: '2-digit', minute: '2-digit' },
        datetime: { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' },
        short: { year: 'numeric', month: 'short', day: 'numeric' }
    };
    
    const selectedOptions = options[format] || options.full;
    return d.toLocaleDateString('id-ID', selectedOptions);
}

/**
 * Format date as relative time (e.g., "2 days ago", "tomorrow")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
    if (!date) return '-';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const now = new Date();
    const diffMs = d - now;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffWeek = Math.round(diffDay / 7);
    const diffMonth = Math.round(diffDay / 30);
    
    // Past dates
    if (diffMs < 0) {
        const absDiffDay = Math.abs(diffDay);
        const absDiffHour = Math.abs(diffHour);
        const absDiffMin = Math.abs(diffMin);
        
        if (absDiffMin < 1) return 'just now';
        if (absDiffMin < 60) return `${absDiffMin} minute${absDiffMin > 1 ? 's' : ''} ago`;
        if (absDiffHour < 24) return `${absDiffHour} hour${absDiffHour > 1 ? 's' : ''} ago`;
        if (absDiffDay === 1) return 'yesterday';
        if (absDiffDay < 7) return `${absDiffDay} days ago`;
        if (absDiffWeek < 4) return `${absDiffWeek} week${absDiffWeek > 1 ? 's' : ''} ago`;
        if (absDiffMonth < 12) return `${absDiffMonth} month${absDiffMonth > 1 ? 's' : ''} ago`;
        return formatDate(date, 'date');
    }
    
    // Future dates
    if (diffMin < 60) return `in ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
    if (diffHour < 24) return `in ${diffHour} hour${diffHour > 1 ? 's' : ''}`;
    if (diffDay === 1) return 'tomorrow';
    if (diffDay < 7) return `in ${diffDay} days`;
    if (diffWeek < 4) return `in ${diffWeek} week${diffWeek > 1 ? 's' : ''}`;
    if (diffMonth < 12) return `in ${diffMonth} month${diffMonth > 1 ? 's' : ''}`;
    return formatDate(date, 'date');
}

/**
 * Format currency as Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '-';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '-';
    
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
}

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
    if (num === undefined || num === null) return '-';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '-';
    
    return new Intl.NumberFormat('id-ID').format(n);
}

/**
 * Format decimal number with specified precision
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted decimal string
 */
export function formatDecimal(num, decimals = 2) {
    if (num === undefined || num === null) return '-';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '-';
    
    return n.toFixed(decimals);
}

/**
 * Format GPA value (0-4 scale)
 * @param {number} gpa - GPA value
 * @returns {string} Formatted GPA string
 */
export function formatGPA(gpa) {
    if (gpa === undefined || gpa === null) return '-';
    const g = typeof gpa === 'string' ? parseFloat(gpa) : gpa;
    if (isNaN(g)) return '-';
    
    return g.toFixed(2);
}

/**
 * Get grade letter from numeric value
 * @param {number} numericGrade - Numeric grade (0-4)
 * @returns {string} Letter grade
 */
export function getGradeLetter(numericGrade) {
    const grade = typeof numericGrade === 'string' ? parseFloat(numericGrade) : numericGrade;
    if (isNaN(grade)) return '-';
    
    if (grade >= 3.85) return 'A';
    if (grade >= 3.5) return 'A-';
    if (grade >= 3.2) return 'B+';
    if (grade >= 2.85) return 'B';
    if (grade >= 2.5) return 'B-';
    if (grade >= 2.2) return 'C+';
    if (grade >= 1.85) return 'C';
    if (grade >= 1.5) return 'C-';
    if (grade >= 1.0) return 'D';
    return 'E';
}

/**
 * Get CSS class for grade based on value
 * @param {number} grade - Grade value
 * @returns {string} CSS class name
 */
export function getGradeClass(grade) {
    const g = typeof grade === 'string' ? parseFloat(grade) : grade;
    if (isNaN(g)) return '';
    
    if (g >= 3.5) return 'grade-a';
    if (g >= 2.5) return 'grade-b';
    if (g >= 1.5) return 'grade-c';
    if (g >= 1.0) return 'grade-d';
    return 'grade-e';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100, suffix = '...') {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of each word
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export function capitalizeWords(text) {
    if (!text) return '';
    return text.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Format file size from bytes to human readable
 * @param {number} bytes - Size in bytes
 * @returns {string} Human readable size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format phone number to Indonesian format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
    if (!phone) return '';
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as Indonesian number
    if (cleaned.startsWith('62')) {
        return cleaned.replace(/(\d{2})(\d{3})(\d{4})(\d{4})/, '+$1 $2 $3 $4');
    }
    if (cleaned.startsWith('0')) {
        return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    }
    return phone;
}

/**
 * Get status badge class for assignments
 * @param {string} status - Assignment status (pending/progress/done)
 * @returns {string} CSS class name
 */
export function getAssignmentStatusClass(status) {
    const statusMap = {
        pending: 'status-pending',
        progress: 'status-progress',
        done: 'status-done'
    };
    return statusMap[status] || 'status-pending';
}

/**
 * Get status text in Indonesian
 * @param {string} status - Assignment status
 * @returns {string} Indonesian status text
 */
export function getAssignmentStatusText(status) {
    const statusMap = {
        pending: 'Not Started',
        progress: 'In Progress',
        done: 'Completed'
    };
    return statusMap[status] || 'Not Started';
}

/**
 * Format duration in minutes to human readable
 * @param {number} minutes - Duration in minutes
 * @returns {string} Human readable duration
 */
export function formatDuration(minutes) {
    if (!minutes || minutes < 0) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins} minute${mins !== 1 ? 's' : ''}`;
    if (mins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    return `${hours}h ${mins}m`;
}

/**
 * Format semester display
 * @param {number} year - Year (e.g., 2024)
 * @param {number} semester - Semester number (1 or 2)
 * @returns {string} Formatted semester string
 */
export function formatSemester(year, semester) {
    const semesterText = semester === 1 ? 'Odd' : 'Even';
    return `${year} - ${semesterText} Semester`;
}

/**
 * Parse semester string to year and semester
 * @param {string} semesterStr - Semester string (e.g., "2024 - Odd Semester")
 * @returns {object} Object with year and semester
 */
export function parseSemester(semesterStr) {
    if (!semesterStr) return null;
    const match = semesterStr.match(/(\d{4}) - (Odd|Even) Semester/);
    if (!match) return null;
    return {
        year: parseInt(match[1]),
        semester: match[2] === 'Odd' ? 1 : 2
    };
}

// Export all formatters as a single object
export default {
    formatDate,
    formatRelativeTime,
    formatCurrency,
    formatNumber,
    formatDecimal,
    formatGPA,
    getGradeLetter,
    getGradeClass,
    truncateText,
    capitalizeWords,
    formatFileSize,
    formatPhoneNumber,
    getAssignmentStatusClass,
    getAssignmentStatusText,
    formatDuration,
    formatSemester,
    parseSemester
};
