/**
 * Login Page Component
 * Handles user authentication
 * Implements PRD Section AUTH-02
 */

import { apiPost } from '../api/client.js';
import { actions, store } from '../store/globalState.js';
import { ROUTES } from '../utils/constants.js';
import { validateLogin } from '../utils/validators.js';
import { showToast } from '../components/Toast.js';

/**
 * Render login page
 * @returns {string} HTML string
 */
function render() {
    // Check if already logged in
    const state = store.getState();
    if (state.isAuthenticated) {
        window.location.hash = ROUTES.DASHBOARD;
        return '';
    }
    
    return `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <div class="auth-logo">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                    <h1 class="auth-title">Welcome Back</h1>
                    <p class="auth-subtitle">Login to continue to Campus Survival OS</p>
                </div>
                
                <form id="loginForm" class="auth-form">
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
                    
                    <div class="form-group">
                        <label for="password">
                            <i class="fas fa-lock"></i>
                            Password
                        </label>
                        <div class="password-wrapper">
                            <input type="password" id="password" name="password" 
                                   placeholder="Enter your password" 
                                   autocomplete="current-password" required>
                            <button type="button" id="togglePassword" class="password-toggle">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="form-error" id="passwordError"></div>
                    </div>
                    
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" id="rememberMe">
                            <span>Remember me</span>
                        </label>
                        <a href="#/forgot-password" class="forgot-link">Forgot Password?</a>
                    </div>
                    
                    <button type="submit" id="loginBtn" class="btn btn-primary btn-block">
                        <i class="fas fa-sign-in-alt"></i>
                        Login
                    </button>
                    
                    <div class="auth-footer">
                        <p>Don't have an account? <a href="#/register">Sign up</a></p>
                    </div>
                </form>
            </div>
        </div>
    `;
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear previous errors
    clearErrors();
    
    // Validate input
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        showToast(firstError, 'error');
        if (validation.errors.email) {
            showFieldError('email', validation.errors.email);
        }
        if (validation.errors.password) {
            showFieldError('password', validation.errors.password);
        }
        return;
    }
    
    // Show loading state
    const submitBtn = document.getElementById('loginBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    try {
        const response = await apiPost('login', {
            email: email,
            password: password
        });
        
        if (response.success && response.data) {
            const { token, user } = response.data;
            
            // Save to store
            actions.setAuth(user, token);
            
            // Handle remember me
            const rememberMe = document.getElementById('rememberMe').checked;
            if (!rememberMe) {
                // Session only - will be cleared on browser close
                sessionStorage.setItem('campusos_token', token);
                sessionStorage.setItem('campusos_user', JSON.stringify(user));
            } else {
                // Persistent - already saved in localStorage by setAuth
            }
            
            showToast(`Welcome back, ${user.fullname}!`, 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.hash = ROUTES.DASHBOARD;
            }, 500);
        } else {
            showToast(response.message || 'Login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please check your credentials.';
        if (error.message === 'Unauthorized' || error.code === 'AUTH_FAILED') {
            errorMessage = 'Invalid email or password.';
        } else if (error.code === 'QUOTA_EXCEEDED') {
            errorMessage = `Too many attempts. Please try again in ${error.retryAfter} seconds.`;
        }
        showToast(errorMessage, 'error');
    } finally {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
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
    
    const inputs = document.querySelectorAll('.form-group input');
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
 * Toggle password visibility
 */
function setupPasswordToggle() {
    const toggleBtn = document.getElementById('togglePassword');
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = toggleBtn.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

/**
 * Setup form event listeners
 */
function setupEventListeners() {
    const form = document.getElementById('loginForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
    
    setupPasswordToggle();
    
    // Clear error on input
    const inputs = ['email', 'password'];
    inputs.forEach(field => {
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
}

/**
 * Check for existing session and redirect
 */
function checkExistingSession() {
    const state = store.getState();
    if (state.isAuthenticated && state.user) {
        window.location.hash = ROUTES.DASHBOARD;
        return true;
    }
    return false;
}

/**
 * Page lifecycle - before render
 * @returns {boolean} True if can render
 */
function beforeRender() {
    // Redirect if already logged in
    if (checkExistingSession()) {
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
const LoginPage = {
    render,
    beforeRender,
    afterRender
};

export default LoginPage;
