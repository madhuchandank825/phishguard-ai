from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import re
import os
from datetime import datetime
from urllib.parse import urlparse

app = Flask(__name__)
CORS(app)

model = None
feature_cols = None

def load_model():
    global model, feature_cols
    if os.path.exists("phishguard_model.pkl") and os.path.exists("feature_names.pkl"):
        with open("phishguard_model.pkl", "rb") as f:
            model = pickle.load(f)
        with open("feature_names.pkl", "rb") as f:
            feature_cols = pickle.load(f)
        print(f"[OK] Model loaded with {len(feature_cols)} features")
    else:
        print("[!] Model not found. Run train_model.py first.")

load_model()

def get_verdict(prob_phishing):
    if prob_phishing >= 70:
        return {"status": "DANGER",  "label": "Phishing Detected", "emoji": "🚨", "color": "#ff3a6e", "message": "This URL shows strong phishing indicators. Do NOT proceed.", "risk_level": "HIGH"}
    elif prob_phishing >= 45:
        return {"status": "WARNING", "label": "Suspicious URL",    "emoji": "⚠️", "color": "#ffb800", "message": "This URL has suspicious characteristics. Proceed with caution.", "risk_level": "MEDIUM"}
    elif prob_phishing >= 25:
        return {"status": "CAUTION", "label": "Low Risk",          "emoji": "🔍", "color": "#ff8c00", "message": "Minor suspicious indicators found.", "risk_level": "LOW"}
    else:
        return {"status": "SAFE",    "label": "Safe URL",          "emoji": "✅", "color": "#00e676", "message": "No phishing indicators detected.", "risk_level": "NONE"}

@app.route("/", methods=["GET"])
def health():
    return jsonify({"service": "PhishGuard AI", "status": "running", "model_loaded": model is not None})

@app.route("/check", methods=["POST"])
def check_url():
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "Missing 'url' field"}), 400

    url = str(data["url"]).strip()

    # Whitelist localhost
    if any(s in url for s in ["127.0.0.1", "localhost", "chrome://", "chrome-extension://"]):
        return jsonify({
            "url": url, "prediction": 0,
            "confidence": {"safe": 99.0, "phishing": 1.0},
            "verdict": {"status": "SAFE", "label": "Safe URL", "emoji": "✅", "color": "#00e676", "message": "Local development URL.", "risk_level": "NONE"},
            "flags": [], "timestamp": datetime.utcnow().isoformat()
        })

    try:
        parsed = urlparse(url if url.startswith("http") else "http://" + url)
        domain = parsed.netloc or ""
    except:
        domain = ""

    # Analyze URL
    has_ip         = bool(re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', domain))
    is_https       = url.lower().startswith("https")
    has_at         = "@" in url
    has_double     = "//" in url[8:]
    has_hyphen     = "-" in domain
    url_len        = len(url)
    suspicious_tld = any(domain.endswith(t) for t in [".tk",".ml",".ga",".cf",".xyz",".top",".click",".work",".party"])
    is_shortened   = any(s in domain for s in ["bit.ly","tinyurl","goo.gl","t.co","ow.ly"])
    subdomain_depth= max(0, len(domain.replace("www.","").split(".")) - 2)
    phish_keywords = sum(k in url.lower() for k in ["login","signin","verify","secure","account","update","banking","paypal","confirm","password","ebay","amazon","apple","microsoft"])

    # Count suspicious signals
    suspicious_count = sum([
        has_ip, not is_https, has_at, has_double,
        has_hyphen, url_len > 75, suspicious_tld,
        is_shortened, subdomain_depth >= 2, phish_keywords >= 1
    ])

    # Build feature row — start all safe (1)
    row = {col: 1 for col in feature_cols}

    # Set suspicious features to -1
    if has_ip:
        for col in ["having_IPhaving_IP_Address"]:
            if col in row: row[col] = -1
    if not is_https:
        for col in ["SSLfinal_State", "HTTPS_token"]:
            if col in row: row[col] = -1
    if has_at:
        for col in ["having_At_Symbol"]:
            if col in row: row[col] = -1
    if has_double:
        for col in ["double_slash_redirecting"]:
            if col in row: row[col] = -1
    if has_hyphen:
        for col in ["Prefix_Suffix"]:
            if col in row: row[col] = -1
    if url_len > 75:
        for col in ["URLURL_Length"]:
            if col in row: row[col] = -1
    if suspicious_tld or is_shortened:
        for col in ["Shortining_Service", "having_Sub_Domain", "SSLfinal_State"]:
            if col in row: row[col] = -1
    if subdomain_depth >= 2:
        for col in ["having_Sub_Domain"]:
            if col in row: row[col] = -1
    if phish_keywords >= 1:
        for col in ["Abnormal_URL", "Submitting_to_email", "Request_URL"]:
            if col in row: row[col] = -1

    features_df = pd.DataFrame([row])
    prediction = int(model.predict(features_df)[0])
    probabilities = model.predict_proba(features_df)[0]
    prob_phishing = round(float(probabilities[1]) * 100, 1)

    # Boost score based on suspicious signals
    if suspicious_count >= 3:
        prob_phishing = max(prob_phishing, 55 + (suspicious_count * 5))
    elif suspicious_count == 2:
        prob_phishing = max(prob_phishing, 45)
    elif suspicious_count == 1:
        prob_phishing = max(prob_phishing, 25)

    prob_phishing = min(prob_phishing, 99.0)

    verdict = get_verdict(prob_phishing)

    # Build flags
    flags = []
    if has_ip:           flags.append("Uses IP address instead of domain name")
    if not is_https:     flags.append("No HTTPS (insecure connection)")
    if has_at:           flags.append("Contains '@' sign in URL")
    if suspicious_tld:   flags.append("Suspicious top-level domain (.tk, .ga, .xyz etc.)")
    if is_shortened:     flags.append("URL shortener detected")
    if url_len > 75:     flags.append("Unusually long URL")
    if has_hyphen:       flags.append("Hyphen in domain name")
    if phish_keywords >= 1: flags.append("Phishing keywords found (login, verify, secure...)")
    if subdomain_depth >= 2: flags.append("Deep subdomain nesting")

    print(f"[{verdict['status']}] {url[:60]} | Risk: {prob_phishing}% | Signals: {suspicious_count}")

    return jsonify({
        "url": url,
        "prediction": prediction,
        "confidence": {"safe": round(100 - prob_phishing, 1), "phishing": prob_phishing},
        "verdict": verdict,
        "flags": flags,
        "timestamp": datetime.utcnow().isoformat()
    })

@app.route("/check-batch", methods=["POST"])
def check_batch():
    data = request.get_json()
    if not data or "urls" not in data:
        return jsonify({"error": "Missing 'urls' field"}), 400
    results = []
    for url in data["urls"][:50]:
        try:
            with app.test_request_context('/check', method='POST', json={"url": str(url)}):
                resp = check_url()
                r = resp.get_json()
                results.append({"url": url, "status": r["verdict"]["status"], "risk_percent": r["confidence"]["phishing"]})
        except Exception as e:
            results.append({"url": url, "status": "ERROR", "error": str(e)})
    return jsonify({"results": results, "count": len(results)})

if __name__ == "__main__":
    print("\n PhishGuard AI API running at http://localhost:5000\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
