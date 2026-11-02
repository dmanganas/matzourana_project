/* =========================================================================================
   Matzourana admin · Στατιστικά (all saved days) and Μισθός & σχέδιο ημέρας (planning).
   Reads only what the signed-in owner already loaded (dayLedger / salesSheets from loadAllDays,
   kitchen book prices, recipes, commissions, planner settings). No business data in this file.
   Profit formula = withVatProfit (index.html): before = sales − food − comm − fixed;
   VAT due = max(0, sales·13/113 − food·13/113); after = before − VAT due.
   The planning part never touches the actual-profit KPIs and never writes to Firebase.
   ========================================================================================= */

const INS_WEEKDAYS = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];
const INS_LOW_DAYS = 14;     // fewer saved days than this → "λίγα δεδομένα" warning
const INS_LOW_DISH = 3;      // fewer days with sales of a dish than this → per-dish warning
const INS_ME_POP = 0.7;      // menu engineering popularity threshold (Kasavana & Smith 70% rule)
let insCharts = {};
let goalState = null;

/*-------------------
Purpose: Escape text for HTML.
On Input: v - any value.
On Output: String safe for innerHTML.
---------------------*/
function insEsc(v){
  return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/*-------------------
Purpose: Euro text with a real minus sign.
On Input: n - Number or null.
On Output: String like "€12.30", "−€4.10" or "—".
---------------------*/
function insEur(n){
  if (n == null || !isFinite(n)) return "—";
  return (n < 0 ? "−€" : "€") + Math.abs(n).toFixed(2);
}

/*-------------------
Purpose: Signed euro text for gaps.
On Input: n - Number or null.
On Output: String like "+€3.00" / "−€2.00" / "—".
---------------------*/
function insGap(n){
  if (n == null || !isFinite(n)) return "—";
  return (n >= 0 ? "+€" : "−€") + Math.abs(n).toFixed(2);
}

/*-------------------
Purpose: Weekday index of a date string (local noon, no timezone shift).
On Input: date - "YYYY-MM-DD".
On Output: 0..6 (0 = Κυριακή).
---------------------*/
function insWeekday(date){
  return new Date(String(date).slice(0, 10) + "T12:00:00").getDay();
}

/*-------------------
Purpose: Salary floor settings (owner salary as profit after VAT per day): kitchen book
         settings.planner.salaryFloor / salaryStep (€ more per month) / salaryStart ("YYYY-MM").
On Input: none.
On Output: { base: Number|null, step: Number, start: String|null }.
---------------------*/
function salarySettings(){
  const p = (planSettings && planSettings.planner) || {};
  const base = Number(p.salaryFloor);
  return { base: isFinite(base) && base > 0 ? base : null,
           step: isFinite(Number(p.salaryStep)) ? Number(p.salaryStep) : 0,
           start: p.salaryStart ? String(p.salaryStart).slice(0, 7) : null };
}

/*-------------------
Purpose: The salary floor (profit after VAT per day) that applies on a date: base + step for every
         full month since the start month.
On Input: date - "YYYY-MM-DD" (or "YYYY-MM").
On Output: Number, or null when no floor is set.
---------------------*/
function salaryFloorFor(date){
  const s = salarySettings();
  if (s.base == null) return null;
  if (!s.start || !s.step) return s.base;
  const [y1, m1] = s.start.split("-").map(Number), [y2, m2] = String(date).slice(0, 7).split("-").map(Number);
  const months = Math.max(0, (y2 - y1) * 12 + (m2 - m1));
  return s.base + s.step * months;
}

/*-------------------
Purpose: Change one salary setting in the kitchen book settings (in memory; saved with
         «Αποθήκευση στην Matzourana-Database») and redraw.
On Input: field - "salaryFloor" | "salaryStep" | "salaryStart"; val - input value.
On Output: none.
---------------------*/
function setSalarySetting(field, val){
  if (!planSettings.planner) planSettings.planner = {};
  if (field === "salaryStart") planSettings.planner.salaryStart = val || null;
  else planSettings.planner[field] = val === "" ? null : Number(val);
  renderGoalTab();
}

/*-------------------
Purpose: Portions per channel of a saved day, keys mapped to today's keys (salesKey).
On Input: rec - day record.
On Output: { keys: { key: { local, efood, wolt } }, tot: { local, efood, wolt }, has: Boolean }.
           has = false for old records without channel counts.
---------------------*/
function insDayChannels(rec){
  const src = (rec && rec.channels) || null;
  const keys = {}, tot = { local: 0, efood: 0, wolt: 0 };
  if (!src) return { keys, tot, has: false };
  Object.keys(src).forEach(k0 => {
    const k = (typeof salesKey === "function") ? salesKey(k0) : k0;
    const c = src[k0] || {};
    const o = keys[k] || (keys[k] = { local: 0, efood: 0, wolt: 0 });
    ["local", "efood", "wolt"].forEach(ch => { const n = Number(c[ch] || 0); o[ch] += n; tot[ch] += n; });
  });
  return { keys, tot, has: true };
}

/*-------------------
Purpose: One row of statistics for a saved day, recomputed with withVatProfit (stored profit
         fields of old records are not trusted).
On Input: rec - matzourana_days record; sheet - matzourana_sales/days record of the date or null.
On Output: { date, wd, portions, sales, food, comm, fixed, before, vatDue, after, legacy,
             ch: {local,efood,wolt}|null, recorded, recordedConfirmed, recordedFrom, gap, gapPct }.
           legacy = no commissions stored → profit fields null.
---------------------*/
function insDayStat(rec, sheet){
  const date = String(rec.date).slice(0, 10);
  const sales = Number(rec.sales || 0);
  const food = Number(rec.food != null ? rec.food : rec.foodDay || 0);
  const legacy = rec.comm == null;
  const comm = legacy ? null : Number(rec.comm || 0);
  const fixed = Number(rec.fixed != null ? rec.fixed : rec.fixedDaily || 0);
  const x = legacy ? null : withVatProfit({ sales, food, comm, fixed });
  const chs = insDayChannels(rec);
  let recorded = null, conf = false, from = "";
  if (rec.revenueRecorded != null) { recorded = Number(rec.revenueRecorded); conf = rec.revenueConfirmed === true; from = "ημέρα"; }
  else if (sheet && sheet.revenue && sheet.revenue.recorded != null) { recorded = Number(sheet.revenue.recorded); conf = sheet.revenue.confirmed === true; from = "φύλλο"; }
  const gap = recorded != null ? recorded - sales : null;
  return { date, wd: insWeekday(date), portions: Number(rec.portions != null ? rec.portions : rec.qty || 0),
    sales, food, comm, fixed, before: x ? x.profitBefore : null, vatDue: x ? x.vatDue : null,
    after: x ? x.profitAfter : null, legacy, ch: chs.has ? chs.tot : null,
    recorded, recordedConfirmed: conf, recordedFrom: from, gap, gapPct: gap != null && sales ? gap / sales : null };
}

/*-------------------
Purpose: All saved days as statistics rows, oldest first.
On Input: none (dayLedger, salesSheets).
On Output: Array of insDayStat rows.
---------------------*/
function insAllDayStats(){
  const sheets = (typeof salesSheets !== "undefined" && salesSheets) || {};
  return Object.keys(dayLedger || {}).filter(k => dayLedger[k] && typeof dayLedger[k] === "object" && /^\d{4}-\d{2}-\d{2}$/.test(String(dayLedger[k].date || k).slice(0, 10)))
    .map(k => insDayStat({ ...dayLedger[k], date: String(dayLedger[k].date || k).slice(0, 10) }, sheets[k] || null))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/*-------------------
Purpose: Mean of the numbers in a list (nulls skipped).
On Input: arr - Array of Number|null.
On Output: Number or null when empty.
---------------------*/
function insMean(arr){
  const v = arr.filter(x => x != null && isFinite(x));
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
}

/*-------------------
Purpose: Rolling mean over the last n saved days (by count of saved days, not calendar days).
On Input: vals - Array of Number|null; n - window.
On Output: Array (same length) of Number|null.
---------------------*/
function insRolling(vals, n){
  return vals.map((_, i) => insMean(vals.slice(Math.max(0, i - n + 1), i + 1)));
}

/*-------------------
Purpose: Least-squares slope of y over calendar days.
On Input: rows - Array of { date, y } (y may be null).
On Output: { slope: €/day, n } or null with fewer than 3 points.
---------------------*/
function insTrend(rows){
  const pts = rows.filter(r => r.y != null).map(r => ({ x: new Date(r.date + "T12:00:00").getTime() / 864e5, y: r.y }));
  if (pts.length < 3) return null;
  const mx = insMean(pts.map(p => p.x)), my = insMean(pts.map(p => p.y));
  let sxy = 0, sxx = 0;
  pts.forEach(p => { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; });
  return sxx ? { slope: sxy / sxx, n: pts.length } : null;
}

/*-------------------
Purpose: Draw (or redraw) a profit-after-VAT chart: bars per day, 7-saved-day rolling mean, floor.
On Input: canvasId - String; rows - insDayStat rows.
On Output: none.
---------------------*/
function insDrawTrend(canvasId, rows){
  const cv = document.getElementById(canvasId);
  if (!cv || typeof Chart === "undefined") return;
  if (insCharts[canvasId]) insCharts[canvasId].destroy();
  const r = rows.filter(x => x.after != null);
  const after = r.map(x => Math.round(x.after * 100) / 100);
  const roll = insRolling(after, 7).map(v => v == null ? null : Math.round(v * 100) / 100);
  const floor = r.map(x => salaryFloorFor(x.date));
  const ds = [
    { type: "bar", label: "Καθαρό μετά ΦΠΑ", data: after, backgroundColor: after.map(v => v >= 0 ? "#6eaa7d" : "#e58a82") },
    { type: "line", label: "Μέσος 7 αποθηκευμένων ημερών", data: roll, borderColor: "#1f5fbf", backgroundColor: "#1f5fbf", tension: .25, pointRadius: 2 }
  ];
  if (floor.some(v => v != null)) ds.push({ type: "line", label: "Μισθός (κατώτατο)", data: floor, borderColor: "#b42318", borderDash: [6, 4], pointRadius: 0 });
  insCharts[canvasId] = new Chart(cv, { data: { labels: r.map(x => x.date.slice(5)), datasets: ds },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } } } });
}

