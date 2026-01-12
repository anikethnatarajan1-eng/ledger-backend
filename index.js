import express from "express";
import fetchContributions from "./api/fetch-contributions.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Example route
app.get("/api/fetch-contributions", fetchContributions);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
