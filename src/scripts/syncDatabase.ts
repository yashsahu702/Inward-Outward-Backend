// src/syncDatabase.ts

import dotenv from 'dotenv'
import '../models'
import { sequelize } from '../models/index'

// dotenv.config() // Load environment variables

const syncDatabase = async () => {
  try {
    console.log('Starting database synchronization...')
    await sequelize.sync({ force: false, alter: true })
    console.log('Database synchronized successfully.')
    process.exit(0)
  } catch (error) {
    console.error('Error synchronizing the database:', error)
    process.exit(1)
  }
}

syncDatabase()
