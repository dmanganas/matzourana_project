/* ============================================================
   matzourana_data.js – all shared DATA of the Matzourana website
   ------------------------------------------------------------
   Loaded first on every page (data → messages → utils → tools).
   Contains only data, no functions.

   ★★★★★ DAILY UPDATE ZONE (top of this file) ★★★★★
   The daily menu update edits ONLY this file:
     - currentDailyMenu   → the daily dishes table on the menu page
     - currentHighlights  → the highlights notebook on the home page
     - menuCatalog prices, when a price changes
   then runs:  node tools/generate-dish-pages.js --all --sitemap
   ============================================================ */

/* ================= DAILY UPDATE ZONE ================= */

// ★★★★★ ONLY EDIT THIS ARRAY ★★★★★  (daily dishes table: keys of menuCatalog)
const currentDailyMenu = [
    // Freshly Cooked


    //Meat
    "moschari_kokkinisto",
    "moschari_lemonato",
    "bifteki_moscharisia",

    //Chicken
    "kotopoulo_bouti",

    //Meat
    "pastitsio",
    "makaronia_kima",
    "lachanontolmades",
    "keftedakia_tiganita",

    // Soups
    "giouvarlakia",
    "kotosoupa",

    //Veggy
    "giantes",
    "melitzanes_imam",
    "fasolakia",
    "spanakorizo",

    // Legumes
    "fasolada",
    "fava"
];

// ★★★★★ Change daily highlights here ★★★★★  (home notebook: keys of highlightsCatalog)
const currentHighlights = [

    "line",
    "moschari_kokkinisto",
    "moschari_lemonato",
    "bifteki_moscharisia",

    "kotopoulo_bouti",

    "pastitsio",
    "keftedakia_tiganita",

    "giouvarlakia",
    "kotosoupa",

    "giantes",
    "melitzanes_imam",
    "fasolakia",
    "spanakorizo"
];

/* =============== END OF DAILY UPDATE ZONE =============== */


/* ============================================================
   MATZOURANA DAILY MENU - COMPLETE FRESHLY COOKED + SEAFOOD
   (catalog of every dish that can appear in the daily table)
   ============================================================ */
