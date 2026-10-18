import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
// dotenv.config() // Load environment variables from .env file

const sequelize = new Sequelize(process.env.PG_URI as string, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 50, // increase this based on expected concurrency
    min: 5,
    acquire: 30000, // 30s timeout while trying to get a connection
    idle: 10000, // remove idle connections after 10s
  },
})

// const sequelize = new Sequelize('kenyDb', 'posgres', process.env.PG_PASS, {
//   host: 'localhost',
//   dialect: 'postgres',
// })

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate()
    console.log('Connected to PostgreSQL using Sequelize')
  } catch (error) {
    console.error('Could not connect to PostgreSQL', error)
    process.exit(1)
  }
}

export default sequelize
