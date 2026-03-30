"""Test: scan Wanchaq Cusco from browser UI using Playwright."""
import subprocess, sys
# Use node's playwright via npx since Python is not installed
# Instead, use the Playwright from the backend Docker container

import os
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '0'

script = """
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Login
  console.log('1. Navigating to login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"]', 'demo@geointel.com');
  await page.fill('input[type="password"]', 'demo2024');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  console.log('   Login OK -> ' + page.url());

  // 2. Go to scan page
  console.log('2. Navigating to scan...');
  await page.goto('http://localhost:3000/dashboard/scan', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  console.log('   Scan page loaded');

  // 3. Search for Cusco Wanchaq
  console.log('3. Searching Cusco Wanchaq...');
  const searchInput = page.locator('input[placeholder*="Cusco"]');
  await searchInput.fill('Cusco Wanchaq');
  await page.click('button:has(span:has-text("search"))');
  await page.waitForTimeout(3000);

  // Check coordinates updated
  const coordsText = await page.locator('span.font-mono').textContent();
  console.log('   Coordinates: ' + coordsText);

  // 4. Set radius
  console.log('4. Setting radius to 1km...');
  // The slider is already visible

  // 5. Fill form
  console.log('5. Filling form...');
  await page.fill('input[placeholder*="Wanchaq"]', 'Wanchaq Cusco Test');
  await page.fill('input[placeholder*="salud"]', 'salud');
  await page.waitForTimeout(1000);

  // 6. Take screenshot before scan
  await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_scan_before.png' });
  console.log('   Screenshot saved: flow_scan_before.png');

  // 7. Click launch scan
  console.log('6. Launching scan...');
  const launchBtn = page.locator('button:has-text("LANZAR ESCANEO"), button:has(span:has-text("rocket_launch"))');
  if (await launchBtn.count() > 0) {
    await launchBtn.first.click();
    console.log('   Scan launched!');

    // 8. Wait for scan to complete (poll every 5s, max 8min)
    console.log('7. Waiting for scan to complete...');
    for (let i = 0; i < 100; i++) {
      await page.waitForTimeout(5000);
      const statusText = await page.textContent('body');
      if (statusText.includes('negocios descubiertos') || statusText.includes('completado')) {
        console.log('   Scan completed!');
        break;
      }
      if (statusText.includes('FAILED') || statusText.includes('failed')) {
        console.log('   Scan FAILED');
        break;
      }
      if (i % 6 === 0) console.log('   Still scanning... (' + ((i+1)*5) + 's)');
    }

    // 9. Screenshot after scan
    await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_scan_after.png', fullPage: true });
    console.log('   Screenshot saved: flow_scan_after.png');

  } else {
    console.log('   Launch button not found!');
    await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_scan_error.png' });
  }

  // 10. Go to territories to see results
  console.log('8. Checking territories...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_territories_result.png' });
  console.log('   Screenshot saved: flow_territories_result.png');

  await browser.close();
  console.log('Done!');
})();
"""

with open('C:/Users/mina/Desktop/Proyetos/01geoFastAPI/test_scan.js', 'w') as f:
    f.write(script)

print("Script written to test_scan.js")
