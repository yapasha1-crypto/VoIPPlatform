import { initDashboardLayout } from './components/dashboard-layout.js';
import { toast } from './components/toast.js';
import { apiService } from './services/apiService.js';
import { API_CONFIG } from './config/api.config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check (Copied from admin.v2.js standard)
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        console.warn('[Profile] No token found, redirecting');
        window.location.href = '/index.html';
        return;
    }

    // 2. Initialize Layout
    const userData = {
        username: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        firstName: localStorage.getItem('userName')?.split(' ')[0],
        lastName: localStorage.getItem('userName')?.split(' ').slice(1).join(' ')
    };

    // Use the Unified Layout Manager (handles Sidebar/Header injection)
    // If we are admin, force 'admin' layout to ensure Admin Sidebar
    // If we are user, use 'user' layout
    const layoutRole = (userRole === 'admin' || userRole === 'masteradmin' || userRole === 'superadmin') ? 'admin' : 'user';
    initDashboardLayout(layoutRole, userData);

    // 3. Load Profile Data
    await loadProfile();
});

async function loadProfile() {
    const container = document.getElementById('page-content');
    if (!container) return;

    try {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan"></div>
                <span class="ml-4 text-white/70">Loading profile...</span>
            </div>
        `;

        // Fetch User Data
        const user = await apiService.getCurrentUser();
        if (!user) throw new Error('Failed to load user data');

        // Fetch Account Balance if not in user object
        let balance = user.balance || 0;
        try {
            const balanceData = await apiService.getAccountBalance(user.id);
            if (balanceData) balance = balanceData.balance;
        } catch (e) {
            console.warn('Failed to fetch balance', e);
        }

        renderProfile(container, user, balance);

    } catch (error) {
        console.error('Profile Load Error:', error);
        container.innerHTML = `
            <div class="text-center py-12 text-red-400">
                <p>Failed to load profile data.</p>
                <button onclick="location.reload()" class="mt-4 text-neon-cyan hover:underline">Retry</button>
            </div>
        `;
        toast.error('Failed to load profile');
    }
}

function renderProfile(container, user, balance) {
    const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '') || 'U';

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="glass-card p-6 rounded-xl text-center">
                <div class="w-24 h-24 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold">
                    ${initials}
                </div>
                <h3 class="text-xl font-heading font-bold mb-1">${user.firstName || ''} ${user.lastName || ''}</h3>
                <p class="text-white/60 mb-4">${user.email}</p>
                <div class="inline-block px-3 py-1 rounded-full text-sm font-medium bg-neon-violet/20 text-neon-violet">
                    ${user.role || 'User'}
                </div>
            </div>

            <div class="lg:col-span-2 glass-card p-6 rounded-xl">
                <h3 class="text-lg font-heading font-bold mb-4">Profile Information</h3>
                <form id="profile-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">First Name</label>
                            <input type="text" id="firstName" name="firstName" value="${user.firstName || ''}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Last Name</label>
                            <input type="text" id="lastName" name="lastName" value="${user.lastName || ''}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none text-white">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input type="email" value="${user.email}" disabled class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Phone Number</label>
                        <input type="tel" id="phoneNumber" name="phoneNumber" value="${user.phoneNumber || ''}" class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-neon-cyan focus:outline-none text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Account Balance</label>
                        <input type="text" value="$${Number(balance).toFixed(2)}" disabled class="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60">
                    </div>
                    <div class="flex justify-end">
                        <button type="submit" class="btn-primary flex items-center gap-2">
                             <span>Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="glass-card p-6 rounded-xl mt-6">
            <h3 class="text-lg font-heading font-bold mb-4">Account Activity</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-4 bg-white/5 rounded-lg">
                    <p class="text-white/60 text-sm mb-1">User ID</p>
                    <p class="text-lg font-bold">#${user.id}</p>
                </div>
                 <div class="p-4 bg-white/5 rounded-lg">
                    <p class="text-white/60 text-sm mb-1">Username</p>
                    <p class="text-lg font-bold">${user.username}</p>
                </div>
            </div>
        </div>
    `;

    // Bind Form Submit
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile(user.id);
    });
}

async function updateProfile(userId) {
    const btn = document.querySelector('#profile-form button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Saving...';

    try {
        const data = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            phoneNumber: document.getElementById('phoneNumber').value
        };

        // Note: apiService needs a dedicated updateProfile method or generic put
        // Assuming apiService.put or similar exists, or using fetch directly if not exposed.
        // Let's check apiService.js next. For now, using a direct fetch wrapper assumption or we add it.
        // Actually, let's look at apiService structure. It probably has a generic implementation?
        // If not, we'll assume a standard fetch for now.

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/Users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error('Failed to update');

        toast.success('Profile updated successfully');

        // Update local storage user data to reflect changes immediately
        const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
        const updatedUser = { ...currentUser, ...data };
        localStorage.setItem('userData', JSON.stringify(updatedUser)); // Not perfect (email/role might be missing) but good for cache.

        // Reload to refresh all views? Or just stay.

    } catch (error) {
        console.error('Update failed:', error);
        toast.error('Failed to update profile');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}


