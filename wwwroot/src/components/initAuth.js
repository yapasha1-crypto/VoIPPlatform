// Shared Authentication Initialization
// Import this in every page's JS file to enable global auth functionality

import { createAuthModals } from './authModals.js?v=FIX_FINAL';
import { toast } from './toast.js?v=FIX_FINAL';
import { apiService } from '../services/apiService.js?v=FIX_FINAL';

// Inject modals and initialize auth system
export function initAuth() {


    // Check if modals already exist (avoid duplicates)
    const existingLoginModal = document.getElementById('login-modal');
    const existingRegisterModal = document.getElementById('register-modal');

    if (!existingLoginModal && !existingRegisterModal) {
        // Inject Auth Modals into body
        const authContainer = createAuthModals();
        document.body.appendChild(authContainer);

    } else {

    }

    // Initialize modal functionality (always run, whether modals were just injected or already existed)
    initAuthModals();


}

// Authentication Modal Functionality
function initAuthModals() {
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    console.log('[AuthDebug] initAuthModals running');
    console.log('[AuthDebug] registerForm found:', registerForm);

    // Modal controls
    const loginClose = document.getElementById('login-close');
    const registerClose = document.getElementById('register-close');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    // Open Login Modal - Use delegation for robustness
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('a, button');
        if (!btn) return;
        // Ignore submit buttons (let forms handle them)
        if (btn.type === 'submit') return;

        const text = btn.textContent.trim();

        // Portal Login buttons
        if (text === 'Portal Login' || text.includes('Portal Login')) {
            e.preventDefault();
            openModal(loginModal);
        }

        // Get Started Free buttons
        if (text === 'Get Started Free' || text === 'Get Started') {
            const href = btn.getAttribute('href');
            if (!href || href === '#' || href === '#register' || btn.classList.contains('get-started-btn')) {
                e.preventDefault();
                openModal(registerModal);
            }
        }
    });



    // Close modals
    loginClose?.addEventListener('click', () => closeModal(loginModal));
    registerClose?.addEventListener('click', () => closeModal(registerModal));

    // Toggle between modals
    showRegister?.addEventListener('click', () => {
        closeModal(loginModal);
        setTimeout(() => openModal(registerModal), 300);
    });

    showLogin?.addEventListener('click', () => {
        closeModal(registerModal);
        setTimeout(() => openModal(loginModal), 300);
    });

    // Close on overlay click
    loginModal?.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
    });

    registerModal?.addEventListener('click', (e) => {
        if (e.target === registerModal) closeModal(registerModal);
    });

    // Login Form Submit
    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    // Register Form Submit
    registerForm?.addEventListener('submit', (e) => {
        console.log('[AuthDebug] Register submit intercepted');
        e.preventDefault();
        handleRegister();
    });
}

function openModal(modal) {
    modal?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal?.classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== REAL API INTEGRATION ====================

async function handleLogin() {
    const usernameInput = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Basic validation
    if (!usernameInput || !password) {
        toast.error('Please fill in all fields');
        return;
    }

    try {


        // Call API
        const loginResponse = await apiService.login({
            username: usernameInput,
            password: password
        });



        // Store JWT token
        const token = loginResponse.data?.token || loginResponse.token;
        if (!token) throw new Error('No token received');
        localStorage.setItem('token', token);

        // Get user info from /api/Auth/me to determine role
        const userResponse = await apiService.getCurrentUser();
        const userInfo = userResponse.data || userResponse;



        // Store user data
        // Ensure we handle case variance if API returns capitalized fields
        const role = userInfo.role || userInfo.Role;
        const id = userInfo.id || userInfo.Id;
        const email = userInfo.email || userInfo.Email;
        const username = userInfo.username || userInfo.Username;
        const firstName = userInfo.firstName || userInfo.FirstName;
        const lastName = userInfo.lastName || userInfo.LastName;

        if (id) localStorage.setItem('userId', id);
        if (email) localStorage.setItem('userEmail', email);
        if (role) localStorage.setItem('userRole', role);

        // Construct display name with fallbacks
        let displayName = 'User';
        if (firstName) {
            displayName = `${firstName} ${lastName || ''}`.trim();
        } else if (username) {
            displayName = username;
        } else if (email) {
            displayName = email.split('@')[0];
        }

        localStorage.setItem('userName', displayName);

        console.log(`[Auth] User stored: ${displayName} (${role}) ID: ${id}`);

        // Close modal
        closeModal(document.getElementById('login-modal'));

        // Show success toast
        const roleDisplay = userInfo.role ? userInfo.role.charAt(0).toUpperCase() + userInfo.role.slice(1) : 'User';
        toast.success(`Welcome back, ${roleDisplay}!`);

        // Redirect based on API-returned role
        setTimeout(() => {
            redirectToDashboard(userInfo.role);
        }, 1000);

    } catch (error) {
        console.error('[Auth] Login error:', error);
        // Error already handled by apiService with toast
    }
}

async function handleRegister() {
    console.log('[AuthDebug] handleRegister called');
    const username = document.getElementById('register-username').value;
    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const phoneNumber = document.getElementById('register-phone').value;

    // Basic validation
    if (!username || !fullName || !email || !password) {
        toast.error('Please fill in all required fields');
        return;
    }

    // Split full name into firstName and lastName
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    try {


        // Call API
        const registerResponse = await apiService.register({
            username: username,
            password: password,
            email: email,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber || null,
            countryCode: phoneNumber ? '+1' : null // Default country code if phone provided
        });



        // Auto-login after successful registration
        const loginResponse = await apiService.login({
            username: username,
            password: password
        });

        // Store JWT token
        const token = loginResponse.data?.token || loginResponse.token;
        if (!token) throw new Error('No token received');
        localStorage.setItem('token', token);

        // Get user info
        const userResponse = await apiService.getCurrentUser();
        console.log('[initAuth] Me Response:', userResponse);
        const userInfo = userResponse.data || userResponse;
        console.log('[initAuth] User Info:', userInfo);

        // Store user data
        localStorage.setItem('userRole', userInfo.role || 'user');
        localStorage.setItem('userId', userInfo.id);
        localStorage.setItem('userEmail', userInfo.email);

        // Determine display name
        let displayName = userInfo.username || userInfo.email;
        if (userInfo.firstName) {
            displayName = userInfo.firstName + (userInfo.lastName ? ' ' + userInfo.lastName : '');
        }
        localStorage.setItem('userName', displayName);

        // Close modal
        closeModal(document.getElementById('register-modal'));

        // Show success toast
        toast.success('Registration successful! Welcome to Beroea!');

        // Redirect to user dashboard (new users default to user role)
        setTimeout(() => {
            redirectToDashboard(userInfo.role || 'user');
        }, 1500);

    } catch (error) {
        console.error('[Auth] Registration error:', error);
        // Error already handled by apiService with toast
    }
}

/**
 * Redirect to appropriate dashboard based on user role
 */
function redirectToDashboard(role) {
    const dashboardMap = {
        'admin': '/admin.html',
        'reseller': '/reseller.html',
        'user': '/user.html'
    };

    const targetPage = dashboardMap[role?.toLowerCase()] || '/user.html';


    window.location.href = targetPage;
}
