// src/config/env.ts
import dotenv from 'dotenv'
import path from 'path'

const environment = process.env.NODE_ENV || 'development'
dotenv.config({ path: `.env.${environment}` })

export {}
