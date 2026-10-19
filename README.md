# Matzourana Eatery – Authentic Μαγειρευτά & Traditional Greek Cuisine in Kallithea

Welcome to **Matzourana Eatery**, your destination in Kallithea for **authentic μαγειρευτά**, **παραδοσιακές συνταγές**, and **home-style Greek cuisine**.

## 🍽 What We Offer
- Fresh **μαγειρευτά Καλλιθέα** daily
- **Παραδοσιακές συνταγές** with fresh ingredients
- **Μαγειρευτό delivery Καλλιθέα**
- Friendly service and Greek hospitality

## 📍 Location & Contact
**Address:** Dimosthenous 48, Kallithea, Athens, Greece  
**Tel:** 210 9577 846  

## 🕒 Opening Hours & Delivery
Daily Delivery: 12:00 - 19:30 (Tuesday–Sunday, closed on Mondays)  
**Closed on Mondays**

## 🚚 Delivery
We offer **food delivery in Kallithea** and nearby areas. Enjoy traditional Greek food at your home or office.

## 🌐 Visit Our Website
[www.matzourana.gr](https://www.matzourana.gr)

---

*Keywords:* μαγειρευτά Καλλιθέα, μαγειρεία Καλλιθέα, εστιατόριο Καλλιθέα, ελληνική κουζίνα, παραδοσιακές συνταγές, σπιτικά μαγειρευτά, μαγειρευτό delivery Καλλιθέα, Greek cuisine, traditional Greek food, home-style Greek food, food delivery Kallithea, Matzourana Eatery, Greek lunch Kallithea

## 🛠 Maintenance notes (website files)
- **Daily menu update:** edit only `matzourana_data.js` (the *DAILY UPDATE ZONE* at the top: `currentDailyMenu`, `currentHighlights`, and `menuCatalog` prices when they change), then run `node tools/generate-dish-pages.js --all --sitemap`.
- Shared styles: `matzourana_styles.css`.

### Shared header and footer (partials)

- The header (logo video, seasonal greeting slot, EL/EN, menu) and the footer
  (girl-with-logo picture, social links, ESPA logo, image lightbox) are edited
  only in `partials/header.html` and `partials/footer.html`.
- After an edit run `node tools/build-pages.js`; it stamps them into `index.html`
  and every `matzourana_*.html` between the `<!-- @header -->` / `<!-- @footer -->`
  markers. `node tools/build-pages.js --check` only reports (exit 1 if a page is
  out of date). `admin/` and `dishes/` are never touched.
- Seasonal greetings / holiday notices are not edited in HTML any more: see
  `matzourana_messages.js` (set `enabled: true` on an entry; preview with
  `?testDate=YYYY-MM-DD`).

### Gallery page

- The gallery lives in `matzourana_gallery.html` (not in `index.html` any more).
  The monthly "Refresh Matzourana gallery photo links" routine must edit the
  Google Maps `<img ... data-maps-url>` tiles in `matzourana_gallery.html`.
  Broken tiles hide themselves (`onerror`); old `/#gallery` links redirect here.

### Pages (after the page split)

| Page | File |
|---|---|
| Home (hub: welcome, delivery, today's highlights, rating) | `index.html` |
| Menu (price lists, daily dishes, dish videos) | `matzourana_menu.html` (`#daily-dishes` opens that tab) |
| Gallery | `matzourana_gallery.html` |
| Reviews | `matzourana_reviews.html` |
| About | `matzourana_about.html` |
| Contact & hours | `matzourana_contact.html` |

- Shared code: `matzourana_styles.css`, `matzourana_data.js` (daily update zone),
  `matzourana_messages.js` (seasonal messages), `matzourana_utils.js`, `matzourana_tools.js`.
  Bump the `?v=` number in the pages when one of them changes.
- Old one-page links (`/#menu`, `/#gallery`, `/#reviews`, `/#about`, `/#contact`)
  redirect to the matching page.
- `sitemap.xml` lists the 6 pages and the dish pages; `tools/generate-dish-pages.js
  --sitemap` only prints dish entries to paste, it does not rewrite the file.

