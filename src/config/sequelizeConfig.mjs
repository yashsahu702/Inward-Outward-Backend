import dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` })

export default {
  development: {
    url: process.env.PG_URI,
    dialect: 'postgres',
    logging: true,
  },
  test: {
    url: process.env.PG_URI,
    dialect: 'postgres',
    logging: false,
  },
  uat: {
    url: process.env.PG_URI,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    url: process.env.PG_URI,
    dialect: 'postgres',
    logging: false,
  },
}
