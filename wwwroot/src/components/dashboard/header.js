// Dashboard Header Component
export function createHeader(role = 'admin', balance = 0) {
  const header = document.createElement('header');
  header.className = 'dashboard-header';

  const userName = localStorage.getItem('userName') || 'User';
  const firstName = userName.split(' ')[0];

  header.innerHTML = `
    <!-- Mobile Menu Toggle -->
    <button id="mobile-menu-toggle" class="lg:hidden glass-card p-2 rounded-lg">
      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    </button>

    <!-- Page Title (Desktop) -->
    <div class="hidden lg:block">
    <div class="flex items-center space-x-4">
      <button id="mobile-menu-toggle" class="lg:hidden text-white/70 hover:text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
      </button>
      <div class="hidden md:block">
        <h2 class="text-xl font-bold text-white">
          <span class="text-white/60">Welcome back,</span> 
          <span class="text-gradient">${firstName}</span>
        </h2>
      </div>
    </div>

    <div class="flex items-center space-x-3 sm:space-x-4">
      <!-- Balance Widget -->
      <div class="hidden sm:flex items-center px-3 py-1.5 glass-card rounded-lg border border-neon-cyan/20 bg-neon-cyan/5">
        <span class="text-xs text-white/60 mr-2">Balance:</span>
        <span class="text-neon-cyan font-mono font-bold">$${balance.toFixed(2)}</span>
      </div>

      <!-- Notifications -->
      <button class="relative p-2 text-white/70 hover:text-white transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></span>
      </button>

      <!-- Profile Dropdown -->
      <div class="relative">
        <button id="admin-menu-btn" class="flex items-center space-x-2 glass-card px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
          <div class="w-8 h-8 bg-gradient-to-br from-neon-violet to-neon-cyan rounded-full flex items-center justify-center text-sm font-bold">
            ${firstName.charAt(0)}
          </div>
          <div class="hidden md:block text-left">
            <p class="text-sm font-medium leading-none">${firstName}</p>
            <p class="text-xs text-white/60 leading-none mt-1.5 capitalize">${role}</p>
          </div>
          <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
      <!-- Dropdown Menu -->
        <div id="admin-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 rounded-lg overflow-hidden z-50 border border-white/10 shadow-xl" style="background-color: #4565bc;">
          <a href="${role}-profile.html" class="block px-4 py-2 text-white/70 hover:bg-white/10 transition-colors">Profile</a>
          <a href="${role}-settings.html" class="block px-4 py-2 text-white/70 hover:bg-white/10 transition-colors">Settings</a>
          <a href="index.html" class="block px-4 py-2 text-white/70 hover:bg-white/10 transition-colors border-t border-white/10">Logout</a>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners directly to the elements
  const btn = header.querySelector('#admin-menu-btn');
  const dropdown = header.querySelector('#admin-menu-dropdown');

  if (btn && dropdown) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent bubbling to document which might close it
      dropdown.classList.toggle('hidden');
    });

    // Close on click outside (this still needs document level, but we can rely on initHeader for that, or add self-contained logic)
    // For now, simple toggle is good. initHeader handles the 'close on outside click'.
  }

  return header;
}

// Initialize header interactions
export function initHeader() {
  // Mobile menu toggle
  document.addEventListener('click', (e) => {
    const mobileToggle = e.target.closest('#mobile-menu-toggle');
    if (mobileToggle) {
      const sidebar = document.getElementById('dashboard-sidebar');
      sidebar?.classList.toggle('collapsed');
      return;
    }

    // Admin/Profile menu dropdown toggle
    const adminMenuBtn = e.target.closest('#admin-menu-btn');
    if (adminMenuBtn) {
      const dropdown = document.getElementById('admin-menu-dropdown');
      dropdown?.classList.toggle('hidden');
      return;
    }

    // Close functionality - click outside
    const dropdown = document.getElementById('admin-menu-dropdown');
    const menuBtn = document.getElementById('admin-menu-btn');

    if (dropdown && !dropdown.classList.contains('hidden')) {
      // If we clicked outside both the button and the dropdown
      if (!e.target.closest('#admin-menu-btn') && !e.target.closest('#admin-menu-dropdown')) {
        dropdown.classList.add('hidden');
      }
    }
  });

  // Logout functionality
  // Use delegation for logout links as they might be dynamically added
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[href="index.html"]');
    if (link && link.textContent.toLowerCase().includes('logout')) {
      e.preventDefault();
      handleLogout();
    }
  });
}

// Logout handler
// Logout handler
function handleLogout() {
  // Clear all session and local storage to support all roles
  sessionStorage.clear();
  localStorage.clear();

  // Show toast notification
  import('../toast.js').then(module => {
    module.toast.success('Logged out successfully!');
  });

  // Redirect to home page
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}
