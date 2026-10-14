// Portfolio mockups: captures key screens at 2x on desktop and phone, then frames them.
// Usage: npm run mockups            (starts the dev server itself, uses .env.local tokens)
//        npm run mockups -- --only=home,decision
// Output: mockups/raw/*.png, mockups/framed/*.png, mockups/framed/hero.png (gitignored)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = new URL("../mockups/", import.meta.url);
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const AT_36TH = "-122.62672,45.51208";

// [name, path, viewport, wait ms]
const SHOTS = [
  ["home", "/", DESKTOP, 5000],
  ["home-selected", "/?p=creston-skatepark", DESKTOP, 5000],
  ["overview", "/projects/hawthorne", DESKTOP, 5000],
  ["explore-alt2", "/projects/hawthorne/explore?show=2", DESKTOP, 5000],
  ["explore-3d", "/projects/hawthorne/explore?show=2&view=3d", DESKTOP, 7000],
  ["compare", "/projects/hawthorne/compare", DESKTOP, 5000],
  ["alternatives", "/projects/hawthorne/alternatives", DESKTOP, 5000],
  ["perspectives", "/projects/hawthorne/perspectives", DESKTOP, 5000],
  ["feedback-pin", `/projects/hawthorne/feedback?at=${AT_36TH}`, DESKTOP, 5000],
  ["decision", "/projects/hawthorne/decision", DESKTOP, 4000],
  ["themes", "/projects/hawthorne/themes", DESKTOP, 4000],
  ["staff-triage", "/staff/triage", DESKTOP, 3000],
  ["phone-home", "/", PHONE, 5000],
  ["phone-overview", "/projects/hawthorne", PHONE, 5000],
  ["phone-explore", "/projects/hawthorne/explore?show=2", PHONE, 5000],
  ["phone-decision", "/projects/hawthorne/decision", PHONE, 4000],
];

const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",");
const shots = only ? SHOTS.filter(([n]) => only.includes(n)) : SHOTS;

const frameHtml = (kind, src) => {
  const laptop = kind === "laptop";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; }
  body { width: ${laptop ? 1800 : 600}px; height: ${laptop ? 1240 : 1100}px; display: grid; place-items: center;
    background: radial-gradient(120% 90% at 30% 10%, #ecfdf3 0%, #f4f7f5 45%, #eef1f4 100%); }
  .laptop { display: grid; justify-items: center; filter: drop-shadow(0 40px 60px rgba(14,17,22,.18)); }
  .lid { padding: 26px 26px 34px; background: #0e1116; border-radius: 30px 30px 10px 10px; }
  .lid img { display: block; width: 1440px; height: 900px; border-radius: 6px; }
  .base { width: 1640px; height: 26px; margin-top: -2px; background: linear-gradient(#d9dde3, #b9bfc8); border-radius: 0 0 22px 22px; }
  .base::before { content: ""; display: block; width: 220px; height: 10px; margin: 0 auto; background: #a9b0ba; border-radius: 0 0 10px 10px; }
  .phone { position: relative; padding: 14px; background: #0e1116; border-radius: 62px; filter: drop-shadow(0 34px 50px rgba(14,17,22,.22)); }
  .phone img { display: block; width: 390px; height: 844px; border-radius: 48px; }
  .phone::after { content: ""; position: absolute; top: 26px; left: 50%; width: 112px; height: 32px; margin-left: -56px; background: #0e1116; border-radius: 20px; }
  </style></head><body>${laptop ? `<div class="laptop"><div class="lid"><img src="${src}"></div><div class="base"></div></div>` : `<div class="phone"><img src="${src}"></div>`}</body></html>`;
};

const heroHtml = (desk, phone) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html, body { margin: 0; }
  body { width: 2000px; height: 1250px; position: relative; overflow: hidden; background: radial-gradient(120% 90% at 25% 0%, #ecfdf3 0%, #f4f7f5 50%, #eef1f4 100%); }
  .lid { position: absolute; left: 110px; top: 120px; padding: 22px 22px 30px; background: #0e1116; border-radius: 28px 28px 10px 10px; box-shadow: 0 40px 80px -20px rgba(14,17,22,.35); }
  .lid img { display: block; width: 1440px; height: 900px; border-radius: 6px; }
  .base { position: absolute; left: 30px; top: 1072px; width: 1644px; height: 24px; background: linear-gradient(#d9dde3, #b9bfc8); border-radius: 0 0 22px 22px; }
  .phone { position: absolute; right: 120px; top: 250px; padding: 13px; background: #0e1116; border-radius: 58px; box-shadow: 0 40px 80px -20px rgba(14,17,22,.4); }
  .phone img { display: block; width: 390px; height: 844px; border-radius: 46px; }
  </style></head><body><div class="lid"><img src="${desk}"></div><div class="base"></div><div class="phone"><img src="${phone}"></div></body></html>`;

const server = await createServer({ root: ROOT, server: { port: 5199 }, logLevel: "error" });
await server.listen();
const base = `${server.resolvedUrls.local[0].replace(/\/$/, "")}/#`;
const browser = await chromium.launch({ channel: "chrome" });
await mkdir(new URL("raw/", OUT), { recursive: true });
await mkdir(new URL("framed/", OUT), { recursive: true });

try {
  for (const [name, path, viewport, wait] of shots) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    page.on("pageerror", (e) => console.warn(`  ${name}: ${e.message}`));
    await page.goto(base + path);
    await page.waitForTimeout(wait);
    const file = new URL(`raw/${name}.png`, OUT);
    await page.screenshot({ path: fileURLToPath(file) });
    await page.close();

    const src = `data:image/png;base64,${(await readFile(file)).toString("base64")}`;
    const kind = viewport === PHONE ? "phone" : "laptop";
    const framer = await browser.newPage({ viewport: kind === "laptop" ? { width: 1800, height: 1240 } : { width: 600, height: 1100 }, deviceScaleFactor: 2 });
    await framer.setContent(frameHtml(kind, src), { waitUntil: "load" });
    await framer.screenshot({ path: fileURLToPath(new URL(`framed/${name}.png`, OUT)) });
    await framer.close();
    console.log(`✓ ${name}`);
  }

  const raw = (n) => readFile(new URL(`raw/${n}.png`, OUT)).then((b) => `data:image/png;base64,${b.toString("base64")}`).catch(() => null);
  const [desk, phone] = await Promise.all([raw("home"), raw("phone-overview")]);
  if (desk && phone) {
    const hero = await browser.newPage({ viewport: { width: 2000, height: 1250 }, deviceScaleFactor: 2 });
    await hero.setContent(heroHtml(desk, phone), { waitUntil: "load" });
    await hero.screenshot({ path: fileURLToPath(new URL("framed/hero.png", OUT)) });
    await hero.close();
    console.log("✓ hero");
  }
  await writeFile(new URL("README.txt", OUT), `Generated ${new Date().toISOString()} by npm run mockups.\nraw/: 2x screenshots. framed/: device frames and hero.png.\n`);
} finally {
  await browser.close();
  await server.close();
}
