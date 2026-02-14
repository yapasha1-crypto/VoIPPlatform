// Coming Soon Overlay Component
export function showComingSoon(featureName = 'Feature') {
    // Remove existing overlay if present
    const existing = document.getElementById('coming-soon-overlay');
    if (existing) {
        existing.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'coming-soon-overlay';
    overlay.className = 'coming-soon-overlay active';

    overlay.innerHTML = `
    <div class="glass-card p-8 rounded-2xl max-w-md w-90 text-center shadow-neon-cyan">
      <!-- Animated Icon -->
      <div class="mb-6 flex justify-center">
        <div class="w-20 h-20 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-full flex items-center justify-center shadow-neon-cyan animate-pulse">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
      </div>
      
      <!-- Content -->
      <h3 class="text-2xl font-heading font-bold text-white mb-3">🚀 Coming Soon</h3>
      <p class="text-white/70 mb-2">The <span class="text-gradient font-semibold">${featureName}</span> feature is currently under development.</p>
      <p class="text-white/50 text-sm mb-6">We're working hard to bring you an amazing experience!</p>
      
      <!-- Close Button -->
      <button id="coming-soon-close" class="btn-neon w-full">
        Back to Dashboard
      </button>
    </div>
  `;

    document.body.appendChild(overlay);

    // Close handlers
    const closeBtn = overlay.querySelector('#coming-soon-close');
    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }
    });
}
