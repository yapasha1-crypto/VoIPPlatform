// Profile Page (Shared across all roles)
import './style.css';
import { createSidebar } from './components/dashboard/sidebar.js';
import { createHeader } from './components/dashboard/header.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';

document.addEventListener('DOMContentLoaded', async () => {
    let userRole = localStorage.getItem('userRole') || 'user';

    if (API_CONFIG.MOCK_MODE) {
        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', userRole);
        addDeveloperModeBanner();
    }

    document.getElementById('sidebar-container')?.appendChild(createSidebar(userRole));
    document.getElementById('header-container')?.appendChild(createHeader(userRole));
    loadProfile();
});

function loadProfile() {
    const container = document.getElementById('page-content');
    if (!container) return;

    const userRole = localStorage.getItem('userRole') || 'user';
    const user = MOCK_DATA.users.find(u => u.role === userRole) || MOCK_DATA.users[0];

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="glass-card p-6 rounded-xl text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold">
                    ${user.firstName.charAt(0)}${user.lastName.charAt(0)}
                </div>
                <h3 class="text-xl font-heading font-bold mb-1">${user.firstName} ${user.lastName}</h3>
                <p class="text-white/60 mb-4">${user.email}</p>
                <div class="inline-block px-3 py-1 rounded-full text-sm font-medium bg-neon-${user.role === 'admin' ? 'violet' : user.role === 'reseller' ? 'cyan' : 'violet'}/20 text-neon-${user.role === 'admin' ? 'violet' : user.role === 'reseller' ? 'cyan' : 'violet'}">
                    ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </div>
            </div>

            <div class="lg:col-span-2 glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">Profile Information</h3>
                <form class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">First Name</label>
                            <input type="text" value="${user.firstName}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Last Name</label>
                            <input type="text" value="${user.lastName}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" value="${user.email}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Phone Number</label>
                        <input type="tel" value="${user.phoneNumber}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Account Balance</label>
                        <input type="text" value="$${user.accountBalance.toFixed(2)}" disabled class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60">
                    </div>
                    <button type="button" class="btn-primary" onclick="alert('Profile updated!')">Save Changes</button>
                </form>
            </div>
        </div>

        <div class="glass-card p-6 rounded-xl mt-6">
            <h3 class="text-lg font-heading font-bold mb-4">Account Activity</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-white/5 rounded-lg">
                    <p class="text-white/60 text-sm mb-1">Member Since</p>
                    <p class="text-lg font-bold">${new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="p-4 bg-white/5 rounded-lg">
                    <p class="text-white/60 text-sm mb-1">Account Status</p>
                    <p class="text-lg font-bold ${user.isActive ? 'text-green-400' : 'text-red-400'}">${user.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div class="p-4 bg-white/5 rounded-lg">
                    <p class="text-white/60 text-sm mb-1">User ID</p>
                    <p class="text-lg font-bold">#${user.id}</p>
                </div>
            </div>
        </div>
    `;

    toast.success('Profile loaded');
}

function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `position: fixed; top: 0; left: 0; right: 0; z-index: 9999; background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%); color: #000; text-align: center; padding: 8px 16px; font-weight: bold; font-size: 14px;`;
    banner.innerHTML = '🔧 DEVELOPER MODE';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
