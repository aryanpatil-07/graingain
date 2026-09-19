import http from "http";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import { pool, initDB } from "./db.js";
import { analyzeFood } from "./services/aiService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS enabled for frontend
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 5000;

// Initialize Database on Startup
initDB().catch((err) => console.error("Database initialization failed:", err));

// --- WEBSOCKETS CONTROLLER ---
io.on("connection", (socket) => {
  console.log(`🔌 WebSockets: Client connected (${socket.id})`);

  socket.emit("connected_ack", {
    message: "Connected to GrainGain Real-Time Engine",
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Client joins a specific role room (e.g., 'donor', 'ngo', 'dispatcher')
  socket.on("join_role", (role) => {
    socket.join(`role_${role}`);
    console.log(`👤 Socket ${socket.id} joined role room: role_${role}`);
  });

  // Real-time Surplus Food Request creation via WebSockets
  socket.on("create_request", async (data) => {
    try {
      const { description, food_type, expiry_hours, urgency, restaurant_id, ngo_id, ngo_name, eta_minutes } = data;
      
      const res = await pool.query(
        `INSERT INTO surplus_requests (description, food_type, expiry_hours, urgency, status, restaurant_id, ngo_id, ngo_name, eta_minutes)
         VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8)
         RETURNING *`,
        [
          description || "Surplus food package",
          food_type || "Prepared Meals",
          expiry_hours || 4.0,
          urgency || "MEDIUM",
          restaurant_id || "rst_shivaji_1",
          ngo_id || "hh_pune",
          ngo_name || "Helping Hands Pune",
          eta_minutes || 30
        ]
      );

      const newRequest = res.rows[0];

      // Add log
      await pool.query(
        `INSERT INTO delivery_logs (request_id, status, note) VALUES ($1, $2, $3)`,
        [newRequest.id, "PENDING", "Request created and pending NGO acceptance"]
      );

      console.log(`📢 WebSockets: Broadcast new surplus request #${newRequest.id}`);
      io.emit("request_created", newRequest);
    } catch (err) {
      console.error("❌ Socket create_request error:", err.message);
      socket.emit("error_alert", { message: "Failed to create request via WebSockets" });
    }
  });

  // Real-time Status Update via WebSockets
  socket.on("update_status", async (data) => {
    try {
      const { id, status, note } = data;
      const res = await pool.query(
        `UPDATE surplus_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [status, id]
      );

      if (res.rows.length === 0) {
        return socket.emit("error_alert", { message: "Request not found" });
      }

      const updatedRequest = res.rows[0];

      // Insert log entry
      await pool.query(
        `INSERT INTO delivery_logs (request_id, status, note) VALUES ($1, $2, $3)`,
        [id, status, note || `Status changed to ${status}`]
      );

      console.log(`📢 WebSockets: Request #${id} status updated to ${status}`);
      io.emit("status_updated", { request: updatedRequest, status, note });
    } catch (err) {
      console.error("❌ Socket update_status error:", err.message);
      socket.emit("error_alert", { message: "Failed to update status" });
    }
  });

  // Real-time Delivery Delay Alert via WebSockets
  socket.on("report_delay", async (data) => {
    try {
      const { id, delay_minutes, reason } = data;

      const res = await pool.query(
        `UPDATE surplus_requests
         SET delay_minutes = COALESCE(delay_minutes, 0) + $1,
             delay_reason = $2,
             status = 'DELAYED',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING *`,
        [delay_minutes, reason || "Traffic delay", id]
      );

      if (res.rows.length === 0) {
        return socket.emit("error_alert", { message: "Request not found" });
      }

      const updatedRequest = res.rows[0];

      await pool.query(
        `INSERT INTO delivery_logs (request_id, status, note) VALUES ($1, $2, $3)`,
        [id, "DELAYED", `Delivery delayed by ${delay_minutes} mins: ${reason}`]
      );

      console.log(`⚠️ WebSockets: Delivery delay reported for Request #${id}`);
      io.emit("delivery_delayed", {
        request: updatedRequest,
        delay_minutes,
        reason,
        timestamp: new Date().toISOString()
      });
      io.emit("status_updated", { request: updatedRequest, status: "DELAYED", note: `Delayed by ${delay_minutes} mins` });
    } catch (err) {
      console.error("❌ Socket report_delay error:", err.message);
      socket.emit("error_alert", { message: "Failed to report delay" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 WebSockets: Client disconnected (${socket.id})`);
  });
});

// --- REST API ENDPOINTS ---

// Health check endpoint
app.get("/health", async (req, res) => {
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
    res.status(500).json({ status: "error", database: "disconnected", error: err.message });
  }
});

// Main AI food analyze endpoint
app.post("/analyze", async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Please provide a non-empty 'description' field"
      });
    }

    if (description.length > 1000) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Description must be less than 1000 characters"
      });
    }

    const result = await analyzeFood(description.trim());
    res.json(result);
  } catch (err) {
    console.error("❌ Analyze endpoint error:", err);
    res.status(500).json({
      error: "Server error",
      message: err.message || "Unable to analyze food. Please try again later."
    });
  }
});

// GET /api/ngos — Fetch NGOs from PostgreSQL
app.get("/api/ngos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM ngos ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching NGOs:", err);
    res.status(500).json({ error: "Failed to fetch NGOs" });
  }
});

// GET /api/restaurants — Fetch Restaurants from PostgreSQL
app.get("/api/restaurants", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM restaurants ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching restaurants:", err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// GET /api/requests — Fetch surplus requests with logs from PostgreSQL
app.get("/api/requests", async (req, res) => {
  try {
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
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// POST /api/requests — Create surplus request & broadcast over WebSockets
app.post("/api/requests", async (req, res) => {
  try {
    const { description, food_type, expiry_hours, urgency, restaurant_id, ngo_id, ngo_name, eta_minutes } = req.body;

    const dbRes = await pool.query(
      `INSERT INTO surplus_requests (description, food_type, expiry_hours, urgency, status, restaurant_id, ngo_id, ngo_name, eta_minutes)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8)
       RETURNING *`,
      [
        description || "Food Surplus",
        food_type || "Prepared Meals",
        expiry_hours || 4.0,
        urgency || "MEDIUM",
        restaurant_id || "rst_shivaji_1",
        ngo_id || "hh_pune",
        ngo_name || "Helping Hands Pune",
        eta_minutes || 30
      ]
    );

    const newRequest = dbRes.rows[0];

    await pool.query(
      `INSERT INTO delivery_logs (request_id, status, note) VALUES ($1, $2, $3)`,
      [newRequest.id, "PENDING", "Request created and pending NGO acceptance"]
    );

    // Broadcast over WebSockets
    io.emit("request_created", newRequest);

    res.status(201).json(newRequest);
  } catch (err) {
    console.error("❌ Error creating request:", err);
    res.status(500).json({ error: "Failed to create surplus request" });
  }
});

// PATCH /api/requests/:id/status — Update status & broadcast over WebSockets
app.patch("/api/requests/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const dbRes = await pool.query(
      `UPDATE surplus_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const updatedRequest = dbRes.rows[0];

    await pool.query(
      `INSERT INTO delivery_logs (request_id, status, note) VALUES ($1, $2, $3)`,
      [id, status, note || `Status changed to ${status}`]
    );

    io.emit("status_updated", { request: updatedRequest, status, note });

    res.json(updatedRequest);
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).json({ error: "Failed to update request status" });
  }
});

// PATCH /api/requests/:id/delay — Report delay & broadcast over WebSockets
app.patch("/api/requests/:id/delay", async (req, res) => {
  try {
    const { id } = req.params;
    const { delay_minutes, reason } = req.body;

    const dbRes = await pool.query(
      `UPDATE surplus_requests
       SET delay_minutes = COALESCE(delay_minutes, 0) + $1,
           delay_reason = $2,
           status = 'DELAYED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [delay_minutes, reason || "Traffic delay", id]
    );

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ error: "Request not found" });
    }

    const updatedRequest = dbRes.rows[0];

    await pool.query(
      `INSERT INTO delivery_logs (request_id, status, note) VALUES ($1, $2, $3)`,
      [id, "DELAYED", `Delivery delayed by ${delay_minutes} mins: ${reason}`]
    );

    io.emit("delivery_delayed", {
      request: updatedRequest,
      delay_minutes,
      reason,
      timestamp: new Date().toISOString()
    });

    io.emit("status_updated", { request: updatedRequest, status: "DELAYED", note: `Delayed by ${delay_minutes} mins` });

    res.json(updatedRequest);
  } catch (err) {
    console.error("❌ Error reporting delay:", err);
    res.status(500).json({ error: "Failed to report delay" });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 GrainGain Server & WebSockets running on http://localhost:${PORT}`);
  console.log(`⚡ Neon DB Connected & Connected to Socket.io`);
});
