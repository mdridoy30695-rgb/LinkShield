// ==========================================================================
// LinkShield Pro User Dashboard Controller v2.1
// Full Per-User Isolation, Live Countdown Timer, Dynamic Plans & TrxID Gateways
// ==========================================================================

let appState = {
  activeView: 'overview',
  user: null,
  stats: {},
  links: [],
  domains: [],
  invoices: [],
  plans: [],
  settings: {
    bkashNumber: "01952320805",
    nagadNumber: "01952320805",
    rocketNumber: "01952320805"
  },
  selectedDepositGateway: 'bKash',
  selectedOrderGateway: 'bKash',
  countdownInterval: null
};

function getCurrentUser() {
  try {
    const raw = sessionStorage.getItem('linkshield_user');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

// DOM ready initialization
document.addEventListener('DOMContentLoaded', () => {
  const pill = document.getElementById('heroDomainPill');
  if (pill && window.location.host) {
    pill.textContent = '✓ Live Protected Node: ' + window.location.host + ' • Anti-Ban Shield Active';
  }

  // Load existing session if present
  appState.user = getCurrentUser();

  setupNavigation();
  setupAuth();
  setupForms();
  setupSupportWidget();
  fetchPlatformSettings();
  fetchDynamicPlans();
  fetchAllData();

  // Auto-refresh stats every 3 seconds for real-time live sync
  setInterval(() => {
    if (sessionStorage.getItem('linkshield_logged_in')) {
      fetchAllData(true);
    }
  }, 3000);
});

// 1. Platform Settings (bKash, Nagad, Rocket numbers)
async function fetchPlatformSettings() {
  try {
    const res = await fetch('/api/settings').then(r => r.json());
    if (res.success && res.data) {
      appState.settings = { ...appState.settings, ...res.data };
      updatePaymentNumbersUI();
    }
  } catch (err) {
    console.warn("Could not load settings:", err);
  }
}

function updatePaymentNumbersUI() {
  const bk = appState.settings.bkashNumber || '01952320805';
  const ng = appState.settings.nagadNumber || '01952320805';
  const rk = appState.settings.rocketNumber || '01952320805';

  // Deposit section
  const depNumEl = document.getElementById('depositTargetNumber');
  const depLabelEl = document.getElementById('depositGatewayLabel');
  if (depNumEl && depLabelEl) {
    if (appState.selectedDepositGateway === 'Nagad') {
      depNumEl.textContent = ng;
      depLabelEl.textContent = 'Nagad Personal / Merchant:';
    } else if (appState.selectedDepositGateway === 'Rocket') {
      depNumEl.textContent = rk;
      depLabelEl.textContent = 'Rocket Personal:';
    } else {
      depNumEl.textContent = bk;
      depLabelEl.textContent = 'bKash Personal:';
    }
  }

  // Plan order modal
  const ordNumEl = document.getElementById('orderGatewayNumber');
  const ordLabelEl = document.getElementById('orderGatewayLabel');
  if (ordNumEl && ordLabelEl) {
    if (appState.selectedOrderGateway === 'Nagad') {
      ordNumEl.textContent = ng;
      ordLabelEl.textContent = 'Nagad Personal / Merchant:';
    } else if (appState.selectedOrderGateway === 'Rocket') {
      ordNumEl.textContent = rk;
      ordLabelEl.textContent = 'Rocket Personal:';
    } else {
      ordNumEl.textContent = bk;
      ordLabelEl.textContent = 'bKash Personal:';
    }
  }
}

window.selectDepositGateway = function(method) {
  appState.selectedDepositGateway = method;
  document.querySelectorAll('#view-add-fund .gateway-chip').forEach(c => c.classList.remove('active'));
  const target = document.querySelector(`#view-add-fund .chip-${method.toLowerCase()}`);
  if (target) target.classList.add('active');
  updatePaymentNumbersUI();
};

window.selectOrderGateway = function(method) {
  appState.selectedOrderGateway = method;
  document.querySelectorAll('#planOrderModal .gateway-chip').forEach(c => c.classList.remove('active'));
  const target = document.querySelector(`#planOrderModal .chip-${method.toLowerCase()}`);
  if (target) target.classList.add('active');
  updatePaymentNumbersUI();
};

window.copyPaymentNumber = function(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const num = el.textContent.trim();
  copyToClipboard(num);
  showQuickNotification(`Copied phone number: ${num}`);
};

// 2. Navigation setup
function setupNavigation() {
  const navButtons = document.querySelectorAll('[data-view]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewId = btn.getAttribute('data-view');
      if (viewId) {
        switchView(viewId);
      }
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggleBtn');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar) {
        sidebar.style.display = sidebar.style.display === 'flex' ? 'none' : 'flex';
      }
    });
  }

  // Quick submit proxy
  const quickProxy = document.getElementById('quickCreateSubmitProxy');
  if (quickProxy) {
    quickProxy.addEventListener('click', () => {
      const form = document.getElementById('shortenerForm');
      if (form) form.requestSubmit();
    });
  }

  // Upgrade button in sidebar
  const sidebarUpgradeBtn = document.getElementById('sidebarUpgradeBtn');
  if (sidebarUpgradeBtn) {
    sidebarUpgradeBtn.addEventListener('click', () => switchView('plans'));
  }

  // Wallet pill in header
  const topHeaderWalletBtn = document.getElementById('topHeaderWalletBtn');
  if (topHeaderWalletBtn) {
    topHeaderWalletBtn.addEventListener('click', () => switchView('add-fund'));
  }
}

