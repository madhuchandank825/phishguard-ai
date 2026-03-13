// PhishGuard AI - Popup Script
const API_BASE = "https://phishguard-ai-l251.onrender.com";

// ── DOM Elements ──
const currentUrlEl  = document.getElementById("currentUrl");
const scanBtn       = document.getElementById("scanBtn");
const loadingEl     = document.getElementById("loading");
const resultCard    = document.getElementById("resultCard");
const errorCard     = document.getElementById("errorCard");
const resultEmoji   = document.getElementById("resultEmoji");
const resultLabel   = document.getElementById("resultLabel");
const resultMsg     = document.getElementById("resultMsg");
const riskBar       = document.getElementById("riskBar");
const riskPct       = document.getElementById("riskPct");
const flagsList     = document.getElementById("flagsList");
const totalScanned  = document.getElementById("totalScanned");
const totalBlocked  = document.getElementById("totalBlocked");
const totalSafe     = document.getElementById("totalSafe");

let currentUrl = "";

// ── Init ──
document.addEventListener("DOMContentLoaded", async () => {
  loadStats();
  await getCurrentTab();
});

scanBtn.addEventListener("click", () => {
  if (currentUrl) scanUrl(currentUrl);
});

// ── Get Current Tab URL ──
async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      currentUrl = tab.url;
      currentUrlEl.textContent = truncate(currentUrl, 55);

      // Auto-scan if it's a real URL
      if (currentUrl.startsWith("http")) {
        scanUrl(currentUrl);
      } else {
        currentUrlEl.textContent = "Open a webpage to scan";
        scanBtn.disabled = true;
      }
    }
  } catch (e) {
    currentUrlEl.textContent = "Could not get current URL";
  }
}

// ── Main Scan Function ──
async function scanUrl(url) {
  showLoading(true);
  hideAll();
  scanBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || `Server error ${response.status}`);
    }

    const data = await response.json();
    showResult(data);
    updateStats(data.verdict.status);

  } catch (e) {
    showError(e.message);
  } finally {
    showLoading(false);
    scanBtn.disabled = false;
  }
}

// ── Show Result ──
function showResult(data) {
  const { verdict, confidence, flags } = data;

  // Set card class
  const statusMap = {
    "SAFE": "safe",
    "CAUTION": "caution",
    "WARNING": "warning",
    "DANGER": "danger"
  };
  resultCard.className = `result-card ${statusMap[verdict.status] || "warning"}`;

  resultEmoji.textContent = verdict.emoji;
  resultLabel.textContent = verdict.label;
  resultMsg.textContent   = verdict.message;

  // Risk bar
  const pct = confidence.phishing;
  riskPct.textContent = `${pct}%`;

  // Color the bar
  const barColor = verdict.status === "SAFE"    ? "#00e676"
                 : verdict.status === "CAUTION" ? "#ff8c00"
                 : verdict.status === "WARNING" ? "#ffb800"
                 : "#ff3a6e";

  riskBar.style.background = barColor;

  setTimeout(() => {
    riskBar.style.width = `${pct}%`;
  }, 100);

  // Flags
  flagsList.innerHTML = "";
  if (flags && flags.length > 0) {
    flags.forEach(flag => {
      const div = document.createElement("div");
      div.className = "flag-item";
      div.innerHTML = `<div class="flag-dot"></div><span>${flag}</span>`;
      flagsList.appendChild(div);
    });
  } else {
    flagsList.innerHTML = `<div class="no-flags">✓ No suspicious signals found</div>`;
  }

  resultCard.style.display = "block";
}

// ── Show Error ──
function showError(msg) {
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    errorCard.innerHTML = `
      <strong>⚠️ Backend not running</strong><br>
      Start the Python server:<br>
      <code style="color:#00e5ff">cd backend && python app.py</code>
    `;
  } else {
    errorCard.textContent = `Error: ${msg}`;
  }
  errorCard.style.display = "block";
}

// ── Helpers ──
function showLoading(show) {
  loadingEl.style.display = show ? "flex" : "none";
}

function hideAll() {
  resultCard.style.display = "none";
  errorCard.style.display = "none";
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + "..." : str;
}

// ── Stats (stored in chrome.storage) ──
function updateStats(status) {
  chrome.storage.local.get(["scanned","blocked","safe"], (data) => {
    const scanned = (data.scanned || 0) + 1;
    const blocked = (data.blocked || 0) + (status === "DANGER" ? 1 : 0);
    const safe    = (data.safe    || 0) + (status === "SAFE"   ? 1 : 0);
    chrome.storage.local.set({ scanned, blocked, safe });
    totalScanned.textContent = scanned;
    totalBlocked.textContent = blocked;
    totalSafe.textContent    = safe;
  });
}

function loadStats() {
  chrome.storage.local.get(["scanned","blocked","safe"], (data) => {
    totalScanned.textContent = data.scanned || 0;
    totalBlocked.textContent = data.blocked || 0;
    totalSafe.textContent    = data.safe    || 0;
  });
}