/*-------------------
Purpose: Στατιστικά tab: reload ALL saved days and sales sheets, then draw KPIs, trend, weekday
         table, the per-day table (computed sales vs actual income) and the sales sheets list.
On Input: none.
On Output: Promise<void>.
---------------------*/
async function renderStatsTab(){
  if (typeof loadAllDays === "function") await loadAllDays();
  const rows = insAllDayStats();
  const full = rows.filter(r => !r.legacy);
  const badge = document.getElementById("statBadge");
  if (badge) badge.textContent = rows.length ? rows.length + " ημέρες · " + rows[0].date + " → " + rows[rows.length - 1].date : "καμία ημέρα";
  const warn = [];
  if (rows.length < INS_LOW_DAYS) warn.push("Λίγα δεδομένα: " + rows.length + " αποθηκευμένες ημέρες. Οι μέσοι όροι είναι ενδεικτικοί και θα βελτιώνονται με κάθε αποθηκευμένη ημέρα.");
  const leg = rows.filter(r => r.legacy).map(r => r.date);
  if (leg.length) warn.push("Παλιό format χωρίς προμήθειες (" + leg.join(", ") + "): μετρούν στις πωλήσεις, όχι στο κέρδος.");
  const noCh = rows.filter(r => !r.ch).map(r => r.date);
  if (noCh.length) warn.push("Χωρίς μερίδες ανά κανάλι: " + noCh.join(", ") + ".");
  const withRec = rows.filter(r => r.recorded != null);
  if (rows.length && withRec.length < rows.length) warn.push("Πραγματική είσπραξη υπάρχει σε " + withRec.length + " από " + rows.length + " ημέρες· γράψ' την στο Πωλήσεις → Κέρδος / Ημέρα.");
  const w = document.getElementById("statWarn");
  if (w) w.innerHTML = warn.map(t => '<div class="ins-warn">' + insEsc(t) + "</div>").join("");

  const floorNow = salaryFloorFor(localTodayISO());
  const hit = full.filter(r => { const f = salaryFloorFor(r.date); return f != null && r.after >= f; }).length;
  const k = document.getElementById("statKpis");
  if (k) k.innerHTML = [
    ["Μέσες πωλήσεις / ημέρα", insEur(insMean(rows.map(r => r.sales))), rows.length + " ημέρες · υπολογισμένες από μερίδες"],
    ["Μέσο καθαρό μετά ΦΠΑ", insEur(insMean(full.map(r => r.after))), full.length + " ημέρες με προμήθειες"],
    ["Ημέρες ≥ μισθού", floorNow == null ? "—" : hit + " / " + full.length, floorNow == null ? "όρισε μισθό στο Στόχος → Μισθός" : "μισθός σήμερα " + insEur(floorNow)],
    ["Είσπραξη − υπολογισμένες", withRec.length ? insGap(insMean(withRec.map(r => r.gap))) : "—", withRec.length ? "μέσος όρος " + withRec.length + " ημερών" : "καμία πραγματική είσπραξη ακόμη"]
  ].map(([l, v, s]) => '<div class="kpi"><div class="label">' + l + '</div><div class="value">' + v + '</div><div class="sub">' + insEsc(s) + "</div></div>").join("");

  insDrawTrend("statTrendChart", rows);

  const wdBox = document.getElementById("statWeekday");
  if (wdBox) {
    const order = [1, 2, 3, 4, 5, 6, 0];
    wdBox.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Ημέρα</th><th>Ημέρες</th><th>Πωλήσεις</th><th>Μερίδες</th><th>Καθαρό μετά ΦΠΑ</th></tr></thead><tbody>' +
      order.map(d => {
        const r = rows.filter(x => x.wd === d), f = r.filter(x => !x.legacy);
        if (!r.length) return '<tr><td>' + INS_WEEKDAYS[d] + '</td><td>0</td><td colspan="3" class="ins-note">χωρίς δεδομένα</td></tr>';
        return "<tr><td>" + INS_WEEKDAYS[d] + "</td><td>" + r.length + (r.length < 2 ? ' <span class="ins-note">λίγα</span>' : "") + "</td><td>" + insEur(insMean(r.map(x => x.sales))) +
          "</td><td>" + (insMean(r.map(x => x.portions)) || 0).toFixed(1) + "</td><td>" + insEur(insMean(f.map(x => x.after))) + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  const t = document.getElementById("statDays");
  if (t) {
    const body = rows.slice().reverse().map(r => {
      const f = salaryFloorFor(r.date);
      const ch = r.ch ? Math.round(r.ch.local) + " / " + Math.round(r.ch.efood) + " / " + Math.round(r.ch.wolt) : "—";
      const rec = r.recorded == null ? "—" : insEur(r.recorded) + ' <span class="ins-note">' + (r.recordedConfirmed ? "✓" : "ανεπιβ.") + " · " + r.recordedFrom + "</span>";
      const gap = r.gap == null ? "—" : '<span class="' + (r.gap >= 0 ? "gap-pos" : "gap-neg") + '">' + insGap(r.gap) + "</span> (" + (r.gapPct * 100).toFixed(1) + "%)";
      const vs = (r.after == null || f == null) ? "—" : '<span class="' + (r.after >= f ? "gap-pos" : "gap-neg") + '">' + insGap(r.after - f) + "</span>";
      return "<tr><td>" + r.date + "</td><td>" + INS_WEEKDAYS[r.wd].slice(0, 3) + "</td><td>" + r.portions + "</td><td>" + ch + "</td><td>" + insEur(r.sales) + "</td><td>" + rec + "</td><td>" + gap +
        "</td><td>" + insEur(r.food) + "</td><td>" + insEur(r.comm) + "</td><td>" + insEur(r.fixed) + "</td><td>" + insEur(r.before) + "</td><td>" + insEur(r.vatDue) + "</td><td><b>" + insEur(r.after) + "</b></td><td>" + vs + "</td></tr>";
    }).join("");
    t.innerHTML = "<table><thead><tr><th>Ημέρα</th><th></th><th>Μερίδες</th><th>Κατ. / e-food / Wolt</th><th>Υπολογισμένες</th><th>Πραγματική είσπραξη</th><th>Διαφορά</th><th>Food</th><th>Προμήθειες</th><th>Σταθερά</th><th>Προ ΦΠΑ</th><th>ΦΠΑ</th><th>Μετά ΦΠΑ</th><th>vs μισθός</th></tr></thead><tbody>" + body + "</tbody></table>";
  }

  const sb = document.getElementById("statSheets");
  if (sb) {
    const sh = (typeof salesSheets !== "undefined" && salesSheets) || {};
    const ks = Object.keys(sh).sort().reverse();
    sb.innerHTML = ks.length ? "<ul>" + ks.map(d => {
      const s = sh[d] || {}, rv = s.revenue || {};
      return "<li>" + d + " · " + ((s.totals && s.totals.all) || "—") + " μερίδες · είσπραξη " + (rv.recorded != null ? insEur(Number(rv.recorded)) + (rv.confirmed ? " ✓" : " (ανεπιβεβαίωτη)") : "—") +
        " · " + (dayLedger[d] ? "αποθηκευμένη ημέρα ✓" : "<b>δεν έχει αποθηκευτεί ημέρα</b>") + "</li>";
    }).join("") + "</ul>" : '<p class="ins-note">Κανένα φύλλο πωλήσεων.</p>';
  }
}

/* ------------------------------- Μισθός & σχέδιο ημέρας ------------------------------- */

/*-------------------
Purpose: Is a key a daily cooked dish (not a fixed-menu item or a legacy alias)?
On Input: k - String.
On Output: Boolean.
---------------------*/
function goalIsDaily(k){
  return !!(menuCatalog[k] && !salesItems[k] && !salesLegacyToKey[k]);
}

/*-------------------
Purpose: Current price and food cost of a sold item (kitchen book / live menu, same helpers as the
         day screen). Unknown food cost counts as 0, like on the day screen.
On Input: k - String.
On Output: { name, price, fc, noCost, drink } or null when the item is unknown.
---------------------*/
function goalItem(k){
  const d = salesItemOf(k);
  if (!d) return null;
  const fc = salesItemFoodCost(k);
  return { name: d.el || k, price: parseEuro(d.price) || 0, fc: fc == null ? 0 : fc, noCost: fc == null,
           drink: d.category === "drinks" || d.type === "drinks" };
}

/*-------------------
Purpose: History of every item over all saved days that have channel counts.
On Input: none (dayLedger).
On Output: { days: Number, dates: [..], mix: {local,efood,wolt} shares, dishCounts: [n per day],
             items: { key: { days, portions, ch:{local,efood,wolt}, byWd: { wd: [portions..] }, perDay: [..] } } }.
           Only days with sales of an item are known (days on the menu with 0 sales are not stored).
---------------------*/
function goalHistory(){
  const items = {}, mixTot = { local: 0, efood: 0, wolt: 0 }, dates = [], dishCounts = [];
  Object.keys(dayLedger || {}).sort().forEach(k => {
    const rec = dayLedger[k];
    if (!rec || typeof rec !== "object") return;
    const c = insDayChannels(rec);
    if (!c.has) return;
    const date = String(rec.date || k).slice(0, 10), wd = insWeekday(date);
    dates.push(date);
    let daily = 0;
    Object.keys(c.keys).forEach(key => {
      const ch = c.keys[key], n = ch.local + ch.efood + ch.wolt;
      if (!(n > 0)) return;
      if (goalIsDaily(key)) daily++;
      const it = items[key] || (items[key] = { days: 0, portions: 0, ch: { local: 0, efood: 0, wolt: 0 }, byWd: {}, perDay: [] });
      it.days++; it.portions += n; it.perDay.push(n);
      ["local", "efood", "wolt"].forEach(x => { it.ch[x] += ch[x]; mixTot[x] += ch[x]; });
      (it.byWd[wd] || (it.byWd[wd] = [])).push(n);
    });
    dishCounts.push(daily);
  });
  const s = mixTot.local + mixTot.efood + mixTot.wolt;
  const mix = s > 0 ? { local: mixTot.local / s, efood: mixTot.efood / s, wolt: mixTot.wolt / s } : { local: 1, efood: 0, wolt: 0 };
  return { days: dates.length, dates, mix, dishCounts, items };
}

/*-------------------
Purpose: Commission share of one euro of sales at a channel mix.
On Input: mix - { local, efood, wolt } shares.
On Output: Number (e.g. 0.12).
---------------------*/
function goalCommRate(mix){
  return mix.local * (CH_COMM.local || 0) + mix.efood * (CH_COMM.efood || 0) + mix.wolt * (CH_COMM.wolt || 0);
}

/*-------------------
Purpose: Contribution of one portion after VAT and commissions (marginal; exact while the day's
         VAT due is positive): (price − food)/(1+VAT) − price × commission share.
On Input: price, fc - Numbers; mix - channel shares.
On Output: Number (€ per portion).
---------------------*/
function goalUnitAfter(price, fc, mix){
  return (price - fc) / (1 + VAT_RATE) - price * goalCommRate(mix);
}

/*-------------------
Purpose: Load / create the planning state (localStorage mz_goal; planning only).
On Input: none.
On Output: goalState { plan: {key: portions}, mix: {local,efood,wolt}|null, priceDelta: {key: €},
           incFixedMenu: Boolean, showAll: Boolean }.
---------------------*/
function goalLoadState(){
  if (goalState) return goalState;
  let s = null;
  try { s = JSON.parse(localStorage.getItem("mz_goal") || "null"); } catch (e) { s = null; }
  goalState = Object.assign({ plan: null, mix: null, priceDelta: {}, incFixedMenu: true, showAll: false }, s || {});
  return goalState;
}

/*-------------------
Purpose: Keep the planning state in localStorage (mz_goal).
On Input: none.
On Output: none.
---------------------*/
function goalSaveState(){
  try { localStorage.setItem("mz_goal", JSON.stringify(goalState)); } catch (e) {}
}

/*-------------------
Purpose: Expected portions of a dish on a weekday from history: weekday mean with ≥2 observations,
         else the mean of all days it sold.
On Input: it - goalHistory item or undefined; wd - 0..6.
On Output: { n: Number, basis: "weekday" | "all" | "none", obs: Number }.
---------------------*/
function goalExpected(it, wd){
  if (!it) return { n: 0, basis: "none", obs: 0 };
  const w = it.byWd[wd] || [];
  if (w.length >= 2) return { n: insMean(w), basis: "weekday", obs: w.length };
  return { n: it.portions / it.days, basis: "all", obs: it.days };
}

/*-------------------
Purpose: Channel mix used by the plan: the typed one, else history.
On Input: hist - goalHistory().
On Output: { local, efood, wolt } shares summing to 1.
---------------------*/
function goalMix(hist){
  const m = goalState.mix;
  if (m) {
    const s = Number(m.local || 0) + Number(m.efood || 0) + Number(m.wolt || 0);
    if (s > 0) return { local: m.local / s, efood: m.efood / s, wolt: m.wolt / s };
  }
  return hist.mix;
}

/*-------------------
Purpose: Average daily result of the fixed-menu items (salads, bread, grill, drinks) over the
         history, at today's prices and costs and each item's own channel counts.
On Input: hist - goalHistory().
On Output: { sales, food, comm, portions } per day (0 when there is no history).
---------------------*/
function goalFixedMenuAvg(hist){
  const out = { sales: 0, food: 0, comm: 0, portions: 0 };
  if (!hist.days) return out;
  Object.keys(hist.items).forEach(k => {
    if (goalIsDaily(k)) return;
    const g = goalItem(k), it = hist.items[k];
    if (!g) return;
    ["local", "efood", "wolt"].forEach(ch => {
      const n = it.ch[ch] / hist.days, sales = n * g.price;
      out.sales += sales; out.food += n * g.fc; out.comm += sales * (CH_COMM[ch] || 0); out.portions += n;
    });
  });
  return out;
}

/*-------------------
Purpose: Daily dishes shown with a slider: today's menu picks first, then (when "όλα") every daily
         dish with history.
On Input: hist - goalHistory().
On Output: Array of keys.
---------------------*/
function goalDishKeys(hist){
  const picks = (typeof siteDailyPicks !== "undefined" ? siteDailyPicks : []).filter(goalIsDaily);
  const planned = Object.keys(goalState.plan || {}).filter(k => goalIsDaily(k) && goalState.plan[k] > 0);
  let keys = [...new Set([...picks, ...planned])];
  if (goalState.showAll) keys = [...new Set([...keys, ...Object.keys(hist.items).filter(goalIsDaily)])];
  return keys.filter(k => goalItem(k));
}

/*-------------------
Purpose: Totals of the planned day with withVatProfit (same formula as the saved day).
On Input: hist - goalHistory(); mix - shares; opts - { mix?, priceDelta?: Number (all dishes) }.
On Output: { portions, sales, food, comm, fixed, profitBefore, vatDue, profitAfter, fm }.
---------------------*/
function goalTotals(hist, mix, opts){
  opts = opts || {};
  const m = opts.mix || mix;
  let portions = 0, sales = 0, food = 0, comm = 0;
  Object.keys(goalState.plan || {}).forEach(k => {
    const n = Number(goalState.plan[k] || 0), g = goalItem(k);
    if (!(n > 0) || !g) return;
    const p = g.price + Number(goalState.priceDelta[k] || 0) + Number(opts.priceDelta || 0);
    portions += n; sales += n * p; food += n * g.fc; comm += n * p * goalCommRate(m);
  });
  const fm = goalState.incFixedMenu ? goalFixedMenuAvg(hist) : { sales: 0, food: 0, comm: 0, portions: 0 };
  const fixed = Number(document.getElementById("fixedDaily")?.value || planSetting("planner.fixedDaily"));
  const x = withVatProfit({ sales: sales + fm.sales, food: food + fm.food, comm: comm + fm.comm, fixed });
  return { ...x, portions, dishSales: sales, fm };
}

/*-------------------
Purpose: Default plan: expected portions (history, weekday of #planDay) of today's menu picks.
On Input: hist - goalHistory().
On Output: { key: portions }.
---------------------*/
function goalDefaultPlan(hist){
  const wd = insWeekday(currentPlanDay()), plan = {};
  goalDishKeys(hist).forEach(k => { plan[k] = Math.round(goalExpected(hist.items[k], wd).n); });
  return plan;
}

/*-------------------
Purpose: Μισθός & σχέδιο tab: controls, sliders, KPIs and every method card.
On Input: none.
On Output: Promise<void>.
---------------------*/
async function renderGoalTab(){
  goalLoadState();
  if (typeof loadAllDays === "function" && !renderGoalTab.loaded) { await loadAllDays(); renderGoalTab.loaded = true; }
  const hist = goalHistory();
  if (!goalState.plan) { goalState.plan = goalDefaultPlan(hist); goalSaveState(); }
  const s = salarySettings(), mix = goalMix(hist), wd = insWeekday(currentPlanDay());
  const ctl = document.getElementById("goalControls");
  if (ctl) ctl.innerHTML = `<div class="form-grid">
    <div class="card-mini"><div class="section-title">Μισθός ιδιοκτήτη · καθαρό μετά ΦΠΑ / ημέρα (€)</div>
      <input type="number" min="0" step="5" value="${s.base == null ? "" : s.base}" placeholder="—" onchange="setSalarySetting('salaryFloor', this.value)">
      <div class="note">Κατώτατο. Μένει με «Αποθήκευση στην Matzourana-Database».</div></div>
    <div class="card-mini"><div class="section-title">Σταδιακή αύξηση (€ / μήνα)</div>
      <input type="number" min="0" step="1" value="${s.step || ""}" placeholder="0" onchange="setSalarySetting('salaryStep', this.value)"></div>
    <div class="card-mini"><div class="section-title">Από μήνα</div>
      <input type="month" value="${s.start || ""}" onchange="setSalarySetting('salaryStart', this.value)"></div>
    <div class="card-mini"><div class="section-title">Κανάλια σχεδίου (% Κατ. / e-food / Wolt)</div>
      <div style="display:flex;gap:4px">${["local", "efood", "wolt"].map(ch => `<input type="number" min="0" max="100" step="5" style="width:60px" value="${Math.round(mix[ch] * 100)}" onchange="goalSetMix('${ch}', this.value)">`).join("")}</div>
      <div class="note">${goalState.mix ? '<a href="#" onclick="goalSetMix(null);return false;">επαναφορά ιστορικού</a>' : "ιστορικό " + hist.days + " ημερών"}</div></div>
    <div class="card-mini"><div class="section-title">Ημέρα σχεδίου</div><div>${currentPlanDay()} · ${INS_WEEKDAYS[wd]}</div>
      <div class="note">από το Πωλήσεις → Κέρδος / Ημέρα</div>
      <button type="button" class="btn-ghost" style="margin-top:6px" onclick="goalResetPlan()">Μερίδες από ιστορικό</button></div>
  </div>`;
  const warn = [];
  if (s.base == null) warn.push("Δεν έχει οριστεί μισθός/ημέρα: γράψε το ποσό πάνω.");
  if (hist.days < INS_LOW_DAYS) warn.push("Ιστορικό μόνο " + hist.days + " ημερών με μερίδες ανά κανάλι (" + (hist.dates[0] || "—") + " → " + (hist.dates[hist.days - 1] || "—") + "). Ζήτηση και μείγμα είναι ενδεικτικά.");
  if (!(CH_COMM.efood || CH_COMM.wolt)) warn.push("Οι προμήθειες δεν έχουν φορτωθεί από το βιβλίο κουζίνας.");
  const gw = document.getElementById("goalWarn");
  if (gw) gw.innerHTML = warn.map(t => '<div class="ins-warn">' + insEsc(t) + "</div>").join("");
  goalRenderSliders(hist, mix, wd);
  goalRecalc();
  insDrawTrend("goalTrendChart", insAllDayStats());
  goalRenderTrendNote();
}

/*-------------------
Purpose: Draw one slider row per daily dish (planned portions), with price, food cost, unit
         contribution after VAT & commissions and history.
On Input: hist, mix, wd.
On Output: none.
---------------------*/
function goalRenderSliders(hist, mix, wd){
  const box = document.getElementById("goalSliders");
  if (!box) return;
  const keys = goalDishKeys(hist);
  const rows = keys.map(k => {
    const g = goalItem(k), it = hist.items[k], e = goalExpected(it, wd), n = Number(goalState.plan[k] || 0);
    const p = g.price + Number(goalState.priceDelta[k] || 0);
    const u = goalUnitAfter(p, g.fc, mix);
    const max = Math.max(20, Math.ceil(((it && Math.max(...it.perDay)) || 0) * 2));
    const histTxt = it ? `ιστ. ${e.n.toFixed(1)}/ημ. (${e.basis === "weekday" ? INS_WEEKDAYS[wd].slice(0, 3) + " " : ""}${e.obs} ημ.)${it.days < INS_LOW_DISH ? " · λίγα δεδομένα" : ""}` : "χωρίς ιστορικό";
    return `<div class="goal-row" data-goal-key="${insEsc(k)}">
      <div><b>${insEsc(g.name)}</b><div class="hist">${histTxt}</div></div>
      <input type="range" min="0" max="${max}" step="1" value="${n}" oninput="goalSetPortion('${insEsc(k)}', this.value)">
      <div><b data-goal-n>${n}</b></div>
      <div>${insEur(p)}</div><div>${insEur(g.fc)}${g.noCost ? " ?" : ""}</div>
      <div class="${u >= 0 ? "gap-pos" : "gap-neg"}">${insEur(u)}</div>
      <div data-goal-line>${insEur(u * n)}</div></div>`;
  }).join("");
  const fm = goalFixedMenuAvg(hist);
  box.innerHTML = `<div class="goal-row head"><div>Πιάτο</div><div>Μερίδες</div><div>#</div><div>Τιμή</div><div>Food</div><div>Συνεισφ./μερ.</div><div>Σύνολο</div></div>` +
    (rows || '<p class="ins-note">Δεν υπάρχουν πιάτα σημερινού μενού.</p>') +
    `<p class="ins-note" style="margin-top:8px">
      <label><input type="checkbox" ${goalState.incFixedMenu ? "checked" : ""} onchange="goalState.incFixedMenu=this.checked;goalSaveState();goalRecalc()">
      Σταθερό μενού (σαλάτες, ψωμί, ψητά, ποτά): ιστορικός μέσος ${fm.portions.toFixed(1)} μερ./ημ. · πωλήσεις ${insEur(fm.sales)}</label> ·
      <label><input type="checkbox" ${goalState.showAll ? "checked" : ""} onchange="goalState.showAll=this.checked;goalSaveState();renderGoalTab()"> όλα τα πιάτα με ιστορικό</label><br>
      Συνεισφορά/μερίδα = (τιμή − food)/1.13 − τιμή × προμήθεια μείγματος (${(goalCommRate(mix) * 100).toFixed(1)}%). «?» = χωρίς συνταγή (food 0).</p>`;
}

/*-------------------
Purpose: Slider moved: store the portions and refresh the totals (rows are not redrawn).
On Input: key - String; val - slider value.
On Output: none.
---------------------*/
function goalSetPortion(key, val){
  goalState.plan[key] = Math.max(0, Math.round(Number(val) || 0));
  goalSaveState();
  const row = document.querySelector('.goal-row[data-goal-key="' + key + '"]');
  if (row) {
    const hist = goalHistory(), mix = goalMix(hist), g = goalItem(key);
    const u = goalUnitAfter(g.price + Number(goalState.priceDelta[key] || 0), g.fc, mix);
    row.querySelector("[data-goal-n]").textContent = goalState.plan[key];
    row.querySelector("[data-goal-line]").textContent = insEur(u * goalState.plan[key]);
  }
  goalRecalc();
}

/*-------------------
Purpose: Change the plan channel mix (null = back to history) and redraw.
On Input: ch - "local" | "efood" | "wolt" | null; val - percent.
On Output: none.
---------------------*/
function goalSetMix(ch, val){
  if (ch == null) goalState.mix = null;
  else {
    const cur = goalMix(goalHistory());
    goalState.mix = { local: cur.local * 100, efood: cur.efood * 100, wolt: cur.wolt * 100 };
    goalState.mix[ch] = Math.max(0, Number(val) || 0);
  }
  goalSaveState();
  renderGoalTab();
}

/*-------------------
Purpose: Plan back to the expected portions from history for today's menu.
On Input: none.
On Output: none.
---------------------*/
function goalResetPlan(){
  goalState.plan = goalDefaultPlan(goalHistory());
  goalSaveState();
  renderGoalTab();
}

/*-------------------
Purpose: Put a suggested menu (key → portions) into the sliders.
On Input: plan - { key: portions }.
On Output: none.
---------------------*/
function goalApplyPlan(plan){
  goalState.plan = { ...plan };
  goalState.showAll = goalState.showAll || Object.keys(plan).some(k => !(typeof siteDailyPicks !== "undefined" && siteDailyPicks.includes(k)));
  goalSaveState();
  renderGoalTab();
}

/*-------------------
Purpose: Recompute KPIs, floor bar, break-even, channel effect, menu engineering, suggestion and
         what-if cards from the current plan.
On Input: none.
On Output: none.
---------------------*/
function goalRecalc(){
  const hist = goalHistory(), mix = goalMix(hist), date = currentPlanDay(), wd = insWeekday(date);
  const t = goalTotals(hist, mix), floor = salaryFloorFor(date);
  const gap = floor == null ? null : t.profitAfter - floor;
  const k = document.getElementById("goalKpis");
  if (k) k.innerHTML = [
    ["Μερίδες σχεδίου", (t.portions + t.fm.portions).toFixed(0), t.portions + " πιάτα ημέρας + " + t.fm.portions.toFixed(1) + " σταθερό μενού"],
    ["Πωλήσεις σχεδίου", insEur(t.sales), "food " + insEur(t.food) + " · προμήθειες " + insEur(t.comm)],
    ["Κέρδος προ ΦΠΑ", insEur(t.profitBefore), "σταθερά " + insEur(t.fixed) + " · ΦΠΑ " + insEur(t.vatDue)],
    ["Καθαρό μετά ΦΠΑ", insEur(t.profitAfter), floor == null ? "όρισε μισθό" : "μισθός " + insEur(floor) + " · " + (gap >= 0 ? "πάνω " : "λείπουν ") + insEur(Math.abs(gap))]
  ].map(([l, v, s], i) => `<div class="kpi${i === 3 && floor != null ? (gap >= 0 ? " good" : " bad") : ""}"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${insEsc(s)}</div></div>`).join("");
  const fb = document.getElementById("goalFloorBar");
  if (fb) {
    if (floor == null) fb.innerHTML = "";
    else {
      const top = Math.max(floor * 2, t.profitAfter, 1), pct = Math.max(0, Math.min(100, t.profitAfter / top * 100)), fl = floor / top * 100;
      fb.innerHTML = `<div class="floor-bar" title="καθαρό μετά ΦΠΑ vs μισθός"><span style="width:${pct}%;background:${gap >= 0 ? "var(--green)" : "var(--red)"}"></span><i style="left:${fl}%"></i></div>
        <div class="ins-note">Μαύρη γραμμή = μισθός ${insEur(floor)}${salarySettings().step ? " (αυξάνεται " + insEur(salarySettings().step) + "/μήνα)" : ""}. Σχέδιο ${insEur(t.profitAfter)}.</div>`;
    }
  }
  goalRenderBreakEven(hist, mix, t, floor);
  goalRenderChannels(hist, mix, floor);
  goalRenderMenuEng(hist);
  goalRenderSuggest(hist, mix, wd, floor);
  goalRenderWhatIf(hist, mix, t);
}

/*-------------------
Purpose: Break-even and portions needed for the salary: (fixed + salary − fixed-menu contribution)
         / average contribution per daily-dish portion of the plan (history mix when empty).
On Input: hist, mix, t (goalTotals), floor.
On Output: none.
---------------------*/
function goalRenderBreakEven(hist, mix, t, floor){
  const box = document.getElementById("goalBreakEven");
  if (!box) return;
  let wsum = 0, n = 0, basis = "σχεδίου";
  const add = (k, q) => { const g = goalItem(k); if (!g || !(q > 0)) return; wsum += q * goalUnitAfter(g.price + Number(goalState.priceDelta[k] || 0), g.fc, mix); n += q; };
  Object.keys(goalState.plan || {}).forEach(k => add(k, Number(goalState.plan[k] || 0)));
  if (!n) { basis = "ιστορικού"; Object.keys(hist.items).filter(goalIsDaily).forEach(k => add(k, hist.items[k].portions)); }
  if (!n) { box.innerHTML = '<p class="ins-note">Χωρίς σχέδιο ή ιστορικό.</p>'; return; }
  const u = wsum / n;
  const fm = goalState.incFixedMenu ? goalFixedMenuAvg(hist) : { sales: 0, food: 0, comm: 0 };
  const fmAfter = (fm.sales - fm.food) / (1 + VAT_RATE) - fm.comm;
  const be = (t.fixed - fmAfter) / u, need = floor == null ? null : (t.fixed + floor - fmAfter) / u;
  const histAvg = hist.days ? insMean(Object.keys(dayLedger).map(d => dayLedger[d]).filter(r => insDayChannels(r).has).map(r => {
    const c = insDayChannels(r); return Object.keys(c.keys).filter(goalIsDaily).reduce((s, k) => s + c.keys[k].local + c.keys[k].efood + c.keys[k].wolt, 0); })) : null;
  box.innerHTML = `<table><tbody>
    <tr><td>Μέση συνεισφορά / μερίδα πιάτου (${basis}, μείγμα καναλιών)</td><td><b>${insEur(u)}</b></td></tr>
    <tr><td>Σταθερό μενού / ημέρα (μετά ΦΠΑ & προμήθειες)</td><td>${insEur(fmAfter)}</td></tr>
    <tr><td>Σταθερά κόστη / ημέρα</td><td>${insEur(t.fixed)}</td></tr>
    <tr><td><b>Νεκρό σημείο</b> (καθαρό μετά ΦΠΑ = 0)</td><td><b>${Math.ceil(be)}</b> μερίδες πιάτων</td></tr>
    <tr><td><b>Για τον μισθό</b> ${floor == null ? "" : "(" + insEur(floor) + " μετά ΦΠΑ)"}</td><td><b>${need == null ? "—" : Math.ceil(need)}</b> μερίδες πιάτων</td></tr>
    <tr><td>Ιστορικός μέσος (πιάτα ημέρας)</td><td>${histAvg == null ? "—" : histAvg.toFixed(1)} μερίδες / ημέρα</td></tr>
    <tr><td>Σχέδιο τώρα</td><td>${t.portions} μερίδες</td></tr>
  </tbody></table>
  <p class="ins-note">Ισχύει όσο ο ΦΠΑ ημέρας είναι θετικός (πάντα στις πραγματικές ημέρες). Μερίδες στρογγυλεμένες προς τα πάνω.</p>`;
}

/*-------------------
Purpose: Channel-mix effect: profit after VAT of the same planned portions at the plan mix, 100%
         takeaway, 100% e-food and 100% Wolt, and the value of +10 points of takeaway.
On Input: hist, mix, floor.
On Output: none.
---------------------*/
function goalRenderChannels(hist, mix, floor){
  const box = document.getElementById("goalChannels");
  if (!box) return;
  const at = m => goalTotals(hist, mix, { mix: m }).profitAfter;
  const cur = at(mix);
  const shift = Math.min(0.1, mix.efood + mix.wolt);
  const plat = mix.efood + mix.wolt;
  const m10 = plat > 0 ? { local: mix.local + shift, efood: mix.efood - shift * mix.efood / plat, wolt: mix.wolt - shift * mix.wolt / plat } : mix;
  const rows = [["Μείγμα σχεδίου " + Math.round(mix.local * 100) + "/" + Math.round(mix.efood * 100) + "/" + Math.round(mix.wolt * 100), cur],
    ["100% Κατάστημα / takeaway", at({ local: 1, efood: 0, wolt: 0 })],
    ["100% e-food (" + Math.round((CH_COMM.efood || 0) * 100) + "%)", at({ local: 0, efood: 1, wolt: 0 })],
    ["100% Wolt (" + Math.round((CH_COMM.wolt || 0) * 100) + "%)", at({ local: 0, efood: 0, wolt: 1 })]];
  box.innerHTML = "<table><tbody>" + rows.map(([l, v]) => `<tr><td>${l}</td><td><b>${insEur(v)}</b></td><td>${floor == null ? "" : '<span class="' + (v >= floor ? "gap-pos" : "gap-neg") + '">' + insGap(v - floor) + "</span>"}</td></tr>`).join("") + "</tbody></table>" +
    `<p class="ins-note">+10 μονάδες takeaway (από πλατφόρμες) ≈ <b>${insGap(at(m10) - cur)}</b> / ημέρα με τις ίδιες μερίδες.</p>`;
}

/*-------------------
Purpose: Menu engineering (Kasavana & Smith) of daily dishes with history: popularity = portions
         per day sold vs 70% of the average; margin = contribution after VAT & commissions (own
         channel mix) vs the portion-weighted average. Stars / plowhorses / puzzles / dogs.
On Input: hist.
On Output: none.
---------------------*/
function goalRenderMenuEng(hist){
  const box = document.getElementById("goalMenuEng");
  if (!box) return;
  const rows = Object.keys(hist.items).filter(goalIsDaily).map(k => {
    const g = goalItem(k), it = hist.items[k];
    if (!g) return null;
    const tot = it.ch.local + it.ch.efood + it.ch.wolt;
    const m = tot > 0 ? { local: it.ch.local / tot, efood: it.ch.efood / tot, wolt: it.ch.wolt / tot } : hist.mix;
    return { k, name: g.name, pop: it.portions / it.days, days: it.days, portions: it.portions, cm: goalUnitAfter(g.price, g.fc, m) };
  }).filter(Boolean);
  if (!rows.length) { box.innerHTML = '<p class="ins-note">Χωρίς ιστορικό πιάτων.</p>'; return; }
  const popThr = insMean(rows.map(r => r.pop)) * INS_ME_POP;
  const cmAvg = rows.reduce((s, r) => s + r.cm * r.portions, 0) / rows.reduce((s, r) => s + r.portions, 0);
  const cls = r => r.pop >= popThr ? (r.cm >= cmAvg ? ["me-star", "Star", "κράτα· σταθερά στο μενού"] : ["me-plow", "Plowhorse", "δημοφιλές, χαμηλό περιθώριο: μικρή αύξηση τιμής ή κόστους"])
                                   : (r.cm >= cmAvg ? ["me-puzzle", "Puzzle", "καλό περιθώριο, λίγες μερίδες: προβολή στις πλατφόρμες"] : ["me-dog", "Dog", "λίγες μερίδες & περιθώριο: λιγότερο συχνά"]);
  rows.sort((a, b) => b.cm * b.pop - a.cm * a.pop);
  box.innerHTML = `<p class="ins-note">Όριο δημοφιλίας ${popThr.toFixed(1)} μερ./ημέρα (70% του μέσου) · μέση συνεισφορά ${insEur(cmAvg)}. Μόνο ημέρες με πωλήσεις του πιάτου.</p>
    <div class="table-wrap"><table><thead><tr><th>Πιάτο</th><th>Κατηγορία</th><th>Μερ./ημ.</th><th>Συνεισφ.</th><th>Ημέρες</th><th>Πρόταση</th></tr></thead><tbody>` +
    rows.map(r => { const c = cls(r); return `<tr><td>${insEsc(r.name)}</td><td><span class="me-tag ${c[0]}">${c[1]}</span></td><td>${r.pop.toFixed(1)}</td><td>${insEur(r.cm)}</td><td>${r.days}${r.days < INS_LOW_DISH ? ' <span class="ins-note">λίγα</span>' : ""}</td><td class="ins-note">${c[2]}</td></tr>`; }).join("") +
    "</tbody></table></div>";
}

/*-------------------
Purpose: Suggested daily menu for the weekday of #planDay: the K daily dishes with the highest
         expected contribution (expected portions × contribution), K = median number of daily
         dishes sold per saved day. Shows the expected profit after VAT vs the salary.
On Input: hist, mix, wd, floor.
On Output: none.
---------------------*/
function goalRenderSuggest(hist, mix, wd, floor){
  const box = document.getElementById("goalSuggest");
  if (!box) return;
  const cand = Object.keys(hist.items).filter(goalIsDaily).map(k => {
    const g = goalItem(k), e = goalExpected(hist.items[k], wd);
    if (!g) return null;
    const u = goalUnitAfter(g.price, g.fc, mix);
    return { k, name: g.name, e, u, val: e.n * u, days: hist.items[k].days };
  }).filter(Boolean).sort((a, b) => b.val - a.val);
  if (!cand.length) { box.innerHTML = '<p class="ins-note">Χωρίς ιστορικό.</p>'; return; }
  const dc = hist.dishCounts.slice().sort((a, b) => a - b);
  const K = dc.length ? dc[Math.floor(dc.length / 2)] : Math.min(10, cand.length);
  const pick = cand.slice(0, K), plan = {};
  pick.forEach(c => { plan[c.k] = Math.round(c.e.n); });
  const saved = goalState.plan; goalState.plan = plan;
  const t = goalTotals(hist, mix); goalState.plan = saved;
  const thin = pick.filter(c => c.days < INS_LOW_DISH).length;
  box.innerHTML = `<p class="ins-note">${INS_WEEKDAYS[wd]} · ${K} πιάτα (διάμεσος αριθμός πιάτων/ημέρα) · αναμενόμενες μερίδες από ${hist.days} ημέρες${thin ? " · " + thin + " πιάτα με λίγα δεδομένα" : ""}.</p>
    <div class="table-wrap"><table><thead><tr><th>Πιάτο</th><th>Αναμ. μερ.</th><th>Βάση</th><th>Συνεισφ.</th><th>Αναμ. €</th></tr></thead><tbody>` +
    pick.map(c => `<tr><td>${insEsc(c.name)}</td><td>${c.e.n.toFixed(1)}</td><td class="ins-note">${c.e.basis === "weekday" ? INS_WEEKDAYS[wd].slice(0, 3) + " ×" + c.e.obs : "όλες ×" + c.e.obs}</td><td>${insEur(c.u)}</td><td>${insEur(c.val)}</td></tr>`).join("") +
    `</tbody></table></div><p>Αναμενόμενο καθαρό μετά ΦΠΑ: <b>${insEur(t.profitAfter)}</b>${floor == null ? "" : ' · <span class="' + (t.profitAfter >= floor ? "gap-pos" : "gap-neg") + '">' + insGap(t.profitAfter - floor) + "</span> vs μισθός"}</p>
    <button type="button" class="btn-ghost" onclick='goalApplyPlan(${JSON.stringify(plan)})'>Βάλε το στις μπάρες</button>
    <p class="ins-note">Η ζήτηση μετρά μόνο ημέρες που το πιάτο πούλησε· δεν προβλέπει αλληλο-υποκατάσταση πιάτων.</p>`;
}

/*-------------------
Purpose: Note under the trend chart: rolling mean, trend slope and the latest days vs the salary.
On Input: none.
On Output: none.
---------------------*/
function goalRenderTrendNote(){
  const box = document.getElementById("goalTrendNote");
  if (!box) return;
  const rows = insAllDayStats().filter(r => r.after != null);
  const last = rows.slice(-7);
  const avg = insMean(last.map(r => r.after)), tr = insTrend(rows.slice(-14).map(r => ({ date: r.date, y: r.after })));
  const f = salaryFloorFor(localTodayISO());
  box.innerHTML = `<p class="ins-note">Μέσος τελευταίων ${last.length} αποθηκευμένων ημερών: <b>${insEur(avg)}</b>${f == null || avg == null ? "" : ' (<span class="' + (avg >= f ? "gap-pos" : "gap-neg") + '">' + insGap(avg - f) + "</span> vs μισθός)"} ·
    τάση ${tr ? (tr.slope >= 0 ? "+" : "−") + "€" + Math.abs(tr.slope).toFixed(2) + " / ημέρα (" + tr.n + " ημέρες)" : "— (χρειάζονται ≥3 ημέρες)"}.
    ${rows.length < INS_LOW_DAYS ? "Λίγες ημέρες με κενά μεταξύ τους: η τάση είναι ενδεικτική." : ""}</p>`;
}

/*-------------------
Purpose: What-if prices (suggestion only, same demand assumed): +€0.50 on every planned dish, and
         the dishes where +€0.50 adds the most profit after VAT.
On Input: hist, mix, t (goalTotals of the plan).
On Output: none.
---------------------*/
function goalRenderWhatIf(hist, mix, t){
  const box = document.getElementById("goalWhatIf");
  if (!box) return;
  const all = goalTotals(hist, mix, { priceDelta: 0.5 }).profitAfter - t.profitAfter;
  const per = 0.5 * (1 / (1 + VAT_RATE) - goalCommRate(mix));
  const top = Object.keys(goalState.plan || {}).filter(k => goalState.plan[k] > 0 && goalItem(k))
    .map(k => ({ name: goalItem(k).name, n: goalState.plan[k], add: goalState.plan[k] * per })).sort((a, b) => b.add - a.add).slice(0, 5);
  box.innerHTML = `<p>+€0.50 σε όλα τα πιάτα του σχεδίου: <b>${insGap(all)}</b> / ημέρα (ίδιες μερίδες).</p>` +
    (top.length ? "<table><tbody>" + top.map(x => `<tr><td>${insEsc(x.name)}</td><td>${x.n} μερ.</td><td>+€0.50 → <b>${insGap(x.add)}</b></td></tr>`).join("") + "</tbody></table>" : "") +
    '<p class="ins-note">Δεν υπάρχουν δεδομένα ελαστικότητας: υποθέτουμε ίδια ζήτηση. Μόνο πρόταση· οι τιμές αλλάζουν μόνο από τα Πιάτα & Food Cost.</p>';
}
