// Dashboard Widgets - Reusable Components

// Stat Card Widget
export function createStatCard({ icon, label, value, trend, color = 'cyan' }) {
  const colorClasses = {
    cyan: 'from-neon-cyan to-neon-cyan/50',
    violet: 'from-neon-violet to-neon-violet/50',
    success: 'from-success to-success/50',
    warning: 'from-warning to-warning/50',
  };

  return `
    <div class="stat-card">
      <div class="stat-card-icon bg-gradient-to-br ${colorClasses[color]} shadow-neon-${color}">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${icon}
        </svg>
      </div>
      <div class="stat-card-value">${value}</div>
      <div class="flex items-center justify-between mt-2">
        <span class="text-sm text-white/60">${label}</span>
        ${trend ? `
          <span class="text-xs ${trend > 0 ? 'text-success' : 'text-danger'} flex items-center">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${trend > 0 ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}"></path>
            </svg>
            ${Math.abs(trend)}%
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

// Gauge Chart Widget
export function createGaugeChart({ value, max, label, color = 'cyan' }) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 90;
  const offset = circumference - (percentage / 100) * circumference;

  return `
    <div class="stat-card text-center">
      <div class="gauge-chart">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gaugeGradient-${label}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:var(--color-neon-cyan);stop-opacity:1" />
              <stop offset="100%" style="stop-color:var(--color-neon-violet);stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle class="gauge-bg" cx="100" cy="100" r="90"></circle>
          <circle class="gauge-fill" cx="100" cy="100" r="90" 
                  stroke="url(#gaugeGradient-${label})"
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${offset}"></circle>
          <text x="100" y="95" text-anchor="middle" class="text-3xl font-bold fill-white font-heading">
            ${percentage.toFixed(0)}%
          </text>
          <text x="100" y="115" text-anchor="middle" class="text-xs fill-white/40">
            ${value}/${max}
          </text>
        </svg>
      </div>
      <p class="text-sm text-white/60 mt-4">${label}</p>
    </div>
  `;
}

// Data Table Widget - Supports two signatures for backward compatibility
export function createDataTable(config) {
  // Defensive check for undefined/null config
  if (!config) {
    console.warn('createDataTable received no config');
    return '<div class="glass-card p-6 rounded-xl"><p class="text-white/60 text-center">No configuration provided</p></div>';
  }

  // NEW SIGNATURE: { columns, data, emptyMessage }
  if (config.columns && config.data !== undefined) {
    const { columns, data, emptyMessage = 'No data available' } = config;

    // Defensive check for data
    if (!data || !Array.isArray(data)) {
      console.warn('createDataTable received invalid data:', data);
      return `
                <div class="glass-card p-6 rounded-xl">
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    ${columns.map(col => `<th style="${col.width ? `width: ${col.width}` : ''}">${col.label}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colspan="${columns.length}" class="text-center text-white/60 py-8">${emptyMessage}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
    }

    // Build table with data
    return `
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${columns.map(col => `<th style="${col.width ? `width: ${col.width}` : ''}">${col.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.length === 0 ? `
                            <tr>
                                <td colspan="${columns.length}" class="text-center text-white/60 py-8">${emptyMessage}</td>
                            </tr>
                        ` : data.map(row => `
                            <tr>
                                ${columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : value;
      return `<td>${formatted !== undefined && formatted !== null ? formatted : '-'}</td>`;
    }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
  }

  // OLD SIGNATURE: { headers, rows, actions }
  const { headers, rows, actions = [] } = config;

  // Defensive checks for old signature
  if (!headers || !Array.isArray(headers)) {
    console.warn('createDataTable received invalid headers:', headers);
    return '<div class="glass-card p-6 rounded-xl"><p class="text-white/60 text-center">Invalid table configuration</p></div>';
  }

  if (!rows || !Array.isArray(rows)) {
    console.warn('createDataTable received invalid rows:', rows);
    return `
            <div class="glass-card p-6 rounded-2xl">
                <table class="data-table">
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                            ${actions.length > 0 ? '<th>Actions</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="${headers.length + (actions.length > 0 ? 1 : 0)}" class="text-center text-white/60 py-8">No data available</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
  }

  return `
    <div class="glass-card p-6 rounded-2xl">
      <table class="data-table">
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
            ${actions.length > 0 ? '<th>Actions</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${cell}</td>`).join('')}
              ${actions.length > 0 ? `
                <td>
                  <div class="flex items-center space-x-2">
                    ${actions.map(action => `
                      <button class="text-neon-cyan hover:text-neon-violet transition-colors text-sm">
                        ${action}
                      </button>
                    `).join('')}
                  </div>
                </td>
              ` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Badge Component
export function createBadge(text, type = 'info') {
  return `<span class="badge badge-${type}">${text}</span>`;
}

// Modal Component
export function createModal({ title, content, id }) {
  return `
    <div id="${id}" class="modal-overlay hidden">
      <div class="modal-content">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-heading font-bold text-white">${title}</h3>
          <button class="modal-close text-white/60 hover:text-white transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div>${content}</div>
      </div>
    </div>
  `;
}

// Initialize modal interactions
export function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
}

// Simple Line Chart (Canvas-based)
export function createLineChart(canvasId, data, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = 300;

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.1)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(padding, padding, chartWidth, chartHeight);

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;

  data.forEach((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  // Draw points
  data.forEach((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;

    ctx.beginPath();
    ctx.fillStyle = '#06b6d4';
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.beginPath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw labels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '12px Inter';
  ctx.textAlign = 'center';

  labels.forEach((label, index) => {
    const x = padding + (index / (labels.length - 1)) * chartWidth;
    ctx.fillText(label, x, height - 10);
  });
}
