// Builds classic.html (the original UI): a single file that runs with a double-click (file://), no server needed.
// Usage (once):  npm i -D esbuild@0.21.5 d3-delaunay@6 polylabel@1.1.0 tinyqueue@2
//        then:   node tools/build-standalone.mjs
// The bg/ and assets/ folders must stay next to arena.html (images are loaded from there).
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = (p) => join(root, "node_modules", p);

const res = await build({
  entryPoints: [join(root, "app.js")],
  bundle: true,
  format: "esm",
  write: false,
  target: "es2022",
  logLevel: "warning",
});
const appJs = res.outputFiles[0].text;

const d3 = readFileSync(nm("d3-delaunay/dist/d3-delaunay.min.js"), "utf8");
const tinyqueue = readFileSync(nm("tinyqueue/tinyqueue.js"), "utf8");
const polylabelSrc = readFileSync(nm("polylabel/polylabel.js"), "utf8");
const polylabel = `${tinyqueue}\n(function(){var module={exports:{}};var require=function(){return window.TinyQueue};\n${polylabelSrc}\nwindow.polylabel=module.exports;})();`;

const css = readFileSync(join(root, "styles.css"), "utf8");
const items = readFileSync(join(root, "data/items.json"), "utf8");
const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Arena Royale</title>
  <style>${css}</style>
</head>
<body>
  <div id="root"></div>
  <div id="uiTooltip" class="uiTooltip hidden" role="tooltip"></div>
  <script>${safe(d3)}</script>
  <script>${safe(polylabel)}</script>
  <script>window.__ARENA_ITEMS__ = ${items};</script>
  <script type="module">${safe(appJs)}</script>
</body>
</html>
`;
writeFileSync(join(root, "classic.html"), html);
console.log("Wrote classic.html (" + Math.round(html.length / 1024) + " KB)");
