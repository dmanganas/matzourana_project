/* ============================================================
   matzourana_tools.js – page features of the Matzourana website
   ------------------------------------------------------------
   Load order (all with defer): matzourana_data.js → matzourana_messages.js →
   matzourana_utils.js → matzourana_tools.js.
   initPage() starts on DOMContentLoaded and reads <body data-page="...">
   (home | menu | gallery | reviews | about | contact). Every feature checks that its
   elements exist, so a page only runs what it has.
   ============================================================ */

// ===== FIREBASE (public config by design; the database rules protect the data) =====
const firebaseConfig = {
    apiKey: "AIzaSyCQym9rOl6nX4kD_vs0dR3LyxsrD_aQfKA",
    authDomain: "matzouranaeatery-ratings.firebaseapp.com",
    databaseURL: "https://matzouranaeatery-ratings-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "matzouranaeatery-ratings",
    storageBucket: "matzouranaeatery-ratings.firebasestorage.app",
    messagingSenderId: "396072691292",
    appId: "1:396072691292:web:39c93ba4db33ff5991e899"
};

// ===== RUNTIME STATE =====
let isPlaying = false;          // background music (music panel is off: load_music_menu = false)
let zoomableImages = [];        // images the lightbox can step through
let currentImageIndex = -1;     // position of the open image in zoomableImages
let touchStartX = 0;            // lightbox swipe start
let touchEndX = 0;              // lightbox swipe end

// Labels of the daily-dish categories (daily table + Menu JSON-LD)
const DAILY_CATEGORY_LABELS = {
    "freshly-cooked": { el: "Φρεσκομαγειρεμένα", en: "Freshly Cooked Dishes" },
    "meat-cooked":    { el: "Πιάτα Κρεατικών", en: "Meat Dishes" },
    "veg-cooked":     { el: "Πιάτα Λαχανικών", en: "Vegetable Dishes" },
    "seafood":        { el: "Πιάτα Θαλασσινών", en: "Seafood Dishes" },
    "soups":          { el: "Σούπες", en: "Soups" },
    "legumes":        { el: "Όσπρια/Σούπες", en: "Legumes/Soups" },
    "sweets":         { el: "Γλυκά", en: "Sweets" }
};

/*-------------------
Purpose: Tell whether this page runs on the real website (www.matzourana.gr).
On Input: none (reads location.hostname).
On Output: Boolean - false on local previews (127.0.0.1, localhost, file://).
Used by: publishDailyMenuToFirebase, so previews and tests never write to Firebase.
---------------------*/
function isLiveSite() {
    return /(^|\.)matzourana\.gr$/.test(location.hostname);
}

// ===== LIGHTBOX =====

/*-------------------
Purpose: Collect the images the lightbox can step through with next/prev.
On Input: none. Uses <body data-page>: on the gallery page only gallery photos,
          on the menu page only the visible menu photos.
On Output: none.
Side effects: fills the global zoomableImages array. Hidden or broken gallery tiles
          are skipped. Called on every zoom open, so the list is always fresh
          (showMenu re-shuffles the menu photos).
---------------------*/
function collectZoomableImages() {
    const page = document.body.dataset.page || '';
    const gallerySection = document.querySelector('#gallery');
    const galleryMode = gallerySection && (page === 'gallery' || gallerySection.classList.contains('active'));

    if (galleryMode) {
        zoomableImages = Array.from(gallerySection.querySelectorAll('img[onclick*="zoomImage"]'))
            .filter(img => img.style.display !== 'none' && !(img.complete && img.naturalWidth === 0));
    } else if (document.querySelector('.menu .image-panel')) {
        zoomableImages = Array.from(document.querySelectorAll('.image-panel img[onclick*="zoomImage"][style*="display: block"]'));
    } else {
        zoomableImages = Array.from(document.querySelectorAll('img[onclick*="zoomImage"]:not([style*="display: none"])'));
    }
}

/*-------------------
Purpose: Build the lightbox caption from an image alt text "Greek | English".
On Input: altText - String (may be empty); lang - 'el' | 'en'.
On Output: String of HTML: the dish name in bold, the description in brackets,
           "Matzourana Eatery Καλλιθέα/Kallithea" on its own line.
---------------------*/
function buildZoomCaption(altText, lang) {
    let displayText;
    if (altText && altText.includes('|')) {
        const parts = altText.split('|').map(part => part.trim());
        displayText = lang === 'el' ? parts[0] : parts[1];
    } else {
        displayText = lang === 'el'
            ? (altText || "Φωτό Matzourana Eatery Καλλιθέα")
            : (altText || "Photo Matzourana Eatery Kallithea");
    }
    // Line break before brand/location
    displayText = lang === 'el'
        ? displayText.replace(/Matzourana Eatery Καλλιθέα/g, '\nMatzourana Eatery Καλλιθέα')
        : displayText.replace(/Matzourana Eatery Kallithea/g, '\nMatzourana Eatery Kallithea');
    // "Name - (description)" → "Name\n(description)"
    displayText = displayText.replace(/ - /g, '\n');
    // Bold text before '(', regular inside the brackets
    displayText = displayText.replace(/([^()]+)(?=\()/g, '<strong>$1</strong>');
    return displayText;
}

/*-------------------
Purpose: Open the full-screen lightbox with an enlarged menu or gallery photo,
         with caption, next/prev navigation and, for Google Maps album photos,
         a link to the photo on Google Maps.
On Input: src - String, image path or URL (e.g. 'DishImages/greek-dish-3.png');
          altText - String, "Greek | English" alt text (optional).
On Output: none.
Side effects: shows .zoom-overlay; sets #zoomed-image, #caption-current, #zoom-maps-link;
          updates currentImageIndex. Keyboard (arrows, Esc) and swipe: initLightboxControls.
Notes: The zoomed image keeps the descriptive alt text of the thumbnail (SEO / a11y).
---------------------*/
function zoomImage(src, altText) {
    playButtonSound();
    collectZoomableImages();

    const overlay = document.querySelector('.zoom-overlay');
    const zoomedImage = document.querySelector('#zoomed-image');
    const captionCurrent = document.getElementById('caption-current');
    if (!overlay || !zoomedImage) return;

    currentImageIndex = zoomableImages.findIndex(img => img.src.includes(src));
    if (currentImageIndex === -1) currentImageIndex = 0;

    zoomedImage.src = src;
    zoomedImage.alt = altText || "Μεγενθυμένη φωτογραφία πιάτου από το Matzourana Eatery Καλλιθέα";
    if (captionCurrent) captionCurrent.innerHTML = buildZoomCaption(altText, getLang());

    const mapsLink = document.getElementById('zoom-maps-link');
    if (mapsLink) {
        const cur = zoomableImages[currentImageIndex];
        const mapsUrl = cur && cur.dataset ? cur.dataset.mapsUrl : '';
        if (mapsUrl && cur.src.includes(src)) {
            mapsLink.href = mapsUrl;
            mapsLink.textContent = getLang() === 'el' ? 'Δείτε τη φωτογραφία στο Google Maps ↗' : 'View this photo on Google Maps ↗';
            mapsLink.hidden = false;
        } else {
            mapsLink.hidden = true;
        }
    }

    overlay.style.display = 'flex';
    setTimeout(() => zoomedImage.classList.add('zoomed'), 50);
}

/*-------------------
Purpose: Close the lightbox.
On Input: none. On Output: none.
Side effects: hides .zoom-overlay and clears the caption.
---------------------*/
function closeZoom() {
    playButtonSound();
    const overlay = document.querySelector('.zoom-overlay');
    const zoomedImage = document.querySelector('#zoomed-image');
    const captionCurrent = document.getElementById('caption-current');
    if (zoomedImage) zoomedImage.classList.remove('zoomed');
    if (captionCurrent) captionCurrent.textContent = '';
    if (overlay) overlay.style.display = 'none';
}

/*-------------------
Purpose: Show the next image in the open lightbox.
On Input: none. On Output: none (calls zoomImage with the next image).
---------------------*/
function nextImage() {
    if (currentImageIndex < zoomableImages.length - 1) {
        currentImageIndex++;
        const nextImg = zoomableImages[currentImageIndex];
        zoomImage(nextImg.src, nextImg.alt);
    }
}

/*-------------------
Purpose: Show the previous image in the open lightbox.
On Input: none. On Output: none (calls zoomImage with the previous image).
---------------------*/
function prevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        const prevImg = zoomableImages[currentImageIndex];
        zoomImage(prevImg.src, prevImg.alt);
    }
}

