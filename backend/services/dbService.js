import { pool } from "../config/db.js";
import { DEFAULT_NGOS, NgoModel } from "../models/Ngo.js";
import { DEFAULT_RESTAURANTS, RestaurantModel } from "../models/Restaurant.js";

export async function initDB() {
  const client = await pool.connect();
  try {
    console.log("⚡ Connecting to Neon PostgreSQL Database...");

    // Create NGOs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ngos (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        capacity INT NOT NULL,
        address TEXT,
        phone VARCHAR(50)
      );
    `);

    // Create Restaurants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lat DOUBLE PRECISION NOT NULL,
        lng DOUBLE PRECISION NOT NULL,
        area VARCHAR(100) NOT NULL
      );
    `);

    // Create Surplus Requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS surplus_requests (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        food_type VARCHAR(100) NOT NULL,
        expiry_hours NUMERIC(5,2) NOT NULL,
        urgency VARCHAR(20) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        restaurant_id VARCHAR(50),
        ngo_id VARCHAR(50),
        ngo_name VARCHAR(255),
        eta_minutes INT,
        delay_minutes INT DEFAULT 0,
        delay_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Delivery Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_logs (
        id SERIAL PRIMARY KEY,
        request_id INT REFERENCES surplus_requests(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check & seed NGOs
    const ngoCount = await NgoModel.count();
    if (ngoCount === 0) {
      console.log("🌱 Seeding initial NGO data into Neon DB...");
      for (const ngo of DEFAULT_NGOS) {
        await NgoModel.create(ngo);
      }
    }

    // Check & seed Restaurants
    const rstCount = await RestaurantModel.count();
    if (rstCount === 0) {
      console.log("🌱 Seeding initial Restaurant data into Neon DB...");
      for (const rst of DEFAULT_RESTAURANTS) {
        await RestaurantModel.create(rst);
      }
    }

    console.log("✅ Neon PostgreSQL Database Initialized Successfully!");
  } catch (err) {
    console.error("❌ Neon Database Init Error:", err.message);
  } finally {
    client.release();
  }
}
