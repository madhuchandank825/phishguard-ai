// PhishGuard AI - Background Service Worker
// Monitors navigation and auto-checks URLs

const API_BASE = "http://localhost:5000";
const HIGH_RISK_THRESHOLD = 80; // Auto-warn if phishing risk > 80%

// Listen for completed page navigations
chrome.webNavigation.onCompleted.addListener(async (details) => {
  // Only check main frame (not iframes)
  if (details.frameId !== 0) return;

  const url = details.url;

  // Skip non-http URLs (extensions, chrome://, etc.)
  if (!url.startsWith("http://") && !url.startsWith("https://")) return;

  try {
    const response = await fetch(`${API_BASE}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) return;

    const data = await response.json();
    const riskPct = data.confidence?.phishing || 0;

    // Update badge
    updateBadge(data.verdict.status, details.tabId);

    // Show notification for high-risk URLs
    if (riskPct >= HIGH_RISK_THRESHOLD) {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "🚨 PhishGuard AI - Phishing Detected!",
        message: `High risk URL detected (${riskPct}% risk):\n${url.slice(0, 80)}`,
        priority: 2
      });
    }

  } catch (e) {
    // Backend not running - silently ignore
  }
}, { url: [{ schemes: ["http", "https"] }] });


// Update extension badge color based on result
function updateBadge(status, tabId) {
  const config = {
    "SAFE":    { text: "✓",  color: "#00e676" },
    "CAUTION": { text: "!",  color: "#ff8c00" },
    "WARNING": { text: "!!",  color: "#ffb800" },
    "DANGER":  { text: "⚠", color: "#ff3a6e" },
  };
  const cfg = config[status] || { text: "?", color: "#5a7a99" };
  chrome.action.setBadgeText({ text: cfg.text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: cfg.color, tabId });
}

// Reset badge on new navigation start
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return;
  chrome.action.setBadgeText({ text: "...", tabId: details.tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#1a2a40", tabId: details.tabId });
});
