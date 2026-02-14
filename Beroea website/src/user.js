import './style.css';
import { createSidebar, initSidebar } from './components/dashboard/sidebar.js';
import { createHeader, initHeader } from './components/dashboard/header.js';
import { createStatCard, createDataTable, createBadge } from './components/dashboard/widgets.js';
import { apiService } from './services/apiService.js';
import { toast } from './components/toast.js';
import { API_CONFIG } from './config/api.config.js';
import { MOCK_DATA } from './services/mockData.js';



document.addEventListener('DOMContentLoaded', async () => {
    // DEVELOPER MODE: Bypass authentication when using mock data
    if (API_CONFIG.MOCK_MODE) {

        localStorage.setItem('token', MOCK_DATA.token);
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userId', '3');
        localStorage.setItem('userEmail', 'user@beroea.com');
        localStorage.setItem('userName', 'John Doe');
        sessionStorage.setItem('redirectCount', '0');
        addDeveloperModeBanner();
    } else {
        // PRODUCTION MODE: Normal authentication checks
        const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0');
        const lastRedirectTime = parseInt(sessionStorage.getItem('lastRedirectTime') || '0');
        const now = Date.now();

        if (redirectCount > 3 && (now - lastRedirectTime) < 5000) {
            console.error('[User] ⚠️ REDIRECT LOOP DETECTED - Clearing session');
            sessionStorage.clear();
            localStorage.clear();
            alert('Session error detected. Please log in again.');
            window.location.href = '/index.html';
            return;
        }

        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');

        if (!token) {
            console.warn('[User] No token found, redirecting to login');
            sessionStorage.setItem('redirectCount', '0');
            window.location.href = '/index.html';
            return;
        }

        if (userRole !== 'user') {
            console.warn('[User] User has different role, redirecting to appropriate dashboard');
            sessionStorage.setItem('redirectCount', String(redirectCount + 1));
            sessionStorage.setItem('lastRedirectTime', String(now));
            window.location.href = userRole === 'admin' ? '/admin.html' : '/reseller.html';
            return;
        }

        sessionStorage.setItem('redirectCount', '0');
    }

    // Initialize Sidebar
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.appendChild(createSidebar('user'));
        initSidebar();
    }

    // Initialize Header with real balance
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        try {
            const userId = localStorage.getItem('userId');
            const balanceData = await apiService.getAccountBalance(userId);
            headerContainer.appendChild(createHeader('user', balanceData.balance || 0));
        } catch (error) {
            console.error('[User] Failed to load balance:', error);
            headerContainer.appendChild(createHeader('user', 0));
        }
        initHeader();
    }

    // Load Dashboard Data
    await loadDashboardStats();
    await loadCallRecords();
    await loadSMSLogs();
    await loadTransactions();

    // Load Rate Search Widget
    await loadRateSearchWidget();

    // Copy to Clipboard functionality
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const textToCopy = this.getAttribute('data-copy');
            try {
                await navigator.clipboard.writeText(textToCopy);

                // Visual feedback
                const originalHTML = this.innerHTML;
                this.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        `;

                setTimeout(() => {
                    this.innerHTML = originalHTML;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
            }
        });
    });


});

/**
 * Load dashboard statistics from API
 */
async function loadDashboardStats() {
    try {

        const userId = localStorage.getItem('userId');

        // Load balance
        const balanceData = await apiService.getAccountBalance(userId);

        // Load call stats
        const calls = await apiService.getCallsByAccount(userId);
        const totalMinutes = calls.reduce((sum, call) => sum + (call.duration || 0), 0);

        // Load SMS count
        const smsMessages = await apiService.getSMSByAccount(userId);



        // Current Balance
        document.getElementById('stat-balance').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
            label: 'Current Balance',
            value: `$${(balanceData.balance || 0).toFixed(2)}`,
            color: 'cyan'
        });

        // Minutes Used
        document.getElementById('stat-minutes').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>',
            label: 'Minutes Used',
            value: totalMinutes.toLocaleString(),
            trend: 0,
            color: 'violet'
        });

        // SMS Sent
        document.getElementById('stat-sms').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>',
            label: 'SMS Sent',
            value: smsMessages.length.toLocaleString(),
            trend: 0,
            color: 'success'
        });

        // QoS Score (calculated from successful calls)
        const successfulCalls = calls.filter(c => c.status === 'completed' || c.status === 'success').length;
        const qosScore = calls.length > 0 ? ((successfulCalls / calls.length) * 100).toFixed(1) : 100;

        document.getElementById('stat-qos').innerHTML = createStatCard({
            icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>',
            label: 'QoS Score',
            value: `${qosScore}%`,
            trend: 0,
            color: 'warning'
        });

    } catch (error) {
        console.error('[User] Failed to load dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
    }
}

/**
 * Load call records (CDR) from API
 */
async function loadCallRecords() {
    try {

        const userId = localStorage.getItem('userId');
        const calls = await apiService.getCallsByAccount(userId);



        const rows = calls.slice(0, 10).map(call => [
            new Date(call.startTime).toLocaleString(),
            call.calleeNumber || call.destination || 'N/A',
            `${Math.floor((call.duration || 0) / 60)}:${String((call.duration || 0) % 60).padStart(2, '0')}`,
            `$${(call.cost || 0).toFixed(2)}`,
            createBadge(
                call.status === 'completed' || call.status === 'success' ? 'Completed' : 'Failed',
                call.status === 'completed' || call.status === 'success' ? 'success' : 'danger'
            )
        ]);

        document.getElementById('cdr-table').innerHTML = createDataTable({
            headers: ['Date/Time', 'Destination', 'Duration', 'Cost', 'Status'],
            rows: rows.length > 0 ? rows : [['No calls found', '', '', '', '']],
            actions: ['View Details']
        });

    } catch (error) {
        console.error('[User] Failed to load call records:', error);
        document.getElementById('cdr-table').innerHTML = createDataTable({
            headers: ['Date/Time', 'Destination', 'Duration', 'Cost', 'Status'],
            rows: [['Error loading calls', '', '', '', '']],
            actions: []
        });
    }
}

/**
 * Load SMS logs from API
 */
async function loadSMSLogs() {
    try {

        const userId = localStorage.getItem('userId');
        const smsMessages = await apiService.getSMSByAccount(userId);



        // SMS logs are displayed in a separate section if available
        // For now, we'll just log them

    } catch (error) {
        console.error('[User] Failed to load SMS logs:', error);
    }
}

/**
 * Load transactions/billing from API
 */
async function loadTransactions() {
    try {

        const transactions = await apiService.getTransactions();



        const rows = transactions.slice(0, 10).map(tx => [
            `INV-${tx.id}`,
            new Date(tx.date || tx.createdAt).toLocaleDateString(),
            tx.description || tx.type || 'Transaction',
            `$${Math.abs(tx.amount || 0).toFixed(2)}`,
            createBadge(tx.status || 'Completed', 'success')
        ]);

        document.getElementById('billing-table').innerHTML = createDataTable({
            headers: ['Invoice #', 'Date', 'Description', 'Amount', 'Status'],
            rows: rows.length > 0 ? rows : [['No transactions found', '', '', '', '']],
            actions: ['Download PDF']
        });

    } catch (error) {
        console.error('[User] Failed to load transactions:', error);
        document.getElementById('billing-table').innerHTML = createDataTable({
            headers: ['Invoice #', 'Date', 'Description', 'Amount', 'Status'],
            rows: [['Error loading transactions', '', '', '', '']],
            actions: []
        });
    }
}

/**
 * Load user rate search widget
 */
async function loadRateSearchWidget() {
    try {


        const container = document.getElementById('user-rate-search-widget');
        if (!container) return;

        container.innerHTML = `
            <div class="glass-card p-6 space-y-4">
                <h2 class="text-2xl font-heading text-white">🔍 Search Call Rates</h2>
                <p class="text-white/60">Find rates for any destination worldwide</p>
                
                <!-- Search Input -->
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        id="rate-search-input" 
                        placeholder="Search destination or country code (e.g., United States, +1)..."
                        class="flex-1 glass-card px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan transition-all"
                    />
                    <button id="rate-search-btn" class="btn-neon px-6">
                        Search
                    </button>
                </div>
                
                <!-- Results -->
                <div id="rate-search-results" class="hidden space-y-2">
                    <!-- Results will be inserted here -->
                </div>
                
                <!-- Cost Calculator -->
                <div class="glass-card p-4 space-y-3">
                    <h4 class="text-white font-medium">Estimate Call Cost</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs text-white/60 mb-1">Duration (minutes)</label>
                            <input 
                                type="number" 
                                id="call-duration" 
                                class="w-full glass-card px-3 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan" 
                                placeholder="10"
                                min="1"
                                value="10"
                            />
                        </div>
                        <div>
                            <label class="block text-xs text-white/60 mb-1">Estimated Cost</label>
                            <p class="text-2xl font-bold text-success" id="estimated-cost">$0.00</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const searchBtn = document.getElementById('rate-search-btn');
        const searchInput = document.getElementById('rate-search-input');
        const durationInput = document.getElementById('call-duration');

        if (searchBtn && searchInput) {
            const performSearch = async () => {
                const query = searchInput.value.trim();
                if (!query) {
                    toast.error('Please enter a destination or country code');
                    return;
                }
                await searchRates(query);
            };

            searchBtn.addEventListener('click', performSearch);
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }

        if (durationInput) {
            durationInput.addEventListener('input', () => {
                updateCostEstimate();
            });
        }

    } catch (error) {
        console.error('[User] Failed to load rate search widget:', error);
    }
}

