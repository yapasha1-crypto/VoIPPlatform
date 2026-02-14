// import './style.css'; // Removed for static execution
import { createHeader, initHeader } from './components/header.js';
import { createFooter, initFooter } from './components/footer.js';
import { initGlobe } from './components/globe.js';
import { createNetworkStatus, animateNetworkStatus } from './components/networkStatus.js';
import { initAuth } from './components/initAuth.js?v=FIX_FINAL';

// Beroea VoIP Platform - Main Entry Point

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize components

  // Initialize Header

  const headerContainer = document.getElementById('header-container');
  if (headerContainer) {
    headerContainer.appendChild(createHeader());
    initHeader();

  } else {
    console.error('[Main] ❌ Header container not found!');
  }

  // Initialize Footer

  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.appendChild(createFooter());
    initFooter();

  } else {
    console.error('[Main] ❌ Footer container not found!');
  }

  // Initialize Authentication System (modals + listeners)
  // This runs AFTER header/footer so Portal Login buttons exist
  console.log('[MainDebug] Calling initAuth()...');
  initAuth();

  // Initialize Globe (only on landing page)
  const globeContainer = document.getElementById('globe-container');
  if (globeContainer) {


    // Wait for layout to settle, then initialize globe
    setTimeout(() => {


      const globeInstance = initGlobe('globe-container');

      if (globeInstance) {


        // Add Network Status Widget
        const networkStatusContainer = document.getElementById('network-status-container');
        if (networkStatusContainer) {
          networkStatusContainer.appendChild(createNetworkStatus());
          animateNetworkStatus();

        }
      } else {
        console.error('[Main] ❌ Globe initialization returned null');
      }
    }, 300);
  } else {

  }

  // Scroll Animations

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  // Observe all scroll-fade-in elements
  const scrollElements = document.querySelectorAll('.scroll-fade-in');

  scrollElements.forEach(el => {
    observer.observe(el);
  });


});
