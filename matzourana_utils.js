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
          are left alone); sets the alt text of every element that carries
          data-alt-el / data-alt-en (e.g. the Music Stories thumbnails).
Used by: toggleLanguage, initPage.
---------------------*/
function applyLanguage(lang) {
    currentLang = lang === 'en' ? 'en' : 'el';
    document.documentElement.lang = currentLang;
    document.querySelectorAll('.lang').forEach(el => {
        const text = el.getAttribute('data-' + currentLang);
        if (text !== null) el.innerHTML = text;
    });
    document.querySelectorAll('[data-alt-el]').forEach(el => {
        const alt = el.getAttribute('data-alt-' + currentLang);
        if (alt !== null) el.setAttribute('alt', alt);
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
Purpose: Turn a calendar date into its 'YYYY-MM-DD' text (local calendar fields).
On Input: date - Date (a calendar day, e.g. from getAthensToday()).
On Output: String, e.g. '2027-05-02'.
Used by: isDateInRange, the ?testDate= check.
---------------------*/
function toIsoDay(date) {
    const p = n => String(n).padStart(2, '0');
    return date.getFullYear() + '-' + p(date.getMonth() + 1) + '-' + p(date.getDate());
}

/*-------------------
Purpose: Make a calendar-day Date from year, month, day (00:00, no time zone tricks).
On Input: y - Number (e.g. 2027); m - Number 1..12; d - Number 1..31 (overflow rolls on).
On Output: Date at 00:00 of that day.
---------------------*/
function makeDay(y, m, d) {
    return new Date(y, m - 1, d);
}

/*-------------------
Purpose: Return "today" as a calendar date in Greek time (Europe/Athens), so seasonal
         messages switch at Greek midnight for every visitor.
On Input: none. For previews, the URL parameter ?testDate=YYYY-MM-DD overrides today
          (only affects the visitor who opens that link).
On Output: Date object at 00:00 of today's Athens date.
Used by: getActiveMessages, getAthensDayIndex, getFormattedDate, renderDailyHighlights.
---------------------*/
function getAthensToday() {
    const m = /[?&]testDate=(\d{4})-(\d{2})-(\d{2})(?:&|$)/.exec(location.search);
    if (m) {
        const d = makeDay(+m[1], +m[2], +m[3]);
        if (toIsoDay(d) === m[1] + '-' + m[2] + '-' + m[3]) return d;   // valid calendar day only
    }
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens', year: 'numeric', month: '2-digit', day: '2-digit' })
        .formatToParts(new Date());
    const get = t => +parts.find(x => x.type === t).value;
    return makeDay(get('year'), get('month'), get('day'));
}

/*-------------------
Purpose: Move a calendar date by a number of days.
On Input: date - Date; n - Number of days (negative = earlier).
On Output: new Date (the input is not changed).
---------------------*/
function addDays(date, n) {
    return makeDay(date.getFullYear(), date.getMonth() + 1, date.getDate() + n);
}

/*-------------------
Purpose: Compute the date of Greek Orthodox Easter Sunday for a given year, so Easter,
         Lent, Carnival, Clean Monday, Palm Sunday and Holy Week messages move by
         themselves every year.
On Input: year - Number, e.g. 2027 (valid 1900..2099).
On Output: Date object for Easter Sunday at 00:00, a plain calendar date
           (e.g. 2027 → 2 May 2027).
Notes: Meeus Julian algorithm: a=y%4, b=y%7, c=y%19, d=(19c+15)%30,
       e=(2a+4b-d+34)%7, month=floor((d+e+114)/31), day=((d+e+114)%31)+1 (Julian),
       then +13 days to convert Julian → Gregorian.
Used by: resolveRuleRange (rule.type 'easter').
---------------------*/
function getOrthodoxEaster(year) {
    const a = year % 4, b = year % 7, c = year % 19;
    const d = (19 * c + 15) % 30;
    const e = (2 * a + 4 * b - d + 34) % 7;
    const month = Math.floor((d + e + 114) / 31);
    const day = ((d + e + 114) % 31) + 1;
    return makeDay(year, month, day + 13);
}

/*-------------------
Purpose: Find the n-th given weekday of a month (e.g. Mother's Day = 2nd Sunday of May).
On Input: year - Number; month - Number 1..12; weekday - Number 0..6 (0 = Sunday);
          n - Number 1..5.
On Output: Date at 00:00 of that day.
---------------------*/
function nthWeekdayOfMonth(year, month, weekday, n) {
    const first = makeDay(year, month, 1);
    const offset = (weekday - first.getDay() + 7) % 7;
    return makeDay(year, month, 1 + offset + (n - 1) * 7);
}

/*-------------------
Purpose: Tell whether a calendar day falls inside a from..to range (both days included).
On Input: date - Date (calendar day, usually getAthensToday());
          from - Date, first day of the range;
          to   - Date, last day of the range.
On Output: Boolean - true if from <= date <= to (compared as Y-M-D, time ignored).
Notes: Compares 'YYYY-MM-DD' strings, so time zones and daylight saving can't
       shift a day. Yearly MM-DD ranges (also those that wrap over New Year) are turned
       into real dates by resolveRuleRange first.
---------------------*/
function isDateInRange(date, from, to) {
    const d = toIsoDay(date);
    return toIsoDay(from) <= d && d <= toIsoDay(to);
}

/*-------------------
Purpose: Write a date as day/month for messages.
On Input: date - Date.
On Output: String 'dd/mm', e.g. '14/04'.
---------------------*/
function formatDayMonth(date) {
    return String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0');
}

/*-------------------
Purpose: Fill the {placeholders} of a message text.
On Input: text - String with e.g. {from}, {to}, {reopen}, {year}, {nextYear}, {date};
          values - Object { from:'14/04', ... }.
On Output: String with every known placeholder replaced (unknown ones stay as they are).
---------------------*/
function fillPlaceholders(text, values) {
    return String(text).replace(/\{(\w+)\}/g, (all, key) => (values && values[key] !== undefined ? values[key] : all));
}

/*-------------------
Purpose: Today's date as readable text in the given language, in Greek time
         (follows ?testDate= previews).
On Input: lang - String, 'el' for Greek, anything else for English.
On Output: String, e.g. "9 Αυγούστου 2025" or "August 9, 2025".
---------------------*/
function getFormattedDate(lang) {
    return getAthensToday().toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/*-------------------
Purpose: Return today's weekday number in Greek time (Europe/Athens), so day-based
         messages (Sunday greeting, Monday closed) switch at Greek midnight no matter
         where the visitor's phone or laptop is.
On Input: none (reads the clock, or ?testDate=).
On Output: Number 0..6  (0 = Sunday, 1 = Monday, ... 6 = Saturday).
Notes: Built on getAthensToday(), so ?testDate= previews also drive Monday/Sunday.
Used by: renderDailyHighlights, isShopClosedToday, applySeasonalTheme, isAthensSunday, isAthensMonday.
---------------------*/
function getAthensDayIndex() {
    return getAthensToday().getDay();
}

/*-------------------
Purpose: Is it Sunday in Greece today?
On Input: none. On Output: Boolean.
---------------------*/
function isAthensSunday() {
    return getAthensDayIndex() === 0;
}

/*-------------------
Purpose: Is it Monday (closed day) in Greece today?
On Input: none. On Output: Boolean.
---------------------*/
function isAthensMonday() {
    return getAthensDayIndex() === 1;
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
Purpose: Split a menu text "Name (description)" into its two parts. When the text has a
         <br> ("Name <br><br> (description)"), the name is the part before it, so names with
         their own brackets (e.g. "Κατσικάκι (Νάξου) στο φούρνο") stay whole.
On Input: t - String, e.g. "Παστίτσιο <br><br> (Με χειροποίητη μπεσαμέλ)".
On Output: Object { name, desc }; desc is '' when there are no brackets.
---------------------*/
function splitDishText(t) {
    const raw = String(t || '');
    const br = raw.search(/<br\s*\/?>/i);
    if (br >= 0) {
        const rest = stripHtml(raw.slice(br));
        const mb = rest.match(/^\((.*)\)$/);
        return { name: stripHtml(raw.slice(0, br)), desc: (mb ? mb[1] : rest).trim() };
    }
    const c = stripHtml(raw);
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

// ===== OLD ONE-PAGE LINKS =====

/*-------------------
Purpose: Where each former home-page section lives now (the site used to be one page
         with #sections; old shared links like /#menu must keep working).
---------------------*/
const SECTION_PAGES = {
    menu: 'matzourana_menu.html',
    gallery: 'matzourana_gallery.html',
    reviews: 'matzourana_reviews.html',
    about: 'matzourana_about.html',
    contact: 'matzourana_contact.html',
    'daily-dishes': 'matzourana_menu.html#daily-dishes'
};

/*-------------------
Purpose: Keep old shared links working: /#menu, /#gallery, /#reviews, /#about,
         /#contact (and /#daily-dishes) are sent to their own page.
On Input: none (reads location.hash).
On Output: Boolean - true when the browser is being sent to another page.
Side effects: location.replace (no extra history entry, the Back button still works).
Used by: initPage() on the home page.
---------------------*/
function redirectOldAnchors() {
    const id = decodeURIComponent((location.hash || '').slice(1));
    if (id && SECTION_PAGES[id]) { location.replace(SECTION_PAGES[id]); return true; }
    return false;
}
