const { chromium } = require('playwright');

const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); console.log('ok -', m); };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const counter = async () => (await page.locator('.lesson__count').innerText()).trim();
  const title = async () => (await page.locator('.guide h2').first().innerText()).trim();
  const ring = () => page.locator('.guide-ring');

  await page.goto('' + (process.env.BASE_URL || 'http://127.0.0.1:5173') + '/login');
  await page.getByRole('button', { name: /sinov rejimida/i }).click();
  await page.getByRole('link', { name: 'Boshlash' }).first().click();
  await page.waitForSelector('.sim-stage');
  assert((await counter()) === '1 / 13', 'starts at 1 / 13');

  // ack step cannot be bypassed by clicking the sim
  await page.locator('.sim-icon').nth(1).click();
  assert((await counter()) === '1 / 13', 'clicking an icon on an explanation step does not advance');
  await page.getByRole('button', { name: 'Davom etish' }).click();
  assert((await counter()) === '2 / 13', 'Continue advances ack step');

  // highlight present on correct target
  await page.waitForSelector('.guide-ring');
  const ringBox = await ring().boundingBox();
  const iconBox = await page.locator('.sim-icon', { hasText: 'Hujjatlar' }).boundingBox();
  assert(Math.abs(ringBox.x + ringBox.width / 2 - (iconBox.x + iconBox.width / 2)) < 6 && Math.abs(ringBox.y + ringBox.height / 2 - (iconBox.y + iconBox.height / 2)) < 6, 'spotlight ring is centred on the Hujjatlar icon');
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/10-highlight.png' });

  // wrong click: wallpaper
  await page.mouse.click(500, 400);
  await page.waitForSelector('.note--wrong');
  assert((await counter()) === '2 / 13', 'wallpaper click does not advance');
  assert((await page.locator('.note--wrong').innerText()).includes('orqa foni'), 'explains why wallpaper click is wrong');
  // wrong icon
  await page.locator('.sim-icon', { hasText: 'Savat' }).click();
  assert((await counter()) === '2 / 13', 'other icon does not advance');
  // hint does not advance
  await page.getByRole('button', { name: 'Maslahat' }).click();
  assert((await counter()) === '2 / 13', 'hint does not advance');
  assert(await page.locator('.note--hint').isVisible(), 'hint is shown');
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/11-wrong-and-hint.png' });

  // language switch mid-lesson keeps step
  await page.getByLabel('Til').first().selectOption('ru');
  assert((await counter()) === '2 / 13', 'language switch keeps step');
  assert((await title()) === 'Выбор значка', 'guide text switched to Russian');
  await page.getByLabel('Язык').first().selectOption('en');
  assert((await title()) === 'Selecting an icon', 'guide text switched to English');
  await page.getByLabel('Language').first().selectOption('uz');

  // correct: single click, then double click
  await page.locator('.sim-icon', { hasText: 'Hujjatlar' }).click();
  assert((await counter()) === '3 / 13', 'correct select advances to 3');
  await page.locator('.sim-icon', { hasText: 'Hujjatlar' }).dblclick();
  await page.waitForSelector('.sim-win');
  assert((await counter()) === '4 / 13', 'double-click opens the folder window and advances to 4');
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/12-window-open.png' });

  // reload mid-lesson => resume at same step with same window
  await page.waitForTimeout(1500);
  await page.reload();
  await page.waitForSelector('.sim-win');
  assert((await counter()) === '4 / 13', 'reload resumes at step 4');
  assert((await page.locator('.sim-win').count()) === 1, 'simulated window restored from checkpoint');

  // window controls
  await page.getByRole('button', { name: 'Kattalashtirish' }).click();
  assert((await counter()) === '5 / 13', 'maximize advances');
  await page.getByRole('button', { name: 'Qaytarish' }).click();
  await page.getByRole('button', { name: 'Yig‘ish' }).click();
  assert((await counter()) === '7 / 13', 'minimize advances to taskbar step');
  assert((await page.locator('.sim-win').isHidden()), 'window hidden when minimized');
  await page.locator('.sim-task').click();
  assert((await counter()) === '8 / 13', 'taskbar restore advances');
  await page.locator('.sim-win').getByRole('button', { name: 'Yopish' }).click();
  assert((await counter()) === '9 / 13', 'close advances');
  await page.locator('.sim-start').click();
  await page.locator('.sim-startmenu__item', { hasText: 'Bloknot' }).click();
  assert((await counter()) === '11 / 13', 'start menu -> notepad');
  await page.locator('.sim-notepad__text').fill('sa');
  assert((await counter()) === '11 / 13', 'two chars not enough');
  await page.locator('.sim-notepad__text').fill('salom');
  assert((await counter()) === '12 / 13', 'typed text advances');
  await page.locator('.sim-win').getByRole('button', { name: 'Yopish' }).click();
  assert((await counter()) === '13 / 13', 'reached final ack');
  await page.getByRole('button', { name: 'Davom etish' }).click();
  await page.waitForSelector('text=Bob yakunlandi');
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/13-chapter-complete.png' });

  // dark theme persists + coherent
  await page.getByRole('button', { name: /Yorug‘ mavzu|Qorong‘i mavzu/ }).first().click();
  await page.screenshot({ path: (process.env.OUT || '/tmp') + '/14-theme-toggled.png' });
  await page.getByRole('link', { name: /Bosh sahifaga/ }).first().click().catch(() => {});
  await page.goto('' + (process.env.BASE_URL || 'http://127.0.0.1:5173') + '/');
  await page.waitForSelector('.chapters');
  assert(await page.getByRole('link', { name: 'Boshlash' }).count() >= 1, 'chapter 2 unlocked after chapter 1');
  console.log('console problems:', errors);
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
