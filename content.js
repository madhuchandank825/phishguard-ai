// PhishGuard AI - Content Script
// Scans all links on page and highlights dangerous ones

const API_BASE = "http://localhost:5000";
const SCAN_DELAY_MS = 2000; // Wait 2s after page loads before scanning links

// Track already-scanned URLs to avoid duplicate calls
const scannedUrls = new Set();

// Only run on real web pages
if (document.readyState === "complete") {
  setTimeout(scanPageLinks, SCAN_DELAY_MS);
} else {
  window.addEventListener("load", () => setTimeout(scanPageLinks, SCAN_DELAY_MS));
}

async function scanPageLinks() {
  const links = Array.from(document.querySelectorAll("a[href]"))
    .map(a => ({ el: a, url: a.href }))
    .filter(({ url }) =>
      (url.startsWith("http://") || url.startsWith("https://")) &&
      !scannedUrls.has(url)
    )
    .slice(0, 30); // Limit to 30 links per page to avoid overloading

  if (links.length === 0) return;

  const urls = links.map(l => l.url);
  urls.forEach(u => scannedUrls.add(u));

  try {
    const response = await fetch(`${API_BASE}/check-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls })
    });

    if (!response.ok) return;
    const data = await response.json();

    // Map results back to elements
    const resultMap = {};
    data.results.forEach(r => { resultMap[r.url] = r; });

    links.forEach(({ el, url }) => {
      const result = resultMap[url];
      if (!result) return;
      if (result.status === "DANGER") {
        markLink(el, "danger", result.risk_percent);
      } else if (result.status === "WARNING") {
        markLink(el, "warning", result.risk_percent);
      }
    });

  } catch (e) {
    // Backend offline — silently skip
  }
}

function markLink(el, type, riskPct) {
  const isDanger  = type === "danger";
  const color     = isDanger ? "#ff3a6e" : "#ffb800";
  const bgColor   = isDanger ? "rgba(255,58,110,0.12)" : "rgba(255,184,0,0.10)";
  const icon      = isDanger ? "🚨" : "⚠️";

  // Style the link
  el.style.outline       = `2px solid ${color}`;
  el.style.borderRadius  = "3px";
  el.style.backgroundColor = bgColor;

  // Add tooltip on hover
  el.title = `${icon} PhishGuard: ${riskPct}% phishing risk`;

  // Add a small warning icon after the link
  const badge = document.createElement("span");
  badge.textContent = icon;
  badge.style.cssText = `
    font-size: 12px;
    margin-left: 4px;
    cursor: default;
    vertical-align: middle;
  `;
  badge.title = `PhishGuard AI: ${riskPct}% phishing risk`;

  // Insert after link if parent allows
  try {
    if (el.parentNode && el.nextSibling) {
      el.parentNode.insertBefore(badge, el.nextSibling);
    } else if (el.parentNode) {
      el.parentNode.appendChild(badge);
    }
  } catch (e) {
    // DOM manipulation failed — skip
  }
}
