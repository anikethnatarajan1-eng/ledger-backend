import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetchContributionsRoute from "./api/fetch-contributions.js";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/fetch-contributions", fetchContributionsRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ledger backend running on http://localhost:${PORT}`);
});
