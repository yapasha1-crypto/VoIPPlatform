// import './style.css'; // Removed for static execution
import { createHeader, initHeader } from './components/header.js';
import { createFooter, initFooter } from './components/footer.js';
import { initAuth } from './components/initAuth.js';

// Initialize Header
const headerContainer = document.getElementById('header-container');
if (headerContainer) {
    headerContainer.appendChild(createHeader());
    initHeader();
}

// Initialize Footer
const footerContainer = document.getElementById('footer-container');
if (footerContainer) {
    footerContainer.appendChild(createFooter());
    initFooter();
}

// Initialize Authentication System
initAuth();

// Pricing Toggle Logic
const billingToggle = document.getElementById('billing-toggle');
const toggleSlider = document.getElementById('toggle-slider');
const monthlyLabel = document.getElementById('monthly-label');
const yearlyLabel = document.getElementById('yearly-label');

let isYearly = false;

const pricing = {
    starter: { monthly: 49, yearly: 39 },
    pro: { monthly: 149, yearly: 119 }
};

billingToggle?.addEventListener('click', () => {
    isYearly = !isYearly;

    if (isYearly) {
        toggleSlider.style.transform = 'translateX(32px)';
        monthlyLabel.classList.add('text-white/40');
        monthlyLabel.classList.remove('text-white/60');
        yearlyLabel.classList.add('text-white');
        yearlyLabel.classList.remove('text-white/60');

        // Update prices
        document.getElementById('starter-price').textContent = pricing.starter.yearly;
        document.getElementById('pro-price').textContent = pricing.pro.yearly;
        document.getElementById('starter-billing').textContent = 'Billed annually';
        document.getElementById('pro-billing').textContent = 'Billed annually';
    } else {
        toggleSlider.style.transform = 'translateX(0)';
        monthlyLabel.classList.add('text-white/60');
        monthlyLabel.classList.remove('text-white/40');
        yearlyLabel.classList.add('text-white/60');
        yearlyLabel.classList.remove('text-white');

        // Update prices
        document.getElementById('starter-price').textContent = pricing.starter.monthly;
        document.getElementById('pro-price').textContent = pricing.pro.monthly;
        document.getElementById('starter-billing').textContent = 'Billed monthly';
        document.getElementById('pro-billing').textContent = 'Billed monthly';
    }
});

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

document.querySelectorAll('.scroll-fade-in').forEach(el => {
    observer.observe(el);
});
