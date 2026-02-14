// Header Component - Modular and reusable
export function createHeader() {
    const header = document.createElement('header');
    header.className = 'fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/10';

    header.innerHTML = `
    <nav class="section-container !py-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-lg flex items-center justify-center shadow-neon-cyan">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <span class="text-2xl font-heading font-bold text-gradient">Beroea</span>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center space-x-8">
          <a href="index.html" class="text-white/80 hover:text-white transition-colors duration-200">Home</a>
          <a href="features.html" class="text-white/80 hover:text-white transition-colors duration-200">Features</a>
          <a href="pricing.html" class="text-white/80 hover:text-white transition-colors duration-200">Pricing</a>
          <a href="support.html" class="text-white/80 hover:text-white transition-colors duration-200">Support</a>
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
            <div id="lang-dropdown" class="hidden absolute right-0 mt-2 glass-card rounded-lg overflow-hidden min-w-[120px]">
              <button class="lang-option w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 transition-colors" data-lang="en">English</button>
              <button class="lang-option w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 transition-colors" data-lang="ar">العربية</button>
              <button class="lang-option w-full px-4 py-2 text-left text-white/80 hover:bg-white/10 transition-colors" data-lang="sv">Svenska</button>
            </div>
          </div>

          <!-- Portal Login Button -->
          <a href="#" class="btn-neon hidden md:inline-block">
            Portal Login
          </a>

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
          <a href="#" class="btn-neon text-center mt-2">Portal Login</a>
        </div>
      </div>
    </nav>

    <!-- Search Modal -->
    <div id="search-modal" class="hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div class="glass-card w-full max-w-2xl mx-4 p-6 rounded-2xl animate-slide-up">
        <div class="flex items-center space-x-3 mb-4">
          <svg class="w-6 h-6 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            placeholder="Search documentation, features, pricing..." 
            class="flex-1 bg-transparent text-white placeholder-white/40 outline-none text-lg"
            id="search-input"
          />
          <button id="close-search" class="text-white/60 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="border-t border-white/10 pt-4">
          <p class="text-white/40 text-sm">Start typing to search...</p>
        </div>
      </div>
    </div>
  `;

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
