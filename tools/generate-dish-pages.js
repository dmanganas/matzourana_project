#!/usr/bin/env node
/*
 * Matzourana – per-dish SEO page generator
 * ----------------------------------------
 * Reads menuCatalog + dishImageMap from index.html and writes one small static,
 * crawlable page per dish:  piata/<slug>/index.html  (URL: https://www.matzourana.gr/piata/<slug>/)
 *
 * Usage:
 *   node tools/generate-dish-pages.js pastitsio            # one or more catalog keys
 *   node tools/generate-dish-pages.js --all                # every dish that has a description AND a photo
 *   node tools/generate-dish-pages.js --sitemap pastitsio  # also print <url> entries for sitemap.xml
 *
 * Re-run after price changes so the dish pages keep the same prices as the main menu.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://www.matzourana.gr/';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Extract a `const NAME = { ... };` object literal from index.html (brace matching, skipping strings/comments)
function extractObject(name) {
  const start = html.indexOf('const ' + name + ' =');
  if (start < 0) throw new Error(name + ' not found in index.html');
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

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clean = t => String(t || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
function split(t) { const c = clean(t); const m = c.match(/^(.*?)\s*\((.*)\)\s*$/); return m ? { name: m[1].trim(), desc: m[2].trim() } : { name: c, desc: '' }; }
const priceNum = p => { const m = String(p || '').replace(',', '.').match(/(\d+(?:\.\d+)?)/); return m ? Number(m[1]).toFixed(2) : null; };
function pngSize(file) {
  try { const b = fs.readFileSync(file); if (b.toString('ascii', 1, 4) === 'PNG') return [b.readUInt32BE(16), b.readUInt32BE(20)]; } catch (e) {}
  return null;
}
const slugOf = key => key.toLowerCase().replace(/_/g, '-');

function page(key, allKeys) {
  const d = menuCatalog[key];
  const img = dishImageMap[key];
  const el = split(d.el), en = split(d.en);
  const price = priceNum(d.price);
  const slug = slugOf(key);
  const url = SITE + 'piata/' + slug + '/';
  const imgUrl = img ? SITE + 'DishImages/' + img.file : SITE + 'MatzouranaImages/matzourana-girl-logo-800.jpg'; // fallback: Matzourana girl + logo
  const size = img ? pngSize(path.join(ROOT, 'DishImages', img.file)) : [800, 800];
  const imgAlt = (img ? img.alt.split('|')[0].trim() : el.name) + ' – Matzourana Καλλιθέα';
  const title = `${el.name} Καλλιθέα | Matzourana – Σπιτικό Μαγειρείο`;
  const desc = `${el.name}${el.desc ? ' (' + el.desc.charAt(0).toLowerCase() + el.desc.slice(1) + ')' : ''} από τη Ματζουράνα, Δημοσθένους 48, Καλλιθέα.` +
               `${price ? ' Τιμή €' + price.replace('.', ',') + '.' : ''} Delivery & τηλεφωνικές παραγγελίες 210 9577 846.`;

  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Restaurant', '@id': SITE + '#restaurant', name: 'Matzourana Eatery', url: SITE,
        telephone: '+302109577846', servesCuisine: 'Ελληνική',
        address: { '@type': 'PostalAddress', streetAddress: 'Δημοσθένους 48', addressLocality: 'Καλλιθέα', postalCode: '17671', addressCountry: 'GR' }
      },
      Object.assign({
        '@type': 'MenuItem', '@id': url + '#dish', name: el.name, alternateName: en.name,
        description: (el.desc ? el.desc + '. ' : '') + el.name + ' στην Καλλιθέα – Matzourana, Δημοσθένους 48.',
        image: imgUrl
      }, price ? { offers: { '@type': 'Offer', price, priceCurrency: 'EUR', seller: { '@id': SITE + '#restaurant' } } } : {}),
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Matzourana', item: SITE },
          { '@type': 'ListItem', position: 2, name: el.name, item: url }
        ]
      }
    ]
  };

  const others = allKeys.filter(k => k !== key).map(k =>
    `<li><a href="../${slugOf(k)}/">${esc(split(menuCatalog[k].el).name)}</a></li>`).join('\n          ');

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Matzourana Eatery">
  <meta property="og:locale" content="el_GR">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${imgUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Open+Sans:wght@400&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Open Sans', sans-serif; margin: 0; color: #333; background: linear-gradient(135deg, #f9f9f9 0%, #e8e1c8 100%); }
    header { background: hsl(120, 10%, 21%); color: #fff; text-align: center; padding: 14px; }
    header a { color: #fff; text-decoration: none; font-family: 'Montserrat', sans-serif; font-size: 1.3rem; }
    main { max-width: 760px; margin: 0 auto; padding: 20px 16px 40px; }
    h1 { font-family: 'Montserrat', sans-serif; color: #4A5D4A; font-size: 1.9rem; margin: 0.4em 0; }
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
  </style>
  <script type="application/ld+json">
${JSON.stringify(ld, null, 2)}
  </script>
</head>
<body>
  <header><a href="${SITE}">Matzourana Eatery – Μαγειρείο Καλλιθέα</a></header>
  <main>
    <h1>${esc(el.name)} στην Καλλιθέα</h1>
    <img class="dish-img" src="${imgUrl}" alt="${esc(imgAlt)}"${size ? ` width="${size[0]}" height="${size[1]}"` : ''}>
    ${el.desc ? `<p>${esc(el.desc)}.</p>` : ''}
    <p>Σπιτικό ${esc(el.name.toLowerCase())} από το μαγειρείο Ματζουράνα στην Καλλιθέα (${esc(CATEGORY[d.category] || 'Μαγειρευτά')}), μαγειρεμένο με φρέσκα, προσεκτικά επιλεγμένα υλικά.</p>
    <p class="en" lang="en">${esc(en.name)}${en.desc ? ' – ' + esc(en.desc) : ''}. Home-style Greek cooking at Matzourana Eatery, Kallithea.</p>
    ${price ? `<p class="price">€${price.replace('.', ',')}</p>` : ''}
    <p class="note">Το πιάτο σερβίρεται όταν υπάρχει στο μενού ημέρας. Δείτε το σημερινό μενού ή καλέστε μας.</p>
    <a class="cta" href="${SITE}">Δείτε το σημερινό μενού</a>
    <section class="info">
      <a class="brand-img" href="${SITE}">
        <picture>
          <source srcset="${SITE}MatzouranaImages/matzourana-girl-logo-800.webp" type="image/webp">
          <img src="${SITE}MatzouranaImages/matzourana-girl-logo-800.jpg" alt="Matzourana – μαγειρείο στην Καλλιθέα, Δημοσθένους 48" width="800" height="800" loading="lazy" decoding="async">
        </picture>
      </a>
      <div class="info-text">
        <h2>Matzourana Eatery – Καλλιθέα</h2>
        <p>Δημοσθένους 48, 176 71 Καλλιθέα<br>
           Τηλ.: <a href="tel:+302109577846">210 9577 846</a> · Κιν.: <a href="tel:+306971701113">697 1701 113</a><br>
           Διανομή: Τρίτη–Κυριακή 12:00–19:30 · Δευτέρα κλειστά</p>
      </div>
    </section>
    ${others ? `<section><h2>Άλλα πιάτα της Ματζουράνας</h2>\n        <ul>\n          ${others}\n        </ul>\n    </section>` : ''}
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
  const dir = path.join(ROOT, 'piata', slugOf(k));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(k, keys));
  console.log('wrote piata/' + slugOf(k) + '/index.html');
}
if (wantSitemap) {
  console.log('\n<!-- add to sitemap.xml -->');
  for (const k of keys) console.log(`<url>\n  <loc>${SITE}piata/${slugOf(k)}/</loc>\n  <lastmod>${today}</lastmod>\n  <priority>0.8</priority>\n</url>`);
}
