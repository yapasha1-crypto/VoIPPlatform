// Admin Settings Page
import './style.css';
import { createSidebar } from './components/dashboard/sidebar.js';
import { createHeader } from './components/dashboard/header.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

document.addEventListener('DOMContentLoaded', async () => {
    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'admin');
        addDeveloperModeBanner();
    }

    document.getElementById('sidebar-container')?.appendChild(createSidebar('admin'));
    document.getElementById('header-container')?.appendChild(createHeader('admin'));
    loadSettings();
});

function loadSettings() {
    const container = document.getElementById('page-content');
    if (!container) return;

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">System Configuration</h3>
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Company Name</label>
                        <input type="text" value="Beroea VoIP" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Support Email</label>
                        <input type="email" value="support@beroea.com" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <button type="button" class="btn-primary w-full" onclick="alert('Settings saved!')">Save Changes</button>
                </form>
            </div>

            <div class="glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">Security Settings</h3>
                <form class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                        <input type="number" value="30" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Max Login Attempts</label>
                        <input type="number" value="5" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <button type="button" class="btn-primary w-full" onclick="alert('Security settings saved!')">Save Changes</button>
                </form>
            </div>
        </div>
    `;
}

function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: #000; text-align: center; padding: 8px 16px; font-weight: bold; font-size: 14px;`;
    banner.innerHTML = '🔧 DEVELOPER MODE';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
