/* =========================================================
   Aire — data store & domain logic
   Everything is persisted to localStorage in this browser only.
   ========================================================= */
(function () {
  const KEY = "aire-db-v1";
  const SERVICE_FEE = 0.10;          // 10% parent service fee
  const SITTER_SUBSCRIPTION = 4.99;  // monthly
  const RIDE_ESTIMATE = 14;          // flat Uber estimate for the demo
  const ADDRESS_REVEAL_HOURS = 48;   // full address visible this long before start
  const CARE_NOTE_RETENTION_DAYS = 30;
  const AGE_BRACKETS = ["0–1", "2–4", "5–8", "9–12", "13+"];

  /* ---------- helpers ---------- */
  const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dayISO = (offset) => iso(addDays(new Date(), offset));
  const at = (dateISO, time) => { const [y, m, d] = dateISO.split("-").map(Number); const [hh, mm] = time.split(":").map(Number); return new Date(y, m - 1, d, hh, mm); };
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
  const hashPw = (pw) => "h" + hashStr("aire::" + pw).toString(36);
  const round2 = (n) => Math.round(n * 100) / 100;

  function safeGet() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function safeSet(v) { try { localStorage.setItem(KEY, v); return true; } catch (e) { return false; } }

  /* ---------- seed ---------- */
  function ver(daysAgo, years, overrides = {}) {
    const date = dayISO(-daysAgo);
    const expires = years ? dayISO(-daysAgo + Math.round(365 * years)) : null;
    return { status: "verified", date, expires, ...overrides };
  }
  function fullVerification(daysAgo = 200) {
    return { id: ver(daysAgo, 0), garda: ver(daysAgo, 3), childrenFirst: ver(daysAgo, 3), firstAid: ver(daysAgo, 2) };
  }

  function seed() {
    const pw = hashPw("demo123");
    const users = [];
    const parent = (o) => users.push({
      role: "parent", password: pw, phone: "", verified: { id: true, phone: true }, twoFactor: false,
      favourites: [], ratingSum: 0, ratingCount: 0, children: [], payment: null, createdAt: dayISO(-120), ...o,
    });
    const sitter = (o) => users.push({
      role: "sitter", password: pw, phone: "", seeded: true, autoRespond: true, availableNow: true,
      availability: {}, ages: AGE_BRACKETS.slice(0, 4), extraChild: 2, infantSurcharge: 2,
      verification: fullVerification(), subscription: { active: true, since: dayISO(-90) },
      guardianConsent: false, payouts: [], createdAt: dayISO(-200), suspended: false, ...o,
    });

    parent({
      id: "p_odonnell", name: "The O'Donnell family", contact: "Sally O'Donnell", email: "sally@demo.ie",
      about: "Sally and Mike, both 32. We live in Cork City and are looking for friendly, reliable sitters for evenings and weekends.",
      city: "Cork", area: "Cork City", address: "14 Wellington Road, St Luke's, Cork T23 A1B2", phone: "+353 87 000 0001",
      children: [{ id: "c1", nickname: "Ben", age: "2–4", notes: "" }, { id: "c2", nickname: "Lucy", age: "5–8", notes: "" }],
      favourites: ["s_sarah"], ratingSum: 57.6, ratingCount: 12, payment: { brand: "Visa", last4: "4242", token: "tok_demo" },
    });
    parent({ id: "p_murphy", name: "The Murphy family", contact: "Orla Murphy", email: "murphy@demo.ie", city: "Cork", area: "Douglas", address: "3 Maryborough Hill, Douglas, Cork T12 C3D4", about: "Two busy kids and two busy parents!", children: [{ id: "c3", nickname: "Tom", age: "2–4" }, { id: "c4", nickname: "Grace", age: "5–8" }], ratingSum: 57.6, ratingCount: 12 });
    parent({ id: "p_obrien", name: "The O'Brien family", contact: "Declan O'Brien", email: "obrien@demo.ie", city: "Cork", area: "Ballincollig", address: "22 Old Quarter, Ballincollig, Cork P31 E5F6", about: "One very energetic 9 year old.", children: [{ id: "c5", nickname: "Jamie", age: "9–12" }], ratingSum: 24, ratingCount: 5 });

    sitter({ id: "s_sarah", name: "Sarah Kelly", email: "sarah@demo.ie", age: 24, city: "Cork", area: "Cork City", distanceKm: 1.2, experience: 6, rate: 16, ratingSum: 235.2, ratingCount: 48, studying: "Early Years graduate", about: "First aid certified and experienced with toddlers and school-age children. I love arts and crafts, bedtime stories and getting everyone to bed on time!", hue: 0 });
    sitter({ id: "s_aoife", name: "Aoife Moran", email: "aoife@demo.ie", age: 20, city: "Cork", area: "Blackrock", distanceKm: 2.4, experience: 3, rate: 14.5, ratingSum: 148.8, ratingCount: 31, studying: "UCC · Primary Teaching", about: "Second year education student, eldest of five. Calm, patient and great with homework help.", hue: 1 });
    sitter({ id: "s_liam", name: "Liam Doyle", email: "liam@demo.ie", age: 22, city: "Cork", area: "Bishopstown", distanceKm: 3.1, experience: 2, rate: 13.5, ages: ["5–8", "9–12", "13+"], ratingSum: 89.3, ratingCount: 19, studying: "MTU · Sports Science", about: "Football coach for under-10s. Best with school-age kids who love being outdoors.", hue: 2 });
    sitter({ id: "s_ellie", name: "Ellie McGrath", email: "ellie@demo.ie", age: 21, city: "Cork", area: "Cork City", distanceKm: 0.9, experience: 4, rate: 14.15, ratingSum: 88.2, ratingCount: 18, studying: "UCC · Nutrition", autoRespond: false, about: "I'm a UCC student living in Cork and love spending time with kids. I'm available evenings and weekends around lectures.", hue: 3, payouts: [] });
    sitter({ id: "s_niamh", name: "Niamh O'Sullivan", email: "niamh@demo.ie", age: 27, city: "Cork", area: "Douglas", distanceKm: 4.0, experience: 8, rate: 17.5, ages: AGE_BRACKETS.slice(0, 3), infantSurcharge: 3, ratingSum: 316.8, ratingCount: 64, studying: "Early Years Educator (QQI Level 8)", about: "Infant and toddler specialist. Eight years in a crèche, now babysitting evenings and weekends.", hue: 1 });
    sitter({ id: "s_ciara", name: "Ciara Byrne", email: "ciara@demo.ie", age: 17, city: "Cork", area: "Wilton", distanceKm: 1.8, experience: 1, rate: 12, ages: ["5–8", "9–12"], ratingSum: 32.2, ratingCount: 7, guardianConsent: true, studying: "Leaving Cert student", about: "Responsible 17 year old with lots of experience minding my younger cousins. Guardian consent on file.", hue: 0 });
    sitter({ id: "s_conor", name: "Conor Walsh", email: "conor@demo.ie", age: 23, city: "Cork", area: "Ballincollig", distanceKm: 2.0, experience: 4, rate: 15, ratingSum: 105.6, ratingCount: 22, studying: "UCC · Social Science", about: "Big brother of three, coach at the local GAA club. Patient and fun.", hue: 2,
      verification: { ...fullVerification(700), firstAid: ver(710, 2) } });
    sitter({ id: "s_sophie", name: "Sophie Lynch", email: "sophie@demo.ie", age: 19, city: "Cork", area: "Cork City", distanceKm: 1.5, experience: 1, rate: 13, ratingSum: 0, ratingCount: 0, studying: "UCC · Arts", about: "New to Aire!", hue: 3,
      verification: { id: ver(5, 0), garda: { status: "pending", date: dayISO(-5) }, childrenFirst: ver(5, 3), firstAid: { status: "missing" } } });
    sitter({ id: "s_roisin", name: "Róisín Kavanagh", email: "roisin@demo.ie", age: 22, city: "Dublin", area: "Rathmines", distanceKm: 1.4, experience: 5, rate: 15.5, ratingSum: 196, ratingCount: 40, studying: "TCD · Psychology", about: "Psychology student with five years of babysitting experience.", hue: 0 });
    sitter({ id: "s_jack", name: "Jack Brennan", email: "jack@demo.ie", age: 25, city: "Dublin", area: "Drumcondra", distanceKm: 2.6, experience: 3, rate: 14.5, ratingSum: 70.5, ratingCount: 15, studying: "DCU · Education", about: "Trainee teacher.", hue: 1,
      verification: { ...fullVerification(800), firstAid: ver(735, 2) } });
    sitter({ id: "s_emma", name: "Emma Nolan", email: "emma@demo.ie", age: 26, city: "Dublin", area: "Ranelagh", distanceKm: 3.3, experience: 7, rate: 16, ratingSum: 252.2, ratingCount: 52, studying: "Early Years graduate", about: "Former crèche room leader.", hue: 2 });

    const bookings = [];
    const reviews = [];
    const messages = {};
    const bk = (o) => {
      const b = { id: o.id || uid("b"), createdAt: new Date(at(o.date, o.start).getTime() - 3 * 864e5).toISOString(), uber: false, notes: "", reviewedByParent: false, reviewedBySitter: false, ...o };
      const s = users.find((u) => u.id === b.sitterId);
      b.price = price(s, b.children, b.date, b.start, b.end, b.uber);
      bookings.push(b);
      return b;
    };
    const od = users[0].children.map(({ nickname, age }) => ({ nickname, age }));
    const mur = [{ nickname: "Tom", age: "2–4" }, { nickname: "Grace", age: "5–8" }];
    const obr = [{ nickname: "Jamie", age: "9–12" }];

    const r = (b, stars, text, by = "parent") => {
      reviews.push({ id: uid("r"), bookingId: b.id, by, sitterId: b.sitterId, parentId: b.parentId, stars, text, date: b.date });
      if (by === "parent") b.reviewedByParent = true; else b.reviewedBySitter = true;
    };
    r(bk({ parentId: "p_odonnell", sitterId: "s_sarah", date: dayISO(-21), start: "19:00", end: "23:00", children: od, status: "completed" }), 5, "Sarah was brilliant. The kids were asleep when we got home and the house was tidier than we left it!");
    r(bk({ parentId: "p_odonnell", sitterId: "s_sarah", date: dayISO(-9), start: "18:30", end: "22:30", children: od, status: "completed" }), 5, "Always on time and the kids adore her.");
    r(bk({ parentId: "p_odonnell", sitterId: "s_aoife", date: dayISO(-40), start: "19:00", end: "23:30", children: od, status: "completed" }), 5, "Really lovely, helped Lucy with her reading.");
    r(bk({ parentId: "p_odonnell", sitterId: "s_liam", date: dayISO(-60), start: "14:00", end: "18:00", children: [od[1]], status: "completed" }), 4, "Great with Lucy, lots of football in the garden.");
    bk({ id: "b_review", parentId: "p_odonnell", sitterId: "s_sarah", date: dayISO(-2), start: "19:00", end: "23:00", children: od, status: "completed" });
    const up = bk({ id: "b_upcoming", parentId: "p_odonnell", sitterId: "s_sarah", date: dayISO(4), start: "19:00", end: "23:00", children: od, status: "confirmed", uber: true, notes: "Ben has a bedtime story at 7:30. Lucy can stay up until 8:30." });
    bk({ id: "b_request", parentId: "p_murphy", sitterId: "s_ellie", date: dayISO(3), start: "19:00", end: "23:00", children: mur, status: "pending", notes: "Younger child has a peanut allergy. Bedtime is 8 pm.", createdAt: new Date(Date.now() - 18 * 60e3).toISOString() });
    bk({ id: "b_job", parentId: "p_obrien", sitterId: "s_ellie", date: dayISO(1), start: "18:00", end: "22:00", children: obr, status: "confirmed", notes: "Jamie can have one hour of screen time." });
    r(bk({ parentId: "p_murphy", sitterId: "s_ellie", date: dayISO(-10), start: "19:00", end: "23:00", children: mur, status: "completed" }), 5, "Ellie was fantastic, will definitely book again.");
    r(bk({ parentId: "p_obrien", sitterId: "s_ellie", date: dayISO(-17), start: "17:00", end: "21:00", children: obr, status: "completed" }), 5, "Jamie loved her!");
    bk({ parentId: "p_murphy", sitterId: "s_ellie", date: dayISO(-24), start: "19:30", end: "23:30", children: mur, status: "completed" });
    bk({ parentId: "p_obrien", sitterId: "s_ellie", date: dayISO(-31), start: "18:00", end: "21:00", children: obr, status: "completed" });

    messages[up.id] = [
      { id: uid("m"), from: "s_sarah", text: "Hi Sally! Looking forward to minding Ben and Lucy again. Anything new I should know?", at: new Date(Date.now() - 26 * 3600e3).toISOString() },
      { id: uid("m"), from: "p_odonnell", text: "Hi Sarah! All the same as last time. Thanks a million 😊", at: new Date(Date.now() - 25 * 3600e3).toISOString() },
    ];

    const notifications = [
      { id: uid("n"), userId: "p_odonnell", icon: "check", text: `Sitter found: Sarah K. can mind your children on ${fmtDate(up.date)}, ${fmtTime(up.start)}.`, link: "#/booking/" + up.id, read: false, at: new Date(Date.now() - 20 * 3600e3).toISOString() },
      { id: uid("n"), userId: "p_odonnell", icon: "star", text: "How did Sarah K. get on? Leave a rating for your last booking.", link: "#/booking/b_review", read: false, at: new Date(Date.now() - 30 * 3600e3).toISOString() },
      { id: uid("n"), userId: "s_ellie", icon: "bell", text: "New request: The Murphy family, " + fmtDate(dayISO(3)) + ", 7–11 pm.", link: "#/booking/b_request", read: false, at: new Date(Date.now() - 18 * 60e3).toISOString() },
    ];

    return { version: 1, users, bookings, reviews, messages, notifications, reports: [], session: null, seededAt: new Date().toISOString() };
  }

  /* ---------- formatting (also used by UI) ---------- */
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(dateISO, long) {
    const d = at(dateISO, "12:00");
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${long ? " " + d.getFullYear() : ""}`;
  }
  function fmtTime(t) {
    let [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return m ? `${h}:${pad(m)} ${ap}` : `${h} ${ap}`;
  }
  const euro = (n) => "€" + (Math.round(n * 100) / 100).toFixed(2);

  /* ---------- pricing ---------- */
  function hoursBetween(dateISO, start, end) {
    const s = at(dateISO, start), e = at(dateISO, end);
    let ms = e - s; if (ms <= 0) ms += 864e5;
    return round2(ms / 36e5);
  }
  function price(sitter, children, dateISO, start, end, uber) {
    const hours = hoursBetween(dateISO, start, end);
    const n = Math.max(1, children.length);
    const hasInfant = children.some((c) => c.age === "0–1");
    const base = sitter.rate * hours;
    const extra = (n - 1) * (sitter.extraChild || 0) * hours;
    const infant = hasInfant ? (sitter.infantSurcharge || 0) * hours : 0;
    const subtotal = round2(base + extra + infant);
    const fee = round2(subtotal * SERVICE_FEE);
    const ride = uber ? RIDE_ESTIMATE : 0;
    return { hours, rate: sitter.rate, base: round2(base), extra: round2(extra), infant: round2(infant), subtotal, fee, ride, total: round2(subtotal + fee + ride), hourly: round2(subtotal / hours) };
  }

  /* ---------- persistence ---------- */
  let db = null;
  function load() {
    const raw = safeGet();
    if (raw) { try { db = JSON.parse(raw); } catch (e) { db = null; } }
    if (!db || db.version !== 1) { db = seed(); save(); }
    housekeeping();
    return db;
  }
  function save() { safeSet(JSON.stringify(db)); }
  function reset() { const s = db && db.session; db = seed(); db.session = null; save(); return s; }

  /* ---------- queries ---------- */
  const user = (id) => db.users.find((u) => u.id === id);
  const me = () => (db.session ? user(db.session.userId) : null);
  const rating = (u) => (u.ratingCount ? Math.round((u.ratingSum / u.ratingCount) * 10) / 10 : 0);
  const publicName = (u) => {
    if (u.role === "parent") return u.name;
    const [f, ...rest] = u.name.split(" ");
    return rest.length ? `${f} ${rest[rest.length - 1][0]}.` : f;
  };
  const initials = (u) => {
    const n = u.role === "parent" ? u.name.replace(/^The\s+/i, "").replace(/\s+family$/i, "") : u.name;
    const parts = n.split(/[\s']+/).filter(Boolean);
    return ((parts[0] || "?")[0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  };
  const bookingStart = (b) => at(b.date, b.start);
  const bookingEnd = (b) => { const s = at(b.date, b.start); let e = at(b.date, b.end); if (e <= s) e = new Date(e.getTime() + 864e5); return e; };
  function bookingState(b) {
    if (b.status !== "confirmed") return b.status;
    const now = Date.now();
    if (now >= bookingStart(b) && now < bookingEnd(b)) return "active";
    return "confirmed";
  }

  function checkStatus(c) {
    if (!c || !c.status || c.status === "missing") return "missing";
    if (c.status === "pending") return "pending";
    if (c.status === "verified" && c.expires && at(c.expires, "23:59") < new Date()) return "expired";
    return c.status;
  }
  const CHECKS = [
    { key: "id", label: "ID verified", cls: "id", short: "ID" },
    { key: "garda", label: "Garda vetted", cls: "garda", short: "Garda" },
    { key: "childrenFirst", label: "Children First", cls: "cf", short: "Children First" },
    { key: "firstAid", label: "First aid (Irish Red Cross)", cls: "fa", short: "First aid" },
  ];
  function isVerified(s) { return CHECKS.every((c) => checkStatus(s.verification[c.key]) === "verified"); }
  function expiringSoon(s) {
    return CHECKS.filter((c) => {
      const v = s.verification[c.key];
      if (checkStatus(v) !== "verified" || !v.expires) return false;
      return at(v.expires, "23:59") - new Date() < 45 * 864e5;
    });
  }
  function isSearchable(s) { return s.role === "sitter" && !s.suspended && isVerified(s) && s.subscription && s.subscription.active && (s.age >= 18 || s.guardianConsent); }

  function isAvailableOn(s, dateISO) {
    if (s.availability && s.availability[dateISO] !== undefined) return !!s.availability[dateISO];
    if (dateISO === dayISO(0) && s.availableNow === false) return false;
    if (s.seeded) return hashStr(s.id + dateISO) % 10 < 7;
    return false;
  }
  function overlaps(b, dateISO, start, end) {
    const s1 = bookingStart(b), e1 = bookingEnd(b);
    const s2 = at(dateISO, start); let e2 = at(dateISO, end); if (e2 <= s2) e2 = new Date(e2.getTime() + 864e5);
    return s1 < e2 && s2 < e1;
  }
  function hasConflict(sitterId, dateISO, start, end, ignoreId) {
    return db.bookings.some((b) => b.sitterId === sitterId && b.id !== ignoreId && ["pending", "confirmed"].includes(b.status) && overlaps(b, dateISO, start, end));
  }

  function search({ city, date, start, end, children, maxRate, sort }) {
    let list = db.users.filter((u) => u.role === "sitter" && isSearchable(u) && (!city || u.city === city));
    list = list.map((s) => {
      const agesOk = children.every((c) => s.ages.includes(c.age));
      const available = isAvailableOn(s, date) && !hasConflict(s.id, date, start, end);
      const p = price(s, children, date, start, end, false);
      const score = rating(s) * 10 - s.distanceKm * 2 + Math.min(s.experience, 8) - s.rate * 0.3;
      return { sitter: s, agesOk, available, price: p, score };
    }).filter((x) => x.agesOk && x.available && (!maxRate || x.sitter.rate <= maxRate));
    const by = {
      match: (a, b) => b.score - a.score,
      price: (a, b) => a.sitter.rate - b.sitter.rate,
      rating: (a, b) => rating(b.sitter) - rating(a.sitter),
      distance: (a, b) => a.sitter.distanceKm - b.sitter.distanceKm,
    };
    return list.sort(by[sort] || by.match);
  }

  const bookingsFor = (u) => db.bookings.filter((b) => (u.role === "parent" ? b.parentId === u.id : b.sitterId === u.id));
  const reviewsFor = (sitterId) => db.reviews.filter((r) => r.sitterId === sitterId && r.by === "parent").sort((a, b) => (a.date < b.date ? 1 : -1));
  const reviewsOfParent = (parentId) => db.reviews.filter((r) => r.parentId === parentId && r.by === "sitter");

  function canSeeAddress(b) {
    if (b.status !== "confirmed") return false;
    return bookingStart(b) - Date.now() <= ADDRESS_REVEAL_HOURS * 3600e3 && Date.now() < bookingEnd(b) + 2 * 3600e3;
  }
  function addressRevealAt(b) { return new Date(bookingStart(b).getTime() - ADDRESS_REVEAL_HOURS * 3600e3); }

  /* ---------- mutations ---------- */
  function notify(userId, text, link, icon = "bell") {
    db.notifications.unshift({ id: uid("n"), userId, text, link, icon, read: false, at: new Date().toISOString() });
  }

  function housekeeping() {
    const now = Date.now();
    let changed = false;
    db.bookings.forEach((b) => {
      if (b.status === "confirmed" && bookingEnd(b) < now) {
        b.status = "completed"; changed = true;
        const s = user(b.sitterId), p = user(b.parentId);
        if (p && s) {
          notify(p.id, `How did ${publicName(s)} get on? Rate your booking on ${fmtDate(b.date)}.`, "#/booking/" + b.id, "star");
          notify(s.id, `Job complete: ${euro(b.price.subtotal)} from ${p.name} is on its way to your account.`, "#/earnings", "euro");
        }
      }
      if (b.status === "pending" && bookingStart(b) < now) { b.status = "declined"; b.declineReason = "expired"; changed = true; }
      // Retention: wipe care notes 30 days after the booking ended
      if (["completed", "cancelled", "declined"].includes(b.status) && b.notes && bookingEnd(b) < now - CARE_NOTE_RETENTION_DAYS * 864e5) {
        b.notes = ""; b.notesPurged = true; changed = true;
      }
    });
    // Retention: messages older than 12 months
    Object.keys(db.messages).forEach((k) => {
      const before = db.messages[k].length;
      db.messages[k] = db.messages[k].filter((m) => now - new Date(m.at) < 365 * 864e5);
      if (db.messages[k].length !== before) changed = true;
    });
    if (changed) save();
  }

  function signup(data) {
    const email = data.email.trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) throw new Error("An account with that email already exists.");
    const base = { id: uid(data.role === "parent" ? "p" : "s"), role: data.role, email, password: hashPw(data.password), phone: data.phone || "", city: data.city, area: data.area, createdAt: dayISO(0), ratingSum: 0, ratingCount: 0, verified: { id: false, phone: false }, twoFactor: false };
    let u;
    if (data.role === "parent") {
      u = { ...base, name: data.familyName, contact: data.name, address: data.address || "", about: "", children: [], favourites: [], payment: null };
    } else {
      u = { ...base, name: data.name, age: data.age, dob: data.dob, guardianConsent: !!data.guardianConsent, studying: "", about: "", rate: 14, extraChild: 2, infantSurcharge: 2, ages: AGE_BRACKETS.slice(1, 4), experience: 0, distanceKm: round2(0.5 + (hashStr(email) % 35) / 10), availableNow: true, availability: {}, autoRespond: false, hue: hashStr(email) % 4, seeded: false,
        verification: { id: { status: "missing" }, garda: { status: "missing" }, childrenFirst: { status: "missing" }, firstAid: { status: "missing" } },
        subscription: { active: true, since: dayISO(0), trial: true }, payouts: [], suspended: false };
      notify(u.id, "Welcome to Aire! Complete your safety checks so parents can find you.", "#/profile", "shield");
    }
    db.users.push(u);
    db.session = { userId: u.id };
    if (u.role === "parent") notify(u.id, "Welcome to Aire! Add your children (nickname and age bracket only) to start searching.", "#/profile", "heart");
    save();
    return u;
  }
  function login(email, password) {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.password !== hashPw(password)) throw new Error("Email or password is incorrect.");
    db.session = { userId: u.id };
    save();
    return u;
  }
  function logout() { db.session = null; save(); }
  function loginAs(id) { db.session = { userId: id }; save(); return user(id); }

  function createBooking({ parentId, sitterId, date, start, end, children, notes, uber, payment }) {
    const s = user(sitterId), p = user(parentId);
    if (!isSearchable(s)) throw new Error("This sitter isn't available for booking right now.");
    if (at(date, start) < new Date()) throw new Error("Please choose a start time in the future.");
    if (hasConflict(sitterId, date, start, end)) throw new Error("This sitter already has a booking at that time.");
    if (!children.length) throw new Error("Choose at least one child.");
    const b = { id: uid("b"), parentId, sitterId, date, start, end, children, notes: (notes || "").trim(), uber: !!uber, status: "pending", createdAt: new Date().toISOString(), reviewedByParent: false, reviewedBySitter: false, payment: payment ? { brand: payment.brand, last4: payment.last4 } : null };
    b.price = price(s, children, date, start, end, uber);
    db.bookings.push(b);
    db.messages[b.id] = [];
    notify(sitterId, `New request: ${p.name}, ${fmtDate(date)}, ${fmtTime(start)}–${fmtTime(end)}.`, "#/booking/" + b.id, "bell");
    save();
    return b;
  }
  function respond(bookingId, accept) {
    const b = db.bookings.find((x) => x.id === bookingId);
    if (!b || b.status !== "pending") return b;
    const s = user(b.sitterId);
    b.status = accept ? "confirmed" : "declined";
    b.respondedAt = new Date().toISOString();
    if (accept) notify(b.parentId, `Sitter found: ${publicName(s)} can mind your children on ${fmtDate(b.date)}, ${fmtTime(b.start)}.`, "#/booking/" + b.id, "check");
    else notify(b.parentId, `${publicName(s)} can't make ${fmtDate(b.date)}. You haven't been charged. Try another sitter.`, `#/search?date=${b.date}&start=${b.start}&end=${b.end}`, "info");
    save();
    return b;
  }
  function cancel(bookingId, byUser) {
    const b = db.bookings.find((x) => x.id === bookingId);
    if (!b || !["pending", "confirmed"].includes(b.status)) return b;
    const hoursAway = (bookingStart(b) - Date.now()) / 36e5;
    b.status = "cancelled";
    b.cancelledBy = byUser.role;
    b.refund = byUser.role === "sitter" || hoursAway >= 24 || !b.respondedAt ? "full" : "partial";
    const other = byUser.role === "parent" ? b.sitterId : b.parentId;
    notify(other, `Booking on ${fmtDate(b.date)} was cancelled by the ${byUser.role}.`, "#/booking/" + b.id, "x");
    save();
    return b;
  }

  /* anti-bypass + moderation filter */
  const PHONE_RE = /(\+?\d[\d\s().-]{6,}\d)/g;
  const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
  const OFFAPP_RE = /\b(revolut|cash ?in ?hand|pay (you|me) directly|bank transfer|whatsapp|snapchat|text me|outside (the )?app|iban)\b/i;
  function screenText(text) {
    let flagged = false; let reasons = [];
    let clean = text.replace(PHONE_RE, (m) => (m.replace(/\D/g, "").length >= 7 ? ((flagged = true), reasons.push("phone number"), "[number hidden]") : m));
    clean = clean.replace(EMAIL_RE, () => { flagged = true; reasons.push("email address"); return "[email hidden]"; });
    if (OFFAPP_RE.test(clean)) { flagged = true; reasons.push("off-app arrangement"); }
    return { clean, flagged, reasons: [...new Set(reasons)] };
  }
  function sendMessage(bookingId, fromId, text) {
    const r = screenText(text);
    const list = (db.messages[bookingId] = db.messages[bookingId] || []);
    list.push({ id: uid("m"), from: fromId, text: r.clean, at: new Date().toISOString(), flagged: r.flagged });
    if (r.flagged) list.push({ id: uid("m"), from: "system", text: `For everyone's safety we hid a ${r.reasons.join(" and ")}. Please keep contact and payments in Aire, where bookings are insured and protected.`, at: new Date().toISOString() });
    const b = db.bookings.find((x) => x.id === bookingId);
    const to = fromId === b.parentId ? b.sitterId : b.parentId;
    notify(to, `New message from ${publicName(user(fromId))}`, "#/booking/" + bookingId, "chat");
    save();
    return r;
  }

  function addReview(bookingId, by, stars, text) {
    const b = db.bookings.find((x) => x.id === bookingId);
    if (!b || b.status !== "completed") throw new Error("You can only review completed bookings.");
    if ((by === "parent" && b.reviewedByParent) || (by === "sitter" && b.reviewedBySitter)) throw new Error("Already reviewed.");
    const r = screenText(text || "");
    db.reviews.push({ id: uid("r"), bookingId, by, sitterId: b.sitterId, parentId: b.parentId, stars, text: r.clean, date: dayISO(0), moderated: r.flagged });
    const target = user(by === "parent" ? b.sitterId : b.parentId);
    target.ratingSum = (target.ratingSum || 0) + stars; target.ratingCount = (target.ratingCount || 0) + 1;
    if (by === "parent") b.reviewedByParent = true; else b.reviewedBySitter = true;
    notify(target.id, `You received a ${stars}★ rating from ${publicName(user(by === "parent" ? b.parentId : b.sitterId))}.`, by === "parent" ? "#/profile" : "#/profile", "star");
    save();
  }

  function report(fromUser, { bookingId, aboutId, category, details }) {
    const rep = { id: uid("rep"), from: fromUser.id, bookingId: bookingId || null, aboutId: aboutId || null, category, details, at: new Date().toISOString(), status: "open" };
    db.reports.push(rep);
    if (aboutId && category === "Child safety concern") {
      const t = user(aboutId);
      if (t && t.role === "sitter") { t.suspended = true; }
    }
    notify(fromUser.id, "Thanks. Our safeguarding lead has your report and will contact you within 24 hours.", "#/safety", "shield");
    save();
    return rep;
  }

  function exportData(u) {
    const strip = ({ password, ...rest }) => rest;
    return {
      exportedAt: new Date().toISOString(),
      account: strip(u),
      bookings: bookingsFor(u),
      messages: bookingsFor(u).reduce((o, b) => ((o[b.id] = db.messages[b.id] || []), o), {}),
      reviews: db.reviews.filter((r) => r.sitterId === u.id || r.parentId === u.id),
      notifications: db.notifications.filter((n) => n.userId === u.id),
      reports: db.reports.filter((r) => r.from === u.id),
    };
  }
  function deleteAccount(u) {
    bookingsFor(u).forEach((b) => { if (["pending", "confirmed"].includes(b.status)) cancel(b.id, u); });
    db.notifications = db.notifications.filter((n) => n.userId !== u.id);
    db.users = db.users.filter((x) => x.id !== u.id);
    // Booking records are kept (tax/accounting) but anonymised
    db.bookings.forEach((b) => { if (b.parentId === u.id || b.sitterId === u.id) { b.notes = ""; b.anonymised = true; } });
    db.session = null;
    save();
  }

  window.Aire = {
    get db() { return db; },
    load, save, reset, seedFresh: seed,
    constants: { SERVICE_FEE, SITTER_SUBSCRIPTION, RIDE_ESTIMATE, ADDRESS_REVEAL_HOURS, CARE_NOTE_RETENTION_DAYS, AGE_BRACKETS, CHECKS },
    util: { uid, iso, dayISO, addDays, at, fmtDate, fmtTime, euro, hoursBetween, round2, hashStr },
    user, me, rating, publicName, initials, bookingStart, bookingEnd, bookingState, checkStatus, isVerified, isSearchable, expiringSoon,
    isAvailableOn, hasConflict, search, price, bookingsFor, reviewsFor, reviewsOfParent, canSeeAddress, addressRevealAt,
    notify, housekeeping, signup, login, logout, loginAs, createBooking, respond, cancel, screenText, sendMessage, addReview, report, exportData, deleteAccount,
  };
})();
