/* =========================================================
   Aire app — core: helpers, icons, shell, router, auth, shared views
   ========================================================= */
(function () {
  const A = window.Aire;
  const U = A.util;

  /* ---------- helpers ---------- */
  const h = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    rebook: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    list: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    euro: '<path d="M17 6a7 7 0 1 0 0 12"/><path d="M4 10h9M4 14h9"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    star: '<path d="M12 17.3l-6.2 3.6 1.6-7L2 9.2l7.1-.6L12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    car: '<rect x="3" y="11" width="18" height="7" rx="2"/><path d="M5 11l2-5h10l2 5M7 18v2M17 18v2"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.info}</svg>`;
  const stars = (r) => { const n = Math.round(r); return `<span class="stars" aria-label="${r} out of 5">${"★".repeat(n)}${"☆".repeat(5 - n)}</span>`; };
  const avatar = (u, lg) => `<div class="avatar av-${(u.hue != null ? u.hue : U.hashStr(u.id)) % 4}${lg ? " lg" : ""}" aria-hidden="true">${h(A.initials(u))}</div>`;
  function badges(s) {
    return `<div class="badges">${A.constants.CHECKS.map((c) => {
      const st = A.checkStatus(s.verification[c.key]);
      return st === "verified" ? `<span class="badge ${c.cls}">✓ ${c.short}</span>` : st === "expired" ? `<span class="badge off">${c.short} expired</span>` : "";
    }).join("")}${s.age < 18 ? '<span class="badge id">16–17 · guardian consent</span>' : ""}</div>`;
  }
  const parentBadges = (p) => `<div class="badges">${p.verified && p.verified.id ? '<span class="badge id">✓ ID verified</span>' : ""}${p.verified && p.verified.phone ? '<span class="badge garda">✓ Phone verified</span>' : ""}</div>`;
  const statusChip = (b) => { const s = A.bookingState(b); const label = { pending: "Awaiting sitter", confirmed: "Confirmed", active: "In progress", completed: "Completed", cancelled: "Cancelled", declined: b.declineReason === "expired" ? "Expired" : "Declined" }[s]; return `<span class="status st-${s}">${label}</span>`; };
  const timeRange = (b) => `${U.fmtTime(b.start)}–${U.fmtTime(b.end)}`;
  const kidsText = (kids) => kids.length ? `${kids.length} · ${kids.map((c) => `${h(c.nickname)} (${c.age})`).join(", ")}` : "—";
  const ago = (isoStr) => { const m = Math.round((Date.now() - new Date(isoStr)) / 60e3); if (m < 1) return "just now"; if (m < 60) return m + " min ago"; const hh = Math.round(m / 60); if (hh < 24) return hh + " h ago"; return Math.round(hh / 24) + " d ago"; };
  const empty = (ic, text, extra = "") => `<div class="empty">${icon(ic)}<p>${text}</p>${extra}</div>`;
  function nextSlot() { const d = new Date(Date.now() + 60 * 60e3); d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0); return { date: U.iso(d), start: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` }; }
  function formData(form) { const o = {}; new FormData(form).forEach((v, k) => { if (o[k] !== undefined) o[k] = [].concat(o[k], v); else o[k] = v; }); return o; }

  /* ---------- toast / modal ---------- */
  function toast(text, kind = "") {
    const el = document.createElement("div");
    el.className = "toast " + kind; el.textContent = text;
    document.getElementById("toasts").appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }
  function modal(title, body, foot = "") {
    document.getElementById("modal-root").innerHTML = `<div class="modal-back" data-act="modal-close-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="modal-head"><h2 id="mt">${title}</h2><button class="icon-btn" data-act="modal-close" aria-label="Close">${icon("x")}</button></div>${body}${foot ? `<div class="modal-foot">${foot}</div>` : ""}</div></div>`;
    const f = document.querySelector("#modal-root input, #modal-root textarea, #modal-root select");
    if (f) f.focus();
  }
  const closeModal = () => { document.getElementById("modal-root").innerHTML = ""; };

  /* ---------- routing ---------- */
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    const parts = path.split("/").filter(Boolean);
    const query = Object.fromEntries(new URLSearchParams(qs || ""));
    return { path, parts, query };
  }
  const go = (hash) => { if (location.hash === hash) render(); else location.hash = hash; };

  const NAV = {
    parent: [["home", "Home", "home"], ["search", "Search", "search"], ["bookings", "Bookings", "list"], ["rebook", "Rebook", "rebook"], ["profile", "Profile", "user"]],
    sitter: [["requests", "Requests", "inbox"], ["calendar", "Calendar", "calendar"], ["earnings", "Earnings", "euro"], ["profile", "Profile", "user"]],
  };
  const views = {};          // filled by role modules: views[role][name] = fn(me, route) -> {title, html, after?}
  const shared = {};         // views available to both roles
  const DEMO = { parent: "p_odonnell", sitter: "s_ellie" };

  function shell(me, route, view) {
    const nav = NAV[me.role];
    const cur = route.parts[0];
    const unread = A.db.notifications.filter((n) => n.userId === me.id && !n.read).length;
    const isDemo = me.id === DEMO.parent || me.id === DEMO.sitter;
    const active = A.bookingsFor(me).find((b) => A.bookingState(b) === "active");
    const link = (cls) => ([k, label, ic]) => `<a class="${cls}${cur === k ? " active" : ""}" href="#/${k}"${cur === k ? ' aria-current="page"' : ""}>${icon(ic)}<span>${label}</span></a>`;
    return `
    <div class="app-shell">
      <aside class="app-side" aria-label="App navigation">
        <a class="brand" href="index.html"><img src="assets/logo-mark.png" alt=""><span>AIRE</span></a>
        ${nav.map(link("side-link")).join("")}
        <a class="side-link${cur === "safety" ? " active" : ""}" href="#/safety">${icon("shield")}<span>Safety centre</span></a>
        <div class="side-foot">
          ${isDemo ? `<div class="small muted" style="font-weight:700;padding:0 6px">Demo view</div><div class="role-switch"><button class="${me.role === "parent" ? "on" : ""}" data-act="switch-role" data-role="parent">Parent</button><button class="${me.role === "sitter" ? "on" : ""}" data-act="switch-role" data-role="sitter">Sitter</button></div>` : ""}
          <a class="side-link" href="index.html">${icon("globe")}<span>Website</span></a>
          <button class="side-link" style="border:0;background:none;cursor:pointer;font:inherit" data-act="logout">${icon("logout")}<span>Log out</span></button>
        </div>
      </aside>
      <div class="app-main">
        <header class="app-top">
          <div class="row" style="gap:10px;flex-wrap:nowrap;min-width:0">
            <a class="brand mobile-brand" href="#/" aria-label="Aire home"><img src="assets/logo-mark.png" alt=""></a>
            <h1>${h(view.title)}</h1>
          </div>
          <div class="actions">
            ${isDemo ? `<button class="btn light sm mobile-only-switch" data-act="switch-role" data-role="${me.role === "parent" ? "sitter" : "parent"}" title="Switch demo role">${me.role === "parent" ? "Sitter view" : "Parent view"}</button>` : ""}
            <button class="icon-btn" data-theme-toggle aria-label="Toggle theme"></button>
            <a class="icon-btn" href="#/notifications" aria-label="Notifications${unread ? ` (${unread} unread)` : ""}">${icon("bell")}${unread ? `<span class="dot">${unread}</span>` : ""}</a>
            <a href="#/profile" aria-label="Your profile" style="text-decoration:none">${avatar(me)}</a>
          </div>
        </header>
        <main class="app-content" id="view">${view.html}</main>
      </div>
    </div>
    <nav class="bottom-nav" aria-label="App navigation">${nav.map(link("")).join("")}</nav>
    ${active ? `<button class="sos" data-act="sos" data-id="${active.id}">${icon("alert")} Emergency</button>` : ""}`;
  }

  function render() {
    A.housekeeping();
    const route = parseHash();
    const root = document.getElementById("root");
    const me = A.me();
    const first = route.parts[0] || "";
    if (["login", "signup", "demo"].includes(first)) {
      if (me && first !== "demo") return go(me.role === "parent" ? "#/home" : "#/requests");
      root.innerHTML = authView(first, route);
      document.title = "Aire · " + ({ login: "Log in", signup: "Sign up", demo: "Demo" }[first]);
      window.AireTheme && window.AireTheme.paint();
      return;
    }
    if (!me) return go("#/login");
    if (!first) return go(me.role === "parent" ? "#/home" : "#/requests");
    const fn = (views[me.role] && views[me.role][first]) || shared[first];
    const view = fn ? fn(me, route) : { title: "Not found", html: empty("info", "That page doesn't exist.", `<a class="btn" href="#/">Go home</a>`) };
    if (!view) return; // view redirected
    root.innerHTML = shell(me, route, view);
    document.title = "Aire · " + view.title;
    window.AireTheme && window.AireTheme.paint();
    if (view.after) view.after();
    if (!route.query.keep) window.scrollTo(0, 0);
  }

  /* ---------- auth ---------- */
  function authView(kind, route) {
    const card = (inner) => `<div class="auth-wrap"><div class="auth-card"><a class="brand" href="index.html"><img src="assets/logo-mark.png" alt=""><span>AIRE</span></a>${inner}</div></div><button class="icon-btn" data-theme-toggle style="position:fixed;top:16px;right:16px" aria-label="Toggle theme"></button>`;
    if (kind === "demo") {
      return card(`
        <h2 class="center" style="font-size:1.5rem">Try the demo</h2>
        <p class="muted center">Pick a side. You can switch between parent and sitter any time from the menu.</p>
        <div class="stack">
          <button class="sitter-row" style="width:100%;text-align:left;cursor:pointer;font:inherit;color:inherit" data-act="demo" data-role="parent">${avatar(A.user(DEMO.parent))}<div class="info"><h3>I'm a parent</h3><div class="meta">The O'Donnell family · Cork City · 2 children</div></div>${icon("back").replace("M15 18l-6-6 6-6", "M9 18l6-6-6-6")}</button>
          <button class="sitter-row" style="width:100%;text-align:left;cursor:pointer;font:inherit;color:inherit" data-act="demo" data-role="sitter">${avatar(A.user(DEMO.sitter))}<div class="info"><h3>I'm a babysitter</h3><div class="meta">Ellie McGrath · UCC student · fully vetted</div></div>${icon("back").replace("M15 18l-6-6 6-6", "M9 18l6-6-6-6")}</button>
        </div>
        <p class="small muted center" style="margin-top:16px">Demo logins (password <b>demo123</b>): sally@demo.ie · ellie@demo.ie</p>
        <p class="center small"><a href="#/login">Log in</a> · <a href="#/signup">Create an account</a></p>`);
    }
    if (kind === "login") {
      return card(`
        <h2 class="center" style="font-size:1.5rem">Welcome back</h2>
        <form data-form="login" class="stack" novalidate>
          <label class="field">Email<input name="email" type="email" autocomplete="email" required></label>
          <label class="field">Password<input name="password" type="password" autocomplete="current-password" required></label>
          <p class="small" id="auth-err" style="color:var(--danger);margin:0" role="alert"></p>
          <button class="btn block">Log in</button>
        </form>
        <hr class="soft">
        <a class="btn ghost block" href="#/demo">Try the demo instead</a>
        <p class="center small" style="margin-top:12px">New to Aire? <a href="#/signup">Create an account</a></p>`);
    }
    const role = route.query.role === "sitter" ? "sitter" : "parent";
    const cities = `<select name="city" required><option>Cork</option><option>Dublin</option></select>`;
    return card(`
      <h2 class="center" style="font-size:1.5rem">Create your account</h2>
      <div class="role-switch" style="margin-bottom:16px"><button class="${role === "parent" ? "on" : ""}" data-act="go" data-href="#/signup?role=parent">I'm a parent</button><button class="${role === "sitter" ? "on" : ""}" data-act="go" data-href="#/signup?role=sitter">I'm a babysitter</button></div>
      <form data-form="signup" data-role="${role}" class="form-grid" novalidate>
        ${role === "parent" ? `
          <label class="field">Your name<input name="name" required autocomplete="name"></label>
          <label class="field">Family display name<input name="familyName" placeholder="The Kelly family" required></label>
        ` : `
          <label class="field">Full name<input name="name" required autocomplete="name"></label>
          <label class="field">Date of birth<input name="dob" type="date" required max="${U.dayISO(0)}"><span class="hint">You must be 16 or older</span></label>
          <label class="check full" id="guardian-row" hidden><input type="checkbox" name="guardianConsent"> <span>I'm 16 or 17 and my parent or guardian consents to my Garda vetting and use of Aire.</span></label>
        `}
        <label class="field">Email<input name="email" type="email" required autocomplete="email"></label>
        <label class="field">Mobile<input name="phone" type="tel" placeholder="+353 87…" autocomplete="tel"></label>
        <label class="field">Password<input name="password" type="password" minlength="8" required autocomplete="new-password"><span class="hint">8+ characters</span></label>
        <label class="field">City${cities}</label>
        <label class="field full">Area<input name="area" placeholder="e.g. Douglas" required><span class="hint">Only your area is shown on your profile${role === "parent" ? ". Your full address is shared with a sitter only after a booking is confirmed." : "."}</span></label>
        ${role === "parent" ? `<label class="field full">Home address <span class="hint">(private)</span><input name="address" autocomplete="street-address"></label>` : ""}
        <label class="check full"><input type="checkbox" name="terms" required> <span>I agree to the Terms and have read the <a href="safety.html" target="_blank">Privacy &amp; Safeguarding notice</a>.</span></label>
        <p class="small full" id="auth-err" style="color:var(--danger);margin:0" role="alert"></p>
        <button class="btn block full ${role === "sitter" ? "blue" : ""}">Create account</button>
      </form>
      <p class="center small" style="margin-top:12px">Already have an account? <a href="#/login">Log in</a> · <a href="#/demo">Demo</a></p>
      <p class="center small muted">Prototype: data is stored only in this browser.</p>`);
  }
  function ageFrom(dob) { const d = new Date(dob), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; }

  /* ---------- shared views ---------- */
  shared.notifications = (me) => {
    const list = A.db.notifications.filter((n) => n.userId === me.id);
    return {
      title: "Notifications",
      html: `<div class="panel"><div class="panel-head"><h2>Updates</h2>${list.some((n) => !n.read) ? `<button class="btn ghost sm" data-act="read-all">Mark all read</button>` : ""}</div>
      ${list.length ? list.map((n) => `<a class="notif ${n.read ? "" : "unread"}" href="${h(n.link || "#/")}" data-act="read-notif" data-id="${n.id}" style="text-decoration:none;color:inherit"><div class="ic">${icon(n.icon)}</div><div><div style="font-weight:700">${h(n.text)}</div><div class="small muted">${ago(n.at)}</div></div></a>`).join("") : empty("bell", "You're all caught up.")}</div>`,
    };
  };

  shared.safety = (me) => {
    const mine = A.bookingsFor(me).filter((b) => ["confirmed", "completed"].includes(b.status)).slice(-8).reverse();
    const reports = A.db.reports.filter((r) => r.from === me.id);
    return {
      title: "Safety centre",
      html: `
      <div class="panel pink"><div class="spread"><div><h2 style="margin:0">In an emergency</h2><p class="muted" style="margin:4px 0 0">If a child is in danger, call emergency services first.</p></div><div class="row"><a class="btn danger" href="tel:112">Call 112</a><a class="btn danger ghost" href="tel:999">Call 999</a></div></div></div>
      <div class="grid c2">
        <div class="panel">
          <h2>Report a concern</h2>
          <p class="muted small">Reports go straight to our named safeguarding lead. If the concern is about a child's safety, the sitter is suspended while we review it, and we escalate to Tusla and An Garda Síochána where appropriate.</p>
          <form data-form="report" class="stack">
            <label class="field">What's it about?<select name="category" required><option>Child safety concern</option><option>Inappropriate behaviour</option><option>Request to pay or contact off the app</option><option>Fake profile or vetting</option><option>Something else</option></select></label>
            <label class="field">Related booking <span class="hint">(optional)</span><select name="bookingId"><option value="">None</option>${mine.map((b) => { const o = A.user(me.role === "parent" ? b.sitterId : b.parentId); return `<option value="${b.id}">${U.fmtDate(b.date)} · ${h(o ? A.publicName(o) : "Deleted user")}</option>`; }).join("")}</select></label>
            <label class="field">Details<textarea name="details" required placeholder="Tell us what happened"></textarea></label>
            <button class="btn">Send report</button>
          </form>
        </div>
        <div>
          <div class="panel blue"><h2>Helplines</h2><ul class="list-plain"><li><b>Emergency:</b> 112 / 999</li><li><b>Tusla</b> (child welfare concerns): tusla.ie</li><li><b>Childline</b> (ISPCC): 1800 66 66 66</li><li><b>Aire safeguarding lead:</b> in-app report, reviewed within 24 h</li></ul></div>
          <div class="panel"><h2>How Aire keeps you safe</h2><ul class="ticks small"><li>Every sitter is Garda vetted, Children First certified and first aid trained</li><li>Parents' ID and phone are verified</li><li>Full address revealed only ${A.constants.ADDRESS_REVEAL_HOURS} h before a confirmed booking</li><li>Phone numbers and off-app payment requests are hidden in chat</li><li>Care notes deleted ${A.constants.CARE_NOTE_RETENTION_DAYS} days after a booking</li></ul><a class="btn ghost sm" href="safety.html" target="_blank">Read our full safety &amp; privacy policy</a></div>
          ${reports.length ? `<div class="panel"><h2>Your reports</h2><ul class="list-plain">${reports.map((r) => `<li><b>${h(r.category)}</b> <span class="status st-pending">${r.status}</span><div class="small muted">${ago(r.at)}</div></li>`).join("")}</ul></div>` : ""}
        </div>
      </div>`,
    };
  };

  /* booking detail (both roles) */
  shared.booking = (me, route) => {
    const b = A.db.bookings.find((x) => x.id === route.parts[1]);
    if (!b || (b.parentId !== me.id && b.sitterId !== me.id)) return { title: "Booking", html: empty("info", "Booking not found.", `<a class="btn" href="#/">Go home</a>`) };
    const isParent = me.role === "parent";
    const other = A.user(isParent ? b.sitterId : b.parentId);
    const parent = A.user(b.parentId);
    const state = A.bookingState(b);
    const msgs = A.db.messages[b.id] || [];
    const canChat = ["pending", "confirmed", "completed"].includes(b.status) && other;
    const addr = A.canSeeAddress(b);
    const p = b.price;
    const cost = isParent
      ? `<div class="cost"><div><span>${p.hours} h × ${U.euro(p.rate)}</span><b>${U.euro(p.base)}</b></div>${p.extra ? `<div><span>Extra children</span><b>${U.euro(p.extra)}</b></div>` : ""}${p.infant ? `<div><span>Under-2s surcharge</span><b>${U.euro(p.infant)}</b></div>` : ""}<div><span>Service fee (10%)</span><b>${U.euro(p.fee)}</b></div>${p.ride ? `<div><span>Safe ride home (est.)</span><b>${U.euro(p.ride)}</b></div>` : ""}<div class="total"><span>Total</span><span>${U.euro(p.total)}</span></div></div>`
      : `<div class="cost"><div><span>${p.hours} h · ${U.euro(p.hourly)}/h incl. extras</span><b>${U.euro(p.subtotal)}</b></div><div class="small muted"><span>You keep 100% of your rate. The family pays the service fee.</span></div><div class="total"><span>Your earnings</span><span>${U.euro(p.subtotal)}</span></div></div>`;

    let actions = "";
    if (state === "pending" && !isParent) actions = `<button class="btn" data-act="accept" data-id="${b.id}">Accept</button><button class="btn light" data-act="decline" data-id="${b.id}">Decline</button>`;
    else if (state === "pending" && isParent) actions = `<div class="searching"><span class="spinner"></span> Waiting for ${h(A.publicName(other))} to accept…</div><button class="btn light sm" data-act="cancel" data-id="${b.id}">Cancel request</button>`;
    else if (state === "confirmed") actions = `${!isParent ? `<button class="btn blue sm" data-act="trusted" data-id="${b.id}">${icon("user")} Share with a trusted contact</button>` : ""}<button class="btn light sm" data-act="cancel" data-id="${b.id}">Cancel booking</button>`;
    else if (state === "active") actions = `<button class="btn danger" data-act="sos" data-id="${b.id}">${icon("alert")} Emergency</button>${!isParent ? `<button class="btn blue sm" data-act="trusted" data-id="${b.id}">Share with a trusted contact</button>` : ""}`;
    else if (state === "completed") {
      const reviewed = isParent ? b.reviewedByParent : b.reviewedBySitter;
      actions = `${!reviewed && other ? `<button class="btn yellow" data-act="review" data-id="${b.id}">${icon("star")} Rate ${h(A.publicName(other))}</button>` : `<span class="pill">✓ You've left a rating</span>`}${isParent && other && A.isSearchable(other) ? `<a class="btn light sm" href="#/book/${other.id}">Rebook</a>` : ""}`;
    }

    return {
      title: "Booking",
      html: `
      <a href="${isParent ? "#/bookings" : "#/requests"}" class="btn ghost sm" style="margin-bottom:10px">${icon("back")} Back</a>
      <div class="panel ${state === "pending" ? "yellow" : state === "active" ? "pink" : ""}">
        <div class="spread"><h2 style="margin:0">${U.fmtDate(b.date, true)} · ${timeRange(b)}</h2>${statusChip(b)}</div>
        ${b.status === "cancelled" ? `<p class="muted small" style="margin:8px 0 0">Cancelled by the ${b.cancelledBy}. ${isParent ? (b.refund === "full" ? "You have been refunded in full." : "Cancelled within 24 hours, so 50% of the sitter's fee is charged.") : ""}</p>` : ""}
        <div class="row" style="margin-top:14px">${actions}</div>
      </div>
      <div class="grid c2">
        <div>
          <div class="panel">
            <div class="row" style="flex-wrap:nowrap">${other ? avatar(other) : ""}<div style="min-width:0"><h3 style="margin:0">${other ? h(A.publicName(other)) : "Deleted account"}</h3>${other ? `<div class="small muted">${stars(A.rating(other))} ${A.rating(other) || "New"} · ${h(other.area)}</div>${isParent ? badges(other) : parentBadges(other)}` : ""}</div></div>
            ${isParent && other ? `<div class="row" style="margin-top:12px"><a class="btn light sm" href="#/sitter/${other.id}">View profile</a></div>` : ""}
          </div>
          <div class="panel">
            <h3>Details</h3>
            <div class="kv"><div><small>Children</small><b>${kidsText(b.children)}</b></div><div><small>Hours</small><b>${p.hours}</b></div></div>
            <hr class="soft">
            <h3>${icon("pin").replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-3px"')} Address</h3>
            ${isParent ? `<p style="margin:0">${h(parent.address || parent.area)}</p><p class="small muted" style="margin:4px 0 0">${b.status === "confirmed" ? (addr ? "Shared with your sitter." : `Shared with your sitter from ${A.addressRevealAt(b).toLocaleString("en-IE", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.`) : "Your sitter only sees your area until the booking is confirmed."}</p>`
              : addr ? `<p style="margin:0"><b>${h(parent.address || parent.area)}</b></p><p class="small muted" style="margin:4px 0 0">Please don't share or save this address.</p>`
              : `<p style="margin:0">${icon("lock").replace("<svg", '<svg style="width:16px;height:16px;vertical-align:-2px"')} ${h(parent.area)}, ${h(parent.city)}</p><p class="small muted" style="margin:4px 0 0">${b.status === "confirmed" ? `The full address unlocks ${A.addressRevealAt(b).toLocaleString("en-IE", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}.` : "The full address is shared only after you accept, close to the start time."}</p>`}
            <hr class="soft">
            <h3>Care notes</h3>
            ${b.notesPurged ? `<p class="small muted">Deleted under our ${A.constants.CARE_NOTE_RETENTION_DAYS}-day retention policy.</p>` : b.notes ? `<p style="margin:0">${h(b.notes)}</p><p class="small muted" style="margin:4px 0 0">Visible only to the booked sitter. Deleted ${A.constants.CARE_NOTE_RETENTION_DAYS} days after the booking.</p>` : `<p class="small muted" style="margin:0">No notes.</p>`}
            ${b.uber ? `<hr class="soft"><h3>${icon("car").replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-3px"')} Safe ride home</h3><p class="small muted">${isParent ? "You've added an Uber ride home for your sitter. Only pick-up and drop-off details are shared, never anything about your children." : "The family is covering your Uber home. Request it when you're ready to leave."}</p>${["confirmed", "active"].includes(state) ? `<a class="btn light sm" href="https://m.uber.com/ul/?action=setPickup&pickup=my_location" target="_blank" rel="noopener">Open Uber</a>` : ""}` : ""}
          </div>
          <div class="panel"><h3>Payment</h3>${cost}<p class="small muted" style="margin:10px 0 0">Paid securely through Stripe${b.payment ? ` · ${h(b.payment.brand)} •••• ${h(b.payment.last4)}` : ""}. Aire never stores card numbers.</p></div>
        </div>
        <div class="panel" style="align-self:start">
          <div class="panel-head"><h3>${icon("chat").replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-3px"')} Messages</h3><button class="btn ghost sm" data-act="report-link" data-id="${b.id}">Report</button></div>
          <div class="chat" id="chat">${msgs.length ? msgs.map((m) => m.from === "system" ? `<div class="msg system">${h(m.text)}</div>` : `<div class="msg ${m.from === me.id ? "me" : "them"}">${h(m.text)}<time>${new Date(m.at).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time></div>`).join("") : `<p class="small muted center">No messages yet. Keep all contact in Aire, where it's protected.</p>`}</div>
          ${canChat ? `<form data-form="chat" data-id="${b.id}" class="chat-form"><input name="text" placeholder="Write a message…" autocomplete="off" required aria-label="Message"><button class="btn sm">Send</button></form>` : `<p class="small muted">Messaging is closed for this booking.</p>`}
        </div>
      </div>`,
      after() { const c = document.getElementById("chat"); if (c) c.scrollTop = c.scrollHeight; },
    };
  };

  /* ---------- bots: simulated replies from seeded users ---------- */
  const isBot = (u) => u && ((u.role === "sitter" && u.autoRespond) || ["p_murphy", "p_obrien"].includes(u.id));
  const REPLIES = ["Thanks! See you then 😊", "Perfect, thanks for letting me know.", "No problem at all!", "Great, I'll keep that in mind."];
  function botReply(bookingId, botId) {
    setTimeout(() => {
      const b = A.db.bookings.find((x) => x.id === bookingId);
      if (!b) return;
      A.sendMessage(bookingId, botId, REPLIES[Math.floor(Math.random() * REPLIES.length)]);
      if (parseHash().parts[1] === bookingId) render();
      else toast("New message from " + A.publicName(A.user(botId)), "pink");
    }, 2200);
  }
  function scheduleAutoAccept(b) {
    const s = A.user(b.sitterId);
    if (!s || !s.autoRespond || b.status !== "pending") return;
    setTimeout(() => {
      const cur = A.db.bookings.find((x) => x.id === b.id);
      if (!cur || cur.status !== "pending") return;
      A.respond(b.id, true);
      const me = A.me();
      if (me && me.id === b.parentId) { toast(`Sitter found! ${A.publicName(s)} accepted your booking.`, "ok"); render(); }
    }, 3500);
  }

  window.AireUI = { A, U, h, icon, stars, avatar, badges, parentBadges, statusChip, timeRange, kidsText, ago, empty, nextSlot, formData, toast, modal, closeModal, parseHash, go, render, views, shared, DEMO, ageFrom, isBot, botReply, scheduleAutoAccept };
})();
