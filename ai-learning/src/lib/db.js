import mysql from 'mysql2/promise';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host:     import.meta.env.DB_HOST,
      port:     Number(import.meta.env.DB_PORT),
      database: import.meta.env.DB_NAME,
      user:     import.meta.env.DB_USER,
      password: import.meta.env.DB_PASSWORD,
      connectionLimit: 10,
      charset: 'utf8mb4',
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}