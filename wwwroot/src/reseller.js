// import './style.css'; // Removed for static execution
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
import { createStatCard, createGaugeChart, createDataTable, createBadge, createModal, initModals, createLineChart } from './components/dashboard/widgets.js';
import { apiService } from './services/apiService.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';



document.addEventListener('DOMContentLoaded', async () => {
    // DEVELOPER MODE: Bypass authentication when using mock data
    if (API_CONFIG.MOCK_MODE) {

        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'reseller');
        localStorage.setItem('userId', '2');
        localStorage.setItem('userEmail', 'reseller@beroea.com');
        localStorage.setItem('userName', 'Reseller Partner');
        sessionStorage.setItem('redirectCount', '0');
        // addDeveloperModeBanner();
    } else {
        // PRODUCTION MODE: Normal authentication checks
        const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0');
        const lastRedirectTime = parseInt(sessionStorage.getItem('lastRedirectTime') || '0');
        const now = Date.now();

        if (redirectCount > 3 && (now - lastRedirectTime) < 5000) {
            console.error('[Reseller] ⚠️ REDIRECT LOOP DETECTED - Clearing session');
            sessionStorage.clear();
            localStorage.clear();
            alert('Session error detected. Please log in again.');
            window.location.href = '/index.html';
            return;
        }

        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token) {
            console.warn('[Reseller] No token found, redirecting to login');
            sessionStorage.setItem('redirectCount', '0');
            window.location.href = '/index.html';
            return;
        }

        if (userRole !== 'reseller') {
            console.warn('[Reseller] User is not reseller, redirecting to appropriate dashboard');
            sessionStorage.setItem('redirectCount', String(redirectCount + 1));
            sessionStorage.setItem('lastRedirectTime', String(now));
            window.location.href = userRole === 'admin' ? '/admin.html' : '/user.html';
            return;
        }

        sessionStorage.setItem('redirectCount', '0');
    }

    // Initialize Sidebar
    // Initialize Sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.appendChild(createSidebar('reseller'));
        initSidebar();
    }

    // Initialize Header with real balance
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        try {
            const userId = localStorage.getItem('userId');
            const balanceResponse = await apiService.getAccountBalance(userId);
            const balance = balanceResponse?.data?.balance || 0;
            headerContainer.appendChild(createHeader('reseller', balance));
        } catch (error) {
            console.error('[Reseller] Failed to load balance:', error);
            headerContainer.appendChild(createHeader('reseller', 0));
        }
        initHeader();
    }

    // Load Dashboard Data
    await loadDashboardStats();
    await loadCallRecords();
    await loadTransactions();

    // Load Reseller Pricing Widget
    await loadResellerPricingWidget();

    // Profit Chart (mock for now)
    setTimeout(() => {
        createLineChart('profit-chart',
            [2500, 3200, 2800, 4100, 3900, 4500, 5200, 4800, 5800, 6200, 5900, 6800],
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        );
    }, 100);

    // Create Account Modal
    document.getElementById('create-account-modal').innerHTML = createModal({
        id: 'create-account-modal',
        title: 'Create Sub-User Account',
        content: `
      <form class="space-y-4">
        <div>
          <label class="block text-sm text-white/60 mb-2">Email Address</label>
          <input type="email" class="w-full glass-card px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan" placeholder="user@example.com">
        </div>
        <div>
          <label class="block text-sm text-white/60 mb-2">Initial Balance</label>
          <input type="number" class="w-full glass-card px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan" placeholder="0.00">
        </div>
        <div>
          <label class="block text-sm text-white/60 mb-2">Rate Plan</label>
          <select class="w-full glass-card px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan">
            <option>Standard</option>
            <option>Premium</option>
            <option>Enterprise</option>
          </select>
        </div>
        <button type="submit" class="w-full btn-neon">Create Account</button>
      </form>
    `
    });

    // Initialize modals
    initModals();

    // Create Account Button
    document.getElementById('create-account-btn')?.addEventListener('click', () => {
        document.getElementById('create-account-modal')?.classList.remove('hidden');
    });


});

/**
 * Load dashboard statistics from API
 */
