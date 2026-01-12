import http from "http";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Ledger backend running");
});

server.listen(3000, () => {
  console.log("Local dev server running on http://localhost:3000");
});