/*-------------------
Purpose: Turn a finished swipe on the lightbox into next/prev.
On Input: none (uses touchStartX / touchEndX).
On Output: none. Swipe right → previous, swipe left → next (minimum 50 px).
---------------------*/
function handleGesture() {
    const diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) prevImage(); else nextImage();
    }
}

/*-------------------
Purpose: Keyboard and touch control of the lightbox: arrows step, Esc closes, swipe steps.
On Input: none. On Output: none.
Side effects: adds ONE keydown listener (the old page had two, so one arrow press
          could move two images) and the touch listeners on .zoom-overlay.
---------------------*/
function initLightboxControls() {
    const overlay = document.querySelector('.zoom-overlay');
    if (!overlay) return;
    document.addEventListener('keydown', (e) => {
        if (overlay.style.display === 'flex') {
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') closeZoom();
        }
    });
    overlay.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, false);
    overlay.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleGesture(); }, false);
}

/*-------------------
Purpose: Re-write the caption of an open lightbox when the language changes.
On Input: none (reads the alt text of #zoomed-image).
On Output: none.
Used by: the 'languageChange' event.
---------------------*/
function updateZoomCaption() {
    const overlay = document.querySelector('.zoom-overlay');
    const zoomedImage = document.querySelector('#zoomed-image');
    const captionCurrent = document.getElementById('caption-current');
    if (overlay && overlay.style.display === 'flex' && zoomedImage && captionCurrent && zoomedImage.alt) {
        captionCurrent.innerHTML = buildZoomCaption(zoomedImage.alt, getLang());
    }
}

// ===== MENU =====

/*-------------------
Purpose: Switch the active menu tab (Appetizers, Salads, Potatoes, Daily Dishes,
         Grilled) and refresh the dish photos next to it.
On Input: menuId - String, id of the tab content ('appetizers', 'salads', 'potatoes',
          'daily-dishes', 'grilled-dishes', 'soft-drinks', 'beers', 'wines');
          silent - Boolean (optional): true = no click sound (page start).
On Output: none.
Side effects: sets .active on the tab content and its button; shows up to 24 photos
          (even number, at least 10): photos of today's daily dishes first, the rest
          shuffled. Keeps the rich bilingual alt texts (dishAlts) for SEO.
          Data: imageList, dishAlts, dishImageMap, currentDailyMenu (matzourana_data.js).
---------------------*/
function showMenu(menuId, silent) {
    if (!silent) playButtonSound();
    const selectedContent = document.querySelector(`#${menuId}`);
    if (!selectedContent) return;

    document.querySelectorAll('.menu-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.menu-buttons button').forEach(button => button.classList.remove('active'));
    selectedContent.classList.add('active');
    const selectedButton = document.querySelector(`button[onclick="showMenu('${menuId}')"]`);
    if (selectedButton) selectedButton.classList.add('active');

    // Count the dish rows (not header rows) to decide how many photos to show
    let menuItemCount = 0;
    selectedContent.querySelectorAll('table tr').forEach(row => { if (!row.querySelector('th')) menuItemCount++; });
    let numImagesToShow = Math.min(menuItemCount, 24);
    numImagesToShow = Math.floor(numImagesToShow / 2) * 2;
    if (numImagesToShow < 6) numImagesToShow = 10;

    // Photos of today's daily dishes first, then the rest at random
    const prioritizedImages = [];
    let remainingImages = [...imageList];
    currentDailyMenu.forEach(key => {
        const imgInfo = dishImageMap[key];
        if (imgInfo) {
            const fullPath = `DishImages/${imgInfo.file}`;
            if (imageList.includes(fullPath)) {
                prioritizedImages.push(fullPath);
                remainingImages = remainingImages.filter(img => img !== fullPath);
            }
        }
    });
    const shuffledRemaining = remainingImages.sort(() => Math.random() - 0.5);
    const finalImageList = [...prioritizedImages, ...shuffledRemaining].slice(0, numImagesToShow);

    document.querySelectorAll('.menu .image-panel img').forEach((imgElement, index) => {
        if (index < numImagesToShow) {
            const imageName = finalImageList[index];
            const alt = dishAlts[imageName] || "Πιάτο από το Matzourana Eatery Καλλιθέα";
            imgElement.src = imageName;
            imgElement.alt = alt;
            imgElement.setAttribute('onclick', `zoomImage('${imageName}', '${alt.replace(/'/g, "\\'")}')`);
            imgElement.style.display = 'block';
        } else {
            imgElement.style.display = 'none';
        }
    });
    collectZoomableImages();
}


/*-------------------
Purpose: Build the public URL path of a dish SEO page from its catalog key.
On Input: key - String, a menuCatalog / dishImageMap key (e.g. "pastitsio").
On Output: String path "/dishes/<slug>/" (underscores become hyphens), or "" when key is empty.
---------------------*/
function dishPagePath(key) {
    if (!key) return '';
    return '/dishes/' + String(key).toLowerCase().replace(/_/g, '-') + '/';
}

/*-------------------
Purpose: Tell whether a catalog key has a crawlable dish SEO page.
On Input: key - String, catalog key.
On Output: Boolean - true when dishImageMap has an entry for that key (page with photo),
          or the key is listed in dishPagesNoPhoto (page kept, no correct photo yet).
---------------------*/
function hasDishPage(key) {
    if (!key) return false;
    if (typeof dishImageMap !== 'undefined' && dishImageMap[key]) return true;
    return typeof dishPagesNoPhoto !== 'undefined' && dishPagesNoPhoto.includes(key);
}