const menuCatalog = {
    // ==================== ΦΡΕΣΚΟΜΑΓΕΙΡΕΜΕΝΑ (All Fresh Cooked) ====================
    "freshly_cooked": { category: "freshly-cooked"},
    // ==================== ΠΙΑΤΑ ΚΡΕΑΤΙΚΩΝ ====================
    "katsikaki_naxou": { category: "meat-cooked", el: "Κατσικάκι (Νάξου) στο φούρνο <br><br> (Λεμονάτο κατσικάκι με μελωμένες πατάτες φούρνου)", en: "Roast Kid Goat (from Naxos) <br><br> (Lemony kid goat with tender oven-baked potatoes)", price: "€16.00" },
    "kokoretsi": { category: "meat-cooked", el: "Κοκορέτσι χειροποίητο <br><br> (Παραδοσιακό κοκορέτσι φτιαγμένο στο χέρι, ψημένο αργά)", en: "Handmade Kokoretsi <br><br> (Traditional hand-prepared kokoretsi, slow-roasted)", price: "€15.50" },
    "katsikaki_frikase": { category: "meat-cooked", el: "Κατσικάκι φρικασέ <br><br> (Πεντανόστιμο κατσικάκι φρικασέ με φρέσκα μαρούλια και άγρια χόρτα)", en: "Kid Goat Fricassee <br><br> (Delicious kid goat fricassee with fresh lettuce and wild greens)", price: "€16.00" },
    "arni_kotsi_frikase": { category: "meat-cooked", el: "Αρνί κότσι φρικασέ <br><br> (Τρυφερό αρνίσιο κότσι με φρέσκα μαρούλια και άγρια χόρτα)", en: "Lamb Shank Fricassee <br><br> (Tender lamb shank with fresh lettuce and seasonal wild greens)", price: "€16.00" },
    "arnaki_galaktos": { category: "meat-cooked", el: "Αρνάκι γάλακτος μακαρονάδα <br><br> (Τρυφερό αρνάκι γάλακτος σιγομαγειρεμένο με πλούσια σάλτσα)", en: "Milk-Fed Lamb Pasta <br><br> (Tender milk-fed lamb slowly cooked with rich sauce and pasta)", price: "€16.50" },
    "arni_paidaki": { category: "meat-cooked", el: "Αρνί παϊδάκι στο φούρνο <br><br> (Λεμονάτο αρνίσιο παιδάκι με μελωμένες πατάτες φούρνου)", en: "Roast Lamb Ribs <br><br> (Lemony lamb ribs with tender oven-baked potatoes)", price: "€15.50" },
    "choirino_selino": { category: "meat-cooked", el: "Χοιρινό με Σέλινο <br><br> (Αργομαγειρεμένο χοιρινό με τρυφερό σέλινο και πλούσια σάλτσα)", en: "Pork with Celery <br><br> (Slow-cooked pork with tender celery and rich warm sauce)", price: "€10.00" },
    "choirino_lemonato": { category: "meat-cooked", el: "Χοιρινό λεμονάτο <br><br> (Τρυφερό χοιρινό λεμονάτο)", en: "Lemony Pork Stew <br><br> (Tender lemony pork)", price: "€8.50" },
    "gida_vrasti": { category: "meat-cooked", el: "Γίδα βραστή <br><br> (Μια απλή, δυνατή γεύση με άρωμα βουνού)", en: "Boiled Goat <br><br> (A simple, robust flavor with a mountain aroma)", price: "€9.00" },
    "pastitsio": { category: "meat-cooked", el: "Παστίτσιο <br><br> (Με χειροποίητη μπεσαμέλ, 100% μοσχαρίσιο κιμά και ριγκατόνι)", en: "Pastitsio <br><br> (With handmade béchamel, 100% beef mince and rigatoni)", price: "€9.00" },
    "krepes_zampon_tyri": { category: "meat-cooked", el: "Κρέπες ζαμπόν-τυρί <br><br> (Κρέπες με ζαμπόν και κεφαλοτύρι στο φούρνο)", en: "Ham-Cheese Crepes <br><br> (Crepes with ham and kefalotyri baked in the oven)", price: "€7.50" },
    "krepes_kima": { category: "meat-cooked", el: "Κρέπες με κιμά και μπεσαμέλ <br><br> (Κρέπες με κιμά και μπεσαμέλ στο φούρνο)", en: "Crepes with Mince and Béchamel <br><br> (Crepes with mince and béchamel baked in the oven)", price: "€8.00" },
    "moussakas": { category: "meat-cooked", el: "Μουσακάς <br><br> (Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού, πλούσια μπεσαμέλ και ψητές μελιτζάνες)", en: "Moussaka <br><br> (With 100% beef mince from Astakou Meats, rich béchamel and roasted eggplants)", price: "€10.00" },
    "gioulmpasi": { category: "meat-cooked", el: "Γιούλμπασι στην λαδόκολλα", en: "Gioulmpasi in Greaseproof Paper", price: "€12.00" },
    "kleftiko": { category: "meat-cooked", el: "Κλέφτικο στη λαδόκολλα <br><br> (Αργοψημένο με πατάτες, πιπεριές και αρωματικά)", en: "Kleftiko in Parchment <br><br> (Slow-roasted with potatoes, peppers and Greek herbs)", price: "€9.00" },
    "papoutsakia": { category: "meat-cooked", el: "Μελιτζάνες παπουτσάκια <br><br> (Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού και βελούδινη μπεσαμέλ)", en: "Stuffed Eggplants (Papoutsakia) <br><br> (With 100% beef mince from Astakou Meats and velvety béchamel)", price: "€8.90" },
    "gemista_kima": { category: "meat-cooked", el: "Γεμιστά με κιμά <br><br> (Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού και ρύζι)", en: "Stuffed Vegetables with Mince <br><br> (With 100% beef mince from Astakou Meats and rice)", price: "€8.00" },
    "bifteki_kotopoulo": { category: "meat-cooked", el: "Μπιφτέκια κοτόπουλο στον φούρνο <br><br> (Πολύ νόστιμο και ελαφρύ)", en: "Baked Chicken Patties <br><br> (Very tasty and light)", price: "€9.50" },
    "bifteki_moscharisia": { category: "meat-cooked", el: "Μπιφτέκια Μοσχαρίσια με πατάτες στον φούρνο <br><br> (Χειροποίητα 300γρ)", en: "Oven-Baked Beef Patties with Potatoes <br><br> (Handmade 300g beef patties)", price: "€10.00" },
    "moschari_stifado": { category: "meat-cooked", el: "Μοσχαράκι Στιφάδο <br><br> (Παραδοσιακό και μοσχομυριστό)", en: "Beef Stifado <br><br> (Traditional and fragrant)", price: "€13.50" },
    "moschari_kokkinisto": { category: "meat-cooked", el: "Μοσχάρι κοκκινιστό <br><br> (Τρυφερό μοσχαράκι χτένι από Κρέατα Αστακού)", en: "Beef in Red Sauce <br><br> (Tender beef shank from Astakou Meats)", price: "€12.00" },
    "moschari_ragout": { category: "meat-cooked", el: "Μοσχάρι ραγού <br><br> (Τρυφερό μοσχαράκι κοκκινιστό με πατάτες ραγού)", en: "Beef Ragout <br><br> (Tender beef in red sauce with potato ragout)", price: "€10.50" },
    "moschari_giouvesti": { category: "meat-cooked", el: "Μοσχάρι Γιουβέτσι <br><br> (Παραδοσιακό μοσχαράκι γιουβέτσι με τριμμένη μυζήθρα)", en: "Beef Giouvetsi <br><br> (Traditional beef giouvetsi with grated myzithra)", price: "€12.50" },
    "moschari_lemonato": { category: "meat-cooked", el: "Μοσχαράκι λεμονάτο <br><br> (Τρυφερό μοσχάρι χτένι λεμονάτο)", en: "Lemony Beef Stew <br><br> (Tender lemony beef shank)", price: "€12.00" },
    "rolo_moscharisio": { category: "meat-cooked", el: "Ρολό μοσχαρίσιου κιμά <br><br> (Ρολό 100% μοσχαρίσιου κιμά γεμιστό με φέτα ΠΟΠ)", en: "Beef Roll <br><br> (100% beef roll stuffed with PDO goat feta)", price: "€11.00" },
    "rolo_kotopoulo": { category: "meat-cooked", el: "Ρολό κοτόπουλο γεμιστό <br><br> (Με μπέικον, γραβιέρα, πιπεριές και πατάτες φούρνου)", en: "Stuffed Chicken Roll <br><br> (With bacon, graviera, peppers and oven-baked potatoes)", price: "€10.00" },
    "moscharaki_noua": { category: "meat-cooked", el: "Μοσχαράκι νουά <br><br> (Ζουμερό μοσχαράκι νουά σιγοψημένο με κολοκύθια και καρότα)", en: "Beef Tenderloin Roast <br><br> (Juicy beef tenderloin slow-roasted with zucchini and carrots)", price: "€12.50" },
    "moscharaki_noua_with_fried_potatoes": { category: "meat-cooked", el: "Μοσχαράκι νουά με τηγανητές πατάτες <br><br> (Ζουμερό μοσχαράκι νουά σιγοψημένο με τηγανητές πατάτες)", en: "Beef Tenderloin Roast with Fried Potatoes <br><br> (Juicy beef tenderloin slow-roasted with fried potatoes)", price: "€12.50" },
    "moscharaki_noua_with_rice": { category: "meat-cooked", el: "Μοσχαράκι νουά με ρύζι <br><br> (Ζουμερό μοσχαράκι νουά σιγοψημένο με ρύζι)", en: "Beef Tenderloin Roast with Rice <br><br> (Juicy beef tenderloin slow-roasted with rice)", price: "€12.50" },
    "choirino_damaskina": { category: "meat-cooked", el: "Χοιρινό με δαμάσκηνα <br><br> (Ζουμερό χοιρινό με πιπεριές, γλυκοπατάτες και γλυκά δαμάσκηνα)", en: "Pork with Prunes <br><br> (Juicy pork with peppers, sweet potatoes and sweet prunes)", price: "€11.00" },
    "keftedakia_saltsa": { category: "meat-cooked", el: "Κεφτεδάκια με σάλτσα <br><br> (Μυρωδάτα τηγανητά κεφτεδάκια σε σπιτική σάλτσα ντομάτας)", en: "Meatballs in Tomato Sauce <br><br> (Fragrant fried meatballs slow-cooked in homemade tomato sauce)", price: "€9.00" },
    "keftedakia_tiganita": { category: "meat-cooked", el: "Κεφτεδάκια τηγανιτά <br><br> (Τα μυρωδάτα κεφτεδάκια της μαμάς)", en: "Fried Meatballs <br><br> (Mom’s fragrant meatballs, fried fresh upon order)", price: "€9.00" },
    "kotopoulo_kokkinisto": { category: "meat-cooked", el: "Κοτόπουλο κοκκινιστό Ελευθέρας βοσκής <br><br> (Παραδοσιακό κοτόπουλο Ελευθέρας βοσκής από την Ναύπακτο)", en: "Free-Range Chicken in Red Sauce <br><br> (Traditional free-range chicken from Nafpaktos)", price: "€9.00" },
    "kotopoulo_fournou": { category: "meat-cooked", el: "Κοτόπουλο στο φούρνο, ελευθέρας βοσκής", en: "Free-Range Roast Chicken", price: "€9.00" },
    
    "kotopoulo_bouti": { category: "meat-cooked", el: "Κοτόπουλο μπούτι στο φούρνο, με πατάτες <br><br> (Παραδοσιακό κοτόπουλο Ελευθέρας βοσκής από την Ναύπακτο)", en: "Oven-Baked Chicken Leg with Potatoes <br><br> (Traditional free-range chicken from Nafpaktos)", price: "€9.00" },
    "kotopoulo_frikase": { category: "meat-cooked", el: "Κοτόπουλο φρικασέ <br><br> (Κοτόπουλο ελευθέρας βοσκής φρικασέ με φρέσκα μαρούλια και άγρια χόρτα)", en: "Chicken Fricassee <br><br> (Free-range chicken fricassee with fresh lettuce and wild greens)", price: "€9.50" },

    "choirines_brizoles": { category: "meat-cooked", el: "Χοιρινές Μπριζόλες με πατάτες", en: "Pork Chops with Potatoes", price: "€10.20" },
    "kokoras_krasatos": { category: "meat-cooked", el: "Κόκορας κρασάτος <br><br> (Από εκλεκτά κοτόπουλα Ναυπάκτου)", en: "Rooster in Wine Sauce <br><br> (From select Nafpaktos chickens)", price: "€9.50" },
    "kokoras_hilopites": { category: "meat-cooked", el: "Κόκορας με χωριάτικες χυλοπίτες", en: "Rooster with Country-Style Pasta (Hilopites)", price: "€9.50" },
    "kokoras_stifado": { category: "meat-cooked", el: "Κόκορας Στιφάδο <br><br> (Μυρωδάτος και αργομαγειρεμένος)", en: "Rooster Stifado <br><br> (Fragrant and slow-cooked)", price: "€10.00" },
    "kanelonia": { category: "meat-cooked", el: "Κανελόνια με κιμά <br><br> (Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού)", en: "Cannelloni with Mince <br><br> (With 100% beef mince from Astakou Meats)", price: "€8.00" },
    "soutzoukakia": { category: "meat-cooked", el: "Σουτζουκάκια Σμυρνέικα <br><br> (Χειροποίητα με 100% μοσχαρίσιο κιμά)", en: "Smyrna-Style Soutzoukakia <br><br> (Handmade with 100% beef mince)", price: "€9.00" },
    "spetzofai": { category: "meat-cooked", el: "Σπετζοφάϊ με βόειο λουκάνικο <br><br> (Με χωριάτικο λουκάνικο Σερρών, ντομάτα και πιπεριές)", en: "Spetzofai with Beef Sausage <br><br> (With rustic Serres sausage, tomato and peppers)", price: "€8.00" },
    "lachanontolmades": { category: "meat-cooked", el: "Λαχανοντολμάδες <br><br> (Χειροποίητοι με κρεμώδες αυγολέμονο)", en: "Cabbage Rolls <br><br> (Handmade with creamy egg-lemon sauce)", price: "€9.00" },
    "kolokythakia_gemista": { category: "meat-cooked", el: "Κολοκυθάκια γεμιστά με κιμά αυγολέμονο <br><br> (Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού)", en: "Stuffed Zucchini with Meat & Egg-Lemon Sauce <br><br> (With 100% beef mince from Astakou Meats)", price: "€9.50" },
    "makaronia_kima": { category: "meat-cooked", el: "Μακαρόνια με κιμά (Μπολονέζ) <br><br> (Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού)", en: "Spaghetti with Minced Meat (Bolognese) <br><br> (With 100% beef mince from Astakou Meats)", price: "€9.00" },
    "carbonara": { category: "meat-cooked", el: "Καρμπονάρα <br><br> (Με αυγά, κρέμα γάλακτος, μπέικον και παρμεζάνα)", en: "Carbonara <br><br> (With eggs, cream, bacon and parmesan)", price: "€8.00" },

    // ==================== ΠΙΑΤΑ ΛΑΧΑΝΙΚΩΝ ====================
    "moussakas_nistisimos": { category: "veg-cooked", el: "Μουσακάς Νηστίσιμος <br><br> (Μουσακάς χωρίς κρέας, με κιμά σόγιας, ψητές μελιτζάνες και πατάτες)", en: "Vegan Moussaka <br><br> (Made without meat, using soy mince, roasted eggplants and potatoes)", price: "€8.50" },
    "briam": { category: "veg-cooked", el: "Μπριάμ <br><br> (Με μελιτζάνες, κολοκυθάκια, πολύχρωμες πιπεριές και πατάτες)", en: "Briam <br><br> (With eggplants, courgettes, colorful peppers and potatoes)", price: "€7.00" },
    "giantes": { category: "veg-cooked", el: "Γίγαντες φασόλια <br><br> (Γίγαντες Πλακί - Στη γάστρα)", en: "Giant Beans <br><br> (Gigantes Plaki - Baked in a clay pot)", price: "€7.50" },
    "melitzanes_yiahni": { category: "veg-cooked", el: "Μελιτζάνες και πατάτες Γιαχνί <br><br> (Μελιτζάνες και πατάτες μαγειρεμένες σε σάλτσα ντομάτας)", en: "Eggplants and Potatoes Yiahni <br><br> (Eggplants and potatoes cooked in tomato sauce)", price: "€6.00" },
    "patates_yiahni": { category: "veg-cooked", el: "Πατάτες Γιαχνί <br><br> (Πατάτες μαγειρεμένες σε σάλτσα ντομάτας)", en: "Potatoes Yiahni <br><br> (Potatoes cooked in tomato sauce)", price: "€5.50" },
    "melitzanes_imam": { category: "veg-cooked", el: "Μελιτζάνες ιμάμ με φέτα ΠΟΠ <br><br> (Τσακώνικες μελιτζάνες με σάλτσα ντομάτας και τριμμένη φέτα)", en: "Imam Eggplants with PDO Feta <br><br> (Tsakonian eggplants with tomato sauce and grated PDO feta)", price: "€7.00" },
    "gemista": { category: "veg-cooked", el: "Γεμιστά <br><br> (Ντομάτα και πιπεριά με πλιγούρι, μυρωδικά και πατατούλες)", en: "Stuffed Vegetables <br><br> (Tomato and pepper with bulgur, herbs and potatoes)", price: "€8.00" },
    "gemista_rice": { category: "veg-cooked", el: "Γεμιστά με ρύζι <br><br> (Ντομάτα και πιπεριά με ρύζι, μυρωδικά και πατατούλες)", en: "Stuffed Vegetables with Rice <br><br> (Tomato and pepper with rice, herbs and potatoes)", price: "€7.50" },
    "gemista_superfoods": { category: "veg-cooked", el: "Γεμιστά με superfoods <br><br> (Σταφίδες, κουκουνάρι, κράνμπερι, καρύδια)", en: "Stuffed Vegetables with Superfoods <br><br> (Raisins, pine nuts, cranberries, walnuts)", price: "€8.50" },
    "anginares_polita": { category: "veg-cooked", el: "Αγγινάρες φρέσκιες αλά πολίτα <br><br> (Με φρέσκιες αγγινάρες και λεμονάτες πατάτες)", en: "Fresh Artichokes à la Polita <br><br> (With fresh artichokes and lemony potatoes)", price: "€9.00" },
    "manitaria_frikase": { category: "veg-cooked", el: "Μανιτάρια Φρικασέ <br><br> (Έκρηξη γεύσης με αρωματικά χόρτα)", en: "Mushroom Fricassee <br><br> (An explosion of flavor with aromatic herbs)", price: "€7.50" },
    "revithia_frikase": { category: "veg-cooked", el: "Ρεβύθια Φρικασέ <br><br> (Vegan συνταγή, εύκολη και πολύ υγιεινή)", en: "Chickpea Fricassee <br><br> (Vegan recipe, easy and very healthy)", price: "€7.50" },
    "arakas_lemonatos": { category: "veg-cooked", el: "Αρακάς λεμονάτος <br><br> (Με πατάτες, καρότο και άνιθο)", en: "Lemony Peas <br><br> (With potatoes, carrot and dill)", price: "€6.50" },
    "fasolakia": { category: "veg-cooked", el: "Φρέσκα Φασολάκια λαδερά <br><br> (Με ντοματούλα και πατάτες)", en: "Fresh Green Beans in Olive Oil <br><br> (With tomato and potatoes)", price: "€6.50" },
    "bamies_fournou": { category: "veg-cooked", el: "Μπάμιες στο Φούρνο <br><br> (Φρέσκες με ντοματούλα)", en: "Baked Okra <br><br> (Fresh with tomato)", price: "€7.50" },
    "bamies_yiahni": { category: "veg-cooked", el: "Μπάμιες Γιαχνί <br><br> (Φρέσκες μαγειρεμένες με ντοματούλα)", en: "Okra Stew <br><br> (Fresh slow-cooked with tomato)", price: "€7.50" },
    "spanakorizo": { category: "veg-cooked", el: "Σπανακόρυζο <br><br> (Λεμονάτο με ντομάτα και φρέσκο άνηθο)", en: "Spinach Rice <br><br> (Lemony with tomato and fresh dill)", price: "€5.50" },
    "kounoupidi_yiahni": { category: "veg-cooked", el: "Κουνουπίδι Γιαχνί <br><br> (Με ντοματούλα και κανέλα)", en: "Stewed Cauliflower Yiahni <br><br> (With tomato and cinnamon)", price: "€6.00" },
    "manitaria_stifado": { category: "veg-cooked", el: "Μανιτάρια Στιφάδο <br><br> (Ένας μοναδικός τρόπος να απολαύσετε τα μανιτάρια)", en: "Mushroom Stifado <br><br> (A unique way to enjoy mushrooms)", price: "€8.50" },
    "makaronia_vegan": { category: "veg-cooked", el: "Μακαρόνια με φυτικό κιμά vegan (Vegan Μπολονέζ)", en: "Vegan Spaghetti with Plant-Based Mince", price: "€8.00" },

    // ==================== ΘΑΛΑΣΣΙΝΑ ====================
    "spaghetti_garides_egaio": { category: "seafood", el: "Σπαγγέτι με γαριδούλες Αιγαίου σε σάλτσα ντομάτας <br><br> (Με φρέσκια ντομάτα. Μία γεύση θαλασσινής απόλαυσης)", en: "Spaghetti with Aegean Shrimps in Tomato Sauce <br><br> (With fresh tomato. A taste of seaside delight)", price: "€9.50" },
    "spaghetti_thalassina": { category: "seafood", el: "Σπαγγέτι με σάλτσα θαλασσινών <br><br> (Με φρέσκια ντομάτα. Μία γεύση θαλασσινής απόλαυσης)", en: "Spaghetti with Seafood Sauce <br><br> (With fresh tomato. A taste of seaside delight)", price: "€11.00" },
    "spaghetti_calamari": { category: "seafood", el: "Σπαγγέτι με καλαμαράκια <br><br> (Τρυφερά καλαμαράκια μαγειρεμένα σε πλούσια σάλτσα ντομάτας με αρωματικά βότανα και ελαιόλαδο)", en: "Spaghetti with Calamari <br><br> (Tender calamari cooked in a rich tomato sauce with aromatic herbs and olive oil)", price: "€9.50" },
    "bakaliaros_spetsiota": { category: "seafood", el: "Μπακαλιάρος παστός α λα σπετσιώτα με πατάτες <br><br> (Με πατάτες, φρέσκια ντομάτα και ματζουράνα. Ένα ξεχωριστό πιάτο για τους λάτρεις των θαλασσινών)", en: "Salted Cod Spetsiota with Potatoes <br><br> (With potatoes, fresh tomato, and marjoram. A unique dish for seafood lovers)", price: "€13.00" },
    "sfirida_spetsiota": { category: "seafood", el: "Σφυρίδα α λα σπετσιώτα με πατάτες <br><br> (Φρέσκια σφυρίδα μαγειρεμένη με πατάτες, φρέσκια ντομάτα και αρωματική ματζουράνα. Ένα εκλεκτό πιάτο με πλούσια, μεσογειακή γεύση)", en: "Grouper Spetsiota with Potatoes <br><br> (Fresh grouper cooked with potatoes, fresh tomato and aromatic marjoram. A delicious Mediterranean seafood dish)", price: "€16.00" },
    "galeos_spetsiota": { category: "seafood", el: "Γαλέος α λα σπετσιώτα με πατάτες <br><br> (Φρέσκος γαλέος μαγειρεμένος με πατάτες, φρέσκια ντομάτα και ματζουράνα. Ένα ξεχωριστό πιάτο για τους λάτρεις των θαλασσινών)", en: "Galeos Spetsiota with Potatoes <br><br> (Fresh galeos cooked with potatoes, fresh tomato, and marjoram. A unique dish for seafood lovers)", price: "€9.50" },
    "bakaliaros_lemonatos": { category: "seafood", el: "Μπακαλιάρος λεμονάτος <br><br> (Τρυφερός μπακαλιάρος μαγειρεμένος με λεμόνι, ελαιόλαδο και αρωματικά, προσφέροντας μια δροσερή και ισορροπημένη γεύση)", en: "Lemon Cod <br><br> (Tender cod cooked with lemon, olive oil, and aromatic herbs, offering a fresh and well-balanced flavor)", price: "€12.50" },
    "galeos_lemonatos": { category: "seafood", el: "Γαλέος λεμονάτος <br><br> (Τρυφερός φρέσκος γαλέος μαγειρεμένος με λεμόνι, ελαιόλαδο και αρωματικά, προσφέροντας μια δροσερή και ισορροπημένη γεύση)", en: "Lemon Galeos <br><br> (Tender fresh galeos cooked with lemon, olive oil, and aromatic herbs, offering a fresh and well-balanced flavor)", price: "€11.00" },

    "bakaliaros_plaki": { category: "seafood", el: "Μπακαλιάρος Πλακί <br><br> (Με πατάτες, φρέσκια ντομάτα, κρεμμύδι και μυρωδικά ψημένα στον φούρνο. Παραδοσιακό ελληνικό πιάτο θαλασσινών)", en: "Bakaliaros Plaki (Baked Cod) <br><br> (With potatoes, fresh tomato, onion, and herbs baked in the oven. A traditional Greek seafood dish)", price: "€12.50" },
    "bakaliaros_skordalia": { category: "seafood", el: "Μπακαλιάρος με σκορδαλιά <br><br> (Τραγανός τηγανητός μπακαλιάρος, σερβιρισμένος με παραδοσιακή σκορδαλιά. Κλασική ελληνική γεύση της 25ης Μαρτίου)", en: "Fried Cod with Garlic Dip <br><br> (Crispy fried cod served with traditional garlic dip. A classic Greek flavor for March 25th)", price: "€12.80" },
    "bakaliarokroketes": { category: "seafood", el: "Μπακαλιαροκροκέτες <br><br> (Τραγανές κροκέτες μπακαλιάρου, σερβιρισμένες με σκορδαλιά ή σως λεμονιού)", en: "Cod Fritters <br><br> (Crispy cod fritters served with garlic dip or lemon sauce)", price: "€9.50" },
    "lachanontolmades_thalassina": { category: "seafood", el: "Λαχανοντολμάδες Θαλασσινών <br><br> (Χειροποίητοι, με γαρίδες, καλαμάρι και ρύζι, σε ελαφριά σάλτσα λεμονιού και άνηθο)", en: "Seafood Stuffed Cabbage Rolls <br><br> (Handmade, with shrimp, squid and rice, in a light lemon-dill sauce)", price: "€10.00" },
    "ratza_katsarola": { category: "seafood", el: "Ράτζα στην Κατσαρόλα <br><br> (Φρέσκο σαλάχι/βάτος σιγομαγειρεμένο σε αρωματική σάλτσα, που αναδεικνύει τη χαρακτηριστική ζελατινώδη υφή του ψαριού)", en: "Ray Fish Stew <br><br> (Slow-cooked ray in an aromatic sauce, highlighting its unique gelatinous texture)", price: "€12.50" },
    "tsipoures_pelagisies": { category: "seafood", el: "Πελαγίσιες Τσιπούρες <br><br> (Με φρέσκο ψάρι στο φούρνο με πατάτες)", en: "Wild Gilthead Seabream <br><br> (Fresh fish oven-baked with potatoes)", price: "€13.00" },
    "spaghetti_calamari_sauce": { category: "seafood", el: "Σπαγγέτι με σάλτσα καλαμαριών <br><br> (Με φρέσκα καλαμάρια και πλούσια σάλτσα ντομάτας)", en: "Spaghetti with Calamari Sauce <br><br> (Made with fresh calamari and a rich tomato sauce)", price: "€8.00" },
    "spaghetti_garida": { category: "seafood", el: "Σπαγγέτι με σάλτσα γαρίδας <br><br> (Με φρέσκες γαρίδες και πλούσια σάλτσα ντομάτας)", en: "Spaghetti with Shrimp Sauce <br><br> (Made with fresh shrimp and a rich tomato sauce)", price: "€9.50" },
    "soupies_yiahni": { category: "seafood", el: "Φρέσκες Σουπιές γιαχνί <br><br> (Με φρέσκες σουπιές, πατάτες και ντομάτα. Μια νοστιμιά απλότητας σε ένα πιάτο)", en: "Fresh Cuttlefish Yiahni <br><br> (With fresh cuttlefish, potatoes, and tomato. A delicious simplicity in one dish)", price: "€10.00" },
    "soupies_krasates": { category: "seafood", el: "Σουπιές Κρασάτες <br><br> (Φρέσκες σουπιές μαγειρεμένες με λευκό ή κόκκινο κρασί, κρεμμύδι και αρωματικά μυρωδικά. Ένα παραδοσιακό πιάτο θαλασσινών με πλούσια γεύση)", en: "Cuttlefish in White Wine <br><br> (Fresh cuttlefish cooked with white or red wine, onion, and aromatic herbs. A traditional seafood dish with rich flavor)", price: "€10.00" },
    "soupies_spanaki": { category: "seafood", el: "Σουπιές με σπανάκι <br><br> (Τρυφερές σουπιές μαγειρεμένες με φρέσκο σπανάκι, μυρωδικά και λεμόνι. Ένα παραδοσιακό, νηστίσιμο πιάτο γεμάτο γεύση και άρωμα θάλασσας)", en: "Cuttlefish with Spinach <br><br> (Tender cuttlefish cooked with fresh spinach, herbs and a hint of lemon. A traditional seafood dish full of flavor)", price: "€10.00" },
    "oktapodi_stifado": { category: "seafood", el: "Χταπόδι στιφάδο από φρέσκο χταπόδι <br><br> (Παραδοσιακό και γεμάτο αρώματα! Με φρέσκο χταπόδι, κρεμμυδάκια και σάλτσα ντομάτας)", en: "Octopus Stifado with Fresh Octopus <br><br> (Traditional and full of aromas! With fresh octopus, small onions, and tomato sauce)", price: "€13.00" },
    "oktapodi_makaroni": { category: "seafood", el: "Χταπόδι με κοφτό μακαρονάκι <br><br> (Τρυφερό φρέσκο χταπόδι μαγειρεμένο αργά με κοφτό μακαρονάκι σε πλούσια σάλτσα ντομάτας, αρωματισμένη με βότανα και ελαιόλαδο)", en: "Octopus with Short Pasta <br><br> (Tender fresh octopus slowly cooked with short pasta in a rich tomato sauce, flavored with herbs and olive oil)", price: "€12.50" },
    "oktapodi_giouvetsi": { category: "seafood", el: "Χταπόδι γιουβέτσι από φρέσκο χταπόδι <br><br> (Παραδοσιακό και γεμάτο αρώματα! Με φρέσκο χταπόδι, κριθαράκι και πλούσια σάλτσα ντομάτας)", en: "Octopus Giouvetsi with Fresh Octopus <br><br> (Traditional and full of aromas! With fresh octopus, orzo, and a rich tomato sauce)", price: "€13.00" },
    "kritharoto_thalassina": { category: "seafood", el: "Κριθαρώτο θαλασσινών <br><br> (Κριθαρότο με γαρίδες, μύδια και μεσογειακά αρώματα. Ένα υπέροχο πιάτο με αρώματα θάλασσας!)", en: "Seafood Orzo <br><br> (Orzo with shrimps, mussels, and Mediterranean aromas. A wonderful dish with sea aromas)", price: "€13.00" },
    "kritharoto_garidoules": { category: "seafood", el: "Κριθαρότο με γαριδούλες <br><br> (Αρωματικό και κρεμώδες κριθαρότο με γαριδούλες και φυτική κρέμα γάλακτος — ελαφρύ και απολαυστικό)", en: "Shrimp Orzo <br><br> (Aromatic and creamy orzo with small shrimps and plant-based cream — light and delightful)", price: "€9.00" },
    "kritharoto_garides": { category: "seafood", el: "Κριθαρότο με γαρίδες <br><br> (Αρωματικό και κρεμώδες κριθαρότο με ζουμερές γαρίδες και φυτική κρέμα γάλακτος — ελαφρύ και απολαυστικό)", en: "Shrimp Orzo <br><br> (Aromatic and creamy orzo with juicy shrimps and plant-based cream — light and delightful)", price: "€14.50" },
    "garidoma": { category: "seafood", el: "Γαριδομακαρονάδα <br><br> (Με φρέσκια ντομάτα και ζουμερές γαρίδες σε σπιτική κόκκινη σάλτσα. Ένα ακαταμάχητος συνδυασμός με γεύση θάλασσας!)", en: "Shrimps Spaghetti <br><br> (With fresh tomato and juicy shrimps in homemade red sauce. An irresistible combination with a taste of the sea)", price: "€17.00" },
    "garidoma_small": { category: "seafood", el: "Γαριδομακαρονάδα <br><br> (Με φρέσκια ντομάτα και ζουμερές γαρίδούλες σε σπιτική κόκκινη σάλτσα. Ένα ακαταμάχητος συνδυασμός με γεύση θάλασσας!)", en: "Shrimps Spaghetti (Baby shrimps) <br><br> (With fresh tomato and juicy baby shrimps in homemade red sauce. An irresistible combination with a taste of the sea)", price: "€10.50" },
    "lavraki_fileto": { category: "seafood", el: "Λαβρακι φιλέτο στο φούρνο <br><br> (Φιλέτο από φρέσκο λαβράκι, ψημένο στο φούρνο με πατάτες και λεμόνι, γεμάτο με μεσογειακή γεύση!)", en: "Oven-Baked Sea Bass Fillet <br><br> (Fillet of fresh sea bass, oven-baked with potatoes and lemon, bursting with Mediterranean flavor)", price: "€13.00" },
    "mydopilafo": { category: "seafood", el: "Μυδοπίλαφο <br><br> (Με φρέσκα μύδια και υπέροχη γεύση, όλος ο χρόνος μοιάζει καλοκαίρι!)", en: "Mussel Pilaf <br><br> (With fresh mussels and a wonderful taste, every season feels like summer)", price: "€10.00" },
    "marinara": { category: "seafood", el: "Μαρινάρα με Σπαγγέτι <br><br> (Ένα πιάτο θαλασσινών που αιχμαλωτίζει τη φρεσκάδα του καλοκαιριού και την αίσθηση της θάλασσας)", en: "Marinara Spaghetti <br><br> (A seafood dish that captures the freshness of summer and the feeling of the sea)", price: "€9.50" },
    "sardeles_fileto_plaki": { category: "seafood", el: "Σαρδέλες Φιλέτο Πλακί <br><br> (Με φρέσκια ντομάτα και μυρωδικά, στη γάστρα για έξτρα νοστιμιά!)", en: "Sardines Fillet Plaki <br><br> (With fresh tomato and herbs, baked in a clay pot for extra deliciousness)", price: "€9.00" },
    "gavros_plaki": { category: "seafood", el: "Γαύρος φρέσκος πλακί <br><br> (Με φρέσκια ντομάτα και μυρωδικά, στη γάστρα για έξτρα νοστιμιά!)", en: "Fresh Baked Anchovies <br><br> (With fresh tomato and herbs, baked in a clay pot for extra deliciousness)", price: "€9.00" },
    "ksifias_lemonatos": { category: "seafood", el: "Ξιφίας λεμονάτος <br><br> (Τρυφερός ξιφίας μαγειρεμένος με λεμόνι, ελαιόλαδο και αρωματικά, προσφέροντας μια δροσερή και ισορροπημένη γεύση)", en: "Swordfish in Lemon Sauce <br><br> (Tender swordfish cooked with lemon, olive oil, and aromatic herbs, offering a fresh and well-balanced flavor)", price: "€15.50" },
    "gavros_lemonatos": { category: "seafood", el: "Γαύρος φρέσκος λεμονάτος <br><br> (Με φρέσκο λεμόνι, ελαιόλαδο και μυρωδικά!)", en: "Fresh Anchovies with Lemon <br><br> (With fresh lemon, olive oil, and herbs)", price: "€9.00" },
    "perka_plaki": { category: "seafood", el: "Πέρκα πλακί <br><br> (Με φρέσκια ντομάτα και μυρωδικά, στη γάστρα για έξτρα νοστιμιά!)", en: "Baked Perch <br><br> (With fresh tomato and herbs, baked in a clay pot for extra deliciousness)", price: "€10.00" },
    "perka_lemonati": { category: "seafood", el: "Πέρκα Λεμονάτη <br><br> (Με φρέσκο λεμόνι και μυρωδικά, στη γάστρα για έξτρα νοστιμιά!)", en: "Lemon Perch <br><br> (With fresh lemon and herbs, baked in a clay pot for extra deliciousness)", price: "€12.50" },
    "glossa_lemonati": { category: "seafood", el: "Γλώσσα Λεμονάτη με πατάτες <br><br> (Φιλέτο γλώσσας μαγειρεμένο με φρέσκο λεμόνι, ελαιόλαδο και αρωματικά μυρωδικά, σερβιρισμένο με πατάτες)", en: "Lemon Sole in Lemon Sauce with Potatoes <br><br> (Sole fillet cooked with fresh lemon, olive oil, and aromatic herbs, served with potatoes)", price: "€9.00" },
    "peskandritsa_plaki": { category: "seafood", el: "Πεσκανδρίτσα πλακί <br><br> (Φρέσκια πεσκανδρίτσα μαγειρεμένη με ντομάτα, κρεμμύδι και αρωματικά μυρωδικά, ψημένη στη γάστρα για πλούσια γεύση και άρωμα θάλασσας)", en: "Monkfish Plaki <br><br> (Fresh monkfish cooked with tomato, onion and aromatic herbs, baked in a clay pot for rich flavor and a true taste of the sea)", price: "€15.00" },

    // ==================== ΣΟΥΠΕΣ ====================
    "patsas_vrastos": { category: "soups", el: "Πατσάς βραστός <br><br> (Με μοσχάρι, λεμονάτος)", en: "Boiled Tripe Soup <br><br> (With beef, lemony)", price: "€10.00" },
    "patsas_anamiktos": { category: "soups", el: "Πατσάς ανάμικτος <br><br> (Με μοσχάρι και αρνί, λεμονάτος)", en: "Mixed Tripe Soup <br><br> (With beef and lamb)", price: "€10.00" },
    "kotosoupa": { category: "soups", el: "Κοτόσουπα <br><br> (Θρεπτική και πολύ νόστιμη)", en: "Chicken Soup <br><br> (Nutritious and very tasty)", price: "€8.00" },
    "kreatosoupa": { category: "soups", el: "Κρεατόσουπα <br><br> (Με μοσχάρι, πατάτα, καρότο και σέλινο)", en: "Meat Soup <br><br> (With beef, potato, carrot and celery)", price: "€10.00" },
    "borscht": { category: "soups", el: "Σούπα Μπορς (Μπόρστ) <br><br> (Με μοσχάρι, λάχανο και παντζάρι)", en: "Borscht Soup <br><br> (With beef, cabbage and beetroot)", price: "€8.00" },
    "psarosoupa": { category: "soups", el: "Ψαρόσουπα με φρέσκο ψάρι", en: "Fish Soup with Fresh Fish", price: "€9.00" },
    "magiritsa": { category: "soups", el: "Μαγειρίτσα <br><br> (Κλασική πασχαλινή σούπα με αρνί και αυγολέμονο)", en: "Magiritsa <br><br> (Classic Easter soup with lamb and egg-lemon sauce)", price: "€10.00" },
    "giouvarlakia": { category: "soups", el: "Γιουβαρλάκια <br><br> (Με 100% μοσχαρίσιο κιμά)", en: "Meatball Egg-Lemon Soup", price: "€8.50" },
    "hortosoupa_trahanas": { category: "soups", el: "Χορτόσουπα με τραχανά", en: "Vegetable Soup with Trahana", price: "€5.50" },
    "manitarosoupa": { category: "soups", el: "Μανιταρόσουπα <br><br> (Γήινη ζεστή σούπα μανιταριών)", en: "Mushroom Soup <br><br> (Earthy warm mushroom soup)", price: "€8.00" },

    // ==================== ΟΣΠΡΙΑ ====================
    "fakes": { category: "legumes", el: "Φακές <br><br> (Δυναμωτικές και νόστιμες)", en: "Lentil Soup <br><br> (Energizing and delicious)", price: "€5.00" },
    "fasolada": { category: "legumes", el: "Φασολάδα <br><br> (Χυλωμένη και ασυναγώνιστη)", en: "Fasolada (Bean Soup) <br><br> (Creamy and unrivaled)", price: "€5.00" },
    "revithia": { category: "legumes", el: "Ρεβύθια <br><br> (Για όσους προσέχουν τη διατροφή τους)", en: "Chickpea Stew", price: "€6.00" },
    "fava": { category: "legumes", el: "Φάβα <br><br> (Γευστική, δυναμωτική και απολαυστική)", en: "Fava <br><br> (Flavorful, energizing, and delightful)", price: "€5.50" },
    "fakes_kokkines": { category: "legumes", el: "Κόκκινες Φακές <br><br> (Ζεστή, βελούδινη σούπα από κόκκινες φακές, θρεπτική και γεμάτη γεύση)", en: "Red Lentil Soup <br><br> (A warm, velvety red lentil soup, nourishing and full of flavor)", price: "€5.50" },

    // ==================== ΓΛΥΚΑ (SWEETS) ====================
    "halvas": { category: "sweets", el: "Χαλβάς", en: "Halvas", price: "€4.00" },
    "cheesecake": { category: "sweets", el: "Cheese Cake", en: "Cheese Cake", price: "€4.50" },
    "sokolatopita": { category: "sweets", el: "Σοκολατόπιτα", en: "Chocolate Pie", price: "€4.00" },
    "lemonopita": { category: "sweets", el: "Λεμονόπιτα", en: "Lemon Pie", price: "€4.00" },
    "profiterole": { category: "sweets", el: "Προφιτερόλ", en: "Profiterole", price: "€5.00" }
    
};

