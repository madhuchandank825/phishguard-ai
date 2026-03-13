// PhishGuard AI - content.js
// ✅ FIXED: Using Cloud API (no local server needed)

const API_BASE = "https://phishguard-ai-l251.onrender.com";

// Scan all links on the page
function scanPageLinks() {
  const links = document.querySelectorAll("a[href]");
  links.forEach((link) => {
    const href = link.href;
    if (!href || href.startsWith("javascript:") || href.startsWith("#")) return;
    if (!href.startsWith("http")) return;

    fetch(`${API_BASE}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: href }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;
        const risk = data.risk_score || 0;
        const verdict = data.verdict || "SAFE";

        if (verdict === "DANGER" || risk >= 70) {
          link.style.border = "2px solid #FF3A6E";
          link.style.borderRadius = "3px";
          link.title = `⚠️ PhishGuard AI: DANGER — ${risk}% risk`;
        } else if (verdict === "WARNING" || risk >= 45) {
          link.style.border = "2px solid #FFB800";
          link.style.borderRadius = "3px";
          link.title = `⚠️ PhishGuard AI: WARNING — ${risk}% risk`;
        }
      })
      .catch(() => {});
  });
}

// Run after page loads
if (document.readyState === "complete") {
  scanPageLinks();
} else {
  window.addEventListener("load", scanPageLinks);
}
