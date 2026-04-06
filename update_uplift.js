const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Find the function start
const funcStart = 'function refreshUpliftBoard()';
const idx = html.indexOf(funcStart);
if (idx === -1) {
  console.log('✗ Function not found');
  process.exit(1);
}

// Find matching closing brace
let depth = 0;
let funcEnd = idx;
for (let i = idx; i < html.length; i++) {
  if (html[i] === '{') depth++;
  if (html[i] === '}') {
    depth--;
    if (depth === 0) {
      funcEnd = i;
      break;
    }
  }
}

const oldFunc = html.substring(idx, funcEnd + 1);
console.log('Found function, length:', oldFunc.length);

const newFunc = `function refreshUpliftBoard() {
  var c1 = window._c1Uplift || 0;
  var c2 = window._c2Uplift || 0;
  var c3 = window._c3Uplift || 0;
  var annual = c1 + c2 + c3;
  var avg = window._avgLineAmount || 0;
  var baselineMonthly = window._baselineMonthly || 0;
  var campaignMonth = Math.round(annual / 12);
  
  function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  set('ub-annual', annual > 0 ? fmt$(annual) : '--');
  set('ub-baseline-month', baselineMonthly > 0 ? fmt$(baselineMonthly) : '--');
  set('ub-campaign-month', campaignMonth > 0 ? '+' + fmt$(campaignMonth) : '--');
  set('ub-avg-txn', avg > 0 ? fmt$(avg) : '--');
  set('ub-c1', c1 > 0 ? fmt$(c1) + '/yr' : '--');
  set('ub-c2', c2 > 0 ? fmt$(c2) + '/yr' : '--');
  set('ub-c3', c3 > 0 ? fmt$(c3) + '/yr' : '--');
  
  loadCapturedRevenue();
  buildAvgTxnChart();
}

async function loadCapturedRevenue() {
  try {
    const res = await fetch('https://rnqhhzatlxmyvccdvqkr.supabase.co/rest/v1/campaign_items?select=captured_uplift,implemented_at&status=eq.implemented', {
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWhoemF0bHhteXZjY2R2cWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTQ5ODUsImV4cCI6MjA5MDU5MDk4NX0.zokle21pVEPG5bIOFiyZIWYkYIwhkolWNOhJ7Cbub30',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucWhoemF0bHhteXZjY2R2cWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMTQ5ODUsImV4cCI6MjA5MDU5MDk4NX0.zokle21pVEPG5bIOFiyZIWYkYIwhkolWNOhJ7Cbub30'
      }
    });
    
    if (!res.ok) {
      document.getElementById('ub-captured-total').textContent = '--';
      document.getElementById('ub-captured-yesterday').textContent = '--';
      return;
    }
    
    const items = await res.json();
    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);
    
    let total = 0;
    let yesterdayTotal = 0;
    
    items.forEach(item => {
      const uplift = parseFloat(item.captured_uplift) || 0;
      const implDate = new Date(item.implemented_at);
      total += uplift;
      if (implDate >= yesterday) yesterdayTotal += uplift;
    });
    
    document.getElementById('ub-captured-total').textContent = total > 0 ? fmt$(total) : '$0';
    document.getElementById('ub-captured-yesterday').textContent = yesterdayTotal > 0 ? '+' + fmt$(yesterdayTotal) : '$0';
  } catch (e) {
    console.error('Failed to load captured revenue:', e);
    document.getElementById('ub-captured-total').textContent = '--';
    document.getElementById('ub-captured-yesterday').textContent = '--';
  }
}

function buildAvgTxnChart() {
  const canvas = document.getElementById('avgTxnChart');
  if (!canvas || !window.serviceData || window.serviceData.length === 0) return;
  
  const byDate = {};
  window.serviceData.forEach(row => {
    const date = row.service_date;
    if (!date) return;
    const d = date.substring(0, 10);
    const amt = parseFloat(row.amount) || 0;
    if (!byDate[d]) byDate[d] = { total: 0, count: 0 };
    byDate[d].total += amt;
    byDate[d].count++;
  });
  
  const dates = Object.keys(byDate).sort().slice(-90);
  const values = dates.map(d => byDate[d].count > 0 ? byDate[d].total / byDate[d].count : 0);
  
  if (window._avgTxnChart) window._avgTxnChart.destroy();
  
  window._avgTxnChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates.map(d => d.substring(5)),
      datasets: [{
        data: values,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}`;

// Replace
html = html.substring(0, idx) + newFunc + html.substring(funcEnd + 1);
fs.writeFileSync('index.html', html, 'utf8');
console.log('✓ Updated refreshUpliftBoard + added helper functions');
