const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { db } = require('./database');
const { renderCrawlerSafePage, renderSmartShield, renderBridgePage } = require('./views/templates');

const app = express();
const PORT = process.env.PORT || 4000;

// Express Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Support Netlify Functions route rewriting
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/server')) {
    req.url = req.url.replace('/.netlify/functions/server', '') || '/';
  }
  next();
});

// Serve static assets directly from public
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/public', express.static(path.resolve(__dirname, 'public')));
app.use('/css', express.static(path.resolve(__dirname, 'public', 'css')));
app.use('/js', express.static(path.resolve(__dirname, 'public', 'js')));

// Reserved routes that shouldn't be treated as short slugs
const RESERVED_SLUGS = new Set([
  'api', 'admin', 'dashboard', 'public', 'css', 'js', 'assets',
  'favicon.ico', 'robots.txt', 'sitemap.xml', 'health', 'domain-setup',
  'airana1713@admin', 'airana1713%40admin'
]);

// Helper to detect social bots and scrapers
function checkIsBot(userAgent = '') {
  const ua = (userAgent || '').toLowerCase();
  
  if (ua.includes('facebookexternalhit') || ua.includes('facebot') || ua.includes('meta-externalagent')) {
    return { isBot: true, botName: 'Facebook Crawler' };
  }
  if (ua.includes('twitterbot')) {
    return { isBot: true, botName: 'Twitter / X Bot' };
  }
  if (ua.includes('telegrambot')) {
    return { isBot: true, botName: 'Telegram Bot' };
  }
  if (ua.includes('whatsapp')) {
    return { isBot: true, botName: 'WhatsApp Preview' };
  }
  if (ua.includes('linkedinbot')) {
    return { isBot: true, botName: 'LinkedIn Bot' };
  }
  if (ua.includes('discordbot')) {
    return { isBot: true, botName: 'Discord Bot' };
  }
  if (ua.includes('slackbot')) {
    return { isBot: true, botName: 'Slack Bot' };
  }
  if (ua.includes('googlebot') || ua.includes('google-inspectiontool')) {
    return { isBot: true, botName: 'Google Bot' };
  }
  return { isBot: false, botName: null };
}

// Detect simple device type
function detectDevice(userAgent = '') {
  const ua = (userAgent || '').toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(ua)) return 'Mobile';
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

// --- ADMIN PORTAL ROUTES (Direct & Secret) ---
app.get(['/admin', '/admin.html', '/airana1713@admin', '/airana1713%40admin'], (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'admin.html'));
});

// --- ROOT & USER DASHBOARD (Defined BEFORE :slug) ---
app.get(['/', '/dashboard'], (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});


// --- API ROUTES ---

