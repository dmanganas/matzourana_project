/* ============================================================
   matzourana_utils.js – small shared helpers for every Matzourana page
   ------------------------------------------------------------
   Load order (all with defer): matzourana_data.js → matzourana_messages.js →
   matzourana_utils.js → matzourana_tools.js. Plain scripts (no ES modules),
   because the onclick="..." handlers in the HTML need global functions.
   Pages: index.html, matzourana_menu/gallery/reviews/about/contact.html.
   ============================================================ */

// ===== CONSTANTS =====
const LANG_STORAGE_KEY = 'matzourana_lang';
const GOOGLE_MAPS_URL = "https://www.google.com/maps/place/MATZOURANA/@37.9566025,23.7106779,17z/data=!4m15!1m8!3m7!1s0x14a1bc55ee53ece7:0xf88c808dd92b6d74!2sDimosthenous+48,+Kallithea+176+71,+Griechenland!3b1!8m2!3d37.9566025!4d23.7106779!16s%2Fg%2F11pw2vry8d!3m5!1s0x14a1bd0017f85379:0xd1a70afea945a237!8m2!3d37.9566043!4d23.7106794!16s%2Fg%2F11m5lpfpyp?entry=ttu&g_ep=EgoyMDI1MDgxOS4wIKXMDSoASAFQAw%3D%3D";
const GOOGLE_MAPS_REVIEW_URL = "https://www.google.com/maps/place/MATZOURANA/@37.9566042,23.7058085,17z/data=!4m8!3m7!1s0x14a1bd0017f85379:0xd1a70afea945a237!8m2!3d37.9566043!4d23.7106794!9m1!1b1!16s%2Fg%2F11m5lpfpyp?entry=ttu&g_ep=EgoyMDI2MDQyOS4wIKXMDSoASAFQAw%3D%3D";
const TRIPADVISOR_URL = "https://www.tripadvisor.com/Restaurant_Review-g262046-d33012087-Reviews-Matzourana-Kallithea_Attica.html";

// ===== LANGUAGE =====
let currentLang = 'el';   // 'el' (default) or 'en'; set by initPage / toggleLanguage

/*-------------------
Purpose: Tell which language the page is showing right now.
On Input: none.
On Output: String 'el' or 'en' (anything else counts as 'el').
Used by: every renderer (daily table, highlights, reviews, videos, zoom caption, seasonal messages).
---------------------*/
function getLang() {
    return currentLang === 'en' ? 'en' : 'el';
}

/*-------------------
Purpose: Read the language the visitor chose on an earlier page or visit.
On Input: none (reads localStorage 'matzourana_lang').
On Output: String 'el' or 'en'; 'el' when nothing is saved or storage is blocked.
---------------------*/
function loadSavedLanguage() {
    try {
        return localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'el';
    } catch (e) {
        return 'el';
    }
}

/*-------------------
Purpose: Put the page into one language without saving it or telling the tools.
On Input: lang - String, 'el' or 'en'.
On Output: none.
Side effects: sets currentLang and <html lang>; replaces the innerHTML of every .lang
          element with its data-el / data-en text (elements without that attribute
          are left alone).
Used by: toggleLanguage, initPage.
---------------------*/
function applyLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'el';
    document.documentElement.lang = currentLang;
    document.querySelectorAll('.lang').forEach(el => {
        const text = el.getAttribute('data-' + currentLang);
        if (text !== null) el.innerHTML = text;
    });
}

/*-------------------
Purpose: Switch the whole page between Greek and English and remember the choice
         for the next page the visitor opens.
On Input: lang - String, 'el' or 'en'.
On Output: none (returns undefined).
Side effects: applyLanguage(lang); saves localStorage 'matzourana_lang';
          dispatches the 'languageChange' event {detail:{lang}} so the tools (daily
          table, highlights, reviews, videos, zoom caption, seasonal messages)
          re-render themselves.
Notes: Must never throw before dispatching the event (old bug: missing .music-btn).
---------------------*/
function toggleLanguage(lang) {
    applyLanguage(lang);
    try { localStorage.setItem(LANG_STORAGE_KEY, currentLang); } catch (e) { /* private mode: not saved */ }
    document.dispatchEvent(new CustomEvent('languageChange', { detail: { lang: currentLang } }));
}

// ===== DATES & TEXT =====

/*-------------------
Purpose: Today's date as readable text in the given language, in Greek time.
On Input: lang - String, 'el' for Greek, anything else for English.
On Output: String, e.g. "9 Αυγούστου 2025" or "August 9, 2025".
---------------------*/
function getFormattedDate(lang) {
    return new Date().toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Athens'
    });
}

