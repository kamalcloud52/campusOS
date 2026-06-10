/**
 * Profile Page Component
 * Displays and manages user profile information
 * Implements PRD Section PROF-01
 */

import { store, actions } from '../store/globalState.js';
import { profileAPI } from '../api/endpoints.js';
import { fetchWithCache, invalidateAfterMutation } from '../api/cacheService.js';
import { showToast } from '../components/Toast.js';
import { confirmModal } from '../components/Modal.js';
import { CACHE_TTL, FACULTY_OPTIONS, getBatchYearOptions } from '../utils/constants.js';
import { validateFullName, validateFaculty, validateMajor, validateBatchYear, isValidPassword } from '../utils/validators.js';
import { formatDate } from '../utils/formatters.js';
import { logout } from '../utils/session.js';

// State
let isEditing = false;

/**
 * Render profile page
 * @returns {string} HTML string
 */
function render() {
    const state = store.getState();
    const isLoading = state.isLoading;
    const user = state.user;
    
    if (isLoading || !user) {
        return renderSkeleton();
    }
    
    const facultyOptions = FACULTY_OPTIONS.map(faculty => 
        `<option value="${escapeHtml(faculty)}" ${user.faculty === faculty ? 'selected' : ''}>
            ${escapeHtml(faculty)}
        </option>`
    ).join('');
    
    const batchYearOptions = getBatchYearOptions().map(year => 
        `<option value="${year.value}" ${user.batch_year == year.value ? 'selected' : ''}>
            ${year.label}
        </option>`
    ).join('');
    
    return `
        <div class="profile-container">
            <!-- Header -->
            <div class="page-header">
                <div>
                    <h1>My Profile</h1>
                    <p>Manage your personal information and account settings</p>
                </div>
                <button id="editProfileBtn" class="btn btn-outline">
                    <i class="fas fa-edit"></i>
                    ${isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>
            
            <div class="profile-grid">
                <!-- Profile Card -->
                <div class="profile-card">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-large">
                            ${getUserInitials(user.fullname)}
                        </div>
                        <div class="profile-name-section">
                            <h2>${escapeHtml(user.fullname)}</h2>
                            <p class="profile-email">${escapeHtml(user.email)}</p>
                        </div>
                    </div>
                    
                    <div class="profile-info-section">
                        <h3><i class="fas fa-info-circle"></i> Personal Information</h3>
                        
                        <form id="profileForm">
                            <div class="form-group">
                                <label for="fullname">Full Name</label>
                                <input type="text" id="fullname" name="fullname" 
                                       value="${escapeHtml(user.fullname)}"
                                       ${!isEditing ? 'disabled' : ''}
                                       required>
                                <div class="form-error" id="fullname_error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input type="email" id="email" name="email" 
                                       value="${escapeHtml(user.email)}"
                                       disabled>
                                <small class="form-hint">Email cannot be changed</small>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group half">
                                    <label for="faculty">Faculty</label>
                                    <select id="faculty" name="faculty" ${!isEditing ? 'disabled' : ''}>
                                        <option value="">Select Faculty</option>
                                        ${facultyOptions}
                                    </select>
                                    <div class="form-error" id="faculty_error"></div>
                                </div>
                                
                                <div class="form-group half">
                                    <label for="major">Major</label>
                                    <input type="text" id="major" name="major" 
                                           value="${escapeHtml(user.major || '')}"
                                           ${!isEditing ? 'disabled' : ''}
                                           placeholder="e.g., Computer Science">
                                    <div class="form-error" id="major_error"></div>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group half">
                                    <label for="batch_year">Batch Year</label>
                                    <select id="batch_year" name="batch_year" ${!isEditing ? 'disabled' : ''}>
                                        <option value="">Select Year</option>
                                        ${batchYearOptions}
                                    </select>
                                    <div class="form-error" id="batch_year_error"></div>
                                </div>
                                
                                <div class="form-group half">
                                    <label for="member_since">Member Since</label>
                                    <input type="text" id="member_since" 
                                           value="${formatDate(user.created_at, 'date')}"
                                           disabled>
                                </div>
                            </div>
                            
                            ${isEditing ? `
                                <div class="profile-actions">
                                    <button type="submit" id="saveProfileBtn" class="btn btn-primary">
                                        <i class="fas fa-save"></i>
                                        Save Changes
                                    </button>
                                    <button type="button" id="cancelEditBtn" class="btn btn-outline">
                                        <i class="fas fa-times"></i>
                                        Cancel
                                    </button>
                                </div>
                            ` : ''}
                        </form>
                    </div>
                </div>
                
                <!-- Security Card -->
                <div class="profile-card">
                    <div class="profile-info-section">
                        <h3><i class="fas fa-shield-alt"></i> Security</h3>
                        
                        <div class="security-item">
                            <div class="security-info">
                                <i class="fas fa-key"></i>
                                <div>
                                    <strong>Change Password</strong>
                                    <p>Update your password to keep your account secure</p>
                                </div>
                            </div>
                            <button id="changePasswordBtn" class="btn btn-outline btn-sm">
                                <i class="fas fa-lock"></i>
                                Change
                            </button>
                        </div>
                        
                        <div class="security-item">
                            <div class="security-info">
                                <i class="fas fa-sign-out-alt"></i>
                                <div>
                                    <strong>Logout</strong>
                                    <p>Sign out of your account</p>
                                </div>
                            </div>
                            <button id="logoutBtn" class="btn btn-outline btn-sm btn-danger">
                                <i class="fas fa-sign-out-alt"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                    
                    <div class="profile-info-section">
                        <h3><i class="fas fa-chart-bar"></i> Account Statistics</h3>
                        <div class="stats-list" id="accountStats">
                            <div class="stat-item">
                                <span class="stat-label">Courses Taken</span>
                                <span class="stat-value" id="statCourses">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Assignments Completed</span>
                                <span class="stat-value" id="statAssignments">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Notes Created</span>
                                <span class="stat-value" id="statNotes">-</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Habit Streak</span>
                                <span class="stat-value" id="statStreak">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render skeleton loader
 * @returns {string} HTML string
 */
function renderSkeleton() {
    return `
        <div class="profile-container">
            <div class="page-header">
                <div>
                    <div class="skeleton" style="width: 100px; height: 32px;"></div>
                    <div class="skeleton" style="width: 200px; height: 20px; margin-top: 8px;"></div>
                </div>
            </div>
            <div class="profile-grid">
                <div class="profile-card">
                    <div class="skeleton" style="height: 120px; border-radius: 16px;"></div>
                    <div class="skeleton" style="height: 300px; margin-top: 20px;"></div>
                </div>
                <div class="profile-card">
                    <div class="skeleton" style="height: 200px;"></div>
                    <div class="skeleton" style="height: 200px; margin-top: 20px;"></div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Get user initials for avatar
 * @param {string} fullname - User's full name
 * @returns {string} Initials (max 2 characters)
 */
function getUserInitials(fullname) {
    if (!fullname) return 'U';
    const parts = fullname.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Escape HTML helper
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load profile data
 * @param {boolean} forceRefresh - Force refresh cache
 */
async function loadProfile(forceRefresh = false) {
    actions.setLoading(true);
    
    try {
        const result = await fetchWithCache(
            'getUserProfile',
            () => profileAPI.getProfile(),
            {},
            CACHE_TTL.PROFILE,
            forceRefresh
        );
        
        if (result.data && result.data.success !== false) {
            const userData = result.data.data || result.data;
            // Update user in store
            const currentUser = store.getState().user;
            if (currentUser) {
                actions.setAuth({ ...currentUser, ...userData }, store.getState().token);
            }
            return userData;
        }
    } catch (error) {
        console.error('Load profile error:', error);
        showToast('Failed to load profile', 'error');
    } finally {
        actions.setLoading(false);
    }
    
    return null;
}

/**
 * Update user profile
 * @param {Object} profileData - Updated profile data
 */
async function updateProfile(profileData) {
    actions.setLoading(true);
    
    try {
        const response = await profileAPI.updateProfile(profileData);
        
        if (response.success) {
            showToast('Profile updated successfully', 'success');
            invalidateAfterMutation('updateUserProfile');
            await loadProfile(true);
            
            // Update store user data
            const state = store.getState();
            if (state.user) {
                const updatedUser = { ...state.user, ...profileData };
                actions.setAuth(updatedUser, state.token);
            }
            
            return true;
        } else {
            showToast(response.message || 'Failed to update profile', 'error');
            return false;
        }
    } catch (error) {
        console.error('Update profile error:', error);
        showToast('Failed to update profile', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 */
async function changePassword(currentPassword, newPassword) {
    actions.setLoading(true);
    
    try {
        const response = await profileAPI.changePassword(currentPassword, newPassword);
        
        if (response.success) {
            showToast('Password changed successfully. Please login again.', 'success');
            // Logout user after password change for security
            setTimeout(() => {
                logout(true);
            }, 2000);
            return true;
        } else {
            showToast(response.message || 'Failed to change password', 'error');
            return false;
        }
    } catch (error) {
        console.error('Change password error:', error);
        showToast('Failed to change password', 'error');
        return false;
    } finally {
        actions.setLoading(false);
    }
}

/**
 * Show change password modal
 */
async function showChangePasswordModal() {
    // Create modal HTML dynamically
    const modalHtml = `
        <form id="passwordForm" class="modal-form">
            <div class="form-group">
                <label for="current_password">Current Password</label>
                <div class="password-wrapper">
                    <input type="password" id="current_password" name="current_password" required>
                    <button type="button" class="password-toggle" onclick="togglePassword('current_password')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div class="form-error" id="current_password_error"></div>
            </div>
            
            <div class="form-group">
                <label for="new_password">New Password</label>
                <div class="password-wrapper">
                    <input type="password" id="new_password" name="new_password" required>
                    <button type="button" class="password-toggle" onclick="togglePassword('new_password')">
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
                <div class="form-error" id="new_password_error"></div>
            </div>
            
            <div class="form-group">
                <label for="confirm_password">Confirm New Password</label>
                <div class="password-wrapper">
                    <input type="password" id="confirm_password" name="confirm_password" required>
                    <button type="button" class="password-toggle" onclick="togglePassword('confirm_password')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
                <div class="form-error" id="confirm_password_error"></div>
            </div>
        </form>
    `;
    
    // Temporary function for password toggle
    window.togglePassword = (fieldId) => {
        const input = document.getElementById(fieldId);
        const icon = input.nextElementSibling.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };
    
    // Function to validate new password in real-time
    const setupPasswordValidation = () => {
        const newPasswordInput = document.getElementById('new_password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                updatePasswordRequirements(password);
            });
        }
    };
    
    const updatePasswordRequirements = (password) => {
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
    };
    
    const validateForm = (formData) => {
        const errors = {};
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');
        
        if (!currentPassword) {
            errors.current_password = 'Current password is required';
        }
        
        if (!newPassword) {
            errors.new_password = 'New password is required';
        } else if (!isValidPassword(newPassword)) {
            errors.new_password = 'Password must be at least 8 characters with uppercase, lowercase, and number';
        }
        
        if (newPassword !== confirmPassword) {
            errors.confirm_password = 'Passwords do not match';
        }
        
        return { isValid: Object.keys(errors).length === 0, errors };
    };
    
    return new Promise((resolve) => {
        const { openModal, closeModal } = await import('../components/Modal.js');
        
        openModal({
            title: 'Change Password',
            content: modalHtml,
            size: 'md',
            buttons: [
                { text: 'Cancel', class: 'btn-outline', action: 'cancel' },
                { text: 'Update Password', class: 'btn-primary', action: 'confirm', icon: 'fa-save' }
            ],
            onOpen: () => {
                setupPasswordValidation();
                
                // Add input event listeners to clear errors
                const inputs = ['current_password', 'new_password', 'confirm_password'];
                inputs.forEach(field => {
                    const input = document.getElementById(field);
                    if (input) {
                        input.addEventListener('input', () => {
                            const errorEl = document.getElementById(`${field}_error`);
                            if (errorEl) {
                                errorEl.textContent = '';
                                errorEl.style.display = 'none';
                            }
                            input.classList.remove('error');
                        });
                    }
                });
                
                // Custom confirm handler
                const confirmBtn = document.querySelector('[data-modal-action="confirm"]');
                if (confirmBtn) {
                    confirmBtn.onclick = async () => {
                        const form = document.getElementById('passwordForm');
                        const formData = new FormData(form);
                        const validation = validateForm(formData);
                        
                        // Clear previous errors
                        const errorEls = document.querySelectorAll('.form-error');
                        errorEls.forEach(el => {
                            el.textContent = '';
                            el.style.display = 'none';
                        });
                        
                        if (validation.isValid) {
                            const success = await changePassword(
                                formData.get('current_password'),
                                formData.get('new_password')
                            );
                            if (success) {
                                closeModal(true);
                                resolve(true);
                            }
                        } else {
                            for (const [field, message] of Object.entries(validation.errors)) {
                                const errorEl = document.getElementById(`${field}_error`);
                                if (errorEl) {
                                    errorEl.textContent = message;
                                    errorEl.style.display = 'block';
                                }
                                const inputEl = document.getElementById(field);
                                if (inputEl) {
                                    inputEl.classList.add('error');
                                }
                            }
                        }
                    };
                }
            },
            onClose: () => {
                delete window.togglePassword;
                resolve(false);
            }
        });
    });
}

/**
 * Load account statistics
 */
async function loadAccountStats() {
    const state = store.getState();
    const courses = state.courses || [];
    const assignments = state.assignments || [];
    const notes = state.notes || [];
    const habits = state.habits || [];
    
    const totalStreak = habits.reduce((sum, h) => sum + (parseInt(h.streak) || 0), 0);
    const completedAssignments = assignments.filter(a => a.status === 'done').length;
    
    const statCourses = document.getElementById('statCourses');
    const statAssignments = document.getElementById('statAssignments');
    const statNotes = document.getElementById('statNotes');
    const statStreak = document.getElementById('statStreak');
    
    if (statCourses) statCourses.textContent = courses.length;
    if (statAssignments) statAssignments.textContent = completedAssignments;
    if (statNotes) statNotes.textContent = notes.length;
    if (statStreak) statStreak.textContent = totalStreak;
}

/**
 * Validate profile form
 * @param {FormData} formData - Form data
 * @returns {Object} Validation result
 */
function validateProfileForm(formData) {
    const errors = {};
    
    const fullname = formData.get('fullname')?.trim();
    const faculty = formData.get('faculty');
    const major = formData.get('major')?.trim();
    const batchYear = formData.get('batch_year');
    
    const nameValidation = validateFullName(fullname);
    if (!nameValidation.isValid) {
        errors.fullname = nameValidation.error;
    }
    
    const facultyValidation = validateFaculty(faculty);
    if (!facultyValidation.isValid) {
        errors.faculty = facultyValidation.error;
    }
    
    const majorValidation = validateMajor(major);
    if (!majorValidation.isValid) {
        errors.major = majorValidation.error;
    }
    
    const batchValidation = validateBatchYear(batchYear);
    if (!batchValidation.isValid) {
        errors.batch_year = batchValidation.error;
    }
    
    return { isValid: Object.keys(errors).length === 0, errors };
}

/**
 * Show field errors
 */
function showErrors(errors) {
    for (const [field, message] of Object.entries(errors)) {
        const errorEl = document.getElementById(`${field}_error`);
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
        const inputEl = document.getElementById(field);
        if (inputEl) {
            inputEl.classList.add('error');
        }
    }
}

/**
 * Clear errors
 */
function clearErrors() {
    const errorEls = document.querySelectorAll('.form-error');
    errorEls.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    const inputs = document.querySelectorAll('#profileForm input, #profileForm select');
    inputs.forEach(input => {
        input.classList.remove('error');
    });
}

/**
 * Handle profile form submit
 * @param {Event} event - Form submit event
 */
async function handleProfileSubmit(event) {
    event.preventDefault();
    
    clearErrors();
    
    const formData = new FormData(event.target);
    const validation = validateProfileForm(formData);
    
    if (!validation.isValid) {
        showErrors(validation.errors);
        return;
    }
    
    const profileData = {
        fullname: formData.get('fullname').trim(),
        faculty: formData.get('faculty'),
        major: formData.get('major').trim(),
        batch_year: parseInt(formData.get('batch_year'))
    };
    
    const success = await updateProfile(profileData);
    if (success) {
        isEditing = false;
        refreshPage();
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Edit/Cancel button
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            isEditing = !isEditing;
            refreshPage();
        });
    }
    
    // Cancel edit button (inside edit mode)
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            isEditing = false;
            refreshPage();
        });
    }
    
    // Profile form submit
    const profileForm = document.getElementById('profileForm');
    if (profileForm && isEditing) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Change password button
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            showChangePasswordModal();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const confirmed = await confirmModal(
                'Logout',
                'Are you sure you want to logout?',
                'Logout',
                'Cancel'
            );
            if (confirmed) {
                await logout(true);
                showToast('Logged out successfully', 'success');
            }
        });
    }
}

