#!/usr/bin/env node
/*
 * build-pages.js – stamps the shared header and footer into every public page.
 *
 * Source of truth:  partials/header.html, partials/footer.html
 * Targets:          index.html and every matzourana_*.html in the site root
 *                   (admin/ and dishes/ are never touched).
 * In each page the partial goes between the markers
 *     <!-- @header --> ... <!-- @/header -->
 *     <!-- @footer --> ... <!-- @/footer -->
 * The leading documentation comment of a partial is not copied.
 * The nav item whose data-nav equals the page's <body data-page="..."> gets
 * aria-current="page".
 *
 * Usage:
 *   node tools/build-pages.js           # rewrite pages that are out of date
 *   node tools/build-pages.js --check   # only report; exit code 1 if a page is out of date
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PARTS = ['header', 'footer'];

/*-------------------
Purpose: Read one partial and drop its leading documentation comment.
On Input: name - String, 'header' or 'footer' (file partials/<name>.html).
On Output: String, the HTML to stamp (no trailing newline).
---------------------*/
function readPartial(name) {
  let html = fs.readFileSync(path.join(ROOT, 'partials', name + '.html'), 'utf8');
  html = html.replace(/^\s*<!--[\s\S]*?-->\s*\n/, '');
  return html.replace(/\s+$/, '');
}

/*-------------------
Purpose: List the public pages that receive the partials.
On Input: none.
On Output: Array of file names, e.g. ['index.html', 'matzourana_menu.html', ...].
---------------------*/
function listPages() {
  return fs.readdirSync(ROOT)
    .filter(f => f === 'index.html' || /^matzourana_[\w-]+\.html$/.test(f))
    .sort();
}

/*-------------------
Purpose: Mark the nav item of the current page with aria-current="page".
On Input: html - String (stamped header); page - String from <body data-page>.
On Output: String, header with aria-current on the matching data-nav item.
---------------------*/
function markCurrent(html, page) {
  if (!page) return html;
  return html.replace(new RegExp('data-nav="' + page + '"', 'g'), 'data-nav="' + page + '" aria-current="page"');
}

/*-------------------
Purpose: Put the partials into one page's HTML between its markers.
On Input: src - String (page HTML); file - String (for messages); partials - { header, footer }.
On Output: String, the new page HTML. Throws if a marker pair is missing.
---------------------*/
function stampPage(src, file, partials) {
  const pageMatch = /<body[^>]*\sdata-page="([\w-]+)"/.exec(src);
  const page = pageMatch ? pageMatch[1] : '';
  let out = src;
  PARTS.forEach(name => {
    const re = new RegExp('(<!-- @' + name + ' -->)[\\s\\S]*?(\\n[ \\t]*<!-- @/' + name + ' -->)');
    if (!re.test(out)) throw new Error(file + ': markers <!-- @' + name + ' --> … <!-- @/' + name + ' --> not found');
    const body = name === 'header' ? markCurrent(partials[name], page) : partials[name];
    out = out.replace(re, (all, open, close) => open + '\n' + body + close);
  });
  return out;
}

/*-------------------
Purpose: Command-line entry: stamp (or check) all pages and print a summary.
On Input: process.argv (--check).
On Output: none; exit code 1 when --check finds an out-of-date page or on error.
---------------------*/
function main() {
  const check = process.argv.includes('--check');
  const partials = {};
  PARTS.forEach(n => { partials[n] = readPartial(n); });
  let stale = 0;
  listPages().forEach(file => {
    const full = path.join(ROOT, file);
    const src = fs.readFileSync(full, 'utf8');
    const out = stampPage(src, file, partials);
    if (out === src) { console.log('up to date  ' + file); return; }
    stale++;
    if (check) { console.log('OUT OF DATE ' + file); return; }
    fs.writeFileSync(full, out);
    console.log('stamped     ' + file);
  });
  if (check && stale) process.exit(1);
}

main();
