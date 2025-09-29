import mysql from 'mysql2/promise'

type Pool = mysql.Pool

let globalPool: Pool | null = null

export function getDbPool(): Pool {
  if (globalPool) return globalPool

  const {
    DB_HOST = 'localhost',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_NAME = 'eggmart',
    DB_PORT = '3306',
  } = process.env

  globalPool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: Number(DB_PORT),
    connectionLimit: 10,
    namedPlaceholders: true,
  })

  return globalPool
}

export async function query<T = any>(sql: string, params?: Record<string, any> | any[]): Promise<[T[], mysql.FieldPacket[]]> {
  const pool = getDbPool()
  return pool.query<T[]>(sql, params as any)
}


