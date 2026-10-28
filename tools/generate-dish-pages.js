#!/usr/bin/env node
/*
 * Matzourana – per-dish SEO page generator
 * ----------------------------------------
 * Reads menuCatalog + dishImageMap from matzourana_data.js and writes one small static,
 * crawlable page per dish:  dishes/<slug>/index.html  (URL: https://www.matzourana.gr/dishes/<slug>/)
 * Also writes pages for the fixed menu tables (Ψητά της Ώρας, Σαλάτες, dips): the keys come
 * from fixedMenuDishPages (matzourana_data.js), name / description / price from the table rows
 * of matzourana_menu.html. With --all it also links those table rows to their pages and
 * rewrites the grouped "Τα πιάτα μας" list (between <!-- @dish-index --> markers) in
 * index.html and matzourana_menu.html.
 *
 * Usage:
 *   node tools/generate-dish-pages.js pastitsio            # one or more catalog keys
 *   node tools/generate-dish-pages.js --all                # every dish with a photo, plus dishPagesNoPhoto dishes
 *   node tools/generate-dish-pages.js --sitemap pastitsio  # also print <url> entries (with <image:image>) for sitemap.xml
 *   node tools/generate-dish-pages.js --all --sitemap      # also rewrite sitemap.xml: dish <url>s + Google image entries
 *
 * Re-run after price changes so the dish pages keep the same prices as the main menu.
 * Never reads admin/ recipes (costs, grams stay private). Public ingredient hints come
 * only from the dish's own public menuCatalog description text.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.matzourana.gr/';
const DATA_FILE = 'matzourana_data.js';
const ASSET_V = '20261028i'; // bust caches when assets/titles change
const html = fs.readFileSync(path.join(ROOT, DATA_FILE), 'utf8');

/*-------------------
Purpose: Extract a `const NAME = { ... };` object literal or `const NAME = [ ... ];` array
         literal from matzourana_data.js (bracket matching, skipping strings and comments).
On Input: name - String, the const identifier (e.g. "menuCatalog", "imageList").
On Output: Object | Array, the evaluated literal.
---------------------*/
function extractObject(name) {
  const start = html.indexOf('const ' + name + ' =');
  if (start < 0) throw new Error(name + ' not found in ' + DATA_FILE);
  const eq = html.indexOf('=', start);
  const ob = html.indexOf('{', eq), ab = html.indexOf('[', eq);
  let i = (ab >= 0 && (ob < 0 || ab < ob)) ? ab : ob, depth = 0, q = null;
  const open = html[i], close = open === '[' ? ']' : '}';
  const from = i;
  for (; i < html.length; i++) {
    const c = html[i], n = html[i + 1];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '/' && n === '/') { i = html.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = html.indexOf('*/', i) + 1; continue; }
    if (c === open) depth++;
    else if (c === close && --depth === 0) break;
  }
  return vm.runInNewContext('(' + html.slice(from, i + 1) + ')');
}

/*-------------------
Purpose: Read the public Firebase Realtime Database URL from matzourana_tools.js
         (firebaseConfig.databaseURL), so the dish-page view counter uses the same database
         as the rest of the site without a second copy of the config.
On Input: none (reads matzourana_tools.js).
On Output: String database URL without a trailing slash.
---------------------*/
function readDatabaseUrl() {
  const src = fs.readFileSync(path.join(ROOT, 'matzourana_tools.js'), 'utf8');
  const m = src.match(/databaseURL:\s*"([^"]+)"/);
  if (!m) throw new Error('databaseURL not found in matzourana_tools.js');
  return m[1].replace(/\/+$/, '');
}
const DB_URL = readDatabaseUrl();
const VIEWS_MIN_SHOWN = 10; // same as DISH_VIEWS_MIN_SHOWN in matzourana_tools.js
// Handwritten font for the number on Dimitris' notepad drawing. Mynerve has a Greek subset;
// &text= makes Google send only these glyphs (~20 KB woff2), and only once the card is shown.
const VIEWS_FONT_CSS = 'https://fonts.googleapis.com/css2?family=Mynerve&display=swap&text=' +
  encodeURIComponent('0123456789.προβολές');

/*-------------------
Purpose: The small inline script of a dish page that counts the view and shows
         "N προβολές" on the notepad card (public Firebase node matzourana_dish_views/<dishKey>).
On Input: key - String catalog key of the dish (also the Firebase child name).
On Output: String "<script>…</script>". In the page the script:
          - waits for window 'load' + idle time (never delays the first paint / LCP);
          - counts at most once per browser, per dish, per Athens day (localStorage
            'mz_views_<key>' = YYYY-MM-DD), only on www.matzourana.gr, never for bots
            (navigator.webdriver or a bot user agent), with an atomic server-side
            increment: PUT {".sv":{"increment":1}} (Firebase REST);
          - otherwise only reads the count (GET);
          - shows the #dish-views card (Dimitris' notepad drawing, the number written on its
            white page in Mynerve, loaded only then) only when the count is at least
            VIEWS_MIN_SHOWN.
          Any network / rules error leaves the line hidden; the page works without it.
---------------------*/
function viewsScript(key) {
  const cfg = JSON.stringify({ db: DB_URL, key, min: VIEWS_MIN_SHOWN, font: VIEWS_FONT_CSS });
  return `<script>
  (function (c) {
    var el = document.getElementById('dish-views');
    if (!el || !window.fetch) return;
    var url = c.db + '/matzourana_dish_views/' + c.key + '.json';
    var bot = navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|bingpreview|pagespeed|gtmetrix|pingdom/i.test(navigator.userAgent);
    var live = /(^|\\.)matzourana\\.gr$/.test(location.hostname);
    var day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Athens' });
    var seenKey = 'mz_views_' + c.key, seen = null;
    try { seen = localStorage.getItem(seenKey); } catch (e) {}
    var count = live && !bot && seen !== day;
    function show(n) {
      n = Number(n);
      if (!(n >= c.min)) return;
      if (!document.getElementById('mz-note-font')) {
        var f = document.createElement('link');
        f.id = 'mz-note-font'; f.rel = 'stylesheet'; f.href = c.font;
        document.head.appendChild(f);
      }
      var t = n.toLocaleString('el-GR'), num = el.querySelector('.vn-num');
      num.textContent = t;
      if (t.length > 5) num.className = 'vn-num vn-long';   // 10.000+ still fits on the page
      el.hidden = false;
    }
    function read() { return fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(show); }
    function run() {
      (count
        ? fetch(url, { method: 'PUT', body: '{".sv":{"increment":1}}', keepalive: true })
            .then(function (r) {
              if (!r.ok) return read();
              try { localStorage.setItem(seenKey, day); } catch (e) {}
              return r.json().then(show);
            })
        : read()
      ).catch(function () {});
    }
    function idle() { window.requestIdleCallback ? requestIdleCallback(run, { timeout: 3000 }) : setTimeout(run, 1200); }
    if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
  })(${cfg});
  </script>`;
}

const menuCatalog = extractObject('menuCatalog');
const dishImageMap = extractObject('dishImageMap');
const imageList = extractObject('imageList');

/*-------------------
Purpose: Read the optional dishPagesNoPhoto list (dish pages kept without a correct photo).
On Input: none (matzourana_data.js source already loaded in `html`).
On Output: String[] catalog keys; [] when the list is not defined in the data file.
---------------------*/
function readNoPhotoKeys() {
  return html.indexOf('const dishPagesNoPhoto =') >= 0 ? extractObject('dishPagesNoPhoto') : [];
}
const dishPagesNoPhoto = readNoPhotoKeys();

const CATEGORY = {
  'freshly-cooked': 'Φρεσκομαγειρεμένα', 'meat-cooked': 'Πιάτα Κρεατικών', 'veg-cooked': 'Πιάτα Λαχανικών',
  'seafood': 'Πιάτα Θαλασσινών', 'soups': 'Σούπες', 'legumes': 'Όσπρια/Σούπες', 'sweets': 'Γλυκά',
  'grill': 'Ψητά της Ώρας', 'salads': 'Σαλάτες', 'dips': 'Ορεκτικά'
};
const CATEGORY_EN = {
  'freshly-cooked': 'Freshly cooked', 'meat-cooked': 'Meat dishes', 'veg-cooked': 'Vegetable dishes',
  'seafood': 'Seafood', 'soups': 'Soups', 'legumes': 'Legumes / soups', 'sweets': 'Sweets',
  'grill': 'Grilled dishes', 'salads': 'Salads', 'dips': 'Appetizers'
};

