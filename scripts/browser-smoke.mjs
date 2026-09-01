import { existsSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { startProductionServer } from "./production-server.mjs";

const chromeCandidates = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "google-chrome", "chromium"];
const commandExists = candidate => candidate && (candidate.includes("/") ? existsSync(candidate) : (() => { try { execFileSync("which", [candidate], { stdio: "ignore" }); return true; } catch { return false; } })());
const chrome = chromeCandidates.find(commandExists);
if (!chrome) throw new Error("Chrome/Chromium not found; set CHROME_BIN to run browser smoke tests");

const port = 4176;
const { child: server, ready } = startProductionServer(port);
const runChrome = (url, windowSize) => new Promise((resolve, reject) => {
  const child = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-sandbox", "--virtual-time-budget=5000", `--window-size=${windowSize}`, "--dump-dom", url], { stdio: ["ignore", "pipe", "pipe"] });
  let output = ""; let error = "";
  child.stdout.on("data", chunk => { output += String(chunk); });
  child.stderr.on("data", chunk => { error += String(chunk); });
  child.on("error", reject);
  child.on("close", code => code === 0 ? resolve(output) : reject(new Error(error || `Chrome exited with ${code}`)));
});

try {
  const actualPort = await ready;
  for (const [path, expected] of [["/", "Dashboard"], ["/log", "每日记录"], ["/nutrition", "饮食与购物"]]) {
    for (const viewport of ["1440,900", "390,844"]) {
      const html = await runChrome(`http://127.0.0.1:${actualPort}${path}`, viewport);
      if (!html.includes(expected)) throw new Error(`${path} at ${viewport} did not render ${expected}`);
    }
  }
  console.log("Desktop and mobile browser smoke test passed");
} finally {
  server.kill("SIGTERM");
}
