/**
 * API CONNECTOR
 * Wires up the static HTML frontend to the .NET Backend API.
 */

const API_BASE_URL = 'http://localhost:5004';

document.addEventListener('DOMContentLoaded', () => {
    console.log('[Connector] Initializing...');

    // 1. LOGIN LOGIC (index.html)
    // Using event delegation because the modal might be injected dynamically
    document.body.addEventListener('submit', async (e) => {
        if (e.target.id === 'login-form') {
            e.preventDefault();
            await handleLogin(e.target);
        }
    });

    // 2. DASHBOARD LOGIC (admin.html)
    if (window.location.pathname.includes('admin.html')) {
        initDashboard();
    }

    // 3. LOGOUT LOGIC (Global)
    // Wait for dynamic header injection
    setTimeout(() => {
        const logoutLinks = document.querySelectorAll('a[href="index.html"]');
        logoutLinks.forEach(link => {
            if (link.textContent.toLowerCase().includes('logout')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleLogout();
                });
            }
        });
    }, 1000); // Delay to ensure Header is injected
});

// LOGIN HANDLER
async function handleLogin(form) {
    const emailInput = form.querySelector('#login-email');
    const passwordInput = form.querySelector('#login-password');
    const submitBtn = form.querySelector('button[type="submit"]');

    const originalText = submitBtn.innerText;
    submitBtn.innerText = 'Logging in...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: emailInput.value,
                password: passwordInput.value
            })
        });

        const rawData = await response.json();
        // Unwrap data if wrapped (Backend returns { success: true, data: { ... } })
        const data = rawData.data || rawData;

        if (response.ok && data.token) {
            console.log('[Connector] Login Successful');
            localStorage.setItem('token', data.token);
            localStorage.setItem('userRole', 'admin'); // Assume admin for now based on login
            window.location.href = 'admin.html';
        } else {
            console.warn('[Connector] Login Failed', rawData);
            alert(rawData.message || 'Invalid Credentials');
        }
    } catch (error) {
        console.error('[Connector] Login Error', error);
        alert('Connection Error. Check console.');
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

// DASHBOARD HANDLER
async function initDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('[Connector] No token found. Redirecting to login.');
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/Auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                handleLogout();
                return;
            }
            throw new Error('Failed to fetch user data');
        }

        const rawData = await response.json();
        const data = rawData.data || rawData;

        // UI UPDATE STRATEGY
        // Wait specifically for the elements to be rendered by main.js/header.js
        const checkElements = setInterval(() => {
            // Find Balance Element using XPath (Text Content Strategy)
            // Looking for <p>Balance</p> sibling <p>$0.00</p>
            const balanceLabel = document.evaluate("//p[contains(text(), 'Balance')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            if (balanceLabel) {
                const balanceValueElement = balanceLabel.nextElementSibling;
                if (balanceValueElement) {
                    const formattedBalance = `$${(data.balance || 0).toFixed(2)}`;
                    balanceValueElement.textContent = formattedBalance;
                    console.log(`[Connector] Balance updated to: ${formattedBalance}`);
                    clearInterval(checkElements); // Stop checking once found
                }
            }
        }, 500); // Check every 500ms

        // Clean up interval after 10 seconds to prevent infinite loop
        setTimeout(() => clearInterval(checkElements), 10000);

    } catch (error) {
        console.error('[Connector] Dashboard Error', error);
    }
}

// LOGOUT HANDLER
function handleLogout() {
    console.log('[Connector] Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
}
