/**
 * Dashboard Layout Manager
 * centralized logic for injecting Sidebar and Header and managing layout state
 */
import { createSidebar, initSidebar } from './dashboard/sidebar.js';
import { createHeader, initHeader } from './dashboard/header.js';

export class DashboardLayout {
    constructor(role, userData) {
        this.role = role || 'user';
        this.userData = userData || {};
        this.init();
    }

    init() {
        // Enforce basic layout structure
        this.setupGrid();
        this.injectSidebar();
        this.injectHeader();
    }

    setupGrid() {
        // Ensure body has the correct classes for flex layout
        document.body.classList.add('bg-slate-900', 'text-white', 'flex', 'h-screen', 'overflow-hidden');
    }

    injectSidebar() {
        // Find or create sidebar container
        let container = document.getElementById('sidebar-container');
        if (!container) {
            // Fallback: create it if missing
            container = document.createElement('div');
            container.id = 'sidebar-container';
            document.body.prepend(container); // Prepend to be first
        }

        // Clear existing
        container.innerHTML = '';

        // Inject
        const sidebar = createSidebar(this.role, this.userData);
        container.appendChild(sidebar);
        initSidebar();
    }

    injectHeader() {
        // Find or create header container
        // Header usually sits inside the main content area for this layout, or above it.
        // Assuming "main-content" wrapper exists or needs creation.

        // Locate main content
        let mainContent = document.querySelector('.main-content');
        if (!mainContent) {
            mainContent = document.createElement('main');
            // FIX: Added ml-64 to account for fixed sidebar width (w-64)
            mainContent.className = 'main-content flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-900 relative ml-64';
            document.body.appendChild(mainContent);

            // Move existing page content into mainContent if it was loose in body
            const children = Array.from(document.body.children);
            children.forEach(child => {
                if (child.id !== 'sidebar-container' && child.tagName !== 'SCRIPT' && child !== mainContent) {
                    mainContent.appendChild(child);
                }
            });
        }

        let container = document.getElementById('header-container');
        if (!container && mainContent) {
            container = document.createElement('div');
            container.id = 'header-container';
            mainContent.prepend(container);
        }

        if (container) {
            container.innerHTML = '';
            // Pass 0 balance for now, admin.js will update it
            const header = createHeader(this.role, 0);
            container.appendChild(header);
            initHeader();
        }
    }
}

// Helper to init layout quickly
export const initDashboardLayout = (role, userData) => {
    return new DashboardLayout(role, userData);
};
