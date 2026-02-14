// Beroea VoIP Platform - Mock Data Service
// Swagger-aligned mock data for static skeleton mode

/**
 * Mock data matching swagger.json schemas
 * All data structures follow the exact API response formats
 */

export const MOCK_DATA = {
    // ==================== Authentication ====================

    /**
     * Mock JWT token
     */
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token',

    /**
     * Current user - matches swagger.json Account schema
     */
    currentUser: {
        id: 1,
        username: 'admin@beroea.com',
        email: 'admin@beroea.com',
        role: 'admin', // Can be: admin, reseller, user
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '+14155551234',
        countryCode: '+1',
        accountBalance: 1250.75,
        isActive: true,
        createdAt: '2026-01-15T10:00:00Z'
    },

    // ==================== Dashboard Stats ====================

    /**
     * Dashboard statistics - matches DashboardStatsDto
     */
    dashboardStats: {
        totalRevenue: 125430.50,
        activeUsers: 1247,
        totalCalls: 45632,
        totalSMS: 12847,
        avgCallDuration: 245,
        systemHealth: {
            cpu: 45,
            memory: 62,
            storage: 38
        }
    },

    // ==================== Accounts/Users ====================

    /**
     * User accounts - matches Account schema
     */
    users: [
        {
            id: 1,
            username: 'admin@beroea.com',
            email: 'admin@beroea.com',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            phoneNumber: '+14155551234',
            accountBalance: 1250.75,
            isActive: true,
            createdAt: '2026-01-15T10:00:00Z'
        },
        {
            id: 2,
            username: 'reseller@beroea.com',
            email: 'reseller@beroea.com',
            role: 'reseller',
            firstName: 'Reseller',
            lastName: 'Partner',
            phoneNumber: '+14155552345',
            accountBalance: 5420.30,
            isActive: true,
            createdAt: '2026-01-16T11:30:00Z'
        },
        {
            id: 3,
            username: 'user@beroea.com',
            email: 'user@beroea.com',
            role: 'user',
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+14155553456',
            accountBalance: 87.50,
            isActive: true,
            createdAt: '2026-01-20T14:15:00Z'
        }
    ],

    // ==================== Calls (CDR) ====================

    /**
     * Call records - matches Call schema
     */
    calls: [
        {
            id: 1,
            accountId: 1,
            callerNumber: '+14155551234',
            destinationNumber: '+442071234567',
            durationSeconds: 245,
            cost: 3.52,
            timestamp: '2026-01-29T10:30:00Z',
            status: 'completed',
            direction: 'outbound'
        },
        {
            id: 2,
            accountId: 1,
            callerNumber: '+14155551234',
            destinationNumber: '+33142345678',
            durationSeconds: 180,
            cost: 2.88,
            timestamp: '2026-01-29T11:15:00Z',
            status: 'completed',
            direction: 'outbound'
        },
        {
            id: 3,
            accountId: 1,
            callerNumber: '+14155551234',
            destinationNumber: '+8613912345678',
            durationSeconds: 420,
            cost: 6.04,
            timestamp: '2026-01-29T12:45:00Z',
            status: 'completed',
            direction: 'outbound'
        },
        {
            id: 4,
            accountId: 1,
            callerNumber: '+14155551234',
            destinationNumber: '+12125551234',
            durationSeconds: 95,
            cost: 1.37,
            timestamp: '2026-01-29T14:20:00Z',
            status: 'completed',
            direction: 'outbound'
        },
        {
            id: 5,
            accountId: 1,
            callerNumber: '+14155551234',
            destinationNumber: '+61298765432',
            durationSeconds: 310,
            cost: 4.46,
            timestamp: '2026-01-29T16:00:00Z',
            status: 'completed',
            direction: 'outbound'
        }
    ],

    // ==================== SMS ====================

    /**
     * SMS messages - matches SMS schema
     */
    sms: [
        {
            id: 1,
            accountId: 1,
            sender: '+14155551234',
            recipient: '+442071234567',
            message: 'Hello from Beroea VoIP!',
            timestamp: '2026-01-29T10:00:00Z',
            status: 'delivered',
            cost: 0.05
        },
        {
            id: 2,
            accountId: 1,
            sender: '+14155551234',
            recipient: '+33142345678',
            message: 'Test message',
            timestamp: '2026-01-29T11:30:00Z',
            status: 'delivered',
            cost: 0.05
        },
        {
            id: 3,
            accountId: 1,
            sender: '+14155551234',
            recipient: '+8613912345678',
            message: 'International SMS test',
            timestamp: '2026-01-29T13:15:00Z',
            status: 'delivered',
            cost: 0.08
        }
    ],

    // ==================== Transactions ====================

    /**
     * Billing transactions - matches Transaction schema
     */
    transactions: [
        {
            id: 1,
            accountId: 1,
            amount: 100.00,
            type: 'credit',
            description: 'Account top-up',
            timestamp: '2026-01-25T09:00:00Z',
            status: 'completed'
        },
        {
            id: 2,
            accountId: 1,
            amount: -3.52,
            type: 'debit',
            description: 'Call to +442071234567',
            timestamp: '2026-01-29T10:30:00Z',
            status: 'completed'
        },
        {
            id: 3,
            accountId: 1,
            amount: -2.88,
            type: 'debit',
            description: 'Call to +33142345678',
            timestamp: '2026-01-29T11:15:00Z',
            status: 'completed'
        },
        {
            id: 4,
            accountId: 1,
            amount: 50.00,
            type: 'credit',
            description: 'Account top-up',
            timestamp: '2026-01-28T14:30:00Z',
            status: 'completed'
        }
    ],

    // ==================== Tariffs & Rates ====================

    /**
     * Tariff plans - matches Tariff schema
     */
    tariffs: [
        {
            id: 1,
            name: 'Global Standard',
            description: 'Standard rates for worldwide calling',
            isActive: true,
            createdAt: '2026-01-10T00:00:00Z'
        },
        {
            id: 2,
            name: 'Premium Plus',
            description: 'Premium rates with better quality',
            isActive: false,
            createdAt: '2026-01-12T00:00:00Z'
        }
    ],

    /**
     * Call rates - matches Rate schema
     */
    rates: [
        // North America
        { id: 1, tariffId: 1, destination: 'United States', prefix: '1', price: 0.0144 },
        { id: 2, tariffId: 1, destination: 'Canada', prefix: '1', price: 0.0144 },
        { id: 3, tariffId: 1, destination: 'Mexico', prefix: '52', price: 0.0160 },
        // Europe
        { id: 4, tariffId: 1, destination: 'United Kingdom', prefix: '44', price: 0.0160 },
        { id: 5, tariffId: 1, destination: 'France', prefix: '33', price: 0.0160 },
        { id: 6, tariffId: 1, destination: 'Germany', prefix: '49', price: 0.0160 },
        { id: 7, tariffId: 1, destination: 'Spain', prefix: '34', price: 0.0160 },
        { id: 8, tariffId: 1, destination: 'Italy', prefix: '39', price: 0.0160 },
        { id: 9, tariffId: 1, destination: 'Netherlands', prefix: '31', price: 0.0160 },
        { id: 10, tariffId: 1, destination: 'Belgium', prefix: '32', price: 0.0160 },
        { id: 11, tariffId: 1, destination: 'Switzerland', prefix: '41', price: 0.0176 },
        { id: 12, tariffId: 1, destination: 'Austria', prefix: '43', price: 0.0160 },
        { id: 13, tariffId: 1, destination: 'Sweden', prefix: '46', price: 0.0160 },
        { id: 14, tariffId: 1, destination: 'Norway', prefix: '47', price: 0.0176 },
        { id: 15, tariffId: 1, destination: 'Denmark', prefix: '45', price: 0.0160 },
        { id: 16, tariffId: 1, destination: 'Finland', prefix: '358', price: 0.0160 },
        { id: 17, tariffId: 1, destination: 'Poland', prefix: '48', price: 0.0144 },
        { id: 18, tariffId: 1, destination: 'Czech Republic', prefix: '420', price: 0.0144 },
        { id: 19, tariffId: 1, destination: 'Portugal', prefix: '351', price: 0.0160 },
        { id: 20, tariffId: 1, destination: 'Greece', prefix: '30', price: 0.0176 },
        // Asia
        { id: 21, tariffId: 1, destination: 'China', prefix: '86', price: 0.0144 },
        { id: 22, tariffId: 1, destination: 'Japan', prefix: '81', price: 0.0192 },
        { id: 23, tariffId: 1, destination: 'India', prefix: '91', price: 0.0128 },
        { id: 24, tariffId: 1, destination: 'South Korea', prefix: '82', price: 0.0176 },
        { id: 25, tariffId: 1, destination: 'Singapore', prefix: '65', price: 0.0144 },
        { id: 26, tariffId: 1, destination: 'Hong Kong', prefix: '852', price: 0.0144 },
        { id: 27, tariffId: 1, destination: 'Taiwan', prefix: '886', price: 0.0160 },
        { id: 28, tariffId: 1, destination: 'Thailand', prefix: '66', price: 0.0144 },
        { id: 29, tariffId: 1, destination: 'Malaysia', prefix: '60', price: 0.0144 },
        { id: 30, tariffId: 1, destination: 'Indonesia', prefix: '62', price: 0.0160 },
        { id: 31, tariffId: 1, destination: 'Philippines', prefix: '63', price: 0.0160 },
        { id: 32, tariffId: 1, destination: 'Vietnam', prefix: '84', price: 0.0144 },
        // Oceania
        { id: 33, tariffId: 1, destination: 'Australia', prefix: '61', price: 0.0144 },
        { id: 34, tariffId: 1, destination: 'New Zealand', prefix: '64', price: 0.0176 },
        // Middle East
        { id: 35, tariffId: 1, destination: 'United Arab Emirates', prefix: '971', price: 0.0192 },
        { id: 36, tariffId: 1, destination: 'Saudi Arabia', prefix: '966', price: 0.0208 },
        { id: 37, tariffId: 1, destination: 'Israel', prefix: '972', price: 0.0192 },
        { id: 38, tariffId: 1, destination: 'Turkey', prefix: '90', price: 0.0176 },
        { id: 39, tariffId: 1, destination: 'Qatar', prefix: '974', price: 0.0208 },
        { id: 40, tariffId: 1, destination: 'Kuwait', prefix: '965', price: 0.0208 },
        // Africa
        { id: 41, tariffId: 1, destination: 'South Africa', prefix: '27', price: 0.0176 },
        { id: 42, tariffId: 1, destination: 'Egypt', prefix: '20', price: 0.0192 },
        { id: 43, tariffId: 1, destination: 'Nigeria', prefix: '234', price: 0.0208 },
        { id: 44, tariffId: 1, destination: 'Kenya', prefix: '254', price: 0.0192 },
        // South America
        { id: 45, tariffId: 1, destination: 'Brazil', prefix: '55', price: 0.0176 },
        { id: 46, tariffId: 1, destination: 'Argentina', prefix: '54', price: 0.0176 },
        { id: 47, tariffId: 1, destination: 'Chile', prefix: '56', price: 0.0176 },
        { id: 48, tariffId: 1, destination: 'Colombia', prefix: '57', price: 0.0176 },
        { id: 49, tariffId: 1, destination: 'Peru', prefix: '51', price: 0.0192 },
        { id: 50, tariffId: 1, destination: 'Venezuela', prefix: '58', price: 0.0208 }
    ],

    // ==================== Audit Logs ====================

    /**
     * Audit logs - matches AuditLog schema
     */
    auditLogs: [
        {
            id: 1,
            userId: 1,
            userName: 'admin@beroea.com',
            action: 'login',
            entity: 'auth',
            entityId: null,
            status: 'success',
            timestamp: '2026-01-29T09:00:00Z',
            ipAddress: '192.168.1.100'
        },
        {
            id: 2,
            userId: 1,
            userName: 'admin@beroea.com',
            action: 'create',
            entity: 'user',
            entityId: 3,
            status: 'success',
            timestamp: '2026-01-29T10:15:00Z',
            ipAddress: '192.168.1.100'
        },
        {
            id: 3,
            userId: 2,
            userName: 'reseller@beroea.com',
            action: 'update',
            entity: 'rate',
            entityId: 5,
            status: 'success',
            timestamp: '2026-01-29T11:30:00Z',
            ipAddress: '192.168.1.101'
        },
        {
            id: 4,
            userId: 1,
            userName: 'admin@beroea.com',
            action: 'delete',
            entity: 'tariff',
            entityId: 2,
            status: 'success',
            timestamp: '2026-01-29T14:00:00Z',
            ipAddress: '192.168.1.100'
        }
    ],

    // ==================== Support Tickets ====================

    /**
     * Support tickets - for admin and user support pages
     */
    tickets: [
        {
            id: 1,
            userId: 3,
            userName: 'user@beroea.com',
            subject: 'Cannot make international calls',
            message: 'I am unable to make calls to international numbers. Please help.',
            priority: 'high',
            status: 'open',
            createdAt: '2026-01-28T10:00:00Z',
            updatedAt: '2026-01-28T10:00:00Z'
        },
        {
            id: 2,
            userId: 3,
            userName: 'user@beroea.com',
            subject: 'Billing question',
            message: 'I have a question about my last invoice.',
            priority: 'medium',
            status: 'in-progress',
            createdAt: '2026-01-27T14:30:00Z',
            updatedAt: '2026-01-28T09:15:00Z'
        },
        {
            id: 3,
            userId: 2,
            userName: 'reseller@beroea.com',
            subject: 'Rate update request',
            message: 'Please update rates for European destinations.',
            priority: 'low',
            status: 'closed',
            createdAt: '2026-01-25T11:00:00Z',
            updatedAt: '2026-01-26T16:45:00Z'
        }
    ],

    // ==================== System Health ====================

    /**
     * System health metrics - for admin system health page
     */
    systemHealth: {
        cpu: 45,
        memory: 62,
        storage: 38,
        activeConnections: 1247,
        uptime: 2592000, // 30 days in seconds
        lastUpdated: '2026-01-29T20:00:00Z'
    },

    // ==================== Invoices ====================

    /**
     * Invoices - for user billing page
     */
    invoices: [
        {
            id: 1,
            accountId: 3,
            invoiceNumber: 'INV-2026-001',
            amount: 50.00,
            status: 'paid',
            date: '2026-01-01T00:00:00Z',
            dueDate: '2026-01-15T00:00:00Z',
            paidDate: '2026-01-10T00:00:00Z'
        },
        {
            id: 2,
            accountId: 3,
            invoiceNumber: 'INV-2026-002',
            amount: 75.50,
            status: 'paid',
            date: '2026-02-01T00:00:00Z',
            dueDate: '2026-02-15T00:00:00Z',
            paidDate: '2026-02-12T00:00:00Z'
        },
        {
            id: 3,
            accountId: 3,
            invoiceNumber: 'INV-2026-003',
            amount: 62.25,
            status: 'pending',
            date: '2026-03-01T00:00:00Z',
            dueDate: '2026-03-15T00:00:00Z',
            paidDate: null
        }
    ],

    // ==================== Sub-Users ====================

    /**
     * Sub-users - for reseller sub-user management
     */
    subUsers: [
        {
            id: 10,
            parentId: 2, // Reseller ID
            username: 'subuser1@beroea.com',
            email: 'subuser1@beroea.com',
            role: 'user',
            firstName: 'Sub',
            lastName: 'User One',
            phoneNumber: '+14155554567',
            accountBalance: 25.00,
            isActive: true,
            createdAt: '2026-01-22T10:00:00Z'
        },
        {
            id: 11,
            parentId: 2,
            username: 'subuser2@beroea.com',
            email: 'subuser2@beroea.com',
            role: 'user',
            firstName: 'Sub',
            lastName: 'User Two',
            phoneNumber: '+14155555678',
            accountBalance: 42.50,
            isActive: true,
            createdAt: '2026-01-23T11:30:00Z'
        }
    ]
};

/**
 * Helper function to get mock user by role
 */
export function getMockUserByRole(role) {
    return MOCK_DATA.users.find(u => u.role === role) || MOCK_DATA.users[0];
}

/**
 * Helper function to get mock calls by account
 */
export function getMockCallsByAccount(accountId) {
    return MOCK_DATA.calls.filter(c => c.accountId === accountId);
}

/**
 * Helper function to get mock SMS by account
 */
export function getMockSMSByAccount(accountId) {
    return MOCK_DATA.sms.filter(s => s.accountId === accountId);
}

/**
 * Helper function to get mock transactions by account
 */
export function getMockTransactionsByAccount(accountId) {
    return MOCK_DATA.transactions.filter(t => t.accountId === accountId);
}

/**
 * Helper function to get mock rates by tariff
 */
export function getMockRatesByTariff(tariffId) {
    return MOCK_DATA.rates.filter(r => r.tariffId === tariffId);
}
