import { pool } from "../config/db.js";

export class HealthController {
  static async getHealth(req, res) {
    try {
      const dbRes = await pool.query("SELECT NOW()");
      res.json({
        status: "ok",
        database: "connected",
        db_time: dbRes.rows[0].now,
        websockets: "active",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({
        status: "error",
        database: "disconnected",
        error: err.message
      });
    }
  }
}