/*-------------------
Purpose: Wrap a dish name in a plain <a href> to its dish page when one exists
         (crawlable internal link). Keeps bilingual data-el / data-en on the cell.
On Input: key - String catalog key; elHtml - String Greek HTML name; enHtml - String English HTML name;
          lang - String 'el' | 'en' (which text to show now).
On Output: String HTML for the table cell contents (with or without the link).
---------------------*/
function dishNameLinked(key, elHtml, enHtml, lang) {
    const shown = (lang === 'en' ? enHtml : elHtml);
    if (!hasDishPage(key)) return shown;
    const href = dishPagePath(key);
    const label = String(shown).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return '<a class="dish-page-link" href="' + href + '" aria-label="' + label.replace(/"/g, '&quot;') + '">' + shown + '</a>';
}

/*-------------------
Purpose: Put today's date into the header row of the daily dishes table.
On Input: lang - String 'el' | 'en' (optional; default the current language).
On Output: none. Side effects: text of #daily-dishes-header, e.g. "🍽️ 20 Οκτωβρίου 2026".
---------------------*/
function updateDailyDishesDate(lang) {
    const header = document.getElementById('daily-dishes-header');
    if (header) header.textContent = `🍽️ ${getFormattedDate(lang || getLang())}`;
}

/*-------------------
Purpose: Build the daily dishes table from today's list, grouped by category.
On Input: none. Data: currentDailyMenu + menuCatalog (matzourana_data.js);
          language from getLang() (the old code read <html lang>, which never changed).
On Output: none.
Side effects: replaces the contents of <table id="daily-menu-table"> and its date row;
          does nothing when the table is not on the page.
Used by: initPage and the 'languageChange' event.
---------------------*/
function renderDailyMenuTable() {
    const table = document.getElementById('daily-menu-table');
    if (!table) return;
    const lang = getLang();
    const t = (el, en) => (lang === 'en' ? en : el);

    let html = `
        <tr>
            <th class="lang" data-el="Πιάτα Ημέρας" data-en="Daily Dishes">${t('Πιάτα Ημέρας', 'Daily Dishes')}</th>
            <th class="lang" data-el="Τιμή" data-en="Price">${t('Τιμή', 'Price')}</th>
        </tr>
        <tr>
            <th class="lang" data-el="" data-en="" id="daily-dishes-header" colspan="2"></th>
        </tr>
    `;
    const grouped = {};
    Object.keys(DAILY_CATEGORY_LABELS).forEach(cat => { grouped[cat] = []; });
    currentDailyMenu.forEach(key => {
        const dish = menuCatalog[key];
        if (dish && grouped[dish.category]) grouped[dish.category].push({ key, dish });
    });
    Object.keys(grouped).forEach(cat => {
        if (grouped[cat].length === 0) return;
        const catLabel = DAILY_CATEGORY_LABELS[cat];
        html += `<tr><th class="lang" data-el="${catLabel.el}" data-en="${catLabel.en}">${catLabel[lang] || catLabel.el}</th><th></th></tr>`;
        grouped[cat].forEach(({ key, dish }) => {
            const linked = dishNameLinked(key, dish.el, dish.en, lang);
            html += `
                <tr>
                    <td class="lang" data-el="${dish.el}" data-en="${dish.en}">
                        ${linked}
                    </td>
                    <td>${dish.price}</td>
                </tr>
            `;
        });
    });
    table.innerHTML = html;
    updateDailyDishesDate(lang);
}

/*-------------------
Purpose: Tell the admin page which dishes are on today's menu (Firebase
         'matzourana_daily' = { updatedAt, keys }).
On Input: none. Data: currentDailyMenu.
On Output: Boolean - true when written.
Notes: Runs on the home page only (decision D5), only on the live site
       (isLiveSite: local previews never write), and only when the Firebase SDK
       is loaded and initialised (initRatingWidget).
---------------------*/
function publishDailyMenuToFirebase() {
    if (!isLiveSite()) return false;
    if (typeof firebase === "undefined" || !firebase.apps.length) return false;
    const keys = (currentDailyMenu || []).filter(Boolean);
    firebase.database().ref("matzourana_daily").set({ updatedAt: new Date().toISOString(), keys });
    return true;
}

/*-------------------
Purpose: Add the Menu JSON-LD (schema.org) for Google, generated from the same data
         the visitor sees: today's daily dishes (menuCatalog + currentDailyMenu +
         dishImageMap) and the static price tables (appetizers, salads, potatoes, grilled).
On Input: menuUrl - String, the page URL the Menu belongs to (its @id is menuUrl + '#menu').
On Output: none.
Side effects: appends <script type="application/ld+json" id="menu-schema"> to <head>.
          Does nothing when the page has no menu tables.
---------------------*/
function buildMenuSchema(menuUrl) {
    if (!document.getElementById('appetizers') && !document.getElementById('daily-menu-table')) return;
    try {
        const BASE = 'https://www.matzourana.gr/';
        const item = (el, en, p, img) => {
            const g = splitDishText(el), e = splitDishText(en), pr = parsePrice(p);
            if (!g.name || !pr) return null;
            const it = {
                '@type': 'MenuItem',
                'name': g.name,
                'description': (g.desc ? g.desc + '. ' : '') + g.name + ' στην Καλλιθέα – Matzourana, Δημοσθένους 48.',
                'offers': { '@type': 'Offer', 'price': pr, 'priceCurrency': 'EUR' }
            };
            if (e.name && e.name !== g.name) it.alternateName = e.name;
            if (img) it.image = BASE + 'DishImages/' + img;
            return it;
        };
        const sections = [];
        const addSection = (nameEl, nameEn, items) => {
            items = items.filter(Boolean);
            if (items.length) sections.push({ '@type': 'MenuSection', 'name': nameEl, 'alternateName': nameEn, 'hasMenuItem': items });
        };
        // Daily dishes (same grouping as the daily menu table)
        const groups = {};
        currentDailyMenu.forEach(k => {
            const d = menuCatalog[k];
            if (!d || !d.el) return;
            const img = dishImageMap[k] ? dishImageMap[k].file : null;
            (groups[d.category] = groups[d.category] || []).push(item(d.el, d.en, d.price, img));
        });
        Object.keys(DAILY_CATEGORY_LABELS).forEach(c => {
            if (groups[c]) addSection('Πιάτα Ημέρας – ' + DAILY_CATEGORY_LABELS[c].el, 'Daily Dishes – ' + DAILY_CATEGORY_LABELS[c].en, groups[c]);
        });
        // Static food price tables
        ['appetizers', 'salads', 'potatoes', 'grilled-dishes'].forEach(id => {
            const box = document.getElementById(id);
            if (!box) return;
            const th = box.querySelector('th.lang');
            const items = [];
            box.querySelectorAll('tr').forEach(tr => {
                const td = tr.querySelectorAll('td');
                if (td.length < 2 || !td[0].hasAttribute('data-el')) return;
                items.push(item(td[0].getAttribute('data-el'), td[0].getAttribute('data-en'), td[1].textContent, null));
            });
            addSection(th ? th.getAttribute('data-el') : id, th ? th.getAttribute('data-en') : id, items);
        });
        const menu = {
            '@context': 'https://schema.org',
            '@type': 'Menu',
            '@id': (menuUrl || BASE) + '#menu',
            'name': 'Μενού Matzourana Καλλιθέα – Μαγειρευτά, Πιάτα Ημέρας & Ψητά',
            'inLanguage': 'el',
            'hasMenuSection': sections
        };
        const tag = document.createElement('script');
        tag.type = 'application/ld+json';
        tag.id = 'menu-schema';
        tag.text = JSON.stringify(menu);
        document.head.appendChild(tag);
    } catch (err) {
        console.warn('Menu schema not generated', err);
    }
}

// ===== DISH VIDEOS (menu page exhibition) =====

/*-------------------
Purpose: List today's dish videos: keys of the daily menu that have a video.
On Input: none. Data: currentDailyMenu + dishVideoCatalog.
On Output: Array of { key, src, titleEl, titleEn }.
---------------------*/
function getActiveDishVideos() {
    return currentDailyMenu
        .filter(key => dishVideoCatalog[key])
        .map(key => Object.assign({ key }, dishVideoCatalog[key]));
}

/*-------------------
Purpose: Build the two video cards of the dishes exhibition: today's dishes (left)
         and making-of (right).
On Input: none. Data: getActiveDishVideos(), makingVideoCatalog; language getLang().
On Output: none.
Side effects: replaces the contents of .video-panels; hides .dishes-exhibition when
          there is nothing to show. The card labels are written in the current
          language (they are re-built on 'languageChange').
---------------------*/
function renderDishVideos() {
    const container = document.querySelector('.video-panels');
    if (!container) return;
    const lang = getLang();
    container.innerHTML = '';

    const activeVideos = getActiveDishVideos();
    if (activeVideos.length > 0) {
        const dailyCard = document.createElement('div');
        dailyCard.className = 'video-card';
        dailyCard.onclick = () => zoomDailyDishesSequence(0);
        dailyCard.innerHTML = `
            <video muted autoplay loop playsinline>
                <source src="${activeVideos[0].src}" type="video/mp4">
            </video>
            <div class="play-overlay">▶</div>
            <div class="panel-label lang" data-el="Πιάτα Ημέρας" data-en="Daily Dishes">${lang === 'en' ? 'Daily Dishes' : 'Πιάτα Ημέρας'}</div>
        `;
        container.appendChild(dailyCard);
    }
    if (makingVideoCatalog.length > 0) {
        const makingCard = document.createElement('div');
        makingCard.className = 'video-card';
        makingCard.onclick = () => zoomMakingSequence(0);
        makingCard.innerHTML = `
            <video muted autoplay loop playsinline>
                <source src="${makingVideoCatalog[0].src}" type="video/mp4">
            </video>
            <div class="play-overlay">▶</div>
            <div class="panel-label lang"
              data-el="Παρασκευή Πιάτων και Δημιουργίες από την Matzourana"
              data-en="Matzourana Dishes Making Off and Creations">${lang === 'en' ? 'Matzourana Dishes Making Off and Creations' : 'Παρασκευή Πιάτων και Δημιουργίες από την Matzourana'}</div>
        `;
        container.appendChild(makingCard);
    }
    const exhibition = document.querySelector('.dishes-exhibition');
    if (exhibition) exhibition.style.display = container.children.length > 0 ? 'block' : 'none';
}

/*-------------------
Purpose: Play today's dish videos one after the other in a video lightbox.
On Input: startIndex - Number (default 0).
On Output: none.
---------------------*/
function zoomDailyDishesSequence(startIndex = 0) {
    const activeVideos = getActiveDishVideos();
    if (activeVideos.length === 0) return;
    openVideoSequence(activeVideos, startIndex);
}

/*-------------------
Purpose: Play the making-of videos one after the other in a video lightbox.
On Input: startIndex - Number (default 0).
On Output: none.
---------------------*/
function zoomMakingSequence(startIndex = 0) {
    if (makingVideoCatalog.length === 0) return;
    openVideoSequence(makingVideoCatalog, startIndex);
}

/*-------------------
Purpose: Style text of the round ‹ › buttons of the video lightbox.
On Input: none.
On Output: String, CSS declarations.
---------------------*/
function videoNavButtonStyle() {
    return 'background: rgba(255,255,255,0.15); border: none; color: white; width: 44px; height: 44px; border-radius: 50%;' +
        'font-size: 1.7rem; cursor: pointer; display: flex; align-items: center; justify-content: center;';
}

/*-------------------
Purpose: Video lightbox that plays a list of videos with title, counter, ‹ › buttons,
         and moves on by itself when a video ends.
On Input: videoList - Array of { src, titleEl, titleEn }; startIndex - Number (default 0).
On Output: none.
Side effects: adds/replaces <div id="zoom-lightbox">; click outside the video closes it.
---------------------*/
function openVideoSequence(videoList, startIndex = 0) {
    let current = startIndex % videoList.length;
    const existing = document.getElementById('zoom-lightbox');
    if (existing) existing.remove();

    const lightbox = document.createElement('div');
    lightbox.id = 'zoom-lightbox';
    lightbox.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.95); display: flex; flex-direction: column;' +
        'justify-content: center; align-items: center; z-index: 99999; cursor: zoom-out; padding: 16px; box-sizing: border-box;';
    lightbox.onclick = (e) => {
        if (e.target === lightbox) {
            const vid = lightbox.querySelector('video');
            if (vid) { vid.pause(); vid.src = ""; }
            lightbox.remove();
        }
    };

    const title = document.createElement('div');
    title.style.cssText = "color: white; font-size: 1.2rem; margin-bottom: 14px; text-align: center; font-family: 'Montserrat', sans-serif; max-width: 90%; line-height: 1.4;";
    lightbox.appendChild(title);

    const video = document.createElement('video');
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.cssText = 'max-width: 92%; max-height: 72vh; border-radius: 12px; background: #000; box-shadow: 0 12px 40px rgba(0,0,0,0.6);';
    video.onclick = (e) => e.stopPropagation();
    lightbox.appendChild(video);

    const nav = document.createElement('div');
    nav.style.cssText = 'display: flex; gap: 14px; margin-top: 18px; align-items: center;';
    const counter = document.createElement('span');
    counter.style.cssText = 'color: #ccc; font-size: 0.95rem; min-width: 60px; text-align: center;';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹';
    prevBtn.style.cssText = videoNavButtonStyle();
    prevBtn.onclick = (e) => { e.stopPropagation(); playVideo(current - 1); };
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '›';
    nextBtn.style.cssText = videoNavButtonStyle();
    nextBtn.onclick = (e) => { e.stopPropagation(); playVideo(current + 1); };
    nav.appendChild(prevBtn);
    nav.appendChild(counter);
    nav.appendChild(nextBtn);
    lightbox.appendChild(nav);

    /*-------------------
    Purpose: Show video number `index` of the list (wraps around both ways).
    On Input: index - Number.
    On Output: none. Side effects: title (current language), counter, video source.
    ---------------------*/
    function playVideo(index) {
        current = (index + videoList.length) % videoList.length;
        const item = videoList[current];
        title.textContent = getLang() === 'en' ? item.titleEn : item.titleEl;
        counter.textContent = `${current + 1} / ${videoList.length}`;
        video.src = item.src;
        video.load();
        video.play().catch(() => {});
    }

    video.addEventListener('ended', () => playVideo(current + 1));
    playVideo(current);
    document.body.appendChild(lightbox);
}