// ==================== DISH IMAGE MAP ====================
// Connects catalog keys to actual image files + rich alt texts
const dishImageMap = {
    "moschari_kokkinisto": {
        file: "web/greek-dish-1.webp",
        alt: "Μοσχάρι κοκκινιστό - Τρυφερό μοσχαράκι χτένι (κρέατα Αστακού) με γαρνιτούρα | Beef in Red Sauce - Tender beef shank from Astakou Meats"
    },
    "lachanontolmades": {
        file: "web/greek-dish-40.webp",
        alt: "Λαχανοντολμάδες - Χειροποίητοι με κρεμώδες αυγολέμονο και φρέσκο άνηθο | Cabbage Rolls - Handmade with creamy egg-lemon sauce and fresh dill"
    },
    "moussakas": {
        file: "web/greek-dish-3.webp",
        alt: "Μουσακάς - Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού, πλούσια μπεσαμέλ | Moussaka - With 100% beef mince from Astakou Meats, rich béchamel"
    },
    "pastitsio": {
        file: "web/greek-dish-4.webp",
        alt: "Παστίτσιο - Με χειροποίητη μπεσαμέλ, 100% μοσχαρίσιο κιμά και ριγκατόνι | Pastitsio - With handmade béchamel, 100% beef mince and rigatoni"
    },
    "giantes": {
        file: "web/greek-dish-6.webp",
        alt: "Γίγαντες φασόλια - Παραδοσιακοί πλακί, ψημένοι στη γάστρα | Giant Beans Plaki - Traditional, baked in a clay pot"
    },
    "kokoras_krasatos": {
        file: "web/greek-dish-8.webp",
        alt: "Κόκορας κρασάτος - Αργομαγειρεμένος, πλούσιος και παραδοσιακός | Rooster in Wine Sauce - Slow-cooked, rich and traditional"
    },
    "kritharoto_garides": {
        file: "web/greek-dish-18.webp",
        alt: "Κριθαρώτο με γαρίδες - Αρωματικό και κρεμώδες | Shrimp Orzo - Aromatic and creamy"
    },
    "briam": {
        file: "web/greek-dish-22.webp",
        alt: "Μπριάμ - Μελιτζάνες, κολοκυθάκια, πιπεριές, πατάτες και ντομάτα | Briam - Eggplants, courgettes, peppers, potatoes and tomato"
    },
    "rolo_moscharisio": {
        file: "web/greek-dish-24.webp",
        alt: "Ρολό μοσχαρίσιου κιμά - Γεμιστό με φέτα ΠΟΠ και ντοματούλα | Beef Roll - Stuffed with PDO goat feta and tomato"
    },
    "keftedakia_tiganita": {
        file: "web/greek-dish-14.webp",
        alt: "Κεφτεδάκια τηγανιτά - Μυρωδάτα και τραγανά | Fried Meatballs - Aromatic and crispy"
    },
    "giouvarlakia": {
        file: "web/greek-dish-16.webp",
        alt: "Γιουβαρλάκια - Με 100% μοσχαρίσιο κιμά και αυγολέμονο | Giouvarlakia - With 100% beef mince in egg-lemon sauce"
    },
    "kotopoulo_bouti": {
        file: "web/greek-dish-25.webp",
        alt: "Κοτόπουλο μπούτι στο φούρνο με πατάτες - Ζουμερό μπούτι κοτόπουλου ψημένο με πατάτες | Oven-Baked Chicken Leg with Potatoes - Juicy oven-baked chicken leg with potatoes"
    },
    "melitzanes_imam": {
        file: "web/greek-dish-26.webp",
        alt: "Μελιτζάνες ιμάμ με φέτα ΠΟΠ - Τσακώνικες μελιτζάνες με σάλτσα ντομάτας και τριμμένη φέτα | Imam Eggplants with PDO Feta - Tsakonian eggplants with tomato sauce and grated PDO feta"
    },
    "glossa_lemonati": {
        file: "web/greek-dish-27.webp",
        alt: "Γλώσσα Λεμονάτη με πατάτες - Φιλέτο γλώσσας μαγειρεμένο με φρέσκο λεμόνι, ελαιόλαδο και αρωματικά μυρωδικά | Lemon Sole in Lemon Sauce with Potatoes - Sole fillet cooked with fresh lemon, olive oil, and aromatic herbs"
    },
    "moscharaki_noua": {
        file: "web/greek-dish-28.webp",
        alt: "Μοσχαράκι νουά - Ζουμερό μοσχαράκι νουά σιγοψημένο με κολοκύθια και καρότα | Beef Tenderloin Roast - Juicy beef tenderloin slow-roasted with zucchini and carrots"
    },
    "moschari_lemonato": {
        file: "web/greek-dish-29.webp",
        alt: "Μοσχαράκι λεμονάτο - Τρυφερό μοσχάρι χτένι λεμονάτο | Lemony Beef Stew - Tender lemony beef shank"
    },
    "moschari_giouvesti": {
        file: "web/greek-dish-30.webp",
        alt: "Μοσχάρι Γιουβέτσι - Παραδοσιακό μοσχαράκι γιουβέτσι με τριμμένη μυζήθρα | Beef Giouvetsi - Traditional beef giouvetsi with grated myzithra"
    },
    "moscharaki_noua_with_fried_potatoes": {
        file: "web/greek-dish-31.webp",
        alt: "Μοσχαράκι νουά με τηγανητές πατάτες - Ζουμερό μοσχαράκι νουά σιγοψημένο με τηγανητές πατάτες | Beef Tenderloin Roast with Fried Potatoes - Juicy beef tenderloin slow-roasted with fried potatoes"
    },

    "arakas_lemonatos": {
        file: "web/greek-dish-33.webp",
        alt: "Αρακάς λεμονάτος - Με πατάτες, καρότο και άνιθο | Lemony Peas - With potatoes, carrot and dill"
    },
    "bakaliaros_spetsiota": {
        file: "web/greek-dish-34.webp",
        alt: "Μπακαλιάρος παστός α λα σπετσιώτα με πατάτες - Με πατάτες, φρέσκια ντομάτα και ματζουράνα | Salted Cod Spetsiota with Potatoes - With potatoes, fresh tomato and marjoram"
    },
    "soutzoukakia": {
        file: "web/greek-dish-35.webp",
        alt: "Σουτζουκάκια Σμυρνέικα - Χειροποίητα με 100% μοσχαρίσιο κιμά | Smyrna-Style Soutzoukakia - Handmade with 100% beef mince"
    },
    "oktapodi_stifado": {
        file: "web/greek-dish-36.webp",
        alt: "Χταπόδι στιφάδο από φρέσκο χταπόδι - Με κρεμμυδάκια και σάλτσα ντομάτας | Octopus Stifado with Fresh Octopus - With small onions and tomato sauce"
    },
    "choirines_brizoles": {
        file: "web/greek-dish-13.webp",
        alt: "Χοιρινές Μπριζόλες με πατάτες - Ζουμερή ψητή χοιρινή μπριζόλα με πατάτες | Pork Chops with Potatoes - Juicy grilled pork chop with potatoes"
    },
    "gemista": {
        file: "web/greek-dish-39.webp",
        alt: "Γεμιστά - Ντομάτα και πιπεριά με πλιγούρι, μυρωδικά και πατατούλες | Stuffed Vegetables - Tomato and pepper with bulgur, herbs and potatoes"
    },
    "mydopilafo": {
        file: "web/greek-dish-41.webp",
        alt: "Μυδοπίλαφο - Με φρέσκα μύδια, ρύζι και άνηθο | Mussel Pilaf - With fresh mussels, rice and dill"
    },
    "katsikaki_naxou": {
        file: "web/greek-dish-43.webp",
        alt: "Κατσικάκι (Νάξου) στο φούρνο - Λεμονάτο ψητό κατσικάκι | Roast Kid Goat (from Naxos) - Lemony oven-roasted kid goat"
    },
    "papoutsakia": {
        file: "web/greek-dish-44.webp",
        alt: "Μελιτζάνες παπουτσάκια - Με 100% μοσχαρίσιο κιμά και βελούδινη μπεσαμέλ, Matzourana Καλλιθέα | Stuffed Eggplants (Papoutsakia) - With 100% beef mince and velvety béchamel, Matzourana Kallithea"
    },
    "fasolada": {
        file: "web/greek-dish-45.webp",
        alt: "Φασολάδα - Χυλωμένη παραδοσιακή φασολάδα, Matzourana Καλλιθέα | Fasolada (Bean Soup) - Creamy traditional Greek bean soup, Matzourana Kallithea"
    },
    "kolokythakia_gemista": {
        file: "web/greek-dish-46.webp",
        alt: "Κολοκυθάκια γεμιστά με κιμά αυγολέμονο - Με 100% μοσχαρίσιο κιμά, πατάτες και άνηθο, Matzourana Καλλιθέα | Stuffed Zucchini with Meat & Egg-Lemon Sauce - With 100% beef mince, potatoes and dill, Matzourana Kallithea"
    },
    "moschari_stifado": {
        file: "web/greek-dish-47.webp",
        alt: "Μοσχαράκι Στιφάδο - Τρυφερό μοσχάρι με κρεμμυδάκια σε κόκκινη σάλτσα, Matzourana Καλλιθέα | Beef Stifado - Tender beef with small onions in red sauce, Matzourana Kallithea"
    },
    "gavros_plaki": {
        file: "web/greek-dish-48.webp",
        alt: "Γαύρος φρέσκος πλακί - Με φρέσκια ντομάτα, ελαιόλαδο και μυρωδικά, Matzourana Καλλιθέα | Fresh Baked Anchovies - With fresh tomato, olive oil and herbs, Matzourana Kallithea"
    },
    "ksifias_lemonatos": {
        file: "web/greek-dish-38.webp",
        alt: "Ξιφίας λεμονάτος - Τρυφερός ξιφίας με λεμόνι, ελαιόλαδο και αρωματικά, με πατάτες και ψητή ντομάτα | Swordfish in Lemon Sauce - Tender swordfish with lemon, olive oil and aromatic herbs, with potatoes and roasted tomato"
    },
    
    // Add more mappings here when you add new photos
};

