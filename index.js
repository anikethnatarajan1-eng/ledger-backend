import express from "express";
import fetchContributions from "./api/fetch-contributions.js";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Ledger backend running");
});

app.get("/api/fetch-contributions", fetchContributions);

app.listen(PORT, () => {
  console.log(`Ledger backend running on http://localhost:${PORT}`);
});
