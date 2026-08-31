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

async function runHintDeductionTest() {
  console.log('🚀 Running Hint Deduction Verification Test...');
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

    // 3. Open Encryption / Hints Modal
    await clickButtonByText(page, 'ENCRYPTION');
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hint_01_deduction_notice.png') });
    console.log('✅ Captured hint_01_deduction_notice.png');

    // 4. Click Decrypt Hint #1
    await clickButtonByText(page, 'DECRYPT HINT #1');
    await delay(2000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hint_02_first_hint_decrypted.png') });
    console.log('✅ Captured hint_02_first_hint_decrypted.png');

    console.log('🎉 HINT DEDUCTION VERIFICATION COMPLETED!');
  } catch (err) {
    console.error('❌ Error during hint verification:', err);
  } finally {
    await browser.close();
  }
}

runHintDeductionTest();