/*-------------------
Purpose: Headings of the grouped dish links ("Άλλα πιάτα" on every dish page and the
         "Τα πιάτα μας" list on index.html / matzourana_menu.html), in display order.
         Labels as on the site (DAILY_CATEGORY_LABELS in matzourana_tools.js, menu buttons).
On Input: none (static table).
On Output: Array<{ cats: String[], el: String, en: String }>.
---------------------*/
const LINK_GROUPS = [
  { cats: ['meat-cooked'], el: 'Πιάτα Κρεατικών', en: 'Meat Dishes' },
  { cats: ['seafood'], el: 'Πιάτα Θαλασσινών', en: 'Seafood Dishes' },
  { cats: ['veg-cooked'], el: 'Πιάτα Λαχανικών', en: 'Vegetable Dishes' },
  { cats: ['legumes', 'soups'], el: 'Όσπρια & Σούπες', en: 'Legumes & Soups' },
  { cats: ['freshly-cooked'], el: 'Φρεσκομαγειρεμένα', en: 'Freshly Cooked Dishes' },
  { cats: ['sweets'], el: 'Γλυκά', en: 'Sweets' },
  { cats: ['grill'], el: 'Ψητά της Ώρας', en: 'Grilled Dishes' },
  { cats: ['salads', 'dips'], el: 'Σαλάτες & Dips', en: 'Salads & Dips' }
];

/*-------------------
Purpose: Per fixed-menu group: where the dish sits on the menu page and how the dish page
         says when it is served (always on the fixed menu, every opening day).
On Input: none (static table keyed by fixedMenuDishPages group).
On Output: Object { [group]: { hash, menuEl, menuEn, ctaEl } }.
---------------------*/
const FIXED_INFO = {
  grill:  { hash: 'grilled-dishes', menuEl: 'στα Ψητά της Ώρας', menuEn: 'Grilled Dishes', ctaEl: 'Δείτε τα Ψητά της Ώρας στο μενού' },
  salads: { hash: 'salads',         menuEl: 'στις Σαλάτες',      menuEn: 'Salads',         ctaEl: 'Δείτε τις Σαλάτες στο μενού' },
  dips:   { hash: 'appetizers',     menuEl: 'στα Ορεκτικά',      menuEn: 'Appetizers',     ctaEl: 'Δείτε τα Ορεκτικά στο μενού' }
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = t => String(t || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/*-------------------
Purpose: Split a bilingual catalog string "Name <br><br> (description)" into name + desc.
         When the string has a <br>, the name is the part before it, so names that contain
         their own parentheses (e.g. "Κατσικάκι (Νάξου) στο φούρνο") stay whole.
On Input: t - String from menuCatalog.el or .en.
On Output: { name: String, desc: String } (desc may be empty).
---------------------*/
function split(t) {
  const raw = String(t || '');
  const br = raw.search(/<br\s*\/?>/i);
  if (br >= 0) {
    const name = clean(raw.slice(0, br));
    const rest = clean(raw.slice(br));
    const m = rest.match(/^\((.*)\)$/);
    return { name, desc: (m ? m[1] : rest).trim() };
  }
  const c = clean(raw);
  const m = c.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { name: m[1].trim(), desc: m[2].trim() } : { name: c, desc: '' };
}

const priceNum = p => { const m = String(p || '').replace(',', '.').match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]).toFixed(2) : null; };

const MENU_FILE = path.join(ROOT, 'matzourana_menu.html');

/*-------------------
Purpose: Read the active (not commented out) rows of one fixed price table on the menu page.
On Input: tableId - String id of the .menu-content box (e.g. 'grilled-dishes', 'salads').
On Output: Array<{ el: String, en: String, price: String }> - the row's data-el / data-en
          (exact text, may contain "<br><br> (description)") and its price cell ("€9.50").
---------------------*/
function readMenuTableRows(tableId) {
  const src = fs.readFileSync(MENU_FILE, 'utf8');
  const start = src.indexOf('id="' + tableId + '"');
  if (start < 0) throw new Error('#' + tableId + ' not found in matzourana_menu.html');
  const box = src.slice(start, src.indexOf('</table>', start)).replace(/<!--[\s\S]*?-->/g, '');
  const rows = [];
  const re = /<tr>\s*<td((?:\s+[\w-]+="[^"]*")*)\s*>[\s\S]*?<\/td>\s*<td>([^<]*)<\/td>\s*<\/tr>/g;
  let m;
  while ((m = re.exec(box))) {
    const attr = n => ((m[1].match(new RegExp('\\s' + n + '="([^"]*)"')) || [])[1]);
    if (attr('data-el') != null) rows.push({ el: attr('data-el').trim(), en: (attr('data-en') || '').trim(), price: m[2].trim() });
  }
  return rows;
}

/*-------------------
Purpose: Build the catalog entries of the fixed-menu dish pages (grill, salads, dips):
         keys + photo from fixedMenuDishPages, name / description / price from the menu table row.
On Input: none (matzourana_data.js source + matzourana_menu.html).
On Output: Object { [key]: { category, el, en, price, fixed: true, table, pageEl, pageEn, photo } }.
          Exits with an error when a configured row is missing from its table (menu changed)
          or a key is also a menuCatalog key.
---------------------*/
function readFixedDishes() {
  if (html.indexOf('const fixedMenuDishPages =') < 0) return {};
  const conf = extractObject('fixedMenuDishPages');
  const cache = {}, out = {};
  for (const [key, c] of Object.entries(conf)) {
    if (menuCatalog[key]) { console.error('fixedMenuDishPages key is also a menuCatalog key: ' + key); process.exit(1); }
    const rows = cache[c.table] = cache[c.table] || readMenuTableRows(c.table);
    const row = rows.find(r => clean(r.el) === c.row || split(r.el).name === c.row);
    if (!row) { console.error('Row "' + c.row + '" not found in #' + c.table + ' of matzourana_menu.html (key ' + key + ')'); process.exit(1); }
    out[key] = { category: c.group, el: row.el, en: row.en, price: row.price, fixed: true, table: c.table,
      pageEl: c.pageEl || null, pageEn: c.pageEn || null, photo: c.photo || null };
  }
  return out;
}
const FIXED = readFixedDishes();
const DISHES = Object.assign({}, menuCatalog, FIXED);       // every key that can get a dish page
const photoOf = key => (FIXED[key] ? FIXED[key].photo : dishImageMap[key]) || null;

/*-------------------
Purpose: Name + description of a dish for its page (fixed-menu dishes may carry a clearer
         page title, e.g. "Σαλάτα Ματζουράνα" for the menu row "Ματζουράνα").
On Input: key - String DISHES key.
On Output: { el: { name, desc }, en: { name, desc } }.
---------------------*/
function dishNames(key) {
  const d = DISHES[key];
  const el = split(d.el), en = split(d.en);
  if (d.pageEl) el.name = d.pageEl;
  if (d.pageEn) en.name = d.pageEn;
  return { el, en };
}

/*-------------------
Purpose: Read PNG / JPEG / WebP pixel size from a local image file header / IHDR.
On Input: file - String absolute or relative path.
On Output: [width, height] or null when unknown.
---------------------*/
function imageSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)];
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length - 8) {
        if (b[i] !== 0xff) break;
        const marker = b[i + 1];
        const len = b.readUInt16BE(i + 2);
        if (marker === 0xc0 || marker === 0xc2) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
        i += 2 + len;
      }
    }
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      if (b.toString('ascii', 12, 16) === 'VP8 ') {
        return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
      }
      if (b.toString('ascii', 12, 16) === 'VP8L') {
        const bits = b.readUInt32LE(21);
        return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
      }
    }
  } catch (e) {}
  return null;
}

const slugOf = key => key.toLowerCase().replace(/_/g, '-');

