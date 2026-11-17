// Runs every tour step's answer through the page, as a learner would, and checks a
// wrong answer is refused. Needs the playground running and Playwright:
//
//   node playground/server.mjs &
//   node playground/test.mjs            (PLAYGROUND=http://127.0.0.1:7070)

import { createRequire } from "node:module";
import { STEPS } from "./tour.js";

const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.PLAYGROUND || "http://127.0.0.1:7070";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base + "/__pg/");
await page.evaluate(() => localStorage.clear());
await page.reload();

let failed = 0;
await page.fill("#code", 'print("hello")');
await page.click("#run");
await page.waitForSelector("#checks li.fail");
if (await page.isVisible("#success")) { console.log("FAIL a wrong answer passed step 1"); failed++; }
else console.log("ok   a wrong answer is refused");

for (const [i, s] of STEPS.entries()) {
  await page.fill("#code", s.solution);
  await page.click("#run");
  try {
    await page.waitForSelector("#success:not([hidden])", { timeout: 20000 });
    console.log(`ok   ${i + 1}. ${s.title}`);
  } catch {
    failed++;
    console.log(`FAIL ${i + 1}. ${s.title}: ${(await page.textContent("#checks")).replace(/\s+/g, " ")}`);
    break;
  }
  if (i < STEPS.length - 1) await page.click("#next");
}
for (const e of errors) { console.log("page error:", e); failed++; }
await browser.close();
process.exit(failed ? 1 : 0);
