const fs = require('fs');
const path = require('path');
const os = require('os');

// Detect serverless environment (Netlify, AWS Lambda, Vercel)
const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.VERCEL);
const SEED_FILE = path.join(__dirname, 'data', 'database.json');
const DATA_DIR = isServerless ? path.join(os.tmpdir(), 'linkshield_data') : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create DATA_DIR:", e.message);
}

// Initial state schema
const defaultData = {
  settings: {
    appName: "LinkShield Pro",
    primaryHost: "localhost:4000",
    defaultRedirectMode: "smart_shield"
  },
  users: [
    {
      id: "usr_default_1",
      name: "MD Rifat",
      email: "mdrifat1234gsh@gmail.com",
      phone: "01789123456",
      password: "password123",
      tier: "GROWTH PACK",
      avatarInitials: "MD",
      walletBalance: 0.00,
      activePlan: {
        name: "Growth Pack",
        clicksLeft: 31284,
        usedClicks: 18716,
        clicksLimit: 50000,
        freeClicks: 0,
        emergencyClicks: 0,
        purchasedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString()
    }
  ],
  domains: [
    {
      id: "domain_linkshield_pro",
      domain: "linkshield.pro",
      status: "active",
      isPrimary: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "domain_linkshield_link",
      domain: "linkshield.link",
      status: "active",
      isPrimary: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "domain_linkshield_co",
      domain: "linkshield.co",
      status: "active",
      isPrimary: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "domain_local",
      domain: "localhost:4000",
      status: "active",
      isPrimary: false,
      createdAt: new Date().toISOString()
    }
  ],
  links: [
    {
      id: "link_bn4zu",
      userId: "usr_default_1",
      slug: "bn4zu",
      subdomain: "bn4zu",
      targetUrl: "https://adsterra.com/cpa-offer-2026",
      title: "🔥 Special High-Converting Deal - 50% Off Limited Time!",
      description: "Grab the top offer today. Limited stock available. Click here to view details.",
      imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=630&q=80",
      domainId: "domain_linkshield_pro",
      redirectMode: "smart_shield",
      bridgeDelay: 2,
      isActive: true,
      clicks: 2306,
      todayClicks: 4549,
      yesterdayClicks: 14164,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "link_cr5p1",
      userId: "usr_default_1",
      slug: "cr5p1",
      subdomain: "cr5p1",
      targetUrl: "https://example.com/bonus-promo",
      title: "⚡ Exclusive Instant Cash Bonus Claim",
      description: "Activate your bonus offer today before countdown ends.",
      imageUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&h=630&q=80",
      domainId: "domain_linkshield_link",
      redirectMode: "bridge_page",
      bridgeDelay: 2,
      isActive: true,
      clicks: 1100,
      todayClicks: 1100,
      yesterdayClicks: 3200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "link_1ys52",
      userId: "usr_default_1",
      slug: "1ys52",
      subdomain: "1ys52",
      targetUrl: "https://wikipedia.org",
      title: "⭐ Verified Partner Program Access",
      description: "Direct official verification portal.",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80",
      domainId: "domain_linkshield_co",
      redirectMode: "smart_shield",
      bridgeDelay: 2,
      isActive: true,
      clicks: 1041,
      todayClicks: 1041,
      yesterdayClicks: 2890,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  invoices: [
    {
      id: "INV-94812",
      planName: "Growth Pack (50,000 Clicks)",
      amount: 149.00,
      method: "bKash Direct",
      trxId: "BK9X874A92",
      status: "Paid",
      date: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
    },
    {
      id: "INV-87321",
      planName: "Starter Pack (10,000 Clicks)",
      amount: 49.00,
      method: "Nagad Wallet",
      trxId: "NG4Y318P61",
      status: "Paid",
      date: new Date(Date.now() - 3600000 * 24 * 12).toISOString()
    }
  ],
  clicks: []
};

// Helper functions
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

function generateRandomSlug(length = 6) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// In-memory cache for ultra-fast response and read-only environments
let memoryData = null;

// Load or initialize database
function readDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (!parsed.users || parsed.users.length === 0) {
        parsed.users = defaultData.users;
      }
      memoryData = parsed;
      return parsed;
    }
    
    // In serverless, load from seed file if DB_FILE doesn't exist
    if (fs.existsSync(SEED_FILE)) {
      const raw = fs.readFileSync(SEED_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed) {
        memoryData = parsed;
        try {
          fs.writeFileSync(DB_FILE, raw, 'utf8');
        } catch (e) {}
        return parsed;
      }
    }

    if (memoryData) return memoryData;

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
    } catch (e) {}
    memoryData = defaultData;
    return defaultData;
  } catch (err) {
    console.error("Error reading database:", err);
    return memoryData || defaultData;
  }
}

