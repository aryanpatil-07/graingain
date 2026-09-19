/**
 * Root db.js forwarding to backend/config/db.js and backend/services/dbService.js
 */
export { pool } from "./backend/config/db.js";
export { initDB } from "./backend/services/dbService.js";
export { DEFAULT_NGOS } from "./backend/models/Ngo.js";
export { DEFAULT_RESTAURANTS } from "./backend/models/Restaurant.js";
