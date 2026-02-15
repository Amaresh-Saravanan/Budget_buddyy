import dotenv from 'dotenv'
dotenv.config()

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../models/schema.js'

// Create Neon client
const sql = neon(process.env.DATABASE_URL)

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema })

// Test connection
export const testConnection = async () => {
  try {
    await sql`SELECT 1`
    console.log('✅ Neon Database Connected')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

export default db