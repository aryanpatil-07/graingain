import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_SiHtGJz6dpE9@ep-quiet-violet-b34nprcf.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const DEFAULT_NGOS = [
  { id: 'hh_pune', name: 'Helping Hands Pune', lat: 18.5204, lng: 73.8567, capacity: 50, address: 'Camp, Pune', phone: '+91-982-3001-101' },
  { id: 'akf_kothrud', name: 'AKF Food Centre', lat: 18.5114, lng: 73.8015, capacity: 75, address: 'Kothrud, Pune', phone: '+91-982-3001-102' },
  { id: 'care_aundh', name: 'Care & Share', lat: 18.5628, lng: 73.8096, capacity: 60, address: 'Aundh, Pune', phone: '+91-982-3001-103' },
  { id: 'ngo_viman', name: 'Viman NGO', lat: 18.4424, lng: 73.8108, capacity: 40, address: 'Viman Nagar, Pune', phone: '+91-982-3001-104' },
  { id: 'charity_pashan', name: 'Charity Pashan', lat: 18.5374, lng: 73.7931, capacity: 55, address: 'Pashan, Pune', phone: '+91-982-3001-105' }
];

const DEFAULT_RESTAURANTS = [
  { id: "rst_shivaji_1", name: "Spice Route Kitchen", lat: 18.5309, lng: 73.8472, area: "Shivaji Nagar" },
  { id: "rst_camp_1", name: "Harvest Bowl Collective", lat: 18.5167, lng: 73.8656, area: "Camp" },
  { id: "rst_deccan_1", name: "Urban Tiffin Works", lat: 18.5188, lng: 73.8413, area: "Deccan" },
  { id: "rst_kothrud_1", name: "Lakeview Table", lat: 18.5057, lng: 73.8072, area: "Kothrud" },
  { id: "rst_kothrud_2", name: "Copper Plate Diner", lat: 18.5142, lng: 73.7961, area: "Kothrud" },
  { id: "rst_aundh_1", name: "Nourish Point", lat: 18.5571, lng: 73.8043, area: "Aundh" },
  { id: "rst_aundh_2", name: "Metro Meal Studio", lat: 18.5672, lng: 73.8158, area: "Aundh" },
  { id: "rst_viman_1", name: "Skyline Kitchen Hub", lat: 18.4478, lng: 73.8261, area: "Viman Nagar" },
  { id: "rst_viman_2", name: "Runway Food Lab", lat: 18.4523, lng: 73.8141, area: "Viman Nagar" },
  { id: "rst_pashan_1", name: "Green Fork Bistro", lat: 18.5435, lng: 73.7872, area: "Pashan" },
  { id: "rst_pashan_2", name: "Peak Meal Co.", lat: 18.5358, lng: 73.8012, area: "Pashan" },
  { id: "rst_baner_1", name: "Northline Canteen", lat: 18.5594, lng: 73.7769, area: "Baner" }
];

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
    const ngoCount = await client.query("SELECT COUNT(*) FROM ngos");
    if (parseInt(ngoCount.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding initial NGO data into Neon DB...");
      for (const ngo of DEFAULT_NGOS) {
        await client.query(
          `INSERT INTO ngos (id, name, lat, lng, capacity, address, phone) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ngo.id, ngo.name, ngo.lat, ngo.lng, ngo.capacity, ngo.address, ngo.phone]
        );
      }
    }

    // Check & seed Restaurants
    const rstCount = await client.query("SELECT COUNT(*) FROM restaurants");
    if (parseInt(rstCount.rows[0].count, 10) === 0) {
      console.log("🌱 Seeding initial Restaurant data into Neon DB...");
      for (const rst of DEFAULT_RESTAURANTS) {
        await client.query(
          `INSERT INTO restaurants (id, name, lat, lng, area) VALUES ($1, $2, $3, $4, $5)`,
          [rst.id, rst.name, rst.lat, rst.lng, rst.area]
        );
      }
    }

    console.log("✅ Neon PostgreSQL Database Initialized Successfully!");
  } catch (err) {
    console.error("❌ Neon Database Init Error:", err.message);
  } finally {
    client.release();
  }
}
