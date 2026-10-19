#!/usr/bin/env node
/*
 * Matzourana – per-dish SEO page generator
 * ----------------------------------------
 * Reads menuCatalog + dishImageMap from matzourana_data.js and writes one small static,
 * crawlable page per dish:  dishes/<slug>/index.html  (URL: https://www.matzourana.gr/dishes/<slug>/)
 *
 * Usage:
 *   node tools/generate-dish-pages.js pastitsio            # one or more catalog keys
 *   node tools/generate-dish-pages.js --all                # every dish that has a description AND a photo
 *   node tools/generate-dish-pages.js --sitemap pastitsio  # also print <url> entries for sitemap.xml
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
const ASSET_V = '20261019g'; // bust caches when assets/titles change
const html = fs.readFileSync(path.join(ROOT, DATA_FILE), 'utf8');

/*-------------------
Purpose: Extract a `const NAME = { ... };` object literal from matzourana_data.js
         (brace matching, skipping strings and comments).
On Input: name - String, the const identifier (e.g. "menuCatalog").
On Output: Object, the evaluated literal.
---------------------*/
function extractObject(name) {
  const start = html.indexOf('const ' + name + ' =');
  if (start < 0) throw new Error(name + ' not found in ' + DATA_FILE);
  let i = html.indexOf('{', start), depth = 0, q = null;
  const from = i;
  for (; i < html.length; i++) {
    const c = html[i], n = html[i + 1];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '/' && n === '/') { i = html.indexOf('\n', i); continue; }
    if (c === '/' && n === '*') { i = html.indexOf('*/', i) + 1; continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) break;
  }
  return vm.runInNewContext('(' + html.slice(from, i + 1) + ')');
}

const menuCatalog = extractObject('menuCatalog');
const dishImageMap = extractObject('dishImageMap');

