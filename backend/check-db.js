import dotenv from 'dotenv'
dotenv.config()

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function checkDB() {
  try {
    console.log('=== USERS ===')
    const users = await sql`SELECT * FROM users`
    console.log(JSON.stringify(users, null, 2))
    
    console.log('\n=== EXPENSES ===')
    const expenses = await sql`SELECT * FROM expenses`
    console.log(JSON.stringify(expenses, null, 2))
    
    console.log('\n=== SAVINGS ===')
    const savings = await sql`SELECT * FROM savings`
    console.log(JSON.stringify(savings, null, 2))
    
    console.log('\n=== SAVING GOALS ===')
    const savingGoals = await sql`SELECT * FROM saving_goals`
    console.log(JSON.stringify(savingGoals, null, 2))
    
    console.log('\n=== REMINDERS ===')
    const reminders = await sql`SELECT * FROM reminders`
    console.log(JSON.stringify(reminders, null, 2))
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkDB()
