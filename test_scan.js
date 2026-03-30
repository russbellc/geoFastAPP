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

  // 1b. Dismiss onboarding if present
  console.log('1b. Dismissing onboarding...');
  try {
    const skipBtn = page.locator('text=Omitir Tour');
    if (await skipBtn.isVisible({ timeout: 3000 })) {
      await skipBtn.click();
      console.log('   Onboarding dismissed');
    }
  } catch { console.log('   No onboarding'); }
  await page.waitForTimeout(1000);

  // Also clear localStorage to prevent future onboarding
  await page.evaluate(() => localStorage.setItem('geointel_onboarding_complete', 'true'));

  // 2. Go to scan page
  console.log('2. Navigating to scan...');
  await page.goto('http://localhost:3000/dashboard/scan', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  console.log('   Scan page loaded');

  // 3. Search for Cusco Wanchaq
  console.log('3. Searching Cusco Wanchaq...');
  const searchInput = page.locator('input[placeholder*="Cusco"]');
  await searchInput.fill('Cusco Wanchaq');
  // Click search button
  const searchBtns = page.locator('button').filter({ has: page.locator('span.material-symbols-outlined:has-text("search")') });
  await searchBtns.first().click();
  await page.waitForTimeout(3000);

  // Check coordinates
  const coordsEl = page.locator('.font-mono');
  if (await coordsEl.count() > 0) {
    const coords = await coordsEl.first().textContent();
    console.log('   Coordinates: ' + coords);
  }

  // 4. Fill territory name
  console.log('4. Filling form...');
  await page.fill('input[placeholder*="Wanchaq"]', 'Wanchaq Cusco Browser Test');

  // Fill niche
  const nicheInput = page.locator('input[placeholder*="salud"]');
  if (await nicheInput.count() > 0) {
    await nicheInput.fill('salud');
  }
  await page.waitForTimeout(500);

  // Screenshot before
  await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_scan_before.png', fullPage: true });
  console.log('   Screenshot: flow_scan_before.png');

  // 5. Click Launch Scan
  console.log('5. Launching scan...');
  const submitBtn = page.locator('button[type="submit"]');
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
  }
  await page.waitForTimeout(2000);
  console.log('   Scan triggered');

  // 6. Wait for completion (max 8 minutes)
  console.log('6. Waiting for scan to complete...');
  for (let i = 0; i < 96; i++) {
    await page.waitForTimeout(5000);
    const bodyText = await page.textContent('body');
    if (bodyText.includes('negocios descubiertos') || bodyText.includes('completado')) {
      console.log('   SCAN COMPLETED!');
      break;
    }
    if (bodyText.includes('FAILED') || bodyText.includes('failed') || bodyText.includes('fallo')) {
      console.log('   SCAN FAILED');
      break;
    }
    if (i % 12 === 0 && i > 0) {
      console.log('   Still running... (' + Math.round((i * 5) / 60) + ' min)');
    }
  }

  // Screenshot after scan
  await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_scan_after.png', fullPage: true });
  console.log('   Screenshot: flow_scan_after.png');

  // 7. Navigate to territories to see results
  console.log('7. Checking results in territories...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_territories.png' });
  console.log('   Screenshot: flow_territories.png');

  // 8. Search for Torre Medica
  console.log('8. Searching Torre Medica Plus...');
  const bizSearch = page.locator('input[placeholder*="Buscar"]');
  if (await bizSearch.count() > 0) {
    await bizSearch.fill('Torre Medica');
    await page.waitForTimeout(1000);
    // Click search
    const searchBtn2 = page.locator('button').filter({ has: page.locator('span.material-symbols-outlined:has-text("search")') });
    if (await searchBtn2.count() > 0) {
      await searchBtn2.first().click();
    }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'C:/Users/mina/Desktop/flow_torre_medica.png' });
    console.log('   Screenshot: flow_torre_medica.png');
  }

  await browser.close();
  console.log('\nDone! Check screenshots on Desktop.');
})();
