/**
 * Register Page Component
 * Handles new user registration
 * Implements PRD Section AUTH-01
 */

import { apiPost } from '../api/client.js';
import { actions, store } from '../store/globalState.js';
import { ROUTES, FACULTY_OPTIONS, getBatchYearOptions } from '../utils/constants.js';
import { validateRegistration } from '../utils/validators.js';
import { showToast } from '../components/Toast.js';

/**
 * Render register page
 * @returns {string} HTML string
 */
function render() {
    // Check if already logged in
    const state = store.getState();
    if (state.isAuthenticated) {
        window.location.hash = ROUTES.DASHBOARD;
        return '';
    }
    
    const facultyOptions = FACULTY_OPTIONS.map(faculty => 
        `<option value="${escapeHtml(faculty)}">${escapeHtml(faculty)}</option>`
    ).join('');
    
    const batchYearOptions = getBatchYearOptions().map(year => 
        `<option value="${year.value}">${year.label}</option>`
    ).join('');
    
    return `
        <div class="auth-container">
            <div class="auth-card register-card">
                <div class="auth-header">
                    <div class="auth-logo">
                        <i class="fas fa-user-plus"></i>
                    </div>
                    <h1 class="auth-title">Create Account</h1>
                    <p class="auth-subtitle">Join Campus Survival OS today</p>
                </div>
                
                <form id="registerForm" class="auth-form">
                    <div class="form-group">
                        <label for="fullname">
                            <i class="fas fa-user"></i>
                            Full Name
                        </label>
                        <input type="text" id="fullname" name="fullname" 
                               placeholder="Your full name" 
                               autocomplete="name" required>
                        <div class="form-error" id="fullnameError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="email">
                            <i class="fas fa-envelope"></i>
                            Email Address
                        </label>
                        <input type="email" id="email" name="email" 
                               placeholder="your@email.com" 
                               autocomplete="email" required>
                        <div class="form-error" id="emailError"></div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="faculty">
                                <i class="fas fa-university"></i>
                                Faculty
                            </label>
                            <select id="faculty" name="faculty" required>
                                <option value="">Select Faculty</option>
                                ${facultyOptions}
                            </select>
                            <div class="form-error" id="facultyError"></div>
                        </div>
                        
                        <div class="form-group half">
                            <label for="major">
                                <i class="fas fa-graduation-cap"></i>
                                Major
                            </label>
                            <input type="text" id="major" name="major" 
                                   placeholder="e.g., Computer Science" 
                                   autocomplete="organization" required>
                            <div class="form-error" id="majorError"></div>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group half">
                            <label for="batch_year">
                                <i class="fas fa-calendar-alt"></i>
                                Batch Year
                            </label>
                            <select id="batch_year" name="batch_year" required>
                                <option value="">Select Year</option>
                                ${batchYearOptions}
                            </select>
                            <div class="form-error" id="batchYearError"></div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">
                            <i class="fas fa-lock"></i>
                            Password
                        </label>
                        <div class="password-wrapper">
                            <input type="password" id="password" name="password" 
                                   placeholder="Create a password" 
                                   autocomplete="new-password" required>
                            <button type="button" id="togglePassword" class="password-toggle">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="password-requirements" id="passwordRequirements">
                            <small>Password must have:</small>
                            <ul>
                                <li id="req-length" class="req-invalid"><i class="fas fa-circle"></i> At least 8 characters</li>
                                <li id="req-upper" class="req-invalid"><i class="fas fa-circle"></i> One uppercase letter</li>
                                <li id="req-lower" class="req-invalid"><i class="fas fa-circle"></i> One lowercase letter</li>
                                <li id="req-number" class="req-invalid"><i class="fas fa-circle"></i> One number</li>
                            </ul>
                        </div>
                        <div class="form-error" id="passwordError"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirmPassword">
                            <i class="fas fa-check-circle"></i>
                            Confirm Password
                        </label>
                        <div class="password-wrapper">
                            <input type="password" id="confirmPassword" name="confirmPassword" 
                                   placeholder="Confirm your password" 
                                   autocomplete="new-password" required>
                            <button type="button" id="toggleConfirmPassword" class="password-toggle">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="form-error" id="confirmPasswordError"></div>
                    </div>
                    
                    <div class="form-terms">
                        <label class="checkbox-label">
                            <input type="checkbox" id="agreeTerms" required>
                            <span>I agree to the <a href="#/terms" target="_blank">Terms of Service</a> and <a href="#/privacy" target="_blank">Privacy Policy</a></span>
                        </label>
                        <div class="form-error" id="termsError"></div>
                    </div>
                    
                    <button type="submit" id="registerBtn" class="btn btn-primary btn-block">
                        <i class="fas fa-user-plus"></i>
                        Create Account
                    </button>
                    
                    <div class="auth-footer">
                        <p>Already have an account? <a href="#/login">Sign in</a></p>
                    </div>
                </form>
            </div>
        </div>
    `;
}

/**
 * Escape HTML helper
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update password requirements UI in real-time
 * @param {string} password - Current password value
 */
function updatePasswordRequirements(password) {
    const requirements = [
        { id: 'req-length', check: password.length >= 8 },
        { id: 'req-upper', check: /[A-Z]/.test(password) },
        { id: 'req-lower', check: /[a-z]/.test(password) },
        { id: 'req-number', check: /[0-9]/.test(password) }
    ];
    
    requirements.forEach(req => {
        const element = document.getElementById(req.id);
        if (element) {
            if (req.check) {
                element.className = 'req-valid';
                element.innerHTML = '<i class="fas fa-check-circle"></i> ' + element.textContent.replace(/[^a-zA-Z\s]/g, '').trim();
            } else {
                element.className = 'req-invalid';
                element.innerHTML = '<i class="fas fa-circle"></i> ' + element.textContent.replace(/[^a-zA-Z\s]/g, '').trim();
            }
        }
    });
}

