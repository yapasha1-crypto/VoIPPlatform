// import './style.css'; // Removed for static execution
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
import { createStatCard, createGaugeChart, createDataTable, createBadge } from './components/dashboard/widgets.js';
import { initGlobe } from './components/globe.js';
import { apiService } from './services/apiService.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';



document.addEventListener('DOMContentLoaded', async () => {
    // DEVELOPER MODE: Bypass authentication when using mock data
    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userId', '1');
        localStorage.setItem('userEmail', 'admin@beroea.com');
        localStorage.setItem('userName', 'Admin User');
        sessionStorage.setItem('redirectCount', '0');
    } else {
        // PRODUCTION MODE
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token) {
            console.warn('[Admin] No token found, redirecting');
            window.location.href = '/index.html';
            return;
        }

        // Permissive Role Check: Allow 'admin', 'masteradmin', or 'superadmin'
        const allowedRoles = ['admin', 'masteradmin', 'superadmin', 'owner'];
        if (!userRole || !allowedRoles.includes(userRole.toLowerCase())) {
            console.warn(`[Admin] Invalid role '${userRole}', redirecting`);
            window.location.href = '/index.html'; // Default to safe landing
            return;
        }
    }

    // Initialize Layout (Sidebar + Header)
    import('./components/dashboard-layout.js?v=FIX_REL').then(({ initDashboardLayout }) => {
        const userData = {
            username: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail'),
            firstName: localStorage.getItem('userName')?.split(' ')[0],
            lastName: localStorage.getItem('userName')?.split(' ').slice(1).join(' ')
        };
        // Normalize role for layout (e.g. MasterAdmin -> admin layout)
        initDashboardLayout('admin', userData);
    });

    // Initialize Header with real balance
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        // Load real balance
        try {
            let userId = localStorage.getItem('userId');

            // Self-healing: If ID missing, fetch it
            if (!userId || userId === 'undefined') {
                try {
                    console.log('[Admin] UserId missing, fetching from API...');
                    const userRes = await apiService.getCurrentUser();
                    const user = userRes.data || userRes;
                    if (user && (user.id || user.Id)) {
                        userId = user.id || user.Id;
                        localStorage.setItem('userId', userId);
                        localStorage.setItem('userName', `${user.firstName} ${user.lastName}`.trim());
                    }
                } catch (e) {
                    console.warn('[Admin] Failed to recover identity', e);
                }
            }

            if (userId && userId !== 'undefined') {
                const balanceResponse = await apiService.getAccountBalance(userId);
                const balance = balanceResponse?.data?.balance || 0;
                headerContainer.innerHTML = ''; // Prevent duplicate
                headerContainer.appendChild(createHeader('admin', balance));
            } else {
                console.warn('[Admin] UserId not found after recovery, showing 0 balance');
                headerContainer.innerHTML = ''; // Prevent duplicate
                headerContainer.appendChild(createHeader('admin', 0));
            }
        } catch (error) {
            console.error('[Admin] Failed to load balance:', error);
            headerContainer.appendChild(createHeader('admin', 0));
        }
        initHeader();
    }

    // Load Dashboard Data
    await loadDashboardStats();
    await loadUsersTable();
    // await loadAuditLogs();

    // Load Pricing Widget Preview
    await loadPricingWidget();

    // Initialize Globe
    setTimeout(() => {
        initGlobe('admin-globe-container');
    }, 300);


});

/**
 * Load dashboard statistics from API
 */
async function loadDashboardStats() {
    try {

        const stats = await apiService.getDashboardStats();



        // Platform Revenue
        const statRevenue = document.getElementById('stat-revenue');
        if (statRevenue) {
            statRevenue.innerHTML = createStatCard({
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
                label: 'Platform Revenue',
                value: `$${(stats.totalRevenue || 0).toLocaleString()}`,
                trend: stats.revenueTrend || 0,
                color: 'cyan'
            });
        }

        // Total Users
        const statUsers = document.getElementById('stat-users');
        if (statUsers) {
            statUsers.innerHTML = createStatCard({
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>',
                label: 'Total Users',
                value: (stats.totalUsers || 0).toLocaleString(),
                trend: stats.usersTrend || 0,
                color: 'violet'
            });
        }

        // Active Calls
        const statTickets = document.getElementById('stat-tickets');
        if (statTickets) {
            statTickets.innerHTML = createStatCard({
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>',
                label: 'Active Calls',
                value: (stats.activeCalls || 0).toString(),
                trend: stats.callsTrend || 0,
                color: 'success'
            });
        }

        // Total SMS
        const statNodes = document.getElementById('stat-nodes');
        if (statNodes) {
            statNodes.innerHTML = createStatCard({
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>',
                label: 'Total SMS',
                value: (stats.totalSMS || 0).toLocaleString(),
                color: 'violet'
            });
        }


        // System Health Gauges (mock for now - can be added to API later)
        document.getElementById('gauge-cpu').innerHTML = createGaugeChart({
            value: stats.cpuUsage || 67,
            max: 100,
            label: 'CPU Usage (Port 5004)',
            color: 'cyan'
        });

        document.getElementById('gauge-memory').innerHTML = createGaugeChart({
            value: stats.memoryUsage || 82,
            max: 100,
            label: 'Memory Usage',
            color: 'violet'
        });

    } catch (error) {
        console.error('[Admin] Failed to load dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');

        // Show default values on error
        document.getElementById('stat-revenue').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
            label: 'Platform Revenue',
            value: '$0',
            color: 'cyan'
        });
    }
}

