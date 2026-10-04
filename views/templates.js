function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 1. Safe Whitepage for Facebook Crawler / Social Bots
function renderCrawlerSafePage(link, canonicalUrl) {
  const title = escapeHtml(link.title || 'Special Verified Link');
  const description = escapeHtml(link.description || 'Verified safe link preview content.');
  const imageUrl = escapeHtml(link.imageUrl);

  return `<!DOCTYPE html>
<html lang="bn" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph Meta Tags for Facebook -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Verified Story">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">

  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 40px 20px;
      background: #f8fafc;
      color: #1e293b;
      line-height: 1.6;
    }
    .safe-container {
      max-width: 680px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .safe-img {
      width: 100%;
      height: auto;
      max-height: 380px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      color: #0f172a;
      margin-top: 0;
    }
    p {
      color: #475569;
      font-size: 16px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 12px;
      font-weight: 600;
      color: #059669;
      background: #d1fae5;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <article class="safe-container">
    <span class="badge">✓ Verified &amp; Safe Content</span>
    <img src="${imageUrl}" alt="${title}" class="safe-img">
    <h1>${title}</h1>
    <p>${description}</p>
    <p>This content has been verified for community standards and complies with all safe browsing guidelines.</p>
  </article>
</body>
</html>`;
}

// 2. Smart Shield: Instant Referrer Masking & Seamless JS Redirect
function renderSmartShield(link, destination) {
  const safeDest = destination; // Will be properly JSON stringified
  const title = escapeHtml(link.title || 'Redirecting...');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <meta http-equiv="refresh" content="1;url=${escapeHtml(safeDest)}">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 20px;
    }
    .shield-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      padding: 36px 28px;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .icon-pulse {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
      animation: pulse 1.8s infinite ease-in-out;
    }
    .icon-pulse svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); opacity: 0.85; }
    }
    h2 { font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #f8fafc; }
    p { font-size: 14px; color: #94a3b8; margin-bottom: 20px; }
    .loader-bar {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .loader-fill {
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, #3b82f6, #06b6d4);
      border-radius: 4px;
      animation: sweep 1.2s infinite ease-in-out;
    }
    @keyframes sweep {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    }
    .manual-link {
      font-size: 13px;
      color: #38bdf8;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .manual-link:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="shield-box">
    <div class="icon-pulse">
      <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
    </div>
    <h2>Redirecting Securely...</h2>
    <p>Link verification complete. Please wait a moment.</p>
    <div class="loader-bar">
      <div class="loader-fill"></div>
    </div>
    <a id="directLink" href="${escapeHtml(safeDest)}" rel="noreferrer" class="manual-link">If not redirected automatically, click here</a>
  </div>

  <script>
    const dest = ${JSON.stringify(safeDest)};
    // Immediate clean referrer stripped redirection
    try {
      window.location.replace(dest);
    } catch(e) {
      window.location.href = dest;
    }
  </script>
</body>
</html>`;
}

// 3. Interactive Safe Bridge Page (Countdown & Button)
function renderBridgePage(link, destination) {
  const title = escapeHtml(link.title || 'Special Promotion');
  const description = escapeHtml(link.description || 'Exclusive offer details available now.');
  const imageUrl = escapeHtml(link.imageUrl);
  const safeDest = destination;
  const delay = Math.max(1, Number(link.bridgeDelay) || 2);

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="no-referrer">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090d16 100%);
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Hind Siliguri", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .bridge-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      max-width: 520px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.7);
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .preview-img-wrap {
      width: 100%;
      height: 240px;
      position: relative;
      background: #0f172a;
    }
    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .badge-float {
      position: absolute;
      top: 16px;
      left: 16px;
      background: rgba(16, 185, 129, 0.9);
      color: white;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      backdrop-filter: blur(4px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
    }
    .bridge-content {
      padding: 28px 24px 32px;
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.4;
      margin-bottom: 12px;
      color: #ffffff;
    }
    p {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .cta-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 16px;
      font-size: 16px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border: none;
      border-radius: 14px;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5);
      transition: all 0.2s ease;
    }
    .cta-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.6);
      background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
    }
    .timer-info {
      text-align: center;
      font-size: 13px;
      color: #64748b;
      margin-top: 16px;
    }
    .timer-count {
      font-weight: 700;
      color: #38bdf8;
    }
  </style>
</head>
<body>
  <div class="bridge-card">
    <div class="preview-img-wrap">
      <img src="${imageUrl}" alt="${title}" class="preview-img">
      <span class="badge-float">🛡️ Facebook Safe Shield Active</span>
    </div>
    <div class="bridge-content">
      <h1>${title}</h1>
      <p>${description}</p>
      
      <a id="proceedBtn" href="${escapeHtml(safeDest)}" rel="noreferrer" class="cta-btn">
        <span>Click here to view offer</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </a>

      <div class="timer-info">
        Redirecting automatically in: <span id="countdown" class="timer-count">${delay}</span>s
      </div>
    </div>
  </div>

  <script>
    let timeLeft = ${delay};
    const dest = ${JSON.stringify(safeDest)};
    const countdownEl = document.getElementById('countdown');

    const timer = setInterval(() => {
      timeLeft--;
      if (countdownEl) countdownEl.innerText = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        try {
          window.location.replace(dest);
        } catch(e) {
          window.location.href = dest;
        }
      }
    }, 1000);
  </script>
</body>
</html>`;
}

module.exports = {
  renderCrawlerSafePage,
  renderSmartShield,
  renderBridgePage
};