// ===== SEASONAL MESSAGES & THEMES (data: matzourana_messages.js) =====
const SEASONAL_THEME_STYLES = {
    'notice': 'font-weight: bold; color: #4A5D4A;',
    'urgent': 'font-weight: bold; color: #8B3A3A;',
    'plain': '',
    'tree-love': ''
};

/*-------------------
Purpose: Make a calendar day from a 'MM-DD' text in a given year; a day past the end of
         the month (e.g. '02-29' in a normal year) becomes the last day of that month.
On Input: year - Number; mmdd - String 'MM-DD'.
On Output: Date at 00:00.
---------------------*/
function dayFromMonthDay(year, mmdd) {
    const [m, d] = mmdd.split('-').map(Number);
    const last = makeDay(year, m + 1, 0).getDate();
    return makeDay(year, m, Math.min(d, last));
}

/*-------------------
Purpose: Turn one message rule into the concrete date window for the current year
         (and the previous/next year for ranges that wrap over New Year), including the
         early-announcement days.
On Input: rule - Object from seasonalMessages (type fixed|once|easter|nthWeekday|weekly|manual);
          today - Date (Athens calendar day).
On Output: { show:Date, from:Date, to:Date, reopen:Date } for the window that is live
           today, else the next upcoming one; null if the rule cannot apply
           (manual, or weekly on another weekday → weekly is today..today when it matches).
Used by: getActiveMessages, isShopClosedToday, applySeasonalTheme.
---------------------*/
function resolveRuleRange(rule, today) {
    if (!rule) return null;
    const y = today.getFullYear();
    const pairs = [];
    if (rule.type === 'fixed') {
        [y - 1, y, y + 1].forEach(yy => {
            const from = dayFromMonthDay(yy, rule.from);
            let to = dayFromMonthDay(yy, rule.to);
            if (toIsoDay(to) < toIsoDay(from)) to = dayFromMonthDay(yy + 1, rule.to);
            pairs.push([from, to]);
        });
    } else if (rule.type === 'once') {
        const f = rule.from.split('-').map(Number), t = rule.to.split('-').map(Number);
        pairs.push([makeDay(f[0], f[1], f[2]), makeDay(t[0], t[1], t[2])]);
    } else if (rule.type === 'easter') {
        [y, y + 1].forEach(yy => {
            const e = getOrthodoxEaster(yy);
            pairs.push([addDays(e, rule.from || 0), addDays(e, rule.to || 0)]);
        });
    } else if (rule.type === 'nthWeekday') {
        [y, y + 1].forEach(yy => {
            const base = nthWeekdayOfMonth(yy, rule.month, rule.weekday, rule.n);
            pairs.push([addDays(base, rule.from || 0), addDays(base, rule.to || 0)]);
        });
    } else if (rule.type === 'weekly') {
        if ((rule.weekdays || []).indexOf(today.getDay()) >= 0) pairs.push([today, today]);
    } else {
        return null; // 'manual': only with forceOn
    }
    const windows = pairs.map(([from, to]) => ({ show: addDays(from, -(rule.showBefore || 0)), from, to, reopen: addDays(to, 1) }));
    const live = windows.find(w => isDateInRange(today, w.show, w.to));
    if (live) return live;
    const next = windows.filter(w => toIsoDay(w.show) > toIsoDay(today)).sort((a, b) => (toIsoDay(a.show) < toIsoDay(b.show) ? -1 : 1))[0];
    return next || null;
}

