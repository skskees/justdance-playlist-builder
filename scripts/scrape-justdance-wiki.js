/**
 * Scrapes "All Just Dance Main Series Songs in Chronological Order"
 * (a Fandom user blog page) for a structured list of every main-series
 * song, grouped by game.
 *
 * Verified page structure (checked against the live page):
 *   - The content lives in a single div.mw-parser-output
 *   - Game names are h2 headings ("Just Dance", "Just Dance 2", ...)
 *   - Each h2 is immediately followed by one table.wikitable with rows:
 *       Song | Artist | Year | Mode | Difficulty | Effort | Icon
 *   - Song titles are links (<i><a>...</a></i>), sometimes followed by
 *     asterisk markers (*, **) meaning "uses a different version in a
 *     later/earlier release" -- kept as raw text so you can decide how
 *     to handle it.
 *   - Artist / Year / Difficulty / Effort cells sometimes contain multiple
 *     values separated by <br> when they differ across releases, e.g.
 *     "Medium (JD1) | Easy (later releases)" -- these are flattened to
 *     a single " | "-delimited string rather than dropped, since picking
 *     "the" value isn't well-defined without deciding which release you
 *     care about.
 *   - The Icon cell has TWO <img> tags per row: a tiny lazy-load
 *     placeholder (data: URI, ignore) and the real thumbnail, exposed
 *     via either `data-src` or `src` pointing at static.wikia.nocookie.net.
 *
 * This gives you title/artist/game/year metadata + a cover thumbnail --
 * it does NOT give you a YouTube video ID. That's still a separate step
 * (see match-youtube-videos.js).
 *
 * Usage: npm run scrape:wiki
 */

import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs/promises";

const TARGET_URL =
  "https://justdance.fandom.com/wiki/User_blog:JamesLeeKephart/All_Just_Dance_Main_Series_Songs_in_Chronological_Order";

function cellText($, cell) {
  // Clone so we don't mutate the live DOM, turn <br> into a delimiter so
  // multi-version cells don't get mashed together with no separator.
  const $cell = $(cell).clone();
  $cell.find("br").replaceWith(" | ");
  return $cell.text().trim().replace(/\s+/g, " ");
}

function extractIconUrl($, cell) {
  let thumb = null;
  let fallback = null;
  $(cell)
    .find("img")
    .each((_, img) => {
      const src = $(img).attr("data-src") || $(img).attr("src") || "";
      if (!src || src.startsWith("data:")) return;
      if (src.includes("scale-to-width-down")) {
        thumb = thumb || src;
      } else {
        fallback = fallback || src;
      }
    });
  return thumb || fallback || null;
}

async function main() {
  console.log(`Fetching ${TARGET_URL} ...`);
  const res = await fetch(TARGET_URL, {
    headers: { "User-Agent": "justdance-playlist-builder-personal-project/0.1" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch page: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const content = $(".mw-parser-output").first();
  if (content.length === 0) {
    throw new Error(
      "Could not find .mw-parser-output -- the page structure may have changed. " +
        "Open the page, view source, and check the wrapper div's class/id."
    );
  }

  const songs = [];
  let currentGame = null;

  content.children().each((_, el) => {
    const tag = el.tagName?.toLowerCase();

    if (tag === "h2") {
      // The heading's actual text lives inside span.mw-headline, and is
      // itself wrapped in an <a> (e.g. <h2><span class="mw-headline">
      // <a href="/wiki/Just_Dance_(video_game)">Just Dance</a></span>
      // <span class="mw-editsection">...</span></h2>). The edit-section
      // link is a separate sibling span, not nested inside mw-headline --
      // so just reading .mw-headline's text avoids both problems at once
      // (unlike stripping all <a> tags, which would also delete the title
      // itself since it's the anchor's own text).
      currentGame = $(el).find(".mw-headline").first().text().trim();
      return;
    }

    if (tag === "table" && $(el).hasClass("wikitable")) {
      $(el)
        .find("tr")
        .each((__, row) => {
          const cells = $(row).find("> td");
          if (cells.length < 6) return; // header row or malformed row, skip

          const songCell = cells.eq(0);
          const link = songCell.find("a").first();

          const song = {
            game: currentGame,
            title: cellText($, songCell),
            titleWikiUrl: link.attr("href")
              ? new URL(link.attr("href"), URL_ORIGIN).toString()
              : null,
            artist: cellText($, cells.eq(1)),
            year: cellText($, cells.eq(2)),
            mode: cellText($, cells.eq(3)),
            difficulty: cellText($, cells.eq(4)),
            effort: cellText($, cells.eq(5)),
            iconUrl: cells.length > 6 ? extractIconUrl($, cells.eq(6)) : null,
          };

          if (song.title) songs.push(song);
        });
    }
  });

  await fs.mkdir("data", { recursive: true });
  await fs.writeFile("data/raw-songs.json", JSON.stringify(songs, null, 2));

  const gameCounts = songs.reduce((acc, s) => {
    acc[s.game] = (acc[s.game] || 0) + 1;
    return acc;
  }, {});

  console.log(`\nWrote ${songs.length} songs to data/raw-songs.json`);
  console.log("By game:");
  for (const [game, count] of Object.entries(gameCounts)) {
    console.log(`  ${game}: ${count}`);
  }
  console.log(
    "\nNext: run scripts/match-youtube-videos.js against this file to find candidate videos."
  );
}

const URL_ORIGIN = "https://justdance.fandom.com";

main().catch((err) => {
  console.error("Scrape failed:", err.message);
  process.exit(1);
});
