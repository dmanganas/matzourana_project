/* ============================================================
   admin/competitors.js – "Ανταγωνισμός" tab of the admin
   ------------------------------------------------------------
   Shows our price vs competitor prices per dish (daily dishes
   and Ψητά της Ώρας). This file holds NO business data: prices
   are read from the Realtime Database (matzourana_competitors/)
   only after the owner has signed in (getDb() in index.html).
   Database layout (written only after the owner approves a check):
     matzourana_competitors/latest            "YYYY-MM-DD"
     matzourana_competitors/checks/<date>     { checkDate, checkedAt, approvedAt,
                                                competitors:{id:{name,address,source,url,
                                                status:"approved"|"proposed",rating,ratingCount,
                                                ratingScale (5 box.gr / 10 Wolt),distanceKm,order}},
                                                dishes:{menuKey:{dish,group:"daily"|"grill",
                                                category,ours (admin/blackboard price),
                                                oursSrc:"admin"|"site",site?,order,
                                                prices:{id:number},note}} }
   Second table «Ευρύτερη αγορά μαγειρείων» (same rules: read only, owner only):
     matzourana_competitors/wide/latest        "YYYY-MM-DD"
     matzourana_competitors/wide/checks/<date> { checkDate, checkedAt, label, method, oursSource,
                                                datasets:{south:{label,target}, all:{label,target}},
                                                sources:{id:{name,address,area,zone:"south"|"center",
                                                platform,url,readOn,distanceKm,rating,ratingCount,ratingScale}},
                                                dishes:{menuKey:{dish,group,category,ours,oursSrc,order,
                                                prices:{sourceId:number}}} }
   ============================================================ */

const compState = { data: null, dates: [], group: "all", showProposed: true, search: "", sort: "menu" };

/*-------------------
Purpose: Format a number as a Greek euro amount (€9,50).
On Input: v - Number (or null/undefined).
On Output: String - "€9,50", or "–" when there is no value.
---------------------*/
function compEuro(v) {
  if (v == null || !Number.isFinite(Number(v))) return "–";
  return "€" + Number(v).toFixed(2).replace(".", ",");
}

/*-------------------
Purpose: Format a signed number with a Greek decimal comma (+12,5 / −3,0).
On Input: v - Number; digits - decimals to keep.
On Output: String with an explicit sign ("±0" for zero).
---------------------*/
function compSigned(v, digits) {
  const s = Math.abs(v).toFixed(digits).replace(".", ",");
  return (v > 0 ? "+" : v < 0 ? "−" : "±") + s;
}