/**
 * Refresh page content
 */
async function refreshPage() {
    const container = document.querySelector('.profile-container');
    if (container) {
        await loadProfile(true);
        await loadAccountStats();
        
        const newHtml = render();
        container.innerHTML = newHtml;
        
        setupEventListeners();
    }
}

/**
 * Page lifecycle - before render
 */
async function beforeRender() {
    // Load profile data if not exists
    const state = store.getState();
    if (!state.user) {
        await loadProfile(false);
    }
    
    // Load stats data from other modules
    const { coursesAPI, assignmentsAPI, notesAPI, habitsAPI } = await import('../api/endpoints.js');
    
    // Fetch additional data for stats
    try {
        const [coursesRes, assignmentsRes, notesRes, habitsRes] = await Promise.all([
            coursesAPI.getAll(),
            assignmentsAPI.getAll(),
            notesAPI.getAll(),
            habitsAPI.getAll()
        ]);
        
        if (coursesRes.success) actions.setCourses(coursesRes.data || []);
        if (assignmentsRes.success) actions.setAssignments(assignmentsRes.data || []);
        if (notesRes.success) actions.setNotes(notesRes.data || []);
        if (habitsRes.success) actions.setHabits(habitsRes.data || []);
    } catch (error) {
        console.error('Failed to load stats data:', error);
    }
    
    return true;
}

/**
 * Page lifecycle - after render
 */
async function afterRender() {
    await loadAccountStats();
    setupEventListeners();
}

// Export page component
const ProfilePage = {
    render,
    beforeRender,
    afterRender
};

export default ProfilePage;
