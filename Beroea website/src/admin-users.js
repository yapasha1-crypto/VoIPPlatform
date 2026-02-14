// Admin Users Page - User & Reseller Management
import './style.css';
import { createSidebar } from './components/dashboard/sidebar.js';
import { createHeader } from './components/dashboard/header.js';
import { createDataTable } from './components/dashboard/widgets.js';
import { apiService } from './services/apiService.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

console.log('👥 Admin Users Page - Initializing...');

document.addEventListener('DOMContentLoaded', async () => {
    // DEVELOPER MODE: Bypass authentication when using mock data
    if (API_CONFIG.MOCK_MODE) {
        console.log('[DEVELOPER MODE] Authentication bypassed - Using mock data');
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userId', '1');
        localStorage.setItem('userEmail', 'admin@beroea.com');
        localStorage.setItem('userName', 'Admin User');
        sessionStorage.setItem('redirectCount', '0');
        addDeveloperModeBanner();
    } else {
        // PRODUCTION MODE: Normal authentication checks
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token || userRole !== 'admin') {
            window.location.href = '/admin.html';
            return;
        }
    }

    // Initialize Sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        const sidebar = createSidebar('admin');
        sidebarContainer.appendChild(sidebar);
    }

    // Initialize Header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        const header = createHeader('admin');
        headerContainer.appendChild(header);
    }

    // Load page content
    await loadUsersTable();
});

/**
 * Load users table
 */
async function loadUsersTable() {
    const container = document.getElementById('page-content');
    if (!container) return;

    try {
        // Get users from API (or mock data)
        const users = await apiService.getUsers();

        // Create table
        const table = createDataTable({
            columns: [
                { key: 'id', label: 'ID', width: '80px' },
                { key: 'username', label: 'Username' },
                { key: 'email', label: 'Email' },
                {
                    key: 'role', label: 'Role', format: (value) => {
                        const colors = {
                            admin: 'bg-neon-violet/20 text-neon-violet',
                            reseller: 'bg-neon-cyan/20 text-neon-cyan',
                            user: 'bg-white/20 text-white'
                        };
                        return `<span class="px-2 py-1 rounded text-xs font-medium ${colors[value] || colors.user}">${value}</span>`;
                    }
                },
                { key: 'accountBalance', label: 'Balance', format: (value) => `$${value.toFixed(2)}` },
                {
                    key: 'isActive', label: 'Status', format: (value) =>
                        value
                            ? '<span class="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">Active</span>'
                            : '<span class="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">Inactive</span>'
                },
                { key: 'createdAt', label: 'Created', format: (value) => new Date(value).toLocaleDateString() }
            ],
            data: users,
            emptyMessage: 'No users found'
        });

        container.innerHTML = `
            <div class="glass-card p-6 rounded-xl">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-heading font-bold">All Users</h2>
                    <button class="btn-primary" onclick="alert('Add User feature coming soon!')">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add User
                    </button>
                </div>
                ${table}
            </div>
        `;

        toast.success('Users loaded successfully');
    } catch (error) {
        console.error('Failed to load users:', error);
        container.innerHTML = `
            <div class="glass-card p-6 rounded-xl">
                <p class="text-red-400">Failed to load users. Please try again.</p>
            </div>
        `;
        toast.error('Failed to load users');
    }
}

/**
 * Add developer mode banner to dashboard
 */
function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.id = 'developer-mode-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%);
        color: #000;
        text-align: center;
        padding: 8px 16px;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = '🔧 DEVELOPER MODE - Using Mock Data (No Backend Connection)';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
