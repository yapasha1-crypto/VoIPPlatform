// Quick script to set mock mode in all dashboards
// Run this in browser console to bypass auth

localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token');
localStorage.setItem('userRole', 'admin'); // Change to 'reseller' or 'user' as needed
localStorage.setItem('userId', '1');
localStorage.setItem('userEmail', 'admin@beroea.com');
localStorage.setItem('userName', 'Admin User');
sessionStorage.setItem('redirectCount', '0');

console.log('✅ Mock user data set! Reload the page.');
