import { spawn } from "node:child_process";

const port = 4175;
const server = spawn(process.execPath, ["dist/index.js"], { env: { ...process.env, NODE_ENV: "production", PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] });
let serverError = "";
server.stderr.on("data", chunk => { serverError += String(chunk); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 100 && !ready; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      ready = response.ok;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  if (!ready) throw new Error(`production server did not become ready${serverError ? `: ${serverError.trim()}` : ""}`);
  for (const path of ["/", "/plan", "/log", "/nutrition", "/history", "/review", "/settings"]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  }
  const privateState = await fetch(`http://127.0.0.1:${port}/api/local-state`);
  if (privateState.status !== 404) throw new Error(`/api/local-state returned ${privateState.status} in production`);
  console.log("Production route smoke test passed");
} finally {
  server.kill("SIGTERM");
}
