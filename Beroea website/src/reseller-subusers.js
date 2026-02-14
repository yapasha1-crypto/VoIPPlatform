// Reseller Sub-Users Page
import './style.css';
import { createSidebar } from './components/dashboard/sidebar.js';
import { createHeader } from './components/dashboard/header.js';
import { createDataTable } from './components/dashboard/widgets.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'reseller');
        localStorage.setItem('userId', '2');
        addDeveloperModeBanner();
    }

    document.getElementById('sidebar-container')?.appendChild(createSidebar('reseller'));
    document.getElementById('header-container')?.appendChild(createHeader('reseller'));
    await loadSubUsers();
});

async function loadSubUsers() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const subUsers = MOCK_DATA.subUsers;

    const table = createDataTable({
        columns: [
            { key: 'id', label: 'ID', width: '60px' },
            { key: 'username', label: 'Username' },
            { key: 'email', label: 'Email' },
            { key: 'accountBalance', label: 'Balance', format: (v) => `$${v.toFixed(2)}` },
            {
                key: 'isActive', label: 'Status', format: (v) =>
                    v ? '<span class="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">Active</span>'
                        : '<span class="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">Inactive</span>'
            },
            { key: 'createdAt', label: 'Created', format: (v) => new Date(v).toLocaleDateString() }
        ],
        data: subUsers
    });

    container.innerHTML = `
        <div class="glass-card p-6 rounded-xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-heading font-bold">My Sub-Users</h2>
                <button class="btn-primary" onclick="alert('Add Sub-User coming soon!')">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add Sub-User
                </button>
            </div>
            ${table}
        </div>
    `;

    toast.success('Sub-users loaded');
}

function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: #000; text-align: center; padding: 8px 16px; font-weight: bold; font-size: 14px;`;
    banner.innerHTML = '🔧 DEVELOPER MODE';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
