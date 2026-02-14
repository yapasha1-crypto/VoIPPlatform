// Reseller Credits Page
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
        localStorage.setItem('userRole', 'reseller');
        // addDeveloperModeBanner();
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.appendChild(createSidebar('reseller'));
        initSidebar();
    }

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.appendChild(createHeader('reseller'));
        initHeader();
    }
    loadCredits();
});

function loadCredits() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const reseller = MOCK_DATA.users.find(u => u.role === 'reseller');
    const transactions = MOCK_DATA.transactions;

    const table = createDataTable({
        columns: [
            { key: 'id', label: 'ID', width: '60px' },
            { key: 'description', label: 'Description' },
            {
                key: 'amount', label: 'Amount', format: (v) => {
                    const color = v > 0 ? 'text-green-400' : 'text-red-400';
                    return `<span class="${color}">$${v.toFixed(2)}</span>`;
                }
            },
            { key: 'timestamp', label: 'Date', format: (v) => new Date(v).toLocaleDateString() },
            {
                key: 'status', label: 'Status', format: (v) =>
                    `<span class="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">${v}</span>`
            }
        ],
        data: transactions
    });

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        label: 'Current Balance',
        value: `$${reseller?.accountBalance?.toFixed(2) || '0.00'}`,
        color: 'cyan'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>',
        label: 'Total Credits',
        value: '$150.00',
        color: 'violet'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path>',
        label: 'Total Spent',
        value: '$6.40',
        color: 'success'
    })}
        </div>

        <div class="glass-card p-6 rounded-xl mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-heading font-bold">Add Credits</h3>
            </div>
            <form class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="number" placeholder="Amount" class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                <select class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    <option>Credit Card</option>
                    <option>PayPal</option>
                    <option>Bank Transfer</option>
                </select>
                <button type="button" class="btn-primary" onclick="alert('Add credits coming soon!')">Add Credits</button>
            </form>
        </div>

        <div class="glass-card p-6 rounded-xl">
            <h3 class="text-lg font-heading font-bold mb-4">Transaction History</h3>
            ${table}
        </div>
    `;
}


