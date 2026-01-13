// index.js - Ledger Backend

import dotenv from "dotenv";
dotenv.config(); // load .env variables

import http from "http";
import { createClient } from "@supabase/supabase-js";

// Validate environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env"
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Simple router
const server = http.createServer(async (req, res) => {
  if (req.url === "/api/fetch-contributions") {
    try {
      // Example: Fetch contributions from your Supabase table
      const { data, error } = await supabase
        .from("contributions")
        .select("*")
        .order("contribution_date", { ascending: false });

      if (error) throw error;

      // Send JSON response
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ outcomes: Array.isArray(data) ? data : [] }));
    } catch (err) {
      console.error("Error fetching contributions:", err.message);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ outcomes: [] }));
    }
  } else {
    // Default route
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Ledger backend running");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Local dev server running on http://localhost:${PORT}`);
});
