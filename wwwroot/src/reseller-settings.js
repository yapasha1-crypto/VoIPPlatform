// Reseller Settings Page
// import './style.css'; // Removed for static execution
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
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
    loadSettings();
});

function loadSettings() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const reseller = MOCK_DATA.users.find(u => u.role === 'reseller');

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">Account Information</h3>
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Company Name</label>
                        <input type="text" value="${reseller.firstName} ${reseller.lastName}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" value="${reseller.email}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Phone</label>
                        <input type="tel" value="${reseller.phoneNumber}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <button type="button" class="btn-primary w-full" onclick="alert('Settings saved!')">Save Changes</button>
                </form>
            </div>

            <div class="glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">Notification Preferences</h3>
                <form class="space-y-4">
                    <div class="flex items-center justify-between">
                        <span>Email Notifications</span>
                        <input type="checkbox" checked class="w-5 h-5">
                    </div>
                    <div class="flex items-center justify-between">
                        <span>SMS Alerts</span>
                        <input type="checkbox" class="w-5 h-5">
                    </div>
                    <button type="button" class="btn-primary w-full" onclick="alert('Preferences saved!')">Save Preferences</button>
                </form>
            </div>
        </div>
    `;
}


