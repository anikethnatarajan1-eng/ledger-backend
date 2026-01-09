// ledger-backend/api/ping.js
export default function handler(req, res) {
  res.status(200).json({ ok: true, message: "Backend is live!" });
}
