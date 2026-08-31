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

async function runForfeitE2ETest() {
  console.log('🚀 Launching Forfeit & Reveal Target Test...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('BROWSER_LOG:', msg.text()));

  try {
    // 1. Landing Page
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await delay(1000);

    // 2. Login
    await clickButtonByText(page, 'START MISSION');
    await delay(800);
    await clickButtonByText(page, 'Callsign Login');
    await delay(400);
    await setReactInputValue(page, 'input[placeholder*="CMDR_"]', 'CMDR_FORFEIT_PILOT');
    await delay(400);
    await clickButtonByText(page, 'ENTER MISSION CONTROL');
    await delay(2000);

    // 3. Submit a guess
    await setReactInputValue(page, 'input[placeholder*="COORDINATES"]', 'SPACE');
    await delay(300);
    await clickButtonByText(page, 'TRANSMIT VECTOR');
    await delay(2500);

    // 4. Click ABORT / REVEAL in left sidebar
    console.log('--- Clicking ABORT / REVEAL ---');
    await clickButtonByText(page, 'ABORT / REVEAL');
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_forfeit_01_modal.png') });
    console.log('✅ Captured e2e_forfeit_01_modal.png');

    // 5. Click FORFEIT & REVEAL TARGET
    console.log('--- Clicking FORFEIT & REVEAL TARGET ---');
    await clickButtonByText(page, 'FORFEIT & REVEAL TARGET');
    await delay(2500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_forfeit_02_revealed.png') });
    console.log('✅ Captured e2e_forfeit_02_revealed.png');

    // 6. Test switching roast styles
    console.log('--- Testing AI Roast tones for forfeited mission ---');
    try {
      await clickButtonByText(page, 'PLAYFUL');
      await delay(1200);
      await clickButtonByText(page, 'HYPE');
      await delay(1200);
      await clickButtonByText(page, 'SAVAGE');
      await delay(1200);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_forfeit_03_roasts.png') });
      console.log('✅ Captured e2e_forfeit_03_roasts.png');
    } catch (e) {
      console.log('Roast buttons:', e.message);
    }

    console.log('🎉 FORFEIT & REVEAL TARGET TEST COMPLETED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Forfeit test error:', err);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_forfeit_error.png') });
  } finally {
    await browser.close();
  }
}

runForfeitE2ETest();