// ==================== DISH PAGES WITHOUT A PHOTO ====================
// Catalog keys that keep their published dish page (dishes/<slug>/) although they have no
// correct photo yet. The page shows no dish photo; og:image falls back to the site OG image.
// When a real photo is added to dishImageMap, remove the key from here.
const dishPagesNoPhoto = [
    "moscharaki_noua_with_rice"   // greek-dish-32 was a copy of 28 (no rice) - removed 2026-10-20
];

// ==================== DISH VIDEOS ====================
// Daily-dish videos by catalog key (menu page exhibition, left panel)
const dishVideoCatalog = {
    "fasolada": {
        src: "Videos/dish-video-1.mp4",
        titleEl: "Φασολάδα – Χυλωμένη και ασυναγώνιστη",
        titleEn: "Fasolada – Creamy bean soup"
    },
    "moschari_giouvesti": {
        src: "Videos/dish-video-2.mp4",
        titleEl: "Μοσχάρι Γιουβέτσι – Με τριμμένη μυζήθρα",
        titleEn: "Beef Giouvetsi – With grated myzithra"
    },
    "giouvarlakia": {
        src: "Videos/dish-video-3.mp4",
        titleEl: "Γιουβαρλάκια – Με αυγολέμονο",
        titleEn: "Giouvarlakia – With egg-lemon sauce"
    },
    "moschari_stifado": {
        src: "Videos/dish-video-4.mp4",
        titleEl: "Μοσχάρι στιφάδο",
        titleEn: "Beef Stifado"
    },
    "moussakas": {
        src: "Videos/dish-video-5.mp4",
        titleEl: "Μουσακάς – Με μοσχαρίσιο κιμά και μπεσαμέλ",
        titleEn: "Moussaka – With beef mince and béchamel"
    },
    "fasolakia": {
        src: "Videos/dish-video-6.mp4",
        titleEl: "Φρέσκα φασολάκια",
        titleEn: "Fresh green beans"
    },
    "pastitsio": {
        src: "Videos/dish-video-7.mp4",
        titleEl: "Παστίτσιο – Χειροποίητο με μπεσαμέλ",
        titleEn: "Pastitsio – Handmade with béchamel"
    },
    "moschari_lemonato": {
        src: "Videos/dish-video-8.mp4",
        titleEl: "Μοσχαράκι λεμονάτο – Τρυφερό χτένι",
        titleEn: "Lemony Beef Stew – Tender shank"
    },
    "sardeles_plaki": {
        src: "Videos/dish-video-9.mp4",
        titleEl: "Σαρδέλες πλακί / Γαύρος πλακί",
        titleEn: "Sardines Plaki / Anchovy Plaki"
    },
    "papoutsakia": {
        src: "Videos/dish-video-10.mp4",
        titleEl: "Μελιτζάνες παπουτσάκια",
        titleEn: "Stuffed Eggplants (Papoutsakia)"
    },
    "kolokythakia_gemista": {
        src: "Videos/dish-video-11.mp4",
        titleEl: "Κολοκυθάκια γεμιστά",
        titleEn: "Stuffed Courgettes"
    },
    "kokoras_krasatos": {
        src: "Videos/dish-video-12.mp4",
        titleEl: "Κόκορας κρασάτος",
        titleEn: "Rooster in Wine Sauce"
    },
    "kokoras_hilopites": {
        src: "Videos/dish-video-12.mp4",
        titleEl: "Κόκορας με χυλοπίτες",
        titleEn: "Rooster with Hilopites"
    },
    "kotopoulo_bouti": {
        src: "Videos/dish-video-13.mp4",
        titleEl: "Κοτόπουλο μπούτι στο φούρνο",
        titleEn: "Oven-Baked Chicken Leg"
    },
    "kotopoulo_fournou": {
        src: "Videos/dish-video-13.mp4",
        titleEl: "Κοτόπουλο στο φούρνο",
        titleEn: "Roast Chicken"
    },
    "kotosoupa": {
        src: "Videos/dish-video-14.mp4",
        titleEl: "Κοτόσουπα",
        titleEn: "Chicken Soup"
    },
    "giantes": {
        src: "Videos/dish-video-15.mp4",
        titleEl: "Γίγαντες φασόλια",
        titleEn: "Giant Beans"
    },
    "mydopilafo": {
        src: "Videos/dish-video-16.mp4",
        titleEl: "Μυδοπίλαφο",
        titleEn: "Mussel Pilaf"
    },
    "choirino_frikase": {
        src: "Videos/dish-video-17.mp4",
        titleEl: "Χοιρινό φρικασέ",
        titleEn: "Pork Fricassee"
    },
    "moschari_kokkinisto": {
        src: "Videos/dish-video-18.mp4",
        titleEl: "Μοσχάρι κοκκινιστό",
        titleEn: "Beef in Red Sauce"
    },
    "gemista": {
        src: "Videos/dish-video-19.mp4",
        titleEl: "Γεμιστά",
        titleEn: "Stuffed Vegetables"
    },
    "gemista_superfoods": {
        src: "Videos/dish-video-19.mp4",
        titleEl: "Γεμιστά με superfoods",
        titleEn: "Stuffed Vegetables with Superfoods"
    },
    "bifteki_moscharisia": {
        src: "Videos/dish-video-20.mp4",
        titleEl: "Μπιφτέκι στο φούρνο",
        titleEn: "Oven-Baked Beef Patty"
    },
    "soutzoukakia": {
        src: "Videos/dish-video-21.mp4",
        titleEl: "Σουτζουκάκια Σμυρνέικα",
        titleEn: "Smyrna-Style Soutzoukakia"
    },
    "psita": {
        src: "Videos/dish-video-22.mp4",
        titleEl: "Ψητά",
        titleEn: "Grilled Dishes",
        alwaysShow: true          // ← always visible
    },
    "giantes": {
        src: "Videos/dish-video-23.mp4",
        titleEl: "Γίγαντες φασόλια",
        titleEn: "Giant Beans"
    },
    "lachanodolmades": {
        src: "Videos/dish-video-24.mp4",
        titleEl: "Λαχανοντολμάδες",
        titleEn: "Cabbage Rolls"
    },
    "katsiki_galaktos": {
        src: "Videos/dish-video-25.mp4",
        titleEl: "Κατσίκι γάλακτος στο φούρνο",
        titleEn: "Milk-Fed Kid Goat (Oven)"
    }
};

