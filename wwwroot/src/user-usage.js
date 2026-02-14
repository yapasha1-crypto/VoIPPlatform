// User Usage Page
// import './style.css'; // Removed for static execution
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
import { createStatCard, createDataTable } from './components/dashboard/widgets.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userId', '3');
        // addDeveloperModeBanner();
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.appendChild(createSidebar('user'));
        initSidebar();
    }

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.appendChild(createHeader('user'));
        initHeader();
    }
    loadUsage();
});

function loadUsage() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const calls = MOCK_DATA.calls;
    const sms = MOCK_DATA.sms;
    const totalCallMinutes = calls.reduce((sum, c) => sum + c.durationSeconds, 0) / 60;
    const totalCallCost = calls.reduce((sum, c) => sum + c.cost, 0);

    const table = createDataTable({
        columns: [
            { key: 'destinationNumber', label: 'Destination' },
            { key: 'durationSeconds', label: 'Duration', format: (v) => `${Math.floor(v / 60)}m ${v % 60}s` },
            { key: 'cost', label: 'Cost', format: (v) => `$${v.toFixed(2)}` },
            { key: 'timestamp', label: 'Date', format: (v) => new Date(v).toLocaleString() }
        ],
        data: calls
    });

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>',
        label: 'Total Calls',
        value: calls?.length?.toString() || '0',
        color: 'cyan'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        label: 'Total Minutes',
        value: totalCallMinutes?.toFixed(0) || '0',
        color: 'violet'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        label: 'Total Cost',
        value: `$${totalCallCost?.toFixed(2) || '0.00'}`,
        color: 'success'
    })}
        </div>

        <div class="glass-card p-6 rounded-xl mb-6">
            <h3 class="text-lg font-heading font-bold mb-4">Recent Calls</h3>
            ${table}
        </div>

        <div class="glass-card p-6 rounded-xl">
            <h3 class="text-lg font-heading font-bold mb-4">SMS Usage</h3>
            <p class="text-white/60">Total SMS Sent: ${sms.length}</p>
        </div>
    `;

    toast.success('Usage loaded');
}


