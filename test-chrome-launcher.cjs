const chromeLauncher = require('chrome-launcher');
const CDP = require('chrome-remote-interface');
const fs = require('fs');
const path = require('path');

async function main() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--no-first-run', '--disable-extensions', '--no-sandbox'],
  });
  const client = await CDP({ port: chrome.port });
  const { Network, Page, Runtime } = client;
  await Network.enable();
  await Page.enable();

  const cookieText = fs.readFileSync(path.join(process.cwd(), 'shopee.co.id.txt'), 'utf-8');
  const cookies = cookieText.split('\n')
    .filter(l => l.trim() && !l.startsWith('#'))
    .map(l => { const p = l.split('\t'); return { name: p[5], value: p[6], domain: p[0]||'', path: p[2]||'/', secure: p[3]==='TRUE', httpOnly: false }; })
    .filter(c => c.name && c.value);
  for (const c of cookies) await Network.setCookie(c);

  await Page.navigate({ url: 'https://shopee.co.id/' });
  await new Promise(r => setTimeout(r, 8000));

  const result = await Runtime.evaluate({
    expression: `
      (async () => {
        const res = await fetch('https://shopee.co.id/api/v4/search/search_items?keyword=sepatu&limit=3&page=0&by=relevancy&order=desc', {
          headers: { 'Accept': 'application/json' },
          credentials: 'include',
        });
        const json = await res.json();
        // Return first item's structure for field mapping
        if (json.items && json.items.length > 0) {
          return JSON.stringify({ total: json.total_count, firstItem: json.items[0], itemCount: json.items.length }, null, 2);
        }
        return JSON.stringify(json, null, 2);
      })()
    `,
    awaitPromise: true,
  });

  console.log(result.result.value);

  await client.close();
  await chrome.kill().catch(() => {});
}
main().catch(e => { console.error(e); process.exit(1); });
