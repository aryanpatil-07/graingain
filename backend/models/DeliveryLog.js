import { pool } from "../config/db.js";

export class DeliveryLogModel {
  /**
   * Insert a delivery status log for a request
   */
  static async create(requestId, status, note = "") {
    const result = await pool.query(
      `INSERT INTO delivery_logs (request_id, status, note)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [requestId, status, note]
    );
    return result.rows[0];
  }

  /**
   * Fetch all delivery logs for a given request ID
   */
  static async findByRequestId(requestId) {
    const result = await pool.query(
      `SELECT * FROM delivery_logs
       WHERE request_id = $1
       ORDER BY created_at DESC`,
      [requestId]
    );
    return result.rows;
  }
}
