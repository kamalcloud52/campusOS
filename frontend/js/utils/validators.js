/**
 * Validators Module
 * Client-side validation utilities
 * Implements PRD Section 4.3 validation requirements
 * LAST UPDATED: Phase 8 - Complete
 */

import { GRADE_MAP, VALIDATION } from './constants.js';

// ============================================
// Email Validation
// ============================================

export function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@]{2,}$/;
    return emailRegex.test(email);
}

// ============================================
// Password Validation
// ============================================

export function validatePassword(password) {
    const errors = [];
    
    if (!password) {
        errors.push('Password is required');
        return { isValid: false, errors };
    }
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least 1 uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least 1 lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least 1 number');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

export function isValidPassword(password) {
    if (!password) return false;
    if (password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    return true;
}

export function doPasswordsMatch(password, confirmPassword) {
    return password === confirmPassword;
}

// ============================================
// Name Validations
// ============================================

export function validateFullName(name) {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Full name is required' };
    }
    
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return { isValid: false, error: 'Full name is required' };
    }
    
    if (trimmed.length < VALIDATION.MIN_NAME_LENGTH) {
        return { isValid: false, error: `Full name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters` };
    }
    
    if (trimmed.length > VALIDATION.MAX_NAME_LENGTH) {
        return { isValid: false, error: `Full name must not exceed ${VALIDATION.MAX_NAME_LENGTH} characters` };
    }
    
    const nameRegex = /^[a-zA-Z\s\.\'-]+$/;
    if (!nameRegex.test(trimmed)) {
        return { isValid: false, error: 'Full name contains invalid characters' };
    }
    
    return { isValid: true, error: null };
}

// ============================================
// Course Validations
// ============================================

export function validateCourseName(name) {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Course name is required' };
    }
    
    const trimmed = name.trim();
    if (trimmed.length === 0) {
        return { isValid: false, error: 'Course name is required' };
    }
    
    if (trimmed.length < VALIDATION.MIN_NAME_LENGTH) {
        return { isValid: false, error: `Course name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters` };
    }
    
    if (trimmed.length > VALIDATION.MAX_NAME_LENGTH) {
        return { isValid: false, error: `Course name must not exceed ${VALIDATION.MAX_NAME_LENGTH} characters` };
    }
    
    return { isValid: true, error: null };
}

export function validateCredits(credits) {
    const num = typeof credits === 'string' ? parseFloat(credits) : credits;
    
    if (isNaN(num)) {
        return { isValid: false, error: 'Credits must be a number' };
    }
    
    if (num < VALIDATION.MIN_CREDITS) {
        return { isValid: false, error: `Credits must be at least ${VALIDATION.MIN_CREDITS}` };
    }
    
    if (num > VALIDATION.MAX_CREDITS) {
        return { isValid: false, error: `Credits cannot exceed ${VALIDATION.MAX_CREDITS}` };
    }
    
    if (!Number.isInteger(num)) {
        return { isValid: false, error: 'Credits must be a whole number' };
    }
    
    return { isValid: true, error: null };
}

// ============================================
// Grade Validations
// ============================================

export function validateGrade(grade) {
    const num = typeof grade === 'string' ? parseFloat(grade) : grade;
    
    if (isNaN(num)) {
        return { isValid: false, error: 'Grade must be a number' };
    }
    
    if (num < 0 || num > 4) {
        return { isValid: false, error: 'Grade must be between 0 and 4' };
    }
    
    return { isValid: true, error: null };
}

export function validateSemester(semester) {
    const num = typeof semester === 'string' ? parseInt(semester, 10) : semester;
    
    if (isNaN(num)) {
        return { isValid: false, error: 'Semester is required' };
    }
    
    if (num < VALIDATION.MIN_SEMESTER || num > VALIDATION.MAX_SEMESTER) {
        return { isValid: false, error: `Semester must be between ${VALIDATION.MIN_SEMESTER} and ${VALIDATION.MAX_SEMESTER}` };
    }
    
    return { isValid: true, error: null };
}

// ============================================
// Finance Validations
// ============================================

export function validateAmount(amount) {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(num)) {
        return { isValid: false, error: 'Amount must be a number' };
    }
    
    if (num <= 0) {
        return { isValid: false, error: 'Amount must be greater than 0' };
    }
    
    if (num > VALIDATION.MAX_AMOUNT) {
        return { isValid: false, error: `Amount cannot exceed ${VALIDATION.MAX_AMOUNT.toLocaleString()}` };
    }
    
    const decimalPlaces = (num.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
        return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
    }
    
    return { isValid: true, error: null };
}

