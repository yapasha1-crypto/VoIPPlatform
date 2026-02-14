// Dashboard Header Component
export function createHeader(role = 'user', balance = 0) {
  const header = document.createElement('header');
  header.className = 'dashboard-header';

  header.innerHTML = `
    <!-- Mobile Menu Toggle -->
    <button id="mobile-menu-toggle" class="lg:hidden glass-card p-2 rounded-lg">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>

    <!-- Page Title (Desktop) -->
    <div class="hidden lg:block">
      <h1 class="text-2xl font-heading font-bold text-white">Dashboard</h1>
    </div>

    <!-- Right Section -->
    <div class="flex items-center space-x-4 ml-auto">
      <!-- Balance Widget -->
      <div class="glass-card px-4 py-2 rounded-lg flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div>
          <p class="text-xs text-white/40">Balance</p>
          <p class="text-sm font-bold text-gradient">$${balance.toFixed(2)}</p>
        </div>
      </div>

      <!-- Notifications -->
      <button class="relative glass-card p-2 rounded-lg hover:bg-white/10 transition-colors">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <span class="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
      </button>

      <!-- User Menu -->
      <div class="relative">
        <button id="user-menu-btn" class="flex items-center space-x-2 glass-card px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
          <div class="w-8 h-8 bg-gradient-to-br from-neon-violet to-neon-cyan rounded-full flex items-center justify-center text-sm font-bold">
            ${role.charAt(0).toUpperCase()}
          </div>
          <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        <!-- Dropdown Menu -->
        <div id="user-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 glass-card rounded-lg overflow-hidden">
          <a href="profile.html" class="block px-4 py-2 text-white/70 hover:bg-white/10 transition-colors">Profile</a>
          <a href="${role}-settings.html" class="block px-4 py-2 text-white/70 hover:bg-white/10 transition-colors">Settings</a>
          <a href="index.html" class="block px-4 py-2 text-white/70 hover:bg-white/10 transition-colors border-t border-white/10">Logout</a>
        </div>
      </div>
    </div>
  `;

  return header;
}

// Initialize header interactions
export function initHeader() {
  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('dashboard-sidebar');

  mobileToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('collapsed');
  });

  // User menu dropdown
  const userMenuBtn = document.getElementById('user-menu-btn');
  const userMenuDropdown = document.getElementById('user-menu-dropdown');

  userMenuBtn?.addEventListener('click', () => {
    userMenuDropdown?.classList.toggle('hidden');
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!userMenuBtn?.contains(e.target) && !userMenuDropdown?.contains(e.target)) {
      userMenuDropdown?.classList.add('hidden');
    }
  });

  // Logout functionality
  const logoutLinks = document.querySelectorAll('[href="index.html"]');
  logoutLinks.forEach(link => {
    if (link.textContent.toLowerCase().includes('logout')) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }
  });
}

// Logout handler
function handleLogout() {
  // Clear user session data
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('userCompany');
  localStorage.removeItem('userService');

  // Show toast notification
  import('../toast.js').then(module => {
    module.toast.success('Logged out successfully!');
  });

  // Redirect to home page
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}
