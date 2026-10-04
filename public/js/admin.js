// ==========================================================================
// LinkShield Pro — Master Admin Console Controller v2.0
// Real-time User, Admin, Domain, Link, Invoice & Global Settings Management
// ==========================================================================

let adminState = {
  currentAdmin: null,
  stats: {},
  users: [],
  admins: [],
  domains: [],
  links: [],
  invoices: [],
  plans: [],
  settings: {},
  activeTab: 'overview',
  serverIps: []
};

document.addEventListener('DOMContentLoaded', () => {
  setupAdminAuth();
  setupAdminNavigation();
  setupAdminModalsAndForms();

  // Live polling: automatically checks for new pending invoices and user activities every 3 seconds
  setInterval(() => {
    if (adminState.currentAdmin) {
      fetchAdminAllData(true);
    }
  }, 3000);
});

// --- 1. AUTHENTICATION & GATE ---
function setupAdminAuth() {
  const loginForm = document.getElementById('adminLoginForm');
  const storedAuth = sessionStorage.getItem('linkshield_admin_auth');

  if (storedAuth) {
    try {
      adminState.currentAdmin = JSON.parse(storedAuth);
      showAdminConsole();
    } catch (e) {
      showAdminGate();
    }
  } else {
    showAdminGate();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('adminGateEmail').value.trim();
      const password = document.getElementById('adminGatePassword').value.trim();

      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.success && data.admin) {
          adminState.currentAdmin = data.admin;
          sessionStorage.setItem('linkshield_admin_auth', JSON.stringify(data.admin));
          showAdminConsole();
          showAdminToast(`👑 Welcome Master Admin: ${data.admin.name || data.admin.email}`);
        } else {
          showAdminToast(`❌ ${data.error || 'Invalid admin credentials'}`);
        }
      } catch (err) {
        showAdminToast('❌ Error connecting to admin service');
      }
    });
  }
}

function showAdminGate() {
  const gate = document.getElementById('adminGateScreen');
  const consoleEl = document.getElementById('adminConsoleScreen');
  if (gate) gate.style.display = 'flex';
  if (consoleEl) consoleEl.style.display = 'none';
}

function showAdminConsole() {
  const gate = document.getElementById('adminGateScreen');
  const consoleEl = document.getElementById('adminConsoleScreen');
  if (gate) gate.style.display = 'none';
  if (consoleEl) consoleEl.style.display = 'flex';

  if (adminState.currentAdmin) {
    const profName = document.getElementById('adminProfileName');
    if (profName) profName.textContent = adminState.currentAdmin.name || adminState.currentAdmin.email;
  }

  fetchAdminAllData();
}

window.quickAdminLogin = function() {
  document.getElementById('adminGateEmail').value = 'airana1713@admin';
  document.getElementById('adminGatePassword').value = 'admin';
  document.getElementById('adminLoginForm').dispatchEvent(new Event('submit'));
};

window.adminLogout = function() {
  sessionStorage.removeItem('linkshield_admin_auth');
  adminState.currentAdmin = null;
  showAdminGate();
  showAdminToast('Logged out of Admin Console');
};

window.togglePasswordEye = function(inputId, toggleBtnId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const btn = toggleBtnId ? document.getElementById(toggleBtnId) : (input.parentNode ? input.parentNode.querySelector('.neu-eye-btn, .neu-eye-toggle') : null);
  
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) {
      btn.classList.add('active');
      const openIcon = btn.querySelector('.eye-open-icon');
      const closedIcon = btn.querySelector('.eye-closed-icon');
      if (openIcon) openIcon.style.display = 'none';
      if (closedIcon) closedIcon.style.display = 'block';
    }
  } else {
    input.type = 'password';
    if (btn) {
      btn.classList.remove('active');
      const openIcon = btn.querySelector('.eye-open-icon');
      const closedIcon = btn.querySelector('.eye-closed-icon');
      if (openIcon) openIcon.style.display = 'block';
      if (closedIcon) closedIcon.style.display = 'none';
    }
  }
};

// --- 2. NAVIGATION & TABS ---
function setupAdminNavigation() {
  const navBtns = document.querySelectorAll('.admin-nav-item button');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-admin-view');
      if (view) switchAdminTab(view);
    });
  });
}