// --- AUTH ROUTES ---
app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = db.registerUser(name, email, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const user = db.loginUser(identifier || email, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/demo-login', (req, res) => {
  try {
    const demoId = 'usr_guest_' + Date.now().toString().slice(-6);
    const demoUser = db.registerUser('New Member', `${demoId}@linkshield.pro`, 'guest1234');
    res.json({ success: true, user: demoUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// User Profile Management
app.get('/api/user/profile', (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });
    const users = db.getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        tier: user.tier || 'FREE PACK',
        walletBalance: user.walletBalance || 0,
        activePlan: user.activePlan || {}
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/user/profile', (req, res) => {
  try {
    const { userId, name, phone, password } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });
    const updates = {};
    if (name) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (password && password.length >= 4) updates.password = password;
    const updated = db.updateUser(userId, updates);
    res.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || '',
        tier: updated.tier || 'FREE PACK',
        walletBalance: updated.walletBalance || 0,
        activePlan: updated.activePlan || {}
      },
      message: 'Profile updated successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Support Tickets API
app.get('/api/tickets', (req, res) => {
  try {
    const userId = req.query.userId || null;
    const tickets = db.getTickets(userId);
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tickets', (req, res) => {
  try {
    const { userId, subject, category, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, error: 'Subject and message are required' });
    }
    const ticket = db.createTicket(userId, { subject, category, message });
    res.json({ success: true, data: ticket, message: 'Ticket submitted successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 0. Public Settings & Dynamic Plans
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/plans', (req, res) => {
  try {
    const plans = db.getAllPlans();
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Get stats (isolated per user)
app.get('/api/stats', (req, res) => {
  try {
    const userId = req.query.userId || null;
    const stats = db.getStats(userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Wallet & Plan
app.get('/api/wallet', (req, res) => {
  try {
    const userId = req.query.userId || null;
    const info = db.getWalletAndPlan(userId);
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Manual payment deposit / plan purchase submission (bKash / Nagad / Rocket)
app.post('/api/wallet/deposit', (req, res) => {
  try {
    const { userId, amount, method, senderNumber, trxId, planId, planName } = req.body;
    const invoice = db.submitPaymentOrder({
      userId,
      amount,
      method,
      senderNumber,
      trxId,
      planId,
      planName
    });
    res.json({ success: true, data: invoice, invoice: invoice, message: "পেমেন্ট রিকোয়েস্ট সফলভাবে জমা হয়েছে। এডমিন ভেরিফাই করে অনুমোদন করবে।" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/plans/order', (req, res) => {
  try {
    const { userId, planId, method, senderNumber, trxId } = req.body;
    const plans = db.getAllPlans();
    const plan = plans.find(p => p.id === planId);
    if (!plan) return res.status(404).json({ success: false, error: "Plan not found" });

    const invoice = db.submitPaymentOrder({
      userId,
      amount: plan.price,
      method,
      senderNumber,
      trxId,
      planId: plan.id,
      planName: `${plan.name} (${plan.clicks.toLocaleString()} Clicks)`
    });
    res.json({ success: true, data: invoice, invoice: invoice, message: "অর্ডারটি সফলভাবে জমা হয়েছে। এডমিন ভেরিফাই করে এক্টিভ করবে।" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/invoices', (req, res) => {
  try {
    const userId = req.query.userId || null;
    const info = db.getWalletAndPlan(userId);
    res.json({ success: true, data: info.invoices || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get links (isolated per user)
app.get('/api/links', (req, res) => {
  try {
    const userId = req.query.userId || null;
    const links = db.getAllLinks(userId);
    const domains = (db.getAllDomains() || []).filter(d => d.status === 'active');
    res.json({ success: true, data: links, domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Create new link
app.post('/api/links', (req, res) => {
  try {
    const { userId, targetUrl, slug, subdomain, title, description, imageUrl, domainId, redirectMode, bridgeDelay } = req.body;

    if (!targetUrl) {
      return res.status(400).json({ success: false, error: 'Target destination URL is required.' });
    }

    let validTarget = targetUrl.trim();
    if (!/^https?:\/\//i.test(validTarget)) {
      validTarget = 'https://' + validTarget;
    }

    const newLink = db.createLink({
      userId,
      targetUrl: validTarget,
      slug,
      subdomain,
      title,
      description,
      imageUrl,
      domainId,
      redirectMode,
      bridgeDelay
    });

    res.json({ success: true, data: newLink });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Update link (unlimited times)
app.put('/api/links/:id', (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    if (updateData.targetUrl) {
      let validTarget = updateData.targetUrl.trim();
      if (!/^https?:\/\//i.test(validTarget)) {
        validTarget = 'https://' + validTarget;
      }
      updateData.targetUrl = validTarget;
    }

    const updated = db.updateLink(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Link not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete link
app.delete('/api/links/:id', (req, res) => {
  try {
    const { id } = req.params;
    const ok = db.deleteLink(id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Domains API
app.get('/api/domains', (req, res) => {
  try {
    const domains = db.getAllDomains();
    res.json({ success: true, data: domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/domains', (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain name is required' });
    }
    const created = db.addDomain(domain);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/domains/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.deleteDomain(id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 7. System info
app.get('/api/system-info', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  for (const k in networkInterfaces) {
    for (const k2 in networkInterfaces[k]) {
      const address = networkInterfaces[k][k2];
      if (address.family === 'IPv4' && !address.internal) {
        addresses.push(address.address);
      }
    }
  }

  res.json({
    host: req.get('host'),
    protocol: req.protocol,
    serverIps: addresses,
    port: PORT
  });
});

// --- ADMIN API ENDPOINTS ---
app.post('/api/admin/login', (req, res) => {
  try {
    const email = (req.body.email || req.body.username || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const users = db.getAllUsers();
    // Allow login if airana1713@admin, admin, or any user with role === 'admin'
    const admin = users.find(u => 
      (u.email.toLowerCase() === email || (email === 'airana1713' && u.email === 'airana1713@admin') || (email === 'admin' && (u.role === 'admin' || u.email === 'airana1713@admin'))) &&
      u.role === 'admin'
    );

    // Universal master admin credentials (admin / admin or airana1713@admin / admin)
    const isMasterUser = email === 'admin' || email === 'airana1713@admin' || email === 'airana1713' || email === 'admin@admin' || email === 'admin@linkshield.pro';
    const isMasterPass = password === 'admin' || password === 'admin1234' || (admin && admin.password === password);

    if (isMasterUser && isMasterPass) {
      return res.json({
        success: true,
        admin: {
          id: admin ? admin.id : 'admin_airana_1713',
          name: admin ? admin.name : 'Super Admin',
          email: 'admin@linkshield.pro',
          role: 'admin',
          tier: 'SUPER ADMIN'
        }
      });
    }

    if (!admin) {
      return res.status(403).json({ success: false, error: 'Access denied: Not an administrator account' });
    }

    // Check full user record for password
    const all = db.getAllUsers();
    const full = all.find(u => u.id === admin.id);
    const stored = full ? full.password : null;
    if (stored && stored !== password && password !== 'admin') {
      return res.status(401).json({ success: false, error: 'Incorrect administrator password' });
    }

    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const stats = db.getAdminStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/users/:id/update', (req, res) => {
  try {
    const updated = db.updateUser(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  try {
    db.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/admins/add', (req, res) => {
  try {
    const { name, email, password } = req.body;
    const newAdmin = db.createAdmin(name, email, password);
    res.json({ success: true, data: newAdmin });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/links', (req, res) => {
  try {
    const links = db.getAllLinksAdmin();
    res.json({ success: true, data: links });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/links/:id/toggle', (req, res) => {
  try {
    const link = db.toggleLinkAdmin(req.params.id);
    res.json({ success: true, data: link });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/links/:id', (req, res) => {
  try {
    db.deleteLinkAdmin(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/domains', (req, res) => {
  try {
    const domains = db.getAllDomainsAdmin();
    res.json({ success: true, data: domains });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/domains/add', (req, res) => {
  try {
    const { domain, tierRequired, dnsTarget, dnsType } = req.body;
    const newDom = db.addDomainAdmin(domain, tierRequired, dnsTarget, dnsType);
    res.json({ success: true, data: newDom });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/domains/:id/toggle', (req, res) => {
  try {
    const dom = db.toggleDomainAdmin(req.params.id);
    res.json({ success: true, data: dom });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/domains/:id', (req, res) => {
  try {
    db.deleteDomainAdmin(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/invoices', (req, res) => {
  try {
    const invoices = db.getAllInvoicesAdmin();
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/invoices/:id/approve', (req, res) => {
  try {
    const inv = db.approveInvoiceAdmin(req.params.id);
    res.json({ success: true, data: inv, message: "Invoice approved & user plan/wallet updated" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/invoices/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    const inv = db.rejectInvoiceAdmin(req.params.id, reason);
    res.json({ success: true, data: inv, message: "Invoice rejected" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/invoices/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    if (status === 'Paid' || status === 'Approved') {
      const inv = db.approveInvoiceAdmin(req.params.id);
      return res.json({ success: true, data: inv, message: "Invoice approved & activated" });
    } else {
      const inv = db.rejectInvoiceAdmin(req.params.id, req.body.reason || 'Rejected by admin');
      return res.json({ success: true, data: inv, message: "Invoice rejected" });
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Plans Management API (Admin)
app.get('/api/admin/plans', (req, res) => {
  try {
    const plans = db.getAllPlans();
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/plans', (req, res) => {
  try {
    const plan = db.createPlan(req.body);
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/admin/plans/:id', (req, res) => {
  try {
    const updated = db.updatePlan(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.delete('/api/admin/plans/:id', (req, res) => {
  try {
    db.deletePlan(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/admin/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/admin/settings/update', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- SHORT URL REDIRECTION & ANTI-BAN SHIELD ROUTE ---
app.get('/:slug', (req, res, next) => {
  const { slug } = req.params;

  // Skip reserved routes
  if (RESERVED_SLUGS.has(slug.toLowerCase())) {
    return next();
  }

  const hostname = req.get('host') || '';
  const link = db.getLinkBySlug(slug, hostname);

  if (!link) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Link Not Found - LinkShield</title>
        <style>
          body { font-family: sans-serif; background: #080c14; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .card { background: #0f172a; padding: 40px; border-radius: 16px; max-width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          h1 { color: #f43f5e; margin-bottom: 12px; font-size: 22px; }
          p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
          a { color: #38bdf8; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ Link Inactive or Not Found</h1>
          <p>The short link <strong>/${escape(slug)}</strong> could not be found or has been disabled.</p>
          <a href="/">Go to Homepage</a>
        </div>
      </body>
      </html>
    `);
  }

  // Check link creator's subscription quota & expiry
  const creator = db.getUserById(link.userId);
  if (creator && creator.role !== 'admin') {
    const plan = creator.activePlan || {};
    const isExpired = plan.expiresAt && new Date(plan.expiresAt) < new Date();
    const noClicks = plan.clicksLeft !== undefined && plan.clicksLeft <= 0;

    if (isExpired || noClicks) {
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Link Paused - LinkShield</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #080c14; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #0f172a; padding: 40px 32px; border-radius: 20px; max-width: 440px; box-shadow: 0 14px 40px rgba(0,0,0,0.8); border: 1px solid rgba(245, 158, 11, 0.35); }
            h1 { color: #f59e0b; margin-bottom: 14px; font-size: 22px; font-weight: 800; }
            p { color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
            a { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; text-decoration: none; font-weight: 800; padding: 10px 24px; border-radius: 12px; font-size: 13.5px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>⚠️ Link Paused / Plan Limit Reached</h1>
            <p>This short link is currently paused because the creator's subscription has expired or the visitor click quota has been reached.</p>
            <a href="/">Renew Plan on LinkShield Pro</a>
          </div>
        </body>
        </html>
      `);
    }
  }

  // Detect visitor / crawler
  const userAgent = req.get('user-agent') || '';
  const { isBot, botName } = checkIsBot(userAgent);
  const device = isBot ? 'Social Bot' : detectDevice(userAgent);
  const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const ip = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : '127.0.0.1';
  const referrer = req.get('referrer') || (isBot ? botName : 'Direct / Masked');

  // Record click & analytics
  db.recordClick(link.id, {
    ip,
    userAgent,
    device,
    isBot,
    botName,
    referrer
  });

  const fullCanonicalUrl = `${req.protocol}://${req.get('host')}/${link.slug}`;

  // 1. FACEBOOK / SOCIAL BOT SHIELD:
  if (isBot) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderCrawlerSafePage(link, fullCanonicalUrl));
  }

  // 2. REAL VISITOR: INSTANT 302 REDIRECT (No waiting / zero delay!)
  return res.redirect(302, link.targetUrl);
});

// Start Server (when run directly or locally)
if (require.main === module || (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME)) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🛡️ LinkShield Pro - Facebook Anti-Ban URL Shortener`);
    console.log(`🚀 Server running on: http://localhost:${PORT}`);
    console.log(`📊 Dashboard accessible at: http://localhost:${PORT}/`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
