/* ============================================================
   admin/sales.js – "Πωλήσεις" tab of the admin
   ------------------------------------------------------------
   Daily sales log: portions per dish and channel (efood / Wolt /
   Takeaway), recorded revenue and expected revenue. This file holds
   NO business data: everything is read from the Realtime Database
   (matzourana_sales/) only after the owner has signed in (getDb()
   in index.html). It never writes.
   Database layout (written only after the owner approves a day):
     matzourana_sales/days/<YYYY-MM-DD> {
       date, weekday, status, source, sourceNote,
       items:{id:{order, name (as written), key (menuCatalog key or absent),
                  efood, wolt, takeaway, total, price, expected, note, matchNote, freeTakeaway}},
       totals:{efood, wolt, takeaway, all},
       revenue:{recorded, confirmed, note},
       expected:{method, priceSource, byChannel:{efood,wolt,takeaway}, total, diffVsRecorded,
                 withPlatformPrices:{byChannel,total,diffVsRecorded}, missingPrices:[], assumptions:[]},
       notes:[] }
   ============================================================ */

const SALES_CHANNELS = [["efood", "efood"], ["wolt", "Wolt"], ["takeaway", "Takeaway"]];
const salesState = { days: {}, dates: [], date: "", loaded: false };

/*-------------------
Purpose: Format a number as a Greek euro amount (€9,50).
On Input: v - Number (or null/undefined).
On Output: String - "€9,50", or "–" when there is no value.
---------------------*/
function salesEuro(v) {
  if (v == null || !Number.isFinite(Number(v))) return "–";
  return "€" + Number(v).toFixed(2).replace(".", ",");
}

/*-------------------
Purpose: Format a signed euro difference (+€60,30 / −€39,70).
On Input: v - Number (or null).
On Output: String with an explicit sign, or "–" when there is no value.
---------------------*/
function salesSignedEuro(v) {
  if (v == null || !Number.isFinite(Number(v))) return "–";
  const n = Number(v);
  return (n > 0.004 ? "+" : n < -0.004 ? "−" : "±") + "€" + Math.abs(n).toFixed(2).replace(".", ",");
}

/*-------------------
Purpose: Escape text before it goes into innerHTML.
On Input: s - any value.
On Output: String safe to place in HTML.
---------------------*/
function salesEsc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/*-------------------
Purpose: Percentage text with a Greek decimal comma.
On Input: part, whole - Numbers.
On Output: String - e.g. "37,0%", or "–" when whole is 0.
---------------------*/
function salesPct(part, whole) {
  if (!whole) return "–";
  return (part / whole * 100).toFixed(1).replace(".", ",") + "%";
}