async function loadDashboardStats() {
    try {

        const stats = await apiService.getDashboardStats();
        const userId = localStorage.getItem('userId');
        const balanceResponse = await apiService.getAccountBalance(userId);
        const balance = balanceResponse?.data?.balance || 0;



        // Sub-Users
        document.getElementById('stat-subusers').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>',
            label: 'Sub-Users',
            value: (stats.subUsers || 0).toString(),
            trend: stats.subUsersTrend || 0,
            color: 'cyan'
        });

        // Monthly Sales
        document.getElementById('stat-sales').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>',
            label: 'Monthly Sales',
            value: `$${(stats.monthlySales || 0).toLocaleString()}`,
            trend: stats.salesTrend || 0,
            color: 'violet'
        });

        // Available Credits
        document.getElementById('stat-credits').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>',
            label: 'Available Credits',
            value: `$${balance.toLocaleString()}`,
            color: 'success'
        });

        // Profit Margin
        document.getElementById('stat-profit').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>',
            label: 'Profit Margin',
            value: `${(stats.profitMargin || 0).toFixed(1)}%`,
            trend: stats.profitTrend || 0,
            color: 'warning'
        });

        // Credit Inventory Gauge
        document.getElementById('gauge-credits').innerHTML = createGaugeChart({
            value: balance,
            max: 15000,
            label: 'Credit Inventory',
            color: 'violet'
        });

    } catch (error) {
        console.error('[Reseller] Failed to load dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
    }
}

/**
 * Load call records from API
 */
async function loadCallRecords() {
    try {

        const userId = localStorage.getItem('userId');
        const calls = await apiService.getCallsByAccount(userId);



        const rows = calls.slice(0, 5).map(call => [
            call.callerNumber || 'N/A',
            createBadge(call.status || 'Completed', call.status === 'completed' ? 'success' : 'warning'),
            `$${(call.cost || 0).toFixed(2)}`,
            `${call.duration || 0} min`,
            new Date(call.startTime).toLocaleDateString()
        ]);

        document.getElementById('subusers-table').innerHTML = createDataTable({
            headers: ['Caller', 'Status', 'Cost', 'Duration', 'Date'],
            rows: rows.length > 0 ? rows : [['No calls found', '', '', '', '']],
            actions: ['View Details']
        });

    } catch (error) {
        console.error('[Reseller] Failed to load call records:', error);
        document.getElementById('subusers-table').innerHTML = createDataTable({
            headers: ['Caller', 'Status', 'Cost', 'Duration', 'Date'],
            rows: [['Error loading calls', '', '', '', '']],
            actions: []
        });
    }
}

/**
 * Load transactions from API
 */
async function loadTransactions() {
    try {

        const transactions = await apiService.getTransactions();



        const rows = transactions.slice(0, 5).map(tx => [
            new Date(tx.date || tx.createdAt).toLocaleString(),
            tx.type || 'Transaction',
            tx.description || 'N/A',
            `${tx.amount >= 0 ? '+' : ''}$${Math.abs(tx.amount || 0).toFixed(2)}`,
            createBadge(tx.status || 'Completed', 'success')
        ]);

        document.getElementById('transactions-table').innerHTML = createDataTable({
            headers: ['Date', 'Type', 'Description', 'Amount', 'Status'],
            rows: rows.length > 0 ? rows : [['No transactions found', '', '', '', '']],
            actions: []
        });

    } catch (error) {
        console.error('[Reseller] Failed to load transactions:', error);
        document.getElementById('transactions-table').innerHTML = createDataTable({
            headers: ['Date', 'Type', 'Description', 'Amount', 'Status'],
            rows: [['Error loading transactions', '', '', '', '']],
            actions: []
        });
    }
}

/**
 * Load reseller pricing widget with margin calculator
 */