/**
 * Validate form fields
 * @param {Object} data - Form data
 * @returns {Object} Validation result
 */
function validateForm(data) {
    const validation = validateRegistration(data);
    
    // Show field errors
    if (validation.errors.fullname) {
        showFieldError('fullname', validation.errors.fullname);
    }
    if (validation.errors.email) {
        showFieldError('email', validation.errors.email);
    }
    if (validation.errors.password) {
        showFieldError('password', validation.errors.password);
    }
    if (validation.errors.confirmPassword) {
        showFieldError('confirmPassword', validation.errors.confirmPassword);
    }
    if (validation.errors.faculty) {
        showFieldError('faculty', validation.errors.faculty);
    }
    if (validation.errors.major) {
        showFieldError('major', validation.errors.major);
    }
    if (validation.errors.batch_year) {
        showFieldError('batch_year', validation.errors.batch_year);
    }
    
    // Check terms
    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!agreeTerms) {
        showFieldError('terms', 'You must agree to the Terms of Service');
        validation.isValid = false;
    }
    
    return validation;
}

/**
 * Clear all field errors
 */
function clearErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    
    const inputs = document.querySelectorAll('.form-group input, .form-group select');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

/**
 * Show error for specific field
 * @param {string} field - Field name
 * @param {string} message - Error message
 */
function showFieldError(field, message) {
    const errorEl = document.getElementById(`${field}Error`);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
    
    const inputEl = document.getElementById(field);
    if (inputEl) {
        inputEl.classList.add('error');
    }
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    // Get form data
    const formData = {
        fullname: document.getElementById('fullname').value.trim(),
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        faculty: document.getElementById('faculty').value,
        major: document.getElementById('major').value.trim(),
        batch_year: document.getElementById('batch_year').value
    };
    
    // Clear previous errors
    clearErrors();
    
    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        if (firstError) {
            showToast(firstError, 'error');
        }
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('registerBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    
    try {
        const response = await apiPost('register', {
            fullname: formData.fullname,
            email: formData.email,
            password: formData.password,
            faculty: formData.faculty,
            major: formData.major,
            batch_year: formData.batch_year
        });
        
        if (response.success) {
            showToast('Registration successful! Please login.', 'success');
            
            // Auto-fill login form if redirected to login
            setTimeout(() => {
                window.location.hash = ROUTES.LOGIN;
            }, 1500);
        } else {
            let errorMessage = response.message || 'Registration failed. Please try again.';
            if (response.code === 'DUPLICATE_EMAIL') {
                errorMessage = 'Email already registered. Please use another email or login.';
                showFieldError('email', errorMessage);
            }
            showToast(errorMessage, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';
        if (error.code === 'QUOTA_EXCEEDED') {
            errorMessage = `Too many attempts. Please try again in ${error.retryAfter} seconds.`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        showToast(errorMessage, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

/**
 * Setup password visibility toggles
 */
function setupPasswordToggles() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirm = document.getElementById('toggleConfirmPassword');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    if (toggleConfirm && confirmInput) {
        toggleConfirm.addEventListener('click', () => {
            const type = confirmInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmInput.setAttribute('type', type);
            const icon = toggleConfirm.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
}

/**
 * Setup real-time password validation
 */
function setupPasswordValidation() {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordRequirements(e.target.value);
        });
    }
}

/**
 * Setup confirm password validation
 */
function setupConfirmPasswordValidation() {
    const confirmInput = document.getElementById('confirmPassword');
    const passwordInput = document.getElementById('password');
    
    if (confirmInput && passwordInput) {
        const validateMatch = () => {
            if (confirmInput.value && confirmInput.value !== passwordInput.value) {
                showFieldError('confirmPassword', 'Passwords do not match');
            } else {
                const errorEl = document.getElementById('confirmPasswordError');
                if (errorEl) {
                    errorEl.textContent = '';
                    errorEl.style.display = 'none';
                }
                confirmInput.classList.remove('error');
            }
        };
        
        confirmInput.addEventListener('input', validateMatch);
        passwordInput.addEventListener('input', validateMatch);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    setupPasswordToggles();
    setupPasswordValidation();
    setupConfirmPasswordValidation();
    
    // Clear error on input
    const fields = ['fullname', 'email', 'faculty', 'major', 'batch_year', 'password', 'confirmPassword'];
    fields.forEach(field => {
        const input = document.getElementById(field);
        if (input) {
            input.addEventListener('input', () => {
                const errorEl = document.getElementById(`${field}Error`);
                if (errorEl) {
                    errorEl.textContent = '';
                    errorEl.style.display = 'none';
                }
                input.classList.remove('error');
            });
        }
    });
    
    // Terms checkbox clear error
    const termsCheckbox = document.getElementById('agreeTerms');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            const errorEl = document.getElementById('termsError');
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
        });
    }
}

/**
 * Page lifecycle - before render
 * @returns {boolean} True if can render
 */
function beforeRender() {
    const state = store.getState();
    if (state.isAuthenticated) {
        window.location.hash = ROUTES.DASHBOARD;
        return false;
    }
    return true;
}

/**
 * Page lifecycle - after render
 */
function afterRender() {
    setupEventListeners();
}

// Export page component
const RegisterPage = {
    render,
    beforeRender,
    afterRender
};

export default RegisterPage;
