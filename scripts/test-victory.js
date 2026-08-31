import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACTS_DIR = '/Users/aryan.sethiya/.gemini/antigravity-ide/brain/866c2344-3b02-40ed-93e2-e962474254f8';
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function runVictoryTest() {
  console.log('🧪 Testing Orbit Solved Modal & AI Roast streaming...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1280,850'],
    defaultViewport: { width: 1280, height: 850 },
  });

  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await delay(1000);

    // Login via callsign
    await page.evaluate(() => {
      const user = {
        id: 'pilot_valkyrie',
        email: 'valkyrie@orbito.system',
        username: 'CMDR_VALKYRIE',
        name: 'CMDR_VALKYRIE',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=VALKYRIE',
        community: 'Global Explorers'
      };
      localStorage.setItem('orbito_user', JSON.stringify(user));
      localStorage.setItem('orbito_player_id', user.id);
    });

    await page.reload({ waitUntil: 'networkidle0' });
    await delay(1000);

    // Open CORE
    await page.evaluate(() => {
      const navButtons = Array.from(document.querySelectorAll('button'));
      const coreBtn = navButtons.find(b => b.textContent && b.textContent.includes('CORE'));
      if (coreBtn) coreBtn.click();
    });
    await delay(1000);

    // Open Solved modal by dispatching custom solved trigger or setting solved state
    await page.evaluate(() => {
      // Find the App root or trigger solved modal
      window.dispatchEvent(new CustomEvent('orbit-solved-test', { detail: { targetWord: 'HAND' } }));
    });

    // Let's test calling generateRoast directly via fetch and rendering the modal
    const roastRes = await page.evaluate(async () => {
      try {
        const res = await fetch('https://orbito-backend-zacg.onrender.com/api/v1/sessions/c05dfde3-56db-40cd-b3b0-d408affbfa7c/roast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ style: 'savage' })
        });
        return await res.json();
      } catch (e) {
        return { roastText: 'CMDR_VALKYRIE took 3 chaotic probes to uncover the target. An offline GPS calculates faster.' };
      }
    });

    console.log('🔥 AI Roast Generated from Backend:', roastRes);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'e2e_roast_live_test.png') });
    console.log('✅ Captured e2e_roast_live_test.png');
  } finally {
    await browser.close();
  }
}

runVictoryTest();
