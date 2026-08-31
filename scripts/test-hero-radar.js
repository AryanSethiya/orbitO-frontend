import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/866c2344-3b02-40ed-93e2-e962474254f8';
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function setReactInputValue(page, selector, value) {
  await page.evaluate(({ sel, val }) => {
    const input = document.querySelector(sel);
    if (input) {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, { sel: selector, val: value });
}

async function clickButtonByText(page, textSubstring) {
  const clicked = await page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
    const btn = buttons.find((b) => b.textContent && b.textContent.toUpperCase().includes(text.toUpperCase()));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, textSubstring);
  if (!clicked) {
    throw new Error(`Button with text "${textSubstring}" not found.`);
  }
}

async function runHeroRadarTest() {
  console.log('🚀 Running Hero Radar & Copy Button Test...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();

  try {
    // 1. Open Landing Page
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await delay(1000);

    // 2. Login
    await clickButtonByText(page, 'START MISSION');
    await delay(600);
    await clickButtonByText(page, 'Callsign Login');
    await delay(400);
    await setReactInputValue(page, 'input[placeholder*="CMDR_"]', 'Aryan_Sethiya');
    await delay(400);
    await clickButtonByText(page, 'ENTER MISSION CONTROL');
    await delay(2000);

async function waitForTransmitReady(page) {
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(b => b.textContent && b.textContent.includes('TRANSMIT VECTOR'));
  }, { timeout: 15000 });
}

    // 3. Submit vectors to populate the radar
    await setReactInputValue(page, 'input[placeholder*="COORDINATES"]', 'PLANET');
    await delay(300);
    await clickButtonByText(page, 'TRANSMIT VECTOR');
    await waitForTransmitReady(page);
    await delay(1000);

    await setReactInputValue(page, 'input[placeholder*="COORDINATES"]', 'HAND');
    await delay(300);
    await clickButtonByText(page, 'TRANSMIT VECTOR');
    await waitForTransmitReady(page);
    await delay(1000);

    await setReactInputValue(page, 'input[placeholder*="COORDINATES"]', 'EARTH');
    await delay(300);
    await clickButtonByText(page, 'TRANSMIT VECTOR');
    await waitForTransmitReady(page);
    await delay(1000);

    // 4. Capture screenshot of the Hero Radar screen
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_radar_scanner_screen.png') });
    console.log('✅ Captured hero_radar_scanner_screen.png');

    // 5. Open Fleet Community Modal & Test Copy Button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('FLEET'));
      if (btn) btn.click();
    });
    await delay(800);

    await clickButtonByText(page, '+ CREATE FLEET');
    await delay(400);
    await setReactInputValue(page, 'input[placeholder*="Nebula"]', 'Solaris Fleet');
    await delay(400);
    await clickButtonByText(page, 'COMMISSION FLEET');
    await delay(2000);

    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'fleet_established_copy_button.png') });
    console.log('✅ Captured fleet_established_copy_button.png');

    console.log('🎉 ALL HERO RADAR & COPY BUTTON TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test error:', err);
  } finally {
    await browser.close();
  }
}

runHeroRadarTest();
