import './style.css';
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
