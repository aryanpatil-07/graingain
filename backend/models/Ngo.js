import { pool } from "../config/db.js";

export const DEFAULT_NGOS = [
  { id: 'hh_pune', name: 'Helping Hands Pune', lat: 18.5204, lng: 73.8567, capacity: 50, address: 'Camp, Pune', phone: '+91-982-3001-101' },
  { id: 'akf_kothrud', name: 'AKF Food Centre', lat: 18.5114, lng: 73.8015, capacity: 75, address: 'Kothrud, Pune', phone: '+91-982-3001-102' },
  { id: 'care_aundh', name: 'Care & Share', lat: 18.5628, lng: 73.8096, capacity: 60, address: 'Aundh, Pune', phone: '+91-982-3001-103' },
  { id: 'ngo_viman', name: 'Viman NGO', lat: 18.4424, lng: 73.8108, capacity: 40, address: 'Viman Nagar, Pune', phone: '+91-982-3001-104' },
  { id: 'charity_pashan', name: 'Charity Pashan', lat: 18.5374, lng: 73.7931, capacity: 55, address: 'Pashan, Pune', phone: '+91-982-3001-105' }
];

export class NgoModel {
  static async findAll() {
    const result = await pool.query("SELECT * FROM ngos ORDER BY name ASC");
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query("SELECT * FROM ngos WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  static async count() {
    const result = await pool.query("SELECT COUNT(*) FROM ngos");
    return parseInt(result.rows[0].count, 10);
  }

  static async create(ngo) {
    const result = await pool.query(
      `INSERT INTO ngos (id, name, lat, lng, capacity, address, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [ngo.id, ngo.name, ngo.lat, ngo.lng, ngo.capacity, ngo.address, ngo.phone]
    );
    return result.rows[0];
  }
}