// Making-of videos (menu page exhibition, right panel)
const makingVideoCatalog = [
    {
        src: "Videos/dish-video-making-01.mp4",
        titleEl: "Σουτζουκάκια από την Matzourana",
        titleEn: "Making Matzourana Soutzoukakia"
    },
    {
        src: "Videos/dish-video-making-02.mp4",
        titleEl: "Κολοκυθάκια Γεμιστά από την Matzourana",
        titleEn: "Making Matzourana Stuffed Courgettes"
    },
    {
        src: "Videos/dish-video-making-03.mp4",
        titleEl: "Μπιφτέκια Φούρνου από την Matzourana",
        titleEn: "Making Matzourana Oven-Baked Patties"
    },
    {
        src: "Videos/dish-video-making-04.mp4",
        titleEl: "Γνωρίστε τις Καλλιτεχνικές Φιγούρες της Matzourana",
        titleEn: "Meet the Matzourana Artistic Girls"
    },
    {
        src: "Videos/dish-video-making-05.mp4",
        titleEl: "Γνωρίστε τις Καλλιτεχνικές Φιγούρες της Matzourana",
        titleEn: "Meet the Matzourana Artistic Girls"
    }
];

// ==================== HIGHLIGHTS NOTEBOOK (home) ====================
const highlightsCatalog = {

    "line": {
        icons:[],
        el: "<br><br> ",
        en: "<br><br>"
    },
    // ==================== MEAT ====================
    "moschari_giouvesti": {
        icons: ["dish/meat.png", "dish/ozro.png"],
        el: "Μοσχάρι <br> Γιουβέτσι",
        en: "Beef <br> Giouvetsi"
    },
    "moschari_lemonato": {
        icons: ["dish/meat.png", "dish/lemonbeef.png"],
        el: "Μοσχαράκι <br> Λεμονάτο",
        en: "Lemony <br> Beef Stew"
    },
    "moschari_kokkinisto": {
        icons: ["dish/meat.png", "dish/redbeef.png"],
        el: "Μοσχάρι <br> Κοκκινιστό",
        en: "Beef <br> in Red Sauce"
    },
    "moschari_stifado": {
        icons: ["dish/meat.png", "dish/onion.png"],
        el: "Μοσχάρι <br> Στιφάδο",
        en: "Beef <br> Stifado"
    },
    "arnaki_galaktos": {
        icons: ["dish/sheep.png", "dish/oven.png"],
        el: "Αρνάκι <br> γάλακτος",
        en: "Milk-Fed <br> Lamb"
    },
    "bifteki_moscharisia": {
        icons: ["dish/patties.png", "dish/pattiesoven.png"],
        el: "Μπιφτέκια <br> Μοσχαρίσια",
        en: "Oven-Baked <br> Beef Patties"
    },
    "soutzoukakia": {
        icons: ["dish/meat.png", "dish/patties.png"],
        el: "Σουτζουκάκια <br> Σμυρνέικα",
        en: "Smyrna-Style <br> Soutzoukakia"
    },
    "keftedakia_saltsa": {
        icons: ["dish/meatballsred.png", "dish/tomato.png"],
        el: "Κεφτεδάκια <br> με σάλτσα",
        en: "Meatballs <br> in Tomato Sauce"
    },
    "keftedakia_tiganita": {
        icons: ["dish/meat.png", "dish/pan.png"],
        el: "Κεφτεδάκια  <br> τηγανιτά",
        en: "Fried <br> Meatballs"
    },
    "moscharaki_noua": {
        icons: ["dish/meat.png", "dish/ragout.png"],
        el: "Μοσχαράκι <br> νουά",
        en: "Beef  <br> Tenderloin <br> Roast"
    },
    "choirino_lemonato": {
        icons: ["dish/meat.png", "dish/lemon.png"],
        el: "Χοιρινό <br> Λεμονάτο",
        en: "Lemony <br> Pork Stew"
    },
    "arni_paidaki": {
        icons: ["dish/sheep.png", "dish/oven.png"],
        el: "Αρνί <br> παϊδάκι <br> στο φούρνο",
        en: "Roast <br> Lamb Ribs"
    },



    

    // ==================== POULTRY ====================
    "kotopoulo_bouti": {
        icons: ["dish/chicken.png", "dish/lemon.png"],
        el: "Κοτόπουλο <br> μπούτι <br> λεμονάτο",
        en: "Lemon <br> Chicken Leg"
    },
    "kotopoulo_kokkinisto": {
        icons: ["dish/chicken.png", "dish/tomato.png"],
        el: "Κοτόπουλο <br> κοκκινιστό",
        en: "Free-Range Chicken <br> in Red Sauce"
    },
    "kotopoulo_fournou": {
        icons: ["dish/chicken.png", "dish/oven.png"],
        el: "Κοτόπουλο <br> στο φούρνο",
        en: "Roast <br> Chicken"
    },
    "kokoras_krasatos": {
        icons: ["dish/chicken.png", "dish/wine.png"],
        el: "Κόκορας <br> κρασάτος",
        en: "Rooster <br> in Wine Sauce"
    },
    "kotopoulo_frikase": {
        icons: ["dish/chicken.png", "dish/frikase.png"],
        el: "Κοτόπουλο <br> φρικασέ",
        en: "Chicken <br> Fricassee"
    },


    // ==================== VEGETARIAN ====================
    "papoutsakia": {
        icons: ["dish/eggplant.png", "dish/shoes.png"],
        el: "Μελιτζάνες <br> παπουτσάκια",
        en: "Stuffed <br> Eggplants"
    },
    "melitzanes_imam": {
        icons: ["dish/eggplant.png", "dish/imam.png"],
        el: "Μελιτζάνες <br> ιμάμ",
        en: "Imam <br> Eggplants"
    },
    "gemista_superfoods": {
        icons: ["dish/tomatopepper.png", "dish/stuffed.png"],
        el: "Γεμιστά <br> με superfoods",
        en: "Stuffed Vegetables <br> with Superfoods"
    },
    "spanakorizo": {
        icons: ["dish/plant.png", "dish/spinachrice.png"],
        el: "Σπανακόρυζο",
        en: "Spinach <br> Rice"
    },
    "fasolakia": {
        icons: ["dish/beans.png", "dish/oliveoil.png"],
        el: "Φρέσκα <br> Φασολάκια",
        en: "Fresh <br> Green Beans"
    },
    "giantes": {
        icons: ["dish/giants.png", "dish/tomato.png"],
        el: "Γίγαντες <br> Φασόλια",
        en: "Giant <br> Beans"
    },
    "briam": {
        icons: ["dish/eggplant.png", "dish/briam.png"],
        el: "Μπριάμ",
        en: "Briam"
    },
    "arakas": {
        icons: ["dish/peas.png", "dish/oliveoil.png"],
        el: "Αρακάς <br> λεμονάτος",
        en: "Lemony <br> Peas"
    },
    "moussakas_nistisimos": {
        icons: ["dish/mousakas.png", "dish/plant.png"],
        el: "Μουσακάς <br> Νηστίσιμος",
        en: "Vegan <br> Moussaka"
    },
    "moussakas": {
        icons: ["dish/mousakas.png", "dish/meat.png"],
       el: "Μουσακάς",
       en: "Moussakas"
    },
    "pastitsio": {
        icons: ["dish/pastitsio.png", "dish/macaroni.png"],
        el: "Παστίτσιο",
        en: "Pastitsio"
    },
     "bamies_fournou": {
        icons: ["dish/okra.png", "dish/okraoven.png"],
        el: "Μπάμιες <br> στο Φούρνο ",
        en: "Baked  <br> Okra"
    },

    // ==================== SOUP ====================
    "kotosoupa": {
        icons: ["dish/chicken.png", "dish/girl-soup-tight.png"],
        el: "Κοτόσουπα",
        en: "Chicken <br> Soup"
    },
    "giouvarlakia": {
        icons: ["dish/meat.png", "dish/girl-soup-tight.png"],
        el: "Γιουβαρλάκια",
        en: "Meatball <br> Egg-Lemon Soup"
    },
    "patsas_vrastos": {
        icons: ["dish/meat.png", "dish/girl-soup-tight.png"],
        el: "Πατσάς <br> βραστός",
        en: "Boiled <br> Tripe Soup"
    },
    "magiritsa": {
        icons: ["dish/meat.png", "dish/girl-soup-tight.png"],
        el: "Μαγειρίτσα",
        en: "Magiritsa"
    },
    "psarosoupa": {
        icons: ["dish/fish.png", "dish/girl-soup-tight.png"],
        el: "Ψαρόσουπα",
        en: "Fish <br> Soup"
    },

    "kreatosoupa": {
        icons: ["dish/meat.png", "dish/girl-soup-tight.png"],
        el: "Κρεατόσουπα",
        en: "Meat <br> Soup"
    },

   
    // ==================== FISH / SEAFOOD ====================
    "garidoma": {
        icons: ["dish/schrimp.png", "dish/spagetti.png"],
        el: "Γαριδο- <br> μακαρονάδα",
        en: "Shrimps <br> Spaghetti"
    },
    "spaghetti_garides_egaio": {
        icons: ["dish/schrimp.png", "dish/spagetti.png"],
        el: "Γαριδο- <br> μακαρονάδα",
        en: "Shrimps <br> Spaghetti"
    },
   
    "kritharoto_garides": {
        icons: ["dish/schrimp.png", "dish/ozro.png"],
        el: "Κριθαρότο <br> με γαρίδες",
        en: "Shrimp <br> Orzo"
    },
    "oktapodi_stifado": {
        icons: ["dish/octapus.png", "dish/tomato.png"],
        el: "Χταπόδι <br> Στιφάδο",
        en: "Octopus <br> Stifado"
    },
    "oktapodi_giouvesti": {
        icons: ["dish/octapus.png", "dish/ozro.png"],
        el: "Χταπόδι <br> Γιουβέτσι",
        en: "Octopus <br> Giouvetsi"
    },

    "soupies_yiahni": {
        icons: ["dish/cuttlefishstew.png", "dish/tomato.png"],
        el: "Φρέσκες <br> Σουπιές <br> γιαχνί",
        en: "Fresh <br> Cuttlefish <br> Yiahni"
    },
    "mydopilafo": {
        icons: ["dish/mussels.png", "dish/musselspan.png"],
        el: "Μυδοπίλαφο",
        en: "Mussel <br> Pilaf"
    },
    "bakaliaros_spetsiota": {
        icons: ["dish/fish.png", "dish/cotoven.png"],
        el: "Μπακαλιάρος <br> α λα σπετσιώτα",
        en: "Salted Cod <br> Spetsiota"
    },
    "bakaliaros_lemonatos": {
        icons: ["dish/fish.png", "dish/lemon.png"],
        el: "Μπακαλιάρος <br> λεμονάτος",
        en: "Cod <br> with Lemon"
    },
    "oktapodi_makaroni": {
        icons: ["dish/octapus.png", "dish/macaroni.png"],
        el: "Χταπόδι <br> με κοφτό <br> μακαρονάκι",
        en: "Octopus <br> with Short <br> Pasta"
    },
     
    "ksifias_lemonatos": {
        icons: ["dish/fish.png", "dish/tomato.png"],
        el: "Ξιφίας <br> λεμονάτος",
        en: "Swordfish   <br> in Lemon <br> Sauce"
    },
    "perka_lemonati": {
        icons: ["dish/fish.png", "dish/lemon.png"],
        el: "Πέρκα <br> λεμονάτη",
        en: "Perch   <br> in Lemon <br> Sauce"
    },
    //"kalo_kalokairi": {
    //    icons: ["sun-logo.png"],
    //    el: "Καλό <br> Καλοκαίρι!",
    //    en: "Have a Great <br> Summer!"
    //},
    "kalo_kalokairi": {
        icons: ["dish/sun.png"],
        el: "Ας φύγουμε <br> διακοπές! <br> Καλό <br> Καλοκαίρι! <br><br> Πάλι μαζί από τις 25/8",
        en: "Time for <br> Holidays! <br> Have a Great <br> Summer! <br><br> Back together from 25/8"
    },
    "galeos_spetsiota": {
        icons: ["dish/fish.png", "dish/cotoven.png"],
        el: "Γαλέος <br> α λα σπετσιώτα",
        en: "Galeos <br> Spetsiota"
    },
    "galeos_lemonatos": {
        icons: ["dish/fish.png", "dish/lemon.png"],
        el: "Γαλέος <br> λεμονάτος",
        en: "Galeos <br> in Lemon <br> Sauce"
    },

};

