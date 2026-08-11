import fs from "node:fs";
import path from "node:path";

const DOCS_DIR = path.join(process.cwd(), "public");

//split "text **bold** text" into renderable spans
function parseInline(text) {
    return text
        .split(/\*\*(.+?)\*\*/g)
        .map((part, i) => ({bold: i % 2 === 1, text: part}))
        .filter((span) => span.text);
}

//minimal markdown reader for the static legal docs
//read at build time, so the pages ship as plain HTML
export function readLegalDoc(fileName) {
    const raw = fs.readFileSync(path.join(DOCS_DIR, fileName), "utf8");
    const blocks = [];

    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
            blocks.push({type: `h${heading[1].length}`, spans: parseInline(heading[2])});
        } else {
            blocks.push({type: "p", spans: parseInline(trimmed)});
        }
    }

    return blocks;
}
