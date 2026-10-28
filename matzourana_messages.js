/* ============================================================
   matzourana_messages.js – seasonal, holiday and special messages + logo themes
   ------------------------------------------------------------
   Loaded on every page after matzourana_data.js (data → messages → utils → tools).
   Only data, no functions. Shown by renderSeasonalMessages() / applySeasonalTheme()
   in matzourana_tools.js, always in Greek time (Europe/Athens), always EL + EN.

   HOW TO SWITCH A MESSAGE ON / OFF
     enabled: true   → shows automatically whenever its rule matches (every year)
     enabled: false  → never shows
     forceOn: true   → shows NOW, whatever the date (one-offs such as "closed today")
   Preview any date (only for whoever opens the link):  ...?testDate=2027-04-30

   ENTRY FIELDS
     id        unique name                     occasion  human label
     slot      'header'  (under the logo, every page)
               'notice'  (home, above "Σημερινές Φρεσκομαγειρεμένες Προτάσεις"; up to 2)
               'specials' (home, just above the highlights notebook)
               'specialsTitle' (home, replaces the text of that heading)
     priority  higher wins in the same slot: closures 100, one-off 80, holidays 60,
               event menus 40, periods 20, seasons 10, Sunday 5
     rule      { type:'fixed',      from:'MM-DD', to:'MM-DD' }        every year (may wrap over New Year)
               { type:'once',       from:'YYYY-MM-DD', to:'YYYY-MM-DD' }
               { type:'easter',     from:-2, to:1 }                   days from Orthodox Easter Sunday
               { type:'nthWeekday', month:5, weekday:0, n:2, from:-5, to:0 }  e.g. Mother's Day
               { type:'weekly',     weekdays:[0] }                    0 = Sunday
               { type:'manual' }                                      only with forceOn
               optional showBefore: N  → announced N days early
     closesShop true → on the closed days the home notebook says "closed" (like Mondays)
     theme     'tree-love' (engraved header) | 'plain' | 'notice' (green bold) | 'urgent' (red bold)
     emoji, image (optional picture under the text), youtube (optional ['shortId', ...])
     el, en    the texts. Placeholders: {from} {to} {reopen} (dd/mm from the rule),
               {year} (year of the first day), {nextYear}, {date} (today)
   ============================================================ */

const SEASONAL_MAX_PER_SLOT = { header: 1, notice: 2, specials: 1, specialsTitle: 1 };

