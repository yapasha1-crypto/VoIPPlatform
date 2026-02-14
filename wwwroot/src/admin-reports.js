// Admin Reports Page
// import './style.css'; // Removed for static execution
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
import { createStatCard, createDataTable } from './components/dashboard/widgets.js';
import { apiService } from './services/apiService.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'admin');
        // addDeveloperModeBanner();
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.appendChild(createSidebar('admin'));
        initSidebar();
    }

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.appendChild(createHeader('admin'));
        initHeader();
    }
    await loadReports();
});

async function loadReports() {
    const container = document.getElementById('page-content');
    if (!container) return;

    try {
        const stats = await apiService.getDashboardStats();
        // Backend returns: { TotalCustomers, ActiveCustomers, TotalUsers, TotalCallsToday, TotalRevenueToday, TotalSystemBalance }
        // We map to UI expectation.

        // Note: TopDestinations usually come from Call stats or Rates. 
        // For now, we'll just show an empty table or fetch actual rates if available.
        const topDestinations = [];

        const table = createDataTable({
            columns: [
                { key: 'destination', label: 'Destination' },
                { key: 'prefix', label: 'Prefix' },
                { key: 'price', label: 'Rate', format: (v) => `$${v.toFixed(4)}/min` }
            ],
            data: topDestinations,
            emptyMessage: 'No data available'
        });

        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                ${createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
            label: 'Total Revenue (Today)',
            value: `$${(stats?.totalRevenueToday || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: 'cyan'
        })}
                ${createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>',
            label: 'Total Calls (Today)',
            value: (stats?.totalCallsToday || 0).toLocaleString(),
            color: 'violet'
        })}
                ${createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>',
            label: 'Total System Balance',
            value: `$${(stats?.totalSystemBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: 'cyan'
        })}
            </div>

            <div class="glass-card p-6 rounded-xl mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-heading font-bold">Top Destinations</h3>
                    <button class="btn-primary">Export CSV</button>
                </div>
                ${table}
            </div>
        `;

        toast.success('Reports loaded');
    } catch (error) {
        console.error('Failed to load reports:', error);
        container.innerHTML = '<p class="text-red-400">Failed to load reports.</p>';
    }
}
