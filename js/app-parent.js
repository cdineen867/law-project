/* =========================================================
   Aire app — parent views
   ========================================================= */
(function () {
  const { A, U, h, icon, stars, avatar, badges, statusChip, timeRange, kidsText, empty, nextSlot, views } = window.AireUI;
  const V = (views.parent = {});
  const AGES = A.constants.AGE_BRACKETS;

  function kidChips(me, selectedIds) {
    if (!me.children.length) return `<div class="panel purple" style="margin:0"><p style="margin:0 0 8px"><b>Add your children first.</b> We only need a nickname and an age bracket. No photos, surnames or schools.</p><button type="button" class="btn sm" data-act="add-child">${icon("plus")} Add a child</button></div>`;
    return `<div class="ages">${me.children.map((c) => { const on = !selectedIds || selectedIds.includes(c.id); return `<label class="chip ${on ? "on" : ""}"><input type="checkbox" name="kids" value="${c.id}" ${on ? "checked" : ""}>${h(c.nickname)} · ${c.age}</label>`; }).join("")}<button type="button" class="chip" data-act="add-child">${icon("plus").replace("<svg", '<svg style="width:14px;height:14px"')} Add</button></div>`;
  }
  function sitterRow(s, extra, q) {
    const qs = q ? "?" + new URLSearchParams(q).toString() : "";
    return `<div class="sitter-row">${avatar(s)}<div class="info"><h3>${h(A.publicName(s))}</h3><div class="meta">${stars(A.rating(s))} ${A.rating(s) || "New"} (${s.ratingCount}) · ${s.experience} yrs experience · ${s.distanceKm} km away</div>${badges(s)}${extra || ""}</div>
      <div class="btns"><div class="price">${U.euro(s.rate)}/h</div><a class="btn light sm" href="#/sitter/${s.id}${qs}">Profile</a><a class="btn sm" href="#/book/${s.id}${qs}">Book</a></div></div>`;
  }
  const bookingRow = (b) => {
    const s = A.user(b.sitterId);
    return `<a class="sitter-row" href="#/booking/${b.id}" style="text-decoration:none;color:inherit">${s ? avatar(s) : ""}<div class="info"><h3>${s ? h(A.publicName(s)) : "Deleted sitter"} ${statusChip(b)}</h3><div class="meta">${U.fmtDate(b.date)} · ${timeRange(b)} · ${b.children.length} child${b.children.length > 1 ? "ren" : ""}</div></div><div class="price">${U.euro(b.price.total)}</div></a>`;
  };

  /* ---------- HOME ---------- */
  V.home = (me) => {
    const unread = A.db.notifications.find((n) => n.userId === me.id && !n.read);
    const mine = A.bookingsFor(me);
    const upcoming = mine.filter((b) => ["pending", "confirmed"].includes(b.status)).sort((a, b) => A.bookingStart(a) - A.bookingStart(b));
    const toRate = mine.filter((b) => b.status === "completed" && !b.reviewedByParent && A.user(b.sitterId));
    const recent = recentSitters(me).slice(0, 3);
    const slot = nextSlot();
    return {
      title: "Home",
      html: `
      ${unread ? `<div class="panel yellow spread"><div><b>${h(unread.text)}</b></div><a class="btn sm" href="${h(unread.link)}" data-act="read-notif" data-id="${unread.id}">View</a></div>` : ""}
      <div class="panel yellow">
        <h2>Need a babysitter?</h2>
        <form data-form="find" class="form-grid">
          <label class="field">Date<input type="date" name="date" value="${slot.date}" min="${U.dayISO(0)}" required></label>
          <div class="form-grid" style="gap:10px"><label class="field">From<input type="time" name="start" value="${slot.start}" required></label><label class="field">Until<input type="time" name="end" value="23:00" required></label></div>
          <div class="full"><div class="field" style="margin-bottom:6px">Children</div>${kidChips(me)}</div>
          <button class="btn yellow full block">${icon("search")} Find a babysitter</button>
        </form>
      </div>
      ${toRate.length ? `<div class="panel pink spread"><div><b>How did ${h(A.publicName(A.user(toRate[0].sitterId)))} get on?</b><div class="small muted">${U.fmtDate(toRate[0].date)} · your rating helps other parents</div></div><button class="btn pink sm" data-act="review" data-id="${toRate[0].id}">Rate now</button></div>` : ""}
      <div class="panel"><div class="panel-head"><h2>Upcoming</h2><a class="btn ghost sm" href="#/bookings">All bookings</a></div>${upcoming.length ? upcoming.slice(0, 3).map(bookingRow).join("") : empty("calendar", "No upcoming bookings.")}</div>
      <div class="panel"><div class="panel-head"><h2>Recent sitters</h2><a class="btn ghost sm" href="#/rebook">Rebook</a></div>${recent.length ? recent.map(({ s, count }) => `<div class="sitter-row">${avatar(s)}<div class="info"><h3>${h(A.publicName(s))}</h3><div class="meta">Booked ${count} time${count > 1 ? "s" : ""}</div></div><div class="btns">${A.isSearchable(s) ? `<a class="btn sm" href="#/book/${s.id}">Rebook</a>` : `<span class="small muted">Unavailable</span>`}</div></div>`).join("") : empty("heart", "Sitters you book will appear here.")}</div>`,
    };
  };

  function recentSitters(me) {
    const map = new Map();
    A.bookingsFor(me).filter((b) => b.status === "completed").sort((a, b) => A.bookingStart(b) - A.bookingStart(a)).forEach((b) => {
      const s = A.user(b.sitterId); if (!s) return;
      const e = map.get(s.id) || { s, count: 0, last: b };
      e.count++; map.set(s.id, e);
    });
    return [...map.values()];
  }

  /* ---------- SEARCH ---------- */
  let searchKey = null;
  V.search = (me, route) => {
    const q = route.query;
    const slot = nextSlot();
    const date = q.date || slot.date, start = q.start || slot.start, end = q.end || "23:00";
    const kidIds = q.kids ? q.kids.split(",") : me.children.map((c) => c.id);
    const children = me.children.filter((c) => kidIds.includes(c.id)).map(({ nickname, age }) => ({ nickname, age }));
    const sort = q.sort || "match", maxRate = Number(q.max) || 0, city = q.city || me.city;
    const key = JSON.stringify([date, start, end, kidIds, city]);
    const ready = searchKey === key;
    if (!ready) setTimeout(() => { searchKey = key; if (location.hash.startsWith("#/search")) window.AireUI.render(); }, 750);
    const results = children.length ? A.search({ city, date, start, end, children, maxRate, sort }) : [];
    const base = { date, start, end, kids: kidIds.join(",") };
    const past = A.util.at(date, start) < new Date();
    const form = `
      <form data-form="find" class="panel">
        <div class="form-grid">
          <label class="field">Date<input type="date" name="date" value="${date}" min="${U.dayISO(0)}"></label>
          <div class="form-grid" style="gap:10px"><label class="field">From<input type="time" name="start" value="${start}"></label><label class="field">Until<input type="time" name="end" value="${end}"></label></div>
          <div class="full"><div class="field" style="margin-bottom:6px">Children</div>${kidChips(me, kidIds)}</div>
          <label class="field">Sort by<select name="sort"><option value="match" ${sort === "match" ? "selected" : ""}>Best match</option><option value="rating" ${sort === "rating" ? "selected" : ""}>Highest rated</option><option value="price" ${sort === "price" ? "selected" : ""}>Lowest price</option><option value="distance" ${sort === "distance" ? "selected" : ""}>Nearest</option></select></label>
          <div class="form-grid" style="gap:10px"><label class="field">Max rate<select name="max"><option value="">Any</option>${[13, 14, 15, 16, 18].map((v) => `<option value="${v}" ${maxRate === v ? "selected" : ""}>€${v}/h</option>`).join("")}</select></label><label class="field">City<select name="city">${["Cork", "Dublin"].map((c) => `<option ${c === city ? "selected" : ""}>${c}</option>`).join("")}</select></label></div>
          <button class="btn full">${icon("search")} Update search</button>
        </div>
      </form>`;
    let body;
    if (!children.length) body = empty("heart", "Choose at least one child to search.");
    else if (past) body = empty("clock", "That start time has already passed. Choose a later time.");
    else if (!ready) body = `<div class="panel"><div class="searching"><span class="spinner"></span> Searching for vetted sitters near ${h(me.area || city)}…</div></div>`;
    else if (!results.length) body = empty("search", "No vetted sitters are free then. Try another time, a higher max rate, or fewer age groups.");
    else {
      const [best, ...rest] = results;
      body = `
      <div class="panel yellow"><div class="small muted" style="font-weight:800">Best match for ${U.fmtDate(date)}, ${U.fmtTime(start)}</div>
        ${sitterRow(best.sitter, `<p class="small" style="margin:6px 0 0">${h(best.sitter.about)}</p><div class="small" style="margin-top:4px"><b>Est. ${U.euro(best.price.subtotal)}</b> for ${best.price.hours} h <span class="muted">+ 10% service fee</span></div>`, base)}
      </div>
      ${rest.length ? `<h3>${rest.length} more sitter${rest.length > 1 ? "s" : ""} available</h3>${rest.map((r) => sitterRow(r.sitter, `<div class="small" style="margin-top:4px">Est. ${U.euro(r.price.subtotal)} for ${r.price.hours} h</div>`, base)).join("")}` : ""}`;
    }
    return { title: "Find a sitter", html: form + body };
  };

  /* ---------- SITTER PROFILE ---------- */
  V.sitter = (me, route) => {
    const s = A.user(route.parts[1]);
    if (!s || s.role !== "sitter") return { title: "Sitter", html: empty("info", "Sitter not found.") };
    const reviews = A.reviewsFor(s.id).slice(0, 6);
    const fav = me.favourites.includes(s.id);
    const qs = Object.keys(route.query).length ? "?" + new URLSearchParams(route.query).toString() : "";
    return {
      title: A.publicName(s),
      html: `
      <a href="javascript:history.back()" class="btn ghost sm" style="margin-bottom:10px">${icon("back")} Back</a>
      <div class="panel yellow center">
        <div style="display:grid;justify-items:center">${avatar(s, true)}</div>
        <h2 style="margin:10px 0 2px">${h(A.publicName(s))}</h2>
        <div class="muted">${s.age} · ${h(s.area)}, ${h(s.city)} · ${h(s.studying)}</div>
        <div style="display:flex;justify-content:center">${badges(s)}</div>
        <div class="row" style="justify-content:center;margin-top:14px">
          ${A.isSearchable(s) ? `<a class="btn" href="#/book/${s.id}${qs}">Book ${h(s.name.split(" ")[0])}</a>` : `<span class="pill">Not currently bookable</span>`}
          <button class="btn light" data-act="fav" data-id="${s.id}" aria-pressed="${fav}">${icon("heart").replace("<svg", `<svg style="width:18px;height:18px${fav ? ";fill:var(--pink);color:var(--pink)" : ""}"`)} ${fav ? "Favourite" : "Save"}</button>
        </div>
      </div>
      <div class="grid c2">
        <div>
          <div class="panel"><h3>Rating</h3><div class="spread"><span>${stars(A.rating(s))}</span><b>${A.rating(s) || "New"} (${s.ratingCount})</b></div></div>
          <div class="panel"><h3>About</h3><p style="margin:0">${h(s.about)}</p></div>
          <div class="panel"><h3>Details &amp; rates</h3><div class="kv">
            <div><small>Experience</small><b>${s.experience} years</b></div><div><small>Distance</small><b>${s.distanceKm} km</b></div>
            <div><small>Hourly rate</small><b>${U.euro(s.rate)}</b></div><div><small>Each extra child</small><b>+${U.euro(s.extraChild)}/h</b></div>
            <div><small>Under-2s</small><b>${s.ages.includes("0–1") ? "+" + U.euro(s.infantSurcharge) + "/h" : "Not offered"}</b></div><div><small>Ages</small><b>${s.ages.join(", ")}</b></div>
          </div></div>
        </div>
        <div>
          <div class="panel"><h3>Safety checks</h3><ul class="list-plain">${A.constants.CHECKS.map((c) => { const v = s.verification[c.key]; const st = A.checkStatus(v); return `<li class="spread"><span>${c.label}</span><span class="status ${st === "verified" ? "st-completed" : "st-pending"}">${st}${st === "verified" && v.expires ? ` · until ${U.fmtDate(v.expires, true)}` : ""}</span></li>`; }).join("")}</ul><p class="small muted" style="margin:8px 0 0">Badges show status only. Parents never see the underlying documents.</p></div>
          <div class="panel"><h3>Reviews</h3>${reviews.length ? `<ul class="list-plain">${reviews.map((r) => `<li>${stars(r.stars)} <span class="small muted">${U.fmtDate(r.date)} · ${h(A.user(r.parentId) ? A.user(r.parentId).name : "A parent")}</span><div>${h(r.text)}</div></li>`).join("")}</ul>` : `<p class="muted small">No reviews yet.</p>`}</div>
          <button class="btn ghost sm" data-act="report-about" data-id="${s.id}">${icon("alert").replace("<svg", '<svg style="width:16px;height:16px"')} Report this profile</button>
        </div>
      </div>`,
    };
  };

  /* ---------- BOOK & PAY ---------- */
  V.book = (me, route) => {
    const s = A.user(route.parts[1]);
    if (!s || !A.isSearchable(s)) return { title: "Book", html: empty("info", "This sitter can't be booked right now.", `<a class="btn" href="#/search">Find another sitter</a>`) };
    const q = route.query;
    const slot = nextSlot();
    const kidIds = q.kids ? q.kids.split(",") : null;
    return {
      title: "Book " + A.publicName(s),
      html: `
      <a href="javascript:history.back()" class="btn ghost sm" style="margin-bottom:10px">${icon("back")} Back</a>
      <form data-form="book" data-sitter="${s.id}" class="grid c2" style="align-items:start" novalidate>
        <div>
          <div class="panel"><div class="row" style="flex-wrap:nowrap">${avatar(s)}<div><h3 style="margin:0">${h(A.publicName(s))}</h3><div class="small muted">${stars(A.rating(s))} ${A.rating(s)} · ${U.euro(s.rate)}/h</div>${badges(s)}</div></div></div>
          <div class="panel">
            <h3>When</h3>
            <div class="form-grid">
              <label class="field full">Date<input type="date" name="date" value="${q.date || slot.date}" min="${U.dayISO(0)}" required></label>
              <label class="field">From<input type="time" name="start" value="${q.start || slot.start}" required></label>
              <label class="field">Until<input type="time" name="end" value="${q.end || "23:00"}" required></label>
            </div>
            <h3 style="margin-top:16px">Who</h3>
            ${kidChips(me, kidIds)}
            <p class="small muted" style="margin:8px 0 0">${h(A.publicName(s))} looks after ages ${s.ages.join(", ")}.</p>
            <label class="field" style="margin-top:14px">Care notes <span class="hint">Optional: allergies, bedtime, routines. Please don't include surnames or school names. Only this sitter will see them, and they're deleted ${A.constants.CARE_NOTE_RETENTION_DAYS} days after the booking.</span><textarea name="notes" maxlength="500" placeholder="e.g. Younger child has a peanut allergy. Bedtime is 8 pm."></textarea></label>
          </div>
        </div>
        <div>
          <div class="panel">
            <label class="spread" style="cursor:pointer"><span><b>${icon("car").replace("<svg", '<svg style="width:18px;height:18px;vertical-align:-3px"')} Safe ride home for ${h(s.name.split(" ")[0])}</b><span class="small muted" style="display:block">Uber, about ${U.euro(A.constants.RIDE_ESTIMATE)}. Only the pick-up and drop-off are shared.</span></span><span class="toggle"><input type="checkbox" name="uber" checked><span></span></span></label>
          </div>
          <div class="panel"><h3>Price</h3><div id="cost"></div></div>
          <div class="panel">
            <h3>Payment</h3>
            ${me.payment ? `<div class="spread"><span>${h(me.payment.brand)} •••• ${h(me.payment.last4)}</span><button type="button" class="btn ghost sm" data-act="change-card">Change</button></div><input type="hidden" name="useSaved" value="1">` : cardFields()}
            <p class="small muted" style="margin:10px 0 0">${icon("lock").replace("<svg", '<svg style="width:14px;height:14px;vertical-align:-2px"')} Payments are processed by Stripe (PCI DSS). Aire never sees or stores your full card number. You're only charged once the sitter accepts. Cancellation is free up to 24 h before the booking.</p>
          </div>
          <label class="check" style="margin-bottom:14px"><input type="checkbox" name="agree" required> <span>I confirm I'm the parent or guardian and agree that my full address is shared with this sitter once the booking is confirmed.</span></label>
          <p class="small" id="book-err" style="color:var(--danger)" role="alert"></p>
          <button class="btn pink block">Request booking</button>
        </div>
      </form>`,
      after() { window.AireParent.updateCost(); },
    };
  };
  function cardFields() {
    return `<div class="form-grid" id="card-fields">
      <label class="field full">Card number<input name="card" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="23"></label>
      <label class="field">Expiry<input name="exp" placeholder="MM/YY" autocomplete="cc-exp" maxlength="5"></label>
      <label class="field">CVC<input name="cvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4"></label>
      <label class="check full"><input type="checkbox" name="saveCard" checked> <span>Save this card securely (token only)</span></label>
      <p class="small muted full" style="margin:0">Demo: use 4242 4242 4242 4242, any future date and any CVC.</p></div>`;
  }
  function luhn(num) { let sum = 0, alt = false; for (let i = num.length - 1; i >= 0; i--) { let n = +num[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return num.length >= 13 && sum % 10 === 0; }
  function cardBrand(n) { return /^4/.test(n) ? "Visa" : /^(5[1-5]|2[2-7])/.test(n) ? "Mastercard" : /^3[47]/.test(n) ? "Amex" : "Card"; }
  function readCard(f) {
    const num = (f.card || "").replace(/\D/g, "");
    if (!luhn(num)) throw new Error("Please enter a valid card number.");
    const m = (f.exp || "").match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12 || new Date(2000 + +m[2], +m[1]) < new Date()) throw new Error("Please enter a valid expiry date (MM/YY).");
    if (!/^\d{3,4}$/.test(f.cvc || "")) throw new Error("Please enter the CVC.");
    return { brand: cardBrand(num), last4: num.slice(-4), token: "tok_" + U.uid("x").slice(2) };
  }

  /* ---------- BOOKINGS ---------- */
  V.bookings = (me, route) => {
    const tab = route.query.tab || "upcoming";
    const mine = A.bookingsFor(me);
    const up = mine.filter((b) => ["pending", "confirmed"].includes(b.status)).sort((a, b) => A.bookingStart(a) - A.bookingStart(b));
    const past = mine.filter((b) => !["pending", "confirmed"].includes(b.status)).sort((a, b) => A.bookingStart(b) - A.bookingStart(a));
    const list = tab === "upcoming" ? up : past;
    return {
      title: "Bookings",
      html: `<div class="tabs" role="tablist"><button role="tab" class="${tab === "upcoming" ? "on" : ""}" data-act="go" data-href="#/bookings?tab=upcoming">Upcoming (${up.length})</button><button role="tab" class="${tab === "past" ? "on" : ""}" data-act="go" data-href="#/bookings?tab=past">Past (${past.length})</button></div>
      ${list.length ? list.map(bookingRow).join("") : empty("calendar", tab === "upcoming" ? "No upcoming bookings." : "No past bookings yet.", tab === "upcoming" ? `<a class="btn" href="#/search">Find a sitter</a>` : "")}`,
    };
  };

  /* ---------- REBOOK ---------- */
  V.rebook = (me) => {
    const recent = recentSitters(me);
    const favs = me.favourites.map(A.user).filter(Boolean);
    const row = (s, meta) => `<div class="sitter-row">${avatar(s)}<div class="info"><h3>${h(A.publicName(s))}</h3><div class="meta">${meta}</div>${badges(s)}</div><div class="btns">${A.isSearchable(s) ? `<a class="btn yellow sm" href="#/book/${s.id}">Rebook</a>` : `<span class="small muted">Unavailable</span>`}<a class="btn light sm" href="#/sitter/${s.id}">Profile</a></div></div>`;
    return {
      title: "Rebook",
      html: `<div class="panel"><h2>Favourites</h2>${favs.length ? favs.map((s) => row(s, `${stars(A.rating(s))} ${A.rating(s)} · ${U.euro(s.rate)}/h`)).join("") : empty("heart", "Tap Save on a sitter's profile to add them here.")}</div>
      <div class="panel"><h2>Sitters you've used before</h2>${recent.length ? recent.map(({ s, count, last }) => row(s, `Last booked ${U.fmtDate(last.date)} · ${count} booking${count > 1 ? "s" : ""}`)).join("") : empty("rebook", "No past bookings yet.")}</div>`,
    };
  };

  /* ---------- PROFILE ---------- */
  V.profile = (me) => {
    const reviews = A.reviewsOfParent(me.id);
    return {
      title: "Profile",
      html: `
      <div class="panel yellow center">
        <div style="display:grid;justify-items:center">${avatar(me, true)}</div>
        <h2 style="margin:10px 0 2px">${h(me.name)}</h2>
        <div class="muted">${h(me.contact)} · ${h(me.area)}, ${h(me.city)}</div>
        <div style="display:flex;justify-content:center">${window.AireUI.parentBadges(me)}</div>
        <div style="margin-top:8px"><b>Your rating</b> ${stars(A.rating(me))} ${A.rating(me) || "New"} (${me.ratingCount || 0})</div>
      </div>
      <div class="grid c2">
        <div>
          <div class="panel"><div class="panel-head"><h3>Our children</h3><button class="btn sm" data-act="add-child">${icon("plus")} Add</button></div>
            ${me.children.length ? `<ul class="list-plain">${me.children.map((c) => `<li class="spread"><span><b>${h(c.nickname)}</b> <span class="muted">· age ${c.age}</span></span><span class="row"><button class="btn ghost sm" data-act="edit-child" data-id="${c.id}">Edit</button><button class="btn ghost sm" data-act="remove-child" data-id="${c.id}">Remove</button></span></li>`).join("")}</ul>` : `<p class="muted small">No children added yet.</p>`}
            <p class="small muted" style="margin:8px 0 0">We store only a nickname and an age bracket. No photos, surnames, birthdays or schools.</p></div>
          <form class="panel" data-form="parent-profile">
            <h3>About us</h3>
            <div class="form-grid">
              <label class="field">Family display name<input name="name" value="${h(me.name)}" required></label>
              <label class="field">Your name<input name="contact" value="${h(me.contact)}" required></label>
              <label class="field full">About<textarea name="about" maxlength="400">${h(me.about)}</textarea></label>
              <label class="field">City<select name="city">${["Cork", "Dublin"].map((c) => `<option ${c === me.city ? "selected" : ""}>${c}</option>`).join("")}</select></label>
              <label class="field">Area <span class="hint">(shown publicly)</span><input name="area" value="${h(me.area)}" required></label>
              <label class="field full">Home address <span class="hint">(private, shared only with a confirmed sitter ${A.constants.ADDRESS_REVEAL_HOURS} h before a booking)</span><input name="address" value="${h(me.address)}"></label>
              <label class="field">Mobile<input name="phone" value="${h(me.phone)}" type="tel"></label>
            </div>
            <button class="btn" style="margin-top:12px">Save changes</button>
          </form>
        </div>
        <div>
          ${securityPanel(me)}
          <div class="panel"><h3>Payment method</h3>${me.payment ? `<div class="spread"><span>${h(me.payment.brand)} •••• ${h(me.payment.last4)}</span><button class="btn ghost sm" data-act="remove-card">Remove</button></div>` : `<p class="muted small" style="margin:0">No saved card. You'll add one at checkout.</p>`}</div>
          <div class="panel"><h3>What sitters say</h3>${reviews.length ? `<ul class="list-plain">${reviews.map((r) => `<li>${stars(r.stars)} ${h(r.text)}</li>`).join("")}</ul>` : `<p class="muted small" style="margin:0">Sitters can rate families after each booking.</p>`}</div>
          ${window.AireShared.privacyPanel(me)}
        </div>
      </div>`,
    };
  };
  function securityPanel(me) {
    return `<div class="panel"><h3>Verification &amp; security</h3><ul class="list-plain">
      <li class="spread"><span>ID verified</span>${me.verified.id ? '<span class="status st-completed">verified</span>' : '<button class="btn sm" data-act="verify" data-k="id">Verify ID</button>'}</li>
      <li class="spread"><span>Phone verified</span>${me.verified.phone ? '<span class="status st-completed">verified</span>' : '<button class="btn sm" data-act="verify" data-k="phone">Verify phone</button>'}</li>
      <li class="spread"><span>Two-factor sign-in</span><label class="toggle"><input type="checkbox" data-act="2fa" ${me.twoFactor ? "checked" : ""} aria-label="Two-factor sign-in"><span></span></label></li></ul>
      <p class="small muted" style="margin:8px 0 0">Sitters can see that you're verified before they accept a booking.</p></div>`;
  }

  /* live cost update on the booking form */
  function updateCost() {
    const f = document.querySelector('form[data-form="book"]'); if (!f) return;
    const me = A.me(); const s = A.user(f.dataset.sitter);
    const ids = [...f.querySelectorAll('input[name="kids"]:checked')].map((i) => i.value);
    const kids = me.children.filter((c) => ids.includes(c.id));
    const el = document.getElementById("cost");
    if (!kids.length || !f.date.value || !f.start.value || !f.end.value) { el.innerHTML = '<p class="muted small" style="margin:0">Choose a time and at least one child.</p>'; return; }
    const p = A.price(s, kids, f.date.value, f.start.value, f.end.value, f.uber.checked);
    const unsupported = kids.filter((c) => !s.ages.includes(c.age));
    el.innerHTML = `<div class="cost"><div><span>${p.hours} h × ${U.euro(p.rate)}</span><b>${U.euro(p.base)}</b></div>${p.extra ? `<div><span>${kids.length - 1} extra child${kids.length > 2 ? "ren" : ""} (+${U.euro(s.extraChild)}/h)</span><b>${U.euro(p.extra)}</b></div>` : ""}${p.infant ? `<div><span>Under-2s surcharge</span><b>${U.euro(p.infant)}</b></div>` : ""}<div><span>Service fee (10%)</span><b>${U.euro(p.fee)}</b></div>${p.ride ? `<div><span>Safe ride home (est.)</span><b>${U.euro(p.ride)}</b></div>` : ""}<div class="total"><span>Total</span><span>${U.euro(p.total)}</span></div></div>${unsupported.length ? `<p class="small" style="color:var(--danger);margin:8px 0 0">${h(A.publicName(s))} doesn't look after age ${unsupported.map((c) => c.age).join(", ")}.</p>` : ""}${p.hours > 12 ? `<p class="small" style="color:var(--danger);margin:8px 0 0">Bookings can be at most 12 hours.</p>` : ""}`;
  }

  window.AireParent = { updateCost, readCard, cardFields, recentSitters };
})();
