import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase.from("contributions").select("*");
    if (error) throw error;
    res.json({ outcomes: data || [] });
  } catch (err) {
    console.error("Error fetching contributions:", err.message);
    res.status(500).json({ outcomes: [] });
  }
});

export default router;
