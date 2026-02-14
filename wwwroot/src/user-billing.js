// User Billing Page
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
    loadBilling();
});

function loadBilling() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const user = MOCK_DATA.users.find(u => u.role === 'user');
    const invoices = MOCK_DATA.invoices;

    const table = createDataTable({
        columns: [
            { key: 'invoiceNumber', label: 'Invoice #' },
            { key: 'amount', label: 'Amount', format: (v) => `$${v.toFixed(2)}` },
            {
                key: 'status', label: 'Status', format: (v) => {
                    const color = v === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
                    return `<span class="px-2 py-1 rounded text-xs font-medium ${color}">${v}</span>`;
                }
            },
            { key: 'date', label: 'Date', format: (v) => new Date(v).toLocaleDateString() },
            { key: 'dueDate', label: 'Due Date', format: (v) => new Date(v).toLocaleDateString() }
        ],
        data: invoices
    });

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        label: 'Current Balance',
        value: `$${user?.accountBalance?.toFixed(2) || '0.00'}`,
        color: 'cyan'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>',
        label: 'Total Invoices',
        value: invoices?.length?.toString() || '0',
        color: 'violet'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
        label: 'Pending',
        value: (invoices?.filter(inv => inv.status === 'pending')?.length || 0).toString(),
        color: 'warning'
    })}
        </div>

        <div class="glass-card p-6 rounded-xl mb-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-heading font-bold">Add Funds</h3>
            </div>
            <form class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="number" placeholder="Amount" class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                <select class="px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    <option>Credit Card</option>
                    <option>PayPal</option>
                </select>
                <button type="button" class="btn-primary" onclick="alert('Add funds coming soon!')">Add Funds</button>
            </form>
        </div>

        <div class="glass-card p-6 rounded-xl">
            <h3 class="text-lg font-heading font-bold mb-4">Invoice History</h3>
            ${table}
        </div>
    `;

    toast.success('Billing loaded');
}


