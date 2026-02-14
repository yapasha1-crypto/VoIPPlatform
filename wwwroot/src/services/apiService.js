// Beroea VoIP Platform - API Service Layer
// Centralized API client with JWT authentication and error handling

import { API_CONFIG } from '../config/api.config.js?v=FIX_REL';
import { toast } from '../components/toast.js';
import { MOCK_DATA, getMockUserByRole, getMockCallsByAccount, getMockSMSByAccount, getMockTransactionsByAccount, getMockRatesByTariff } from './mockData.js';

class ApiService {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
    }

    // ==================== Helper Methods ====================

    /**
     * Get authentication header with JWT token
     */
    getAuthHeader() {
        const token = localStorage.getItem('token');
        if (!token) console.warn('[API] No token found in localStorage');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Make HTTP request with automatic error handling
     */
    async request(endpoint, options = {}) {
        // MOCK MODE: Return mock data instead of making real API calls
        if (API_CONFIG.MOCK_MODE) {

            return this.getMockResponse(endpoint, options);
        }

        const url = `${this.baseURL}${endpoint}`;

        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
                ...options.headers
            },
            ...options
        };

        // Add body if present
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        try {


            const response = await fetch(url, config);

            // Handle non-OK responses
            if (!response.ok) {
                await this.handleError(response);
                return null;
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            // Parse JSON response
            const data = await response.json();

            return data;

        } catch (error) {
            console.error(`[API] ❌ ${config.method} ${endpoint} - Error:`, error);

            // Network error
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                toast.error('Network error - Cannot connect to server');
            } else if (!error.handled) {
                toast.error('An unexpected error occurred');
            }

            throw error;
        }
    }

    /**
     * Handle API errors with ProblemDetails schema
     */
    async handleError(response) {
        let errorMessage = 'An error occurred';

        try {
            const problemDetails = await response.json();

            // Use ProblemDetails fields
            errorMessage = problemDetails.detail || problemDetails.title || errorMessage;

            // Handle specific status codes
            if (response.status === 401) {
                console.error('[API] 401 Detail:', await response.text().catch(() => 'No body'));
                errorMessage = 'Unauthorized - Please login again';
                // Clear token and redirect to home
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userId');

                toast.error('Session expired. Redirecting...');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 1500);
            } else if (response.status === 403) {
                errorMessage = 'Access denied - Insufficient permissions';
            } else if (response.status === 404) {
                errorMessage = problemDetails.detail || 'Resource not found';
            } else if (response.status === 400) {
                errorMessage = problemDetails.detail || 'Invalid request';
            }

        } catch (e) {
            // If response is not JSON, use status text
            errorMessage = response.statusText || errorMessage;
        }

        toast.error(errorMessage);

        const error = new Error(errorMessage);
        error.status = response.status;
        error.handled = true;
        throw error;
    }

    // ==================== Authentication ====================

    /**
     * Login user
     * @param {Object} credentials - { username, password }
     * @returns {Promise<Object>} - { token, ... }
     */
    async login(credentials) {
        return await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: credentials
        });
    }

    /**
     * Register new user
     * @param {Object} userData - { username, password, email, firstName, lastName, phoneNumber, countryCode }
     * @returns {Promise<Object>}
     */
    async register(userData) {
        return await this.request(API_CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: userData
        });
    }

    /**
     * Get current user info
     * @returns {Promise<Object>} - User object with role
     */
    async getCurrentUser() {
        return await this.request(API_CONFIG.ENDPOINTS.ME);
    }

    /**
     * Change password
     * @param {Object} passwordData - { oldPassword, newPassword }
     * @returns {Promise<Object>}
     */
    async changePassword(passwordData) {
        return await this.request(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
            method: 'POST',
            body: passwordData
        });
    }

    // ==================== Dashboard ====================

    /**
     * Get dashboard statistics
     * @returns {Promise<Object>} - Dashboard stats
     */
    async getDashboardStats() {
        return await this.request(API_CONFIG.ENDPOINTS.DASHBOARD_STATS);
    }

    // ==================== Accounts ====================

    /**
     * Get all accounts
     * @returns {Promise<Array>}
     */
    async getAccounts() {
        return await this.request(API_CONFIG.ENDPOINTS.ACCOUNTS);
    }

    /**
     * Get account by ID
     * @param {number} id
     * @returns {Promise<Object>}
     */
    async getAccountById(id) {
        const endpoint = API_CONFIG.ENDPOINTS.ACCOUNT_BY_ID.replace('{id}', id);
        return await this.request(endpoint);
    }

    /**
     * Get account balance
     * @param {number} id
     * @returns {Promise<Object>} - { balance: number }
     */
    async getAccountBalance(id) {
        const endpoint = API_CONFIG.ENDPOINTS.ACCOUNT_BALANCE.replace('{id}', id);
        return await this.request(endpoint);
    }

    // ==================== Calls (CDR) ====================

    /**
     * Get all calls
     * @returns {Promise<Array>}
     */
    async getAllCalls() {
        return await this.request(API_CONFIG.ENDPOINTS.CALLS);
    }

    /**
     * Get calls by account ID
     * @param {number} accountId
     * @returns {Promise<Array>}
     */
    async getCallsByAccount(accountId) {
        const endpoint = API_CONFIG.ENDPOINTS.CALLS_BY_ACCOUNT.replace('{accountId}', accountId);
        return await this.request(endpoint);
    }

    /**
     * Get call statistics summary
     * @returns {Promise<Object>}
     */
    async getCallStatsSummary() {
        return await this.request(API_CONFIG.ENDPOINTS.CALL_STATS_SUMMARY);
    }

    // ==================== SMS ====================

    /**
     * Get all SMS messages
     * @returns {Promise<Array>}
     */
    async getAllSMS() {
        return await this.request(API_CONFIG.ENDPOINTS.SMS);
    }

    /**
     * Get SMS by account ID
     * @param {number} accountId
     * @returns {Promise<Array>}
     */
    async getSMSByAccount(accountId) {
        const endpoint = API_CONFIG.ENDPOINTS.SMS_BY_ACCOUNT.replace('{accountId}', accountId);
        return await this.request(endpoint);
    }

    // ==================== Transactions ====================

    /**
     * Get all transactions
     * @returns {Promise<Array>}
     */
    async getTransactions() {
        return await this.request(API_CONFIG.ENDPOINTS.TRANSACTIONS);
    }

    /**
     * Get transaction by ID
     * @param {number} id
     * @returns {Promise<Object>}
     */
    async getTransactionById(id) {
        const endpoint = API_CONFIG.ENDPOINTS.TRANSACTION_BY_ID.replace('{id}', id);
        return await this.request(endpoint);
    }

    /**
     * Create new transaction
     * @param {Object} transactionData
     * @returns {Promise<Object>}
     */
    async createTransaction(transactionData) {
        return await this.request(API_CONFIG.ENDPOINTS.TRANSACTIONS, {
            method: 'POST',
            body: transactionData
        });
    }

    // ==================== Audit Logs ====================

    /**
     * Get audit logs with pagination
     * @param {Object} params - { page, pageSize, user, action }
     * @returns {Promise<Array>}
     */
    async getAuditLogs(params = {}) {
        const queryParams = new URLSearchParams({
            page: params.page || 1,
            pageSize: params.pageSize || 10,
            ...(params.user && { user: params.user }),
            ...(params.action && { action: params.action })
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.AUDIT_LOGS}?${queryParams}`);
    }

    /**
     * Export audit logs
     * @param {Object} params - { user, action }
     * @returns {Promise<Blob>}
     */
    async exportAuditLogs(params = {}) {
        const queryParams = new URLSearchParams({
            ...(params.user && { user: params.user }),
            ...(params.action && { action: params.action })
        });

        return await this.request(`${API_CONFIG.ENDPOINTS.AUDIT_LOGS_EXPORT}?${queryParams}`);
    }

    // ==================== Users ====================

    /**
     * Get all users
     * @returns {Promise<Array>}
     */
    async getUsers() {
        return await this.request(API_CONFIG.ENDPOINTS.USERS);
    }

    /**
     * Get user by ID
     * @param {number} id
     * @returns {Promise<Object>}
     */
    async getUserById(id) {
        const endpoint = API_CONFIG.ENDPOINTS.USER_BY_ID.replace('{id}', id);
        return await this.request(endpoint);
    }

    // ==================== Tariffs - Pricing Plans ====================

    /**
     * Get all tariffs
     * @returns {Promise<Array>}
     */
    async getTariffs() {
        return await this.request('/api/Rates/tariffs');
    }

    /**
     * Create new tariff
     * @param {Object} tariffData - { name, description, isActive }
     * @returns {Promise<Object>}
     */
    async createTariff(tariffData) {
        return await this.request('/api/Rates/tariffs', {
            method: 'POST',
            body: tariffData
        });
    }

    /**
     * Delete tariff
     * @param {number} id
     * @returns {Promise<void>}
     */
    async deleteTariff(id) {
        return await this.request(`/api/Rates/tariffs/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Rates - Individual Pricing Rates ====================

    /**
     * Get all rates for a tariff
     * @param {number} tariffId
     * @returns {Promise<Array>} - Array of Rate objects
     */
    async getTariffRates(tariffId) {
        return await this.request(`/api/Rates/tariffs/${tariffId}/rates`);
    }

    /**
     * Delete all rates for a tariff
     * @param {number} tariffId
     * @returns {Promise<void>}
     */
    async deleteTariffRates(tariffId) {
        return await this.request(`/api/Rates/tariffs/${tariffId}/rates`, {
            method: 'DELETE'
        });
    }

    /**
     * Create new rate
     * @param {Object} rateData - { tariffId, destination, prefix, price }
     * @returns {Promise<Object>}
     */
    async createRate(rateData) {
        return await this.request('/api/Rates/rates', {
            method: 'POST',
            body: rateData
        });
    }

    /**
     * Update existing rate
     * @param {number} id
     * @param {Object} rateData - { tariffId, destination, prefix, price }
     * @returns {Promise<void>}
     */
    async updateRate(id, rateData) {
        return await this.request(`/api/Rates/rates/${id}`, {
            method: 'PUT',
            body: rateData
        });
    }

    /**
     * Delete rate
     * @param {number} id
     * @returns {Promise<void>}
     */
    async deleteRate(id) {
        return await this.request(`/api/Rates/rates/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Import rates from CSV data
     * Parse CSV client-side and create rates with admin margin applied
     * @param {number} tariffId
     * @param {Array} csvData - Array of { destination, prefix, rate }
     * @param {number} adminMargin - Admin margin percentage (e.g., 20 for 20%)
     * @returns {Promise<Array>} - Array of created rates
     */
    async importRatesFromCSV(tariffId, csvData, adminMargin) {


        // Calculate prices with admin margin
        const rates = csvData.map(row => ({
            tariffId: tariffId,
            destination: row.destination,
            prefix: row.prefix,
            price: parseFloat(row.rate) * (1 + adminMargin / 100)
        }));

        // Create rates individually (bulk endpoint may not exist)
        const results = [];
        let successCount = 0;
        let failCount = 0;

        for (const rate of rates) {
            try {
                const result = await this.createRate(rate);
                results.push(result);
                successCount++;
            } catch (error) {
                console.error(`Failed to create rate for ${rate.destination}:`, error);
                failCount++;
            }
        }



        if (failCount > 0) {
            toast.warning(`Imported ${successCount} rates, ${failCount} failed`);
        } else {
            toast.success(`Successfully imported ${successCount} rates`);
        }

        return results;
    }

    /**
     * Parse CSV file or simulate Excel upload
     * @param {File} file - CSV or Excel file
     * @returns {Promise<Array>} - Array of { destination, prefix, rate }
     */
    async parseCSV(file) {
        // Check if file is Excel format
        const fileName = file.name.toLowerCase();
        const isExcel = fileName.endsWith('.xls') || fileName.endsWith('.xlsx');

        if (isExcel) {
            // EXCEL SIMULATION: Return mock data instead of parsing

            toast.success('Excel file accepted. Backend will process full dataset.');

            // Return mock rates data formatted as CSV parse result
            return new Promise((resolve) => {
                setTimeout(() => {
                    const mockRates = MOCK_DATA.rates.map(rate => ({
                        destination: rate.destination,
                        prefix: rate.prefix,
                        rate: rate.price.toString()
                    }));

                    resolve(mockRates);
                }, 500); // Simulate processing delay
            });
        }

        // CSV PARSING: Original logic
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());

                    // Skip header row
                    const dataLines = lines.slice(1);

                    const data = dataLines.map(line => {
                        const values = line.split(',').map(v => v.trim());
                        return {
                            destination: values[0],
                            prefix: values[1],
                            rate: values[2]
                        };
                    }).filter(row => row.destination && row.prefix && row.rate);


                    resolve(data);
                } catch (error) {
                    console.error('[API] CSV parse error:', error);
                    toast.error('Invalid CSV format');
                    reject(error);
                }
            };

            reader.onerror = () => {
                toast.error('Failed to read CSV file');
                reject(reader.error);
            };

            reader.readAsText(file);
        });
    }

    // ==================== MOCK MODE HANDLER ====================

    /**
     * Get mock response for any endpoint
     * Maps API endpoints to mock data from mockData.js
     */
    getMockResponse(endpoint, options = {}) {
        // Simulate network delay
        return new Promise((resolve) => {
            setTimeout(() => {
                const method = options.method || 'GET';
                const body = options.body;

                // Authentication endpoints
                if (endpoint === '/api/Auth/login') {
                    resolve({ token: MOCK_DATA.token });
                    return;
                }

                if (endpoint === '/api/Auth/register') {
                    resolve({ message: 'Registration successful' });
                    return;
                }

                if (endpoint === '/api/Auth/me') {
                    const role = localStorage.getItem('userRole') || 'admin';
                    resolve(getMockUserByRole(role));
                    return;
                }

                // Dashboard stats
                if (endpoint === '/api/Dashboard/stats') {
                    resolve(MOCK_DATA.dashboardStats);
                    return;
                }

                // Accounts/Users
                if (endpoint === '/api/Accounts' || endpoint === '/api/Users') {
                    resolve(MOCK_DATA.users);
                    return;
                }

                if (endpoint.match(/\/api\/(Accounts|Users)\/\d+/)) {
                    resolve(MOCK_DATA.users[0]);
                    return;
                }

                if (endpoint.match(/\/api\/Accounts\/\d+\/balance/)) {
                    resolve({ balance: MOCK_DATA.currentUser.accountBalance });
                    return;
                }

                // Calls
                if (endpoint === '/api/Calls') {
                    resolve(MOCK_DATA.calls);
                    return;
                }

                if (endpoint.match(/\/api\/Calls\/account\/\d+/)) {
                    const accountId = parseInt(endpoint.split('/').pop());
                    resolve(getMockCallsByAccount(accountId));
                    return;
                }

                if (endpoint === '/api/Calls/stats/summary') {
                    resolve({
                        totalCalls: MOCK_DATA.calls.length,
                        totalDuration: MOCK_DATA.calls.reduce((sum, c) => sum + c.durationSeconds, 0),
                        totalCost: MOCK_DATA.calls.reduce((sum, c) => sum + c.cost, 0)
                    });
                    return;
                }

                // SMS
                if (endpoint === '/api/SMS') {
                    resolve(MOCK_DATA.sms);
                    return;
                }

                if (endpoint.match(/\/api\/SMS\/account\/\d+/)) {
                    const accountId = parseInt(endpoint.split('/').pop());
                    resolve(getMockSMSByAccount(accountId));
                    return;
                }

                // Transactions
                if (endpoint === '/api/Transactions') {
                    if (method === 'POST') {
                        resolve({ id: MOCK_DATA.transactions.length + 1, ...body });
                        return;
                    }
                    resolve(MOCK_DATA.transactions);
                    return;
                }

                if (endpoint.match(/\/api\/Transactions\/\d+/)) {
                    resolve(MOCK_DATA.transactions[0]);
                    return;
                }

                // Audit Logs
                if (endpoint === '/api/AuditLogs') {
                    resolve(MOCK_DATA.auditLogs);
                    return;
                }

                // Tariffs
                if (endpoint === '/api/Rates/tariffs') {
                    if (method === 'POST') {
                        resolve({ id: MOCK_DATA.tariffs.length + 1, ...body });
                        return;
                    }
                    resolve(MOCK_DATA.tariffs);
                    return;
                }

                if (endpoint.match(/\/api\/Rates\/tariffs\/\d+$/)) {
                    if (method === 'DELETE') {
                        resolve({ message: 'Tariff deleted' });
                        return;
                    }
                    resolve(MOCK_DATA.tariffs[0]);
                    return;
                }

                // Rates
                if (endpoint.match(/\/api\/Rates\/tariffs\/\d+\/rates/)) {
                    const tariffId = parseInt(endpoint.split('/')[4]);
                    resolve(getMockRatesByTariff(tariffId));
                    return;
                }

                if (endpoint === '/api/Rates/rates') {
                    if (method === 'POST') {
                        resolve({ id: MOCK_DATA.rates.length + 1, ...body });
                        return;
                    }
                    resolve(MOCK_DATA.rates);
                    return;
                }

                if (endpoint.match(/\/api\/Rates\/rates\/\d+/)) {
                    if (method === 'PUT') {
                        resolve({ ...MOCK_DATA.rates[0], ...body });
                        return;
                    }
                    if (method === 'DELETE') {
                        resolve({ message: 'Rate deleted' });
                        return;
                    }
                    resolve(MOCK_DATA.rates[0]);
                    return;
                }

                // Default fallback
                console.warn(`[MOCK] No mock data for endpoint: ${endpoint}`);
                resolve({ message: 'Mock data not implemented for this endpoint' });

            }, 300); // 300ms simulated delay
        });
    }
}

// Export singleton instance
export const apiService = new ApiService();