/**
 * Load users table from API
 */
/**
 * Load users table from API
 */
async function loadUsersTable() {
    try {
        const response = await apiService.getUsers();

        // Handle various response shapes (array, { data: [] }, { users: [] })
        let usersList = [];
        if (Array.isArray(response)) {
            usersList = response;
        } else if (response && Array.isArray(response.data)) {
            usersList = response.data;
        } else if (response && Array.isArray(response.users)) {
            usersList = response.users;
        } else {
            console.warn('[Admin] getUsers returned unexpected structure:', response);
            usersList = [];
        }

        if (usersList.length === 0) {
            // Optional: Show empty state
        }

        const rows = usersList.map(user => [
            user.email || user.username,
            user.role || 'User',
            createBadge(user.isActive ? 'Active' : 'Inactive', user.isActive ? 'success' : 'danger'),
            `$${(user.balance || user.accountBalance || 0).toFixed(2)}`,
            user.lastActive || 'N/A'
        ]);

        document.getElementById('users-table').innerHTML = createDataTable({
            headers: ['User', 'Type', 'Status', 'Balance', 'Last Active'],
            rows: rows.length > 0 ? rows : [['No users found', '', '', '', '']],
            actions: ['Edit', 'View']
        });

    } catch (error) {
        console.error('[Admin] Failed to load users:', error);
        document.getElementById('users-table').innerHTML = createDataTable({
            headers: ['User', 'Type', 'Status', 'Balance', 'Last Active'],
            rows: [['Error loading users', '', '', '', '']],
            actions: []
        });
    }
}

/**
 * Load audit logs from API
 */
async function loadAuditLogs() {
    try {

        const logs = await apiService.getAuditLogs({ page: 1, pageSize: 10 });



        const rows = logs.map(log => [
            `#${log.id}`,
            log.userName || 'System',
            log.action || 'N/A',
            log.entityName || 'N/A',
            createBadge('Logged', 'info'),
            new Date(log.timestamp).toLocaleString()
        ]);

        document.getElementById('tickets-table').innerHTML = createDataTable({
            headers: ['Log ID', 'User', 'Action', 'Entity', 'Status', 'Timestamp'],
            rows: rows.length > 0 ? rows : [['No audit logs found', '', '', '', '', '']],
            actions: ['View']
        });

    } catch (error) {
        console.error('[Admin] Failed to load audit logs:', error);
        document.getElementById('tickets-table').innerHTML = createDataTable({
            headers: ['Log ID', 'User', 'Action', 'Entity', 'Status', 'Timestamp'],
            rows: [['Error loading logs', '', '', '', '', '']],
            actions: []
        });
    }
}

/**
 * Load pricing widget preview
 */
async function loadPricingWidget() {
    try {

        const tariffs = await apiService.getTariffs();

        const container = document.getElementById('pricing-widget-container');
        if (container) {
            if (tariffs.length === 0) {
                container.innerHTML = `
                    <div class="glass-card p-6 text-center">
                        <p class="text-white/60 mb-4">No tariffs configured yet</p>
                        <a href="/pricing-admin.html" class="btn-neon inline-block">
                            Upload Rate List
                        </a>
                    </div>
                `;
            } else {
                // Show tariff summary
                container.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        ${tariffs.slice(0, 3).map(tariff => `
                            <div class="glass-card p-4">
                                <div class="flex items-center justify-between mb-2">
                                    <h3 class="font-bold text-white">${tariff.name}</h3>
                                    <span class="px-2 py-1 rounded text-xs ${tariff.isActive ? 'bg-success/20 text-success' : 'bg-white/10 text-white/40'}">
                                        ${tariff.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <p class="text-sm text-white/60 mb-3">${tariff.description || 'No description'}</p>
                                <a href="/pricing-admin.html" class="text-xs text-neon-cyan hover:text-white transition-colors">
                                    Manage Rates →
                                </a>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('[Admin] Failed to load pricing widget:', error);
        const container = document.getElementById('pricing-widget-container');
        if (container) {
            container.innerHTML = `
                <div class="glass-card p-6 text-center">
                    <p class="text-white/60">Unable to load pricing data</p>
                </div>
            `;
        }
    }
}

/**
 * Add developer mode banner to dashboard
 */

