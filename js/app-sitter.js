/* =========================================================
   Aire app — sitter views + shared profile panels
   ========================================================= */
(function () {
  const { A, U, h, icon, stars, avatar, badges, parentBadges, statusChip, timeRange, kidsText, empty, ago, views } = window.AireUI;
  const V = (views.sitter = {});
  const AGES = A.constants.AGE_BRACKETS;

  function blockers(me) {
    const out = [];
    A.constants.CHECKS.forEach((c) => { const st = A.checkStatus(me.verification[c.key]); if (st !== "verified") out.push(`${c.label}: ${st}`); });
    if (me.age < 18 && !me.guardianConsent) out.push("Guardian consent needed (under 18)");
    if (!me.subscription || !me.subscription.active) out.push("Subscription inactive");
    if (me.suspended) out.push("Account suspended pending a safeguarding review");
    return out;
  }
  const jobRow = (b, withActions) => {
    const p = A.user(b.parentId);
    return `<div class="sitter-row">${p ? avatar(p) : ""}<div class="info"><h3>${p ? h(p.name) : "Deleted account"} ${statusChip(b)}</h3><div class="meta">${U.fmtDate(b.date)} · ${timeRange(b)} · ${b.children.length} child${b.children.length > 1 ? "ren" : ""} (ages ${b.children.map((c) => c.age).join(", ")})${p ? ` · ${h(p.area)}` : ""}</div>${p ? `<div class="meta">${stars(A.rating(p))} ${A.rating(p) || "New"} parent rating</div>` : ""}${b.notes && withActions ? `<div class="small" style="margin-top:4px"><b>Notes from parents:</b> ${h(b.notes)}</div>` : ""}</div>
      <div class="btns"><div class="price">${U.euro(b.price.subtotal)}</div>${withActions ? `<button class="btn sm" data-act="accept" data-id="${b.id}">Accept</button><button class="btn light sm" data-act="decline" data-id="${b.id}">Decline</button>` : ""}<a class="btn ${withActions ? "ghost" : "light"} sm" href="#/booking/${b.id}">${withActions ? "Details" : "Open"}</a></div></div>`;
  };

  /* ---------- REQUESTS (home) ---------- */
  V.requests = (me) => {
    const mine = A.bookingsFor(me);
    const pending = mine.filter((b) => b.status === "pending").sort((a, b) => A.bookingStart(a) - A.bookingStart(b));
    const upcoming = mine.filter((b) => b.status === "confirmed").sort((a, b) => A.bookingStart(a) - A.bookingStart(b));
    const past = mine.filter((b) => ["completed", "cancelled", "declined"].includes(b.status)).sort((a, b) => A.bookingStart(b) - A.bookingStart(a)).slice(0, 5);
    const block = blockers(me);
    const soon = A.expiringSoon(me);
    const monthKey = U.dayISO(0).slice(0, 7);
    const month = mine.filter((b) => b.status === "completed" && b.date.startsWith(monthKey)).reduce((t, b) => t + b.price.subtotal, 0);
    const toRate = mine.find((b) => b.status === "completed" && !b.reviewedBySitter && A.user(b.parentId));
    return {
      title: "Requests",
      html: `
      ${block.length ? `<div class="panel pink"><h2>Your profile is hidden from parents</h2><ul class="small" style="margin:0 0 10px;padding-left:18px">${block.map((x) => `<li>${h(x)}</li>`).join("")}</ul><a class="btn pink sm" href="#/profile">Complete your safety checks</a></div>` : ""}
      ${soon.length ? `<div class="panel yellow spread"><div><b>${soon.map((c) => c.label).join(", ")} expiring soon</b><div class="small muted">Renew before it expires, or your badge is removed automatically.</div></div><a class="btn sm" href="#/profile">Renew</a></div>` : ""}
      ${pending.length ? `<div class="panel yellow spread"><div><b>New request${pending.length > 1 ? "s" : ""}</b><div class="small">${h(A.user(pending[0].parentId).name)} · ${U.fmtDate(pending[0].date)}, ${timeRange(pending[0])}</div></div><a class="btn sm" href="#/booking/${pending[0].id}">Review</a></div>` : ""}
      <div class="panel"><label class="spread" style="cursor:pointer"><span><b>${me.availableNow ? "You're available" : "You're offline"}</b><span class="small muted" style="display:block">${me.availableNow ? "Parents nearby can send you requests for today." : "You won't get same-day requests. Your calendar still applies to future days."}</span></span><span class="toggle"><input type="checkbox" data-act="available-now" ${me.availableNow ? "checked" : ""} aria-label="Available now"><span></span></span></label></div>
      <div class="grid c3" style="margin-bottom:18px">
        <div class="card stat"><b>${A.rating(me) || "–"}</b><span class="small muted">rating (${me.ratingCount})</span></div>
        <div class="card stat"><b>${mine.filter((b) => b.status === "completed").length}</b><span class="small muted">jobs completed</span></div>
        <div class="card stat"><b>${U.euro(month)}</b><span class="small muted">earned this month</span></div>
      </div>
      ${toRate ? `<div class="panel purple spread"><div><b>Rate ${h(A.user(toRate.parentId).name)}</b><div class="small muted">Your rating helps other sitters stay safe.</div></div><button class="btn sm" data-act="review" data-id="${toRate.id}">Rate</button></div>` : ""}
      <div class="panel"><h2>New requests</h2>${pending.length ? pending.map((b) => jobRow(b, true)).join("") : empty("inbox", "No new requests right now.")}</div>
      <div class="panel"><h2>Upcoming jobs</h2>${upcoming.length ? upcoming.map((b) => jobRow(b, false)).join("") : empty("calendar", "No upcoming jobs.")}</div>
      ${past.length ? `<div class="panel"><h2>Recent</h2>${past.map((b) => jobRow(b, false)).join("")}</div>` : ""}`,
    };
  };

  /* ---------- CALENDAR ---------- */
  V.calendar = (me) => {
    const jobs = A.bookingsFor(me).filter((b) => ["pending", "confirmed"].includes(b.status));
    const days = [];
    for (let i = 0; i < 28; i++) days.push(U.dayISO(i));
    const lead = U.at(days[0], "12:00").getDay(); // 0=Sun
    const offset = (lead + 6) % 7; // Monday-first
    const cells = Array(offset).fill('<div aria-hidden="true"></div>').concat(days.map((d) => {
      const on = A.isAvailableOn(me, d);
      const job = jobs.some((b) => b.date === d);
      const dt = U.at(d, "12:00");
      return `<button class="d ${on ? "on" : ""} ${job ? "job" : ""}" data-act="toggle-day" data-d="${d}" aria-pressed="${on}" aria-label="${U.fmtDate(d)}${on ? ", available" : ""}${job ? ", has a job" : ""}"><small>${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()]}</small>${dt.getDate()}</button>`;
    }));
    return {
      title: "Calendar",
      html: `
      <div class="panel">
        <div class="panel-head"><h2>Your availability</h2><div class="row"><button class="btn light sm" data-act="avail-bulk" data-mode="weekends">Weekends</button><button class="btn light sm" data-act="avail-bulk" data-mode="evenings">Every day</button><button class="btn ghost sm" data-act="avail-bulk" data-mode="clear">Clear</button></div></div>
        <p class="small muted">Tap a day to switch it on or off. Parents can only request you on green days.</p>
        <div class="cal" style="margin-bottom:6px">${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<div class="small muted center" style="font-weight:800">${d}</div>`).join("")}</div>
        <div class="cal">${cells.join("")}</div>
        <div class="row small muted" style="margin-top:12px"><span class="pill" style="background:var(--ok);color:#fff">Available</span><span class="pill" style="box-shadow:inset 0 -4px 0 var(--pink)">Has a job</span></div>
      </div>
      <div class="panel"><h2>Booked</h2>${jobs.length ? jobs.sort((a, b) => A.bookingStart(a) - A.bookingStart(b)).map((b) => jobRow(b, false)).join("") : empty("calendar", "Nothing booked yet.")}</div>`,
    };
  };

  /* ---------- EARNINGS ---------- */
  V.earnings = (me) => {
    const done = A.bookingsFor(me).filter((b) => b.status === "completed").sort((a, b) => A.bookingStart(b) - A.bookingStart(a));
    const total = done.reduce((t, b) => t + b.price.subtotal, 0);
    const hours = done.reduce((t, b) => t + b.price.hours, 0);
    const monthKey = U.dayISO(0).slice(0, 7);
    const month = done.filter((b) => b.date.startsWith(monthKey)).reduce((t, b) => t + b.price.subtotal, 0);
    const weeks = [];
    for (let w = 5; w >= 0; w--) {
      const from = U.addDays(new Date(), -7 * w - 6); from.setHours(0, 0, 0, 0);
      const to = U.addDays(new Date(), -7 * w); to.setHours(23, 59, 59, 999);
      const sum = done.filter((b) => { const s = A.bookingStart(b); return s >= from && s <= to; }).reduce((t, b) => t + b.price.subtotal, 0);
      weeks.push({ label: w === 0 ? "This wk" : `${w} wk ago`, sum });
    }
    const max = Math.max(1, ...weeks.map((w) => w.sum));
    const sub = me.subscription || { active: false };
    return {
      title: "Earnings",
      html: `
      <div class="grid c4" style="margin-bottom:18px">
        <div class="card stat"><b>${U.euro(month)}</b><span class="small muted">this month</span></div>
        <div class="card stat"><b>${U.euro(total)}</b><span class="small muted">all time</span></div>
        <div class="card stat"><b>${U.round2(hours)}</b><span class="small muted">hours minded</span></div>
        <div class="card stat"><b>${hours ? U.euro(total / hours) : "–"}</b><span class="small muted">average per hour</span></div>
      </div>
      <div class="panel"><h2>Last 6 weeks</h2><div class="chart" role="img" aria-label="Weekly earnings">${weeks.map((w) => `<div class="col"><span class="small" style="font-weight:800">${w.sum ? "€" + Math.round(w.sum) : ""}</span><i style="height:${Math.round((w.sum / max) * 120)}px"></i><small>${w.label}</small></div>`).join("")}</div></div>
      <div class="grid c2">
        <div class="panel"><h2>Payouts</h2>${done.length ? `<ul class="list-plain">${done.slice(0, 10).map((b) => { const p = A.user(b.parentId); return `<li class="spread"><span><b>${p ? h(p.name) : "Family"}</b><span class="small muted" style="display:block">${U.fmtDate(b.date)} · ${b.price.hours} h</span></span><span><b>${U.euro(b.price.subtotal)}</b><span class="small muted" style="display:block">Paid to your account</span></span></li>`; }).join("")}</ul>` : empty("euro", "Completed jobs will appear here.")}</div>
        <div>
          <div class="panel ${sub.active ? "purple" : "pink"}"><h2>Aire subscription</h2><p style="margin:0 0 6px"><b>${U.euro(A.constants.SITTER_SUBSCRIPTION)}/month</b>: ${sub.active ? `active since ${U.fmtDate(sub.since, true)}${sub.trial ? " (first month free)" : ""}` : "inactive. Your profile is hidden."}</p><p class="small muted">You keep 100% of your rate. Families pay a 10% service fee, which covers vetting checks, insurance and secure payments.</p><button class="btn ${sub.active ? "light" : ""} sm" data-act="subscription">${sub.active ? "Cancel subscription" : "Reactivate"}</button></div>
          <div class="panel"><h2>Payout account</h2><p style="margin:0">${me.payoutAccount ? `IBAN ending ${h(me.payoutAccount)}` : "No payout account yet."}</p><p class="small muted">Payouts go only to a verified account in your own name.</p><button class="btn light sm" data-act="payout">${me.payoutAccount ? "Change" : "Add account"}</button></div>
        </div>
      </div>`,
    };
  };

  /* ---------- PROFILE ---------- */
  V.profile = (me) => {
    const reviews = A.reviewsFor(me.id);
    const ex = A.price(me, [{ age: "2–4" }, { age: "5–8" }], U.dayISO(1), "19:00", "23:00", false);
    return {
      title: "Profile",
      html: `
      <div class="panel ${A.isSearchable(me) ? "blue" : "pink"} center">
        <div style="display:grid;justify-items:center">${avatar(me, true)}</div>
        <h2 style="margin:10px 0 2px">${h(me.name)}</h2>
        <div class="muted">${me.age} · ${h(me.area)}, ${h(me.city)}${me.studying ? " · " + h(me.studying) : ""}</div>
        <div style="display:flex;justify-content:center">${badges(me)}</div>
        <div style="margin-top:8px"><b>Your rating</b> ${stars(A.rating(me))} ${A.rating(me) || "New"} (${me.ratingCount})</div>
        <p class="small" style="margin:8px 0 0"><b>${A.isSearchable(me) ? "✓ Your profile is live and parents can find you." : "Your profile is hidden until every check is complete."}</b> Parents see you as “${h(A.publicName(me))}”.</p>
      </div>
      <div class="grid c2">
        <div>
          <div class="panel"><h3>Safety checks</h3><p class="small muted">Checks are done through Aire and our registered vetting partner. Parents only ever see the badge, never your documents.</p>
            <ul class="list-plain">${A.constants.CHECKS.map((c) => {
              const v = me.verification[c.key]; const st = A.checkStatus(v);
              const action = st === "verified" ? (A.expiringSoon(me).some((x) => x.key === c.key) ? `<button class="btn yellow sm" data-act="check" data-k="${c.key}">Renew</button>` : "") : st === "pending" ? `<span class="searching small"><span class="spinner"></span> In review</span>` : `<button class="btn sm" data-act="check" data-k="${c.key}">${st === "expired" ? "Renew" : c.key === "garda" ? "Apply" : c.key === "id" ? "Verify" : "Upload"}</button>`;
              return `<li class="spread"><span><b>${c.label}</b><span class="small muted" style="display:block">${st === "verified" ? `Verified ${U.fmtDate(v.date, true)}${v.expires ? ` · expires ${U.fmtDate(v.expires, true)}` : ""}` : st === "expired" ? `Expired ${U.fmtDate(v.expires, true)}. Badge removed.` : st === "pending" ? "An admin is checking this" : "Not started"}</span></span>${action}</li>`;
            }).join("")}
            ${me.age < 18 ? `<li class="spread"><span><b>Guardian consent</b><span class="small muted" style="display:block">Required for sitters aged 16–17</span></span>${me.guardianConsent ? '<span class="status st-completed">on file</span>' : '<button class="btn sm" data-act="guardian">Add</button>'}</li>` : ""}</ul>
          </div>
          <form class="panel" data-form="sitter-profile">
            <h3>Profile</h3>
            <div class="form-grid">
              <label class="field full">About me<textarea name="about" maxlength="500">${h(me.about)}</textarea></label>
              <label class="field">Studying / background<input name="studying" value="${h(me.studying)}"></label>
              <label class="field">Years of experience<input name="experience" type="number" min="0" max="40" value="${me.experience}"></label>
              <label class="field">City<select name="city">${["Cork", "Dublin"].map((c) => `<option ${c === me.city ? "selected" : ""}>${c}</option>`).join("")}</select></label>
              <label class="field">Area<input name="area" value="${h(me.area)}" required></label>
            </div>
            <h3 style="margin-top:16px">Rates</h3>
            <div class="form-grid">
              <label class="field">Hourly rate (1 child)<input name="rate" type="number" step="0.05" min="10" max="40" value="${me.rate}" required><span class="hint">Irish average in 2026 is €13.69</span></label>
              <label class="field">Each extra child (per hour)<input name="extraChild" type="number" step="0.5" min="0" max="10" value="${me.extraChild}"></label>
              <label class="field">Under-2s surcharge (per hour)<input name="infantSurcharge" type="number" step="0.5" min="0" max="10" value="${me.infantSurcharge}"></label>
              <div class="field"><span>Example</span><span class="small muted">2 children aged 2–4 and 5–8, 7–11 pm: <b>${U.euro(ex.subtotal)}</b></span></div>
              <div class="full"><div class="field" style="margin-bottom:6px">Ages I look after</div><div class="ages">${AGES.map((a) => `<label class="chip ${me.ages.includes(a) ? "on" : ""}"><input type="checkbox" name="ages" value="${a}" ${me.ages.includes(a) ? "checked" : ""}>${a}</label>`).join("")}</div></div>
            </div>
            <button class="btn" style="margin-top:14px">Save profile</button>
          </form>
        </div>
        <div>
          <div class="panel"><h3>Reviews from parents</h3>${reviews.length ? `<ul class="list-plain">${reviews.slice(0, 8).map((r) => `<li>${stars(r.stars)} <span class="small muted">${U.fmtDate(r.date)}</span><div>${h(r.text)}</div></li>`).join("")}</ul>` : `<p class="muted small" style="margin:0">No reviews yet.</p>`}</div>
          <div class="panel"><h3>Security</h3><ul class="list-plain"><li class="spread"><span>Two-factor sign-in</span><label class="toggle"><input type="checkbox" data-act="2fa" ${me.twoFactor ? "checked" : ""} aria-label="Two-factor sign-in"><span></span></label></li></ul><p class="small muted" style="margin:8px 0 0">Your home address and phone number are never shown to parents. All contact stays in Aire.</p></div>
          ${window.AireShared.privacyPanel(me)}
        </div>
      </div>`,
    };
  };

  window.AireShared = {
    blockers,
    privacyPanel(me) {
      const demo = me.id === window.AireUI.DEMO.parent || me.id === window.AireUI.DEMO.sitter;
      return `<div class="panel"><h3>Your data</h3><p class="small muted">You have the right to access, correct and delete your data under the GDPR.</p><div class="row"><button class="btn light sm" data-act="export">Download my data</button><button class="btn danger ghost sm" data-act="delete-account">Delete account</button></div></div>
      <div class="panel purple"><h3>Demo controls</h3><p class="small muted">Everything is stored in this browser only.</p><div class="row">${demo ? `<button class="btn sm" data-act="switch-role" data-role="${me.role === "parent" ? "sitter" : "parent"}">Switch to ${me.role === "parent" ? "sitter" : "parent"} view</button>` : ""}<button class="btn light sm" data-act="reset">Reset demo data</button><button class="btn ghost sm" data-act="logout">Log out</button></div></div>`;
    },
  };
})();