// ============================================
// Date Validations
// ============================================

export function validateDate(date) {
    if (!date) {
        return { isValid: false, error: 'Date is required' };
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return { isValid: false, error: 'Invalid date format. Use YYYY-MM-DD' };
    }
    
    const d = new Date(date);
    if (isNaN(d.getTime())) {
        return { isValid: false, error: 'Invalid date' };
    }
    
    return { isValid: true, error: null };
}

export function validateFutureDate(date) {
    const dateValidation = validateDate(date);
    if (!dateValidation.isValid) return dateValidation;
    
    const d = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (d < today) {
        return { isValid: false, error: 'Deadline must be in the future' };
    }
    
    return { isValid: true, error: null };
}

// ============================================
// Title & Description Validations
// ============================================

export function validateTitle(title, maxLength = VALIDATION.MAX_TITLE_LENGTH) {
    if (!title || typeof title !== 'string') {
        return { isValid: false, error: 'Title is required' };
    }
    
    const trimmed = title.trim();
    if (trimmed.length === 0) {
        return { isValid: false, error: 'Title is required' };
    }
    
    if (trimmed.length < VALIDATION.MIN_TITLE_LENGTH) {
        return { isValid: false, error: `Title must be at least ${VALIDATION.MIN_TITLE_LENGTH} characters` };
    }
    
    if (trimmed.length > maxLength) {
        return { isValid: false, error: `Title must not exceed ${maxLength} characters` };
    }
    
    return { isValid: true, error: null };
}

export function validateDescription(description, maxLength = VALIDATION.MAX_DESCRIPTION_LENGTH) {
    if (!description) {
        return { isValid: true, error: null };
    }
    
    const trimmed = description.trim();
    if (trimmed.length > maxLength) {
        return { isValid: false, error: `Description must not exceed ${maxLength} characters` };
    }
    
    return { isValid: true, error: null };
}

export function validateNoteContent(content) {
    if (!content || typeof content !== 'string') {
        return { isValid: false, error: 'Content is required' };
    }
    
    const trimmed = content.trim();
    if (trimmed.length === 0) {
        return { isValid: false, error: 'Content is required' };
    }
    
    if (trimmed.length > VALIDATION.MAX_NOTE_CONTENT_LENGTH) {
        return { isValid: false, error: `Content must not exceed ${VALIDATION.MAX_NOTE_CONTENT_LENGTH.toLocaleString()} characters` };
    }
    
    return { isValid: true, error: null };
}

// ============================================
// Faculty & Major Validations
// ============================================

export function validateFaculty(faculty) {
    if (!faculty || typeof faculty !== 'string') {
        return { isValid: false, error: 'Faculty is required' };
    }
    
    const trimmed = faculty.trim();
    if (trimmed.length === 0) {
        return { isValid: false, error: 'Faculty is required' };
    }
    
    if (trimmed.length > 50) {
        return { isValid: false, error: 'Faculty must not exceed 50 characters' };
    }
    
    return { isValid: true, error: null };
}

export function validateMajor(major) {
    if (!major || typeof major !== 'string') {
        return { isValid: false, error: 'Major is required' };
    }
    
    const trimmed = major.trim();
    if (trimmed.length === 0) {
        return { isValid: false, error: 'Major is required' };
    }
    
    if (trimmed.length > 50) {
        return { isValid: false, error: 'Major must not exceed 50 characters' };
    }
    
    return { isValid: true, error: null };
}

export function validateBatchYear(year) {
    const num = typeof year === 'string' ? parseInt(year, 10) : year;
    const currentYear = new Date().getFullYear();
    
    if (isNaN(num)) {
        return { isValid: false, error: 'Batch year is required' };
    }
    
    if (num < VALIDATION.MIN_BATCH_YEAR) {
        return { isValid: false, error: `Batch year cannot be before ${VALIDATION.MIN_BATCH_YEAR}` };
    }
    
    if (num > currentYear + 1) {
        return { isValid: false, error: 'Batch year cannot be in the future' };
    }
    
    return { isValid: true, error: null };
}

