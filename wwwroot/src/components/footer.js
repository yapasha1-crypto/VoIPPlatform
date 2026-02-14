// Footer Component - Modular and reusable
export function createFooter() {
  const footer = document.createElement('footer');
  footer.className = 'glass-card border-t border-white/10 mt-24';

  footer.innerHTML = `
    <div class="section-container">
      <!-- Main Footer Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
        <!-- Product Column -->
        <div>
          <h3 class="text-lg font-heading font-semibold mb-4 text-gradient">Product</h3>
          <ul class="space-y-3">
            <li><a href="solutions.html#voip" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">VoIP Solutions</a></li>
            <li><a href="solutions.html#sms" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">SMS Platform</a></li>
            <li><a href="solutions.html#sip" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">SIP Trunking</a></li>
            <li><a href="solutions.html#dids" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Global DIDs</a></li>
            <li><a href="resources.html#api" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">API Access</a></li>
            <li><a href="pricing.html" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Pricing</a></li>
          </ul>
        </div>

        <!-- Company Column -->
        <div>
          <h3 class="text-lg font-heading font-semibold mb-4 text-gradient">Company</h3>
          <ul class="space-y-3">
            <li><a href="company.html#about" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">About Us</a></li>
            <li><a href="company.html#careers" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Careers</a></li>
            <li><a href="company.html#partners" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Press Kit</a></li>
            <li><a href="company.html#partners" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Partners</a></li>
            <li><a href="company.html#contact" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Contact</a></li>
            <li><a href="resources.html" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Blog</a></li>
          </ul>
        </div>

        <!-- Resources Column -->
        <div>
          <h3 class="text-lg font-heading font-semibold mb-4 text-gradient">Resources</h3>
          <ul class="space-y-3">
            <li><a href="resources.html#documentation" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Documentation</a></li>
            <li><a href="resources.html#api" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">API Reference</a></li>
            <li><a href="resources.html#status" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Status Page</a></li>
            <li><a href="resources.html" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Changelog</a></li>
            <li><a href="company.html#contact" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Community</a></li>
            <li><a href="support.html" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Support Center</a></li>
          </ul>
        </div>

        <!-- Legal Column -->
        <div>
          <h3 class="text-lg font-heading font-semibold mb-4 text-gradient">Legal</h3>
          <ul class="space-y-3">
            <li><a href="legal.html#privacy" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Privacy Policy</a></li>
            <li><a href="legal.html#terms" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Terms of Service</a></li>
            <li><a href="legal.html#privacy" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Cookie Policy</a></li>
            <li><a href="legal.html#gdpr" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">GDPR</a></li>
            <li><a href="legal.html#security" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Compliance</a></li>
            <li><a href="legal.html#security" class="text-white/60 hover:text-neon-cyan transition-colors duration-200">Security</a></li>
          </ul>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="border-t border-white/10 pt-8 pb-8">
        <div class="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <!-- Logo & Copyright -->
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-br from-neon-cyan to-neon-violet rounded-lg flex items-center justify-center shadow-neon-cyan">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <span class="text-white/60 text-sm">© 2026 Beroea. All rights reserved.</span>
          </div>

          <!-- Social Media Icons -->
          <div class="flex items-center space-x-4">
            <a href="#" class="social-icon group">
              <svg class="w-5 h-5 text-white/60 group-hover:text-neon-cyan transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </a>
            <a href="#" class="social-icon group">
              <svg class="w-5 h-5 text-white/60 group-hover:text-neon-cyan transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <a href="#" class="social-icon group">
              <svg class="w-5 h-5 text-white/60 group-hover:text-neon-cyan transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            <a href="#" class="social-icon group">
              <svg class="w-5 h-5 text-white/60 group-hover:text-neon-cyan transition-all duration-300" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  return footer;
}

// Add neon glow effect to social icons
export function initFooter() {
  const socialIcons = document.querySelectorAll('.social-icon');

  socialIcons.forEach(icon => {
    icon.addEventListener('mouseenter', (e) => {
      e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))';
    });

    icon.addEventListener('mouseleave', (e) => {
      e.currentTarget.style.filter = 'none';
    });
  });
}
