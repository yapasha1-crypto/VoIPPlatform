// Admin Users Page - User & Reseller Management
// import './style.css'; // Removed for static execution
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
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
        // addDeveloperModeBanner();
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
        initSidebar();
    }

    // Initialize Header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        const header = createHeader('admin');
        headerContainer.appendChild(header);
        initHeader();
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
                    <div class="flex gap-2">
                         <button class="btn-secondary" onclick="window.openAddUserModal('Reseller')">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            Add Reseller
                        </button>
                        <button class="btn-primary" onclick="window.openAddUserModal('User')">
                            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            Add User
                        </button>
                    </div>
                </div>
                ${table}
            </div>

            <!-- Add User Modal -->
            <div id="addUserModal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div class="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                    <div class="inline-block align-bottom glass-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <h3 class="text-lg leading-6 font-medium text-white mb-4" id="modal-title">Add New <span id="modalRoleTitle">User</span></h3>
                            <form id="addUserForm">
                                <input type="hidden" id="userRole" name="userRole" value="User">
                                <div class="mb-4">
                                    <label class="block text-gray-300 text-sm font-bold mb-2">Username</label>
                                    <input type="text" id="username" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-neon-cyan" required>
                                </div>
                                <div class="mb-4">
                                    <label class="block text-gray-300 text-sm font-bold mb-2">Email</label>
                                    <input type="email" id="email" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-neon-cyan" required>
                                </div>
                                <div class="mb-4">
                                    <label class="block text-gray-300 text-sm font-bold mb-2">Password</label>
                                    <input type="password" id="password" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:border-neon-cyan" required>
                                </div>
                                <div class="flex justify-end gap-2 mt-6">
                                    <button type="button" class="btn-secondary" onclick="window.closeAddUserModal()">Cancel</button>
                                    <button type="submit" class="btn-primary">Create Account</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Expose Modal Functions globally
        window.openAddUserModal = (role) => {
            const modal = document.getElementById('addUserModal');
            document.getElementById('modalRoleTitle').textContent = role;
            document.getElementById('userRole').value = role; // "User" or "Reseller"
            modal.classList.remove('hidden');
        };

        window.closeAddUserModal = () => {
            document.getElementById('addUserModal').classList.add('hidden');
            document.getElementById('addUserForm').reset();
        };

        // Handle Form Submit
        document.getElementById('addUserForm').onsubmit = async (e) => {
            e.preventDefault();
            const role = document.getElementById('userRole').value; // Case sensitive for display, but API expects lowercase or specific format? AuthController default "Customer"
            // AuthController RegisterRequest accepts "Role": "Customer". 
            // Button passes "User" or "Reseller". Let's map.
            // But wait, RegisterRequest class has public string? Role { get; set; }

            // Map UI Role to API Role
            const apiRole = role === 'Reseller' ? 'Reseller' : 'User';

            const userData = {
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                role: apiRole,
                firstName: role + ' ' + document.getElementById('username').value, // Placeholder logic
                lastName: 'Account',
                countryCode: '752' // Default
            };

            try {
                await apiService.register(userData);
                toast.success(`${role} created successfully`);
                window.closeAddUserModal();
                loadUsersTable(); // Refresh table
            } catch (error) {
                console.error('Registration failed:', error);
                // Toast handled by apiService usually, checking line 121 apiService.js... yes toast.error is called.
            }
        };

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