/*-------------------
Purpose: Explicit per-dish data for the local-search FAQ "Πού θα φάω … στην Καλλιθέα;".
         q  = the natural Greek question phrase, already in the ACCUSATIVE with the adjective
              agreeing in gender/number (καλό μουσακά, καλή φασολάδα, καλά παπουτσάκια …).
              Written by hand on purpose: no automatic declension.
         review = RegExp of words that mean a customer review really mentions this dish
              (Greek + Latin spellings); used only to pick an exact quote, never to rewrite one.
         Keys without an entry simply get no "Πού θα φάω" FAQ (the generator warns).
On Input: none (static table, keyed by menuCatalog key).
On Output: Object { [catalogKey]: { q: String, review: RegExp } }.
---------------------*/
const DISH_FAQ = {
  katsikaki_naxou:                     { q: 'καλό κατσικάκι φούρνου',              review: /κατσικ|katsik|kid goat/i },
  pastitsio:                           { q: 'καλό παστίτσιο',                      review: /παστίτσ|παστιτσ|pastits|pastich/i },
  moussakas:                           { q: 'καλό μουσακά',                        review: /μουσακ|mousak|moussak/i },
  papoutsakia:                         { q: 'καλά παπουτσάκια',                    review: /παπουτσ|papouts/i },
  moschari_stifado:                    { q: 'καλό μοσχαράκι στιφάδο',              review: /μοσχ\S* στιφάδ|beef stifad/i },
  moschari_kokkinisto:                 { q: 'καλό μοσχάρι κοκκινιστό',             review: /κοκκινιστ|kokkinist/i },
  moschari_giouvesti:                  { q: 'καλό μοσχάρι γιουβέτσι',              review: /γιουβέτσ|γιουβετσ|giouvets|youvets|yiouvets/i },
  moschari_lemonato:                   { q: 'καλό μοσχαράκι λεμονάτο',             review: /μοσχ\S* λεμονάτ|lemony beef|beef lemonato/i },
  rolo_moscharisio:                    { q: 'καλό ρολό κιμά',                      review: /ρολό|rolo\b|meat ?loaf|beef roll/i },
  moscharaki_noua:                     { q: 'καλό μοσχαράκι νουά',                 review: /νουά|noua\b/i },
  moscharaki_noua_with_fried_potatoes: { q: 'καλό μοσχαράκι νουά με τηγανητές πατάτες', review: /νουά|noua\b/i },
  moscharaki_noua_with_rice:           { q: 'καλό μοσχαράκι νουά με ρύζι',         review: /νουά|noua\b/i },
  keftedakia_tiganita:                 { q: 'καλά κεφτεδάκια',                     review: /κεφτεδ|keftedak|keftede|meatballs/i },
  kotopoulo_bouti:                     { q: 'καλό κοτόπουλο φούρνου με πατάτες',    review: /κοτόπουλ|κοτοπουλ|kotopoul|chicken/i },
  choirines_brizoles:                  { q: 'καλές χοιρινές μπριζόλες',            review: /μπριζόλ|brizol|pork chop/i },
  kokoras_krasatos:                    { q: 'καλό κόκορα κρασάτο',                 review: /κόκορ|κοκορ|kokora|rooster/i },
  soutzoukakia:                        { q: 'καλά σουτζουκάκια σμυρνέικα',         review: /σουτζουκ|soutzouk|soutsouk|soudzouk/i },
  lachanontolmades:                    { q: 'καλούς λαχανοντολμάδες',              review: /λαχανοντολμ|lachanontolm|cabbage roll/i },
  kolokythakia_gemista:                { q: 'καλά κολοκυθάκια γεμιστά με κιμά',     review: /κολοκυθάκια γεμιστ|stuffed zucchini|stuffed courgette/i },
  briam:                               { q: 'καλό μπριάμ',                         review: /μπριάμ|μπριαμ|briam/i },
  giantes:                             { q: 'καλούς γίγαντες πλακί',               review: /γίγαντ|γιγαντ|gigant|giant beans/i },
  melitzanes_imam:                     { q: 'καλές μελιτζάνες ιμάμ',               review: /ιμάμ|ιμαμ|imam/i },
  gemista:                             { q: 'καλά γεμιστά',                        review: /(^|[^ά-ώα-ω])γεμιστά|gemista|yemista|stuffed (tomato|pepper|vegetable)/i },
  arakas_lemonatos:                    { q: 'καλό αρακά λεμονάτο',                 review: /αρακά|αρακα|arakas|\bpeas\b/i },
  bakaliaros_spetsiota:                { q: 'καλό μπακαλιάρο σπετσιώτα',           review: /μπακαλιάρ|μπακαλιαρ|bakaliar|\bcod\b/i },
  oktapodi_stifado:                    { q: 'καλό χταπόδι στιφάδο',                review: /χταπόδ|χταποδ|oktapod|octopus/i },
  kritharoto_garides:                  { q: 'καλό κριθαρότο με γαρίδες',           review: /κριθαρότ|κριθαροτ|kritharot|orzo/i },
  mydopilafo:                          { q: 'καλό μυδοπίλαφο',                     review: /μυδοπίλαφ|μυδοπιλαφ|mydopilaf|mussel/i },
  gavros_plaki:                        { q: 'καλό γαύρο πλακί',                    review: /γαύρ|γαυρ|gavro|anchov/i },
  ksifias_lemonatos:                   { q: 'καλό ξιφία λεμονάτο',                 review: /ξιφία|ξιφια|ksifia|xifia|swordfish/i },
  glossa_lemonati:                     { q: 'καλή γλώσσα λεμονάτη',                review: /γλώσσα λεμον|glossa|\bsole\b/i },
  giouvarlakia:                        { q: 'καλά γιουβαρλάκια',                   review: /γιουβαρλ|giouvarl|youvarl/i },
  fasolada:                            { q: 'καλή φασολάδα',                       review: /φασολάδ|φασολαδ|fasolad|bean soup/i },
  spanakorizo:                         { q: 'καλό σπανακόρυζο',                    review: /σπανακόρυζ|σπανακορυζ|spanakoriz|spinach rice/i },
  fasolakia:                           { q: 'καλά φρέσκα φασολάκια',               review: /φασολάκ|φασολακ|fasolak|green beans/i },
  kreatosoupa:                         { q: 'καλή κρεατόσουπα',                    review: /κρεατόσουπ|κρεατοσουπ|kreatosoup|meat soup|beef soup/i },
  kotosoupa:                           { q: 'καλή κοτόσουπα',                      review: /κοτόσουπ|κοτοσουπ|kotosoup|chicken soup/i },
  soupies_yiahni:                      { q: 'καλές σουπιές γιαχνί',                review: /σουπιές|σουπιες|soupies|cuttlefish/i },
  bifteki_moscharisia:                 { q: 'καλά μπιφτέκια φούρνου',              review: /μπιφτέκ|μπιφτεκ|bifteki|beef patt|burger/i },
  // fixed menu: Ψητά της Ώρας, Σαλάτες, dips
  fileto_kotopoulo:                    { q: 'καλό φιλέτο κοτόπουλο ψητό',          review: /φιλέτο κοτόπουλ|φιλετο κοτοπουλ|chicken fillet/i },
  bifteki_scharas:                     { q: 'καλό μπιφτέκι μοσχαρίσιο ψητό',       review: /μπιφτέκ|μπιφτεκ|bifteki|beef patt|burger/i },
  brizola_choirini:                    { q: 'καλή χοιρινή μπριζόλα ψητή',          review: /μπριζόλ|μπριζολ|brizol|pork chop/i },
  brizolakia_choirina:                 { q: 'καλά χοιρινά μπριζολάκια ψητά',       review: /μπριζολάκ|μπριζολακ|brizolak|pork chop/i },
  loukaniko_choriatiko:                { q: 'καλό χωριάτικο λουκάνικο',            review: /λουκάνικ|λουκανικ|loukanik|sausage/i },
  loukaniko_moscharisio:               { q: 'καλό μοσχαρίσιο λουκάνικο',           review: /λουκάνικ|λουκανικ|loukanik|sausage/i },
  salata_matzourana:                   { q: 'καλή σαλάτα Ματζουράνα',              review: /σαλάτα ματζουράν|matzourana salad/i },
  salata_chaloumi:                     { q: 'καλή σαλάτα με χαλούμι',              review: /σαλάτα (με )?χαλούμ|halloumi salad/i },
  ntakos:                              { q: 'καλό ντάκο',                          review: /ντάκο|ντακο|dakos/i },
  choriatiki:                          { q: 'καλή χωριάτικη σαλάτα',               review: /χωριάτικ|χωριατικ|choriatik|greek salad|village salad/i },
  salata_marouli:                      { q: 'καλή σαλάτα μαρούλι',                 review: /σαλάτα μαρούλ|μαρουλοσαλάτ|lettuce salad/i },
  salata_lachano_karoto:               { q: 'καλή σαλάτα λάχανο - καρότο',         review: /λάχανο|λαχανοσαλάτ|cabbage salad|coleslaw/i },
  chorta_epochis:                      { q: 'καλά χόρτα εποχής',                   review: /χόρτα|χορτα|horta|seasonal greens/i },
  tzatziki:                            { q: 'καλό τζατζίκι',                       review: /τζατζίκ|τζατζικ|tzatzik/i },
  fava_orektiko:                       { q: 'καλή φάβα',                           review: /φάβα|φαβα|\bfava\b/i }
};

/*-------------------
Purpose: Load the real customer reviews: exact text from reviewsData (matzourana_data.js) and
         the reviewer name / source exactly as shown on matzourana_reviews.html (matched by
         data-review index). A review is kept only when its original text is also the text
         shown on the reviews page, so nothing is paraphrased or invented.
On Input: none (reads matzourana_data.js source + matzourana_reviews.html).
On Output: Array<{ text: String, lang: String, name: String, sourceEl: String, sourceEn: String }>.
---------------------*/
function loadReviews() {
  if (html.indexOf('const reviewsData =') < 0) return [];
  const data = extractObject('reviewsData');
  const rvFile = path.join(ROOT, 'matzourana_reviews.html');
  const rv = fs.existsSync(rvFile) ? fs.readFileSync(rvFile, 'utf8') : '';
  const cards = rv.split('<figure class="rv-card">').slice(1);
  const strip = s => String(s || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  const out = [];
  cards.forEach(card => {
    const idx = (card.match(/<blockquote[^>]*data-review="(\d+)"/) || [])[1];
    const shown = strip((card.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/) || [])[1]);
    const name = strip((card.match(/<p class="rv-name">([\s\S]*?)<\/p>/) || [])[1]);
    const src = s => strip(((card.match(new RegExp(s + '="[^"]*?<span class=\'rv-src\'>([^<]*)<')) || [])[1]));
    const r = idx != null ? data.reviews[+idx] : null;
    if (!r || !name) return;
    const text = r.text[r.origLang];
    if (strip(text) !== shown) return;                 // must be the exact text shown publicly
    out.push({ text, lang: r.origLang, name, sourceEl: src('data-el'), sourceEn: src('data-en') });
  });
  return out;
}
const REVIEWS = loadReviews();