async function loadResellerPricingWidget() {
    try {

        const tariffs = await apiService.getTariffs();

        const container = document.getElementById('reseller-pricing-widget');
        if (!container) return;

        if (tariffs.length === 0) {
            container.innerHTML = `
                <div class="glass-card p-6 text-center">
                    <p class="text-white/60">No admin rates available yet. Contact your administrator.</p>
                </div>
            `;
            return;
        }

        // Get first active tariff for preview
        const activeTariff = tariffs.find(t => t.isActive) || tariffs[0];
        let sampleRate = 0.0144; // Default sample

        try {
            const rates = await apiService.getTariffRates(activeTariff.id);
            if (rates.length > 0) {
                sampleRate = rates[0].price;
            }
        } catch (error) {
            console.warn('[Reseller] Could not load sample rate');
        }

        container.innerHTML = `
            <div class="glass-card p-6 space-y-4">
                <!-- Admin Base Info -->
                <div class="glass-card p-4 space-y-2">
                    <p class="text-sm text-white/60">Admin Base Rates</p>
                    <div class="flex items-center justify-between">
                        <span class="text-white">Tariff:</span>
                        <span class="text-neon-cyan font-medium">${activeTariff.name}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-white">Status:</span>
                        <span class="text-success font-medium">Loaded</span>
                    </div>
                </div>
                
                <!-- Reseller Markup Input -->
                <div>
                    <label class="block text-sm text-white/60 mb-2">Your Markup Percentage (%)</label>
                    <input 
                        type="number" 
                        id="reseller-margin-input" 
                        class="w-full glass-card px-4 py-3 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-neon-violet transition-all" 
                        value="15" 
                        step="0.1" 
                        min="0" 
                        max="100"
                        placeholder="15.0"
                    />
                    <p class="text-xs text-white/40 mt-2">This markup applies to all your users</p>
                </div>
                
                <!-- Profit Preview -->
                <div class="glass-card p-4 space-y-3 bg-gradient-to-br from-neon-violet/10 to-neon-cyan/10">
                    <h4 class="text-white font-medium">Profit Preview (Example Rate)</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-white/60">Admin Price:</span>
                            <span class="text-white font-mono" id="preview-admin-price">$${sampleRate.toFixed(4)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-white/60">Your Markup:</span>
                            <span class="text-neon-violet font-bold" id="preview-markup">15%</span>
                        </div>
                        <div class="flex justify-between border-t border-white/10 pt-2">
                            <span class="text-white/60">Final User Price:</span>
                            <span class="text-neon-cyan font-mono font-bold" id="preview-final-price">$${(sampleRate * 1.15).toFixed(5)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-white/60">Your Profit/min:</span>
                            <span class="text-success font-bold" id="preview-profit">$${(sampleRate * 0.15).toFixed(5)}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Apply Button -->
                <button id="apply-markup-btn" class="w-full btn-neon">
                    Apply Markup to All Users
                </button>
            </div>
        `;

        // Add event listeners
        const marginInput = document.getElementById('reseller-margin-input');
        const applyBtn = document.getElementById('apply-markup-btn');

        if (marginInput) {
            marginInput.addEventListener('input', () => {
                updateProfitPreview(sampleRate, parseFloat(marginInput.value) || 0);
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', async () => {
                const margin = parseFloat(marginInput.value) || 0;
                await applyResellerMarkup(margin);
            });
        }

    } catch (error) {
        console.error('[Reseller] Failed to load pricing widget:', error);
        const container = document.getElementById('reseller-pricing-widget');
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
 * Update profit preview calculations
 */
function updateProfitPreview(adminPrice, margin) {
    const finalPrice = adminPrice * (1 + margin / 100);
    const profit = adminPrice * (margin / 100);

    document.getElementById('preview-markup').textContent = `${margin}%`;
    document.getElementById('preview-final-price').textContent = `$${finalPrice.toFixed(5)}`;
    document.getElementById('preview-profit').textContent = `$${profit.toFixed(5)}`;
}

/**
 * Apply reseller markup to all user rates
 */
async function applyResellerMarkup(margin) {
    try {
        toast.info(`Applying ${margin}% markup to all user rates...`);

        // Get all tariffs
        const tariffs = await apiService.getTariffs();
        const activeTariff = tariffs.find(t => t.isActive) || tariffs[0];

        if (!activeTariff) {
            toast.error('No active tariff found');
            return;
        }

        // Get all rates
        const rates = await apiService.getTariffRates(activeTariff.id);

        // Update each rate with reseller markup
        let successCount = 0;
        for (const rate of rates) {
            try {
                const newPrice = rate.price * (1 + margin / 100);
                await apiService.updateRate(rate.id, {
                    ...rate,
                    price: newPrice
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to update rate ${rate.id}:`, error);
            }
        }

        toast.success(`Applied markup to ${successCount} rates`);

    } catch (error) {
        console.error('[Reseller] Failed to apply markup:', error);
        toast.error('Failed to apply markup');
    }
}


