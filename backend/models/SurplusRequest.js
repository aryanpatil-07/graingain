import { pool } from "../config/db.js";

export class SurplusRequestModel {
  /**
   * Fetch all surplus requests joined with their delivery logs ordered by newest first
   */
  static async findAllWithLogs() {
    const result = await pool.query(`
      SELECT r.*, 
        COALESCE(
          json_agg(
            json_build_object('id', l.id, 'status', l.status, 'note', l.note, 'created_at', l.created_at)
            ORDER BY l.created_at DESC
          ) FILTER (WHERE l.id IS NOT NULL), '[]'
        ) AS logs
      FROM surplus_requests r
      LEFT JOIN delivery_logs l ON r.id = l.request_id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    return result.rows;
  }

  /**
   * Find a single request by ID
   */
  static async findById(id) {
    const result = await pool.query("SELECT * FROM surplus_requests WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new surplus request
   */
  static async create({
    description = "Food Surplus",
    food_type = "Prepared Meals",
    expiry_hours = 4.0,
    urgency = "MEDIUM",
    restaurant_id = "rst_shivaji_1",
    ngo_id = "hh_pune",
    ngo_name = "Helping Hands Pune",
    eta_minutes = 30
  }) {
    const result = await pool.query(
      `INSERT INTO surplus_requests (
         description, food_type, expiry_hours, urgency, status,
         restaurant_id, ngo_id, ngo_name, eta_minutes
       )
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8)
       RETURNING *`,
      [
        description,
        food_type,
        expiry_hours,
        urgency,
        restaurant_id,
        ngo_id,
        ngo_name,
        eta_minutes
      ]
    );
    return result.rows[0];
  }

  /**
   * Update request status
   */
  static async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE surplus_requests
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  }

  /**
   * Report delay and update request
   */
  static async reportDelay(id, delayMinutes, reason = "Traffic delay") {
    const result = await pool.query(
      `UPDATE surplus_requests
       SET delay_minutes = COALESCE(delay_minutes, 0) + $1,
           delay_reason = $2,
           status = 'DELAYED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [delayMinutes, reason, id]
    );
    return result.rows[0] || null;
  }
}
