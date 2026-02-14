// Network Status Widget Component
export function createNetworkStatus() {
    const widget = document.createElement('div');
    widget.className = 'glass-card p-6 rounded-2xl';

    widget.innerHTML = `
    <h3 class="text-lg font-heading font-semibold mb-4 flex items-center">
      <span class="status-dot status-online mr-2"></span>
      Global Network Status
    </h3>
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-white/60 text-sm">Uptime</span>
        <span class="text-neon-cyan font-semibold">99.99%</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white/60 text-sm">Active Nodes</span>
        <span class="text-neon-violet font-semibold">247</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white/60 text-sm">Avg Latency</span>
        <span class="text-green-400 font-semibold">12ms</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-white/60 text-sm">Calls/Minute</span>
        <span class="text-neon-cyan font-semibold" id="calls-counter">15,234</span>
      </div>
    </div>
    <div class="mt-4 pt-4 border-t border-white/10">
      <div class="flex items-center justify-between text-xs text-white/40">
        <span>Last updated</span>
        <span id="last-updated">Just now</span>
      </div>
    </div>
  `;

    return widget;
}

// Animate counter
export function animateNetworkStatus() {
    const counter = document.getElementById('calls-counter');
    if (!counter) return;

    setInterval(() => {
        const current = parseInt(counter.textContent.replace(/,/g, ''));
        const newValue = current + Math.floor(Math.random() * 100);
        counter.textContent = newValue.toLocaleString();
    }, 3000);

    // Update timestamp
    const timestamp = document.getElementById('last-updated');
    if (timestamp) {
        setInterval(() => {
            timestamp.textContent = 'Just now';
        }, 5000);
    }
}
