// Header Component - Modular and reusable
export function createHeader() {
  const header = document.createElement('header');
  header.className = 'fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10';

  // Check auth state
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'User';
  const firstName = userName.split(' ')[0];

  // Determine right-side content based on auth state
  let authContent = '';

  if (token && userRole) {
    // Logged In - Show Avatar & Dropdown
    const roleInitial = (userRole.charAt(0) || 'U').toUpperCase();
    // Background color #4565bc as requested
    const dropdownBgStyle = 'style="background-color: #4565bc;"';

    authContent = `
          <!-- Profile Dropdown -->
          <div class="relative group">
            <button id="public-profile-btn" class="flex items-center space-x-2 glass-card px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
              <div class="w-8 h-8 bg-gradient-to-br from-neon-violet to-neon-cyan rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-white/10">
                ${firstName.charAt(0).toUpperCase()}
              </div>
              <div class="hidden md:block text-left">
                 <span class="text-sm font-medium text-white">${firstName}</span>
              </div>
              <svg class="w-4 h-4 text-white/60 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            <!-- Dropdown Menu -->
            <div id="admin-menu-dropdown" class="absolute right-0 mt-2 w-48 rounded-lg overflow-hidden z-50 shadow-xl border border-white/10" ${dropdownBgStyle}>
              <div class="p-3 border-b border-white/10">
                <p class="text-sm font-bold text-white">${firstName}</p>
                <p class="text-xs text-white/60 capitalize">${userRole}</p>
              </div>
              <a href="${userRole === 'admin' ? 'admin.html' : userRole === 'reseller' ? 'reseller.html' : 'user.html'}" class="block px-4 py-2 text-white/90 hover:bg-white/10 transition-colors flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                Dashboard
              </a>
              <a href="${userRole}-profile.html" class="block px-4 py-2 text-white/90 hover:bg-white/10 transition-colors flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                Profile
              </a>
              <a href="${userRole}-settings.html" class="block px-4 py-2 text-white/90 hover:bg-white/10 transition-colors flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                Settings
              </a>
              <div class="border-t border-white/10 my-1"></div>
              <a href="#" id="logout-btn" class="block px-4 py-2 text-red-400 hover:bg-white/10 transition-colors flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Logout
              </a>
            </div>
          </div>
        `;
  } else {
    // Logged Out - Show Login Button
    authContent = `
          <!-- Portal Login Button -->
          <a href="#" class="btn-neon hidden md:inline-block relative overflow-hidden group">
            <span class="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            <span class="relative">Portal Login</span>
          </a>
        `;
  }

  header.innerHTML = `
    <nav class="section-container !py-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <a href="index.html" class="flex items-center space-x-3 group">
          <div class="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-lg flex items-center justify-center shadow-neon-cyan group-hover:shadow-neon-violet transition-all duration-300">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <span class="text-2xl font-heading font-bold text-gradient">Beroea</span>
        </a>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center space-x-8">
          <a href="index.html" class="text-white/80 hover:text-white transition-colors duration-200 border-b-2 border-transparent hover:border-neon-cyan py-1">Home</a>
          <a href="features.html" class="text-white/80 hover:text-white transition-colors duration-200 border-b-2 border-transparent hover:border-neon-cyan py-1">Features</a>
          <a href="pricing.html" class="text-white/80 hover:text-white transition-colors duration-200 border-b-2 border-transparent hover:border-neon-cyan py-1">Pricing</a>
          <a href="support.html" class="text-white/80 hover:text-white transition-colors duration-200 border-b-2 border-transparent hover:border-neon-cyan py-1">Support</a>
        </div>

        <!-- Right Section -->
        <div class="flex items-center space-x-4">
          <!-- Global Search -->
          <button id="search-btn" class="hidden md:flex items-center space-x-2 glass-card px-4 py-2 rounded-lg hover:bg-white/10 transition-all duration-200">
            <svg class="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <span class="text-white/60 text-sm">Search</span>
          </button>

          <!-- Language Switcher -->
          <div class="relative">
            <button id="lang-btn" class="glass-card px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 flex items-center space-x-2">
              <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
              </svg>
              <span class="text-white/80 text-sm font-medium" id="current-lang">EN</span>
            </button>
            <div id="lang-dropdown" class="hidden absolute right-0 mt-2 glass-card rounded-lg overflow-hidden min-w-[120px] z-50">
              <button class="lang-option w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 transition-colors" data-lang="en">English</button>
              <button class="lang-option w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 transition-colors" data-lang="ar">العربية</button>
              <button class="lang-option w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 transition-colors" data-lang="sv">Svenska</button>
            </div>
          </div>

          ${authContent}

          <!-- Mobile Menu Button -->
          <button id="mobile-menu-btn" class="lg:hidden glass-card p-2 rounded-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div id="mobile-menu" class="hidden lg:hidden mt-4 pt-4 border-t border-white/10">
        <div class="flex flex-col space-y-3">
          <a href="index.html" class="text-white/80 hover:text-white transition-colors duration-200 py-2">Home</a>
          <a href="features.html" class="text-white/80 hover:text-white transition-colors duration-200 py-2">Features</a>
          <a href="pricing.html" class="text-white/80 hover:text-white transition-colors duration-200 py-2">Pricing</a>
          <a href="support.html" class="text-white/80 hover:text-white transition-colors duration-200 py-2">Support</a>
          ${token ? `
            <a href="${userRole === 'admin' ? 'admin.html' : userRole === 'reseller' ? 'reseller.html' : 'user.html'}" class="btn-neon text-center mt-2">Dashboard</a>
            <a href="#" id="mobile-logout-btn" class="text-red-400 text-center py-2 mt-2">Logout</a>
          ` : `
            <a href="#" class="btn-neon text-center mt-2">Portal Login</a>
          `}
        </div>
      </div>
    </nav>
    <!-- Search Modal excluded for brevity, logic remains same via initHeader -->
    <div id="search-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div class="glass-card w-full max-w-2xl mx-4 p-6 rounded-2xl animate-slide-up">
        <div class="flex items-center space-x-3 mb-4">
          <svg class="w-6 h-6 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          <input type="text" placeholder="Search documentation..." class="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg" id="search-input" />
          <button id="close-search" class="text-white/60 hover:text-white transition-colors"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        </div>
      </div>
    </div>
  `;

  // Attach dropdown logic here to ensure it works
  if (token) {
    setTimeout(() => {
      const publicProfileBtn = header.querySelector('#public-profile-btn');
      const adminMenuDropdown = header.querySelector('#admin-menu-dropdown');
      const logoutBtn = header.querySelector('#logout-btn');
      const mobileLogoutBtn = header.querySelector('#mobile-logout-btn');

      if (publicProfileBtn && adminMenuDropdown) {
        publicProfileBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          adminMenuDropdown.classList.toggle('hidden');
        });

        // Close on click outside
        document.addEventListener('click', (e) => {
          if (!publicProfileBtn.contains(e.target) && !adminMenuDropdown.contains(e.target)) {
            adminMenuDropdown.classList.add('hidden');
          }
        });
      }

      const handleLogout = (e) => {
        e.preventDefault();
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'index.html';
      };

      if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
      if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
    }, 0);
  }

  return header;
}