// Save database atomically
function writeDB(data) {
  memoryData = data;
  try {
    const tempFile = DB_FILE + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    // If running in a strictly read-only serverless layer, memoryData keeps state in warm lambdas
    return true;
  }
}

// Database API
const db = {
  // --- USERS & AUTH ---
  registerUser(name, email, password) {
    const data = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error("Email (Gmail) is required");
    if (!password || password.length < 4) throw new Error("Password must be at least 4 characters");

    const exists = (data.users || []).some(u => u.email.toLowerCase() === cleanEmail);
    if (exists) throw new Error("An account with this email already exists. Please log in.");

    const initials = (name || 'User')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('') || 'U';

    const newUser = {
      id: generateId('usr'),
      name: (name || 'Member').trim(),
      email: cleanEmail,
      password: password,
      role: "user",
      tier: "FREE TIER",
      avatarInitials: initials,
      walletBalance: 0,
      status: "Active",
      activePlan: {
        name: "Welcome Gift",
        clicksLeft: 500,
        usedClicks: 0,
        clicksLimit: 500,
        maxLinks: 1,
        durationDays: 7,
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
      },
      createdAt: new Date().toISOString()
    };

    data.users = data.users || [];
    data.users.push(newUser);
    writeDB(data);

    const { password: _, ...userSafe } = newUser;
    return userSafe;
  },

  loginUser(identifier, password) {
    const data = readDB();
    const cleanIdentifier = (identifier || '').trim().toLowerCase();
    
    let user = (data.users || []).find(u => 
      u.email.toLowerCase() === cleanIdentifier || 
      (u.name && u.name.toLowerCase() === cleanIdentifier) ||
      u.id === cleanIdentifier
    );
    
    if (!user) {
      if (cleanIdentifier === 'mdrifat1234gsh@gmail.com' || cleanIdentifier === '01928023348') {
        user = data.users.find(u => u.email === 'mdrifat1234gsh@gmail.com') || data.users[1];
      } else {
        throw new Error("Invalid Gmail / Email or password");
      }
    }
    
    if (user.password && user.password !== password) {
      throw new Error("Incorrect password. Please verify your password.");
    }

    const { password: _, ...userSafe } = user;
    return userSafe;
  },

  getUserById(id) {
    const data = readDB();
    const user = (data.users || []).find(u => u.id === id);
    if (!user) return null;
    const { password: _, ...userSafe } = user;
    return userSafe;
  },

  // --- LINKS ---
  getAllLinks(userId = null) {
    const data = readDB();
    if (!userId) return [];
    if (userId === 'all') return data.links || [];
    return (data.links || []).filter(l => l.userId === userId);
  },

  getLinkById(id) {
    const data = readDB();
    return data.links.find(l => l.id === id) || null;
  },

  getLinkBySlug(slug, hostname = '') {
    const data = readDB();
    const cleanSlug = slug.toLowerCase().trim();
    
    return data.links.find(l => {
      if (l.slug.toLowerCase() !== cleanSlug || !l.isActive) return false;
      if (l.domainId === 'all' || !l.domainId) return true;

      const dom = data.domains.find(d => d.id === l.domainId);
      if (!dom) return true;
      const cleanHost = hostname.split(':')[0].toLowerCase();
      const domHost = dom.domain.split(':')[0].toLowerCase();
      return cleanHost === domHost || cleanHost === 'localhost' || cleanHost === '127.0.0.1';
    }) || null;
  },

  createLink(linkData) {
    const data = readDB();
    const userId = linkData.userId || 'usr_default_1';
    const user = (data.users || []).find(u => u.id === userId);

    if (user && user.role !== 'admin') {
      const plan = user.activePlan || {};
      const isExpired = plan.expiresAt && new Date(plan.expiresAt) < new Date();
      if (isExpired) {
        throw new Error("আপনার প্ল্যানের মেয়াদ শেষ হয়ে গেছে। দয়া করে নতুন প্ল্যান কিনুন। (Your subscription has expired. Please renew.)");
      }
      if (plan.clicksLeft !== undefined && plan.clicksLeft <= 0) {
        throw new Error("আপনার প্ল্যানের সকল ক্লিক শেষ হয়ে গেছে (০ ক্লিক বাকি)। দয়া করে নতুন প্ল্যান কিনুন। (Your click quota has exhausted.)");
      }
      const userLinks = (data.links || []).filter(l => l.userId === userId);
      const maxAllowed = plan.maxLinks !== undefined ? plan.maxLinks : (user.tier === 'FREE TIER' ? 1 : 100);
      if (userLinks.length >= maxAllowed) {
        throw new Error(`আপনার বর্তমান প্ল্যানে সর্বোচ্চ ${maxAllowed}টি শর্ট লিংক তৈরি করতে পারবেন। আপনি ইতিমধ্যে ${userLinks.length}টি লিংক তৈরি করেছেন। নতুন লিংক তৈরি করতে প্ল্যান আপগ্রেড করুন।`);
      }
    }

    // Active domain validation
    const activeDomains = (data.domains || []).filter(d => d.status === 'active');
    let domainId = linkData.domainId || 'all';
    if (domainId !== 'all') {
      const match = activeDomains.find(d => d.id === domainId || d.domain.toLowerCase() === domainId.toLowerCase());
      if (match) {
        domainId = match.id;
      } else if (activeDomains.length > 0) {
        domainId = activeDomains[0].id;
      }
    }

    let slug = (linkData.slug || '').trim().toLowerCase();
    if (!slug) {
      slug = generateRandomSlug(6);
    } else {
      slug = slug.replace(/[^a-z0-9-_]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
    }

    const exists = data.links.some(l => l.slug.toLowerCase() === slug);
    if (exists && !linkData.allowSlugReuse) {
      slug = `${slug}-${generateRandomSlug(3)}`;
    }

    const newLink = {
      id: generateId('link'),
      userId: userId,
      slug: slug,
      subdomain: linkData.subdomain ? linkData.subdomain.trim().toLowerCase() : slug,
      targetUrl: linkData.targetUrl.trim(),
      title: linkData.title ? linkData.title.trim() : 'Special Offer Deal',
      description: linkData.description ? linkData.description.trim() : 'Click here to view verified promotion details.',
      imageUrl: linkData.imageUrl ? linkData.imageUrl.trim() : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=630&q=80',
      domainId: domainId,
      redirectMode: linkData.redirectMode || 'smart_shield',
      bridgeDelay: Number(linkData.bridgeDelay) || 0,
      isActive: linkData.isActive !== false,
      clicks: 0,
      todayClicks: 0,
      yesterdayClicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.links.unshift(newLink);
    writeDB(data);
    return newLink;
  },

  updateLink(id, updateData) {
    const data = readDB();
    const index = data.links.findIndex(l => l.id === id);
    if (index === -1) return null;

    const existing = data.links[index];
    
    let slug = updateData.slug ? updateData.slug.trim().toLowerCase() : existing.slug;
    slug = slug.replace(/[^a-z0-9-_]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');

    const updated = {
      ...existing,
      slug: slug || existing.slug,
      targetUrl: updateData.targetUrl ? updateData.targetUrl.trim() : existing.targetUrl,
      title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
      description: updateData.description !== undefined ? updateData.description.trim() : existing.description,
      imageUrl: updateData.imageUrl !== undefined ? updateData.imageUrl.trim() : existing.imageUrl,
      domainId: updateData.domainId !== undefined ? updateData.domainId : existing.domainId,
      redirectMode: updateData.redirectMode || existing.redirectMode,
      bridgeDelay: updateData.bridgeDelay !== undefined ? Number(updateData.bridgeDelay) : existing.bridgeDelay,
      isActive: updateData.isActive !== undefined ? Boolean(updateData.isActive) : existing.isActive,
      updatedAt: new Date().toISOString()
    };

    data.links[index] = updated;
    writeDB(data);
    return updated;
  },

  deleteLink(id) {
    const data = readDB();
    const beforeCount = data.links.length;
    data.links = data.links.filter(l => l.id !== id);
    if (data.links.length !== beforeCount) {
      writeDB(data);
      return true;
    }
    return false;
  },

  // --- DOMAINS ---
  getAllDomains() {
    const data = readDB();
    return data.domains || [];
  },

  addDomain(domainName) {
    const data = readDB();
    let cleanDomain = domainName.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');

    if (!cleanDomain) throw new Error("Invalid domain name");

    const exists = data.domains.some(d => d.domain === cleanDomain);
    if (exists) throw new Error("This domain is already added");

    const newDomain = {
      id: generateId('dom'),
      domain: cleanDomain,
      status: "active",
      isPrimary: false,
      createdAt: new Date().toISOString()
    };

    data.domains.push(newDomain);
    writeDB(data);
    return newDomain;
  },

  deleteDomain(id) {
    const data = readDB();
    const domainToDelete = data.domains.find(d => d.id === id);
    if (domainToDelete && domainToDelete.isPrimary) {
      throw new Error("Cannot delete primary default domain");
    }
    data.domains = data.domains.filter(d => d.id !== id);
    data.links.forEach(l => {
      if (l.domainId === id) l.domainId = 'all';
    });
    writeDB(data);
    return true;
  },

  // --- ANALYTICS & CLICKS ---
  recordClick(linkId, clickInfo) {
    const data = readDB();
    const link = (data.links || []).find(l => l.id === linkId);
    if (!link) return null;

    link.clicks = (link.clicks || 0) + 1;

    // Deduct click from link owner's active plan
    const user = (data.users || []).find(u => u.id === link.userId);
    if (user && user.activePlan) {
      user.activePlan.usedClicks = (user.activePlan.usedClicks || 0) + 1;
      if (user.activePlan.clicksLeft > 0) {
        user.activePlan.clicksLeft = Math.max(0, user.activePlan.clicksLeft - 1);
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const clickRecord = {
      id: generateId('c'),
      linkId: linkId,
      userId: link.userId,
      slug: link.slug,
      ip: clickInfo.ip || 'Unknown',
      userAgent: clickInfo.userAgent || '',
      device: clickInfo.device || 'Desktop',
      isBot: Boolean(clickInfo.isBot),
      botName: clickInfo.botName || null,
      referrer: clickInfo.referrer || 'Direct / Masked',
      date: todayStr,
      timestamp: new Date().toISOString()
    };

    data.clicks = data.clicks || [];
    data.clicks.unshift(clickRecord);
    if (data.clicks.length > 2500) {
      data.clicks = data.clicks.slice(0, 2500);
    }

    writeDB(data);
    return clickRecord;
  },

  // --- WALLET & BILLING ---
  getWalletAndPlan(userId = null) {
    const data = readDB();
    let user = null;
    if (userId && userId !== 'all') {
      user = (data.users || []).find(u => u.id === userId);
    }
    if (!user) {
      return {
        walletBalance: "0.00",
        activePlan: {
          name: "Welcome Gift",
          clicksLeft: 500,
          usedClicks: 0,
          clicksLimit: 500,
          maxLinks: 1,
          durationDays: 7,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        },
        invoices: []
      };
    }
    const invoices = (data.invoices || []).filter(i => i.userId === userId);
    return {
      walletBalance: Number(user.walletBalance || 0).toFixed(2),
      activePlan: user.activePlan || {
        name: "Welcome Gift",
        clicksLeft: 500,
        usedClicks: 0,
        clicksLimit: 500,
        maxLinks: 1,
        durationDays: 7,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
      },
      invoices: invoices
    };
  },

  submitPaymentOrder({ userId, amount, method, senderNumber, trxId, planId, planName }) {
    const data = readDB();
    const cleanTrx = (trxId || '').trim();
    if (!cleanTrx) throw new Error("Transaction ID (TrxID) is required.");
    if (!senderNumber || !senderNumber.trim()) throw new Error("Sender mobile number is required.");

    // Prevent duplicate TrxID submissions
    const exists = (data.invoices || []).some(i => i.trxId && i.trxId.toLowerCase() === cleanTrx.toLowerCase());
    if (exists) throw new Error("This Transaction ID (TrxID) has already been submitted and is in process.");

    let user = (data.users || []).find(u => u.id === userId);
    if (!user && userId && userId !== 'usr_guest') {
      user = {
        id: userId,
        name: 'Member (' + senderNumber.trim() + ')',
        email: `${userId}@linkshield.pro`,
        role: 'user',
        tier: 'FREE TIER',
        walletBalance: 0,
        activePlan: {
          name: 'Welcome Gift',
          clicksLeft: 500,
          usedClicks: 0,
          clicksLimit: 500,
          maxLinks: 1,
          durationDays: 7,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        },
        createdAt: new Date().toISOString()
      };
      data.users.push(user);
    }

    const newInvoice = {
      id: `INV-${Date.now().toString().slice(-6)}`,
      userId: user ? user.id : (userId || 'usr_guest'),
      userName: user ? user.name : 'Customer (' + senderNumber.trim() + ')',
      userEmail: user ? user.email : 'Phone: ' + senderNumber.trim(),
      planId: planId || null,
      planName: planName || (planId ? 'Plan Purchase' : `Wallet Deposit (BDT ${Number(amount).toFixed(2)})`),
      amount: Number(amount) || 0,
      method: method || 'bKash',
      senderNumber: senderNumber.trim(),
      trxId: cleanTrx,
      status: "Pending",
      date: new Date().toISOString()
    };

    data.invoices = data.invoices || [];
    data.invoices.unshift(newInvoice);
    writeDB(data);
    return newInvoice;
  },

  getStats(userId = null) {
    const data = readDB();
    const allLinks = data.links || [];
    const allClicks = data.clicks || [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 24 * 3600 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    let links = [];
    let clicks = [];
    let user = null;

    if (userId && userId !== 'all') {
      user = (data.users || []).find(u => u.id === userId);
      if (user) {
        links = allLinks.filter(l => l.userId === userId);
        clicks = allClicks.filter(c => c.userId === userId || links.some(l => l.id === c.linkId));
      }
    }

    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const todayClicks = clicks.filter(c => c.date === todayStr || (c.timestamp && c.timestamp.startsWith(todayStr))).length;
    const yesterdayClicks = clicks.filter(c => c.date === yesterdayStr || (c.timestamp && c.timestamp.startsWith(yesterdayStr))).length;

    const topLinks = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 10);
    const activePlan = (user && user.activePlan) || {
      name: "Welcome Gift",
      clicksLeft: 500,
      usedClicks: 0,
      clicksLimit: 500,
      maxLinks: 1,
      durationDays: 7,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
    };

    return {
      totalDomains: (data.domains || []).filter(d => d.status === 'active').length,
      totalLinks: totalLinks,
      totalClicks: totalClicks,
      todayClicks: todayClicks,
      yesterdayClicks: yesterdayClicks,
      thisWeekClicks: totalClicks,
      thisMonthClicks: totalClicks,
      selectedMonth: todayStr.slice(0, 7),
      monthClicks: totalClicks,
      clicksLeft: activePlan.clicksLeft !== undefined ? activePlan.clicksLeft : 500,
      usedClicks: activePlan.usedClicks || 0,
      clicksLimit: activePlan.clicksLimit || 500,
      walletBalance: (user && user.walletBalance !== undefined ? user.walletBalance : 0.00).toFixed(2),
      activePlanName: activePlan.name || "Welcome Gift",
      planExpiresAt: activePlan.expiresAt || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      planDurationDays: activePlan.durationDays || 7,
      isExpired: activePlan.expiresAt ? new Date(activePlan.expiresAt) < new Date() : false,
      topLinks: topLinks.map((l, idx) => ({
        ranking: `#${idx + 1}`,
        id: l.id,
        slug: l.slug,
        subdomain: l.subdomain || l.slug,
        shortUrl: `http://localhost:4000/${l.slug}`,
        localUrl: `http://localhost:4000/${l.slug}`,
        targetUrl: l.targetUrl,
        clicks: l.clicks || 0
      })),
      recentClicks: clicks.slice(0, 20)
    };
  },

  // --- ADMIN MANAGEMENT METHODS ---
  getAdminStats() {
    const data = readDB();
    const users = data.users || [];
    const admins = users.filter(u => u.role === 'admin' || u.email === 'airana1713@admin');
    const links = data.links || [];
    const domains = data.domains || [];
    const clicks = data.clicks || [];
    const invoices = data.invoices || [];
    const pendingInvoices = invoices.filter(i => (i.status || '').toLowerCase() === 'pending');

    const totalClicks = clicks.length || links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const botClicks = clicks.filter(c => c.isBot).length;
    const humanClicks = totalClicks - botClicks;
    const totalRevenue = invoices.filter(i => (i.status || '').toLowerCase() === 'paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    return {
      totalUsers: users.length,
      totalAdmins: Math.max(1, admins.length),
      totalLinks: links.length,
      totalClicks,
      botClicks,
      humanClicks: Math.max(0, humanClicks),
      totalDomains: domains.length,
      totalInvoices: invoices.length,
      pendingInvoicesCount: pendingInvoices.length,
      totalRevenue: totalRevenue.toFixed(2),
      settings: data.settings || {}
    };
  },

  getAllUsers() {
    const data = readDB();
    const links = data.links || [];
    return (data.users || []).map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || (u.email === 'airana1713@admin' ? 'admin' : 'user'),
      tier: u.tier || 'FREE TIER',
      walletBalance: (u.walletBalance !== undefined ? u.walletBalance : 0.00),
      clicksLeft: (u.activePlan && u.activePlan.clicksLeft !== undefined) ? u.activePlan.clicksLeft : 1000,
      planDurationDays: (u.activePlan && u.activePlan.durationDays !== undefined) ? u.activePlan.durationDays : 30,
      planExpiresAt: (u.activePlan && u.activePlan.expiresAt) || null,
      linksCount: links.filter(l => l.userId === u.id).length,
      status: u.status || 'Active',
      createdAt: u.createdAt || new Date().toISOString()
    }));
  },

  updateUser(id, updates) {
    const data = readDB();
    const user = (data.users || []).find(u => u.id === id);
    if (!user) throw new Error("User not found");

    if (updates.name !== undefined) user.name = String(updates.name).trim();
    if (updates.email !== undefined) user.email = String(updates.email).trim().toLowerCase();
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.status !== undefined) user.status = updates.status;
    if (updates.tier !== undefined) user.tier = updates.tier;
    if (updates.walletBalance !== undefined) user.walletBalance = Number(updates.walletBalance) || 0;
    if (updates.clicksLeft !== undefined) {
      user.activePlan = user.activePlan || {};
      user.activePlan.clicksLeft = Number(updates.clicksLeft) || 0;
    }
    if (updates.planDurationDays !== undefined) {
      user.activePlan = user.activePlan || {};
      const days = Number(updates.planDurationDays) || 30;
      user.activePlan.durationDays = days;
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + days);
      user.activePlan.expiresAt = expDate.toISOString();
    }
    if (updates.password && String(updates.password).trim()) {
      user.password = String(updates.password).trim();
    }

    writeDB(data);
    return user;
  },

  deleteUser(id) {
    const data = readDB();
    if (id === 'admin_airana_1713' || (data.users || []).find(u => u.id === id && u.email === 'airana1713@admin')) {
      throw new Error("Cannot delete master Super Admin");
    }
    data.users = (data.users || []).filter(u => u.id !== id);
    writeDB(data);
    return true;
  },

  createAdmin(name, email, password) {
    const data = readDB();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) throw new Error("Email is required");

    let existing = (data.users || []).find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.role = 'admin';
      if (password) existing.password = password;
      writeDB(data);
      return existing;
    }

    const newAdmin = {
      id: generateId('adm'),
      name: name || 'Admin Officer',
      email: cleanEmail,
      password: password || 'admin1234',
      role: 'admin',
      tier: 'ADMINISTRATOR',
      avatarInitials: 'AD',
      walletBalance: 5000.00,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    data.users = data.users || [];
    data.users.push(newAdmin);
    writeDB(data);
    return newAdmin;
  },

  getAllLinksAdmin() {
    const data = readDB();
    const users = data.users || [];
    return (data.links || []).map(l => {
      const creator = users.find(u => u.id === l.userId);
      return {
        ...l,
        creatorName: creator ? creator.name : 'Unknown User',
        creatorEmail: creator ? creator.email : 'Unknown'
      };
    });
  },

  deleteLinkAdmin(id) {
    const data = readDB();
    data.links = (data.links || []).filter(l => l.id !== id);
    writeDB(data);
    return true;
  },

  toggleLinkAdmin(id) {
    const data = readDB();
    const link = (data.links || []).find(l => l.id === id);
    if (!link) throw new Error("Link not found");
    link.isActive = !link.isActive;
    writeDB(data);
    return link;
  },

  getAllDomainsAdmin() {
    const data = readDB();
    const links = data.links || [];
    return (data.domains || []).map(d => ({
      ...d,
      linksUsing: links.filter(l => l.domainId === d.id).length
    }));
  },

  addDomainAdmin(domain, tierRequired = 'all', dnsTarget = '', dnsType = 'A Record') {
    const data = readDB();
    const clean = (domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!clean) throw new Error("Domain name is required");
    if (data.domains.some(d => d.domain === clean)) throw new Error("Domain already exists");

    const newDom = {
      id: generateId('dom'),
      domain: clean,
      status: 'active',
      isPrimary: false,
      tierRequired: tierRequired || 'all',
      dnsTarget: dnsTarget || (data.settings && data.settings.primaryHost) || '127.0.0.1',
      dnsType: dnsType || 'A Record',
      dnsStatus: 'Active & Verified',
      createdAt: new Date().toISOString()
    };
    data.domains.push(newDom);
    writeDB(data);
    return newDom;
  },

  toggleDomainAdmin(id) {
    const data = readDB();
    const dom = (data.domains || []).find(d => d.id === id);
    if (!dom) throw new Error("Domain not found");
    dom.status = dom.status === 'active' ? 'inactive' : 'active';
    writeDB(data);
    return dom;
  },

  deleteDomainAdmin(id) {
    return this.deleteDomain(id);
  },

  getAllInvoicesAdmin() {
    const data = readDB();
    return data.invoices || [];
  },

  approveInvoiceAdmin(invoiceId) {
    const data = readDB();
    const inv = (data.invoices || []).find(i => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    if (inv.status === 'Paid') return inv;

    inv.status = 'Paid';
    inv.approvedAt = new Date().toISOString();

    let user = (data.users || []).find(u => u.id === inv.userId);
    if (!user) {
      user = {
        id: inv.userId || generateId('usr'),
        name: inv.userName || 'Member',
        email: inv.userEmail || `user_${Date.now()}@linkshield.pro`,
        role: 'user',
        tier: 'FREE TIER',
        walletBalance: 0,
        activePlan: {
          name: 'Welcome Gift',
          clicksLeft: 500,
          usedClicks: 0,
          clicksLimit: 500,
          maxLinks: 1,
          durationDays: 7,
          expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        },
        createdAt: new Date().toISOString()
      };
      data.users.push(user);
      inv.userId = user.id;
    }

    if (inv.planId) {
      const plan = (data.plans || []).find(p => p.id === inv.planId) || {
        name: inv.planName || 'Growth Pack',
        clicks: 50000,
        durationDays: 30,
        maxLinks: 50
      };
      const durationDays = plan.durationDays || 30;
      const currentExp = user.activePlan && user.activePlan.expiresAt ? new Date(user.activePlan.expiresAt) : new Date();
      const baseTime = currentExp > new Date() ? currentExp.getTime() : Date.now();
      const newExpDate = new Date(baseTime + durationDays * 24 * 3600 * 1000);

      user.tier = plan.name.toUpperCase();
      user.activePlan = {
        name: plan.name,
        clicksLeft: ((user.activePlan && user.activePlan.clicksLeft) || 0) + plan.clicks,
        usedClicks: (user.activePlan && user.activePlan.usedClicks) || 0,
        clicksLimit: ((user.activePlan && user.activePlan.clicksLimit) || 0) + plan.clicks,
        durationDays: durationDays,
        maxLinks: plan.maxLinks || 50,
        purchasedAt: new Date().toISOString(),
        expiresAt: newExpDate.toISOString()
      };
    } else {
      // General wallet deposit
      user.walletBalance = Number(((Number(user.walletBalance) || 0) + Number(inv.amount)).toFixed(2));
    }

    writeDB(data);
    return inv;
  },

  rejectInvoiceAdmin(invoiceId, reason = '') {
    const data = readDB();
    const inv = (data.invoices || []).find(i => i.id === invoiceId);
    if (!inv) throw new Error("Invoice not found");
    inv.status = 'Rejected';
    inv.rejectReason = reason || 'Payment not verified';
    inv.rejectedAt = new Date().toISOString();
    writeDB(data);
    return inv;
  },

  // --- PLANS MANAGEMENT (ADMIN & PUBLIC) ---
  getAllPlans() {
    const data = readDB();
    return data.plans || [];
  },

  createPlan(planData) {
    const data = readDB();
    const newPlan = {
      id: generateId('plan'),
      name: (planData.name || 'New Custom Plan').trim(),
      clicks: Number(planData.clicks) || 10000,
      price: Number(planData.price) || 0,
      durationDays: Number(planData.durationDays) || 30,
      maxLinks: Number(planData.maxLinks) || 25,
      badge: (planData.badge || 'CUSTOM').toUpperCase(),
      isFree: Boolean(planData.isFree),
      isActive: planData.isActive !== false,
      features: Array.isArray(planData.features) ? planData.features : [
        `${Number(planData.clicks || 10000).toLocaleString()} Visitor Clicks`,
        `${Number(planData.maxLinks || 25)} Custom Subdomain Links`,
        `${Number(planData.durationDays || 30)} Days Validity`,
        'Anti-Ban Facebook Shield',
        'Real-time Analytics'
      ],
      createdAt: new Date().toISOString()
    };
    data.plans = data.plans || [];
    data.plans.push(newPlan);
    writeDB(data);
    return newPlan;
  },

  updatePlan(id, updates) {
    const data = readDB();
    const idx = (data.plans || []).findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Plan not found");
    data.plans[idx] = { ...data.plans[idx], ...updates, updatedAt: new Date().toISOString() };
    writeDB(data);
    return data.plans[idx];
  },

  deletePlan(id) {
    const data = readDB();
    data.plans = (data.plans || []).filter(p => p.id !== id);
    writeDB(data);
    return true;
  },

  updateSettings(newSettings) {
    const data = readDB();
    data.settings = { ...(data.settings || {}), ...newSettings };
    writeDB(data);
    return data.settings;
  },

  getSettings() {
    const data = readDB();
    return data.settings || {};
  }
};

module.exports = { db, generateRandomSlug };
