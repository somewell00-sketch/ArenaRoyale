// Builds one self-contained HTML file (dist/hunter-exam.html) from index.html:
// every local stylesheet and script is inlined, in the same order. Useful for sharing a single file.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="(css\/[^"]+)">\n?/g, (m, f) => `<style>\n${fs.readFileSync(path.join(root, f), 'utf8')}</style>\n`);
html = html.replace(/<script src="(js\/[^"]+)"><\/script>\n?/g, (m, f) => `<script>\n${fs.readFileSync(path.join(root, f), 'utf8').replace(/<\/script/g, '<\\/script')}</script>\n`);
fs.mkdirSync(path.join(root, 'dist'), {recursive: true});
fs.writeFileSync(path.join(root, 'dist', 'hunter-exam.html'), html);
console.log('dist/hunter-exam.html', (html.length / 1024).toFixed(0) + ' KB');