window.switchAdminTab = function(tabName) {
  adminState.activeTab = tabName;

  document.querySelectorAll('.admin-nav-item button').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-admin-view') === tabName);
  });

  document.querySelectorAll('.admin-view-panel').forEach(p => {
    p.classList.remove('active');
  });
  const targetPanel = document.getElementById(`panel-${tabName}`);
  if (targetPanel) targetPanel.classList.add('active');

  const headerTitle = document.getElementById('adminPageHeaderTitle');
  const headerDesc = document.getElementById('adminPageHeaderDesc');

  const titles = {
    overview: { title: 'Overview & System Health', desc: 'Real-time status of all users, domains, cloaked links and incoming deposits.' },
    users: { title: 'User Account Management', desc: 'Full control: change balance, clicks, plan validity duration (days/months), or ban users.' },
    admins: { title: 'Administrators Directory', desc: 'Manage system administrators with complete control room permissions.' },
    domains: { title: 'Domain Network Control', desc: 'Configure platform domains, VIP restrictions, and wildcard routing live.' },
    links: { title: 'Global Short Links Monitor', desc: 'Inspect links created by all members, filter spam or de-activate offers.' },
    invoices: { title: 'Deposits & Billing Verification', desc: 'Review manual bKash/Nagad TrxIDs. Approving will automatically credit clicks and balance live!' },
    settings: { title: 'Platform & Website Settings', desc: 'All changes update the entire server and user dashboard immediately.' }
  };

  if (titles[tabName] && headerTitle && headerDesc) {
    headerTitle.textContent = titles[tabName].title;
    headerDesc.textContent = titles[tabName].desc;
  }
};

// --- 3. DATA FETCHING ---
async function fetchAdminAllData() {
  try {
    const [statsRes, usersRes, linksRes, domainsRes, invoicesRes, settingsRes, sysRes] = await Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/links').then(r => r.json()),
      fetch('/api/admin/domains').then(r => r.json()),
      fetch('/api/admin/invoices').then(r => r.json()),
      fetch('/api/admin/plans').then(r => r.json()).catch(() => ({ success: false })),
      fetch('/api/admin/settings').then(r => r.json()),
      fetch('/api/system-info').then(r => r.json()).catch(() => ({}))
    ]);

    if (statsRes.success) adminState.stats = statsRes.data;
    if (usersRes.success) adminState.users = usersRes.data;
    if (linksRes.success) adminState.links = linksRes.data;
    if (domainsRes.success) adminState.domains = domainsRes.data;
    if (invoicesRes.success) adminState.invoices = invoicesRes.data;
    if (plansRes.success) adminState.plans = plansRes.data;
    if (settingsRes.success) adminState.settings = settingsRes.data;
    if (sysRes.serverIps) adminState.serverIps = sysRes.serverIps;

    renderAdminAll();
  } catch (err) {
    console.error("Admin data fetch error:", err);
  }
}

function renderAdminAll() {
  renderOverviewKPIs();
  renderUsersTable();
  renderAdminsTable();
  renderDomainsTable();
  renderLinksTable();
  renderInvoicesTable();
  renderAdminPlans();
  renderSettingsForm();
}

