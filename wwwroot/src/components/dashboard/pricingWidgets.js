// Beroea VoIP Platform - Pricing Management Widgets
// Components for CSV upload, rate tables, and margin management

import { toast } from '../toast.js';
import { apiService } from '../../services/apiService.js';

/**
 * Create CSV Upload Widget for Admin
 * Allows admin to upload rate list and set global margin
 */
export function createRateUploadWidget() {
  return `
    <div class="glass-card p-6 space-y-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-heading text-white">📊 Upload Rate List</h3>
        <span class="text-sm text-white/40">CSV or Excel: Destination, Prefix, Rate</span>
      </div>
      
      <!-- File Upload Zone -->
      <div id="upload-zone" class="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-neon-cyan transition-all cursor-pointer relative">
        <input type="file" id="csv-upload" accept=".csv,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div class="pointer-events-none">
          <svg class="w-12 h-12 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p class="text-white/60 font-medium">Drag & drop CSV or Excel file, or click to browse</p>
          <p class="text-sm text-white/40 mt-2">Supported: .csv, .xls, .xlsx | Format: Destination, Prefix, Rate</p>
          <div id="file-name" class="text-sm text-neon-cyan mt-2 hidden flex items-center justify-center gap-2">
            <span id="file-name-text"></span>
            <button id="clear-file-btn" class="text-red-400 hover:text-red-300 transition-colors">✕ Clear</button>
          </div>
        </div>
      </div>
      
      <!-- Configuration -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-white/60 mb-2">Global Admin Margin (%)</label>
          <input 
            type="number" 
            id="admin-margin" 
            class="w-full glass-card px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan transition-all" 
            value="20" 
            step="0.1" 
            min="0" 
            max="100"
            placeholder="20.0"
          />
          <p class="text-xs text-white/40 mt-1">Markup added to CSV rates</p>
        </div>
        
        <div>
          <label class="block text-sm text-white/60 mb-2">Assign to Tariff</label>
          <select id="tariff-select" class="w-full glass-card px-4 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan transition-all">
            <option value="">Loading tariffs...</option>
          </select>
          <p class="text-xs text-white/40 mt-1">Or create new tariff below</p>
        </div>
      </div>
      
      <!-- New Tariff -->
      <div class="glass-card p-4 space-y-3">
        <p class="text-sm text-white/60">Or create new tariff:</p>
        <div class="grid grid-cols-2 gap-3">
          <input 
            type="text" 
            id="new-tariff-name" 
            class="glass-card px-3 py-2 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-violet" 
            placeholder="Tariff name (e.g., Premium)"
          />
          <input 
            type="text" 
            id="new-tariff-desc" 
            class="glass-card px-3 py-2 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-violet" 
            placeholder="Description"
          />
        </div>
      </div>
      
      <!-- Upload Button -->
      <button id="upload-rates-btn" class="w-full btn-neon flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
        </svg>
        <span>Upload & Calculate Rates</span>
      </button>
      
      <!-- Progress Indicator -->
      <div id="upload-progress" class="hidden space-y-2">
        <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div id="progress-bar" class="bg-gradient-to-r from-neon-cyan to-neon-violet h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
        </div>
        <p id="progress-text" class="text-sm text-white/60 text-center">Processing...</p>
      </div>
      
      <!-- Preview Stats -->
      <div id="upload-stats" class="hidden grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
        <div class="text-center">
          <p class="text-2xl font-bold text-neon-cyan" id="stat-destinations">0</p>
          <p class="text-xs text-white/40">Destinations</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-neon-violet" id="stat-avg-rate">$0.00</p>
          <p class="text-xs text-white/40">Avg Rate</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-success" id="stat-margin">0%</p>
          <p class="text-xs text-white/40">Margin</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize Rate Upload Widget
 * Handles file upload, CSV parsing, and rate import
 */
export async function initRateUploadWidget() {


  // Load tariffs
  await loadTariffs();

  let selectedFile = null;
  let currentRatesData = []; // Store parsed rates for margin recalculation

  // File input handler
  const fileInput = document.getElementById('csv-upload');
  const fileName = document.getElementById('file-name');
  const fileNameText = document.getElementById('file-name-text');
  const uploadZone = document.getElementById('upload-zone');
  const clearFileBtn = document.getElementById('clear-file-btn');

  // Helper function to clear file selection
  function clearFile() {
    selectedFile = null;
    if (fileInput) fileInput.value = '';
    if (fileName) fileName.classList.add('hidden');
    if (uploadZone) uploadZone.classList.remove('border-neon-cyan');
    toast.info('File selection cleared');
  }

  // Clear file button
  if (clearFileBtn) {
    clearFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      clearFile();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      selectedFile = e.target.files[0];
      if (selectedFile) {
        if (fileNameText) fileNameText.textContent = `Selected: ${selectedFile.name}`;
        fileName.classList.remove('hidden');
        uploadZone.classList.add('border-neon-cyan');
        toast.success(`File selected: ${selectedFile.name}`);
      }
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('border-neon-cyan', 'bg-white/5');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('bg-white/5');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('bg-white/5');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        selectedFile = files[0];
        fileInput.files = files;
        if (fileNameText) fileNameText.textContent = `Selected: ${selectedFile.name}`;
        fileName.classList.remove('hidden');
        uploadZone.classList.add('border-neon-cyan');
        toast.success(`File selected: ${selectedFile.name}`);
      }
    });
  }

  // REACTIVE MARGIN CALCULATION
  const marginInput = document.getElementById('admin-margin');
  if (marginInput) {
    marginInput.addEventListener('input', () => {
      const margin = parseFloat(marginInput.value) || 0;

      // Update stats display
      const statMargin = document.getElementById('stat-margin');
      if (statMargin) {
        statMargin.textContent = `${margin}%`;
      }

      // Recalculate and update table prices if rates are loaded
      if (currentRatesData.length > 0) {
        updateTablePrices(currentRatesData, margin);
      }
    });
  }

  // Upload button handler
  const uploadBtn = document.getElementById('upload-rates-btn');
  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      const result = await handleRateUpload(selectedFile);
      if (result && result.rates) {
        currentRatesData = result.rates; // Store for margin recalculation
      }
    });
  }


}

/**
 * Load tariffs into dropdown
 */
async function loadTariffs() {
  try {
    const tariffs = await apiService.getTariffs();
    const select = document.getElementById('tariff-select');

    if (select) {
      select.innerHTML = '<option value="">Select existing tariff...</option>';
      tariffs.forEach(tariff => {
        const option = document.createElement('option');
        option.value = tariff.id;
        option.textContent = `${tariff.name} ${tariff.description ? '- ' + tariff.description : ''}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    console.error('[Pricing] Failed to load tariffs:', error);
    toast.error('Failed to load tariffs');
  }
}