/*-------------------
Purpose: Return today's weekday number in Greek time (Europe/Athens), so day-based
         messages (Sunday greeting, Monday closed) switch at Greek midnight no matter
         where the visitor's phone or laptop is.
On Input: none (reads the current clock).
On Output: Number 0..6  (0 = Sunday, 1 = Monday, ... 6 = Saturday).
Used by: renderDailyHighlights, initSundayGreeting.
---------------------*/
function getAthensDayIndex() {
    const name = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Europe/Athens' });
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(name);
}

/*-------------------
Purpose: Remove HTML from a menu text: <br> becomes a space, other tags disappear,
         spaces are collapsed.
On Input: t - String (may contain HTML) or anything falsy.
On Output: String, plain text.
Used by: splitDishText, buildMenuSchema (same logic as tools/generate-dish-pages.js).
---------------------*/
function stripHtml(t) {
    return String(t || '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/*-------------------
Purpose: Split a menu text "Name (description)" into its two parts.
On Input: t - String, e.g. "Παστίτσιο (Με χειροποίητη μπεσαμέλ)".
On Output: Object { name, desc }; desc is '' when there are no brackets.
---------------------*/
function splitDishText(t) {
    const c = stripHtml(t);
    const m = c.match(/^(.*?)\s*\((.*)\)\s*$/);
    return m ? { name: m[1].trim(), desc: m[2].trim() } : { name: c, desc: '' };
}

/*-------------------
Purpose: Read a price such as "€8.50" or "8,50 €" as a number with 2 decimals.
On Input: p - String or Number.
On Output: String like "8.50", or null when no number is found.
---------------------*/
function parsePrice(p) {
    const m = String(p || '').replace(',', '.').match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]).toFixed(2) : null;
}

// ===== SOUND, NAVIGATION, LINKS =====

/*-------------------
Purpose: Play the short click sound of the buttons.
On Input: none.
On Output: none.
Notes: Null-safe (the page may have no <audio id="button-click-sound">) and silent when
       the browser blocks audio (the play() promise rejection is caught).
---------------------*/
function playButtonSound() {
    const sound = document.getElementById('button-click-sound');
    if (!sound) return;
    try {
        sound.currentTime = 0;
        const p = sound.play();
        if (p && p.catch) p.catch(() => {});
    } catch (e) { /* no sound */ }
}

/*-------------------
Purpose: Open or close the hamburger navigation menu.
On Input: none.
On Output: none.
Side effects: toggles class 'active' on .nav-menu (removes 'hide-on-load' the first time).
---------------------*/
function toggleMenu() {
    playButtonSound();
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    navMenu.classList.remove('hide-on-load');
    navMenu.classList.toggle('active');
}

/*-------------------
Purpose: Go to another page of the site (used by clickable panels that are not links).
On Input: url - String, e.g. 'matzourana_menu.html#daily-dishes'.
On Output: none (the browser navigates).
---------------------*/
function goToPage(url) {
    playButtonSound();
    window.location.href = url;
}

/*-------------------
Purpose: Open an external page (Google Maps, TripAdvisor, ...) in a new tab.
On Input: url - String.
On Output: none.
---------------------*/
function openExternal(url) {
    window.open(url, '_blank', 'noopener');
}

/*-------------------
Purpose: Open Matzourana on Google Maps in a new tab.
On Input: none. On Output: none.
---------------------*/
function gotoGoogleMaps() {
    openExternal(GOOGLE_MAPS_URL);
}

/*-------------------
Purpose: Open the Matzourana TripAdvisor page (to leave a review) in a new tab.
On Input: none. On Output: none.
---------------------*/
function gotoTripAdvisor() {
    openExternal(TRIPADVISOR_URL);
}

/*-------------------
Purpose: Open the Google Maps reviews of Matzourana in a new tab.
On Input: none. On Output: none.
---------------------*/
function gotoGoogleMapsReview() {
    openExternal(GOOGLE_MAPS_REVIEW_URL);
}

// ===== ONE-PAGE NAVIGATION (until the page split; replaced by real links) =====

/*-------------------
Purpose: Show one section of the one-page site and hide the others.
On Input: sectionId - String: 'home' | 'menu' | 'about' | 'gallery' | 'reviews' | 'contact'.
On Output: none.
Side effects: moves class 'active' to that <section>; opening 'menu' selects the
          Appetizers tab; closes/opens the hamburger menu like before.
---------------------*/
function showSection(sectionId) {
    playButtonSound();
    document.querySelectorAll('section').forEach(section => section.classList.remove('active'));
    const target = document.querySelector(`#${sectionId}`);
    if (target) target.classList.add('active');
    if (sectionId === 'menu' && typeof showMenu === 'function') showMenu('appetizers');
    toggleMenu();
}

/*-------------------
Purpose: Highlights notebook click: open the menu on the Daily Dishes tab.
On Input: none. On Output: none.
---------------------*/
function gotoDailyDishes() {
    showSection('menu');
    setTimeout(() => showMenu('daily-dishes'), 10);
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.remove('active');
}
