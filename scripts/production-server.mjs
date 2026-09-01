import { spawn } from "node:child_process";

export function startProductionServer(preferredPort) {
  const child = spawn(process.execPath, ["dist/index.js"], {
    env: { ...process.env, NODE_ENV: "production", PORT: String(preferredPort) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  let settled = false;

  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`production server did not become ready${stderr ? `: ${stderr.trim()}` : ""}`));
    }, 10000);
    const fail = error => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    };
    child.stdout.on("data", chunk => {
      stdout += String(chunk);
      const match = stdout.match(/Server running on https?:\/\/localhost:(\d+)\/?/);
      if (!match || settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(Number(match[1]));
    });
    child.stderr.on("data", chunk => { stderr += String(chunk); });
    child.once("error", fail);
    child.once("exit", code => fail(new Error(`production server exited with ${code}${stderr ? `: ${stderr.trim()}` : ""}`)));
  });

  return { child, ready };
}
