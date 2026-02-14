// Admin System Health Page
import './style.css';
import { createSidebar } from './components/dashboard/sidebar.js';
import { createHeader } from './components/dashboard/header.js';
import { createStatCard, createGaugeChart } from './components/dashboard/widgets.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

console.log('🖥️ Admin System Health - Initializing...');

document.addEventListener('DOMContentLoaded', async () => {
    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userId', '1');
        addDeveloperModeBanner();
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) sidebarContainer.appendChild(createSidebar('admin'));

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) headerContainer.appendChild(createHeader('admin'));

    await loadSystemHealth();
});

async function loadSystemHealth() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const health = MOCK_DATA.systemHealth;
    const uptimeDays = Math.floor(health.uptime / 86400);

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>',
        label: 'CPU Usage',
        value: `${health?.cpu || 0}%`,
        color: (health?.cpu || 0) > 80 ? 'warning' : 'cyan'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>',
        label: 'Memory Usage',
        value: `${health?.memory || 0}%`,
        color: (health?.memory || 0) > 80 ? 'warning' : 'violet'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>',
        label: 'Storage',
        value: `${health?.storage || 0}%`,
        color: 'cyan'
    })}
            ${createStatCard({
        icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>',
        label: 'Active Connections',
        value: (health?.activeConnections || 0).toLocaleString(),
        color: 'violet'
    })}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div class="glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">CPU Usage</h3>
                ${createGaugeChart({ value: health?.cpu || 0, max: 100, label: 'CPU', color: 'cyan' })}
            </div>
            <div class="glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">Memory Usage</h3>
                ${createGaugeChart({ value: health?.memory || 0, max: 100, label: 'Memory', color: 'violet' })}
            </div>
            <div class="glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">Storage Usage</h3>
                ${createGaugeChart({ value: health?.storage || 0, max: 100, label: 'Storage', color: 'cyan' })}
            </div>
        </div>

        <div class="glass-card p-6 rounded-xl">
            <h3 class="text-lg font-heading font-bold mb-4">System Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-white/5 rounded-lg">
                    <p class="text-white/60 text-sm mb-1">Uptime</p>
                    <p class="text-xl font-bold">${uptimeDays} days</p>
                </div>
                <div class="p-4 bg-white/5 rounded-lg">
                    <p class="text-white/60 text-sm mb-1">Last Updated</p>
                    <p class="text-xl font-bold">${new Date(health.lastUpdated).toLocaleTimeString()}</p>
                </div>
            </div>
        </div>
    `;

    toast.success('System health loaded');
}

function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: #000; text-align: center; padding: 8px 16px; font-weight: bold; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);`;
    banner.innerHTML = '🔧 DEVELOPER MODE - Using Mock Data';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