// --- 4. RENDERERS ---
function renderOverviewKPIs() {
  const s = adminState.stats || {};
  safeSetText('kpiTotalUsers', s.totalUsers || 0);
  safeSetText('kpiTotalAdmins', s.totalAdmins || 1);
  safeSetText('kpiTotalLinks', s.totalLinks || 0);
  safeSetText('kpiTotalClicks', (s.totalClicks || 0).toLocaleString());
  safeSetText('kpiBotClicks', `${(s.botClicks || 0).toLocaleString()} Bots Shielded (${(s.humanClicks || 0).toLocaleString()} Humans)`);
  safeSetText('kpiTotalDomains', s.totalDomains || 0);
  safeSetText('kpiPendingInvoices', s.pendingInvoicesCount || 0);

  const badge = document.getElementById('pendingInvoicesBadge');
  if (badge) {
    if (s.pendingInvoicesCount > 0) {
      badge.textContent = s.pendingInvoicesCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  const recentTbody = document.getElementById('overviewRecentUsersTable');
  if (recentTbody) {
    const list = (adminState.users || []).slice(0, 5);
    if (list.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">No users registered yet.</td></tr>`;
    } else {
      recentTbody.innerHTML = list.map(u => `
        <tr>
          <td><strong style="color: #0f172a;">${escapeHtml(u.name)}</strong></td>
          <td><span style="color: #64748b;">${escapeHtml(u.email)}</span></td>
          <td><span style="font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${u.role === 'admin' ? 'background: rgba(217,119,6,0.15); color: #b45309;' : 'background: #e2e8f0; color: #475569;'}">${u.role === 'admin' ? '👑 Admin' : 'User'}</span></td>
          <td><span style="color: #475569; font-weight: 700;">${escapeHtml(u.tier)}</span></td>
          <td><strong style="color: #0f172a;">BDT ${Number(u.walletBalance || 0).toFixed(2)}</strong></td>
          <td><span class="badge-status-active">● ${u.status || 'Active'}</span></td>
        </tr>
      `).join('');
    }
  }
}

function renderUsersTable(filter = '') {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  let list = adminState.users || [];
  if (filter) {
    const q = filter.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 30px;">No users found matching query.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(u => {
    const isBanned = (u.status || '').toLowerCase() === 'suspended';
    const durationDays = u.planDurationDays || 30;

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #b45309, #d97706); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 12px; box-shadow: 2px 2px 6px #c5cbd7;">
              ${escapeHtml((u.name || 'U')[0].toUpperCase())}
            </div>
            <div>
              <strong style="color: #0f172a; display: block;">${escapeHtml(u.name)}</strong>
              <small style="color: #64748b; font-size: 10.5px;">ID: ${u.id}</small>
            </div>
          </div>
        </td>
        <td><span style="color: #475569; font-weight: 600;">${escapeHtml(u.email)}</span></td>
        <td>
          <span style="font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${u.role === 'admin' ? 'background: rgba(217,119,6,0.15); color: #b45309; border: 1px solid rgba(217,119,6,0.3);' : 'background: #e2e8f0; color: #475569;'}">
            ${u.role === 'admin' ? '👑 Admin' : 'User'}
          </span>
        </td>
        <td><span style="color: #475569; font-size: 12px; font-weight: 700;">${escapeHtml(u.tier || 'FREE TIER')}</span></td>
        <td>
          <span style="font-size: 11.5px; font-weight: 800; color: #b45309; background: rgba(217,119,6,0.08); padding: 3px 8px; border-radius: 6px;">
            ⏳ ${durationDays} Days Left
          </span>
        </td>
        <td><strong style="color: #0f172a;">BDT ${Number(u.walletBalance || 0).toFixed(2)}</strong></td>
        <td><span style="color: #b45309; font-weight: 800;">${Number(u.clicksLeft || 0).toLocaleString()}</span></td>
        <td>
          <span style="font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 10px; ${isBanned ? 'background: #fee2e2; color: #dc2626; border: 1px solid rgba(220,38,38,0.3);' : 'background: #dcfce7; color: #15803d; border: 1px solid rgba(22,163,74,0.3);'}">
            ${isBanned ? '⛔ Banned' : '● Active'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px; align-items: center;">
            <button type="button" class="admin-btn admin-btn-action" style="padding: 5px 10px; font-size: 11.5px;" onclick="openEditUserModal('${u.id}')">
              Edit
            </button>
            <button type="button" class="admin-btn ${isBanned ? 'admin-btn-success' : 'admin-btn-danger'}" style="padding: 5px 10px; font-size: 11.5px;" onclick="toggleUserBan('${u.id}', '${u.status || 'Active'}')">
              ${isBanned ? '✓ Unban' : '⛔ Ban'}
            </button>
            <button type="button" class="admin-btn admin-btn-action" style="color: #dc2626; padding: 5px 10px; font-size: 11.5px;" onclick="deleteUserPrompt('${u.id}', '${escapeHtml(u.name)}')">
              ✕
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAdminsTable() {
  const tbody = document.getElementById('adminAdminsTableBody');
  if (!tbody) return;

  const list = (adminState.users || []).filter(u => u.role === 'admin' || u.email === 'airana1713@admin');

  tbody.innerHTML = list.map(a => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 18px;">👑</span>
          <div>
            <strong style="color: #0f172a;">${escapeHtml(a.name || 'Admin')}</strong>
            <small style="display: block; color: #64748b; font-size: 11px;">Primary Administrator</small>
          </div>
        </div>
      </td>
      <td><strong style="color: #b45309;">${escapeHtml(a.email)}</strong></td>
      <td><span class="admin-tag-pill" style="margin: 0;">Full Control Room</span></td>
      <td><span style="color: #15803d; font-weight: 800; font-size: 11.5px;">✓ Read/Write/Delete Privileges</span></td>
      <td><span style="color: #64748b; font-size: 12px;">${(a.createdAt || '').slice(0, 10) || '2026-09-01'}</span></td>
      <td>
        ${a.email === 'airana1713@admin' ? 
          `<span style="color: #64748b; font-size: 12px; font-weight: 800;">(Root Master Admin)</span>` : 
          `<button type="button" class="admin-btn admin-btn-warning" style="padding: 5px 12px; font-size: 11px;" onclick="demoteAdmin('${a.id}')">Demote to User</button>`
        }
      </td>
    </tr>
  `).join('');
}

function renderDomainsTable() {
  const tbody = document.getElementById('adminDomainsTableBody');
  if (!tbody) return;

  const list = adminState.domains || [];

  // Update DNS IP badge
  const ip = (adminState.serverIps && adminState.serverIps[0]) || (adminState.settings && adminState.settings.primaryHost) || '127.0.0.1';
  safeSetText('dnsTargetIpDisplay', ip);
  safeSetText('dnsTargetIpDisplay2', ip);

  tbody.innerHTML = list.map(d => {
    const isPrimary = d.isPrimary;
    const dnsTarget = d.dnsTarget || (adminState.settings && adminState.settings.primaryHost) || '127.0.0.1';

    return `
      <tr>
        <td>
          <strong style="color: #0f172a; font-size: 14px;">${escapeHtml(d.domain)}</strong>
          ${isPrimary ? `<span style="font-size: 10px; background: rgba(217,119,6,0.2); color: #b45309; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 800;">PRIMARY</span>` : ''}
        </td>
        <td>
          <code style="background: rgba(197,203,215,0.4); padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; color: #0f172a;">
            ${escapeHtml(dnsTarget)}
          </code>
        </td>
        <td>
          <span style="font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${d.tierRequired === 'vip' ? 'background: #fef3c7; color: #b45309;' : 'background: #e0f2fe; color: #0284c7;'}">
            ${d.tierRequired === 'vip' ? '👑 VIP / Paid Only' : '🌍 All Users'}
          </span>
        </td>
        <td>
          <span style="font-size: 11.5px; font-weight: 800; ${d.status === 'active' ? 'color: #15803d;' : 'color: #dc2626;'}">
            ● ${d.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td><strong style="color: #0f172a;">${d.linksUsing || 0} links</strong></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button type="button" class="admin-btn admin-btn-action" style="padding: 5px 10px; font-size: 11.5px;" onclick="toggleDomain('${d.id}')">
              ${d.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            ${!isPrimary ? `
              <button type="button" class="admin-btn admin-btn-danger" style="padding: 5px 10px; font-size: 11.5px;" onclick="deleteDomainPrompt('${d.id}', '${escapeHtml(d.domain)}')">
                Delete
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderLinksTable(filter = '') {
  const tbody = document.getElementById('adminLinksTableBody');
  if (!tbody) return;

  let list = adminState.links || [];
  if (filter) {
    const q = filter.toLowerCase();
    list = list.filter(l => (l.slug || '').toLowerCase().includes(q) || (l.targetUrl || '').toLowerCase().includes(q));
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 30px;">No links created yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(l => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 6px;">
          <strong style="color: #b45309; font-size: 13.5px;">/${escapeHtml(l.slug)}</strong>
          <button type="button" class="admin-btn admin-btn-action" style="padding: 3px 8px; font-size: 10.5px;" onclick="copyText(`${window.location.origin}/${escapeHtml(l.slug)}`)">Copy</button>
        </div>
      </td>
      <td>
        <span style="display: inline-block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #475569; font-size: 12.5px;">
          ${escapeHtml(l.targetUrl)}
        </span>
      </td>
      <td>
        <div>
          <span style="color: #0f172a; font-weight: 700; font-size: 12px;">${escapeHtml(l.creatorName || 'Member')}</span>
          <small style="display: block; color: #64748b; font-size: 10.5px;">${escapeHtml(l.creatorEmail || '')}</small>
        </div>
      </td>
      <td>
        <span style="font-size: 11px; padding: 3px 8px; border-radius: 6px; background: rgba(217,119,6,0.12); color: #b45309; font-weight: 800;">
          ${l.redirectMode === 'smart_shield' ? '🛡️ Smart Shield' : (l.redirectMode === 'bridge_page' ? '🌉 Bridge' : '⚡ 302')}
        </span>
      </td>
      <td><strong style="color: #0f172a;">${Number(l.clicks || 0).toLocaleString()}</strong></td>
      <td>
        <span style="font-size: 11px; font-weight: 800; ${l.isActive !== false ? 'color: #15803d;' : 'color: #dc2626;'}">
          ● ${l.isActive !== false ? 'Active' : 'Disabled'}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="admin-btn admin-btn-action" style="padding: 5px 10px; font-size: 11.5px;" onclick="toggleLink('${l.id}')">
            ${l.isActive !== false ? 'Disable' : 'Enable'}
          </button>
          <button type="button" class="admin-btn admin-btn-danger" style="padding: 5px 10px; font-size: 11.5px;" onclick="deleteLinkPrompt('${l.id}', '${l.slug}')">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderInvoicesTable() {
  const tbody = document.getElementById('adminInvoicesTableBody');
  if (!tbody) return;

  const rawList = adminState.invoices || [];

  if (rawList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: #94a3b8; padding: 30px;">No deposit requests recorded.</td></tr>`;
    return;
  }

  // Sort Pending payments to the very top so admin sees them immediately
  const list = [...rawList].sort((a, b) => {
    const aPending = (a.status || '').toLowerCase() === 'pending' ? 1 : 0;
    const bPending = (b.status || '').toLowerCase() === 'pending' ? 1 : 0;
    return bPending - aPending;
  });

  tbody.innerHTML = list.map(inv => {
    const isPending = (inv.status || '').toLowerCase() === 'pending';
    const sender = inv.senderNumber || '—';
    const trx = inv.trxId || 'N/A';

    return `
      <tr style="${isPending ? 'background: rgba(245, 158, 11, 0.08);' : ''}">
        <td><strong style="color: #0f172a;">${escapeHtml(inv.id)}</strong></td>
        <td>
          <strong style="color: #0f172a; display: block;">${escapeHtml(inv.userName || 'Member')}</strong>
          <small style="color: #64748b; font-size: 11px;">${escapeHtml(inv.userEmail || inv.userId)}</small>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <strong style="color: #0f172a; font-family: monospace; font-size: 13px;">${escapeHtml(sender)}</strong>
            ${sender !== '—' ? `<button type="button" class="admin-btn admin-btn-action" style="padding: 2px 7px; font-size: 10px;" onclick="copyText('${sender}')">Copy</button>` : ''}
          </div>
        </td>
        <td><span style="color: #475569; font-weight: 700;">${escapeHtml(inv.planName)}</span></td>
        <td><strong style="color: #b45309; font-size: 14px;">BDT ${Number(inv.amount || 0).toFixed(2)}</strong></td>
        <td><span style="font-weight: 800; color: #0f172a;">${escapeHtml(inv.method || 'bKash')}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <code style="background: rgba(197,203,215,0.4); padding: 3px 7px; border-radius: 4px; font-weight: 800; color: #0f172a; font-size: 12px;">${escapeHtml(trx)}</code>
            <button type="button" class="admin-btn admin-btn-action" style="padding: 2px 7px; font-size: 10px;" onclick="copyText('${trx}')">Copy</button>
          </div>
        </td>
        <td><span style="color: #64748b; font-size: 12px;">${(inv.date || '').slice(0, 16).replace('T', ' ')}</span></td>
        <td>
          <span style="font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; ${isPending ? 'background: #fef3c7; color: #b45309; border: 1px solid rgba(217,119,6,0.4);' : (inv.status === 'Paid' ? 'background: #dcfce7; color: #15803d;' : 'background: #fee2e2; color: #dc2626;')}">
            ${isPending ? '⏳ PENDING' : (inv.status === 'Paid' ? '✓ APPROVED' : '✕ REJECTED')}
          </span>
        </td>
        <td>
          ${isPending ? `
            <div style="display: flex; gap: 6px;">
              <button type="button" class="admin-btn admin-btn-success" style="font-weight: 800; font-size: 12px; padding: 6px 12px;" onclick="verifyInvoice('${inv.id}', 'Paid')">
                ✓ Approve
              </button>
              <button type="button" class="admin-btn admin-btn-danger" style="font-weight: 700; font-size: 12px; padding: 6px 10px;" onclick="verifyInvoice('${inv.id}', 'Rejected')">
                ✕ Reject
              </button>
            </div>
          ` : `
            <span style="color: #15803d; font-size: 11.5px; font-weight: 800;">● Completed</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function renderSettingsForm() {
  const s = adminState.settings || {};
  if (s.appName) safeSetValue('settingAppName', s.appName);
  if (s.primaryHost) safeSetValue('settingPrimaryHost', s.primaryHost);
  if (s.noticeText) {
    safeSetValue('settingNoticeText', s.noticeText);
    safeSetText('settingNoticePreview', s.noticeText);
  }
  if (s.bkashNumber) safeSetValue('settingBkashNumber', s.bkashNumber);
  if (s.nagadNumber) safeSetValue('settingNagadNumber', s.nagadNumber);
  if (s.rocketNumber) safeSetValue('settingRocketNumber', s.rocketNumber);
  if (s.paymentInstructions) safeSetValue('settingPaymentInstructions', s.paymentInstructions);
  if (s.supportPhone) safeSetValue('settingSupportPhone', s.supportPhone);
  if (s.supportEmail) safeSetValue('settingSupportEmail', s.supportEmail);
  if (s.defaultFreeClicks) safeSetValue('settingDefaultClicks', s.defaultFreeClicks);

  // Bind live preview typing
  const noticeInput = document.getElementById('settingNoticeText');
  if (noticeInput) {
    noticeInput.oninput = (e) => {
      safeSetText('settingNoticePreview', e.target.value || 'Banner preview here...');
    };
  }
}

function renderAdminPlans() {
  const container = document.getElementById('adminPlansListContainer');
  if (!container) return;

  const plans = adminState.plans || [];
  if (plans.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 40px;">No custom subscription plans created. Click "+ Create New Plan" to add one!</div>`;
    return;
  }

  container.innerHTML = plans.map(p => `
    <div class="admin-plan-card">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="margin: 0; font-size: 16px; font-weight: 900; color: #0f172a;">${escapeHtml(p.name)}</h4>
          <span style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px; background: rgba(217,119,6,0.15); color: #b45309;">${escapeHtml(p.badge || 'PACK')}</span>
        </div>
        <div style="font-size: 22px; font-weight: 900; color: #b45309; margin-bottom: 8px;">
          ${p.price === 0 ? 'Free' : `BDT ${Number(p.price).toFixed(2)}`}
        </div>
        <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">⚡ <strong>${Number(p.clicks).toLocaleString()}</strong> Visitor Clicks</div>
        <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">⏳ <strong>${p.durationDays || 30}</strong> Days Validity</div>
        <div style="font-size: 12px; color: #475569; margin-bottom: 14px;">🔗 <strong>${p.maxLinks || 25}</strong> Maximum Short Links</div>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 14px; border-top: 1px solid rgba(197,203,215,0.6); padding-top: 12px;">
        <button type="button" class="admin-btn admin-btn-action" style="flex: 1; padding: 6px 10px; font-size: 12px;" onclick="openAdminPlanModal('${p.id}')">
          ✏️ Edit
        </button>
        <button type="button" class="admin-btn admin-btn-danger" style="flex: 1; padding: 6px 10px; font-size: 12px;" onclick="deleteAdminPlan('${p.id}', '${escapeHtml(p.name)}')">
          🗑️ Delete
        </button>
      </div>
    </div>
  `).join('');
}

// --- 5. MODALS & FORMS HANDLING ---
function setupAdminModalsAndForms() {
  const userSearch = document.getElementById('adminUserSearchInput');
  if (userSearch) {
    userSearch.addEventListener('input', (e) => renderUsersTable(e.target.value));
  }

  const linkSearch = document.getElementById('adminLinkSearchInput');
  if (linkSearch) {
    linkSearch.addEventListener('input', (e) => renderLinksTable(e.target.value));
  }

  // Edit User Form Submission
  const editUserForm = document.getElementById('adminEditUserForm');
  if (editUserForm) {
    editUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('editUserId').value;
      const updates = {
        name: document.getElementById('editUserName').value.trim(),
        email: document.getElementById('editUserEmail').value.trim(),
        role: document.getElementById('editUserRole').value,
        status: document.getElementById('editUserStatus').value,
        tier: document.getElementById('editUserTier').value,
        walletBalance: parseFloat(document.getElementById('editUserBalance').value) || 0,
        clicksLeft: parseInt(document.getElementById('editUserClicks').value) || 0,
        planDurationDays: parseInt(document.getElementById('editUserDurationSelect').value) || 30
      };

      const pw = document.getElementById('editUserPassword').value.trim();
      if (pw) {
        updates.password = pw;
      }

      try {
        const res = await fetch(`/api/admin/users/${id}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('✓ User profile, duration & balance updated successfully!');
          closeAdminModal('adminEditUserModal');
          fetchAdminAllData();
        } else {
          showAdminToast(`❌ ${data.error}`);
        }
      } catch (err) {
        showAdminToast('❌ Error updating user');
      }
    });
  }

  // Create Admin Form
  const createAdminForm = document.getElementById('adminCreateAdminForm');
  if (createAdminForm) {
    createAdminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('newAdminName').value.trim();
      const email = document.getElementById('newAdminEmail').value.trim();
      const password = document.getElementById('newAdminPassword').value.trim();

      try {
        const res = await fetch('/api/admin/admins/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('👑 Administrator created successfully!');
          closeAdminModal('adminCreateAdminModal');
          createAdminForm.reset();
          fetchAdminAllData();
        } else {
          showAdminToast(`❌ ${data.error}`);
        }
      } catch (err) {
        showAdminToast('❌ Error adding administrator');
      }
    });
  }

  // Create Domain Form
  const createDomainForm = document.getElementById('adminCreateDomainForm');
  if (createDomainForm) {
    createDomainForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const domain = document.getElementById('newDomainName').value.trim();
      const tierRequired = document.getElementById('newDomainTier').value;
      const dnsTarget = document.getElementById('newDomainDnsTarget').value.trim();
      const dnsType = document.getElementById('newDomainDnsType').value;

      try {
        const res = await fetch('/api/admin/domains/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain, tierRequired, dnsTarget, dnsType })
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('🌐 Domain added to platform DNS network!');
          closeAdminModal('adminCreateDomainModal');
          createDomainForm.reset();
          fetchAdminAllData();
        } else {
          showAdminToast(`❌ ${data.error}`);
        }
      } catch (err) {
        showAdminToast('❌ Error adding domain');
      }
    });
  }

  // Settings Form
  const settingsForm = document.getElementById('adminSettingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        appName: document.getElementById('settingAppName').value.trim(),
        primaryHost: document.getElementById('settingPrimaryHost').value.trim(),
        noticeText: document.getElementById('settingNoticeText').value.trim(),
        bkashNumber: document.getElementById('settingBkashNumber')?.value.trim() || '01952320805',
        nagadNumber: document.getElementById('settingNagadNumber')?.value.trim() || '01952320805',
        rocketNumber: document.getElementById('settingRocketNumber')?.value.trim() || '01952320805',
        paymentInstructions: document.getElementById('settingPaymentInstructions')?.value.trim() || '',
        supportPhone: document.getElementById('settingSupportPhone').value.trim(),
        supportEmail: document.getElementById('settingSupportEmail').value.trim(),
        defaultFreeClicks: parseInt(document.getElementById('settingDefaultClicks').value) || 1000
      };

      try {
        const res = await fetch('/api/admin/settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showAdminToast('💾 Platform settings & payment gateways saved live across server!');
          fetchAdminAllData();
        } else {
          showAdminToast(`❌ ${data.error}`);
        }
      } catch (err) {
        showAdminToast('❌ Error updating settings');
      }
    });
  }

  // Plan Form (Add / Edit)
  const planForm = document.getElementById('adminPlanForm');
  if (planForm) {
    planForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const planId = document.getElementById('planFormId').value;
      const payload = {
        name: document.getElementById('planFormName').value.trim(),
        price: Number(document.getElementById('planFormPrice').value) || 0,
        clicks: Number(document.getElementById('planFormClicks').value) || 10000,
        durationDays: Number(document.getElementById('planFormDays').value) || 30,
        maxLinks: Number(document.getElementById('planFormMaxLinks').value) || 25,
        badge: document.getElementById('planFormBadge').value.trim() || 'CUSTOM'
      };

      const url = planId ? `/api/admin/plans/${planId}` : '/api/admin/plans';
      const method = planId ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());

        if (res.success) {
          showAdminToast(`✓ Plan ${planId ? 'updated' : 'created'} successfully!`);
          closeAdminModal('adminPlanModal');
          fetchAdminAllData();
        } else {
          showAdminToast(`❌ ${res.error || 'Failed to save plan'}`);
        }
      } catch (err) {
        showAdminToast('❌ Error saving plan');
      }
    });
  }
}

window.openAdminPlanModal = function(planId) {
  const modal = document.getElementById('adminPlanModal');
  const title = document.getElementById('adminPlanModalTitle');
  const btnText = document.getElementById('btnSubmitPlanText');
  const form = document.getElementById('adminPlanForm');
  if (!modal || !form) return;

  if (planId) {
    const plan = (adminState.plans || []).find(p => p.id === planId);
    if (!plan) return;
    safeSetValue('planFormId', plan.id);
    safeSetValue('planFormName', plan.name);
    safeSetValue('planFormPrice', plan.price);
    safeSetValue('planFormClicks', plan.clicks);
    safeSetValue('planFormDays', plan.durationDays || 30);
    safeSetValue('planFormMaxLinks', plan.maxLinks || 25);
    safeSetValue('planFormBadge', plan.badge || '');
    if (title) title.textContent = '✏️ Edit Plan';
    if (btnText) btnText.textContent = 'Save Changes Live';
  } else {
    form.reset();
    safeSetValue('planFormId', '');
    if (title) title.textContent = '✨ Create New Plan';
    if (btnText) btnText.textContent = 'Create Plan Live';
  }
  modal.classList.remove('hidden');
};

window.deleteAdminPlan = function(planId, name) {
  if (!confirm(`Are you sure you want to permanently delete plan "${name}"?`)) return;
  fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showAdminToast(`Plan "${name}" deleted.`);
        fetchAdminAllData();
      } else {
        showAdminToast(`❌ ${data.error || 'Failed to delete plan'}`);
      }
    });
};

// --- 6. ACTION HANDLERS ---
window.openEditUserModal = function(userId) {
  const user = (adminState.users || []).find(u => u.id === userId);
  if (!user) return;

  safeSetValue('editUserId', user.id);
  safeSetValue('editUserName', user.name);
  safeSetValue('editUserEmail', user.email);
  safeSetValue('editUserRole', user.role || 'user');
  safeSetValue('editUserStatus', user.status || 'Active');
  safeSetValue('editUserTier', user.tier || 'FREE TIER');
  safeSetValue('editUserBalance', Number(user.walletBalance || 0).toFixed(2));
  safeSetValue('editUserClicks', user.clicksLeft || 1000);
  safeSetValue('editUserDurationSelect', user.planDurationDays || 30);
  safeSetValue('editUserPassword', '');

  const modal = document.getElementById('adminEditUserModal');
  if (modal) modal.classList.remove('hidden');
};

window.applyDurationPreset = function(val) {
  if (val === 'custom') {
    const customDays = prompt("Enter custom validity duration in days (e.g. 45):", "45");
    if (customDays && !isNaN(customDays)) {
      const select = document.getElementById('editUserDurationSelect');
      const opt = document.createElement('option');
      opt.value = customDays;
      opt.textContent = `${customDays} Days (Custom)`;
      opt.selected = true;
      select.appendChild(opt);
    }
  }
};

window.toggleUserBan = function(id, currentStatus) {
  const newStatus = (currentStatus || '').toLowerCase() === 'suspended' ? 'Active' : 'Suspended';
  const actionLabel = newStatus === 'Suspended' ? 'BAN' : 'UNBAN';

  if (!confirm(`Are you sure you want to ${actionLabel} this user account?`)) return;

  fetch(`/api/admin/users/${id}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      showAdminToast(`✓ User account ${newStatus === 'Suspended' ? 'Banned ⛔' : 'Activated ●'}`);
      fetchAdminAllData();
    } else {
      showAdminToast(`❌ ${data.error}`);
    }
  });
};

window.openCreateAdminModal = function() {
  const modal = document.getElementById('adminCreateAdminModal');
  if (modal) modal.classList.remove('hidden');
};

window.openCreateDomainModal = function() {
  const ip = (adminState.serverIps && adminState.serverIps[0]) || (adminState.settings && adminState.settings.primaryHost) || '127.0.0.1';
  safeSetValue('newDomainDnsTarget', ip);
  const modal = document.getElementById('adminCreateDomainModal');
  if (modal) modal.classList.remove('hidden');
};

window.openCreateUserModal = function() {
  const name = prompt("Enter new user's full name:");
  if (!name) return;
  const email = prompt("Enter user's email address:");
  if (!email) return;
  const password = prompt("Enter user's password:", "password123");
  if (!password) return;

  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      showAdminToast('✓ User registered successfully!');
      fetchAdminAllData();
    } else {
      showAdminToast(`❌ ${data.error}`);
    }
  });
};

window.closeAdminModal = function(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
};

window.deleteUserPrompt = function(id, name) {
  if (!confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;

  fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showAdminToast('✓ User deleted.');
        fetchAdminAllData();
      } else {
        showAdminToast(`❌ ${data.error}`);
      }
    });
};

window.demoteAdmin = function(id) {
  if (!confirm("Are you sure you want to demote this administrator to regular user?")) return;
  fetch(`/api/admin/users/${id}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'user' })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      showAdminToast('Admin demoted to regular user.');
      fetchAdminAllData();
    }
  });
};

window.toggleDomain = function(id) {
  fetch(`/api/admin/domains/${id}/toggle`, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showAdminToast('Domain status updated.');
        fetchAdminAllData();
      }
    });
};

window.deleteDomainPrompt = function(id, domain) {
  if (!confirm(`Delete domain "${domain}"? Links using it will fall back to default domain.`)) return;
  fetch(`/api/admin/domains/${id}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showAdminToast('Domain deleted.');
        fetchAdminAllData();
      } else {
        showAdminToast(`❌ ${data.error}`);
      }
    });
};

window.toggleLink = function(id) {
  fetch(`/api/admin/links/${id}/toggle`, { method: 'POST' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showAdminToast('Link status updated.');
        fetchAdminAllData();
      }
    });
};

window.deleteLinkPrompt = function(id, slug) {
  if (!confirm(`Delete link "/${slug}"?`)) return;
  fetch(`/api/admin/links/${id}`, { method: 'DELETE' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        showAdminToast('Link deleted.');
        fetchAdminAllData();
      }
    });
};

window.verifyInvoice = function(id, status) {
  const actionName = status === 'Paid' ? 'APPROVE' : 'REJECT';
  if (!confirm(`Confirm ${actionName} this deposit transaction?`)) return;

  fetch(`/api/admin/invoices/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(r => r.json()).then(data => {
    if (data.success) {
      showAdminToast(`✓ Invoice ${status === 'Paid' ? 'Approved & User Credited' : 'Rejected'}!`);
      fetchAdminAllData();
    } else {
      showAdminToast(`❌ ${data.error}`);
    }
  });
};

window.copyText = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showAdminToast(`Copied: ${text}`);
  });
};

function showAdminToast(msg) {
  let toast = document.getElementById('adminToastPopup');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToastPopup';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      border: 1px solid rgba(217, 119, 6, 0.45);
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      color: #fff;
      padding: 12px 20px;
      border-radius: 14px;
      font-size: 13px;
      font-weight: 700;
      z-index: 100000;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3500);
}

// Helpers
function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function safeSetValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined ? val : '';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