/*-------------------
Purpose: Decide whether one message / theme entry is live today and with which dates.
On Input: entry - Object (seasonalMessages or seasonalThemes item); today - Date.
On Output: the resolved window { show, from, to, reopen }, or null when not live.
Rules: live if forceOn (window of the rule if it is live, else today only), or
       enabled AND today is within show..to.
---------------------*/
function getLiveWindow(entry, today) {
    if (entry.forceOn) {
        const r = resolveRuleRange(entry.rule, today);
        return (r && isDateInRange(today, r.show, r.to)) ? r : { show: today, from: today, to: today, reopen: addDays(today, 1) };
    }
    if (!entry.enabled) return null;
    const r = resolveRuleRange(entry.rule, today);
    return (r && isDateInRange(today, r.show, r.to)) ? r : null;
}

/*-------------------
Purpose: Pick which seasonal / holiday messages are live right now, one winner per slot.
On Input: today - Date (Athens calendar day; default getAthensToday());
          messages - Array (default seasonalMessages).
On Output: Object keyed by slot, e.g. { header:[msg], notice:[msg,msg], specials:[msg] },
           each msg a copy carrying `range` (its resolved dates for the placeholders).
Rules: per slot sort by priority desc, then shortest range; keep SEASONAL_MAX_PER_SLOT
       (notice: 2, others: 1). Entries without both el and en are refused (warning).
---------------------*/
function getActiveMessages(today, messages) {
    today = today || getAthensToday();
    messages = messages || (typeof seasonalMessages !== 'undefined' ? seasonalMessages : []);
    const bySlot = {};
    messages.forEach(m => {
        if (!m.el || !m.en) { console.warn('Seasonal message without el/en skipped:', m.id); return; }
        const range = getLiveWindow(m, today);
        if (!range) return;
        (bySlot[m.slot] = bySlot[m.slot] || []).push(Object.assign({}, m, { range }));
    });
    const span = r => (r.to - r.from);
    Object.keys(bySlot).forEach(slot => {
        bySlot[slot].sort((a, b) => (b.priority - a.priority) || (span(a.range) - span(b.range)));
        const max = (typeof SEASONAL_MAX_PER_SLOT !== 'undefined' && SEASONAL_MAX_PER_SLOT[slot]) || 1;
        bySlot[slot] = bySlot[slot].slice(0, max);
    });
    return bySlot;
}

/*-------------------
Purpose: The texts of one live message with its placeholders filled.
On Input: msg - Object from getActiveMessages (with .range); today - Date.
On Output: { el:String, en:String }.
---------------------*/
function getMessageTexts(msg, today) {
    const r = msg.range;
    const values = {
        from: formatDayMonth(r.from), to: formatDayMonth(r.to), reopen: formatDayMonth(r.reopen),
        year: r.from.getFullYear(), nextYear: r.from.getFullYear() + 1, date: formatDayMonth(today)
    };
    return { el: fillPlaceholders(msg.el, values), en: fillPlaceholders(msg.en, values) };
}

/*-------------------
Purpose: Build the HTML element(s) of one message for the notice / specials slots:
         the bilingual text, plus optional picture and YouTube thumbnails.
On Input: msg - Object (live message); texts - { el, en }; lang - 'el' | 'en'.
On Output: DocumentFragment.
---------------------*/
function buildMessageElement(msg, texts, lang) {
    const frag = document.createDocumentFragment();
    const p = document.createElement('p');
    p.className = 'lang seasonal-message';
    p.dataset.messageId = msg.id;
    const style = SEASONAL_THEME_STYLES[msg.theme] || '';
    if (style) p.setAttribute('style', style);
    p.setAttribute('data-el', texts.el);
    p.setAttribute('data-en', texts.en);
    p.innerHTML = lang === 'en' ? texts.en : texts.el;
    frag.appendChild(p);
    if (msg.image) {
        const img = document.createElement('img');
        img.src = msg.image;
        img.alt = texts.el;
        img.style.maxWidth = '100%';
        frag.appendChild(img);
    }
    if (msg.youtube && msg.youtube.length) {
        const box = document.createElement('div');
        box.className = 'yt-previews';
        msg.youtube.forEach(id => {
            const a = document.createElement('a');
            a.href = 'https://youtube.com/shorts/' + id;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'yt-preview';
            const img = document.createElement('img');
            img.src = 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg';
            img.alt = 'YouTube Shorts Preview';
            img.className = 'yt-thumb';
            a.appendChild(img);
            box.appendChild(a);
        });
        frag.appendChild(box);
    }
    return frag;
}

/*-------------------
Purpose: Show the live seasonal / holiday / closure messages in their places on the
         page (header greeting, home notice, specials line, specials heading), always
         bilingual and in the visitor's current language.
On Input: none. Language getLang(); date getAthensToday() (?testDate= previews).
          Data: seasonalMessages (matzourana_messages.js).
On Output: none.
Side effects: fills #seasonal-header, #seasonal-notice, #seasonal-specials and the
          #specials-title override with elements of class "lang" + data-el / data-en
          (placeholders already filled), plus optional image / YouTube thumbnails;
          empties a slot when nothing is live; the specials line stays empty on closed
          days (Mondays, holiday closures). Missing slots on a page are skipped.
Used by: initPage() on every page, and the 'languageChange' event.
---------------------*/
function renderSeasonalMessages() {
    if (typeof seasonalMessages === 'undefined') return;
    const today = getAthensToday();
    const lang = getLang();
    const active = getActiveMessages(today);

    const header = document.getElementById('seasonal-header');
    if (header) {
        const msg = (active.header || [])[0];
        if (msg) {
            const texts = getMessageTexts(msg, today);
            header.className = (msg.theme === 'tree-love' ? 'tree-love ' : '') + 'lang';
            header.setAttribute('data-el', texts.el);
            header.setAttribute('data-en', texts.en);
            header.innerHTML = lang === 'en' ? texts.en : texts.el;
            header.style.display = '';
        } else {
            header.removeAttribute('data-el');
            header.removeAttribute('data-en');
            header.innerHTML = '';
            header.style.display = 'none';
        }
    }
    const closedToday = isShopClosedToday(today).closed;
    ['notice', 'specials'].forEach(slot => {
        const box = document.getElementById('seasonal-' + slot);
        if (!box) return;
        box.innerHTML = '';
        if (slot === 'specials' && closedToday) return;   // no specials line (e.g. "Καλή Κυριακή") on a closed day
        (active[slot] || []).forEach(msg => box.appendChild(buildMessageElement(msg, getMessageTexts(msg, today), lang)));
    });
    const title = document.getElementById('specials-title');
    if (title) {
        if (!title.hasAttribute('data-default-el')) {
            title.setAttribute('data-default-el', title.getAttribute('data-el'));
            title.setAttribute('data-default-en', title.getAttribute('data-en'));
        }
        const msg = (active.specialsTitle || [])[0];
        const texts = msg ? getMessageTexts(msg, today)
            : { el: title.getAttribute('data-default-el'), en: title.getAttribute('data-default-en') };
        title.setAttribute('data-el', texts.el);
        title.setAttribute('data-en', texts.en);
        title.innerHTML = '<strong>' + (lang === 'en' ? texts.en : texts.el) + '</strong>';
    }
}