/*-------------------
Purpose: Find a real customer review that actually names this dish.
On Input: key - String catalog key.
On Output: { text, lang, name, sourceEl, sourceEn } of the first matching review, or null.
---------------------*/
function dishReview(key) {
  const f = DISH_FAQ[key];
  if (!f || !f.review) return null;
  return REVIEWS.find(r => f.review.test(r.text)) || null;
}

/*-------------------
Purpose: End a sentence fragment with a full stop unless it already ends with . ! ? or …
On Input: s - String.
On Output: String.
---------------------*/
const endSentence = s => /[.!?…]$/.test(s.trim()) ? s.trim() : s.trim() + '.';

/*-------------------
Purpose: Build the dish page FAQ once, so the visible <dl> and the FAQPage JSON-LD are
         rendered from the same question/answer text (they always match).
On Input: key - String catalog key; el, en - { name, desc } from split() / dishNames().
On Output: Array<{ q: String, a: String, lang: 'el'|'en' }> plain-text Q&A, in page order.
          Fixed-menu dishes (grill, salads, dips) say they are on the fixed menu every
          opening day instead of "when it is on the daily menu".
---------------------*/
function dishFaq(key, el, en) {
  const f = DISH_FAQ[key];
  const fx = FIXED[key] ? FIXED_INFO[FIXED[key].category] : null;
  const faq = [];
  if (f) {
    faq.push({
      lang: 'el',
      q: `Πού θα φάω ${f.q} στην Καλλιθέα;`,
      a: `Στη Matzourana Καλλιθέα (μαγειρείο Ματζουράνα), Δημοσθένους 48, 176 71 Καλλιθέα. ` +
         (el.desc ? `${el.name} – τι κάνει το πιάτο ξεχωριστό: ${endSentence(el.desc)} ` : '') +
         (fx ? `Είναι ${fx.menuEl} του σταθερού μας μενού, κάθε μέρα που είμαστε ανοιχτά: `
             : `Το πιάτο σερβίρεται όταν υπάρχει στο μενού ημέρας: `) +
         `απολαύστε το στο κατάστημα, πάρτε το σε πακέτο ` +
         `ή παραγγείλτε το με delivery απευθείας από το μαγειρείο ή μέσω efood / Wolt. ` +
         `Τηλέφωνο: 210 9577 846. Ωράριο: Τρίτη–Κυριακή 12:00–19:30, Δευτέρα κλειστά.`
    });
  }
  faq.push({
    lang: 'el',
    q: `Πότε σερβίρεται το πιάτο ${el.name};`,
    a: fx
      ? `Κάθε μέρα που είμαστε ανοιχτά: Τρίτη–Κυριακή 12:00–19:30 · Δευτέρα κλειστά. Είναι ${fx.menuEl} του σταθερού μας μενού. Δείτε όλο το μενού ή καλέστε στο 210 9577 846.`
      : `Όταν υπάρχει στο μενού ημέρας. Δείτε το σημερινό μενού ή καλέστε στο 210 9577 846. Τρίτη–Κυριακή 12:00–19:30 · Δευτέρα κλειστά.`,
    menuHash: fx ? fx.hash : null
  });
  faq.push({
    lang: 'el',
    q: 'Κάνετε delivery στην Καλλιθέα;',
    a: 'Ναι – απευθείας από το μαγειρείο στην Καλλιθέα και την ευρύτερη περιοχή, και μέσω efood / Wolt. Παραγγελίες στο 210 9577 846. Ωράριο 12:00–19:30, Δευτέρα κλειστά.'
  });
  faq.push({ lang: 'el', q: 'Τι ώρα είστε ανοιχτά;', a: 'Τρίτη έως Κυριακή 12:00–19:30. Δευτέρα κλειστά.' });
  if (f) {
    faq.push({
      lang: 'en',
      q: `Where can I eat good ${en.name} in Kallithea?`,
      a: `At Matzourana Eatery, Dimosthenous 48, 176 71 Kallithea. ` +
         (en.desc ? `What makes it special: ${endSentence(en.desc)} ` : '') +
         (fx ? `It is on our fixed menu (${fx.menuEn}) every opening day: `
             : `It is served when it is on the daily menu: `) +
         `eat in, take away, or order delivery directly from the kitchen or via efood / Wolt. ` +
         `Phone: +30 210 9577 846. Hours: Tuesday–Sunday 12:00–19:30, closed on Mondays.`
    });
  }
  faq.push({ lang: 'en', q: 'What are your opening hours?', a: 'Tuesday–Sunday 12:00–19:30. Closed on Mondays.' });
  return faq;
}

/*-------------------
Purpose: Render the FAQ Q&A list as visible HTML; phone numbers become tel: links and the
         words "σημερινό μενού" link to the daily menu ("όλο το μενού" to the dish's fixed menu
         table, when the entry has menuHash), without changing the visible text.
On Input: faq - Array from dishFaq().
On Output: String, <dt>/<dd> lines for the FAQ <dl>.
---------------------*/
function faqHtml(faq) {
  const link = s => esc(s)
    .replace(/(\+30 )?210 9577 846/g, m => `<a href="tel:+302109577846">${m}</a>`)
    .replace('σημερινό μενού', `<a href="${SITE}matzourana_menu.html#daily-dishes">σημερινό μενού</a>`);
  return faq.map(x => {
    const l = x.lang === 'en' ? ' lang="en"' : '';
    let a = link(x.a);
    if (x.menuHash) a = a.replace('όλο το μενού', `<a href="${SITE}matzourana_menu.html#${x.menuHash}">όλο το μενού</a>`);
    return `<dt${l}>${esc(x.q)}</dt>\n        <dd${l}>${a}</dd>`;
  }).join('\n        ');
}

/*-------------------
Purpose: Hand-written public ingredient lists for dishes whose menu description lists the
         serving options instead of the ingredients (taken from the dish's earlier public
         menu text and photo, never from admin recipes).
On Input: none (static table keyed by menuCatalog key).
On Output: Object { [key]: Array<[el, en]> }.
---------------------*/
const PUBLIC_INGREDIENTS = {
  soupies_yiahni: [['Φρέσκες σουπιές', 'Fresh cuttlefish'], ['Σάλτσα ντομάτας', 'Tomato sauce'], ['Πατάτες ή πλιγούρι/ρύζι', 'Potatoes or bulgur/rice']]
};

/*-------------------
Purpose: Build a public-safe ingredient list from the dish's own menu description
         (never from admin recipes / costs / grams).
On Input: descEl - String Greek description; descEn - String English description;
          category - String menuCatalog category.
On Output: { el: String[], en: String[] } short ingredient phrases (may be empty).
---------------------*/
function publicIngredients(descEl, descEn, category) {
  const el = [], en = [];
  const pushPairs = (pairs) => {
    pairs.forEach(([a, b]) => { if (!el.includes(a)) { el.push(a); en.push(b); } });
  };
  // Split description on common Greek/English separators into short phrases
  const partsEl = String(descEl || '').split(/,| και | με /i).map(s => s.trim()).filter(s => s.length > 2 && s.length < 60);
  const partsEn = String(descEn || '').split(/,| and | with /i).map(s => s.trim()).filter(s => s.length > 2 && s.length < 60);
  if (FIXED_INFO[category]) {
    // Fixed-menu dishes: the Greek and English lists are shown separately, so each keeps its
    // own phrases (the two descriptions do not always split into the same number of parts).
    const fine = (t, re, lead) => String(t || '').split(re).map(x => x.trim().replace(lead, '').trim())
      .filter(x => x.length > 2 && x.length < 60);
    fine(descEl, /,| και | κ’ | με /i, /^με\s+/i).slice(0, 6).forEach(p => el.push(p));
    fine(descEn, /,| and | with /i, /^with\s+/i).slice(0, 6).forEach(p => en.push(p));
  }
  const n = el.length ? 0 : Math.min(partsEl.length, partsEn.length, 6);
  for (let i = 0; i < n; i++) el.push(partsEl[i]), en.push(partsEn[i] || partsEl[i]);
  if (!el.length && partsEl.length) {
    partsEl.slice(0, 5).forEach((p, i) => { el.push(p); en.push(partsEn[i] || p); });
  }
  // Category fallbacks (generic, public)
  if (!el.length) {
    if (category === 'meat-cooked') pushPairs([['Φρέσκο κρέας', 'Fresh meat'], ['Αρωματικά μυρωδικά', 'Aromatic herbs'], ['Έξτρα παρθένο ελαιόλαδο', 'Extra-virgin olive oil']]);
    else if (category === 'veg-cooked' || category === 'legumes') pushPairs([['Φρέσκα λαχανικά', 'Fresh vegetables'], ['Έξτρα παρθένο ελαιόλαδο', 'Extra-virgin olive oil'], ['Αρωματικά μυρωδικά', 'Aromatic herbs']]);
    else if (category === 'seafood') pushPairs([['Φρέσκο ψάρι / θαλασσινά', 'Fresh fish / seafood'], ['Λεμόνι & ελαιόλαδο', 'Lemon & olive oil']]);
    else if (category === 'soups') pushPairs([['Ζωμός ημέρας', 'Day’s broth'], ['Φρέσκα υλικά', 'Fresh ingredients']]);
    else if (category === 'grill') pushPairs([['Φρέσκο κρέας', 'Fresh meat']]);
    else if (category === 'salads') pushPairs([['Φρέσκα λαχανικά', 'Fresh vegetables']]);
    else if (category === 'dips') pushPairs([['Φρέσκα υλικά', 'Fresh ingredients']]);
    else pushPairs([['Φρέσκα υλικά ημέρας', 'Fresh ingredients of the day'], ['Έξτρα παρθένο ελαιόλαδο', 'Extra-virgin olive oil']]);
  }
  return { el, en };
}