/*-------------------
Purpose: Long Greek date for a "YYYY-MM-DD" key.
On Input: d - String "YYYY-MM-DD".
On Output: String - e.g. "Κυριακή 1 Νοεμβρίου 2026".
---------------------*/
function salesDateText(d) {
  if (!d) return "";
  return new Date(d + "T12:00:00").toLocaleDateString("el-GR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/*-------------------
Purpose: Items of one day as a list in tally order, with numbers cleaned up.
On Input: day - one day record (layout at the top of this file).
On Output: Array<{id, name, key, efood, wolt, takeaway, total, price, expected, note, matchNote}>.
---------------------*/
function salesItemsOf(day) {
  const items = (day && day.items) || {};
  return Object.keys(items).map(id => {
    const it = items[id] || {};
    const e = Number(it.efood || 0), w = Number(it.wolt || 0), t = Number(it.takeaway || 0);
    return Object.assign({}, it, { id: id, key: it.key || null, efood: e, wolt: w, takeaway: t, total: e + w + t });
  }).sort((a, b) => (a.order || 0) - (b.order || 0));
}

/*-------------------
Purpose: Portions per channel of one day (from the items, so a stale "totals" field cannot mislead).
On Input: day - one day record.
On Output: Object {efood, wolt, takeaway, all}.
---------------------*/
function salesChannelTotals(day) {
  const out = { efood: 0, wolt: 0, takeaway: 0, all: 0 };
  salesItemsOf(day).forEach(it => { SALES_CHANNELS.forEach(([c]) => { out[c] += it[c]; }); });
  out.all = out.efood + out.wolt + out.takeaway;
  return out;
}

/*-------------------
Purpose: Draw the selected day: KPIs (portions, channel shares, recorded vs expected revenue),
         the dish table with a totals row, the expected-revenue box and the notes.
On Input: none (reads salesState).
On Output: none.
Side effects: replaces the inner HTML of #salesKpis, #salesHead, #salesBody, #salesFoot,
              #salesExpected, #salesNotes and #salesStamp.
---------------------*/
function renderSalesDay() {
  const day = salesState.days[salesState.date] || null;
  const stamp = document.getElementById("salesStamp");
  const body = document.getElementById("salesBody");
  if (!stamp || !body) return;
  if (!day) {
    stamp.textContent = salesState.dates.length ? "Δεν υπάρχει καταγραφή για " + (salesState.date || "—") : "Δεν υπάρχουν καταγραφές";
    ["salesKpis", "salesFoot", "salesExpected", "salesNotes"].forEach(id => { document.getElementById(id).innerHTML = ""; });
    body.innerHTML = '<tr><td colspan="8" class="note">Δεν έχει εγκριθεί ακόμη καταγραφή πωλήσεων για αυτή την ημέρα.</td></tr>';
    return;
  }
  stamp.textContent = salesDateText(day.date || salesState.date) + (day.source ? " · " + day.source : "");
  const items = salesItemsOf(day);
  const tot = salesChannelTotals(day);
  const rev = day.revenue || {};
  const exp = day.expected || {};
  const diff = (rev.recorded != null && exp.total != null) ? Number(rev.recorded) - Number(exp.total) : null;
  const unconfirmed = rev.recorded != null && rev.confirmed === false;

  document.getElementById("salesKpis").innerHTML = [
    ["Μερίδες", String(tot.all), "όλα τα κανάλια", ""],
    ["efood", String(tot.efood), salesPct(tot.efood, tot.all) + " των μερίδων", ""],
    ["Wolt", String(tot.wolt), salesPct(tot.wolt, tot.all) + " των μερίδων", ""],
    ["Takeaway", String(tot.takeaway), salesPct(tot.takeaway, tot.all) + " των μερίδων", ""],
    ["Είσπραξη (καταγραφή)", salesEuro(rev.recorded), unconfirmed ? "⚠ προς επιβεβαίωση" : (rev.recorded != null ? "επιβεβαιωμένη" : "δεν καταγράφηκε"), unconfirmed ? "warn" : ""],
    ["Καταγραφή − αναμενόμενη", salesSignedEuro(diff), "αναμενόμενη " + salesEuro(exp.total), diff == null ? "" : Math.abs(diff) > 5 ? "warn" : "good"]
  ].map(k => `<div class="kpi ${k[3]}"><div class="label">${salesEsc(k[0])}</div><div class="value">${salesEsc(k[1])}</div><div class="sub">${salesEsc(k[2])}</div></div>`).join("");

  document.getElementById("salesHead").innerHTML = "<tr><th>Πιάτο</th>" +
    SALES_CHANNELS.map(([, label]) => `<th class="comp-num">${salesEsc(label)}</th>`).join("") +
    '<th class="comp-num">Σύνολο</th><th class="comp-num">Τιμή admin</th><th class="comp-num">Αναμενόμενα</th><th>Σημείωση</th></tr>';
  const maxTotal = Math.max(1, ...items.map(it => it.total));
  body.innerHTML = items.map(it => {
    const cells = SALES_CHANNELS.map(([c]) => `<td class="comp-num${it[c] ? "" : " comp-empty"}">${it[c] || "–"}</td>`).join("");
    const keyText = it.key ? it.key : "χωρίς αντιστοίχιση";
    const notes = [it.note, it.matchNote].filter(Boolean).map(salesEsc).join("<br>");
    return `<tr><td><strong>${salesEsc(it.name)}</strong><div class="comp-sub${it.key ? "" : " comp-warn"}">${salesEsc(keyText)}</div></td>${cells}` +
      `<td class="comp-num"><strong>${it.total}</strong><div class="sales-bar"><span style="width:${(it.total / maxTotal * 100).toFixed(0)}%"></span></div></td>` +
      `<td class="comp-num">${salesEuro(it.price)}</td><td class="comp-num">${salesEuro(it.expected)}</td><td class="comp-note">${notes}</td></tr>`;
  }).join("");
  const byCh = exp.byChannel || {};
  document.getElementById("salesFoot").innerHTML = "<tr><th>Σύνολο μερίδων</th>" +
    SALES_CHANNELS.map(([c]) => `<th class="comp-num">${tot[c]}</th>`).join("") +
    `<th class="comp-num">${tot.all}</th><th></th><th class="comp-num">${salesEuro(exp.total)}</th><th></th></tr>` +
    '<tr><th class="comp-sub">Αναμενόμενα € ανά κανάλι</th>' +
    SALES_CHANNELS.map(([c]) => `<th class="comp-num comp-sub">${salesEuro(byCh[c])}</th>`).join("") + "<th></th><th></th><th></th><th></th></tr>";

  renderSalesExpected(day, diff);
  const notes = [].concat(day.notes || [], rev.note ? [rev.note] : []);
  document.getElementById("salesNotes").innerHTML = notes.map(n => `<li>${salesEsc(n)}</li>`).join("");
}

/*-------------------
Purpose: Draw the "expected revenue vs recorded" box of one day.
On Input: day - one day record; diff - Number|null (recorded − expected at admin prices).
On Output: none.
Side effects: replaces the inner HTML of #salesExpected.
---------------------*/
function renderSalesExpected(day, diff) {
  const exp = day.expected || {};
  const rev = day.revenue || {};
  const plat = exp.withPlatformPrices || null;
  const row = (label, byCh, total, d) => `<tr><td>${salesEsc(label)}</td>` +
    SALES_CHANNELS.map(([c]) => `<td class="comp-num">${salesEuro(byCh && byCh[c])}</td>`).join("") +
    `<td class="comp-num"><strong>${salesEuro(total)}</strong></td><td class="comp-num">${salesSignedEuro(d)}</td></tr>`;
  const missing = (exp.missingPrices || []).length ? `<p class="comp-warn">Χωρίς τιμή: ${salesEsc(exp.missingPrices.join(", "))}</p>` : "";
  document.getElementById("salesExpected").innerHTML =
    `<table><thead><tr><th>Αναμενόμενη είσπραξη</th>${SALES_CHANNELS.map(([, l]) => `<th class="comp-num">${salesEsc(l)}</th>`).join("")}<th class="comp-num">Σύνολο</th><th class="comp-num">Καταγραφή − αναμενόμενη</th></tr></thead><tbody>` +
    row("Τιμές admin", exp.byChannel, exp.total, diff) +
    (plat ? row("Τιμές καταλόγου πλατφορμών", plat.byChannel, plat.total, plat.diffVsRecorded) : "") +
    `<tr><td>Καταγραφή (χειρόγραφο)</td><td colspan="3" class="comp-sub">${salesEsc(rev.note || "")}</td><td class="comp-num"><strong>${salesEuro(rev.recorded)}</strong>${rev.confirmed === false ? ' <span class="comp-tag">προς επιβεβαίωση</span>' : ""}</td><td></td></tr>` +
    "</tbody></table>" + missing +
    `<p class="note">${salesEsc(exp.method || "")}${exp.priceSource ? " · " + salesEsc(exp.priceSource) : ""}${plat && plat.method ? "<br>Πλατφόρμες: " + salesEsc(plat.method) : ""}</p>` +
    ((exp.assumptions || []).length ? `<ul class="comp-sources">${exp.assumptions.map(a => `<li>${salesEsc(a)}</li>`).join("")}</ul>` : "");
}

/*-------------------
Purpose: Draw the multi-day summary over the loaded days: days, portions, channel share,
         recorded vs expected revenue and the top dishes.
On Input: none (reads salesState.days).
On Output: none.
Side effects: replaces the inner HTML of #salesSumKpis, #salesTop and #salesSumStamp.
---------------------*/
function renderSalesSummary() {
  const stamp = document.getElementById("salesSumStamp");
  if (!stamp) return;
  const dates = salesState.dates.slice().sort();
  const ch = { efood: 0, wolt: 0, takeaway: 0, all: 0 };
  let rec = 0, recDays = 0, exp = 0, expDays = 0;
  const dishes = {};
  dates.forEach(d => {
    const day = salesState.days[d];
    const t = salesChannelTotals(day);
    Object.keys(ch).forEach(c => { ch[c] += t[c]; });
    if (day.revenue && day.revenue.recorded != null) { rec += Number(day.revenue.recorded); recDays++; }
    if (day.expected && day.expected.total != null) { exp += Number(day.expected.total); expDays++; }
    salesItemsOf(day).forEach(it => {
      const id = it.key || "name:" + it.name;
      const o = dishes[id] || (dishes[id] = { name: it.name, key: it.key, efood: 0, wolt: 0, takeaway: 0, total: 0, days: 0 });
      SALES_CHANNELS.forEach(([c]) => { o[c] += it[c]; });
      o.total += it.total;
      o.days++;
    });
  });
  stamp.textContent = dates.length ? dates.length + (dates.length === 1 ? " ημέρα" : " ημέρες") + " · " + dates[0] + (dates.length > 1 ? " έως " + dates[dates.length - 1] : "") : "—";
  document.getElementById("salesSumKpis").innerHTML = [
    ["Ημέρες", String(dates.length), dates.length < 7 ? "λίγες ημέρες ακόμη για τάσεις" : "", ""],
    ["Μερίδες / ημέρα", dates.length ? (ch.all / dates.length).toFixed(1).replace(".", ",") : "–", ch.all + " συνολικά", ""],
    ["Μερίδιο καναλιών", salesPct(ch.takeaway, ch.all), "Takeaway · efood " + salesPct(ch.efood, ch.all) + " · Wolt " + salesPct(ch.wolt, ch.all), ""],
    ["Είσπραξη (καταγραφή)", salesEuro(rec), recDays + " ημέρες με είσπραξη", ""],
    ["Καταγραφή − αναμενόμενη", recDays && expDays ? salesSignedEuro(rec - exp) : "–", "αναμενόμενη " + salesEuro(exp), ""]
  ].map(k => `<div class="kpi ${k[3]}"><div class="label">${salesEsc(k[0])}</div><div class="value">${salesEsc(k[1])}</div><div class="sub">${salesEsc(k[2])}</div></div>`).join("");
  document.getElementById("salesShare").innerHTML = ch.all ? SALES_CHANNELS.map(([c, l]) =>
    `<span class="sales-share-${c}" style="width:${(ch[c] / ch.all * 100).toFixed(1)}%" title="${salesEsc(l)} ${salesPct(ch[c], ch.all)}">${salesEsc(l)} ${salesPct(ch[c], ch.all)}</span>`).join("") : "";
  const top = Object.values(dishes).sort((a, b) => b.total - a.total).slice(0, 10);
  document.getElementById("salesTop").innerHTML = top.map((o, i) =>
    `<tr><td>${i + 1}</td><td><strong>${salesEsc(o.name)}</strong><div class="comp-sub">${salesEsc(o.key || "χωρίς αντιστοίχιση")}</div></td>` +
    SALES_CHANNELS.map(([c]) => `<td class="comp-num">${o[c] || "–"}</td>`).join("") +
    `<td class="comp-num"><strong>${o.total}</strong></td><td class="comp-num">${o.days}</td><td class="comp-num">${salesPct(o.total, ch.all)}</td></tr>`).join("") ||
    '<tr><td colspan="8" class="note">Δεν υπάρχουν ακόμη καταγραφές.</td></tr>';
}

/*-------------------
Purpose: Fill the saved-days selector and the date picker from salesState.
On Input: none.
On Output: none.
---------------------*/
function fillSalesDates() {
  const sel = document.getElementById("salesSaved");
  const pick = document.getElementById("salesDate");
  if (!sel || !pick) return;
  sel.innerHTML = salesState.dates.map(d => `<option value="${salesEsc(d)}"${d === salesState.date ? " selected" : ""}>${salesEsc(d)}</option>`).join("") || '<option value="">—</option>';
  pick.value = salesState.date || "";
}

/*-------------------
Purpose: Load the saved sales days (last 120) from the Realtime Database and show the latest.
On Input: none.
On Output: Promise<void>.
Side effects: reads matzourana_sales/days (owner only, via getDb()); fills salesState and redraws
              the tab. Never writes. A read error only shows the empty state.
---------------------*/
async function loadSalesLog() {
  const db = (typeof getDb === "function") ? getDb() : null;
  if (!db) { renderSalesTab(); return; }
  try {
    const val = (await db.ref("matzourana_sales/days").orderByKey().limitToLast(120).once("value")).val() || {};
    showSalesDays(val);
  } catch (e) {
    console.warn("sales log not readable", e);
    salesState.days = {}; salesState.dates = [];
    renderSalesTab();
  }
}

/*-------------------
Purpose: Show sales days that are already in memory (used by loadSalesLog and by the local preview).
On Input: days - Object { "YYYY-MM-DD": day record }.
On Output: none.
---------------------*/
function showSalesDays(days) {
  salesState.days = days || {};
  salesState.dates = Object.keys(salesState.days).sort().reverse();
  if (!salesState.date || !salesState.days[salesState.date]) salesState.date = salesState.dates[0] || "";
  salesState.loaded = true;
  renderSalesTab();
}

/*-------------------
Purpose: Redraw the whole Πωλήσεις tab (selectors, selected day, summary).
On Input: none.
On Output: none.
---------------------*/
function renderSalesTab() {
  fillSalesDates();
  renderSalesDay();
  renderSalesSummary();
}

/*-------------------
Purpose: Connect the date picker, the saved-days selector and the prev/next buttons.
On Input: none.
On Output: none.
Side effects: adds event listeners to the controls of #tab-sales.
---------------------*/
function initSalesTab() {
  const pick = document.getElementById("salesDate");
  if (!pick) return;
  const go = d => { salesState.date = d || ""; renderSalesTab(); };
  pick.addEventListener("change", e => go(e.target.value));
  document.getElementById("salesSaved").addEventListener("change", e => go(e.target.value));
  document.querySelectorAll("#tab-sales [data-step]").forEach(b => b.addEventListener("click", () => {
    const asc = salesState.dates.slice().sort();
    const i = asc.indexOf(salesState.date);
    const j = i < 0 ? asc.length - 1 : i + Number(b.dataset.step);
    if (asc[j]) go(asc[j]);
  }));
  renderSalesTab();
}

document.addEventListener("DOMContentLoaded", initSalesTab);
