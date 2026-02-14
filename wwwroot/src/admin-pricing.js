// Beroea VoIP Platform - Admin Pricing Management Page
// import './style.css'; // Removed for static execution
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
import { createRateUploadWidget, initRateUploadWidget, createRateTable } from './components/dashboard/pricingWidgets.js';
import { apiService } from './services/apiService.js';
import { toast } from './components/toast.js';

console.log('💰 Pricing Management - Initializing...');

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token) {
        console.warn('[Pricing] No token found, redirecting to login');
        window.location.href = '/index.html';
        return;
    }

    if (userRole !== 'admin') {
        console.warn('[Pricing] User is not admin, access denied');
        toast.error('Access denied - Admin privileges required');
        setTimeout(() => {
            window.location.href = userRole === 'reseller' ? '/reseller.html' : '/user.html';
        }, 2000);
        return;
    }

    // Initialize Sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.appendChild(createSidebar('admin'));
        initSidebar();
    }

    // Initialize Header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        try {
            const userId = localStorage.getItem('userId');
            const balanceResponse = await apiService.getAccountBalance(userId);
            const balance = balanceResponse?.data?.balance || 0;
            headerContainer.appendChild(createHeader('admin', balance));
        } catch (error) {
            console.error('[Pricing] Failed to load balance:', error);
            headerContainer.appendChild(createHeader('admin', 0));
        }
        initHeader();
    }

    // Initialize Rate Upload Widget
    const uploadWidget = document.getElementById('rate-upload-widget');
    if (uploadWidget) {
        uploadWidget.innerHTML = createRateUploadWidget();
        await initRateUploadWidget();
    }

    // Load Tariffs
    await loadTariffs();

    // Initialize tariff filter
    const tariffFilter = document.getElementById('tariff-filter');
    if (tariffFilter) {
        tariffFilter.addEventListener('change', async (e) => {
            const tariffId = e.target.value;
            if (tariffId) {
                await loadRates(tariffId);
            }
        });
    }

    console.log('✅ Pricing Management - Initialized');
});

/**
 * Load and display all tariffs
 */
async function loadTariffs() {
    try {
        console.log('[Pricing] Loading tariffs...');
        const tariffs = await apiService.getTariffs();

        // Update tariff list
        const tariffList = document.getElementById('tariff-list');
        if (tariffList) {
            if (tariffs.length === 0) {
                tariffList.innerHTML = `
                    <div class="col-span-full glass-card p-8 text-center">
                        <p class="text-white/60">No tariffs found. Upload a CSV to create your first tariff.</p>
                    </div>
                `;
            } else {
                tariffList.innerHTML = tariffs.map(tariff => `
                    <div class="glass-card p-4 hover:bg-white/5 transition-all cursor-pointer" data-tariff-id="${tariff.id}">
                        <div class="flex items-start justify-between mb-2">
                            <h3 class="text-lg font-bold text-white">${tariff.name}</h3>
                            <span class="px-2 py-1 rounded text-xs ${tariff.isActive ? 'bg-success/20 text-success' : 'bg-white/10 text-white/40'}">
                                ${tariff.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <p class="text-sm text-white/60 mb-3">${tariff.description || 'No description'}</p>
                        <div class="flex gap-2">
                            <button class="text-xs text-neon-cyan hover:text-white transition-colors" onclick="viewTariffRates(${tariff.id})">
                                View Rates
                            </button>
                            <button class="text-xs text-white/60 hover:text-red-400 transition-colors" onclick="deleteTariff(${tariff.id})">
                                Delete
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Update tariff filter
        const tariffFilter = document.getElementById('tariff-filter');
        if (tariffFilter) {
            tariffFilter.innerHTML = '<option value="">Select tariff to view rates...</option>';
            tariffs.forEach(tariff => {
                const option = document.createElement('option');
                option.value = tariff.id;
                option.textContent = tariff.name;
                tariffFilter.appendChild(option);
            });
        }

        console.log(`[Pricing] Loaded ${tariffs.length} tariffs`);
    } catch (error) {
        console.error('[Pricing] Failed to load tariffs:', error);
        toast.error('Failed to load tariffs');
    }
}

/**
 * Load rates for a specific tariff
 */
async function loadRates(tariffId) {
    try {
        console.log(`[Pricing] Loading rates for tariff ${tariffId}...`);
        const rates = await apiService.getTariffRates(tariffId);

        const rateTable = document.getElementById('rate-table');
        if (rateTable) {
            rateTable.innerHTML = createRateTable(rates, `Rates (${rates.length} destinations)`, true);
        }

        console.log(`[Pricing] Loaded ${rates.length} rates`);
        toast.success(`Loaded ${rates.length} rates`);
    } catch (error) {
        console.error('[Pricing] Failed to load rates:', error);
        toast.error('Failed to load rates');
    }
}

/**
 * View rates for a tariff (called from tariff card)
 */
window.viewTariffRates = async function (tariffId) {
    const tariffFilter = document.getElementById('tariff-filter');
    if (tariffFilter) {
        tariffFilter.value = tariffId;
    }
    await loadRates(tariffId);

    // Scroll to rate table
    document.getElementById('rate-table')?.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Delete a tariff
 */
window.deleteTariff = async function (tariffId) {
    if (!confirm('Are you sure you want to delete this tariff? This will also delete all associated rates.')) {
        return;
    }

    try {
        await apiService.deleteTariff(tariffId);
        toast.success('Tariff deleted successfully');
        await loadTariffs();

        // Clear rate table if this tariff was selected
        const tariffFilter = document.getElementById('tariff-filter');
        if (tariffFilter && tariffFilter.value == tariffId) {
            tariffFilter.value = '';
            document.getElementById('rate-table').innerHTML = '';
        }
    } catch (error) {
        console.error('[Pricing] Failed to delete tariff:', error);
        toast.error('Failed to delete tariff');
    }
};