/*-------------------
Purpose: Say whether Matzourana is closed today: every Monday, or a live message
         with closesShop:true whose from..to covers today (announcement days don't count).
On Input: today - Date (default getAthensToday()).
On Output: { closed:Boolean, reason:'monday'|'message'|null, message:Object|null,
             texts:{el,en}|null }.
Used by: renderDailyHighlights (hides dishes and shows the closed text; on Mondays the
         Monday video as today).
---------------------*/
function isShopClosedToday(today) {
    today = today || getAthensToday();
    if (today.getDay() === 1) return { closed: true, reason: 'monday', message: null, texts: null };
    const list = typeof seasonalMessages !== 'undefined' ? seasonalMessages : [];
    for (const m of list) {
        if (!m.closesShop || !m.el || !m.en) continue;
        const range = getLiveWindow(m, today);
        if (range && isDateInRange(today, range.from, range.to)) {
            const msg = Object.assign({}, m, { range });
            return { closed: true, reason: 'message', message: msg, texts: getMessageTexts(msg, today) };
        }
    }
    return { closed: false, reason: null, message: null, texts: null };
}

/*-------------------
Purpose: Switch the header logo video to the live seasonal theme (autumn, winter,
         spring, summer, and the holiday sets when enabled), optionally a different
         video for every weekday.
On Input: none. Data: seasonalThemes (matzourana_messages.js); date getAthensToday().
On Output: none.
Side effects: changes the <source> of .logo-video only when it differs from the
          current file (no reload otherwise); then drops the autumn poster and starts the
          new video through playLogoVideoWhenReady (after page load, not for reduced motion).
          Replaces the old #logoVideo code that threw a TypeError on every visit.
---------------------*/
function applySeasonalTheme() {
    if (typeof seasonalThemes === 'undefined') return;
    const video = document.querySelector('.logo-video');
    const source = video && video.querySelector('source');
    if (!source) return;
    const today = getAthensToday();
    const live = seasonalThemes
        .map(t => ({ t, r: getLiveWindow(t, today) }))
        .filter(x => x.r && x.t.logoVideos && x.t.logoVideos.length)
        .sort((a, b) => (b.t.priority - a.t.priority) || ((a.r.to - a.r.from) - (b.r.to - b.r.from)));
    if (!live.length) return;
    const theme = live[0].t;
    const file = theme.rotateByWeekday ? theme.logoVideos[today.getDay() % theme.logoVideos.length] : theme.logoVideos[0];
    if (source.getAttribute('src') !== file) {
        source.setAttribute('src', file);
        video.removeAttribute('poster');
        video.load();
        playLogoVideoWhenReady(video);
    }
}

// ===== HOME =====

/*-------------------
Purpose: Draw the "today's highlights" notebook on the home page: the weekday row,
         the highlighted dishes with their icons, and on closed days the closed message
         instead of dishes (Mondays: plus the Matzourana_Monday video; holiday closures
         with closesShop:true: that message's text).
On Input: none. Language: getLang().
          Data: currentHighlights + highlightsCatalog (matzourana_data.js); isShopClosedToday().
On Output: none.
Side effects: replaces the contents of <tbody id="daily-highlights-body">;
          does nothing if that element is not on the page. Then asks
          scheduleMusicStoriesFit() to re-fit the Music Stories (the notebook height
          may have changed).
Used by: initPage('home') and the 'languageChange' event.
---------------------*/
function renderDailyHighlights() {
    const tbody = document.getElementById('daily-highlights-body');
    if (!tbody) return;

    const lang = getLang();
    const dayIndex = getAthensDayIndex();
    const closedInfo = isShopClosedToday();
    const isClosed = closedInfo.closed;              // Mondays + holiday closures
    const isMonday = closedInfo.reason === 'monday';
    const dayEl = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'][dayIndex];
    const dayEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
    const dayLabelEl = '🗓️ ' + dayEl;
    const dayLabelEn = '🗓️ ' + dayEn;
    const dayRow = '<tr class="highlight-row animate-write" id="highlights-day-row">' +
        '<td class="highlight-name lang" colspan="2" data-el="' + dayLabelEl + '" data-en="' + dayLabelEn + '">' +
        (lang === 'en' ? dayLabelEn : dayLabelEl) + '</td></tr>';
    let dayRowAdded = false;
    let html = '';

    currentHighlights.forEach(key => {
        // The day goes right after the leading spacer line
        if (!dayRowAdded && key !== 'line') { html += dayRow; dayRowAdded = true; }
        // Closed days: no dishes, only the spacer
        if (isClosed && key !== 'line') return;
        const dish = highlightsCatalog[key];
        if (!dish) return;
        let iconHTML = '';
        dish.icons.forEach(icon => {
            iconHTML += '<img src="Logos/' + icon.replace(/\.png$/i, '.webp') + '" alt="' + icon + '" class="category-icon" decoding="async">';
        });
        html += '<tr class="highlight-row animate-write">';
        html += '<td class="highlight-icons">' + iconHTML + '</td>';
        html += '<td class="highlight-name lang" data-el="' + dish.el + '" data-en="' + dish.en + '">' + dishNameLinked(key, dish.el, dish.en, lang) + '</td>';
        html += '</tr>';
    });
    if (!dayRowAdded) html += dayRow;

    if (isMonday) {
        const closedEl = 'Δευτέρα – Κλειστά. Καλή ξεκούραση! 🌿 Ανυπομονούμε να σας εξυπηρετήσουμε από αύριο!';
        const closedEn = 'Monday – Closed. Enjoy your day off! 🌿 We look forward to serving you tomorrow!';
        html += '<tr class="highlight-row animate-write" id="highlights-closed-row">' +
            '<td class="highlight-name lang" colspan="2" data-el="' + closedEl + '" data-en="' + closedEn + '">' +
            (lang === 'en' ? closedEn : closedEl) + '</td></tr>';
        // Monday video (muted loop; clicks pass through to the panel button)
        html += '<tr class="highlight-row animate-write" id="highlights-monday-video-row"><td colspan="2">' +
            '<video src="Videos/Matzourana_Monday.mp4" poster="Videos/matzourana-monday-poster.jpg" autoplay muted loop playsinline preload="metadata" ' +
            'aria-label="' + (lang === 'en' ? 'Closed every Monday – see you again from Tuesday!' : 'Κάθε Δευτέρα κλειστά – από την Τρίτη και πάλι μαζί!') + '" ' +
            'style="display: block; width: 100%; max-width: 240px; max-height: 60vh; height: auto; margin: 0.4em auto 0; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.15); pointer-events: none;">' +
            '</video></td></tr>';
    } else if (isClosed) {
        const t = closedInfo.texts;
        html += '<tr class="highlight-row animate-write" id="highlights-closed-row">' +
            '<td class="highlight-name lang" colspan="2" data-el="' + t.el.replace(/"/g, '&quot;') + '" data-en="' + t.en.replace(/"/g, '&quot;') + '">' +
            (lang === 'en' ? t.en : t.el) + '</td></tr>';
    }
    tbody.innerHTML = html;
    scheduleMusicStoriesFit();
}

// ===== HOME: MUSIC STORIES FIT =====

/*-------------------
Purpose: Measure the content height of one column of the home hero (the column itself
         is stretched by the flex row, so its own height says nothing).
On Input: col - Element (.text-panel or .image-panel).
On Output: Number, px from the top margin of the first visible child to the bottom
          margin of the last visible child (0 if none).
Used by: fitMusicStories.
---------------------*/
function columnContentHeight(col) {
    let top = Infinity, bottom = -Infinity;
    Array.from(col.children).forEach(el => {
        if (!el.getClientRects().length) return;            // display:none, <template>, ...
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        top = Math.min(top, r.top - parseFloat(cs.marginTop || 0));
        bottom = Math.max(bottom, r.bottom + parseFloat(cs.marginBottom || 0));
    });
    return bottom > top ? bottom - top : 0;
}

