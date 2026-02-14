// Shared Authentication Initialization
// Import this in every page's JS file to enable global auth functionality

import { createAuthModals } from './authModals.js';
import { toast } from './toast.js';
import { apiService } from '../services/apiService.js';

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

    // Modal controls
    const loginClose = document.getElementById('login-close');
    const registerClose = document.getElementById('register-close');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    // Open Login Modal - Find all Portal Login buttons by text content
    const allButtons = document.querySelectorAll('a, button');
    let portalLoginCount = 0;
    let getStartedCount = 0;

    allButtons.forEach(btn => {
        const text = btn.textContent.trim();

        // Portal Login buttons
        if (text === 'Portal Login' || text.includes('Portal Login')) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openModal(loginModal);

            });
            portalLoginCount++;
        }

        // Get Started Free buttons
        if (text === 'Get Started Free' || text === 'Get Started') {
            // Only wire if it's not already going to pricing page
            const href = btn.getAttribute('href');
            if (!href || href === '#' || href === '#register' || btn.classList.contains('get-started-btn')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    openModal(registerModal);

                });
                getStartedCount++;
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
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Basic validation
    if (!email || !password) {
        toast.error('Please fill in all fields');
        return;
    }

    try {


        // Call API - use email as username
        const loginResponse = await apiService.login({
            username: email,
            password: password
        });



        // Store JWT token
        localStorage.setItem('token', loginResponse.token);

        // Get user info from /api/Auth/me to determine role

        const userInfo = await apiService.getCurrentUser();



        // Store user data
        localStorage.setItem('userRole', userInfo.role);
        localStorage.setItem('userId', userInfo.id);
        localStorage.setItem('userEmail', userInfo.email);
        localStorage.setItem('userName', userInfo.username || userInfo.email);

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
    const fullName = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const phoneNumber = document.getElementById('register-phone').value;

    // Basic validation
    if (!fullName || !email || !password) {
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
            username: email, // Use email as username
            password: password,
            email: email,
            firstName: firstName,
            lastName: lastName,
            phoneNumber: phoneNumber || null,
            countryCode: phoneNumber ? '+1' : null // Default country code if phone provided
        });



        // Auto-login after successful registration

        const loginResponse = await apiService.login({
            username: email,
            password: password
        });

        // Store JWT token
        localStorage.setItem('token', loginResponse.token);

        // Get user info
        const userInfo = await apiService.getCurrentUser();

        // Store user data
        localStorage.setItem('userRole', userInfo.role || 'user');
        localStorage.setItem('userId', userInfo.id);
        localStorage.setItem('userEmail', userInfo.email);
        localStorage.setItem('userName', userInfo.username || userInfo.email);

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