const CATEGORY = {
  'freshly-cooked': 'Φρεσκομαγειρεμένα', 'meat-cooked': 'Πιάτα Κρεατικών', 'veg-cooked': 'Πιάτα Λαχανικών',
  'seafood': 'Πιάτα Θαλασσινών', 'soups': 'Σούπες', 'legumes': 'Όσπρια/Σούπες', 'sweets': 'Γλυκά'
};
const CATEGORY_EN = {
  'freshly-cooked': 'Freshly cooked', 'meat-cooked': 'Meat dishes', 'veg-cooked': 'Vegetable dishes',
  'seafood': 'Seafood', 'soups': 'Soups', 'legumes': 'Legumes / soups', 'sweets': 'Sweets'
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = t => String(t || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/*-------------------
Purpose: Split a bilingual catalog string "Name <br><br> (description)" into name + desc.
On Input: t - String from menuCatalog.el or .en.
On Output: { name: String, desc: String } (desc may be empty).
---------------------*/
function split(t) {
  const c = clean(t);
  const m = c.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? { name: m[1].trim(), desc: m[2].trim() } : { name: c, desc: '' };
}

const priceNum = p => { const m = String(p || '').replace(',', '.').match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]).toFixed(2) : null; };

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
  const n = Math.min(partsEl.length, partsEn.length, 6);
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
Purpose: Build the absolute image URLs (WebP + JPG fallback) for a dish photo.
On Input: imgFile - String relative path from dishImageMap.file (e.g. "web/greek-dish-4.webp").
On Output: { webp: String|null, jpg: String, filePath: String local path for sizing }.
---------------------*/
function dishImageUrls(imgFile) {
  if (!imgFile) {
    return {
      webpAbs: SITE + 'MatzouranaImages/matzourana-girl-logo-800.webp',
      jpgAbs: SITE + 'MatzouranaImages/matzourana-girl-logo-800.jpg',
      webp: '../../MatzouranaImages/matzourana-girl-logo-800.webp',
      jpg: '../../MatzouranaImages/matzourana-girl-logo-800.jpg',
      filePath: path.join(ROOT, 'MatzouranaImages/matzourana-girl-logo-800.jpg')
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
Purpose: Render one full static HTML dish page (bilingual EL/EN, JSON-LD, girl logo).
On Input: key - String catalog key; allKeys - String[] of keys being generated (related links).
On Output: String, the full HTML document.
---------------------*/
function page(key, allKeys) {
  const d = menuCatalog[key];
  const img = dishImageMap[key];
  const el = split(d.el), en = split(d.en);
  const price = priceNum(d.price);
  const slug = slugOf(key);
  const url = SITE + 'dishes/' + slug + '/';
  const urls = dishImageUrls(img ? img.file : null);
  const size = imageSize(urls.filePath) || [800, 800];
  const imgAlt = (img ? img.alt.split('|')[0].trim() : el.name) + ' – Matzourana Καλλιθέα';
  const catEl = CATEGORY[d.category] || 'Μαγειρευτά';
  const catEn = CATEGORY_EN[d.category] || 'Home-cooked';

  // Titles ~50–60 chars, descriptions ≤155
  const title = clipMeta(`${el.name} Καλλιθέα | Matzourana`, 60);
  const desc = clipMeta(
    `${el.name}${el.desc ? ' – ' + el.desc.charAt(0).toLowerCase() + el.desc.slice(1) : ''} delivery Καλλιθέα. Ματζουράνα, Δημοσθένους 48. 210 9577 846.` +
    (price ? ` Από €${price.replace('.', ',')}.` : ''),
    155
  );

  const ings = publicIngredients(el.desc, en.desc, d.category);
  const ingListEl = ings.el.map(i => `<li>${esc(i)}</li>`).join('\n          ');
  const ingListEn = ings.en.map(i => `<li>${esc(i)}</li>`).join('\n          ');

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Restaurant', '@id': SITE + '#restaurant', name: 'Matzourana Eatery', url: SITE,
        telephone: '+302109577846', servesCuisine: 'Ελληνική',
        address: { '@type': 'PostalAddress', streetAddress: 'Δημοσθένους 48', addressLocality: 'Καλλιθέα', postalCode: '17671', addressCountry: 'GR' },
        openingHoursSpecification: [
          { '@type': 'OpeningHoursSpecification', dayOfWeek: 'https://schema.org/Monday', opens: '00:00', closes: '00:00' },
          { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '12:00', closes: '19:30' }
        ]
      },
      Object.assign({
        '@type': 'MenuItem', '@id': url + '#dish', name: el.name, alternateName: en.name,
        description: (el.desc ? el.desc + '. ' : '') + el.name + ' delivery Καλλιθέα – Matzourana, Δημοσθένους 48.',
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
        mainEntity: [
          {
            '@type': 'Question',
            name: `Πότε σερβίρετε ${el.name};`,
            acceptedAnswer: { '@type': 'Answer', text: `Το ${el.name} σερβίρεται όταν υπάρχει στο μενού ημέρας. Δείτε το σημερινό μενού ή καλέστε στο 210 9577 846. Ωράριο διανομής Τρίτη–Κυριακή 12:00–19:30 · Δευτέρα κλειστά.` }
          },
          {
            '@type': 'Question',
            name: `Κάνετε delivery ${el.name} στην Καλλιθέα;`,
            acceptedAnswer: { '@type': 'Answer', text: `Ναι. Η Ματζουράνα κάνει delivery μαγειρευτών στην Καλλιθέα και την ευρύτερη περιοχή (Δημοσθένους 48). Παραγγελίες στο 210 9577 846 ή μέσω efood / Wolt.` }
          },
          {
            '@type': 'Question',
            name: 'Τι ώρα είστε ανοιχτά;',
            acceptedAnswer: { '@type': 'Answer', text: 'Τρίτη έως Κυριακή 12:00–19:30. Δευτέρα κλειστά.' }
          }
        ]
      }
    ]
  };

  const others = allKeys.filter(k => k !== key).map(k =>
    `<li><a href="../${slugOf(k)}/">${esc(split(menuCatalog[k].el).name)}</a></li>`).join('\n          ');

  const picture = urls.webp
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
    .en { color: #555; font-style: italic; }
    .info { background: #fffefd; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 1.4em; display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
    .info .info-text { flex: 1 1 260px; }
    .info .brand-img { flex: 0 1 300px; max-width: 100%; }
    .info .brand-img img { display: block; width: 100%; height: auto; border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
    @media (max-width: 600px) { .info .brand-img { flex-basis: 100%; } }
    .cta { display: inline-block; margin-top: 1.2em; background: #4A5D4A; color: #fff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; }
    a { color: #4A5D4A; }
    .ingredients, .faq, .areas { background: #fffefd; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); margin-top: 1.2em; }
    .ingredients ul, .faq ul, .areas ul { margin: 0.4em 0 0; padding-left: 1.2em; }
    .faq dt { font-weight: 700; margin-top: 0.8em; color: #4A5D4A; }
    .faq dd { margin: 0.25em 0 0 0; }
    .related a { display: inline-block; padding: 4px 0; min-height: 24px; }
  </style>
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>
  <header><a href="${SITE}">Matzourana Eatery – Μαγειρείο Καλλιθέα</a></header>
  <main>
    <h1>${esc(el.name)} delivery Καλλιθέα</h1>
    ${picture}
    ${el.desc ? `<p>${esc(el.desc)}.</p>` : ''}
    <p>Σπιτικό ${esc(el.name.toLowerCase())} από το μαγειρείο <strong>Ματζουράνα</strong> στην Καλλιθέα (${esc(catEl)}), μαγειρεμένο καθημερινά με φρέσκα, προσεκτικά επιλεγμένα υλικά. Ideal για <strong>${esc(el.name)} delivery Καλλιθέα</strong> – παραγγείλτε τηλεφωνικά ή μέσω efood / Wolt.</p>
    <p class="en" lang="en">${esc(en.name)}${en.desc ? ' – ' + esc(en.desc) : ''}. Home-style Greek ${esc(catEn).toLowerCase()} at Matzourana Eatery, Dimosthenous 48, Kallithea. Order for delivery across the wider Kallithea area.</p>
    ${price ? `<p class="price">€${price.replace('.', ',')}</p>` : ''}
    <p class="note">Το πιάτο σερβίρεται όταν υπάρχει στο μενού ημέρας. Δείτε το σημερινό μενού ή καλέστε μας.</p>
    <a class="cta" href="${SITE}matzourana_menu.html#daily-dishes">Δείτε το σημερινό μενού</a>

    <section class="ingredients" aria-labelledby="ing-title">
      <h2 id="ing-title">Υλικά <span class="en" lang="en">/ Ingredients</span></h2>
      <ul lang="el">
          ${ingListEl}
      </ul>
      <ul class="en" lang="en">
          ${ingListEn}
      </ul>
      <p class="note">Ενδεικτικά δημόσια υλικά από την περιγραφή του πιάτου. Για αλλεργιογόνα, ρωτήστε μας στο τηλέφωνο πριν την παραγγελία.</p>
    </section>

    <section class="areas" aria-labelledby="areas-title">
      <h2 id="areas-title">Delivery Καλλιθέα &amp; περιοχή</h2>
      <p>Διανομή μαγειρευτών στην <strong>Καλλιθέα</strong> και την ευρύτερη περιοχή. Διεύθυνση καταστήματος: Δημοσθένους 48, 176 71 Καλλιθέα.</p>
      <p class="en" lang="en">Delivery of home-cooked dishes across Kallithea and the wider area. Shop: Dimosthenous 48, 176 71 Kallithea.</p>
      <p>Ωράριο διανομής: <strong>Τρίτη–Κυριακή 12:00–19:30</strong> · <strong>Δευτέρα κλειστά</strong>.</p>
    </section>

    <section class="faq" aria-labelledby="faq-title">
      <h2 id="faq-title">Συχνές ερωτήσεις</h2>
      <dl>
        <dt>Πότε σερβίρετε ${esc(el.name)};</dt>
        <dd>Όταν υπάρχει στο μενού ημέρας. Καλέστε στο <a href="tel:+302109577846">210 9577 846</a> ή δείτε το <a href="${SITE}matzourana_menu.html#daily-dishes">σημερινό μενού</a>.</dd>
        <dt>Κάνετε delivery στην Καλλιθέα;</dt>
        <dd>Ναι – απευθείας από το μαγειρείο, και μέσω efood / Wolt. Ωράριο 12:00–19:30, Δευτέρα κλειστά.</dd>
        <dt lang="en">What are your opening hours?</dt>
        <dd lang="en">Tuesday–Sunday 12:00–19:30. Closed on Mondays.</dd>
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
    ${others ? `<section class="related"><h2>Άλλα πιάτα της Ματζουράνας</h2>\n        <ul>\n          ${others}\n        </ul>\n    </section>` : ''}
  </main>
</body>
</html>
`;
}

// ---- CLI ----
const args = process.argv.slice(2);
const wantSitemap = args.includes('--sitemap');
let keys = args.filter(a => !a.startsWith('--'));
if (args.includes('--all')) {
  keys = Object.keys(menuCatalog).filter(k => menuCatalog[k].el && /\(/.test(menuCatalog[k].el) && dishImageMap[k]);
}
if (!keys.length) { console.error('Give catalog keys (e.g. pastitsio) or --all'); process.exit(1); }
for (const k of keys) if (!menuCatalog[k] || !menuCatalog[k].el) { console.error('Unknown dish key: ' + k); process.exit(1); }

const today = new Date().toISOString().slice(0, 10);
for (const k of keys) {
  const dir = path.join(ROOT, 'dishes', slugOf(k));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(k, keys));
  console.log('wrote dishes/' + slugOf(k) + '/index.html');
}
if (wantSitemap) {
  console.log('\n<!-- add to sitemap.xml -->');
  for (const k of keys) console.log(`<url>\n  <loc>${SITE}dishes/${slugOf(k)}/</loc>\n  <lastmod>${today}</lastmod>\n  <priority>0.8</priority>\n</url>`);
}
