// Puts the real address of the published site everywhere it is needed (canonical link, sharing tags, robots.txt, sitemap).
// Usage: node tools/set-site-url.js https://your-user.github.io/hunter-exam-simulator/
const fs = require('fs'), path = require('path');
let url = process.argv[2]; if(!url || !/^https?:\/\//.test(url)){ console.error('Give the full address, e.g. https://your-user.github.io/hunter-exam-simulator/'); process.exit(1); }
if(!url.endsWith('/')) url += '/';
const root = path.join(__dirname, '..'), files = ['index.html', 'robots.txt', 'sitemap.xml'];
const cur = fs.readFileSync(path.join(root, 'index.html'), 'utf8').match(/<link rel="canonical" href="([^"]+)">/)[1];
files.forEach(f => { const p = path.join(root, f); fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split(cur).join(url)); });
console.log(`Site address set to ${url} (was ${cur})`);
