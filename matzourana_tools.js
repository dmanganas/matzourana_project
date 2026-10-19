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

/*-------------------
Purpose: Simple full-screen viewer for one image or one video (click outside closes).
On Input: src - String, file or URL; alt - String (images); isVideo - Boolean.
On Output: none.
Side effects: adds/replaces <div id="zoom-lightbox"> on the page.
---------------------*/
function zoomMedia(src, alt = '', isVideo = false) {
    const existing = document.getElementById('zoom-lightbox');
    if (existing) existing.remove();

    const lightbox = document.createElement('div');
    lightbox.id = 'zoom-lightbox';
    lightbox.style.cssText = 'position: fixed; inset: 0; background: rgba(0, 0, 0, 0.94); display: flex; flex-direction: column;' +
        'justify-content: center; align-items: center; z-index: 99999; cursor: zoom-out; padding: 20px; box-sizing: border-box;';
    lightbox.onclick = function (e) {
        if (e.target === lightbox) {
            const vid = lightbox.querySelector('video');
            if (vid) { vid.pause(); vid.currentTime = 0; }
            lightbox.remove();
        }
    };

    let media;
    if (isVideo === true) {
        media = document.createElement('video');
        media.src = src;
        media.controls = true;
        media.autoplay = true;
        media.muted = false;
        media.playsInline = true;
        media.style.cssText = 'max-width: 92%; max-height: 85vh; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); background: #000;';
    } else {
        media = document.createElement('img');
        media.src = src;
        media.alt = alt;
        media.style.cssText = 'max-width: 92%; max-height: 85vh; border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); object-fit: contain;';
    }
    media.onclick = (e) => e.stopPropagation();
    lightbox.appendChild(media);
    document.body.appendChild(lightbox);
}

// ===== MENU =====

/*-------------------
Purpose: Switch the active menu tab (Appetizers, Salads, Potatoes, Daily Dishes,
         Grilled) and refresh the dish photos next to it.
On Input: menuId - String, id of the tab content ('appetizers', 'salads', 'potatoes',
          'daily-dishes', 'grilled-dishes').
On Output: none.
Side effects: sets .active on the tab content and its button; shows up to 24 photos
          (even number, at least 10): photos of today's daily dishes first, the rest
          shuffled. Keeps the rich bilingual alt texts (dishAlts) for SEO.
          Data: imageList, dishAlts, dishImageMap, currentDailyMenu (matzourana_data.js).
---------------------*/
function showMenu(menuId) {
    playButtonSound();
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
        if (dish && grouped[dish.category]) grouped[dish.category].push(dish);
    });
    Object.keys(grouped).forEach(cat => {
        if (grouped[cat].length === 0) return;
        const catLabel = DAILY_CATEGORY_LABELS[cat];
        html += `<tr><th class="lang" data-el="${catLabel.el}" data-en="${catLabel.en}">${catLabel[lang] || catLabel.el}</th><th></th></tr>`;
        grouped[cat].forEach(dish => {
            html += `
                <tr>
                    <td class="lang" data-el="${dish.el}" data-en="${dish.en}">
                        ${lang === 'en' ? dish.en : dish.el}
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

// ===== HOME =====

/*-------------------
Purpose: Draw the "today's highlights" notebook on the home page: the weekday row,
         the highlighted dishes with their icons, and on Mondays the closed message
         plus the Matzourana_Monday video instead of dishes.
On Input: none. Language: getLang().
          Data: currentHighlights + highlightsCatalog (matzourana_data.js).
On Output: none.
Side effects: replaces the contents of <tbody id="daily-highlights-body">;
          does nothing if that element is not on the page.
Used by: initPage('home') and the 'languageChange' event.
---------------------*/
function renderDailyHighlights() {
    const tbody = document.getElementById('daily-highlights-body');
    if (!tbody) return;

    const lang = getLang();
    const dayIndex = getAthensDayIndex();
    const isMonday = dayIndex === 1; // Matzourana is closed on Mondays
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
        // Mondays (closed): no dishes, only the spacer
        if (isMonday && key !== 'line') return;
        const dish = highlightsCatalog[key];
        if (!dish) return;
        let iconHTML = '';
        dish.icons.forEach(icon => {
            iconHTML += '<img src="Logos/' + icon + '" alt="' + icon + '" class="category-icon">';
        });
        html += '<tr class="highlight-row animate-write">';
        html += '<td class="highlight-icons">' + iconHTML + '</td>';
        html += '<td class="highlight-name lang" data-el="' + dish.el + '" data-en="' + dish.en + '">' + (lang === 'en' ? dish.en : dish.el) + '</td>';
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
    }
    tbody.innerHTML = html;
}

/*-------------------
Purpose: Show the "Καλή Κυριακή" line on the home page only on Sundays (Greek time).
On Input: none. On Output: none.
Side effects: un-hides #sunday-greeting on Sundays.
---------------------*/
function initSundayGreeting() {
    const sundayGreeting = document.getElementById('sunday-greeting');
    if (sundayGreeting && getAthensDayIndex() === 0) sundayGreeting.style.display = '';
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
Purpose: Start a page: language from the visitor's last choice, then only the
         features this page has.
On Input: pageName - String (optional; default <body data-page>, else 'home').
On Output: none.
Side effects: sets currentLang / <html lang>; renders the daily table, highlights,
          videos, reviews, Menu JSON-LD; applies the language to all .lang texts;
          lightbox controls; on 'home' also the rating widget and the daily
          Firebase publish (D5). Registers the 'languageChange' re-renderers.
---------------------*/
function initPage(pageName) {
    const page = pageName || document.body.dataset.page || 'home';
    currentLang = loadSavedLanguage();
    document.documentElement.lang = currentLang;

    renderDailyMenuTable();
    renderDailyHighlights();
    renderDishVideos();
    initReviews();
    initReviewsVideoPanel();
    initSundayGreeting();
    buildMenuSchema('https://www.matzourana.gr/');
    initLightboxControls();
    initLogoVideo();

    applyLanguage(currentLang);
    updateDailyDishesDate(currentLang);

    if (page === 'home') {
        initRatingWidget();
        publishDailyMenuToFirebase();
    }

    document.addEventListener('languageChange', () => {
        renderDailyMenuTable();
        renderDailyHighlights();
        renderDishVideos();
        renderReviews();
        updateZoomCaption();
    });
}

document.addEventListener('DOMContentLoaded', () => initPage());
