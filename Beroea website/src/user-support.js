// User Support Page
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
        localStorage.setItem('userRole', 'user');
        addDeveloperModeBanner();
    }

    document.getElementById('sidebar-container')?.appendChild(createSidebar('user'));
    document.getElementById('header-container')?.appendChild(createHeader('user'));
    loadSupport();
});

function loadSupport() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const myTickets = MOCK_DATA.tickets.filter(t => t.userId === 3);

    const table = createDataTable({
        columns: [
            { key: 'id', label: 'ID', width: '60px' },
            { key: 'subject', label: 'Subject' },
            {
                key: 'priority', label: 'Priority', format: (v) => {
                    const colors = { high: 'bg-red-500/20 text-red-400', medium: 'bg-yellow-500/20 text-yellow-400', low: 'bg-green-500/20 text-green-400' };
                    return `<span class="px-2 py-1 rounded text-xs font-medium ${colors[v]}">${v}</span>`;
                }
            },
            {
                key: 'status', label: 'Status', format: (v) => {
                    const colors = { open: 'bg-neon-cyan/20 text-neon-cyan', 'in-progress': 'bg-neon-violet/20 text-neon-violet', closed: 'bg-white/20 text-white/60' };
                    return `<span class="px-2 py-1 rounded text-xs font-medium ${colors[v]}">${v}</span>`;
                }
            },
            { key: 'createdAt', label: 'Created', format: (v) => new Date(v).toLocaleDateString() }
        ],
        data: myTickets
    });

    container.innerHTML = `
        <div class="glass-card p-6 rounded-xl mb-6">
            <h3 class="text-lg font-heading font-bold mb-4">Create New Ticket</h3>
            <form class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Subject</label>
                    <input type="text" placeholder="Brief description of your issue" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Priority</label>
                    <select class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Message</label>
                    <textarea rows="4" placeholder="Describe your issue in detail" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none"></textarea>
                </div>
                <button type="button" class="btn-primary" onclick="alert('Ticket submitted!')">Submit Ticket</button>
            </form>
        </div>

        <div class="glass-card p-6 rounded-xl">
            <h3 class="text-lg font-heading font-bold mb-4">My Tickets</h3>
            ${table}
        </div>
    `;

    toast.success('Support page loaded');
}

function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: #000; text-align: center; padding: 8px 16px; font-weight: bold; font-size: 14px;`;
    banner.innerHTML = '🔧 DEVELOPER MODE';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