/*-------------------
Purpose: Shorten a meta description to about maxLen chars on a word boundary.
On Input: text - String; maxLen - Number (default 155).
On Output: String, trimmed and optionally ended with a full stop.
---------------------*/
function clipMeta(text, maxLen) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen - 1);
  const sp = cut.lastIndexOf(' ');
  return (sp > 60 ? cut.slice(0, sp) : cut).replace(/[ ,;:]+$/, '') + '…';
}

/*-------------------
Purpose: Keep as many whole words of a text as fit in maxLen chars, preferring to end at a
         comma (whole phrase), never ending inside a capitalised name ("Κρέατα [Αστακού]"),
         dropping a dangling joining word (και/με/and/with …) and trailing punctuation, without adding "…".
On Input: text - String (may start with " – "); maxLen - Number.
On Output: String (possibly ''), never longer than maxLen.
---------------------*/
function fitWords(text, maxLen) {
  let t = String(text || '').replace(/\s+/g, ' ').replace(/\s+$/, '');
  if (t.length > maxLen) {
    t = t.slice(0, Math.max(0, maxLen + 1));
    t = t.slice(0, Math.max(0, t.lastIndexOf(' ')));
    const comma = t.lastIndexOf(',');
    if (comma > 0 && comma >= t.length * 0.5) t = t.slice(0, comma);   // end on a whole phrase
    else t = t.replace(/(\s+[Α-ΩΆ-ΏA-Z]\S*)+$/, '');                    // don't end inside a proper name
    t = t.replace(/(\s+(και|με|σε|από|στη|στο|στην|του|της|τα|τη|το|η|ο|and|with|of|in|the|a))+$/i, '');
  }
  t = t.replace(/[\s,;:.!—–-]+$/, '');
  return /^\s*–?\s*$/.test(t) ? '' : t;
}

/*-------------------
Purpose: Build the absolute image URLs (WebP + JPG fallback) for a dish photo.
On Input: imgFile - String relative path from dishImageMap.file (e.g. "web/greek-dish-4.webp"),
          or null/'' for a dish page without a photo.
On Output: { webpAbs, jpgAbs, webp, jpg, filePath }. Without a photo: the site OG image
          (MatzouranaImages/matzourana-og-1200.jpg) for og:image / JSON-LD, webp = null.
---------------------*/
function dishImageUrls(imgFile) {
  if (!imgFile) {
    return {
      webpAbs: null,
      jpgAbs: SITE + 'MatzouranaImages/matzourana-og-1200.jpg',
      webp: null,
      jpg: '../../MatzouranaImages/matzourana-og-1200.jpg',
      filePath: path.join(ROOT, 'MatzouranaImages/matzourana-og-1200.jpg')
    };
  }
  const base = imgFile.replace(/\.webp$/i, '').replace(/\.jpg$/i, '').replace(/\.png$/i, '');
  const webpRel = base + '.webp';
  const jpgRel = base + '.jpg';
  const webpPath = path.join(ROOT, 'DishImages', webpRel);
  const jpgPath = path.join(ROOT, 'DishImages', jpgRel);
  const hasWebp = fs.existsSync(webpPath);
  const hasJpg = fs.existsSync(jpgPath);
  return {
    webpAbs: hasWebp ? SITE + 'DishImages/' + webpRel : null,
    jpgAbs: hasJpg ? SITE + 'DishImages/' + jpgRel : (SITE + 'DishImages/' + imgFile),
    webp: hasWebp ? '../../DishImages/' + webpRel : null,
    jpg: hasJpg ? '../../DishImages/' + jpgRel : ('../../DishImages/' + imgFile),
    filePath: hasJpg ? jpgPath : (hasWebp ? webpPath : path.join(ROOT, 'DishImages', imgFile))
  };
}

/*-------------------
Purpose: Group dish keys under the LINK_GROUPS headings (keys keep their given order;
         a category that no group names goes into a last "Άλλα πιάτα" group).
On Input: keys - String[] DISHES keys.
On Output: Array<{ el: String, en: String, keys: String[] }> non-empty groups, in display order.
---------------------*/
function groupKeys(keys) {
  const groups = LINK_GROUPS.map(g => ({ el: g.el, en: g.en, cats: g.cats, keys: [] }));
  const rest = { el: 'Άλλα πιάτα', en: 'More dishes', cats: [], keys: [] };
  keys.forEach(k => (groups.find(g => g.cats.includes(DISHES[k].category)) || rest).keys.push(k));
  return groups.concat([rest]).filter(g => g.keys.length);
}

/*-------------------
Purpose: Split the category groups, in their order, into n contiguous columns of about
         equal height (a group never splits), for the 3-column desktop layout.
On Input: groups - Object[] from groupKeys (each with .keys); n - Number of columns.
On Output: Array of n arrays of groups (some may be empty when there are few groups).
         Height of a group = its links + 2 (the heading); minimises the tallest column.
---------------------*/
function splitColumns(groups, n) {
  const h = groups.map(g => g.keys.length + 2);
  let best = null;
  const walk = (start, left, cols) => {
    if (left === 1) {
      const all = cols.concat([groups.slice(start)]);
      const tall = Math.max(...all.map(c => c.reduce((t, g) => t + h[groups.indexOf(g)], 0)));
      if (!best || tall < best.tall) best = { tall, all };
      return;
    }
    for (let end = start; end <= groups.length; end++) walk(end, left - 1, cols.concat([groups.slice(start, end)]));
  };
  walk(0, n, []);
  return best.all;
}

/*-------------------
Purpose: The grouped "Άλλα πιάτα της Ματζουράνας" links at the end of a dish page:
         one bilingual <h3> per category (e.g. "Πιάτα Θαλασσινών / Seafood Dishes") + its <ul>.
On Input: key - String current dish (left out); allKeys - String[] keys being generated.
On Output: String HTML ('' when there are no other dishes).
---------------------*/
function relatedHtml(key, allKeys) {
  const one = g =>
    `<div class="link-group">\n          <h3>${esc(g.el)} <span class="en" lang="en">/ ${esc(g.en)}</span></h3>\n          <ul>\n            ` +
    g.keys.map(k => `<li><a href="../${slugOf(k)}/">${esc(dishNames(k).el.name)}</a></li>`).join('\n            ') +
    `\n          </ul>\n        </div>`;
  const groups = groupKeys(allKeys.filter(k => k !== key));
  if (!groups.length) return '';
  const cols = splitColumns(groups, 3).filter(c => c.length)
    .map(c => `<div class="link-col">\n        ${c.map(one).join('\n        ')}\n        </div>`).join('\n        ');
  return `<div class="link-groups">\n        ${cols}\n        </div>`;
}