/*-------------------
Purpose: Median of a list of numbers.
On Input: xs - Array<Number> (at least one value).
On Output: Number - the median.
---------------------*/
function compMedian(xs) {
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/*-------------------
Purpose: Escape text before it goes into innerHTML.
On Input: s - any value.
On Output: String safe to place in HTML.
---------------------*/
function compEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/*-------------------
Purpose: List the competitors to show as columns, in their saved order.
On Input: none (reads compState.data.competitors and compState.showProposed).
On Output: Array<{id, name, status, ...}> - approved first, proposed after when enabled.
---------------------*/
function compColumns() {
  const all = (compState.data && compState.data.competitors) || {};
  return Object.keys(all)
    .map(id => Object.assign({ id: id }, all[id]))
    .filter(c => c.status === "approved" || (compState.showProposed && c.status === "proposed"))
    .sort((a, b) => (a.order || 99) - (b.order || 99));
}

/*-------------------
Purpose: Work out median, difference and position for one dish against the shown competitors.
On Input: d - dish record ({ours, prices}); cols - Array of competitor columns.
On Output: Object {prices:Array<Number|null>, n, med, diff, pct, pos:"higher"|"lower"|"same"|"single"|"none"}.
---------------------*/
function compDishStats(d, cols) {
  const prices = cols.map(c => (d.prices && d.prices[c.id] != null) ? Number(d.prices[c.id]) : null);
  const vals = prices.filter(v => v != null);
  if (!vals.length) return { prices, n: 0, med: null, diff: null, pct: null, pos: "none" };
  const med = compMedian(vals);
  const diff = Number(d.ours) - med;
  const pct = diff / med * 100;
  let pos = pct > 2 ? "higher" : pct < -2 ? "lower" : "same";
  if (vals.length < 2) pos = "single";
  return { prices, n: vals.length, med, diff, pct, pos };
}

/*-------------------
Purpose: Small note under our price: marks a price taken from the site (no admin record) and shows
         the site price when it differs from the admin (blackboard) price.
On Input: r - dish record ({ours, oursSrc:"admin"|"site", site?:number}).
On Output: String - HTML ("" when the admin price is the reference and the site agrees).
---------------------*/
function compOursNote(r) {
  if (r.oursSrc === "site") return '<div class="comp-warn">τιμή site</div>';
  if (r.site != null && Math.abs(Number(r.site) - Number(r.ours)) > 0.001) return `<div class="comp-warn">site: ${compEuro(r.site)}</div>`;
  return "";
}

/*-------------------
Purpose: Text of a competitor's rating with its platform scale (box.gr ★/5, Wolt /10).
On Input: c - competitor record ({rating, ratingCount, ratingScale, source}).
On Output: String - e.g. " · ★ 4.65/5 (1167 κριτικές box.gr)" or "" when there is no rating.
---------------------*/
function compRatingText(c) {
  if (!c.ratingCount) return "";
  const wolt = Number(c.ratingScale) === 10;
  return ` · ★ ${c.rating}/${wolt ? 10 : 5} (${c.ratingCount} ${wolt ? "αξιολογήσεις Wolt" : "κριτικές box.gr"})`;
}

/*-------------------
Purpose: Draw the whole Ανταγωνισμός tab (KPIs, table, sources) from compState.
On Input: none.
On Output: none.
Side effects: replaces the inner HTML of #compKpis, #compHead, #compBody, #compSources, #compStamp.
---------------------*/
function renderCompetitorTab() {
  const data = compState.data;
  const stamp = document.getElementById("compStamp");
  const body = document.getElementById("compBody");
  if (!data) {
    stamp.textContent = "Δεν υπάρχει έλεγχος";
    body.innerHTML = '<tr><td colspan="20" class="note">Δεν έχει εγκριθεί ακόμη έλεγχος τιμών ανταγωνιστών.</td></tr>';
    return;
  }
  stamp.textContent = "Τελευταίος έλεγχος: " + new Date(data.checkDate + "T12:00:00").toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
  const label = document.getElementById("compLabel");
  label.textContent = data.label || "";
  label.hidden = !data.label;

  const cols = compColumns();
  const q = compState.search.trim().toLowerCase();
  let rows = Object.keys(data.dishes || {}).map(key => {
    const d = data.dishes[key];
    return Object.assign({ key: key }, d, { st: compDishStats(d, cols) });
  }).filter(r => (compState.group === "all" || r.group === compState.group) && (!q || r.dish.toLowerCase().includes(q)));
  if (compState.sort === "high") rows.sort((a, b) => (b.st.pct == null ? -999 : b.st.pct) - (a.st.pct == null ? -999 : a.st.pct));
  else if (compState.sort === "low") rows.sort((a, b) => (a.st.pct == null ? 999 : a.st.pct) - (b.st.pct == null ? 999 : b.st.pct));
  else rows.sort((a, b) => (a.order || 0) - (b.order || 0));

  // KPIs over dishes with at least two competitor prices
  const comparable = rows.filter(r => r.st.n >= 2);
  const avgPct = comparable.length ? comparable.reduce((s, r) => s + r.st.pct, 0) / comparable.length : 0;
  const avgEur = comparable.length ? comparable.reduce((s, r) => s + r.st.diff, 0) / comparable.length : 0;
  const count = p => comparable.filter(r => r.st.pos === p).length;
  const nApproved = cols.filter(c => c.status === "approved").length;
  const nProposed = cols.length - nApproved;
  document.getElementById("compKpis").innerHTML = [
    ["Μέση διαφορά από τη διάμεση τιμή", compSigned(avgPct, 1) + "%", compSigned(avgEur, 2).replace(/^([+−±])/, "$1€") + " ανά πιάτο · " + comparable.length + " πιάτα", avgPct > 2 ? "warn" : avgPct < -2 ? "good" : ""],
    ["Ακριβότεροι", String(count("higher")), "πάνω από +2%", "warn"],
    ["Φθηνότεροι", String(count("lower")), "κάτω από −2%", "good"],
    ["Ίδια τιμή", String(count("same")), "±2%", ""],
    ["Ανταγωνιστές", String(cols.length), nApproved + " εγκεκριμένοι" + (nProposed ? " · " + nProposed + " προτεινόμενοι" : ""), ""]
  ].map(k => `<div class="kpi ${k[3]}"><div class="label">${compEsc(k[0])}</div><div class="value">${compEsc(k[1])}</div><div class="sub">${compEsc(k[2])}</div></div>`).join("");

  document.getElementById("compHead").innerHTML = "<tr><th>Πιάτο</th><th>Ματζουράνα<br><span class=\"comp-sub\">τιμή admin</span></th>" +
    cols.map(c => `<th class="${c.status === "proposed" ? "comp-proposed" : ""}" title="${compEsc(c.address || "")}">${compEsc(c.name)}${c.status === "proposed" ? '<br><span class="comp-tag">προτεινόμενος</span>' : ""}</th>`).join("") +
    "<th>Διάμεσος</th><th>Διαφ. €</th><th>Διαφ. %</th><th>Θέση</th><th>Σημείωση</th></tr>";

  const posPill = { higher: '<span class="pill down">Ακριβότεροι</span>', lower: '<span class="pill up">Φθηνότεροι</span>', same: '<span class="pill flat">Ίδια</span>', single: '<span class="pill flat">1 τιμή</span>', none: '<span class="pill flat">—</span>' };
  body.innerHTML = rows.map(r => {
    const oursNote = compOursNote(r);
    const cells = r.st.prices.map((v, i) => {
      if (v == null) return `<td class="comp-num comp-empty${cols[i].status === "proposed" ? " comp-proposed" : ""}">–</td>`;
      const cls = v < r.ours - 0.001 ? "comp-cheaper" : v > r.ours + 0.001 ? "comp-dearer" : "";
      return `<td class="comp-num ${cls}${cols[i].status === "proposed" ? " comp-proposed" : ""}">${compEuro(v)}</td>`;
    }).join("");
    const st = r.st;
    return `<tr><td><strong>${compEsc(r.dish)}</strong><div class="comp-sub">${r.group === "grill" ? "Ψητά της Ώρας" : compEsc(r.category || "Μαγειρευτά")}</div></td>` +
      `<td class="comp-num"><strong>${compEuro(r.ours)}</strong>${oursNote}</td>${cells}` +
      `<td class="comp-num">${compEuro(st.med)}</td>` +
      `<td class="comp-num">${st.diff == null ? "–" : compSigned(st.diff, 2).replace(/^([+−±])/, "$1€")}</td>` +
      `<td class="comp-num">${st.pct == null ? "–" : compSigned(st.pct, 0) + "%"}</td>` +
      `<td>${posPill[st.pos]}</td><td class="comp-note">${compEsc(r.note || "")}</td></tr>`;
  }).join("");

  document.getElementById("compSources").innerHTML = cols.map(c =>
    `<li><a href="${compEsc(c.url)}" target="_blank" rel="noopener">${compEsc(c.name)}</a> · ${compEsc(c.address || "")} · ${compEsc(c.source || "")}` +
    compEsc(compRatingText(c)) +
    (c.status === "proposed" ? ' · <span class="comp-tag">προτεινόμενος</span>' : "") + "</li>").join("") +
    `<li class="note">Τιμές όπως εμφανίζονται στις πλατφόρμες στις ${compEsc(data.checkDate)}· μπορεί να περιέχουν προσαύξηση πλατφόρμας. Οι δικές μας τιμές: ${compEsc(data.oursSource || "τιμές admin")}.</li>`;
}

/*-------------------
Purpose: Load the list of approved checks and the latest one from the Realtime Database.
On Input: date - optional "YYYY-MM-DD" to load instead of the latest.
On Output: Promise<void>.
Side effects: reads matzourana_competitors/latest and /checks/<date> (owner only, via getDb());
              fills compState and the date selector, then redraws the tab. Never writes.
---------------------*/
async function loadCompetitorPrices(date) {
  const db = (typeof getDb === "function") ? getDb() : null;
  if (!db) { renderCompetitorTab(); return; }
  if (!compState.dates.length) {
    const keys = (await db.ref("matzourana_competitors/checks").orderByKey().limitToLast(26).once("value")).val() || {};
    compState.dates = Object.keys(keys).sort().reverse();
    fillCompetitorDates();
  }
  const latest = date || (await db.ref("matzourana_competitors/latest").once("value")).val() || compState.dates[0];
  compState.data = latest ? (await db.ref("matzourana_competitors/checks/" + latest).once("value")).val() : null;
  renderCompetitorTab();
  if (!wideState.loaded) loadWideMarket();
}

/*-------------------
Purpose: Fill the "Έλεγχος" date selector with the saved check dates (newest first).
On Input: none (reads compState.dates).
On Output: none.
---------------------*/
function fillCompetitorDates() {
  const sel = document.getElementById("compDate");
  sel.innerHTML = compState.dates.map(d => `<option value="${compEsc(d)}">${compEsc(d)}</option>`).join("") || '<option value="">—</option>';
}

/*-------------------
Purpose: Show a check that is already in memory (used by the local preview, never by production).
On Input: data - one check object in the database layout described at the top of this file.
On Output: none.
---------------------*/
function showCompetitorCheck(data) {
  compState.data = data;
  compState.dates = data && data.checkDate ? [data.checkDate] : [];
  fillCompetitorDates();
  renderCompetitorTab();
}

/*-------------------
Purpose: Connect the tab's filter controls to compState and redraw on every change.
On Input: none.
On Output: none.
Side effects: adds event listeners to the controls of #tab-competitors.
---------------------*/
function initCompetitorTab() {
  document.querySelectorAll("#compGroup button").forEach(b => b.addEventListener("click", () => {
    compState.group = b.dataset.group;
    document.querySelectorAll("#compGroup button").forEach(x => x.classList.toggle("active", x === b));
    renderCompetitorTab();
  }));
  document.getElementById("compProposed").addEventListener("change", e => { compState.showProposed = e.target.checked; renderCompetitorTab(); });
  document.getElementById("compSearch").addEventListener("input", e => { compState.search = e.target.value; renderCompetitorTab(); });
  document.getElementById("compSort").addEventListener("change", e => { compState.sort = e.target.value; renderCompetitorTab(); });
  document.getElementById("compDate").addEventListener("change", e => { if (e.target.value) loadCompetitorPrices(e.target.value); });
}


/* ============================================================
   «Ευρύτερη αγορά μαγειρείων» – second table of the tab
   Statistics per dish over many μαγειρεία of the southern suburbs
   (Νότια) and of southern suburbs + central Athens (Νότια + Κέντρο).
   ============================================================ */

const wideState = { data: null, loaded: false, zone: "south", group: "all", sort: "menu" };

/*-------------------
Purpose: Value at a given fraction of a sorted list (linear interpolation, as in spreadsheets).
On Input: s - Array<Number> sorted ascending (at least one value); q - fraction 0..1 (0.25 = P25).
On Output: Number - the quantile.
---------------------*/
function wideQuantile(s, q) {
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

/*-------------------
Purpose: List the source ids that belong to the chosen dataset.
On Input: zone - "south" (Νότια) or "all" (Νότια + Κέντρο).
On Output: Array<String> - source ids of wideState.data.sources in that dataset.
---------------------*/
function wideSourceIds(zone) {
  const all = (wideState.data && wideState.data.sources) || {};
  return Object.keys(all).filter(id => zone === "all" || all[id].zone === "south");
}

/*-------------------
Purpose: Statistics of one dish over the sources of the chosen dataset.
On Input: d - dish record ({ours, prices:{sourceId:number}}); ids - Array<String> of source ids.
On Output: Object {n, min, max, med, mean, p25, p75, diff, pct, rank, pos:"higher"|"lower"|"same"|"few"|"none"}
           rank = percentile of our price (share of sources cheaper than us, ties counted half).
---------------------*/
function wideDishStats(d, ids) {
  const vals = ids.map(id => d.prices ? d.prices[id] : null).filter(v => v != null).map(Number).sort((a, b) => a - b);
  if (!vals.length) return { n: 0, pos: "none" };
  const ours = Number(d.ours);
  const med = wideQuantile(vals, 0.5);
  const below = vals.filter(v => v < ours - 0.001).length;
  const equal = vals.filter(v => Math.abs(v - ours) <= 0.001).length;
  const diff = ours - med, pct = diff / med * 100;
  let pos = pct > 2 ? "higher" : pct < -2 ? "lower" : "same";
  if (vals.length < 3) pos = "few";
  return {
    n: vals.length, min: vals[0], max: vals[vals.length - 1], med: med,
    mean: vals.reduce((s, v) => s + v, 0) / vals.length,
    p25: wideQuantile(vals, 0.25), p75: wideQuantile(vals, 0.75),
    diff: diff, pct: pct, rank: (below + equal / 2) / vals.length * 100, pos: pos
  };
}

/*-------------------
Purpose: Summary of a list of dish rows (only dishes with at least 3 prices count).
On Input: rows - Array of rows with .st from wideDishStats.
On Output: Object {n, avgPct, medPct, avgRank, higher, lower, same}.
---------------------*/
function wideSummary(rows) {
  const r = rows.filter(x => x.st.n >= 3);
  const avg = f => r.length ? r.reduce((s, x) => s + f(x), 0) / r.length : 0;
  return {
    n: r.length, avgPct: avg(x => x.st.pct), avgRank: avg(x => x.st.rank),
    medPct: r.length ? compMedian(r.map(x => x.st.pct)) : 0,
    higher: r.filter(x => x.st.pos === "higher").length,
    lower: r.filter(x => x.st.pos === "lower").length,
    same: r.filter(x => x.st.pos === "same").length
  };
}

/*-------------------
Purpose: Draw the «Ευρύτερη αγορά μαγειρείων» table (KPIs, table, source list) from wideState.
On Input: none.
On Output: none.
Side effects: replaces the inner HTML of #wideKpis, #wideHead, #wideBody, #wideSources, #wideStamp, #wideLabel.
---------------------*/
function renderWideMarket() {
  const data = wideState.data;
  const stamp = document.getElementById("wideStamp");
  const body = document.getElementById("wideBody");
  if (!stamp || !body) return;
  const label = document.getElementById("wideLabel");
  if (!data || !data.dishes || !data.sources) {
    stamp.textContent = "Δεν υπάρχει έλεγχος";
    label.hidden = true;
    document.getElementById("wideKpis").innerHTML = "";
    document.getElementById("wideHead").innerHTML = "";
    document.getElementById("wideSources").innerHTML = "";
    body.innerHTML = '<tr><td colspan="10" class="note">Δεν έχει εγκριθεί ακόμη έλεγχος της ευρύτερης αγοράς μαγειρείων.</td></tr>';
    return;
  }
  stamp.textContent = "Έλεγχος: " + new Date(data.checkDate + "T12:00:00").toLocaleDateString("el-GR", { day: "numeric", month: "long", year: "numeric" });
  label.textContent = data.label || "";
  label.hidden = !data.label;

  const ids = wideSourceIds(wideState.zone);
  const ds = (data.datasets && data.datasets[wideState.zone]) || {};
  const all = Object.keys(data.dishes).map(key => {
    const d = data.dishes[key];
    return Object.assign({ key: key }, d, { st: wideDishStats(d, ids) });
  }).filter(r => r.st.n > 0);
  let rows = all.filter(r => wideState.group === "all" || r.group === wideState.group);
  if (wideState.sort === "high") rows.sort((a, b) => b.st.pct - a.st.pct);
  else if (wideState.sort === "low") rows.sort((a, b) => a.st.pct - b.st.pct);
  else if (wideState.sort === "n") rows.sort((a, b) => b.st.n - a.st.n);
  else rows.sort((a, b) => (a.order || 0) - (b.order || 0));

  const sDaily = wideSummary(all.filter(r => r.group === "daily"));
  const sGrill = wideSummary(all.filter(r => r.group === "grill"));
  const sShown = wideSummary(rows);
  const nSouth = wideSourceIds("south").length, nAll = wideSourceIds("all").length;
  document.querySelectorAll("#wideZone button").forEach(b => {
    b.textContent = (b.dataset.zone === "south" ? "Νότια" : "Νότια + Κέντρο") + " (" + (b.dataset.zone === "south" ? nSouth : nAll) + ")";
  });
  const pctTxt = s => s.n ? compSigned(s.avgPct, 1) + "%" : "–";
  const cls = s => !s.n ? "" : s.avgPct > 2 ? "warn" : s.avgPct < -2 ? "good" : "";
  document.getElementById("wideKpis").innerHTML = [
    ["Μαγειρευτά ημέρας vs διάμεσο", pctTxt(sDaily), sDaily.n + " πιάτα · διάμεση διαφορά " + compSigned(sDaily.medPct, 1) + "% · θέση " + Math.round(sDaily.avgRank) + "%", cls(sDaily)],
    ["Ψητά της Ώρας vs διάμεσο", pctTxt(sGrill), sGrill.n + " πιάτα · διάμεση διαφορά " + compSigned(sGrill.medPct, 1) + "% · θέση " + Math.round(sGrill.avgRank) + "%", cls(sGrill)],
    ["Ακριβότεροι / Φθηνότεροι / Ίδια", sShown.higher + " / " + sShown.lower + " / " + sShown.same, "στα πιάτα που φαίνονται · ±2%", ""],
    ["Μέση θέση της τιμής μας", sShown.n ? Math.round(sShown.avgRank) + "%" : "–", "% των μαγειρείων που είναι φθηνότερα", ""],
    ["Πηγές (μαγειρεία)", String(ids.length), (ds.label || "") + (ds.target ? " · στόχος " + ds.target : "") + " · Νότια " + nSouth + " · Σύνολο " + nAll, ds.target && ids.length < ds.target ? "warn" : ""]
  ].map(k => `<div class="kpi ${k[3]}"><div class="label">${compEsc(k[0])}</div><div class="value">${compEsc(k[1])}</div><div class="sub">${compEsc(k[2])}</div></div>`).join("");

  document.getElementById("wideHead").innerHTML = "<tr><th>Πιάτο</th><th>Ματζουράνα<br><span class=\"comp-sub\">τιμή admin</span></th>" +
    "<th>Πηγές<br><span class=\"comp-sub\">n</span></th><th>Ελάχιστη</th><th>Διάμεσος</th><th>Μέσος</th><th>Εύρος<br><span class=\"comp-sub\">P25–P75</span></th>" +
    "<th>Διαφορά<br><span class=\"comp-sub\">vs διάμεσο</span></th><th>Θέση<br><span class=\"comp-sub\">εκατοστημόριο</span></th><th></th></tr>";
  const posPill = { higher: '<span class="pill down">Ακριβότεροι</span>', lower: '<span class="pill up">Φθηνότεροι</span>', same: '<span class="pill flat">Ίδια</span>', few: '<span class="pill flat">λίγες τιμές</span>', none: '' };
  body.innerHTML = rows.map(r => {
    const st = r.st;
    return `<tr><td><strong>${compEsc(r.dish)}</strong><div class="comp-sub">${r.group === "grill" ? "Ψητά της Ώρας" : compEsc(r.category || "Μαγειρευτά")}</div></td>` +
      `<td class="comp-num"><strong>${compEuro(r.ours)}</strong>${compOursNote(r)}</td>` +
      `<td class="comp-num">${st.n}</td>` +
      `<td class="comp-num">${compEuro(st.min)}</td>` +
      `<td class="comp-num"><strong>${compEuro(st.med)}</strong></td>` +
      `<td class="comp-num">${compEuro(st.mean)}</td>` +
      `<td class="comp-num">${compEuro(st.p25)} – ${compEuro(st.p75)}</td>` +
      `<td class="comp-num ${st.pct > 2 ? "comp-cheaper" : st.pct < -2 ? "comp-dearer" : ""}">${compSigned(st.diff, 2).replace(/^([+−±])/, "$1€")} · ${compSigned(st.pct, 0)}%</td>` +
      `<td class="comp-num">${Math.round(st.rank)}%<div class="wide-bar"><span style="left:${Math.min(100, Math.max(0, st.rank)).toFixed(0)}%"></span></div></td>` +
      `<td>${posPill[st.pos]}</td></tr>`;
  }).join("") || '<tr><td colspan="10" class="note">Κανένα πιάτο σε αυτό το φίλτρο.</td></tr>';

  const src = data.sources;
  const byZone = z => ids.filter(id => src[id].zone === z).sort((a, b) => (src[a].distanceKm || 0) - (src[b].distanceKm || 0));
  const li = id => { const s = src[id]; return `<li><a href="${compEsc(s.url)}" target="_blank" rel="noopener">${compEsc(s.name)}</a> · ${compEsc(s.area || "")} · ${compEsc(s.address || "")} · ${compEsc(s.platform || "")}${s.distanceKm != null ? " · " + compEsc(String(s.distanceKm).replace(".", ",")) + " km" : ""}</li>`; };
  const south = byZone("south"), center = byZone("center");
  document.getElementById("wideSources").innerHTML =
    `<details><summary>Νότια προάστια (${south.length})</summary><ul class="comp-sources">${south.map(li).join("")}</ul></details>` +
    (center.length ? `<details><summary>Κέντρο Αθήνας (${center.length})</summary><ul class="comp-sources">${center.map(li).join("")}</ul></details>` : "") +
    `<p class="note">${compEsc(data.method || "")} Οι δικές μας τιμές: ${compEsc(data.oursSource || "τιμές admin")}.</p>`;
}

/*-------------------
Purpose: Load the latest wide-market check from the Realtime Database.
On Input: none.
On Output: Promise<void>.
Side effects: reads matzourana_competitors/wide/latest and /wide/checks/<date> (owner only, via getDb());
              fills wideState and redraws the second table. Never writes. A read error only shows the empty state.
---------------------*/
async function loadWideMarket() {
  const db = (typeof getDb === "function") ? getDb() : null;
  if (!db) { renderWideMarket(); return; }
  try {
    const latest = (await db.ref("matzourana_competitors/wide/latest").once("value")).val();
    wideState.data = latest ? (await db.ref("matzourana_competitors/wide/checks/" + latest).once("value")).val() : null;
    wideState.loaded = true;
  } catch (e) {
    console.warn("wide market check not readable", e);
    wideState.data = null;
  }
  renderWideMarket();
}

/*-------------------
Purpose: Show a wide-market check that is already in memory (used by the local preview, never by production).
On Input: data - one check object in the layout described at the top of this file.
On Output: none.
---------------------*/
function showWideCheck(data) {
  wideState.data = data;
  wideState.loaded = true;
  renderWideMarket();
}

/*-------------------
Purpose: Connect the controls of the second table (dataset toggle, filter, sort) to wideState.
On Input: none.
On Output: none.
Side effects: adds event listeners to #wideZone, #wideGroup and #wideSort.
---------------------*/
function initWideMarket() {
  const seg = (sel, key) => document.querySelectorAll(sel + " button").forEach(b => b.addEventListener("click", () => {
    wideState[key] = b.dataset[key];
    document.querySelectorAll(sel + " button").forEach(x => x.classList.toggle("active", x === b));
    renderWideMarket();
  }));
  if (!document.getElementById("wideZone")) return;
  seg("#wideZone", "zone");
  seg("#wideGroup", "group");
  document.getElementById("wideSort").addEventListener("change", e => { wideState.sort = e.target.value; renderWideMarket(); });
  renderWideMarket();
}

document.addEventListener("DOMContentLoaded", initCompetitorTab);
document.addEventListener("DOMContentLoaded", initWideMarket);