function switchView(viewName) {
  appState.activeView = viewName;

  // Update sidebar buttons active state
  document.querySelectorAll('.sidebar-nav .nav-link-btn').forEach(btn => {
    if (btn.getAttribute('data-view') === viewName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide all views, show target view
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 3. Live Countdown Timer Widget (dd : hh : mm : ss)
function startPlanCountdownTimer(expiresAt) {
  if (appState.countdownInterval) {
    clearInterval(appState.countdownInterval);
  }

  function update() {
    const headerEl = document.getElementById('headerCountdownDigits');
    const sidebarEl = document.getElementById('sidebarPlanTimerText');

    if (!expiresAt) {
      if (headerEl) headerEl.textContent = '07d : 00h : 00m : 00s';
      if (sidebarEl) sidebarEl.textContent = 'Valid: 07d : 00h : 00m : 00s';
      return;
    }

    const expTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = expTime - now;

    if (diff <= 0) {
      if (headerEl) {
        headerEl.textContent = '00d : 00h : 00m : 00s (EXPIRED)';
        headerEl.style.color = '#ef4444';
      }
      if (sidebarEl) {
        sidebarEl.textContent = 'Plan Expired ⚠️';
        sidebarEl.style.color = '#ef4444';
      }
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    const formatted = `${pad(days)}d : ${pad(hours)}h : ${pad(mins)}m : ${pad(secs)}s`;

    if (headerEl) {
      headerEl.textContent = formatted;
      headerEl.style.color = days <= 1 ? '#ef4444' : '#f59e0b';
    }
    if (sidebarEl) {
      sidebarEl.textContent = `Valid: ${formatted}`;
      sidebarEl.style.color = days <= 1 ? '#ef4444' : 'var(--gold-deep, #d97706)';
    }
  }

  update();
  appState.countdownInterval = setInterval(update, 1000);
}

// 4. Fetch Dynamic Plans
async function fetchDynamicPlans() {
  try {
    const res = await fetch('/api/plans').then(r => r.json());
    if (res.success && res.data) {
      appState.plans = res.data;
      renderUserPlans(res.data);
    }
  } catch (err) {
    console.error("Error loading plans:", err);
  }
}

function renderUserPlans(plans) {
  const container = document.getElementById('userPlansContainer');
  if (!container) return;

  if (!plans || plans.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--muted); padding: 40px;">No subscription plans available right now.</div>`;
    return;
  }

  container.innerHTML = plans.map(p => {
    const isFree = p.isFree || p.price === 0;
    const priceText = isFree ? 'Free Gift' : `BDT ${Number(p.price).toFixed(2)}`;
    const clicksText = `${Number(p.clicks).toLocaleString()} Clicks`;
    const daysText = `${p.durationDays || 30} Days Validity`;
    const maxLinksText = p.maxLinks ? `${p.maxLinks} Max Links` : 'Unlimited Links';

    return `
      <div class="plan-card-item">
        <div>
          <div class="plan-badge-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="plan-item-title">${escapeHtml(p.name)}</div>
          <div class="plan-item-clicks">${clicksText}</div>
          <div class="plan-item-sub">${daysText} • ${maxLinksText}</div>
          <div class="plan-item-price">${priceText}</div>
        </div>
        <div class="plan-card-bottom">
          <span class="link-coupon" onclick="promptCoupon()">Have a coupon?</span>
          ${isFree ? 
            `<button class="btn-buy-plan" style="background: rgba(16, 185, 129, 0.18); color: #10b981; border-color: rgba(16, 185, 129, 0.4);" disabled>Active On Register</button>` :
            `<button class="btn-buy-plan" onclick="openPlanOrderModal('${p.id}')">Buy Plan</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

window.openPlanOrderModal = function(planId) {
  const plan = (appState.plans || []).find(p => p.id === planId);
  if (!plan) return;

  safeSetText('orderModalPlanName', plan.name);
  safeSetText('orderModalPlanPrice', `BDT ${Number(plan.price).toFixed(2)}`);
  safeSetText('orderModalPlanClicks', `${Number(plan.clicks).toLocaleString()} Visitor Clicks • ${plan.durationDays || 30} Days Validity`);

  const idInput = document.getElementById('orderPlanId');
  const nameInput = document.getElementById('orderPlanNameVal');
  const priceInput = document.getElementById('orderPlanPriceVal');
  if (idInput) idInput.value = plan.id;
  if (nameInput) nameInput.value = plan.name;
  if (priceInput) priceInput.value = plan.price;

  const modal = document.getElementById('planOrderModal');
  if (modal) modal.classList.add('open');
};

// 5. Fetch all system data (isolated per user)
async function fetchAllData(isBackgroundPoll = false) {
  try {
    const user = getCurrentUser();
    const userIdQuery = user ? `?userId=${encodeURIComponent(user.id)}` : '';

    const [statsRes, linksRes, walletRes, invoicesRes] = await Promise.all([
      fetch(`/api/stats${userIdQuery}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`/api/links${userIdQuery}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`/api/wallet${userIdQuery}`).then(r => r.json()).catch(() => ({ success: false })),
      fetch(`/api/invoices${userIdQuery}`).then(r => r.json()).catch(() => ({ success: false }))
    ]);

    if (statsRes.success && statsRes.data) {
      appState.stats = statsRes.data;
      renderMetrics(statsRes.data);
      renderTopLinks(statsRes.data.topLinks || []);
      startPlanCountdownTimer(statsRes.data.planExpiresAt);
    }

    if (linksRes.success) {
      appState.links = linksRes.data || [];
      appState.domains = linksRes.domains || [];
      renderAllLinks(appState.links);
      renderDomains(appState.domains);
      populateDomainDropdown(appState.domains);
    }

    if (walletRes.success && walletRes.data) {
      appState.user = appState.user || {};
      appState.user.walletBalance = walletRes.data.walletBalance;
      if (walletRes.data.activePlan) {
        appState.user.activePlan = walletRes.data.activePlan;
        startPlanCountdownTimer(walletRes.data.activePlan.expiresAt);
      }
      updateWalletUI();
    }

    if (invoicesRes.success) {
      appState.invoices = invoicesRes.data || [];
      renderInvoices(appState.invoices);
    }
  } catch (err) {
    if (!isBackgroundPoll) console.error('Error fetching data:', err);
  }
}

// 6. Render Dashboard Metrics
function renderMetrics(data) {
  safeSetText('valTodayClicks', Number(data.todayClicks || 0).toLocaleString());
  safeSetText('valYesterdayClicks', Number(data.yesterdayClicks || 0).toLocaleString());
  safeSetText('valThisWeekClicks', Number(data.thisWeekClicks || 0).toLocaleString());
  safeSetText('valThisMonthClicks', Number(data.thisMonthClicks || 0).toLocaleString());
  safeSetText('valTotalClicks', Number(data.totalClicks || 0).toLocaleString());
  safeSetText('valMonthClicks', Number(data.monthClicks || 0).toLocaleString());
  safeSetText('valClicksLeft', Number(data.clicksLeft || 0).toLocaleString());
  safeSetText('sidebarClicksLeft', Number(data.clicksLeft || 0).toLocaleString());

  const used = Number(data.usedClicks || 0).toLocaleString();
  const limit = Number(data.clicksLimit || 500).toLocaleString();
  safeSetText('sidebarClicksSub', `Used ${used} / Limit ${limit}`);

  const planName = data.activePlanName || 'Welcome Gift';
  safeSetText('sidebarPlanBadge', `✦ ${planName.toUpperCase()}`);
  safeSetText('sidebarUpgradeBtnText', planName);

  updateWalletUI();
}

function updateWalletUI() {
  const bal = parseFloat((appState.user && appState.user.walletBalance) || (appState.stats && appState.stats.walletBalance) || 0).toFixed(2);
  const b = `BDT ${bal}`;
  safeSetText('valWalletBalance', b);
  safeSetText('sidebarWalletText', `Wallet: ${b}`);
  safeSetText('topHeaderWalletText', `Wallet: ${b}`);
  safeSetText('addFundCurrentBalance', b);

  const user = getCurrentUser();
  if (user) {
    const avatar = document.getElementById('topHeaderAvatar');
    if (avatar) avatar.textContent = (user.name || 'U').slice(0, 2).toUpperCase();
  }
}

// 7. Render Analytics Top Links
function renderTopLinks(topLinks) {
  const tbody = document.getElementById('topLinksTableBody');
  if (!tbody) return;

  if (!topLinks || topLinks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--muted); padding: 24px;">No click traffic yet today. Create a link and share it to see live clicks!</td></tr>`;
    return;
  }

  tbody.innerHTML = topLinks.map(l => `
    <tr>
      <td><span class="table-rank-pill">${l.ranking || '#1'}</span></td>
      <td>
        <div class="table-url-cell">
          <span class="table-short-url">${escapeHtml(l.shortUrl || l.localUrl)}</span>
          <button type="button" class="btn-copy-mini" onclick="copyToClipboard('${l.localUrl || l.shortUrl}')">Copy</button>
        </div>
      </td>
      <td><strong style="color: #fff; font-size: 14px;">${Number(l.clicks || 0).toLocaleString()}</strong></td>
    </tr>
  `).join('');
}

// 8. Render All Links
function renderAllLinks(links) {
  const tbody = document.getElementById('allLinksTableBody');
  if (!tbody) return;

  if (!links || links.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--muted); padding: 30px;">No links created yet. Click "+ Create Link" to start your first campaign!</td></tr>`;
    return;
  }

  const host = window.location.origin;

  tbody.innerHTML = links.map(l => {
    const fullShortUrl = `${host}/${l.slug}`;
    const displayBrandedUrl = `https://${l.subdomain ? l.subdomain + '.' : ''}${l.domainName || 'linkshield.pro'}/${l.slug}`;

    return `
      <tr>
        <td>
          <div class="table-url-cell">
            <span class="table-short-url">${escapeHtml(displayBrandedUrl)}</span>
            <small style="color: var(--muted2); font-size: 11px;">Node: /${escapeHtml(l.slug)}</small>
          </div>
        </td>
        <td>
          <span style="color: #a1a1aa; font-size: 12.5px; max-width: 260px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${escapeHtml(l.targetUrl)}
          </span>
        </td>
        <td>
          <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(234, 179, 8, 0.14); color: #fef08a; border: 1px solid rgba(234, 179, 8, 0.35);">
            ${l.redirectMode === 'smart_shield' ? '🛡️ Smart Shield' : (l.redirectMode === 'bridge_page' ? '🌉 Bridge Page' : '⚡ Direct 302')}
          </span>
        </td>
        <td><strong style="color: #fff;">${Number(l.clicks || 0).toLocaleString()}</strong></td>
        <td>
          <span class="badge-status-active">● Active</span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn-copy-mini" onclick="copyToClipboard('${fullShortUrl}')">Copy</button>
            <a href="${fullShortUrl}" target="_blank" class="btn-copy-mini" style="text-decoration: none;">Visit</a>
            <button class="btn-copy-mini" style="color: #fca5a5;" onclick="deleteLink('${l.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 9. Render Domains List & Dropdown
function renderDomains(domains) {
  const tbody = document.getElementById('domainsTableBody');
  if (!tbody) return;

  if (!domains || domains.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 20px;">No platform domains configured.</td></tr>`;
    return;
  }

  tbody.innerHTML = domains.map(d => `
    <tr>
      <td><strong style="color: #fff;">${escapeHtml(d.domain)}</strong></td>
      <td><span class="badge-status-active">● Active</span></td>
      <td><span style="color: #a1a1aa; font-size: 12px;">${d.isPrimary ? 'Primary Network Node' : 'Verified CDN Node'}</span></td>
      <td><span style="color: #71717a; font-size: 12px;">${d.createdAt ? d.createdAt.slice(0, 10) : '2026-09-01'}</span></td>
      <td><span style="color: #facc15; font-size: 12px; font-weight: 800;">✓ DNS Ready</span></td>
    </tr>
  `).join('');
}

function populateDomainDropdown(domains) {
  const select = document.getElementById('selectDomain');
  if (!select) return;

  if (!domains || domains.length === 0) {
    const currentHost = window.location.host || 'localhost:4000';
    select.innerHTML = `<option value="domain_local">${currentHost}</option>`;
    return;
  }

  select.innerHTML = domains.map((d, idx) => `
    <option value="${d.id}" ${idx === 0 ? 'selected' : ''}>${escapeHtml(d.domain)}</option>
  `).join('');
}

// 10. Render Invoices
function renderInvoices(invoices) {
  const tbody = document.getElementById('invoicesTableBody');
  if (!tbody) return;

  if (!invoices || invoices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--muted); padding: 24px;">No deposit or plan invoices found.</td></tr>`;
    return;
  }

  tbody.innerHTML = invoices.map(inv => {
    const status = inv.status || 'Pending';
    const isPaid = status.toLowerCase() === 'paid';
    const badgeClass = isPaid ? 'badge-status-paid' : 'badge-status-pending';
    const statusBadge = `<span class="${badgeClass}">${status.toUpperCase()}</span>`;

    return `
      <tr>
        <td><strong style="color: #fff;">${escapeHtml(inv.id)}</strong></td>
        <td><span style="color: #d4d4d8;">${escapeHtml(inv.planName || 'Deposit')}</span></td>
        <td><strong style="color: #fff;">BDT ${parseFloat(inv.amount || 0).toFixed(2)}</strong></td>
        <td>${statusBadge}</td>
        <td><span style="color: #a1a1aa; font-size: 12px;">${inv.date ? inv.date.replace('T', ' ').slice(0, 16) : '—'}</span></td>
        <td><span style="color: #a1a1aa; font-size: 12px;">${inv.approvedAt ? inv.approvedAt.replace('T', ' ').slice(0, 16) : '—'}</span></td>
        <td><span style="color: #fff; font-weight: 700;">${escapeHtml(inv.method || 'bKash')}</span></td>
        <td><code style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 11px;">${escapeHtml(inv.trxId || '—')}</code></td>
      </tr>
    `;
  }).join('');
}

// 11. Forms Setup
function setupForms() {
  // Shortener Form
  const shortenerForm = document.getElementById('shortenerForm');
  if (shortenerForm) {
    shortenerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const targetUrl = document.getElementById('inputTargetUrl').value.trim();
      const subdomain = document.getElementById('inputSubdomain').value.trim();
      const domainId = document.getElementById('selectDomain').value;
      const redirectMode = document.querySelector('input[name="redirectMode"]:checked')?.value || 'smart_shield';
      const title = document.getElementById('inputOgTitle')?.value.trim();
      const imageUrl = document.getElementById('inputOgImage')?.value.trim();

      const btn = document.getElementById('btnSubmitCreateLink');
      if (btn) btn.disabled = true;

      const user = getCurrentUser();
      const userId = user ? user.id : null;

      try {
        const res = await fetch('/api/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            targetUrl,
            subdomain,
            domainId,
            redirectMode,
            title,
            imageUrl
          })
        }).then(r => r.json());

        if (res.success && res.data) {
          showLinkCreatedModal(res.data);
          fetchAllData();
          shortenerForm.reset();
        } else {
          alert(res.error || 'Failed to create link');
        }
      } catch (err) {
        alert('Server error creating link.');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  // Add Fund Form (Manual Send Money with TrxID)
  const addFundForm = document.getElementById('addFundForm');
  if (addFundForm) {
    addFundForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = document.getElementById('inputDepositAmount').value;
      const senderNumber = document.getElementById('inputDepositSenderPhone').value.trim();
      const trxId = document.getElementById('inputDepositTrxId').value.trim();
      const method = appState.selectedDepositGateway || 'bKash';
      const user = getCurrentUser();

      if (!senderNumber) {
        alert("Please enter your sender mobile number.");
        return;
      }
      if (!trxId) {
        alert("Please enter the Transaction ID (TrxID).");
        return;
      }

      try {
        const res = await fetch('/api/wallet/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user ? user.id : null,
            amount,
            method,
            senderNumber,
            trxId
          })
        }).then(r => r.json());

        if (res.success) {
          alert(`🎉 Deposit submitted! Invoice #${res.invoice?.id || 'NEW'} is pending verification. Once the admin verifies your TrxID (${trxId}), your wallet will be credited!`);
          addFundForm.reset();
          fetchAllData();
          switchView('invoices');
        } else {
          alert(res.error || 'Deposit submission failed.');
        }
      } catch (err) {
        alert('Network error submitting deposit.');
      }
    });
  }

  // Plan Order Form (Manual Direct Plan Purchase)
  const planOrderForm = document.getElementById('planOrderForm');
  if (planOrderForm) {
    planOrderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const planId = document.getElementById('orderPlanId').value;
      const planName = document.getElementById('orderPlanNameVal').value;
      const amount = document.getElementById('orderPlanPriceVal').value;
      const senderNumber = document.getElementById('orderSenderPhone').value.trim();
      const trxId = document.getElementById('orderTrxId').value.trim();
      const method = appState.selectedOrderGateway || 'bKash';
      const user = getCurrentUser();

      if (!senderNumber || !trxId) {
        alert("Please provide both sender number and Transaction ID (TrxID).");
        return;
      }

      const btn = document.getElementById('btnSubmitPlanOrder');
      if (btn) btn.disabled = true;

      try {
        const res = await fetch('/api/plans/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user ? user.id : null,
            planId,
            planName,
            amount,
            method,
            senderNumber,
            trxId
          })
        }).then(r => r.json());

        if (res.success) {
          alert(`🎉 Order submitted successfully!\n\nYour order #${res.invoice?.id} for "${planName}" has been received. Admin will verify your TrxID (${trxId}) and instantly activate your clicks and countdown timer!`);
          closeModal('planOrderModal');
          planOrderForm.reset();
          fetchAllData();
          switchView('invoices');
        } else {
          alert(res.error || 'Failed to submit plan order');
        }
      } catch (err) {
        alert('Network error submitting plan order.');
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  }

  // Add Custom Domain Form
  const addDomainForm = document.getElementById('addDomainForm');
  if (addDomainForm) {
    addDomainForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const domain = document.getElementById('inputNewDomain').value.trim();
      try {
        const res = await fetch('/api/domains', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        }).then(r => r.json());

        if (res.success) {
          alert(`✓ Domain "${domain}" connected! Set your Cloudflare A-Record to this IP.`);
          addDomainForm.reset();
          fetchAllData();
        } else {
          alert(res.error || 'Failed to add domain');
        }
      } catch (err) {
        alert('Error adding domain.');
      }
    });
  }

  // Filter links search input
  const filterLinks = document.getElementById('filterLinksSearch');
  if (filterLinks) {
    filterLinks.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderAllLinks(appState.links);
        return;
      }
      const filtered = appState.links.filter(l => 
        (l.slug && l.slug.toLowerCase().includes(q)) ||
        (l.targetUrl && l.targetUrl.toLowerCase().includes(q)) ||
        (l.title && l.title.toLowerCase().includes(q))
      );
      renderAllLinks(filtered);
    });
  }
}