// ==================== MENU PHOTO PANEL ====================
// Photos shuffled next to the menu tables, and their bilingual alt texts ("EL | EN")
const imageList = [
    'DishImages/web/greek-dish-1.webp', 'DishImages/web/greek-dish-2.webp', 'DishImages/web/greek-dish-3.webp',
    'DishImages/web/greek-dish-4.webp', 'DishImages/web/greek-dish-5.webp', 'DishImages/web/greek-dish-6.webp',
    'DishImages/web/greek-dish-7.webp', 'DishImages/web/greek-dish-8.webp', 'DishImages/web/greek-dish-9.webp',
    'DishImages/web/greek-dish-10.webp', 'DishImages/web/greek-dish-11.webp', 'DishImages/web/greek-dish-12.webp',
    'DishImages/web/greek-dish-13.webp', 'DishImages/web/greek-dish-14.webp', 'DishImages/web/greek-dish-15.webp',
    'DishImages/web/greek-dish-16.webp', 'DishImages/web/greek-dish-17.webp', 'DishImages/web/greek-dish-18.webp',
    'DishImages/web/greek-dish-19.webp', 'DishImages/web/greek-dish-20.webp', 'DishImages/web/greek-dish-21.webp',
    'DishImages/web/greek-dish-22.webp', 'DishImages/web/greek-dish-23.webp', 'DishImages/web/greek-dish-24.webp',
    'DishImages/web/greek-dish-25.webp', 'DishImages/web/greek-dish-26.webp', 'DishImages/web/greek-dish-27.webp',
    'DishImages/web/greek-dish-28.webp', 'DishImages/web/greek-dish-29.webp', 'DishImages/web/greek-dish-30.webp',
    'DishImages/web/greek-dish-31.webp', 'DishImages/web/greek-dish-33.webp', 'DishImages/web/greek-dish-34.webp',
    'DishImages/web/greek-dish-35.webp', 'DishImages/web/greek-dish-36.webp',
    'DishImages/web/greek-dish-37.webp', 'DishImages/web/greek-dish-38.webp', 'DishImages/web/greek-dish-39.webp',
    'DishImages/web/greek-dish-40.webp', 'DishImages/web/greek-dish-41.webp', 'DishImages/web/greek-dish-42.webp',
    'DishImages/web/greek-dish-43.webp', 'DishImages/web/greek-dish-44.webp', 'DishImages/web/greek-dish-45.webp',
    'DishImages/web/greek-dish-46.webp', 'DishImages/web/greek-dish-47.webp', 'DishImages/web/greek-dish-48.webp'
];

