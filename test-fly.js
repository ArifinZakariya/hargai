const cl = require('chrome-launcher');
(async () => {
  try {
    const chrome = await cl.launch({
      chromeFlags: ['--no-sandbox', '--disable-setuid-sandbox', '--headless', '--disable-gpu'],
    });
    console.log('Chrome launched on port', chrome.port);
    await chrome.kill();
  } catch(e) {
    console.error('LAUNCH FAIL:', e.message);
  }
})();
