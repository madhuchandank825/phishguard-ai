# 🛡️ PhishGuard AI — Chrome Extension

AI-powered phishing link detector using a scikit-learn ML model trained on real phishing data from Kaggle.

---

## 📁 Project Structure

```
phishguard/
├── backend/
│   ├── train_model.py     ← Train ML model on Kaggle dataset
│   ├── app.py             ← Flask API server
│   ├── requirements.txt   ← Python dependencies
│   └── dataset.csv        ← (you add this from Kaggle)
│
└── extension/
    ├── manifest.json
    ├── popup.html
    ├── icons/             ← Add icon PNGs here
    └── js/
        ├── popup.js       ← Popup UI logic
        ├── background.js  ← Auto-scans on navigation
        └── content.js     ← Highlights links on page
```

---

## 🗃️ Step 1: Get the Dataset from Kaggle

1. Go to one of these (free datasets):
   - **Recommended**: https://www.kaggle.com/datasets/taruntiwarihp/phishing-sites-urls
   - **Large (88K)**: https://www.kaggle.com/datasets/eswarchandt/phishing-website-detector
   - **Rich features**: https://www.kaggle.com/datasets/shashwatwork/web-page-phishing-detection-dataset

2. Download the CSV file
3. Rename it to `dataset.csv`
4. Place it inside the `backend/` folder

---

## 🧠 Step 2: Train the ML Model

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Train the model
python train_model.py dataset.csv
```

This will:
- Extract 25+ URL features (length, dots, keywords, TLD, IP, etc.)
- Train a Random Forest classifier
- Print accuracy + classification report
- Save `phishguard_model.pkl`

**Expected accuracy: 95–98%** depending on the dataset.

---

## 🚀 Step 3: Start the API Server

```bash
cd backend
python app.py
```

Server runs at: `http://localhost:5000`

Test it manually:
```bash
curl -X POST http://localhost:5000/check \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypa1-secure.tk/login"}'
```

---

## 🔌 Step 4: Load the Chrome Extension

1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer Mode** (top right toggle)
3. Click **"Load unpacked"**
4. Select the `extension/` folder
5. The PhishGuard icon will appear in your toolbar!

---

## 🎯 How It Works

| Component | Role |
|-----------|------|
| `train_model.py` | Extracts URL features, trains Random Forest on Kaggle data |
| `app.py` | Flask REST API — receives URLs, returns predictions |
| `popup.js` | Chrome popup UI — scan current page on click |
| `background.js` | Auto-scans every new page you navigate to |
| `content.js` | Highlights dangerous links on the page |

---

## 🧪 Features Extracted (25+)

- URL / domain / path length
- Number of dots, hyphens, slashes, `@` signs
- Contains IP address instead of domain
- HTTPS vs HTTP
- Suspicious TLDs (`.tk`, `.ml`, `.xyz`, etc.)
- URL shortener detection
- Suspicious keywords (`login`, `verify`, `paypal`, etc.)
- Subdomain depth
- Digit ratio
- ...and more

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/`             | Health check |
| POST | `/check`        | Check single URL |
| POST | `/check-batch`  | Check up to 50 URLs |

---

## 🛠️ Requirements

- Python 3.8+
- Chrome browser
- Kaggle account (free) to download dataset

---

## 👥 Team

PhishGuard AI — Design Project
