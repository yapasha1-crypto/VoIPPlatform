// Dashboard Sidebar Component
export function createSidebar(role = 'user', userData = {}) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar flex-shrink-0 w-64 h-full overflow-y-auto scrollbar-custom border-r border-white/10 bg-slate-900';
  sidebar.id = 'dashboard-sidebar';

  const displayName = userData.firstName || userData.username || `${role.charAt(0).toUpperCase() + role.slice(1)} User`;
  const displayEmail = userData.email || 'user@beroea.com';

  // ... (menuItems remain same) ...

  // (Keep lines 7-43 menuItems and icons as is - wait, I need to preserve them or just target the HTML generation part?
  // The tool replaces the chunk. I should probably target the function signature and the HTML generation separately or include the whole function start.)

  // Actually, let's just replace the signature and the HTML part.

  // Wait, replace_file_content replaces a CONTIGUOUS block.
  // The function signature is at line 2. The HTML generation is at line 45.
  // I should probably do two edits or one big one.
  // Let's do the signature first.


  const menuItems = {
    admin: [
      { icon: 'dashboard', label: 'Dashboard', href: 'admin.html' },
      { icon: 'users', label: 'Users & Resellers', href: 'admin-users.html' },
      { icon: 'server', label: 'System Health', href: 'admin-system.html' },
      { icon: 'ticket', label: 'Support Tickets', href: 'admin-tickets.html' },
      { icon: 'chart', label: 'Reports', href: 'admin-reports.html' },
      { icon: 'settings', label: 'Settings', href: 'admin-settings.html' },
    ],
    reseller: [
      { icon: 'dashboard', label: 'Dashboard', href: 'reseller.html' },
      { icon: 'users', label: 'Sub-Users', href: 'reseller-subusers.html' },
      { icon: 'credit', label: 'Credits', href: 'reseller-credits.html' },
      { icon: 'chart', label: 'Profit Reports', href: 'reseller-reports.html' },
      { icon: 'settings', label: 'Settings', href: 'reseller-settings.html' },
    ],
    user: [
      { icon: 'dashboard', label: 'Dashboard', href: 'user.html' },
      { icon: 'phone', label: 'Usage', href: 'user-usage.html' },
      { icon: 'billing', label: 'Billing', href: 'user-billing.html' },
      { icon: 'support', label: 'Support', href: 'user-support.html' },
      { icon: 'settings', label: 'Settings', href: 'user-settings.html' },
    ]
  };

  const icons = {
    dashboard: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>',
    users: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>',
    server: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path>',
    ticket: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>',
    chart: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>',
    settings: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>',
    phone: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>',
    billing: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>',
    support: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>',
    credit: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>',
  };

  sidebar.innerHTML = `
    <!-- Logo -->
    <div class="mb-8">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-lg flex items-center justify-center shadow-neon-cyan">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
        <span class="text-xl font-heading font-bold text-gradient">Beroea</span>
      </div>
      <p class="text-xs text-white/40 mt-2 ml-13">${role.charAt(0).toUpperCase() + role.slice(1)} Portal</p>
    </div>

    <!-- Navigation -->
    <nav class="space-y-1">
      ${menuItems[role].map(item => {
    // Dynamic Active State Calculation
    const currentPath = window.location.pathname.split('/').pop().split('?')[0] || 'index.html';
    // Check if item href matches current path 
    // OR if it's the dashboard (e.g. admin.html) and there is no specific path (rare in static)
    let isActive = item.href === currentPath;

    // Handle root/default cases or query params if needed
    if (!isActive && item.label === 'Dashboard') {
      // If we are on the dashboard page for this role
      if (currentPath === `${role}.html`) isActive = true;
    }

    return `
        <a href="${item.href}" class="sidebar-nav-item ${isActive ? 'active' : ''}" ${item.onclick ? `onclick="${item.onclick}"` : ''}>
          <svg class="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${icons[item.icon]}
          </svg>
          <span>${item.label}</span>
        </a>
      `}).join('')}
    </nav>

    <!-- User Profile -->
    <div class="mt-auto pt-6 border-t border-white/10">
      <div class="flex items-center space-x-3 p-3 glass-card rounded-lg">
        <div class="w-10 h-10 bg-gradient-to-br from-neon-violet to-neon-cyan rounded-full flex items-center justify-center text-sm font-bold">
          ${(userData.firstName || role).charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">${userData.firstName ? userData.firstName + (userData.lastName ? ' ' + userData.lastName : '') : (role.charAt(0).toUpperCase() + role.slice(1) + ' User')}</p>
          <p class="text-xs text-white/40 truncate">${userData.email || 'user@beroea.com'}</p>
        </div>
      </div>
    </div>

    <!-- Back to Website -->
    <div class="mt-4">
      <a href="index.html" class="sidebar-nav-item text-white/50 hover:text-white/70">
        <svg class="flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        <span class="text-sm">Back to Website</span>
      </a>
    </div>
  `;

  return sidebar;
}

// Initialize sidebar interactions
export function initSidebar() {
  const sidebar = document.getElementById('dashboard-sidebar');
  if (!sidebar) return;

  // Handle active state and coming soon features
  const navItems = sidebar.querySelectorAll('.sidebar-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // If it's a # link (coming soon feature)
      if (href && href.startsWith('#') && href !== '#') {
        e.preventDefault();

        // Get the feature name from the link text
        const featureName = this.textContent.trim();

        // Import and show coming soon overlay
        import('./comingSoon.js').then(module => {
          module.showComingSoon(featureName);
        });

        // Also show toast notification
        import('../toast.js').then(module => {
          module.toast.info('This feature is coming soon!');
        });

        // Update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
      } else if (!href || href === '#') {
        e.preventDefault();
      } else {
        // Real page navigation - update active state
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });
}
