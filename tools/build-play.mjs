// Builds the new Arena Royale (play/) into one self-contained file that runs with a double-click.
// Output: index.html and arena.html (identical). Images are read from ./bg next to them.
// Usage: node tools/build-play.mjs   (needs node_modules/d3-delaunay)
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");
const tpl = readFileSync(join(root, "play/template.html"), "utf8");
const d3 = readFileSync(join(root, "node_modules/d3-delaunay/dist/d3-delaunay.min.js"), "utf8");
const game = readFileSync(join(root, "play/arena.js"), "utf8");
const html = tpl.replace("<!--LIBS-->", `<script>${safe(d3)}</script>\n<script>${safe(game)}</script>`);
for (const f of ["index.html", "arena.html"]) writeFileSync(join(root, f), html);
console.log("Wrote index.html + arena.html (" + Math.round(html.length / 1024) + " KB)");