const seasonalMessages = [
    // ==================== SEASONS (header) ====================
    { id: 'season_autumn', occasion: 'Autumn', enabled: true, forceOn: false, slot: 'header', priority: 10,
      rule: { type: 'fixed', from: '09-01', to: '11-30' }, closesShop: false, theme: 'tree-love', emoji: '🍂', image: null, youtube: [],
      el: '🍂 Η Matzourana σας εύχεται ένα υπέροχο φθινόπωρο. 🍁 ✨',
      en: '🍂 Matzourana wishes you a wonderful autumn season. 🍁 ✨' },
    { id: 'season_winter', occasion: 'Winter', enabled: true, forceOn: false, slot: 'header', priority: 10,
      rule: { type: 'fixed', from: '12-01', to: '02-29' }, closesShop: false, theme: 'plain', emoji: '❄️', image: null, youtube: [],
      el: 'Η Matzourana σας εύχεται καλό Χειμώνα!',
      en: 'Matzourana wishes you a happy Winter season!' },
    { id: 'season_spring', occasion: 'Spring', enabled: true, forceOn: false, slot: 'header', priority: 10,
      rule: { type: 'fixed', from: '03-01', to: '05-31' }, closesShop: false, theme: 'tree-love', emoji: '🌸', image: null, youtube: [],
      el: '✨ Η Matzourana σας εύχεται μια όμορφη ανοιξιάτικη περίοδο. 🌸 ✨',
      en: '✨ Matzourana wishes you a beautiful spring season. 🌸 ✨' },
    { id: 'season_summer', occasion: 'Summer', enabled: true, forceOn: false, slot: 'header', priority: 10,
      rule: { type: 'fixed', from: '06-01', to: '08-31' }, closesShop: false, theme: 'tree-love', emoji: '☀️', image: null, youtube: [],
      el: '☀️ Η Matzourana σας εύχεται μια υπέροχη καλοκαιρινή περίοδο. 🌊 ✨',
      en: '☀️ Matzourana wishes you a wonderful summer season. 🌊 ✨' },

    // ==================== HOLIDAY GREETINGS (header) ====================
    { id: 'christmas_greeting', occasion: 'Christmas', enabled: false, forceOn: false, slot: 'header', priority: 60,
      rule: { type: 'fixed', from: '12-20', to: '12-31' }, closesShop: false, theme: 'plain', emoji: '🎄', image: null, youtube: [],
      el: 'Η Matzourana σας εύχεται καλά Χριστούγεννα!',
      en: 'Matzourana wishes you a happy Christmas season!' },
    { id: 'newyear_greeting', occasion: 'New Year', enabled: false, forceOn: false, slot: 'header', priority: 60,
      rule: { type: 'fixed', from: '01-01', to: '01-06' }, closesShop: false, theme: 'plain', emoji: '🎆', image: null, youtube: [],
      el: 'Η Matzourana σας εύχεται Ευτυχισμένο το {year}!',
      en: 'Matzourana wishes you a happy and prosperous {year}!' },
    { id: 'valentine_greeting', occasion: "Valentine's Day", enabled: false, forceOn: false, slot: 'header', priority: 60,
      rule: { type: 'fixed', from: '02-14', to: '02-14' }, closesShop: false, theme: 'tree-love', emoji: '🤍', image: null, youtube: [],
      el: "Η Matzourana σας εύχεται <br> μιά ημέρα γεμάτη <br> 'You & Me = 🤍 forever!'",
      en: 'Matzourana wishes you <br> a day full of <br> You & Me = 🤍 forever!' },
    { id: 'carnival_greeting', occasion: 'Carnival', enabled: false, forceOn: false, slot: 'header', priority: 20,
      rule: { type: 'easter', from: -70, to: -49 }, closesShop: false, theme: 'tree-love', emoji: '🎭', image: null, youtube: [],
      el: '✨ Η Matzourana σας εύχεται <br> καλή Αποκριάτικη περίοδο! 🎭 ✨',
      en: '✨ Matzourana wishes you <br> a joyful Carnival season! 🎭 ✨' },
    { id: 'lent_greeting', occasion: 'Lent', enabled: false, forceOn: false, slot: 'header', priority: 20,
      rule: { type: 'easter', from: -48, to: -8 }, closesShop: false, theme: 'tree-love', emoji: '✨', image: null, youtube: [],
      el: '✨ Η Matzourana σας εύχεται <br> Καλή Σαρακοστή! ✨',
      en: '✨ Matzourana wishes you <br> a blessed Lent! ✨' },
    { id: 'lent_spring_greeting', occasion: 'Lent + start of spring (alternative to lent_greeting)', enabled: false, forceOn: false, slot: 'header', priority: 21,
      rule: { type: 'easter', from: -48, to: -8 }, closesShop: false, theme: 'tree-love', emoji: '🌸', image: null, youtube: [],
      el: '✨ Η Matzourana σας εύχεται <br> Καλή Σαρακοστή! <br> 🌸 και ένα Καλό Ξεκίνημα Άνοιξης! 🌸 ✨',
      en: '✨ Matzourana wishes you <br> a blessed Lent! <br> 🌸 and a Happy Spring Season! 🌸 ✨' },
    { id: 'easter_greeting', occasion: 'Easter', enabled: false, forceOn: false, slot: 'header', priority: 60,
      rule: { type: 'easter', from: -7, to: 7 }, closesShop: false, theme: 'tree-love', emoji: '🕯️', image: null, youtube: [],
      el: '✨ Η Matzourana σας εύχεται <br> Καλό Πάσχα & Καλή Ανάσταση! 🕯️🌸 ✨',
      en: '✨ Matzourana wishes you <br> a Happy Easter & a Blessed Resurrection! 🕯️🌸 ✨' },

    // ==================== CLOSURES (home notice; the notebook says "closed") ====================
    { id: 'summer_closure', occasion: 'Summer holiday closure (set the dates each year)', enabled: false, forceOn: false, slot: 'notice', priority: 100,
      rule: { type: 'once', from: '2026-08-11', to: '2026-08-25', showBefore: 7 }, closesShop: true, theme: 'notice', emoji: '🌞', image: null, youtube: [],
      el: 'H Matzourana θα παραμείνει κλειστή από {from} έως {to}. Καλή ξεκούραση! Ανυπομονούμε να σας εξυπηρετήσουμε από τις {reopen}! 🌞🏖️🌴',
      en: 'Matzourana will be closed from {from} to {to}. We wish you a nice holiday period! We look forward to serving you from {reopen}! 🌞🏖️🌴' },
    { id: 'closed_today', occasion: 'Closed today (generic)', enabled: false, forceOn: false, slot: 'notice', priority: 100,
      rule: { type: 'manual' }, closesShop: true, theme: 'notice', emoji: '🌿', image: null, youtube: [],
      el: 'Η Matzourana σήμερα θα παραμείνει κλειστή. Καλή ξεκούραση! Ανυπομονούμε να σας εξυπηρετήσουμε από αύριο! 🌿',
      en: 'Matzourana will remain closed today. Enjoy your day off! We look forward to serving you tomorrow! 🌿' },
    { id: 'closed_today_exceptional', occasion: 'Exceptionally closed today', enabled: false, forceOn: false, slot: 'notice', priority: 100,
      rule: { type: 'manual' }, closesShop: true, theme: 'urgent', emoji: '🌿', image: null, youtube: [],
      el: 'Η Matzourana σήμερα εκτάκτως θα παραμείνει κλειστή. Ανυπομονούμε να σας εξυπηρετήσουμε από αύριο! 🌿',
      en: 'Matzourana will be exceptionally closed today. We look forward to serving you tomorrow! 🌿' },
    { id: 'closed_sunday_one_off', occasion: 'One-off: exceptionally closed on a Sunday (example: 14/12/2025)', enabled: false, forceOn: false, slot: 'notice', priority: 80,
      rule: { type: 'once', from: '2025-12-14', to: '2025-12-14' }, closesShop: true, theme: 'notice', emoji: '🌿', image: null, youtube: [],
      el: 'Η Matzourana σήμερα, Κυριακή {from}, εκτάκτως θα παραμείνει κλειστή. Ανυπομονούμε να σας εξυπηρετήσουμε από την Τρίτη! 🌿',
      en: 'Matzourana will be exceptionally closed today, Sunday {from}. We look forward to serving you from Tuesday! 🌿' },
    { id: 'christmas_closure', occasion: 'Christmas closure', enabled: false, forceOn: false, slot: 'notice', priority: 100,
      rule: { type: 'fixed', from: '12-25', to: '12-26', showBefore: 5 }, closesShop: true, theme: 'notice', emoji: '🎄', image: null, youtube: [],
      el: '🌿 Η Matzourana θα παραμείνει κλειστή από {from} έως {to}. Καλά Χριστούγεννα και καλή ξεκούραση! Ανυπομονούμε να σας εξυπηρετήσουμε από τις {reopen}! 🎄✨',
      en: '🌿 Matzourana will be closed from {from} to {to}. Merry Christmas and enjoy a well-deserved rest! We look forward to welcoming you from {reopen}! 🎄✨' },
    { id: 'easter_closure', occasion: 'Easter closure (Good Friday → Easter Monday)', enabled: false, forceOn: false, slot: 'notice', priority: 100,
      rule: { type: 'easter', from: -2, to: 1, showBefore: 5 }, closesShop: true, theme: 'urgent', emoji: '🐣', image: null, youtube: [],
      el: '🌿 Η Matzourana θα παραμείνει κλειστή από {from} έως {to} για το Πάσχα. Σας ευχόμαστε καλό Πάσχα και καλή ξεκούραση! Ανυπομονούμε να σας εξυπηρετήσουμε από τις {reopen}! 🐣✨',
      en: '🌿 Matzourana will be closed from {from} to {to} for Easter. We wish you a wonderful holiday and a relaxing break! We look forward to welcoming you from {reopen}! 🐣✨' },
    { id: 'newyear_closure', occasion: 'New Year closure', enabled: false, forceOn: false, slot: 'notice', priority: 100,
      rule: { type: 'fixed', from: '01-01', to: '01-02', showBefore: 4 }, closesShop: true, theme: 'plain', emoji: '✨', image: null, youtube: [],
      el: '✨ Καλή Χρονιά! 🌿 Η Matzourana θα παραμείνει κλειστή {from}–{to}. Σας ευχόμαστε ένα όμορφο ξεκίνημα στο {year} και σας περιμένουμε από {reopen}.',
      en: '✨ Happy New Year! 🌿 Matzourana will be closed on {from}–{to}. We wish you a wonderful start to {year} and look forward to welcoming you from {reopen}.' },
    { id: 'epiphany_closure', occasion: 'Epiphany closure', enabled: false, forceOn: false, slot: 'notice', priority: 100,
      rule: { type: 'fixed', from: '01-06', to: '01-06', showBefore: 2 }, closesShop: true, theme: 'notice', emoji: '✨', image: null, youtube: [],
      el: '🌿 Την ημέρα των Θεοφανείων, {from}, η Matzourana θα παραμείνει κλειστή. Ανυπομονούμε να σας εξυπηρετήσουμε από τις {reopen}! ✨',
      en: '🌿 On the occasion of Epiphany, {from}, Matzourana will remain closed. We look forward to welcoming you from {reopen}! ✨' },

    // ==================== NOTICES (home) ====================
    { id: 'christmas_music', occasion: 'Christmas music shorts', enabled: false, forceOn: false, slot: 'notice', priority: 40,
      rule: { type: 'fixed', from: '12-15', to: '01-06' }, closesShop: false, theme: 'plain', emoji: '🎵', image: null, youtube: ['i0nDRwIKk6w', 'oLalaDHkwSE'],
      el: '🎵 Για μία Χριστουγεννιάτικη μουσική μετάβαση στο {nextYear}, κάντε κλικ στις εικόνες των YouTube Short.✨',
      en: '🎵 For a Christmas musical transition into {nextYear}, click on the YouTube Short images.✨' },
    { id: 'festive_menu', occasion: 'Festive menu + Christmas shorts', enabled: false, forceOn: false, slot: 'notice', priority: 40,
      rule: { type: 'fixed', from: '12-24', to: '12-31' }, closesShop: false, theme: 'plain', emoji: '🍷', image: null, youtube: ['i0nDRwIKk6w', 'oLalaDHkwSE'],
      el: 'Για μία γευστική μετάβαση στο {nextYear}, απολαύστε σήμερα το εορταστικό μας μενού!🍷🍽️✨ Καθώς και για μια χριστουγεννιάτικη μουσική εμπειρία από τη Matzourana, κάντε κλικ στις εικόνες των YouTube Short. Καλά Χριστούγεννα και Καλή Πρωτοχρονιά! 🎄✨',
      en: 'For a flavorful transition into {nextYear}, enjoy our festive menu today!🍷🍽️✨ And for a Christmas musical experience by Matzourana, click on the YouTube Short images. Merry Christmas and Happy New Year! 🎄✨' },
    { id: 'anniversary_music', occasion: 'Spring + anniversary music shorts (give the opening date to make it fixed)', enabled: false, forceOn: false, slot: 'notice', priority: 40,
      rule: { type: 'manual' }, closesShop: false, theme: 'plain', emoji: '🎂', image: null, youtube: [],
      el: '🎵 Για μία αφηγηματική μουσική εμπειρία από τη 🌿 Matzourana, αφιερωμένη στον Ερχομό της Άνοιξης ❤️ και στην επέτειο 🎂 ενός έτους της Matzourana, κάντε κλικ στις εικόνες των YouTube Short. ✨',
      en: '🎵 For a narrative musical experience by 🌿 Matzourana, dedicated to the arrival of Spring ❤️ and the anniversary 🎂 of one year of Matzourana, click on the YouTube Short images. ✨' },

    // ==================== SPECIALS HEADING (home) ====================
    { id: 'lent_specials_title', occasion: 'Lent heading', enabled: false, forceOn: false, slot: 'specialsTitle', priority: 20,
      rule: { type: 'easter', from: -48, to: -1 }, closesShop: false, theme: 'plain', emoji: '', image: null, youtube: [],
      el: 'Σημερινές Φρεσκομαγειρεμένες και Σαρακοστιανές Προτάσεις',
      en: "Today's Freshly Cooked & Lenten Specials" },

    // ==================== EVENT MENUS & SPECIALS (home, above the notebook) ====================
    { id: 'valentine_menu', occasion: "Valentine's Day menu", enabled: false, forceOn: false, slot: 'specials', priority: 40,
      rule: { type: 'fixed', from: '02-10', to: '02-14' }, closesShop: false, theme: 'urgent', emoji: '🌹', image: null, youtube: [],
      el: '🌹🍷✨ 14/02 – Γιορτή της Αγάπης στη Matzourana: <br><br> Μοιραστείτε μοναδικές γεύσεις και ρομαντικές στιγμές σε μια ημέρα αφιερωμένη στην αγάπη. <br><br> 👉 Πατήστε στην εικόνα για να δείτε το ειδικό μενού',
      en: '🌹🍷✨ 14/02 – Celebration of Love at Matzourana: <br><br> Share exquisite flavors and romantic moments in a day dedicated to love. <br><br> 👉 Click the image to view the special menu' },
    { id: 'mothers_day_menu', occasion: "Mother's Day menu (2nd Sunday of May)", enabled: false, forceOn: false, slot: 'specials', priority: 40,
      rule: { type: 'nthWeekday', month: 5, weekday: 0, n: 2, from: -5, to: 0 }, closesShop: false, theme: 'urgent', emoji: '🌸', image: null, youtube: [],
      el: '🌸💖✨ {to} – Γιορτή της Μητέρας στη Matzourana: <br><br> Τιμήστε τη πιο ξεχωριστή γυναίκα της ζωής σας με υπέροχες γεύσεις και ζεστές οικογενειακές στιγμές σε μια ημέρα αφιερωμένη στη μητέρα. <br><br> 👉 Πατήστε στην εικόνα για να δείτε το ειδικό μενού',
      en: '🌸💖✨ {to} – Mother’s Day at Matzourana: <br><br> Celebrate the most special woman in your life with exquisite flavors and warm family moments on a day dedicated to mothers. <br><br> 👉 Click the image to view the special menu' },
    { id: 'carnival_menu', occasion: 'Carnival + Sunday menu', enabled: false, forceOn: false, slot: 'specials', priority: 40,
      rule: { type: 'easter', from: -70, to: -49 }, closesShop: false, theme: 'urgent', emoji: '🎭', image: null, youtube: [],
      el: '🎭🍷🍽️✨ Αποκριάτικο και Κυριακάτικο Μενού στη Matzourana: <br><br> Ανακαλύψτε ένα μενού εμπνευσμένο από τις γεύσεις και τα αρώματα του Καρναβαλιού, γεμάτο δημιουργικές προτάσεις και γιορτινές εκπλήξεις. <br><br> 👉 Πατήστε στην εικόνα για να δείτε το αποκριάτικο και κυριακάτικο μενού',
      en: '🎭🍷🍽️✨ Carnival & Sunday Menu at Matzourana: <br><br> Discover a menu inspired by the flavors and aromas of Carnival, filled with creative dishes and festive surprises. <br><br> 👉 Click the image to view the carnival and Sunday menu' },
    { id: 'march25_menu', occasion: '25 March seafood menu', enabled: false, forceOn: false, slot: 'specials', priority: 40,
      rule: { type: 'fixed', from: '03-20', to: '03-25' }, closesShop: false, theme: 'urgent', emoji: '🐙', image: null, youtube: [],
      el: '🐙🦑🐟✨ 25/03 – Εξαιρετικό Μενού Θαλασσινών στη Matzourana: <br><br> Γιορτάστε την 25η Μαρτίου με μοναδικές θαλασσινές γεύσεις από : ζουμερό χταπόδι 🐙, νόστιμες σουπιές 🦑, εκλεκτή πεσκανδρίτσα 🐟, φρέσκια σφυρίδα 🐟 και παραδοσιακό μπακαλιάρο 🐟. Μια απολαυστική εμπειρία γεμάτη άρωμα θάλασσας και ελληνική παράδοση. <br><br> 👉 Πατήστε στην εικόνα για να δείτε το ειδικό μενού <br><br> 𓆝 Μπακαλιάρος παστός α λα σπετσιώτα',
      en: '🐙🦑🐟✨ 25/03 – Exceptional Seafood Menu at Matzourana: <br><br> Celebrate March 25th with delicious seafood flavors from: tender octopus 🐙, flavorful cuttlefish 🦑, fine monkfish 🐟, fresh grouper 🐟 and traditional cod 🐟. A truly delightful experience inspired by the sea and Greek tradition. <br><br> 👉 Click the image to view the special menu <br><br> 𓆝 Salt Cod “Spetsiota” Style' },
    { id: 'oxi_day_specials', occasion: '28 October National Day', enabled: true, forceOn: false, slot: 'specials', priority: 40,
      rule: { type: 'fixed', from: '10-28', to: '10-28' }, closesShop: false, theme: 'urgent', emoji: '✨', image: null, youtube: [],
      el: '✨ 28/10 – Χρόνια Πολλά από τη Matzourana: <br><br> Γιορτάστε την Εθνική Επέτειο της 28ης Οκτωβρίου με παραδοσιακά σπιτικά φαγητά, μαγειρεμένα με αγάπη. Μια μέρα μνήμης, με τις γεύσεις της ελληνικής παράδοσης. <br><br> <a href="matzourana_menu.html#daily-dishes" style="color:inherit;">👉 Δείτε τα σημερινά πιάτα στο ημερήσιο μενού</a>',
      en: '✨ 28/10 – Happy National Day from Matzourana: <br><br> Celebrate the 28th of October National Day with traditional home-cooked dishes, made with love. A day of remembrance, with the flavours of Greek tradition. <br><br> <a href="matzourana_menu.html#daily-dishes" style="color:inherit;">👉 See today\'s dishes on the daily menu</a>' },
    { id: 'palm_sunday_menu', occasion: 'Palm Sunday Lenten menu', enabled: false, forceOn: false, slot: 'specials', priority: 40,
      rule: { type: 'easter', from: -10, to: -7 }, closesShop: false, theme: 'urgent', emoji: '🐟', image: null, youtube: [],
      el: '🐟✨ Κυριακή των Βαΐων – Ειδικό Νηστίσιμο Μενού στη Matzourana: <br><br> Γιορτάστε την Κυριακή των Βαΐων με εκλεκτές θαλασσινές γεύσεις: τραγανές μπακαλιαροκροκέτες 🐟, ζουμερό χταπόδι 🐙, νόστιμες σουπιές 🦑 και φρέσκα ψάρια ημέρας 🐟. Παραδοσιακές συνταγές με άρωμα θάλασσας, ιδανικές για τη νηστεία. <br><br> 👉 Πατήστε στην εικόνα για να δείτε το ειδικό μενού',
      en: '🐟✨ Palm Sunday – Special Lenten Menu at Matzourana: <br><br> Celebrate Palm Sunday with selected seafood flavors: crispy cod fritters 🐟, tender octopus 🐙, flavorful cuttlefish 🦑 and fresh fish of the day 🐟. Traditional recipes inspired by the sea, perfect for the Lenten season. <br><br> 👉 Click the image to view the special menu' },
    { id: 'spring_artwork_sunday', occasion: 'Sunday + new spring artwork short', enabled: false, forceOn: false, slot: 'specials', priority: 30,
      rule: { type: 'manual' }, closesShop: false, theme: 'urgent', emoji: '🌹', image: null, youtube: [],
      el: '🌹🍽️✨ Καλή Κυριακή! <br><br> 🎬 Δείτε παρακάτω το νέο YouTube Short για την νέα καλλιτεχνική φιγούρα της Matzourana για τον ερχομό της Άνοιξης. <br> Σύντομα και στον φυσικό χώρο!',
      en: '🌹🍽️✨ Happy Sunday! <br><br> 🎬 Check out the YouTube Short below featuring the new Matzourana Spring artwork. <br> Soon also in the physical space!' },
    { id: 'sunday_greeting', occasion: 'Every Sunday', enabled: true, forceOn: false, slot: 'specials', priority: 5,
      rule: { type: 'weekly', weekdays: [0] }, closesShop: false, theme: 'urgent', emoji: '🌹', image: null, youtube: [],
      el: '🌹🍽️✨ Καλή Κυριακή!',
      en: '🍷🍽️✨ Happy Sunday!' },
    // Easter Sunday: wins over the Sunday greeting (same slot, higher priority) instead of showing both.
    { id: 'easter_sunday_greeting', occasion: 'Easter Sunday (replaces the Sunday greeting)', enabled: false, forceOn: false, slot: 'specials', priority: 70,
      rule: { type: 'easter', from: 0, to: 0 }, closesShop: false, theme: 'urgent', emoji: '🕯️', image: null, youtube: [],
      el: '🕯️🌸✨ Χριστός Ανέστη! Καλό Πάσχα!',
      en: '🕯️🌸✨ Christ is Risen! Happy Easter!' },

    // ==================== NAME DAYS (examples, home specials) ====================
    { id: 'nameday_nikolaos', occasion: 'Αγίου Νικολάου', enabled: false, forceOn: false, slot: 'specials', priority: 60,
      rule: { type: 'fixed', from: '12-06', to: '12-06' }, closesShop: false, theme: 'urgent', emoji: '🎉', image: null, youtube: [],
      el: '🎉 Χρόνια πολλά σε όσους γιορτάζουν σήμερα, ημέρα του Αγίου Νικολάου!',
      en: '🎉 Happy name day to everyone celebrating today, Saint Nicholas day!' },
    { id: 'nameday_ioannis', occasion: 'Αγίου Ιωάννου', enabled: false, forceOn: false, slot: 'specials', priority: 60,
      rule: { type: 'fixed', from: '01-07', to: '01-07' }, closesShop: false, theme: 'urgent', emoji: '🎉', image: null, youtube: [],
      el: '🎉 Χρόνια πολλά σε όσους γιορτάζουν σήμερα, ημέρα του Αγίου Ιωάννου!',
      en: '🎉 Happy name day to everyone celebrating today, Saint John day!' },
    { id: 'nameday_panagia', occasion: 'Δεκαπενταύγουστος', enabled: false, forceOn: false, slot: 'specials', priority: 60,
      rule: { type: 'fixed', from: '08-15', to: '08-15' }, closesShop: false, theme: 'urgent', emoji: '🎉', image: null, youtube: [],
      el: '🎉 Χρόνια πολλά σε όσους γιορτάζουν σήμερα, Δεκαπενταύγουστο!',
      en: '🎉 Happy name day to everyone celebrating today, 15 August!' },
    { id: 'nameday_taxiarches', occasion: 'Ταξιαρχών', enabled: false, forceOn: false, slot: 'specials', priority: 60,
      rule: { type: 'fixed', from: '11-08', to: '11-08' }, closesShop: false, theme: 'urgent', emoji: '🎉', image: null, youtube: [],
      el: '🎉 Χρόνια πολλά σε όσους γιορτάζουν σήμερα, ημέρα των Ταξιαρχών!',
      en: '🎉 Happy name day to everyone celebrating today, Archangels Michael and Gabriel!' }
];