/**
 * Search for rates by destination or prefix
 */
async function searchRates(query) {
    try {

        toast.info('Searching rates...');

        // Get all tariffs
        const tariffs = await apiService.getTariffs();
        const activeTariff = tariffs.find(t => t.isActive) || tariffs[0];

        if (!activeTariff) {
            toast.error('No rates available');
            return;
        }

        // Get all rates
        const rates = await apiService.getTariffRates(activeTariff.id);

        // Filter rates by query
        const queryLower = query.toLowerCase();
        const matchedRates = rates.filter(rate =>
            rate.destination?.toLowerCase().includes(queryLower) ||
            rate.prefix?.includes(query.replace('+', ''))
        );

        // Display results
        const resultsContainer = document.getElementById('rate-search-results');
        if (resultsContainer) {
            if (matchedRates.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="glass-card p-4 text-center">
                        <p class="text-white/60">No rates found for "${query}"</p>
                    </div>
                `;
                resultsContainer.classList.remove('hidden');
            } else {
                resultsContainer.innerHTML = `
                    <div class="glass-card p-4">
                        <h3 class="text-white font-bold mb-3">Found ${matchedRates.length} rate(s)</h3>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            ${matchedRates.slice(0, 10).map(rate => `
                                <div class="flex items-center justify-between p-3 glass-card hover:bg-white/5 transition-colors cursor-pointer" data-rate="${rate.price}">
                                    <div>
                                        <p class="text-white font-medium">${rate.destination}</p>
                                        <p class="text-xs text-white/60">+${rate.prefix}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-neon-cyan font-mono font-bold">$${rate.price.toFixed(4)}</p>
                                        <p class="text-xs text-white/60">per minute</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                resultsContainer.classList.remove('hidden');

                // Add click handlers to select rate
                resultsContainer.querySelectorAll('[data-rate]').forEach(el => {
                    el.addEventListener('click', () => {
                        const rate = parseFloat(el.getAttribute('data-rate'));
                        window.selectedRate = rate;
                        updateCostEstimate();
                        toast.success('Rate selected for cost calculation');
                    });
                });

                // Auto-select first rate
                if (matchedRates.length > 0) {
                    window.selectedRate = matchedRates[0].price;
                    updateCostEstimate();
                }

                toast.success(`Found ${matchedRates.length} rate(s)`);
            }
        }

    } catch (error) {
        console.error('[User] Failed to search rates:', error);
        toast.error('Failed to search rates');
    }
}

/**
 * Update cost estimate based on selected rate and duration
 */
function updateCostEstimate() {
    const duration = parseFloat(document.getElementById('call-duration')?.value) || 0;
    const rate = window.selectedRate || 0;
    const cost = duration * rate;

    const costDisplay = document.getElementById('estimated-cost');
    if (costDisplay) {
        costDisplay.textContent = `$${cost.toFixed(2)}`;
    }
}

/**
 * Add developer mode banner to dashboard
 */
function addDeveloperModeBanner() {
    const banner = document.createElement('div');
    banner.id = 'developer-mode-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: linear-gradient(90deg, #ff6b35 0%, #f7931e 100%);
        color: #000;
        text-align: center;
        padding: 8px 16px;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = '🔧 DEVELOPER MODE - Using Mock Data (No Backend Connection)';
    document.body.prepend(banner);
    document.body.style.paddingTop = '40px';
}