/*-------------------
Purpose: Make the right column of the home hero (ending with the Music Stories) end
         where the left column (ending with the rating card) ends, by showing only as
         many whole rows of Music Stories as fit: minimum 1 row, maximum all 6.
On Input: none. Reads the DOM: .yt-grid inside the hero .section-container.
On Output: Number of stories shown (0 if there is no Music Stories grid on the page).
Side effects: toggles class 'yt-fit-hidden' on the .yt-preview cards (only when the
          result changes) and sets data-fit-shown on the grid.
How: 1) show all cards and measure, in the same task (no paint in between);
     2) both columns are vertically centred, so equal content heights = equal bottoms;
        pick the row count whose right content height is closest to the left one
        (ties: more rows). The result depends only on the content heights with all
        cards shown, never on the current hidden state, so it cannot loop.
     When the columns are stacked (flex-direction: column) all cards are shown.
Used by: scheduleMusicStoriesFit (load, resize, ResizeObserver, languageChange,
          renderDailyHighlights).
---------------------*/
function fitMusicStories() {
    const grid = document.querySelector('.yt-previews.yt-grid');
    const row = grid && grid.closest('.section-container');
    const left = row && row.querySelector(':scope > .text-panel');
    const right = row && row.querySelector(':scope > .image-panel');
    if (!grid || !left || !right) return 0;
    const cards = Array.from(grid.querySelectorAll(':scope > .yt-preview'));
    const before = cards.map(c => c.classList.contains('yt-fit-hidden'));
    cards.forEach(c => c.classList.remove('yt-fit-hidden'));

    let shown = cards.length;
    if (getComputedStyle(row).flexDirection === 'row' && cards.length) {
        const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length);
        const rows = Math.ceil(cards.length / cols);
        const rowStep = rows > 1 ? cards[cols].getBoundingClientRect().top - cards[0].getBoundingClientRect().top : 0;
        const leftH = columnContentHeight(left);
        const rightH = columnContentHeight(right);              // with all rows shown
        let bestRows = rows, bestDiff = Math.abs(rightH - leftH);
        for (let k = rows - 1; k >= 1; k--) {
            const d = Math.abs(rightH - (rows - k) * rowStep - leftH);
            if (d < bestDiff) { bestDiff = d; bestRows = k; }
        }
        shown = Math.min(cards.length, bestRows * cols);
    }
    cards.forEach((c, i) => {
        const hide = i >= shown;
        if (hide) c.classList.add('yt-fit-hidden');
        if (hide !== before[i]) grid.dataset.fitChanged = String((+grid.dataset.fitChanged || 0) + 1);
    });
    grid.dataset.fitShown = String(shown);
    return shown;
}

let musicFitFrame = 0;
/*-------------------
Purpose: Run fitMusicStories once on the next animation frame, however many times it
         is asked for in the meantime (resize bursts, several observers at once).
On Input: none.
On Output: none.
Used by: renderDailyHighlights, initMusicStoriesFit.
---------------------*/
function scheduleMusicStoriesFit() {
    if (musicFitFrame || !document.querySelector('.yt-previews.yt-grid')) return;
    musicFitFrame = requestAnimationFrame(() => { musicFitFrame = 0; fitMusicStories(); });
}

/*-------------------
Purpose: Keep the Music Stories fitted to the left column on the home page.
On Input: none.
On Output: none.
Side effects: fits now; re-fits on window load (fonts, thumbnails), on resize
          (debounced 150 ms), on 'languageChange', and through a ResizeObserver on the
          left column's cards, the notebook and the Music Stories grid (the observed
          boxes have their natural height, not the stretched column height, and an
          unchanged result writes nothing, so the observer settles).
          Does nothing on pages without the grid.
Used by: initPage('home').
---------------------*/
function initMusicStoriesFit() {
    const grid = document.querySelector('.yt-previews.yt-grid');
    const row = grid && grid.closest('.section-container');
    if (!grid || !row) return;
    scheduleMusicStoriesFit();
    window.addEventListener('load', scheduleMusicStoriesFit);
    let resizeTimer = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(scheduleMusicStoriesFit, 150);
    });
    document.addEventListener('languageChange', scheduleMusicStoriesFit);
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(scheduleMusicStoriesFit);
        const left = row.querySelector(':scope > .text-panel');
        if (left) Array.from(left.children).forEach(el => ro.observe(el));
        const notebook = row.querySelector('.daily-highlights');
        if (notebook) ro.observe(notebook);
        ro.observe(grid);
    }
}

/*-------------------
Purpose: The live star rating on the home page: visitors give 1–5 stars once per
         visit, the average and number of ratings are shown live.
On Input: none. Needs the Firebase SDK (loaded on the home page only).
On Output: none.
Side effects: initialises Firebase (firebaseConfig); reads 'matzourana_ratings' live;
          a star click adds +1 to that star's counter. Writes #rating-display
          (re-written on 'languageChange'). Does NOT add aggregateRating to the
          Restaurant JSON-LD any more (self-serving review markup, removed on purpose).
---------------------*/
function initRatingWidget() {
    const container = document.getElementById('star-rating');
    if (!container) return;
    if (typeof firebase === 'undefined') { console.warn('Rating: Firebase SDK not loaded'); return; }
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const ratingsRef = firebase.database().ref('matzourana_ratings');
    const stars = container.querySelectorAll('.star');
    const ratingDisplay = document.getElementById('rating-display');
    const thankYouMsg = document.getElementById('thank-you-message');
    let hasRatedThisVisit = false;
    let last = null; // { avg, total }

    /*-------------------
    Purpose: Write the average and the number of ratings in the current language.
    On Input: none (uses `last`). On Output: none.
    ---------------------*/
    function drawDisplay() {
        if (!last || !ratingDisplay) return;
        const text = getLang() === 'el' ? ` (${last.total} βαθμολογίες)` : ` (${last.total} ratings)`;
        ratingDisplay.innerHTML = `
            <span style="font-size:1.6em;color:#4A5D4A;">${last.avg}</span>
            <span style="font-size:0.65em;vertical-align:super;color:#4A5D4A;">/5</span>
            <span style="font-size:0.9em;color:#666;margin-left:10px;">${text}</span>
        `;
    }

    /*-------------------
    Purpose: Read the rating counters once and redraw the display.
    On Input: none. On Output: none.
    ---------------------*/
    function updateDisplay() {
        ratingsRef.once('value', (snapshot) => {
            const data = snapshot.val() || {};
            let total = 0, sum = 0;
            Object.keys(data).forEach(key => { total += data[key]; sum += parseInt(key) * data[key]; });
            last = { avg: total > 0 ? parseFloat((sum / total).toFixed(1)) : 4.9, total };
            drawDisplay();
        });
    }

    /*-------------------
    Purpose: Colour the stars up to the chosen rating.
    On Input: rating - Number 1..5. On Output: none.
    ---------------------*/
    function highlightStars(rating) {
        stars.forEach(star => {
            const on = parseInt(star.dataset.value) <= rating;
            star.style.color = on ? '#4A5D4A' : '#e0e0e0';
            star.style.transform = on ? 'scale(1.25)' : 'scale(1)';
        });
    }

    container.addEventListener('click', (e) => {
        if (!e.target.classList.contains('star') || hasRatedThisVisit) return;
        const rating = parseInt(e.target.dataset.value);
        hasRatedThisVisit = true;
        ratingsRef.child(rating).transaction((c) => (c || 0) + 1);
        highlightStars(rating);
        if (thankYouMsg) thankYouMsg.style.display = 'block';
        setTimeout(updateDisplay, 800);
    });
    document.addEventListener('languageChange', drawDisplay);
    updateDisplay();
    ratingsRef.on('value', updateDisplay);
}

