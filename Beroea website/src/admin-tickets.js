// Admin Tickets Page
import './style.css';
import { createSidebar } from './components/dashboard/sidebar.js';
import { createHeader } from './components/dashboard/header.js';
import { createDataTable } from './components/dashboard/widgets.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

console.log('🎫 Admin Tickets - Initializing...');

document.addEventListener('DOMContentLoaded', async () => {
    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'admin');
        addDeveloperModeBanner();
    }

    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) sidebarContainer.appendChild(createSidebar('admin'));

    const headerContainer = document.getElementById('header-container');
    if (headerContainer) headerContainer.appendChild(createHeader('admin'));

    await loadTickets();
});

async function loadTickets() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const tickets = MOCK_DATA.tickets;

    const table = createDataTable({
        columns: [
            { key: 'id', label: 'ID', width: '60px' },
            { key: 'userName', label: 'User' },
            { key: 'subject', label: 'Subject' },
            {
                key: 'priority', label: 'Priority', format: (value) => {
                    const colors = {
                        high: 'bg-red-500/20 text-red-400',
                        medium: 'bg-yellow-500/20 text-yellow-400',
                        low: 'bg-green-500/20 text-green-400'
                    };
                    return `<span class="px-2 py-1 rounded text-xs font-medium ${colors[value]}">${value}</span>`;
                }
            },
            {
                key: 'status', label: 'Status', format: (value) => {
                    const colors = {
                        open: 'bg-neon-cyan/20 text-neon-cyan',
                        'in-progress': 'bg-neon-violet/20 text-neon-violet',
                        closed: 'bg-white/20 text-white/60'
                    };
                    return `<span class="px-2 py-1 rounded text-xs font-medium ${colors[value]}">${value}</span>`;
                }
            },
            { key: 'createdAt', label: 'Created', format: (value) => new Date(value).toLocaleDateString() }
        ],
        data: tickets,
        emptyMessage: 'No tickets found'
    });

    container.innerHTML = `
        <div class="glass-card p-6 rounded-xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-heading font-bold">All Tickets</h2>
                <div class="flex gap-2">
                    <button class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">All</button>
                    <button class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">Open</button>
                    <button class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">Closed</button>
                </div>
            </div>
            ${table}
        </div>
    `;

    toast.success('Tickets loaded');
}

function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: #000; text-align: center; padding: 8px 16px; font-weight: bold; font-size: 14px;`;
    banner.innerHTML = '🔧 DEVELOPER MODE - Using Mock Data';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
