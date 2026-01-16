import http from "http";
import fetchContributions from "./api/fetch-contributions.js";

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  // ✅ CORS HEADERS (THIS IS THE FIX)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Route
  if (req.url === "/api/fetch-contributions" && req.method === "GET") {
    try {
      const data = await fetchContributions();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Internal server error" }));
    }
    return;
  }

  // Fallback
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, () => {
  console.log(`Ledger backend running on http://localhost:${PORT}`);
});