/* ============================================================
   SEASONAL LOGO THEMES – the header logo video (every page)
   Same enabled / priority / rule fields; the highest live theme wins.
   rotateByWeekday: true → a different video each weekday (Sunday = 1st file).
   ============================================================ */
const seasonalThemes = [
    { id: 'theme_autumn', enabled: true, priority: 10, rule: { type: 'fixed', from: '09-01', to: '11-30' }, rotateByWeekday: false,
      logoVideos: ['MatzouranaImages/matzourana-autumn-october-movie-logo.mp4'] },
    { id: 'theme_winter_december', enabled: true, priority: 10, rule: { type: 'fixed', from: '12-01', to: '12-31' }, rotateByWeekday: true,
      logoVideos: ['MatzouranaImages/matzourana-winter-december-movie-logo.mp4', 'MatzouranaImages/matzourana-winter-december-movie-logo2.mp4',
                   'MatzouranaImages/matzourana-winter-december-movie-logo3.mp4', 'MatzouranaImages/matzourana-winter-december-movie-logo4.mp4',
                   'MatzouranaImages/matzourana-winter-december-movie-logo5.mp4', 'MatzouranaImages/matzourana-winter-december-movie-logo6.mp4',
                   'MatzouranaImages/matzourana-winter-december-movie-logo7.mp4'] },
    { id: 'theme_winter_january', enabled: true, priority: 10, rule: { type: 'fixed', from: '01-01', to: '02-29' }, rotateByWeekday: true,
      logoVideos: ['MatzouranaImages/matzourana-winter-january-movie-logo.mp4', 'MatzouranaImages/matzourana-winter-january-movie-logo2.mp4',
                   'MatzouranaImages/matzourana-winter-january-movie-logo3.mp4', 'MatzouranaImages/matzourana-winter-january-movie-logo4.mp4',
                   'MatzouranaImages/matzourana-winter-january-movie-logo5.mp4', 'MatzouranaImages/matzourana-winter-january-movie-logo6.mp4',
                   'MatzouranaImages/matzourana-winter-january-movie-logo7.mp4'] },
    { id: 'theme_spring', enabled: true, priority: 10, rule: { type: 'fixed', from: '03-01', to: '05-31' }, rotateByWeekday: true,
      logoVideos: ['MatzouranaImages/matzourana-spring_2026-movie-logo1.mp4', 'MatzouranaImages/matzourana-spring_2026-movie-logo2.mp4',
                   'MatzouranaImages/matzourana-spring_2026-movie-logo3.mp4', 'MatzouranaImages/matzourana-spring_2026-movie-logo4.mp4',
                   'MatzouranaImages/matzourana-spring_2026-movie-logo5.mp4', 'MatzouranaImages/matzourana-spring_2026-movie-logo6.mp4',
                   'MatzouranaImages/matzourana-spring_2026-movie-logo7.mp4'] },
    { id: 'theme_summer', enabled: true, priority: 10, rule: { type: 'fixed', from: '06-01', to: '08-31' }, rotateByWeekday: true,
      logoVideos: ['MatzouranaImages/matzourana-summer_2026-movie-logo12.mp4', 'MatzouranaImages/matzourana-summer_2026-movie-logo13.mp4',
                   'MatzouranaImages/matzourana-summer_2026-movie-logo4.mp4', 'MatzouranaImages/matzourana-summer_2026-movie-logo8.mp4',
                   'MatzouranaImages/matzourana-summer_2026-movie-logo9.mp4', 'MatzouranaImages/matzourana-summer_2026-movie-logo10.mp4',
                   'MatzouranaImages/matzourana-summer_2026-movie-logo11.mp4'] },
    { id: 'theme_xmas', enabled: false, priority: 60, rule: { type: 'fixed', from: '12-20', to: '01-06' }, rotateByWeekday: true,
      logoVideos: ['MatzouranaImages/matzourana-xmas-movie-logo.mp4', 'MatzouranaImages/matzourana-xmas-movie-logo2.mp4',
                   'MatzouranaImages/matzourana-xmas-movie-logo3.mp4', 'MatzouranaImages/matzourana-xmas-movie-logo4.mp4',
                   'MatzouranaImages/matzourana-xmas-movie-logo5.mp4', 'MatzouranaImages/matzourana-xmas-movie-logo6.mp4',
                   'MatzouranaImages/matzourana-xmas-movie-logo7.mp4'] },
    { id: 'theme_newyear_2026', enabled: false, priority: 60, rule: { type: 'once', from: '2026-01-01', to: '2026-01-06' }, rotateByWeekday: true,
      logoVideos: ['MatzouranaImages/matzourana-2026-movie-logo5.mp4', 'MatzouranaImages/matzourana-2026-movie-logo2.mp4',
                   'MatzouranaImages/matzourana-2026-movie-logo3.mp4', 'MatzouranaImages/matzourana-2026-movie-logo4.mp4',
                   'MatzouranaImages/matzourana-2026-movie-logo1.mp4', 'MatzouranaImages/matzourana-2026-movie-logo6.mp4',
                   'MatzouranaImages/matzourana-2026-movie-logo9.mp4', 'MatzouranaImages/matzourana-2026-movie-logo8.mp4',
                   'MatzouranaImages/matzourana-2026-movie-logo7.mp4'] },
    { id: 'theme_valentine', enabled: false, priority: 60, rule: { type: 'fixed', from: '02-10', to: '02-14' }, rotateByWeekday: true,
      logoVideos: ['MatzouranaImages/valentine-2026-movie-logo1.mp4', 'MatzouranaImages/valentine-2026-movie-logo2.mp4',
                   'MatzouranaImages/valentine-2026-movie-logo3.mp4', 'MatzouranaImages/valentine-2026-movie-logo4.mp4',
                   'MatzouranaImages/valentine-2026-movie-logo5.mp4', 'MatzouranaImages/valentine-2026-movie-logo6.mp4',
                   'MatzouranaImages/valentine-2026-movie-logo7.mp4'] },
    { id: 'theme_easter', enabled: false, priority: 60, rule: { type: 'easter', from: -7, to: 7 }, rotateByWeekday: false,
      logoVideos: ['MatzouranaImages/matzourana-easter_2026-movie-logo.mp4'] }
];
