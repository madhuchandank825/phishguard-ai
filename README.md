# 🛡️ PhishGuard AI

> AI-powered phishing URL detector built as a Chrome Extension with a Python ML backend.

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-orange?style=flat-square&logo=scikit-learn)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square&logo=flask)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-yellow?style=flat-square&logo=googlechrome)
![Accuracy](https://img.shields.io/badge/Accuracy-97.69%25-brightgreen?style=flat-square)
![Live](https://img.shields.io/badge/API-Live%20on%20Render-success?style=flat-square)

---

## 🔴 Live Demo

| Service | URL |
|---------|-----|
| 🌐 API | https://phishguard-ai-l251.onrender.com |
| 📊 Health Check | https://phishguard-ai-l251.onrender.com/ |

---

## 📸 Screenshots

### Chrome Extension
- ✅ Safe URL detected
- 🚨 Phishing URL detected with 70%+ risk score
- ⚠️ Suspicious signals breakdown

---

## 🧠 How It Works

```
User visits URL
      ↓
Chrome Extension captures URL
      ↓
Sends to Flask API (Render cloud)
      ↓
ML Model analyzes 30 features
      ↓
Returns risk score + verdict
      ↓
Extension shows result to user
```

---

## 🤖 ML Model

| Model | Accuracy |
|-------|----------|
| ✅ Random Forest (selected) | **97.69%** |
| Logistic Regression | ~92% |

### Dataset
- Source: Kaggle — UCI Phishing Website Dataset
- Total URLs: **11,055**
- Phishing: 4,898 | Safe: 6,157
- Features: **30 website characteristics**

### Features Analyzed
- IP address in URL
- HTTPS / SSL status
- Domain registration length
- URL length
- Suspicious TLD (.tk, .ml, .ga, .xyz)
- Phishing keywords (login, verify, secure...)
- Subdomain depth
- URL shortener detection
- And 22 more...

---

## 📁 Project Structure

```
phishguard-ai/
├── app.py                  ← Flask REST API
├── train_model.py          ← ML training script
├── requirements.txt        ← Python dependencies
├── phishguard_model.pkl    ← Trained ML model
├── feature_names.pkl       ← Feature column names
├── dataset.csv             ← Kaggle dataset
│
├── chrome_extension/       ← Chrome Extension
│   ├── manifest.json
│   ├── popup.html
│   ├── icons/
│   └── js/
│       ├── popup.js        ← Popup UI logic
│       ├── background.js   ← Auto-scan on navigation
│       └── content.js      ← Highlight links on page
│
└── website/
    └── index.html          ← Official launch website
```

---

## 🚀 Installation

### 1. Clone the repo
```bash
git clone https://github.com/madhuchandank825/phishguard-ai.git
cd phishguard-ai
```

### 2. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 3. Train the model
```bash
python train_model.py dataset.csv
```

### 4. Start the API server
```bash
python app.py
```
API runs at: `http://localhost:5000`

### 5. Load Chrome Extension
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `chrome_extension/` folder

---

## 📡 API Endpoints

### `GET /`
Health check
```json
{
  "service": "PhishGuard AI",
  "status": "running",
  "model_loaded": true
}
```

### `POST /check`
Check a single URL
```bash
curl -X POST https://phishguard-ai-l251.onrender.com/check \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypal-secure-login.tk/verify"}'
```

Response:
```json
{
  "url": "http://paypal-secure-login.tk/verify",
  "prediction": 1,
  "confidence": {
    "safe": 15.0,
    "phishing": 85.0
  },
  "verdict": {
    "status": "DANGER",
    "label": "Phishing Detected",
    "emoji": "🚨",
    "message": "This URL shows strong phishing indicators. Do NOT proceed."
  },
  "flags": [
    "Suspicious top-level domain (.tk, .ga, .xyz etc.)",
    "Phishing keywords found (login, verify, secure...)",
    "Hyphen in domain name"
  ]
}
```

### `POST /check-batch`
Check up to 50 URLs at once
```bash
curl -X POST https://phishguard-ai-l251.onrender.com/check-batch \
  -H "Content-Type: application/json" \
  -d '{"urls": ["https://google.com", "http://paypal.tk/login"]}'
```

---

## 🎯 Risk Levels

| Level | Risk Score | Meaning |
|-------|-----------|---------|
| ✅ Safe | 0% - 24% | No phishing indicators |
| 🔍 Low Risk | 25% - 44% | Minor suspicious signals |
| ⚠️ Warning | 45% - 69% | Multiple suspicious signals |
| 🚨 Danger | 70% - 99% | Strong phishing indicators |

---

## 🛠️ Tech Stack

- **ML Model**: scikit-learn (Random Forest)
- **Backend**: Python, Flask, Flask-CORS
- **Frontend**: HTML, CSS, JavaScript
- **Chrome Extension**: Manifest V3
- **Deployment**: Render.com (free tier)
- **Dataset**: Kaggle UCI Phishing Dataset

---

## 👥 Team

Built as a **Design Project 2026** by:
- **Madhu** (madhuchandank825) — Full Stack & ML

---

## 📄 License

MIT License — free to use for educational purposes.

---

⭐ **Star this repo if you found it useful!**
