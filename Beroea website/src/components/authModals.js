// Authentication Modals Component
// Creates and returns login/registration modal HTML for global injection

export function createAuthModals() {
  const modalsContainer = document.createElement('div');
  modalsContainer.id = 'auth-modals-container';

  modalsContainer.innerHTML = `
    <!-- Login Modal -->
    <div id="login-modal" class="auth-modal">
      <div class="auth-modal-content">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-heading font-bold text-white">Login to Beroea</h2>
          <button id="login-close" class="text-white/60 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form id="login-form" class="space-y-4">
          <!-- Email/Username -->
          <div>
            <label class="block text-sm text-white/60 mb-2">Email Address</label>
            <input 
              type="email" 
              id="login-email" 
              class="auth-input" 
              placeholder="you@company.com"
              required
            >
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm text-white/60 mb-2">Password</label>
            <input 
              type="password" 
              id="login-password" 
              class="auth-input" 
              placeholder="••••••••"
              required
            >
          </div>

          <!-- Submit Button -->
          <button type="submit" class="w-full btn-neon mt-6">
            Sign In
          </button>
        </form>

        <!-- Toggle to Registration -->
        <p class="text-center text-sm text-white/60 mt-6">
          Don't have an account?
          <button id="show-register" class="text-neon-cyan hover:text-neon-violet transition-colors font-medium">
            Register
          </button>
        </p>
      </div>
    </div>

    <!-- Registration Modal -->
    <div id="register-modal" class="auth-modal">
      <div class="auth-modal-content">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-heading font-bold text-white">Join Beroea Network</h2>
          <button id="register-close" class="text-white/60 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form id="register-form" class="space-y-4">
          <!-- Full Name -->
          <div>
            <label class="block text-sm text-white/60 mb-2">Full Name</label>
            <input 
              type="text" 
              id="register-name" 
              class="auth-input" 
              placeholder="John Smith"
              required
            >
          </div>

          <!-- Business Email -->
          <div>
            <label class="block text-sm text-white/60 mb-2">Business Email</label>
            <input 
              type="email" 
              id="register-email" 
              class="auth-input" 
              placeholder="you@company.com"
              required
            >
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm text-white/60 mb-2">Password</label>
            <input 
              type="password" 
              id="register-password" 
              class="auth-input" 
              placeholder="••••••••"
              minlength="4"
              required
            >
            <p class="text-xs text-white/40 mt-1">Minimum 4 characters</p>
          </div>

          <!-- Phone Number -->
          <div>
            <label class="block text-sm text-white/60 mb-2">Phone Number (Optional)</label>
            <input 
              type="tel" 
              id="register-phone" 
              class="auth-input" 
              placeholder="+1 (555) 123-4567"
            >
          </div>

          <!-- Submit Button -->
          <button type="submit" class="w-full btn-neon mt-6">
            Get Started
          </button>
        </form>

        <!-- Toggle to Login -->
        <p class="text-center text-sm text-white/60 mt-6">
          Already have an account?
          <button id="show-login" class="text-neon-cyan hover:text-neon-violet transition-colors font-medium">
            Login
          </button>
        </p>
      </div>
    </div>
  `;

  return modalsContainer;
}