// ============================================
// Sanitization
// ============================================

export function sanitizeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function sanitizeInput(str) {
    if (!str || typeof str !== 'string') return '';
    let cleaned = str.trim();
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '');
    cleaned = cleaned.replace(/javascript:/gi, '');
    return cleaned;
}

// ============================================
// Generic Validation Function
// ============================================

export function validateAndSanitize(data, schema) {
    const errors = {};
    const sanitizedData = {};
    
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            errors[field] = `${field} is required`;
            continue;
        }
        
        if (!rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
            sanitizedData[field] = '';
            continue;
        }
        
        let sanitizedValue = value;
        if (rules.sanitize && typeof value === 'string') {
            sanitizedValue = sanitizeInput(value);
        }
        
        if (rules.type) {
            switch (rules.type) {
                case 'email':
                    if (!isValidEmail(sanitizedValue)) {
                        errors[field] = 'Invalid email format';
                    }
                    break;
                case 'number':
                    if (isNaN(parseFloat(sanitizedValue))) {
                        errors[field] = 'Must be a number';
                    }
                    break;
                case 'string':
                    if (typeof sanitizedValue !== 'string') {
                        errors[field] = 'Must be text';
                    }
                    break;
            }
        }
        
        if (rules.validate && typeof rules.validate === 'function') {
            const result = rules.validate(sanitizedValue);
            if (!result.isValid) {
                errors[field] = result.error;
            }
        }
        
        if (rules.maxLength && typeof sanitizedValue === 'string') {
            if (sanitizedValue.length > rules.maxLength) {
                errors[field] = `Maximum ${rules.maxLength} characters allowed`;
            }
        }
        
        if (rules.minLength && typeof sanitizedValue === 'string') {
            if (sanitizedValue.length < rules.minLength) {
                errors[field] = `Minimum ${rules.minLength} characters required`;
            }
        }
        
        sanitizedData[field] = sanitizedValue;
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors,
        sanitizedData
    };
}

// ============================================
// Login Validation
// ============================================

export function validateLogin(data) {
    const errors = {};
    
    if (!data.email || data.email.trim() === '') {
        errors.email = 'Email is required';
    } else if (!isValidEmail(data.email)) {
        errors.email = 'Invalid email format';
    }
    
    if (!data.password || data.password.trim() === '') {
        errors.password = 'Password is required';
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// ============================================
// Registration Validation
// ============================================

export function validateRegistration(data) {
    const errors = {};
    
    if (!data.fullname || data.fullname.trim() === '') {
        errors.fullname = 'Full name is required';
    } else if (data.fullname.length < VALIDATION.MIN_NAME_LENGTH) {
        errors.fullname = `Full name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`;
    } else if (data.fullname.length > VALIDATION.MAX_NAME_LENGTH) {
        errors.fullname = `Full name must not exceed ${VALIDATION.MAX_NAME_LENGTH} characters`;
    }
    
    if (!data.email || data.email.trim() === '') {
        errors.email = 'Email is required';
    } else if (!isValidEmail(data.email)) {
        errors.email = 'Invalid email format';
    }
    
    if (!data.password) {
        errors.password = 'Password is required';
    } else if (!isValidPassword(data.password)) {
        errors.password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
    
    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!data.faculty || data.faculty === '') {
        errors.faculty = 'Faculty is required';
    }
    
    if (!data.major || data.major.trim() === '') {
        errors.major = 'Major is required';
    } else if (data.major.length > 50) {
        errors.major = 'Major must not exceed 50 characters';
    }
    
    if (!data.batch_year || data.batch_year === '') {
        errors.batch_year = 'Batch year is required';
    } else {
        const year = parseInt(data.batch_year);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 2000 || year > currentYear + 1) {
            errors.batch_year = 'Invalid batch year';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

// ============================================
// Export all validators
// ============================================

export default {
    isValidEmail,
    validatePassword,
    isValidPassword,
    doPasswordsMatch,
    validateFullName,
    validateCourseName,
    validateCredits,
    validateGrade,
    validateSemester,
    validateAmount,
    validateDate,
    validateFutureDate,
    validateTitle,
    validateDescription,
    validateNoteContent,
    validateFaculty,
    validateMajor,
    validateBatchYear,
    sanitizeHTML,
    sanitizeInput,
    validateAndSanitize,
    validateLogin,
    validateRegistration
};
