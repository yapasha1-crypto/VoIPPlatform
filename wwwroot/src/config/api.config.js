export const API_CONFIG = {
    // DEVELOPER MODE: Set to true to use mock data instead of real API
    MOCK_MODE: false,

    // Use current origin since API serves frontend (fixes localhost vs 127.0.0.1 issues)
    BASE_URL: 'http://localhost:5004',
    ENDPOINTS: {
        // Auth
        LOGIN: '/api/Auth/login',
        REGISTER: '/api/Auth/register',
        ME: '/api/Auth/me',
        CHANGE_PASSWORD: '/api/Auth/change-password',

        // Dashboard
        DASHBOARD_STATS: '/api/Dashboard/stats',

        // Accounts
        ACCOUNTS: '/api/Accounts',
        ACCOUNT_BY_ID: '/api/Accounts/{id}',
        ACCOUNT_BALANCE: '/api/Accounts/{id}/balance',

        // Calls
        CALLS: '/api/Calls',
        CALLS_BY_ACCOUNT: '/api/Calls/account/{accountId}',
        CALL_STATS_SUMMARY: '/api/Calls/stats/summary',

        // SMS
        SMS: '/api/SMS',
        SMS_BY_ACCOUNT: '/api/SMS/account/{accountId}',

        // Transactions
        TRANSACTIONS: '/api/Transactions',
        TRANSACTION_BY_ID: '/api/Transactions/{id}',

        // Audit Logs
        AUDIT_LOGS: '/api/AuditLogs',
        AUDIT_LOGS_EXPORT: '/api/AuditLogs/export',

        // Users
        USERS: '/api/Users',
        USER_BY_ID: '/api/Users/{id}'
    }
};