/**
 * Handle rate upload process
 */
async function handleRateUpload(file) {
  if (!file) {
    toast.error('Please select a CSV file first');
    return;
  }

  const adminMargin = parseFloat(document.getElementById('admin-margin').value) || 0;
  let tariffId = document.getElementById('tariff-select').value;
  const newTariffName = document.getElementById('new-tariff-name').value.trim();
  const newTariffDesc = document.getElementById('new-tariff-desc').value.trim();

  // Show progress
  const progressDiv = document.getElementById('upload-progress');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const uploadBtn = document.getElementById('upload-rates-btn');

  progressDiv.classList.remove('hidden');
  uploadBtn.disabled = true;
  uploadBtn.classList.add('opacity-50', 'cursor-not-allowed');

  try {
    // Create new tariff if needed
    if (newTariffName && !tariffId) {
      progressText.textContent = 'Creating new tariff...';
      progressBar.style.width = '20%';

      const newTariff = await apiService.createTariff({
        name: newTariffName,
        description: newTariffDesc || '',
        isActive: true
      });

      tariffId = newTariff.id;
      toast.success(`Created tariff: ${newTariffName}`);
      await loadTariffs(); // Reload dropdown
    }

    if (!tariffId) {
      toast.error('Please select or create a tariff');
      progressDiv.classList.add('hidden');
      uploadBtn.disabled = false;
      uploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
      return;
    }

    // Parse CSV
    progressText.textContent = 'Parsing CSV file...';
    progressBar.style.width = '40%';

    const csvData = await apiService.parseCSV(file);


    // Show stats
    const statsDiv = document.getElementById('upload-stats');
    document.getElementById('stat-destinations').textContent = csvData.length;

    // Calculate average rate with NaN protection
    const avgRate = csvData.reduce((sum, row) => {
      const rate = parseFloat(row.rate);
      return sum + (isNaN(rate) ? 0 : rate);
    }, 0) / (csvData.length || 1);

    document.getElementById('stat-avg-rate').textContent = `$${avgRate.toFixed(4)}`;
    document.getElementById('stat-margin').textContent = `${adminMargin}%`;
    statsDiv.classList.remove('hidden');

    // Import rates
    progressText.textContent = `Importing ${csvData.length} rates...`;
    progressBar.style.width = '60%';

    const results = await apiService.importRatesFromCSV(tariffId, csvData, adminMargin);

    // Complete
    progressBar.style.width = '100%';
    progressText.textContent = `✅ Successfully imported ${results.length} rates!`;

    setTimeout(() => {
      progressDiv.classList.add('hidden');
      progressBar.style.width = '0%';
    }, 3000);

    // Return rates data for margin recalculation
    return { rates: csvData, margin: adminMargin };

  } catch (error) {
    console.error('[Pricing] Upload failed:', error);
    progressText.textContent = '❌ Upload failed';
    progressBar.classList.add('bg-red-500');
    return null;
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

/**
 * Update table prices based on margin change
 */
function updateTablePrices(ratesData, margin) {
  const tableBody = document.getElementById('rate-table-body');
  if (!tableBody) return;

  const rows = tableBody.querySelectorAll('tr');
  rows.forEach((row, index) => {
    if (index >= ratesData.length) return;

    const baseRate = parseFloat(ratesData[index].rate);
    if (isNaN(baseRate)) return;

    const finalPrice = baseRate * (1 + margin / 100);
    const priceCell = row.querySelector('td:nth-child(3)'); // Price column

    if (priceCell) {
      priceCell.textContent = `$${finalPrice.toFixed(4)}`;
    }
  });

  // Update average rate with NaN protection
  const avgRate = ratesData.reduce((sum, r) => {
    const base = parseFloat(r.rate);
    return sum + (isNaN(base) ? 0 : base * (1 + margin / 100));
  }, 0) / (ratesData.length || 1);

  const statAvgRate = document.getElementById('stat-avg-rate');
  if (statAvgRate) {
    statAvgRate.textContent = `$${avgRate.toFixed(4)}`;
  }


}

/**
 * Create Rate Table Widget
 * Displays rates with search and filter
 */
export function createRateTable(rates = [], title = 'Rate List', showActions = true) {
  const avgRate = rates.length > 0
    ? (rates.reduce((sum, r) => sum + r.price, 0) / rates.length).toFixed(4)
    : '0.0000';

  return `
    <div class="glass-card p-6">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h3 class="text-xl font-heading text-white">${title}</h3>
          <p class="text-sm text-white/40">${rates.length} destinations • Avg: $${avgRate}/min</p>
        </div>
        <div class="flex gap-2">
          <input 
            type="text" 
            id="rate-search" 
            placeholder="Search destination or prefix..." 
            class="glass-card px-4 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-neon-cyan w-64"
          />
          <button class="btn-neon text-sm px-4">Export CSV</button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-white/10">
              <th class="text-left py-3 px-4 text-white/60 text-sm font-medium">Destination</th>
              <th class="text-left py-3 px-4 text-white/60 text-sm font-medium">Prefix</th>
              <th class="text-right py-3 px-4 text-white/60 text-sm font-medium">Price/min</th>
              ${showActions ? '<th class="text-right py-3 px-4 text-white/60 text-sm font-medium">Actions</th>' : ''}
            </tr>
          </thead>
          <tbody id="rate-table-body">
            ${rates.length === 0 ? `
              <tr>
                <td colspan="${showActions ? 4 : 3}" class="py-8 text-center text-white/40">
                  No rates found. Upload a CSV to get started.
                </td>
              </tr>
            ` : rates.map(rate => `
              <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td class="py-3 px-4 text-white">${rate.destination}</td>
                <td class="py-3 px-4 text-white/80">+${rate.prefix}</td>
                <td class="py-3 px-4 text-right text-neon-cyan font-mono font-bold">$${rate.price.toFixed(4)}</td>
                ${showActions ? `
                  <td class="py-3 px-4 text-right">
                    <button class="text-white/60 hover:text-white text-sm transition-colors" onclick="editRate(${rate.id})">Edit</button>
                    <button class="text-white/60 hover:text-red-400 text-sm ml-3 transition-colors" onclick="deleteRate(${rate.id})">Delete</button>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Create Margin Calculator Widget for Resellers
 */
export function createMarginCalculator(adminRates = []) {
  return `
    <div class="glass-card p-6 space-y-4">
      <h3 class="text-xl font-heading text-white">💰 Your Pricing Strategy</h3>
      
      <!-- Admin Base Info -->
      <div class="glass-card p-4 space-y-2">
        <p class="text-sm text-white/60">Admin Base Rates</p>
        <div class="flex items-center justify-between">
          <span class="text-white">Status:</span>
          <span class="text-neon-cyan font-medium">${adminRates.length > 0 ? 'Loaded' : 'Not Available'}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-white">Total Destinations:</span>
          <span class="text-white font-bold">${adminRates.length}</span>
        </div>
      </div>
      
      <!-- Reseller Markup Input -->
      <div>
        <label class="block text-sm text-white/60 mb-2">Your Markup Percentage (%)</label>
        <input 
          type="number" 
          id="reseller-margin" 
          class="w-full glass-card px-4 py-3 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-neon-violet transition-all" 
          value="15" 
          step="0.1" 
          min="0" 
          max="100"
          placeholder="15.0"
        />
        <p class="text-xs text-white/40 mt-2">This markup applies to all your users</p>
      </div>
      
      <!-- Profit Preview -->
      <div class="glass-card p-4 space-y-3 bg-gradient-to-br from-neon-violet/10 to-neon-cyan/10">
        <h4 class="text-white font-medium">Profit Preview (Example: USA)</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-white/60">Admin Price:</span>
            <span class="text-white font-mono" id="preview-admin-price">$0.0144</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">Your Markup:</span>
            <span class="text-neon-violet font-bold" id="preview-markup">15%</span>
          </div>
          <div class="flex justify-between border-t border-white/10 pt-2">
            <span class="text-white/60">Final User Price:</span>
            <span class="text-neon-cyan font-mono font-bold" id="preview-final-price">$0.01656</span>
          </div>
          <div class="flex justify-between">
            <span class="text-white/60">Your Profit/min:</span>
            <span class="text-success font-bold" id="preview-profit">$0.00216</span>
          </div>
        </div>
      </div>
      
      <!-- Apply Button -->
      <button id="apply-markup-btn" class="w-full btn-neon">
        Apply Markup to All Users
      </button>
    </div>
  `;
}

/**
 * Create User Rate Search Widget
 */
export function createRateSearchWidget() {
  return `
    <div class="glass-card p-6 space-y-4">
      <h2 class="text-2xl font-heading text-white">🔍 Search Call Rates</h2>
      <p class="text-white/60">Find rates for any destination worldwide</p>
      
      <!-- Search Input -->
      <div class="flex gap-2">
        <input 
          type="text" 
          id="rate-search-input" 
          placeholder="Search destination or country code (e.g., United States, +1)..."
          class="flex-1 glass-card px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan transition-all"
        />
        <button id="rate-search-btn" class="btn-neon px-6">
          Search
        </button>
      </div>
      
      <!-- Results -->
      <div id="rate-search-results" class="hidden">
        <!-- Results will be inserted here -->
      </div>
      
      <!-- Cost Calculator -->
      <div class="glass-card p-4 space-y-3">
        <h4 class="text-white font-medium">Estimate Call Cost</h4>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-white/60 mb-1">Duration (minutes)</label>
            <input 
              type="number" 
              id="call-duration" 
              class="w-full glass-card px-3 py-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan" 
              placeholder="10"
              min="1"
            />
          </div>
          <div>
            <label class="block text-xs text-white/60 mb-1">Estimated Cost</label>
            <p class="text-2xl font-bold text-success" id="estimated-cost">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  `;
}