function promptCoupon() {
  const coupon = prompt('Enter promo or discount voucher code:');
  if (coupon) {
    alert(`Coupon "${coupon.trim()}" applied! You have unlocked a 10% bonus clicks reward upon approval.`);
  }
}

async function deleteLink(id) {
  if (!confirm('Are you sure you want to delete this short link?')) return;
  try {
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' }).then(r => r.json());
    if (res.success) {
      fetchAllData();
    } else {
      alert('Failed to delete link');
    }
  } catch (err) {
    alert('Error deleting link.');
  }
}

function showLinkCreatedModal(link) {
  const modal = document.getElementById('createdLinkModal');
  const shortUrlEl = document.getElementById('modalResultShortUrl');
  const targetUrlEl = document.getElementById('modalResultTargetUrl');
  const visitBtn = document.getElementById('modalVisitBtn');
  const copyBtn = document.getElementById('modalCopyBtn');

  const localFull = `${window.location.origin}/${link.slug}`;
  const brandedFull = `https://${link.subdomain ? link.subdomain + '.' : ''}${link.domainName || 'linkshield.pro'}/${link.slug}`;

  if (shortUrlEl) shortUrlEl.textContent = brandedFull;
  if (targetUrlEl) targetUrlEl.textContent = `Target: ${link.targetUrl}`;
  if (visitBtn) visitBtn.href = localFull;

  if (copyBtn) {
    copyBtn.onclick = () => copyToClipboard(localFull);
  }

  if (modal) modal.classList.add('open');
}

