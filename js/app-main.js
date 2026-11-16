/* =========================================================
   Aire app — event handling + start-up
   ========================================================= */
(function () {
  const UI = window.AireUI;
  const { A, U, h, icon, toast, modal, closeModal, go, render, formData, DEMO } = UI;

  const findBooking = (id) => A.db.bookings.find((b) => b.id === id);
  const err = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg; else toast(msg, "warn"); };

  /* ---------- modals ---------- */
  function childModal(child) {
    modal(child ? "Edit child" : "Add a child", `
      <form data-form="child" data-id="${child ? child.id : ""}" class="stack">
        <label class="field">Nickname or first name<input name="nickname" required maxlength="20" value="${child ? h(child.nickname) : ""}"><span class="hint">No surnames, please.</span></label>
        <label class="field">Age bracket<select name="age">${A.constants.AGE_BRACKETS.map((a) => `<option ${child && child.age === a ? "selected" : ""}>${a}</option>`).join("")}</select></label>
        <p class="small muted" style="margin:0">Children never have accounts, and we never store photos, birthdays or schools.</p>
        <div class="modal-foot"><button type="button" class="btn light" data-act="modal-close">Cancel</button><button class="btn">${child ? "Save" : "Add child"}</button></div>
      </form>`);
  }
  function reviewModal(b, me) {
    const other = A.user(me.role === "parent" ? b.sitterId : b.parentId);
    modal(`Rate ${h(A.publicName(other))}`, `
      <form data-form="review" data-id="${b.id}" class="stack">
        <div class="row" role="radiogroup" aria-label="Stars" style="font-size:2.2rem;gap:4px">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star-btn" data-act="star" data-v="${n}" aria-label="${n} star${n > 1 ? "s" : ""}" style="border:0;background:none;cursor:pointer;font-size:inherit;color:${n <= 5 ? "#f59e0b" : "var(--border)"}">★</button>`).join("")}</div>
        <input type="hidden" name="stars" value="5">
        <label class="field">Review <span class="hint">Reviews are moderated. Please don't include personal details.</span><textarea name="text" maxlength="400" placeholder="${me.role === "parent" ? "How did the booking go?" : "How was the family to work with?"}"></textarea></label>
        <div class="modal-foot"><button type="button" class="btn light" data-act="modal-close">Later</button><button class="btn yellow">Submit rating</button></div>
      </form>`);
  }
  function sosModal(b) {
    const me = A.me();
    const other = b && A.user(me.role === "parent" ? b.sitterId : b.parentId);
    modal(`<span style="color:var(--danger)">Emergency</span>`, `
      <p>If anyone is in danger, call emergency services now.</p>
      <div class="grid c2"><a class="btn danger block" href="tel:112">Call 112</a><a class="btn danger ghost block" href="tel:999">Call 999</a></div>
      <hr class="soft">
      ${other ? `<button class="btn block" data-act="sos-alert" data-id="${b.id}">Alert ${h(A.publicName(other))} now</button>` : ""}
      <a class="btn light block" style="margin-top:10px" href="#/safety" data-act="modal-close">Report a concern to our safeguarding lead</a>`);
  }
  function reportModal(opts) {
    modal("Report a concern", `
      <form data-form="report" class="stack" data-booking="${opts.bookingId || ""}" data-about="${opts.aboutId || ""}">
        <label class="field">What's it about?<select name="category"><option>Child safety concern</option><option>Inappropriate behaviour</option><option>Request to pay or contact off the app</option><option>Fake profile or vetting</option><option>Something else</option></select></label>
        <label class="field">Details<textarea name="details" required></textarea></label>
        <p class="small muted" style="margin:0">If a child is in immediate danger, call 112 or 999 first.</p>
        <div class="modal-foot"><button type="button" class="btn light" data-act="modal-close">Cancel</button><button class="btn danger">Send report</button></div>
      </form>`);
  }
  function checkModal(key) {
    const c = A.constants.CHECKS.find((x) => x.key === key);
    const copy = {
      id: "Upload a photo of your passport or driving licence, then take a live selfie. We match the two and delete the images once you're verified, keeping only the result.",
      garda: "Garda vetting is done through our registered vetting partner (National Vetting Bureau). We'll send you the NVB invitation form. Under-18s need a parent or guardian's consent.",
      childrenFirst: "Upload your Tusla Children First e-learning certificate.",
      firstAid: "Upload your Irish Red Cross (or equivalent) first aid certificate. It must be in date.",
    }[key];
    modal(c.label, `
      <form data-form="check" data-k="${key}" class="stack">
        <p>${copy}</p>
        ${key === "garda" ? `<label class="check"><input type="checkbox" required> <span>I consent to Aire's vetting partner applying for Garda vetting on my behalf.</span></label>` : `<label class="field">${key === "id" ? "Photo ID" : "Certificate"} <input type="file" name="file" accept="image/*,application/pdf" required></label>${key === "id" ? `<label class="field">Live selfie<input type="file" name="selfie" accept="image/*" capture="user" required></label>` : ""}`}
        <p class="small muted" style="margin:0">Documents go to a separate encrypted store and are never shown to parents. In this demo, files never leave your device.</p>
        <div class="modal-foot"><button type="button" class="btn light" data-act="modal-close">Cancel</button><button class="btn">Submit</button></div>
      </form>`);
  }

  /* ---------- click actions ---------- */
  const actions = {
    "modal-close": () => closeModal(),
    "modal-close-back": (el, e) => { if (e.target === el) closeModal(); },
    go: (el) => go(el.dataset.href),
    logout: () => { A.logout(); closeModal(); go("#/login"); },
    demo: (el) => { A.loginAs(DEMO[el.dataset.role]); go(el.dataset.role === "parent" ? "#/home" : "#/requests"); },
    "switch-role": (el) => { if (!A.user(DEMO[el.dataset.role])) { A.reset(); } A.loginAs(DEMO[el.dataset.role]); toast(`Now viewing as ${el.dataset.role === "parent" ? "a parent (Sally)" : "a sitter (Ellie)"}`); go(el.dataset.role === "parent" ? "#/home" : "#/requests"); },
    "read-notif": (el) => { const n = A.db.notifications.find((x) => x.id === el.dataset.id); if (n) { n.read = true; A.save(); } },
    "read-all": () => { const me = A.me(); A.db.notifications.forEach((n) => { if (n.userId === me.id) n.read = true; }); A.save(); render(); },
    accept: (el) => { A.respond(el.dataset.id, true); toast("Booking accepted. The family has been notified.", "ok"); render(); },
    decline: (el) => { if (confirm("Decline this request? There's no penalty for declining.")) { A.respond(el.dataset.id, false); toast("Request declined."); render(); } },
    cancel: (el) => {
      const b = findBooking(el.dataset.id); const me = A.me();
      const late = b.status === "confirmed" && (A.bookingStart(b) - Date.now()) / 36e5 < 24;
      if (!confirm(late && me.role === "parent" ? "This booking starts within 24 hours, so 50% of the sitter's fee will be charged. Cancel anyway?" : "Cancel this booking?")) return;
      A.cancel(b.id, me); toast("Booking cancelled."); render();
    },
    review: (el) => reviewModal(findBooking(el.dataset.id), A.me()),
    star: (el) => { const v = +el.dataset.v; const f = el.closest("form"); f.stars.value = v; f.querySelectorAll(".star-btn").forEach((b) => { b.style.color = +b.dataset.v <= v ? "#f59e0b" : "var(--border)"; }); },
    sos: (el) => sosModal(findBooking(el.dataset.id)),
    "sos-alert": (el) => { const b = findBooking(el.dataset.id); const me = A.me(); const to = me.role === "parent" ? b.sitterId : b.parentId; A.notify(to, `URGENT: ${A.publicName(me)} pressed the emergency button for the booking on ${U.fmtDate(b.date)}. Call them now.`, "#/booking/" + b.id, "alert"); A.save(); closeModal(); toast("Alert sent. Our safety team has been notified too.", "pink"); },
    trusted: (el) => { const b = findBooking(el.dataset.id); modal("Share with a trusted contact", `<form data-form="trusted" data-id="${b.id}" class="stack"><p class="small muted">We'll send them the booking time and area only, never the family's address or the children's details, and let them know when you've finished.</p><label class="field">Their name<input name="name" required></label><label class="field">Their mobile<input name="phone" type="tel" required></label><div class="modal-foot"><button type="button" class="btn light" data-act="modal-close">Cancel</button><button class="btn blue">Share</button></div></form>`); },
    "report-link": (el) => reportModal({ bookingId: el.dataset.id, aboutId: (() => { const b = findBooking(el.dataset.id); return A.me().role === "parent" ? b.sitterId : b.parentId; })() }),
    "report-about": (el) => reportModal({ aboutId: el.dataset.id }),
    fav: (el) => { const me = A.me(); const id = el.dataset.id; me.favourites = me.favourites.includes(id) ? me.favourites.filter((x) => x !== id) : [...me.favourites, id]; A.save(); toast(me.favourites.includes(id) ? "Saved to favourites" : "Removed from favourites"); render(); },
    "add-child": () => childModal(null),
    "edit-child": (el) => childModal(A.me().children.find((c) => c.id === el.dataset.id)),
    "remove-child": (el) => { const me = A.me(); if (!confirm("Remove this child from your profile?")) return; me.children = me.children.filter((c) => c.id !== el.dataset.id); A.save(); render(); },
    verify: (el) => { const me = A.me(); const k = el.dataset.k; if (k === "phone") { const code = prompt(`We've sent a 6-digit code to ${me.phone || "your mobile"}. (Demo code: 123456)`); if (code !== "123456") return toast("That code didn't match.", "warn"); } else { checkModalParentId(); return; } me.verified[k] = true; A.save(); toast("Verified ✓", "ok"); render(); },
    "change-card": () => { const box = document.querySelector('input[name="useSaved"]'); if (box) { const wrap = box.parentElement; box.remove(); wrap.querySelector(".spread").outerHTML = window.AireParent.cardFields(); } },
    "remove-card": () => { const me = A.me(); me.payment = null; A.save(); toast("Card removed."); render(); },
    export: () => { const me = A.me(); const blob = new Blob([JSON.stringify(A.exportData(me), null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `aire-my-data-${U.dayISO(0)}.json`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); toast("Your data has been downloaded.", "ok"); },
    "delete-account": () => { const me = A.me(); if (!confirm("Permanently delete your Aire account? Upcoming bookings will be cancelled. Booking records are kept anonymised for tax purposes.")) return; A.deleteAccount(me); toast("Your account has been deleted."); go("#/login"); },
    reset: () => { if (!confirm("Reset all demo data in this browser?")) return; const me = A.me(); const role = me ? me.role : "parent"; A.reset(); A.loginAs(DEMO[role]); toast("Demo data reset.", "ok"); go(role === "parent" ? "#/home" : "#/requests"); },
    check: (el) => checkModal(el.dataset.k),
    guardian: () => { modal("Guardian consent", `<form data-form="guardian" class="stack"><label class="field">Parent or guardian's name<input name="gname" required></label><label class="field">Their email<input name="gemail" type="email" required></label><label class="check"><input type="checkbox" required> <span>My guardian consents to my Garda vetting and use of Aire.</span></label><div class="modal-foot"><button class="btn">Save consent</button></div></form>`); },
    "toggle-day": (el) => { const me = A.me(); const d = el.dataset.d; me.availability[d] = !A.isAvailableOn(me, d); A.save(); render(); },
    "avail-bulk": (el) => { const me = A.me(); for (let i = 0; i < 28; i++) { const d = U.dayISO(i); const day = U.at(d, "12:00").getDay(); me.availability[d] = el.dataset.mode === "clear" ? false : el.dataset.mode === "weekends" ? (day === 0 || day === 5 || day === 6) : true; } A.save(); render(); },
    subscription: () => { const me = A.me(); if (me.subscription.active) { if (!confirm("Cancel your subscription? Your profile will be hidden from parents.")) return; me.subscription = { active: false }; } else me.subscription = { active: true, since: U.dayISO(0) }; A.save(); toast(me.subscription.active ? "Subscription active, and your profile is live." : "Subscription cancelled."); render(); },
    payout: () => modal("Payout account", `<form data-form="payout" class="stack"><label class="field">Account holder<input name="holder" value="${h(A.me().name)}" required></label><label class="field">IBAN<input name="iban" required placeholder="IE29 AIBK 9311 5212 3456 78"></label><p class="small muted" style="margin:0">The account must be in your own name. We only keep the last 4 characters in the app.</p><div class="modal-foot"><button class="btn">Save</button></div></form>`),
  };
  function checkModalParentId() {
    modal("Verify your ID", `<form data-form="parent-id" class="stack"><p>Upload photo ID and take a live selfie. We keep only the result and delete the images once verified.</p><label class="field">Photo ID<input type="file" accept="image/*,application/pdf" required></label><label class="field">Live selfie<input type="file" accept="image/*" capture="user" required></label><div class="modal-foot"><button type="button" class="btn light" data-act="modal-close">Cancel</button><button class="btn">Submit</button></div></form>`);
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-act]");
    if (!el || el.tagName === "INPUT") return;
    const fn = actions[el.dataset.act];
    if (fn) { if (el.tagName === "BUTTON") e.preventDefault(); fn(el, e); }
  });

  /* ---------- change / input ---------- */
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.closest(".chip") && t.type === "checkbox") t.closest(".chip").classList.toggle("on", t.checked);
    if (t.dataset.act === "2fa") { const me = A.me(); me.twoFactor = t.checked; A.save(); toast(t.checked ? "Two-factor sign-in on." : "Two-factor sign-in off."); }
    if (t.dataset.act === "available-now") { const me = A.me(); me.availableNow = t.checked; A.save(); render(); }
    if (t.closest('form[data-form="book"]')) window.AireParent.updateCost();
    if (t.name === "dob") { const a = UI.ageFrom(t.value); const row = document.getElementById("guardian-row"); if (row) row.hidden = !(a >= 16 && a < 18); }
  });
  document.addEventListener("input", (e) => {
    if (e.target.closest('form[data-form="book"]') && ["date", "start", "end"].includes(e.target.name)) window.AireParent.updateCost();
    if (e.target.name === "card") { const v = e.target.value.replace(/\D/g, "").slice(0, 19); e.target.value = v.replace(/(.{4})/g, "$1 ").trim(); }
    if (e.target.name === "exp") { let v = e.target.value.replace(/\D/g, "").slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2); e.target.value = v; }
  });

  /* ---------- submit ---------- */
  const forms = {
    login(f) { try { const u = A.login(f.email.value, f.password.value); toast(`Welcome back, ${u.role === "parent" ? u.contact.split(" ")[0] : u.name.split(" ")[0]}!`); go(u.role === "parent" ? "#/home" : "#/requests"); } catch (x) { err("auth-err", x.message); } },
    signup(f) {
      const d = formData(f); const role = f.dataset.role;
      const need = role === "parent" ? ["name", "familyName", "email", "password", "area"] : ["name", "dob", "email", "password", "area"];
      if (need.some((k) => !String(d[k] || "").trim())) return err("auth-err", "Please fill in all required fields.");
      if (!/^\S+@\S+\.\S+$/.test(d.email)) return err("auth-err", "Please enter a valid email.");
      if (d.password.length < 8) return err("auth-err", "Your password needs at least 8 characters.");
      if (!d.terms) return err("auth-err", "Please accept the terms and privacy notice.");
      if (role === "sitter") {
        const age = UI.ageFrom(d.dob); d.age = age;
        if (!(age >= 16)) return err("auth-err", "Sitters must be at least 16 years old.");
        if (age > 90) return err("auth-err", "Please check your date of birth.");
        if (age < 18 && !d.guardianConsent) return err("auth-err", "Sitters aged 16–17 need a parent or guardian's consent.");
      }
      try { A.signup({ ...d, role }); toast("Account created. Welcome to Aire!", "ok"); go(role === "parent" ? "#/profile" : "#/profile"); } catch (x) { err("auth-err", x.message); }
    },
    find(f) {
      const d = formData(f); const kids = [].concat(d.kids || []);
      if (!kids.length) return toast("Choose at least one child.", "warn");
      if (d.start === d.end) return toast("Start and end times can't be the same.", "warn");
      const q = new URLSearchParams({ date: d.date, start: d.start, end: d.end, kids: kids.join(",") });
      if (d.sort) q.set("sort", d.sort); if (d.max) q.set("max", d.max); if (d.city) q.set("city", d.city);
      go("#/search?" + q.toString());
    },
    book(f) {
      const me = A.me(); const d = formData(f); const s = A.user(f.dataset.sitter);
      const ids = [].concat(d.kids || []); const kids = me.children.filter((c) => ids.includes(c.id)).map(({ nickname, age }) => ({ nickname, age }));
      try {
        if (!kids.length) throw new Error("Choose at least one child.");
        const bad = kids.filter((c) => !s.ages.includes(c.age)); if (bad.length) throw new Error(`${A.publicName(s)} doesn't look after age ${bad[0].age}.`);
        if (d.start === d.end) throw new Error("Start and end times can't be the same.");
        if (A.util.hoursBetween(d.date, d.start, d.end) > 12) throw new Error("Bookings can be at most 12 hours.");
        if (!d.agree) throw new Error("Please confirm the declaration.");
        if (!A.isAvailableOn(s, d.date)) throw new Error(`${A.publicName(s)} isn't available that day. Try another date.`);
        let payment = me.payment;
        if (!d.useSaved) { payment = window.AireParent.readCard(d); if (d.saveCard) { me.payment = payment; } }
        const b = A.createBooking({ parentId: me.id, sitterId: s.id, date: d.date, start: d.start, end: d.end, children: kids, notes: A.screenText(d.notes || "").clean, uber: !!d.uber, payment });
        toast(`Request sent to ${A.publicName(s)}.`, "ok");
        UI.scheduleAutoAccept(b);
        go("#/booking/" + b.id);
      } catch (x) { err("book-err", x.message); }
    },
    chat(f) {
      const me = A.me(); const text = f.text.value.trim(); if (!text) return;
      const r = A.sendMessage(f.dataset.id, me.id, text);
      if (r.flagged) toast("We hid some contact details to keep you safe.", "warn");
      const b = findBooking(f.dataset.id); const other = A.user(me.role === "parent" ? b.sitterId : b.parentId);
      if (UI.isBot(other)) UI.botReply(b.id, other.id);
      render();
      setTimeout(() => { const i = document.querySelector('form[data-form="chat"] input'); if (i) i.focus(); }, 0);
    },
    report(f) {
      const d = formData(f); const me = A.me();
      const bookingId = d.bookingId || f.dataset.booking || null;
      let aboutId = f.dataset.about || null;
      if (!aboutId && bookingId) { const b = findBooking(bookingId); aboutId = me.role === "parent" ? b.sitterId : b.parentId; }
      if (!String(d.details || "").trim()) return toast("Please add some details.", "warn");
      A.report(me, { bookingId, aboutId, category: d.category, details: d.details });
      closeModal(); toast("Report sent to our safeguarding lead.", "ok"); render();
    },
    child(f) {
      const me = A.me(); const d = formData(f); const nick = d.nickname.trim().split(/\s+/)[0];
      if (!nick) return;
      if (f.dataset.id) Object.assign(me.children.find((c) => c.id === f.dataset.id), { nickname: nick, age: d.age });
      else me.children.push({ id: U.uid("c"), nickname: nick, age: d.age });
      A.save(); closeModal(); toast("Saved.", "ok"); render();
    },
    review(f) { const me = A.me(); try { A.addReview(f.dataset.id, me.role, +f.stars.value, f.text.value); closeModal(); toast("Thanks for your rating!", "ok"); render(); } catch (x) { toast(x.message, "warn"); } },
    trusted(f) { const b = findBooking(f.dataset.id); b.trustedContact = { name: f.name.value.trim(), sharedAt: new Date().toISOString() }; A.save(); closeModal(); toast(`Shared with ${f.name.value.trim()}: time and area only.`, "ok"); },
    "parent-profile"(f) { const me = A.me(); const d = formData(f); Object.assign(me, { name: d.name.trim(), contact: d.contact.trim(), about: d.about, city: d.city, area: d.area.trim(), address: d.address.trim(), phone: d.phone.trim() }); A.save(); toast("Profile saved.", "ok"); render(); },
    "sitter-profile"(f) {
      const me = A.me(); const d = formData(f); const ages = [].concat(d.ages || []);
      if (!ages.length) return toast("Choose at least one age bracket.", "warn");
      const rate = Math.min(40, Math.max(10, +d.rate || me.rate));
      Object.assign(me, { about: d.about, studying: d.studying.trim(), experience: Math.max(0, +d.experience || 0), city: d.city, area: d.area.trim(), rate: U.round2(rate), extraChild: Math.max(0, +d.extraChild || 0), infantSurcharge: Math.max(0, +d.infantSurcharge || 0), ages });
      A.save(); toast("Profile saved.", "ok"); render();
    },
    check(f) {
      const me = A.me(); const k = f.dataset.k;
      me.verification[k] = { status: "pending", date: U.dayISO(0) };
      A.save(); closeModal(); toast("Submitted. An admin will review it shortly.", "ok"); render();
      setTimeout(() => {
        const u = A.user(me.id); if (!u) return;
        const years = { id: 0, garda: 3, childrenFirst: 3, firstAid: 2 }[k];
        u.verification[k] = { status: "verified", date: U.dayISO(0), expires: years ? U.dayISO(Math.round(365 * years)) : null };
        A.notify(u.id, `${A.constants.CHECKS.find((c) => c.key === k).label}: verified ✓`, "#/profile", "shield");
        if (A.isSearchable(u)) A.notify(u.id, "All checks complete. Your profile is now live for parents!", "#/requests", "check");
        A.save();
        if (A.me() && A.me().id === u.id) { toast(`${A.constants.CHECKS.find((c) => c.key === k).label} verified ✓`, "ok"); render(); }
      }, k === "garda" ? 4500 : 2500);
    },
    "parent-id"() { const me = A.me(); closeModal(); toast("Checking your ID…"); setTimeout(() => { me.verified.id = true; A.save(); toast("ID verified ✓", "ok"); render(); }, 1800); },
    guardian() { const me = A.me(); me.guardianConsent = true; A.save(); closeModal(); toast("Guardian consent saved.", "ok"); render(); },
    payout(f) { const iban = f.iban.value.replace(/\s/g, "").toUpperCase(); if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return toast("Please enter a valid IBAN.", "warn"); const me = A.me(); me.payoutAccount = iban.slice(-4); A.save(); closeModal(); toast("Payout account saved.", "ok"); render(); },
  };
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("form[data-form]"); if (!f) return;
    e.preventDefault();
    const fn = forms[f.dataset.form]; if (fn) fn(f);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------- start ---------- */
  A.load().then(start);
  function start() {
  // Seeded sitters accept any requests that were left pending when the page was closed
  A.db.bookings.filter((b) => b.status === "pending").forEach(UI.scheduleAutoAccept);
  window.addEventListener("hashchange", () => { closeModal(); render(); });
  // Re-check time-based state (bookings starting/finishing) every minute
  setInterval(() => { const before = JSON.stringify(A.db.bookings.map((b) => b.status)); A.housekeeping(); if (JSON.stringify(A.db.bookings.map((b) => b.status)) !== before) render(); }, 60e3);
  render();
  }
})();