const dishAlts = {
    'DishImages/web/greek-dish-1.webp': "Μοσχάρι κοκκινιστό - (Τρυφερό μοσχαράκι χτένι κρέατα Αστακού με γαρνιτούρα) Matzourana Eatery Καλλιθέα | Beef in Red Sauce Tender - (beef shank from Astakou Meats served with your choice of side) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-2.webp': "Λαχανοντολμάδες  - (Χειροποίητοι με κρεμώδες αυγολέμονο και φρέσκο άνηθο) Matzourana Eatery Καλλιθέα | Cabbage Rolls - (Handmade with creamy egg-lemon sauce and fresh dill) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-3.webp': "Μουσακάς - (Με 100% μοσχαρίσιο κιμά από Κρέατα Αστακού, πλούσια μπεσαμέλ, ψητές μελιτζάνες, κολοκύθια, πατάτες και τριμμένο κεφαλοτύρι) Matzourana Eatery Καλλιθέα | Moussaka - (With 100% beef mince from Astakou Meats, rich béchamel, roasted eggplants & courgettes, potatoes and grated kefalotyri) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-4.webp': "Παστίτσιο - (Με χειροποίητη μπεσαμέλ, 100% μοσχαρίσιο κιμά και ριγκατόνι - η συνταγή της επιτυχίας) Matzourana Eatery Καλλιθέα | Pastitsio - (With handmade béchamel, 100% beef mince and rigatoni – the recipe for success) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-5.webp': "Τυροκαυτερή - (Πικάντικη αλοιφή φέτας με πιπεριές) Matzourana Eatery Καλλιθέα | Spicy Feta Spread (Tyrokafteri) - (Spicy whipped feta with peppers) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-6.webp': "Γίγαντες φασόλια - (Παραδοσιακοί πλακί, ψημένοι στη γάστρα) Matzourana Eatery Καλλιθέα | Giant Beans Plaki - (Traditional, baked in a clay pot) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-7.webp': "Ντολμαδάκια γιαλατζί χειροποίητα - (Δροσερά και γευστικά) Matzourana Eatery Καλλιθέα | Handmade Vegetarian Dolmades - (Fresh and delicious) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-8.webp': "Κόκορας κρασάτος - (Αργομαγειρεμένος, πλούσιος και παραδοσιακός) Matzourana Eatery Καλλιθέα | Rooster in Wine Sauce - (Slow-cooked, rich and traditional) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-9.webp': "Σαλάτα Mexicana - (Λόλα, μαρούλι, τόνος, κόκκινα φασόλια) Matzourana Eatery Καλλιθέα | Mexicana Salad - (Lola lettuce, romaine, tuna, red beans) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-10.webp': "Παντζάρια - (Φρέσκια και γευστική παντζαροσαλάτα) Matzourana Eatery Καλλιθέα | Beetroot Salad - (Fresh and tasty beetroot salad) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-11.webp': "Μπριζόλα Μοσχαρίσια γάλακτος - (Τρυφερή και premium ψητή) Matzourana Eatery Καλλιθέα | Milk-Fed Veal Chop - (Tender premium grilled veal) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-12.webp': "Ψητά Λαχανικά - (Μελιτζάνες, κολοκυθάκια, πιπεριές και μανιτάρια) Matzourana Eatery Καλλιθέα | Grilled Vegetables - (Eggplant, courgettes, peppers & mushrooms) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-13.webp': "Μπριζόλα Χοιρινή - (Ζουμερή και τέλεια ψημένη) Matzourana Eatery Καλλιθέα | Pork Chop - (Juicy and perfectly grilled) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-14.webp': "Κεφτεδάκια τηγανιτά - (Μυρωδάτα και τραγανά) Matzourana Eatery Καλλιθέα | Fried Meatballs - (Aromatic and crispy) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-15.webp': "Φιλέτο Κοτόπουλο - (Ψητό, απαλό και γευστικό) Matzourana Eatery Καλλιθέα | Chicken Fillet - (Grilled, tender and tasty) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-16.webp': "Γιουβαρλάκια - (Με 100% μοσχαρίσιο κιμά και αυγολέμονο) Matzourana Eatery Καλλιθέα | Giouvarlakia - (With 100% beef mince in egg-lemon sauce) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-17.webp': "Caesar's σαλάτα - (Iceberg, γαλλική σαλάτα, κοτόπουλο φιλέτο, μπέικον, καλαμπόκι, κρουτόν, παρμεζάνα & χειροποίητη σως) Matzourana Eatery Καλλιθέα | Caesar Salad - (Iceberg, romaine, chicken fillet, bacon, corn, croutons, parmesan & homemade Caesar sauce) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-18.webp': "Κριθαρώτο με γαρίδες - (Αρωματικό και κρεμώδες) Matzourana Eatery Καλλιθέα | Shrimp Orzo - (Aromatic and creamy) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-19.webp': "Μπριζολάκια Χοιρινά χωρίς κόκαλο - (Ζουμερά και γευστικά) Matzourana Eatery Καλλιθέα | Boneless Pork Chops - (Juicy and flavourful) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-20.webp': "Πανδαισία γεύσεων - (Κόκορας κρασάτος, κρητικός ντάκος, χαλούμι, λαχανοντολμάδες, τυροκαυτερή, ψητά μπιφτέκια) Matzourana Eatery Καλλιθέα | Feast of authentic flavors - (Rooster in wine sauce, Cretan dakos, halloumi, cabbage rolls, spicy cheese dip, grilled patties) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-21.webp': "Ντάκος - (Τραγανός κρητικός με φέτα ΠΟΠ και τριμμένη ντομάτα) Matzourana Eatery Καλλιθέα | Dakos - (Crispy Cretan rusk with PDO feta and grated tomato) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-22.webp': "Μπριάμ - (Μελιτζάνες, κολοκυθάκια, πιπεριές, πατάτες και ντομάτα) Matzourana Eatery Καλλιθέα | Briam - (Eggplants, courgettes, peppers, potatoes and tomato) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-23.webp': "Χειροποίητοι κολοκυθοκεφτέδες - (με φρέσκο κολοκύθι, μυρωδικά και φέτα 5 τμχ.) Matzourana Eatery Καλλιθέα | Handmade zucchini fritters - (with fresh zucchini, herbs and feta 5 pcs) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-24.webp': "Ρολό μοσχαρίσιου κιμά - (Γεμιστό με φέτα ΠΟΠ και ντοματούλα, ψητό στο φούρνο) Matzourana Eatery Καλλιθέα | Beef Roll - (Stuffed with PDO goat feta and tomato, oven-baked) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-25.webp': "Κοτόπουλο μπούτι στο φούρνο με πατάτες - (Ζουμερό μπούτι κοτόπουλου ψημένο με πατάτες) Matzourana Eatery Καλλιθέα | Oven-Baked Chicken Leg with Potatoes - (Juicy oven-baked chicken leg with potatoes) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-26.webp': "Μελιτζάνες ιμάμ με φέτα ΠΟΠ - (Τσακώνικες μελιτζάνες με σάλτσα ντομάτας και τριμμένη φέτα) Matzourana Eatery Καλλιθέα | Imam Eggplants with PDO Feta - (Tsakonian eggplants with tomato sauce and grated PDO feta) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-27.webp': "Γλώσσα Λεμονάτη με πατάτες - (Φιλέτο γλώσσας μαγειρεμένο με φρέσκο λεμόνι, ελαιόλαδο και αρωματικά μυρωδικά, σερβιρισμένο με πατάτες) Matzourana Eatery Καλλιθέα | Lemon Sole in Lemon Sauce with Potatoes - (Sole fillet cooked with fresh lemon, olive oil, and aromatic herbs, served with potatoes) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-28.webp': "Μοσχαράκι νουά - (Ζουμερό μοσχαράκι νουά σιγοψημένο με κολοκύθια και καρότα) Matzourana Eatery Καλλιθέα | Beef Tenderloin Roast - (Juicy beef tenderloin slow-roasted with zucchini and carrots) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-29.webp': "Μοσχαράκι λεμονάτο - (Τρυφερό μοσχάρι χτένι λεμονάτο) Matzourana Eatery Καλλιθέα | Lemony Beef Stew - (Tender lemony beef shank) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-30.webp': "Μοσχάρι Γιουβέτσι - (Παραδοσιακό μοσχαράκι γιουβέτσι με τριμμένη μυζήθρα) Matzourana Eatery Καλλιθέα | Beef Giouvetsi - (Traditional beef giouvetsi with grated myzithra) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-31.webp': "Μοσχαράκι νουά με τηγανητές πατάτες - (Ζουμερό μοσχαράκι νουά σιγοψημένο με τηγανητές πατάτες) Matzourana Eatery Καλλιθέα | Beef Tenderloin Roast with Fried Potatoes",
    'DishImages/web/greek-dish-33.webp': "Αρακάς λεμονάτος - (Με πατάτες, καρότο και άνιθο) Matzourana Eatery Καλλιθέα | Lemony Peas - (With potatoes, carrot and dill) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-34.webp': "Μπακαλιάρος παστός α λα σπετσιώτα με πατάτες - (Με πατάτες, φρέσκια ντομάτα και ματζουράνα) Matzourana Eatery Καλλιθέα | Salted Cod Spetsiota with Potatoes - (With potatoes, fresh tomato and marjoram) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-35.webp': "Σουτζουκάκια Σμυρνέικα - (Χειροποίητα με 100% μοσχαρίσιο κιμά) Matzourana Eatery Καλλιθέα | Smyrna-Style Soutzoukakia - (Handmade with 100% beef mince) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-36.webp': "Χταπόδι στιφάδο από φρέσκο χταπόδι - (Με κρεμμυδάκια και σάλτσα ντομάτας) Matzourana Eatery Καλλιθέα | Octopus Stifado with Fresh Octopus - (With small onions and tomato sauce) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-37.webp': "Χόρτα Εποχής - (Βραστά χόρτα εποχής με ελαιόλαδο και λεμόνι) Matzourana Eatery Καλλιθέα | Seasonal Greens - (Boiled seasonal greens with olive oil and lemon) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-38.webp': "Ξιφίας λεμονάτος - (Τρυφερός ξιφίας με λεμόνι, ελαιόλαδο και αρωματικά, με πατάτες και ψητή ντομάτα) Matzourana Eatery Καλλιθέα | Swordfish in Lemon Sauce - (Tender swordfish with lemon, olive oil and aromatic herbs, with potatoes and roasted tomato) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-39.webp': "Γεμιστά - (Ντομάτα και πιπεριά με πλιγούρι, μυρωδικά και πατατούλες) Matzourana Eatery Καλλιθέα | Stuffed Vegetables - (Tomato and pepper with bulgur, herbs and potatoes) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-40.webp': "Λαχανοντολμάδες αυγολέμονο - (Χειροποίητοι με κρεμώδες αυγολέμονο και φρέσκο άνηθο) Matzourana Eatery Καλλιθέα | Cabbage Rolls with Egg-Lemon Sauce - (Handmade with creamy egg-lemon sauce and fresh dill) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-41.webp': "Μυδοπίλαφο - (Με φρέσκα μύδια, ρύζι και άνηθο) Matzourana Eatery Καλλιθέα | Mussel Pilaf - (With fresh mussels, rice and dill) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-42.webp': "Μπιφτέκι Μοσχαρίσιο Χειροποίητο - (Μπιφτέκια στη σχάρα με τηγανητές πατάτες, σαλάτα και λεμόνι) Matzourana Eatery Καλλιθέα | Homemade Beef Patty - (Grilled beef patties with fries, salad and lemon) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-43.webp': "Κατσικάκι (Νάξου) στο φούρνο - (Λεμονάτο ψητό κατσικάκι) Matzourana Eatery Καλλιθέα | Roast Kid Goat (from Naxos) - (Lemony oven-roasted kid goat) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-44.webp': "Μελιτζάνες παπουτσάκια - (Με 100% μοσχαρίσιο κιμά και βελούδινη μπεσαμέλ) Matzourana Eatery Καλλιθέα | Stuffed Eggplants (Papoutsakia) - (With 100% beef mince and velvety béchamel) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-45.webp': "Φασολάδα - (Χυλωμένη και ασυναγώνιστη) Matzourana Eatery Καλλιθέα | Fasolada (Bean Soup) - (Creamy and unrivaled) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-46.webp': "Κολοκυθάκια γεμιστά με κιμά αυγολέμονο - (Με 100% μοσχαρίσιο κιμά, πατάτες και άνηθο) Matzourana Eatery Καλλιθέα | Stuffed Zucchini with Meat & Egg-Lemon Sauce - (With 100% beef mince, potatoes and dill) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-47.webp': "Μοσχαράκι Στιφάδο - (Τρυφερό μοσχάρι με κρεμμυδάκια, παραδοσιακό και μοσχομυριστό) Matzourana Eatery Καλλιθέα | Beef Stifado - (Tender beef with small onions, traditional and fragrant) Matzourana Eatery Kallithea",
    'DishImages/web/greek-dish-48.webp': "Γαύρος φρέσκος πλακί - (Με φρέσκια ντομάτα, ελαιόλαδο και μυρωδικά) Matzourana Eatery Καλλιθέα | Fresh Baked Anchovies - (With fresh tomato, olive oil and herbs) Matzourana Eatery Kallithea"
 
};