/*-------------------
Purpose: Render one full static HTML dish page (bilingual EL/EN, JSON-LD, girl logo), with
         the local-search FAQ ("Πού θα φάω … στην Καλλιθέα;") shown on the page and in the
         FAQPage JSON-LD from the same text, address + hours, and a real customer quote only
         when a review on the reviews page names the dish.
On Input: key - String catalog key; allKeys - String[] of keys being generated (related links).
On Output: String, the full HTML document. Dishes without a photo get no dish <img>
          (og:image / JSON-LD image fall back to the site OG image). Fixed-menu dishes (grill,
          salads, dips) never say "when it is on the daily menu"; their note and button point
          to their own menu table.
---------------------*/
function page(key, allKeys) {
  const d = DISHES[key];
  const img = photoOf(key);
  const fx = d.fixed ? FIXED_INFO[d.category] : null;
  const { el, en } = dishNames(key);
  if (fx && el.desc) el.desc = el.desc.charAt(0).toUpperCase() + el.desc.slice(1);
  if (fx && en.desc) en.desc = en.desc.charAt(0).toUpperCase() + en.desc.slice(1);
  const price = priceNum(d.price);
  const slug = slugOf(key);
  const url = SITE + 'dishes/' + slug + '/';
  const urls = dishImageUrls(img ? img.file : null);
  const size = imageSize(urls.filePath) || [800, 800];
  const imgAlt = (img ? img.alt.split('|')[0].trim().replace(/,?\s*Matzourana Καλλιθέα$/, '') : el.name) + ' – Matzourana Καλλιθέα';
  const catEl = CATEGORY[d.category] || 'Μαγειρευτά';
  const catEn = CATEGORY_EN[d.category] || 'Home-cooked';

  // Titles ~50–60 chars, descriptions ≤155
  // Prefer "<Πιάτο> στην Καλλιθέα | Matzourana"; very long names keep the shorter form.
  const titleFull = `${el.name} στην Καλλιθέα | Matzourana`;
  const title = titleFull.length <= 60 ? titleFull : clipMeta(`${el.name} Καλλιθέα | Matzourana`, 60);
  // "<Πιάτο> στην Καλλιθέα – <description>. Matzourana Καλλιθέα, address, phone, price": only the
  // description is shortened, so address, phone and price always stay in the meta description.
  const descTail = ` Matzourana Καλλιθέα, Δημοσθένους 48. 210 9577 846.` + (price ? ` Από €${price.replace('.', ',')}.` : '');
  const descHead = `${el.name} στην Καλλιθέα`;
  const descBody = el.desc ? ' – ' + el.desc.charAt(0).toLowerCase() + el.desc.slice(1) : '';
  const desc = clipMeta(descHead + fitWords(descBody, 155 - descHead.length - descTail.length - 1) + '.' + descTail, 155);

  const ings = PUBLIC_INGREDIENTS[key]
    ? { el: PUBLIC_INGREDIENTS[key].map(x => x[0]), en: PUBLIC_INGREDIENTS[key].map(x => x[1]) }
    : publicIngredients(el.desc, en.desc, d.category);
  const ingListEl = ings.el.map(i => `<li>${esc(i)}</li>`).join('\n          ');
  const ingListEn = ings.en.map(i => `<li>${esc(i)}</li>`).join('\n          ');

  const faq = dishFaq(key, el, en);
  const review = dishReview(key);

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Restaurant', '@id': SITE + '#restaurant', name: 'Matzourana Eatery', url: SITE,
        telephone: '+302109577846', servesCuisine: 'Ελληνική',
        address: { '@type': 'PostalAddress', streetAddress: 'Δημοσθένους 48', addressLocality: 'Καλλιθέα', addressRegion: 'Αττική', postalCode: '17671', addressCountry: 'GR' },
        geo: { '@type': 'GeoCoordinates', latitude: 37.95662, longitude: 23.71068 },
        areaServed: 'Καλλιθέα',
        openingHoursSpecification: [
          { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Monday', opens: '00:00', closes: '00:00' },
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => 'https://schema.org/' + d), opens: '12:00', closes: '19:30' }
        ]
      },
      Object.assign({
        '@type': 'MenuItem', '@id': url + '#dish', name: el.name, alternateName: en.name,
        description: (el.desc ? el.desc + '. ' : '') + el.name + ' Matzourana Καλλιθέα, Δημοσθένους 48.',
        image: urls.webpAbs || urls.jpgAbs
      }, price ? { offers: { '@type': 'Offer', price, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', seller: { '@id': SITE + '#restaurant' } } } : {}),
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Matzourana', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Μενού', item: SITE + 'matzourana_menu.html' },
          { '@type': 'ListItem', position: 3, name: el.name, item: url }
        ]
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(x => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } }))
      }
    ]
  };

  const others = relatedHtml(key, allKeys);

  const picture = !img ? ''
    : urls.webp
    ? `<picture>
      <source srcset="${urls.webp}" type="image/webp">
      <img class="dish-img" src="${urls.jpg}" alt="${esc(imgAlt)}" width="${size[0]}" height="${size[1]}" fetchpriority="high" decoding="async">
    </picture>`
    : `<img class="dish-img" src="${urls.jpg}" alt="${esc(imgAlt)}" width="${size[0]}" height="${size[1]}" fetchpriority="high" decoding="async">`;

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="${SITE}MatzouranaImages/icons/favicon-32.png">
  <link rel="apple-touch-icon" href="${SITE}apple-touch-icon.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Matzourana Eatery">
  <meta property="og:locale" content="el_GR">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${urls.jpgAbs}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Open Sans', sans-serif; margin: 0; color: #333; background: linear-gradient(135deg, #f9f9f9 0%, #e8e1c8 100%); }
    header { background: hsl(120, 10%, 21%); color: #fff; text-align: center; padding: 14px; }
    header a { color: #fff; text-decoration: none; font-family: 'Montserrat', sans-serif; font-size: 1.3rem; }
    main { max-width: 760px; margin: 0 auto; padding: 20px 16px 40px; }
    h1 { font-family: 'Montserrat', sans-serif; color: #4A5D4A; font-size: 1.9rem; margin: 0.4em 0; }
    h2 { font-family: 'Montserrat', sans-serif; color: #4A5D4A; font-size: 1.25rem; margin: 1.4em 0 0.5em; }
    .dish-img { width: 100%; height: auto; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
    .price { font-size: 1.4rem; font-weight: bold; color: #8B3A3A; margin: 0.6em 0 0.2em; }
    .note { font-size: 0.9rem; color: #666; margin-top: 0; }
    .views-note { position: relative; width: 176px; margin: 0.5em 0 0.8em; border-radius: 10px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.12); line-height: 1; }
    .views-note[hidden] { display: none; }
    .views-note img { display: block; width: 100%; height: auto; }
    .views-note .vn-text { position: absolute; left: 49%; right: 2%; top: 15%; bottom: 4%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #1f4d2b; font-family: 'Mynerve', 'Open Sans', cursive; text-align: center; transform: rotate(-3deg); }
    .views-note .vn-num { font-size: 30px; font-weight: 400; letter-spacing: 0.5px; }
    .views-note .vn-word { font-size: 15px; margin-top: 4px; }
    .views-note .vn-num.vn-long { font-size: 22px; }
    @media (max-width: 600px) { .views-note { width: 156px; } .views-note .vn-num { font-size: 27px; } .views-note .vn-word { font-size: 14px; } .views-note .vn-num.vn-long { font-size: 20px; } }
    .en { color: #555; font-style: italic; }
    .info { background: #fffefd; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 1.4em; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
    .info .info-text { flex: 1 1 260px; }
    .info .brand-img { flex: 0 1 300px; max-width: 100%; }
    .info .brand-img img { display: block; width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
    @media (max-width: 600px) { .info .brand-img { flex-basis: 100%; } }
    .cta { display: inline-block; margin-top: 1.2em; background: #4A5D4A; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    a { color: #4A5D4A; }
    .review { background: #fffefd; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 1.2em; }
    .review blockquote { margin: 0.4em 0; font-size: 1.1rem; font-style: italic; }
    .review-by { margin: 0; color: #555; }
    .ingredients, .faq, .areas { background: #fffefd; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 1.2em; }
    .ingredients ul, .faq ul, .areas ul { margin: 0.4em 0 0; padding-left: 1.2em; }
    .faq dt { font-weight: 700; margin-top: 0.8em; color: #4A5D4A; }
    .faq dd { margin: 0.25em 0 0 0; }
    .related a { display: inline-block; vertical-align: top; padding: 4px 0; min-height: 24px; }
    .related h3 { font-family: 'Montserrat', sans-serif; color: #4A5D4A; font-size: 1.05rem; margin: 1.1em 0 0.2em; }
    .related h3 .en { font-family: 'Open Sans', sans-serif; font-weight: 400; font-size: 0.95rem; }
    .related ul { margin: 0.2em 0 0; padding-left: 1.1em; }
    /* category groups in columns (3 desktop, 2 iPad / phone); a group never splits */
    /* desktop: 3 balanced column boxes (built by splitColumns); iPad / phone: the boxes dissolve
       (display: contents) and the groups flow in 2 CSS columns */
    .link-groups { display: flex; gap: 1.4em; align-items: flex-start; }
    .link-col { flex: 1 1 0; min-width: 0; }
    .link-group { break-inside: avoid; page-break-inside: avoid; display: inline-block; width: 100%; margin-bottom: 0.4em; }
    .link-group h3 { margin-top: 0.6em; }
    @media (max-width: 1023px) { .link-groups { display: block; columns: 2; column-gap: 1.4em; } .link-col { display: contents; } }
    @media (max-width: 600px) { .link-groups { column-gap: 1em; } .related h3 { font-size: 0.98rem; } .related h3 .en { display: block; font-size: 0.85rem; } .related li { font-size: 0.92rem; } }
  </style>
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>
  <header><a href="${SITE}">Matzourana Eatery – Μαγειρείο Καλλιθέα</a></header>
  <main>
    <h1>${esc(el.name)} στην Καλλιθέα – Matzourana</h1>
    ${picture}
    ${el.desc ? `<p>${esc(el.desc)}.</p>` : ''}
    <p>${esc(el.name)} από το μαγειρείο <strong>Ματζουράνα</strong> στην Καλλιθέα (${esc(catEl)}): ${fx ? 'από τον σταθερό κατάλογο του μενού μας, με φρέσκα, προσεκτικά επιλεγμένα υλικά' : 'σπιτικό φαγητό, μαγειρεμένο καθημερινά με φρέσκα, προσεκτικά επιλεγμένα υλικά'}. Αναζητάτε <strong>${esc(el.name)} Matzourana Καλλιθέα</strong>; Παραγγείλτε τηλεφωνικά ή μέσω efood / Wolt.</p>
    <p class="en" lang="en">${esc(en.name)}${en.desc ? ' – ' + esc(en.desc) : ''}. Home-style Greek ${esc(catEn).toLowerCase()} at Matzourana Eatery, Dimosthenous 48, Kallithea${fx ? ', on our fixed menu every opening day' : ''}. Order for delivery across the wider Kallithea area.</p>
    ${price ? `<p class="price">€${price.replace('.', ',')}</p>` : ''}
    <p class="views-note" id="dish-views" hidden><img src="../../Logos/dish/views-note.webp" alt="" width="360" height="256" decoding="async"><span class="vn-text"><span class="vn-num"></span> <span class="vn-word">προβολές</span></span></p>
${fx ? `    <p class="note">Είναι ${fx.menuEl} του σταθερού μας μενού, κάθε μέρα που είμαστε ανοιχτά (Τρίτη–Κυριακή 12:00–19:30). Για απορίες, καλέστε μας.</p>
    <a class="cta" href="${SITE}matzourana_menu.html#${fx.hash}">${fx.ctaEl}</a>` : `    <p class="note">Το πιάτο σερβίρεται όταν υπάρχει στο μενού ημέρας. Δείτε το σημερινό μενού ή καλέστε μας.</p>
    <a class="cta" href="${SITE}matzourana_menu.html#daily-dishes">Δείτε το σημερινό μενού</a>`}

    <section class="ingredients" aria-labelledby="ing-title">
      <h2 id="ing-title">Υλικά <span class="en" lang="en">/ Ingredients</span></h2>
      <ul lang="el">
          ${ingListEl}
      </ul>
      <ul class="en" lang="en">
          ${ingListEn}
      </ul>
      <p class="note">Ενδεικτικά δημόσια υλικά από την περιγραφή του πιάτου. Για ιδιαίτερες προτιμήσεις στον τρόπο ψησίματος ή διατροφικές συνήθειες που απαιτούν την προσοχή μας, ρωτήστε μας στο τηλέφωνο πριν την παραγγελία. Θα χαρούμε να σας εξυπηρετήσουμε!</p>
    </section>

    <section class="areas" aria-labelledby="areas-title">
      <h2 id="areas-title">Matzourana Καλλιθέα: διεύθυνση &amp; ωράριο</h2>
      <p>Διεύθυνση καταστήματος: <strong>Δημοσθένους 48, 176 71 Καλλιθέα</strong> · Τηλ.: <a href="tel:+302109577846">210 9577 846</a>. Διανομή μαγειρευτών στην <strong>Καλλιθέα</strong> και την ευρύτερη περιοχή.</p>
      <p class="en" lang="en">Delivery of home-cooked dishes across Kallithea and the wider area. Shop: Dimosthenous 48, 176 71 Kallithea.</p>
      <p>Ωράριο: <strong>Τρίτη–Κυριακή 12:00–19:30</strong> · <strong>Δευτέρα κλειστά</strong>.</p>
      <p class="en" lang="en">Hours: Tuesday–Sunday 12:00–19:30 · Closed on Mondays.</p>
    </section>
${review ? `
    <section class="review" aria-labelledby="review-title">
      <h2 id="review-title">Τι λένε οι πελάτες μας <span class="en" lang="en">/ What customers say</span></h2>
      <blockquote lang="${review.lang}">«${esc(review.text)}»</blockquote>
      <p class="review-by">– ${esc(review.name)}${review.sourceEl ? ', ' + esc(review.sourceEl) : ''} · <a href="${SITE}matzourana_reviews.html">Όλες οι κριτικές</a></p>
    </section>
` : ''}
    <section class="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">Συχνές ερωτήσεις</h2>
      <dl>
        ${faqHtml(faq)}
      </dl>
    </section>

    <section class="info">
      <a class="brand-img" href="${SITE}">
        <picture>
          <source srcset="../../MatzouranaImages/matzourana-girl-logo-800.webp" type="image/webp">
          <img src="../../MatzouranaImages/matzourana-girl-logo-800.jpg" alt="Matzourana – μαγειρείο στην Καλλιθέα, Δημοσθένους 48" width="800" height="800" loading="lazy" decoding="async">
        </picture>
      </a>
      <div class="info-text">
        <h2>Matzourana Eatery – Καλλιθέα</h2>
        <p>Δημοσθένους 48, 176 71 Καλλιθέα<br>
           Τηλ.: <a href="tel:+302109577846">210 9577 846</a> · Κιν.: <a href="tel:+306971701113">697 1701 113</a><br>
           Διανομή: Τρίτη–Κυριακή 12:00–19:30 · Δευτέρα κλειστά</p>
      </div>
    </section>
    ${others ? `<section class="related" aria-labelledby="related-title"><h2 id="related-title">Άλλα πιάτα της Ματζουράνας <span class="en" lang="en">/ More dishes</span></h2>\n        ${others}\n    </section>` : ''}
  </main>
  ${viewsScript(key)}
</body>
</html>
`;
}

/*-------------------
Purpose: Turn an absolute site URL (https://www.matzourana.gr/...) into its local file path,
         so the sitemap only lists images that really exist in the repo.
On Input: url - String absolute URL on SITE.
On Output: String local path, or null when the URL is not on SITE / the file is missing.
---------------------*/
function localFileOf(url) {
  if (!url || !url.startsWith(SITE)) return null;
  const p = path.join(ROOT, decodeURI(url.slice(SITE.length).split('?')[0]));
  return fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
}

/*-------------------
Purpose: Build the Google image-sitemap lines for a list of image URLs (existing files only).
On Input: urls - String[] absolute image URLs; skipped - String[] collector for missing ones.
On Output: String, zero or more "  <image:image>…</image:image>" lines joined by \n.
---------------------*/
function imageTags(urls, skipped) {
  const seen = new Set();
  return urls.filter(u => {
    if (seen.has(u)) return false;
    seen.add(u);
    if (!localFileOf(u)) { skipped.push(u); return false; }
    return true;
  }).map(u => `  <image:image><image:loc>${esc(u)}</image:loc></image:image>`).join('\n');
}

/*-------------------
Purpose: Render one sitemap <url> block for a dish page, with its og:image JPG as <image:image>.
On Input: key - String catalog key; lastmod - String YYYY-MM-DD; skipped - String[] collector.
On Output: String, the <url>…</url> block.
---------------------*/
function dishSitemapBlock(key, lastmod, skipped) {
  const img = photoOf(key);
  const imgs = img ? imageTags([dishImageUrls(img.file).jpgAbs], skipped) : '';
  return `<url>\n  <loc>${SITE}dishes/${slugOf(key)}/</loc>\n  <lastmod>${lastmod}</lastmod>\n  <priority>0.8</priority>` +
    (imgs ? '\n' + imgs : '') + `\n</url>`;
}

/*-------------------
Purpose: Rewrite sitemap.xml: keep the static page <url>s (and their lastmod), add the image
         namespace, add <image:image> entries for the home page (OG image) and the menu page
         (every imageList photo), and regenerate the dish-page <url>s with their photo.
On Input: keys - String[] dish catalog keys that have a dish page; today - String YYYY-MM-DD
          (lastmod for dish pages that are new to the sitemap).
On Output: { urls: Number, images: Number, skipped: String[] }. Side effect: writes sitemap.xml.
---------------------*/
function writeSitemap(keys, today) {
  const file = path.join(ROOT, 'sitemap.xml');
  let xml = fs.readFileSync(file, 'utf8').replace(/\s*<image:image>[\s\S]*?<\/image:image>/g, '');
  if (!/xmlns:image=/.test(xml)) {
    xml = xml.replace('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');
  }
  const blocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  const head = xml.slice(0, xml.indexOf('<url>'));
  const locOf = b => (b.match(/<loc>([^<]*)<\/loc>/) || [])[1] || '';
  const lastmodOf = b => (b.match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1];
  const skipped = [];
  const pageImages = {
    [SITE]: [SITE + 'MatzouranaImages/matzourana-og-1200.jpg'],
    [SITE + 'matzourana_menu.html']: imageList.map(f => SITE + f)
  };
  const dishPrefix = SITE + 'dishes/';
  const wanted = new Set(keys.map(k => dishPrefix + slugOf(k) + '/'));
  const out = [];
  for (const b of blocks) {
    const loc = locOf(b);
    if (wanted.has(loc)) continue;                       // regenerated below
    const imgs = pageImages[loc] ? imageTags(pageImages[loc], skipped) : '';
    out.push(imgs ? b.replace('</url>', imgs + '\n</url>') : b);
  }
  const prev = {};
  blocks.forEach(b => { prev[locOf(b)] = lastmodOf(b); });
  for (const k of keys) out.push(dishSitemapBlock(k, prev[dishPrefix + slugOf(k) + '/'] || today, skipped));
  const body = out.join('\n');
  fs.writeFileSync(file, head + body + '\n</urlset>\n');
  return { urls: out.length, images: (body.match(/<image:image>/g) || []).length, skipped };
}

/*-------------------
Purpose: Link every fixed-menu table row of matzourana_menu.html to its dish page.
         The <td> keeps data-el / data-en (buildMenuSchema in matzourana_tools.js reads them)
         but loses class "lang"; the class moves to the inner <a>, so the language switch
         swaps the link text and the link itself survives.
On Input: keys - String[] dish keys being generated (only FIXED keys are linked).
On Output: Number of rows changed. Side effect: rewrites matzourana_menu.html when needed.
          Idempotent: an already linked row is rewritten to the same text.
---------------------*/
function linkMenuRows(keys) {
  let src = fs.readFileSync(MENU_FILE, 'utf8'), changed = 0;
  for (const k of keys.filter(k => FIXED[k])) {
    const d = FIXED[k];
    const start = src.indexOf('id="' + d.table + '"'), end = src.indexOf('</table>', start);
    let box = src.slice(start, end);
    const re = /(<tr>\s*)<td((?:\s+[\w-]+="[^"]*")*)\s*>([\s\S]*?)<\/td>/g;
    box = box.replace(re, (all, tr, attrs, inner, off) => {
      const before = box.slice(0, off);
      if (before.lastIndexOf('<!--') > before.lastIndexOf('-->')) return all;   // commented-out row
      const a = n => ((attrs.match(new RegExp('\\s' + n + '="([^"]*)"')) || [])[1]);
      if (a('data-el') == null || a('data-el').trim() !== d.el) return all;
      const text = inner.replace(/^\s*<a(?:\s+[\w-]+="[^"]*")*\s*>([\s\S]*)<\/a>\s*$/, '$1');   // attribute values may hold <br>
      const out = `${tr}<td data-el="${a('data-el')}" data-en="${a('data-en')}"><a class="dish-page-link lang" href="/dishes/${slugOf(k)}/" data-el="${a('data-el')}" data-en="${a('data-en')}">${text}</a></td>`;
      if (out !== all) changed++;
      return out;
    });
    src = src.slice(0, start) + box + src.slice(end);
  }
  if (changed) fs.writeFileSync(MENU_FILE, src);
  return changed;
}

/*-------------------
Purpose: Rewrite the crawlable "Τα πιάτα μας (σελίδες)" list of a root page, grouped under the
         LINK_GROUPS headings, between <!-- @dish-index --> and <!-- @/dish-index -->.
         Link labels already in the list (short names, e.g. "Σουπιές γιαχνί") are kept;
         new pages get their page name.
On Input: file - String root page (index.html, matzourana_menu.html); keys - String[] dish keys.
On Output: { file, links: Number, dropped: String[] } (dropped = old links with no page).
          Side effect: rewrites the file when the list changed; no markers = nothing done.
---------------------*/
function writeDishIndex(file, keys) {
  const fp = path.join(ROOT, file);
  const src = fs.readFileSync(fp, 'utf8');
  const a = src.indexOf('<!-- @dish-index'), b = src.indexOf('<!-- @/dish-index -->');
  if (a < 0 || b < 0) return { file, links: 0, dropped: [], missing: true };
  const open = src.indexOf('-->', a) + 3;
  const old = src.slice(open, b);
  const labels = {};
  old.replace(/<a [^>]*href="\/dishes\/([^"\/]+)\/"[^>]*data-el="([^"]*)" data-en="([^"]*)"/g, (m, slug, e, n) => { labels[slug] = { el: e, en: n }; });
  const slugs = new Set(keys.map(slugOf));
  const dropped = Object.keys(labels).filter(sl => !slugs.has(sl));
  const ind = '          ';
  const one = g => {
    const items = g.keys.map(k => {
      const l = labels[slugOf(k)] || { el: esc(dishNames(k).el.name), en: esc(dishNames(k).en.name) };
      return `${ind}<li><a class="dish-page-link lang" href="/dishes/${slugOf(k)}/" data-el="${l.el}" data-en="${l.en}">${l.el}</a></li>`;
    }).join('\n');
    return `${ind}<div class="dish-index-group-box">\n` +
      `${ind}<h3 class="dish-index-group lang" data-el="${esc(g.el)}" data-en="${esc(g.en)}">${esc(g.el)}</h3>\n` +
      `${ind}<ul class="dish-index-list">\n${items}\n${ind}</ul>\n${ind}</div>`;
  };
  const body = splitColumns(groupKeys(keys), 3).filter(c => c.length)
    .map(c => `${ind}<div class="dish-index-col">\n${c.map(one).join('\n')}\n${ind}</div>`).join('\n');
  const next = src.slice(0, open) + '\n' + ind + '<div class="dish-index-groups">\n' + body + '\n' + ind + '</div>\n' + ind + src.slice(b);
  if (next !== src) fs.writeFileSync(fp, next);
  return { file, links: keys.length, dropped };
}

// ---- CLI ----
const args = process.argv.slice(2);
const wantSitemap = args.includes('--sitemap');
let keys = args.filter(a => !a.startsWith('--'));

/*-------------------
Purpose: Choose which catalog dishes get a dish page with --all.
On Input: none (menuCatalog, dishImageMap, dishPagesNoPhoto).
On Output: String[] keys, in menuCatalog order: every dish with a dishImageMap photo
          (even when its name has no "(description)", e.g. choirines_brizoles), plus the
          dishPagesNoPhoto keys that have a description; then every fixedMenuDishPages key
          (grill, salads, dips - with or without a photo).
---------------------*/
function selectDishPageKeys() {
  return Object.keys(menuCatalog).filter(k => menuCatalog[k].el &&
    (dishImageMap[k] || (dishPagesNoPhoto.includes(k) && /\(/.test(menuCatalog[k].el))))
    .concat(Object.keys(FIXED));
}
if (args.includes('--all')) keys = selectDishPageKeys();
const noFaq = keys.filter(k => !DISH_FAQ[k]);
if (noFaq.length) console.warn('No DISH_FAQ question phrase for: ' + noFaq.join(', '));
if (!keys.length) { console.error('Give catalog keys (e.g. pastitsio) or --all'); process.exit(1); }
for (const k of keys) if (!DISHES[k] || !DISHES[k].el) { console.error('Unknown dish key: ' + k); process.exit(1); }

const today = new Date().toISOString().slice(0, 10);
for (const k of keys) {
  const dir = path.join(ROOT, 'dishes', slugOf(k));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(k, keys));
  console.log('wrote dishes/' + slugOf(k) + '/index.html');
}
if (args.includes('--all')) {
  const n = linkMenuRows(keys);
  console.log(`matzourana_menu.html: ${n} fixed-menu row(s) linked/updated`);
  for (const f of ['index.html', 'matzourana_menu.html']) {
    const r = writeDishIndex(f, keys);
    console.log(r.missing ? `${f}: no <!-- @dish-index --> markers, list not touched`
      : `${f}: dish index ${r.links} links` + (r.dropped.length ? `, dropped (no page): ${r.dropped.join(', ')}` : ''));
  }
}
if (wantSitemap && args.includes('--all')) {
  const r = writeSitemap(keys, today);
  console.log(`wrote sitemap.xml: ${r.urls} urls, ${r.images} images` + (r.skipped.length ? `, skipped (missing): ${r.skipped.join(', ')}` : ''));
} else if (wantSitemap) {
  const skipped = [];
  console.log('\n<!-- add to sitemap.xml -->');
  for (const k of keys) console.log(dishSitemapBlock(k, today, skipped));
  if (skipped.length) console.log('<!-- skipped missing images: ' + skipped.join(', ') + ' -->');
}
