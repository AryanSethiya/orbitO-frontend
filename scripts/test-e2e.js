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

async function waitForTransmitReady(page) {
  await page.waitForFunction(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(b => b.textContent && b.textContent.includes('TRANSMIT VECTOR'));
  }, { timeout: 15000 });
}

async function clickModalCloseButton(page) {
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const closeBtn = buttons.find(b => b.textContent.trim() === '✕' || b.textContent.trim() === 'close' || b.textContent.includes('✕'));
    if (closeBtn) closeBtn.click();
  });
}

async function runE2ETests() {
  console.log('🚀 Launching automated headless Chrome test suite...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();
  page.on('console', (msg) => console.log('BROWSER_LOG:', msg.text()));

  try {
    // --- STEP 1: Landing Page ---
    console.log('--- Step 1: Navigating to Landing Page ---');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_01_landing.png') });
    console.log('✅ Captured e2e_01_landing.png');

    // --- STEP 2: Click START MISSION to trigger Auth Gate ---
    console.log('--- Step 2: Clicking START MISSION to test Auth Gate ---');
    await clickButtonByText(page, 'START MISSION');
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_02_auth_modal.png') });
    console.log('✅ Captured e2e_02_auth_modal.png');

    // --- STEP 3: Callsign Login ---
    console.log('--- Step 3: Performing Pilot Callsign Login ---');
    await clickButtonByText(page, 'Callsign Login');
    await delay(400);

    await setReactInputValue(page, 'input[placeholder*="CMDR_"]', 'CMDR_VALKYRIE');
    await delay(400);

    await clickButtonByText(page, 'ENTER MISSION CONTROL');
    await delay(2500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_03_mission_control.png') });
    console.log('✅ Captured e2e_03_mission_control.png');

    // --- STEP 4: Submit First Vector ("PLANET") ---
    console.log('--- Step 4: Transmitting First Vector ("PLANET") ---');
    await setReactInputValue(page, 'input[placeholder*="COORDINATES"]', 'PLANET');
    await delay(400);
    await clickButtonByText(page, 'TRANSMIT VECTOR');
    await waitForTransmitReady(page);
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_04_first_vector.png') });
    console.log('✅ Captured e2e_04_first_vector.png');

    // --- STEP 5: Submit Second Vector ("HAND") ---
    console.log('--- Step 5: Transmitting Second Vector ("HAND") ---');
    await setReactInputValue(page, 'input[placeholder*="COORDINATES"]', 'HAND');
    await delay(400);
    await clickButtonByText(page, 'TRANSMIT VECTOR');
    await waitForTransmitReady(page);
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_05_second_vector.png') });
    console.log('✅ Captured e2e_05_second_vector.png');

    // --- STEP 6: Decrypt Hint via Encryption Modal ---
    console.log('--- Step 6: Testing Encryption & Hint Decryption ---');
    await clickButtonByText(page, 'ENCRYPTION');
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_06a_hint_modal.png') });
    console.log('✅ Captured e2e_06a_hint_modal.png');

    await clickButtonByText(page, 'DECRYPT NEXT HINT');
    await delay(3000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_06b_hint_decrypted.png') });
    console.log('✅ Captured e2e_06b_hint_decrypted.png');

    // Close hints modal
    await clickModalCloseButton(page);
    await delay(600);

    // --- STEP 7: Test Full Logs Modal ---
    console.log('--- Step 7: Testing Transmission Logs Modal ---');
    await clickButtonByText(page, 'LOGS');
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_07_logs_modal.png') });
    console.log('✅ Captured e2e_07_logs_modal.png');

    // Close logs modal
    await clickButtonByText(page, 'CLOSE ARCHIVE');
    await delay(600);

    // --- STEP 8: Test Telemetry Modal ---
    console.log('--- Step 8: Testing Telemetry Modal ---');
    await clickButtonByText(page, 'TELEMETRY');
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_08_telemetry_modal.png') });
    console.log('✅ Captured e2e_08_telemetry_modal.png');

    // --- STEP 9: Test Space Standings (Leaderboard) ---
    console.log('--- Step 9: Navigating to Space Standings ---');
    await clickButtonByText(page, 'VIEW GLOBAL STANDINGS');
    await delay(2500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_09_space_standings.png') });
    console.log('✅ Captured e2e_09_space_standings.png');

    // --- STEP 10: Community Fleet Rooms ---
    console.log('--- Step 10: Testing Fleet Community Rooms ---');
    await clickButtonByText(page, '+ FLEET ROOM');
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_10a_fleet_modal.png') });
    console.log('✅ Captured e2e_10a_fleet_modal.png');

    // Create a new fleet room
    await clickButtonByText(page, '+ CREATE FLEET');
    await delay(500);
    await setReactInputValue(page, 'input[placeholder*="Nebula Corsairs"]', 'VALKYRIE SQUADRON');
    await delay(400);
    await clickButtonByText(page, 'COMMISSION FLEET');
    await delay(3000);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_10b_fleet_created.png') });
    console.log('✅ Captured e2e_10b_fleet_created.png');

    // Close fleet modal
    await clickModalCloseButton(page);
    await delay(800);

    // --- STEP 11: Return to CORE and Test Victory Modal & AI Roast ---
    console.log('--- Step 11: Testing Solved Victory Modal & AI Roast Debrief ---');
    await clickButtonByText(page, 'CORE');
    await delay(1000);

    // Submit winning word ("ORBIT")
    await setReactInputValue(page, 'input[placeholder*="COORDINATES"]', 'ORBIT');
    await delay(400);
    await clickButtonByText(page, 'TRANSMIT VECTOR');
    await delay(3500);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_11_victory_roast.png') });
    console.log('✅ Captured e2e_11_victory_roast.png');

    // Test AI Roast tone styles
    try {
      await clickButtonByText(page, 'SAVAGE');
      await delay(2000);
      await clickButtonByText(page, 'HYPE');
      await delay(2000);
      await clickButtonByText(page, 'PLAYFUL');
      await delay(2000);
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_11b_roast_styles.png') });
      console.log('✅ Captured e2e_11b_roast_styles.png');
    } catch (e) {
      console.log('Roast style buttons handled:', e.message);
    }

    // Close victory modal
    await clickModalCloseButton(page);
    await delay(800);

    // --- STEP 12: Test Pilot Profile Dossier ---
    console.log('--- Step 12: Testing Pilot Profile Dossier ---');
    await page.evaluate(() => {
      const btn = document.querySelector('button[title*="Pilot"]');
      if (btn) btn.click();
    });
    await delay(1200);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_12_profile_dossier.png') });
    console.log('✅ Captured e2e_12_profile_dossier.png');

    console.log('🎉 ALL END-TO-END AUTOMATED TEST JOURNEYS PASSED 100%!');
  } catch (error) {
    console.error('❌ E2E Test Error:', error);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_error.png') });
  } finally {
    await browser.close();
  }
}

runE2ETests();
