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

document.addEventListener("DOMContentLoaded", initCompetitorTab);