// ==================== REVIEWS ====================
// Review texts: original + translations, and the UI strings of the
// "see original / see translation" toggle. Add future reviews here (origLang 'el' or 'en').
const reviewsData = {
    reviews: [
    { origLang: 'en', text: {
        en: 'Food is absolutely fresh and amazing, it displays the greek cuisins beyond grill food. The owners super kind and helpful and the place has a modern interior. Highly recommend!!!',
        el: 'Το φαγητό είναι απίστευτα φρέσκο και καταπληκτικό· αναδεικνύει την ελληνική κουζίνα πέρα από τα ψητά. Οι ιδιοκτήτες είναι εξαιρετικά ευγενικοί και εξυπηρετικοί και ο χώρος έχει μοντέρνα διακόσμηση. Το συστήνω ανεπιφύλακτα!!!' } },
    { origLang: 'en', text: {
        en: 'Easily the best place to eat in Kallithea with great service and the owner is the best!',
        el: 'Με διαφορά το καλύτερο μέρος για φαγητό στην Καλλιθέα, με εξαιρετική εξυπηρέτηση, και ο ιδιοκτήτης είναι ο καλύτερος!' } },
    { origLang: 'en', text: {
        en: 'Exceptional food and service!! Try soutzoukakia!! A+++',
        el: 'Εξαιρετικό φαγητό και εξυπηρέτηση!! Δοκιμάστε τα σουτζουκάκια!! A+++' } }
],
    ui: {
    el: { note: 'Μετάφραση από {lang}.', orig: 'Δες το πρωτότυπο', trans: 'Δες τη μετάφραση', origNote: 'Πρωτότυπο κείμενο ({lang}).',
          langs: { en: 'τα Αγγλικά', el: 'τα Ελληνικά' }, langsShort: { en: 'Αγγλικά', el: 'Ελληνικά' } },
    en: { note: 'Translated from {lang}.', orig: 'See original', trans: 'See translation', origNote: 'Original text ({lang}).',
          langs: { en: 'English', el: 'Greek' }, langsShort: { en: 'English', el: 'Greek' } }
}
};