// Initialize Header Interactions
export function initHeader() {
  // Language Switcher
  const langBtn = document.getElementById('lang-btn');
  const langDropdown = document.getElementById('lang-dropdown');
  const currentLang = document.getElementById('current-lang');
  const langOptions = document.querySelectorAll('.lang-option');

  langBtn?.addEventListener('click', () => {
    langDropdown?.classList.toggle('hidden');
  });

  langOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const lang = e.target.getAttribute('data-lang').toUpperCase();
      currentLang.textContent = lang;
      langDropdown?.classList.add('hidden');
    });
  });

  // Mobile Menu
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu?.classList.toggle('hidden');
  });

  // Search Modal
  const searchBtn = document.getElementById('search-btn');
  const searchModal = document.getElementById('search-modal');
  const closeSearch = document.getElementById('close-search');
  const searchInput = document.getElementById('search-input');

  searchBtn?.addEventListener('click', () => {
    searchModal?.classList.remove('hidden');
    searchInput?.focus();
  });

  closeSearch?.addEventListener('click', () => {
    searchModal?.classList.add('hidden');
  });

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchModal?.classList.add('hidden');
      langDropdown?.classList.add('hidden');
    }
  });

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!langBtn?.contains(e.target) && !langDropdown?.contains(e.target)) {
      langDropdown?.classList.add('hidden');
    }
  });
}