window.closeModal = function(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('open');
};

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showQuickNotification(`Copied to clipboard: ${text}`);
  }).catch(() => {
    prompt('Copy your link:', text);
  });
}

function showQuickNotification(msg) {
  let toast = document.getElementById('shieldToastNotification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'shieldToastNotification';
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0a0a0e;
      border: 1px solid rgba(234, 179, 8, 0.45);
      box-shadow: 0 10px 30px rgba(0,0,0,0.9), 0 0 20px rgba(234, 179, 8, 0.2);
      color: #fff;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.2s ease;
    `;
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span style="color: #facc15; font-size: 15px; font-weight: 900;">✓</span> ${escapeHtml(msg)}`;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
  }, 2500);
}

function setupSupportWidget() {
  window.toggleSupportWidget = function(force) {
    const el = document.getElementById('supportWidget');
    if (!el) return;
    if (force === false) {
      el.classList.remove('open');
      return;
    }
    el.classList.toggle('open');
  };

  document.addEventListener('click', (e) => {
    const el = document.getElementById('supportWidget');
    if (el && el.classList.contains('open') && !el.contains(e.target)) {
      el.classList.remove('open');
    }
  });
}

window.togglePasswordEye = function(inputId, toggleBtnId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const btn = toggleBtnId ? document.getElementById(toggleBtnId) : (input.parentNode ? input.parentNode.querySelector('.neu-eye-btn, .neu-eye-toggle') : null);
  if (!btn) return;

  const openIcon = btn.querySelector('.eye-open-icon');
  const closedIcon = btn.querySelector('.eye-closed-icon');

  if (input.type === 'password') {
    input.type = 'text';
    btn.classList.add('active');
    if (openIcon) openIcon.style.display = 'none';
    if (closedIcon) closedIcon.style.display = 'block';
  } else {
    input.type = 'password';
    btn.classList.remove('active');
    if (openIcon) openIcon.style.display = 'block';
    if (closedIcon) closedIcon.style.display = 'none';
  }
};