/*-------------------
Purpose: Keep the header greeting visible when the logo video ends (the video stops
         on its first frame).
On Input: none. On Output: none.
---------------------*/
/*-------------------
Purpose: Start the header logo video only after the page has loaded, so its download does
         not compete with the first paint / LCP; visitors who ask for reduced motion keep
         the still poster.
On Input: video - HTMLVideoElement (optional; default the header .logo-video).
On Output: none.
Side effects: after window 'load' (or at once if already loaded) sets preload="auto" and
          calls play(); does nothing when prefers-reduced-motion: reduce.
---------------------*/
function playLogoVideoWhenReady(video) {
    video = video || document.querySelector('header .logo-video');
    if (!video) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const start = () => {
        video.preload = 'auto';
        const p = video.play(); if (p && p.catch) p.catch(() => {});
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
}

function initLogoVideo() {
    const video = document.querySelector('.logo-video');
    const text = document.querySelector('.logo-container .lang, .logo-container #seasonal-header');
    if (!video || !text) return;
    text.style.opacity = 1;
    video.addEventListener('ended', () => {
        video.pause();
        video.currentTime = 0;
        text.style.transition = 'opacity 1.5s ease';
        text.style.opacity = 1;
    });
}

/*-------------------
Purpose: Play or pause the Matzourana song (music panel; currently switched off,
         so this is only active if the panel HTML is put back).
On Input: none. On Output: none.
Notes: Guarded: does nothing when the music button / audio are not on the page.
---------------------*/
function toggleMusic() {
    const music = document.getElementById('background-music');
    const musicBtn = document.querySelector('.music-btn');
    if (!music || !musicBtn) return;
    playButtonSound();
    const musicIcon = document.querySelector('.music-player-icon');
    const info = document.getElementById('music-info');
    if (isPlaying) {
        music.pause();
        musicBtn.textContent = getLang() === 'el' ? 'Αναπαραγωγή Μουσικής' : 'Play Music';
        if (musicIcon) musicIcon.style.display = 'none';
        if (info) info.style.display = 'none';
    } else {
        const p = music.play();
        if (p && p.catch) p.catch(() => {});
        musicBtn.textContent = getLang() === 'el' ? 'Παύση Μουσικής' : 'Pause Music';
        if (musicIcon) musicIcon.style.display = 'block';
        if (info) info.style.display = 'block';
    }
    isPlaying = !isPlaying;
}

// ===== REVIEWS =====
const reviewsShowOriginal = {};   // per review: true = show the original text (kept across language switches)

/*-------------------
Purpose: Show every review in the site language; a translated review gets a small
         "see original / see translation" toggle.
On Input: none. Data: reviewsData (matzourana_data.js); language getLang().
On Output: none.
Side effects: text + lang attribute of #reviews .rv-text, and the .rv-trans bars.
---------------------*/
function renderReviews() {
    const lang = getLang(), ui = reviewsData.ui[lang];
    document.querySelectorAll('#reviews .rv-text').forEach(bq => {
        const i = +bq.getAttribute('data-review'), r = reviewsData.reviews[i];
        const bar = document.querySelector('#reviews .rv-trans[data-review="' + i + '"]');
        if (!r) return;
        const translated = r.origLang !== lang && r.text[lang];
        const useOrig = !translated || reviewsShowOriginal[i];
        const shownLang = useOrig ? r.origLang : lang;
        bq.textContent = r.text[shownLang];
        bq.setAttribute('lang', shownLang);
        if (!bar) return;
        if (!translated) { bar.hidden = true; return; }
        bar.hidden = false;
        bar.querySelector('.rv-trans-note').textContent = useOrig
            ? ui.origNote.replace('{lang}', ui.langsShort[r.origLang])
            : ui.note.replace('{lang}', ui.langs[r.origLang]);
        bar.querySelector('.rv-trans-toggle').textContent = useOrig ? ui.trans : ui.orig;
    });
}

/*-------------------
Purpose: Start the reviews: first render and the "see original" toggle buttons.
On Input: none. On Output: none.
---------------------*/
function initReviews() {
    if (!document.querySelector('#reviews .rv-text')) return;
    document.querySelectorAll('#reviews .rv-trans-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const i = +btn.parentNode.getAttribute('data-review');
            reviewsShowOriginal[i] = !reviewsShowOriginal[i];
            renderReviews();
        });
    });
    renderReviews();
}

/*-------------------
Purpose: Reviews video panel: load and play the featured video only while it is
         visible, and swap it when a thumbnail is clicked.
On Input: none. On Output: none.
---------------------*/
function initReviewsVideoPanel() {
    const player = document.getElementById('rv-player');
    const caption = document.getElementById('rv-caption');
    const thumbs = document.querySelectorAll('#reviews .rv-thumb');
    if (!player) return;

    /*-------------------
    Purpose: Load (first time) and play the featured video.
    On Input: none. On Output: none.
    ---------------------*/
    function start() {
        if (!player.getAttribute('src')) player.src = player.dataset.src;
        const p = player.play(); if (p && p.catch) p.catch(() => {});
    }
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) start(); else player.pause(); });
        }, { threshold: 0.25 }).observe(player);
    } else {
        start();
    }
    thumbs.forEach(btn => {
        btn.addEventListener('click', () => {
            thumbs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            player.dataset.src = btn.dataset.video;
            player.poster = btn.dataset.poster;
            player.src = btn.dataset.video;
            player.setAttribute('aria-label', btn.dataset.capEl);
            if (caption) {
                caption.setAttribute('data-el', btn.dataset.capEl);
                caption.setAttribute('data-en', btn.dataset.capEn);
                caption.textContent = getLang() === 'en' ? btn.dataset.capEn : btn.dataset.capEl;
            }
            const p = player.play(); if (p && p.catch) p.catch(() => {});
        });
    });
}

// ===== STARTUP =====

/*-------------------
Purpose: Menu page start: open the tab named in the address (e.g.
         matzourana_menu.html#daily-dishes from the home notebook or the dish pages),
         else Appetizers, and bring the tab buttons into view when a tab was asked for.
On Input: none (reads location.hash).
On Output: none.
Side effects: showMenu(tab, silent) for the food tab and, if the hash names a drinks
          tab, that one too; scrolls to the tab's button row.
---------------------*/
function initMenuPage() {
    const hash = decodeURIComponent((location.hash || '').slice(1));
    const target = hash ? document.getElementById(hash) : null;
    const isTab = target && target.classList.contains('menu-content');
    showMenu(isTab ? hash : 'appetizers', true);
    if (isTab) {
        let row = target.previousElementSibling;
        while (row && !row.classList.contains('menu-buttons')) row = row.previousElementSibling;
        (row || target).scrollIntoView({ block: 'start' });
    }
}

/*-------------------
Purpose: Start a page: language from the visitor's last choice, then only the
         features this page has.
On Input: pageName - String (optional; default <body data-page>, else 'home').
On Output: none.
Side effects: sets currentLang / <html lang>; renders the daily table, highlights,
          videos, reviews, seasonal messages + logo theme (each only if its place is on
          the page); applies the language to all .lang texts; lightbox controls;
          on 'menu' the tab from the address + Menu JSON-LD; on 'home' also
          old-#anchor redirects, the rating widget, the daily Firebase publish (D5)
          and the Music Stories fit (initMusicStoriesFit).
          Registers the 'languageChange' re-renderers. Starts the header logo video after
          page load (playLogoVideoWhenReady).
---------------------*/
function initPage(pageName) {
    const page = pageName || document.body.dataset.page || 'home';
    if (page === 'home' && redirectOldAnchors()) return;   // old /#gallery links → own page
    currentLang = loadSavedLanguage();
    document.documentElement.lang = currentLang;

    // Static .lang texts first; then JS-built tables so applyLanguage cannot
    // wipe the <a class="dish-page-link"> links those renderers insert.
    applyLanguage(currentLang);

    renderDailyMenuTable();
    renderDailyHighlights();
    renderDishVideos();
    initReviews();
    initReviewsVideoPanel();
    renderSeasonalMessages();
    applySeasonalTheme();
    if (page === 'menu') {
        initMenuPage();
        buildMenuSchema('https://www.matzourana.gr/matzourana_menu.html');
    }
    initLightboxControls();
    initLogoVideo();
    playLogoVideoWhenReady();

    updateDailyDishesDate(currentLang);

    if (page === 'home') {
        initRatingWidget();
        publishDailyMenuToFirebase();
        initMusicStoriesFit();
    }

    document.addEventListener('languageChange', () => {
        renderDailyMenuTable();
        renderDailyHighlights();
        renderDishVideos();
        renderReviews();
        renderSeasonalMessages();
        updateZoomCaption();
    });
}

document.addEventListener('DOMContentLoaded', () => initPage());
