// PhishGuard AI - popup.js
// ✅ FIXED: Using Cloud API (no local server needed)

const API_BASE = "https://phishguard-ai-l251.onrender.com";

document.addEventListener("DOMContentLoaded", function () {
  const scanBtn = document.getElementById("scanBtn");
  const urlInput = document.getElementById("urlInput");
  const resultDiv = document.getElementById("result");
  const statusDiv = document.getElementById("status");

  // Get current tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0] && tabs[0].url) {
      urlInput.value = tabs[0].url;
    }
  });

  scanBtn.addEventListener("click", function () {
    const url = urlInput.value.trim();
    if (!url) {
      showResult("Please enter a URL", "warning");
      return;
    }
    scanURL(url);
  });

  function scanURL(url) {
    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning...";
    showStatus("Connecting to AI...");

    fetch(`${API_BASE}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url }),
    })
      .then((response) => response.json())
      .then((data) => {
        scanBtn.disabled = false;
        scanBtn.textContent = "SCAN THIS URL";
        hideStatus();

        if (data.error) {
          showResult("Error: " + data.error, "error");
          return;
        }

        const risk = data.risk_score || 0;
        const verdict = data.verdict || "Unknown";
        showVerdictResult(risk, verdict, url);
      })
      .catch((error) => {
        scanBtn.disabled = false;
        scanBtn.textContent = "SCAN THIS URL";
        showStatus("⚠️ API is waking up... please wait 30 seconds and try again", "error");
        console.error("Error:", error);
      });
  }

  function showVerdictResult(risk, verdict, url) {
    let color = "#00E676";
    let emoji = "✅";
    if (verdict === "DANGER") { color = "#FF3A6E"; emoji = "🚨"; }
    else if (verdict === "WARNING") { color = "#FFB800"; emoji = "🔶"; }
    else if (verdict === "CAUTION") { color = "#FFB800"; emoji = "⚠️"; }

    resultDiv.innerHTML = `
      <div style="text-align:center; padding:10px;">
        <div style="font-size:32px;">${emoji}</div>
        <div style="font-size:20px; font-weight:bold; color:${color};">${verdict}</div>
        <div style="font-size:28px; font-weight:bold; color:${color};">${risk}% Risk</div>
        <div style="font-size:11px; color:#4A6A88; margin-top:5px; word-break:break-all;">${url}</div>
      </div>
    `;
    resultDiv.style.display = "block";
  }

  function showResult(msg, type) {
    resultDiv.innerHTML = `<div style="padding:10px; color:#fff;">${msg}</div>`;
    resultDiv.style.display = "block";
  }

  function showStatus(msg, type) {
    statusDiv.textContent = msg;
    statusDiv.style.display = "block";
    statusDiv.style.color = type === "error" ? "#FF3A6E" : "#00E5FF";
  }

  function hideStatus() {
    statusDiv.style.display = "none";
  }
});