window.showSplitLoginView = function() {
  const loginView = document.getElementById('viewSplitLogin');
  const registerView = document.getElementById('viewSplitRegister');
  if (loginView) loginView.style.display = 'block';
  if (registerView) registerView.style.display = 'none';
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabReg = document.getElementById('tabBtnRegister');
  if (tabLogin) tabLogin.classList.add('active');
  if (tabReg) tabReg.classList.remove('active');
};

window.showSplitRegisterView = function() {
  const loginView = document.getElementById('viewSplitLogin');
  const registerView = document.getElementById('viewSplitRegister');
  if (loginView) loginView.style.display = 'none';
  if (registerView) registerView.style.display = 'block';
  const tabLogin = document.getElementById('tabBtnLogin');
  const tabReg = document.getElementById('tabBtnRegister');
  if (tabReg) tabReg.classList.add('active');
  if (tabLogin) tabLogin.classList.remove('active');
};

window.switchAuthTab = function(mode) {
  if (mode === 'register') {
    window.showSplitRegisterView();
  } else {
    window.showSplitLoginView();
  }
};

window.openAuthModal = function(mode = 'login') {
  const authScreen = document.getElementById('authScreen');
  if (!authScreen) return;
  authScreen.scrollTop = 0;
  authScreen.classList.remove('hidden');
  window.switchAuthTab(mode);
};

