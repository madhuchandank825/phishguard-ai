// PhishGuard AI - background.js
// ✅ FIXED: Using Cloud API (no local server needed)

const API_BASE = "https://phishguard-ai-l251.onrender.com";

chrome.webNavigation.onCompleted.addListener(function (details) {
  if (details.frameId !== 0) return;

  const url = details.url;

  // Skip internal browser pages
  if (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://") ||
    url === ""
  ) return;

  checkURL(url, details.tabId);
}, { url: [{ schemes: ["http", "https"] }] });

function checkURL(url, tabId) {
  fetch(`${API_BASE}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: url }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) return;

      const risk = data.risk_score || 0;
      const verdict = data.verdict || "SAFE";

      // Store result for popup
      chrome.storage.local.set({
        lastResult: { url, risk, verdict, timestamp: Date.now() }
      });

      // Alert if DANGER (80%+)
      if (verdict === "DANGER" || risk >= 80) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "🚨 PhishGuard AI — DANGER!",
          message: `Phishing detected! Risk: ${risk}%\n${url}`,
          priority: 2,
        });
      }
    })
    .catch((error) => {
      console.log("PhishGuard: API not reachable yet -", error.message);
    });
}
