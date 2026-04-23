export function requireCronSecret(req) {
  const configured = process.env.CRON_SECRET;
  if (!configured) return;
  const header = req.headers["x-cron-secret"] || req.headers["X-Cron-Secret"] || req.headers.authorization || "";
  const token = String(header).startsWith("Bearer ") ? String(header).slice(7) : String(header);
  if (token !== configured) {
    const err = new Error("Invalid cron secret");
    err.statusCode = 403;
    throw err;
  }
}