window.closeAuthModal = function() {
  const authScreen = document.getElementById('authScreen');
  if (authScreen) authScreen.classList.add('hidden');
};

window.enterDashboard = function() {
  sessionStorage.setItem('linkshield_logged_in', 'true');
  const landing = document.getElementById('publicLandingView');
  const dashboard = document.getElementById('mainAppContainer');
  const authScreen = document.getElementById('authScreen');

  if (authScreen) authScreen.classList.add('hidden');
  if (landing) landing.style.display = 'none';
  if (dashboard) dashboard.style.display = 'flex';

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.returnToLandingHome = function() {
  const landing = document.getElementById('publicLandingView');
  const dashboard = document.getElementById('mainAppContainer');
  const authScreen = document.getElementById('authScreen');

  if (dashboard) dashboard.style.display = 'none';
  if (landing) landing.style.display = 'block';
  if (authScreen) authScreen.classList.add('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showLandingPage = window.returnToLandingHome;

window.quickLoginDemo = async function() {
  try {
    const res = await fetch('/api/auth/demo-login', { method: 'POST' }).then(r => r.json());
    if (res.success && res.user) {
      sessionStorage.setItem('linkshield_user', JSON.stringify(res.user));
      sessionStorage.setItem('linkshield_logged_in', 'true');
      appState.user = res.user;
    }
  } catch (err) {
    console.error("Demo login error:", err);
  }
  window.enterDashboard();
  showQuickNotification('🎉 Welcome! Your 500 Free Visitor Clicks are active.');
  fetchAllData();
};

function setupAuth() {
  const authLoginForm = document.getElementById('authLoginForm');
  const authRegisterForm = document.getElementById('authRegisterForm');
  const logoutBtn = document.getElementById('topHeaderLogoutBtn');
  const sidebarLogoutBtn = document.getElementById('sidebarLogoutDirectBtn');

  // Login handler
  if (authLoginForm) {
    authLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = document.getElementById('loginIdentifier')?.value.trim();
      const password = document.getElementById('loginPassword')?.value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        });
        const data = await res.json();
        if (data.success && data.user) {
          sessionStorage.setItem('linkshield_user', JSON.stringify(data.user));
          appState.user = data.user;
          window.enterDashboard();
          showQuickNotification(`Welcome back, ${data.user.name || 'Member'}!`);
          fetchAllData();
        } else {
          showQuickNotification(`❌ ${data.error || 'Login failed. Please check credentials.'}`);
        }
      } catch (err) {
        showQuickNotification('❌ Server error during login.');
      }
    });
  }

  // Register handler (Auto-starts with 500 visitor clicks, 1 short link, 7 days validity)
  if (authRegisterForm) {
    authRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regFullName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const password = document.getElementById('regPassword')?.value;
      const confirmPassword = document.getElementById('regConfirmPassword')?.value;

      if (!name || !email) {
        showQuickNotification('⚠️ Please enter your full name and email.');
        return;
      }
      if (!password || password.length < 4) {
        showQuickNotification('⚠️ Password must be at least 4 characters long.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        showQuickNotification('❌ Passwords do not match!');
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.success && data.user) {
          sessionStorage.setItem('linkshield_user', JSON.stringify(data.user));
          appState.user = data.user;
          window.enterDashboard();
          showQuickNotification(`🎉 Welcome ${data.user.name}! Your 500 Visitor Clicks Welcome Gift is active!`);
          fetchAllData();
        } else {
          showQuickNotification(`❌ ${data.error || 'Registration failed.'}`);
        }
      } catch (err) {
        showQuickNotification('❌ Error connecting to registration server.');
      }
    });
  }

  const handleLogout = () => {
    sessionStorage.removeItem('linkshield_logged_in');
    sessionStorage.removeItem('linkshield_user');
    appState.user = null;
    window.returnToLandingHome();
    showQuickNotification('Logged out successfully.');
  };

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener('click', handleLogout);

  const stored = sessionStorage.getItem('linkshield_logged_in');
  if (stored) {
    if (!sessionStorage.getItem('linkshield_user')) {
      fetch('/api/auth/demo-login', { method: 'POST' }).then(r => r.json()).then(res => {
        if (res.success && res.user) {
          sessionStorage.setItem('linkshield_user', JSON.stringify(res.user));
          appState.user = res.user;
          fetchAllData();
        }
      }).catch(() => {});
    }
    window.enterDashboard();
  } else {
    window.returnToLandingHome();
  }
}

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
