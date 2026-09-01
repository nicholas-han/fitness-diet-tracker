import { startProductionServer } from "./production-server.mjs";

const port = 4175;
const { child: server, ready } = startProductionServer(port);

try {
  const actualPort = await ready;
  for (const path of ["/", "/plan", "/log", "/nutrition", "/history", "/review", "/settings"]) {
    const response = await fetch(`http://127.0.0.1:${actualPort}${path}`);
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  }
  const privateState = await fetch(`http://127.0.0.1:${actualPort}/api/local-state`);
  if (privateState.status !== 404) throw new Error(`/api/local-state returned ${privateState.status} in production`);
  console.log("Production route smoke test passed");
} finally {
  server.kill("SIGTERM");
}
