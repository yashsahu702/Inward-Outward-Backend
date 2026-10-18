/**
 * populateZonesAndWards.ts
 *
 * Usage:
 *    npx ts-node src/scripts/populateZonesAndWards.ts
 *
 * This script will:
 *  1) Connect to DB
 *  2) Create/find Zones
 *  3) Create/find Wards linked to the correct Zone
 *  4) Close DB connection
 *
 * Note: IDs in your JSON snippet are ignored here, because we let the DB
 *       generate new UUIDs or we can generate them ourselves. We match
 *       zones/wards by name so that we don't duplicate entries.
 */

import { v4 as uuidv4 } from 'uuid'

// If you have a shared env loader:
// import '../config/env' // ensures .env.{NODE_ENV} is loaded no need to do this already done in index.ts in the models folder may need to do this in some other cases

// OR if you don't have a shared env loader, do:
// import dotenv from 'dotenv'
// import path from 'path'
// const environment = process.env.NODE_ENV || 'development'
// dotenv.config({ path: `.env.${environment}` })

import { sequelize, Zone, Ward } from '../models' // adjust import paths if needed

async function main() {
  try {
    // 1) Connect
    await sequelize.authenticate()
    console.log('DB connection established.')

    // 2) Data we want to seed
    const data = [
      {
        zoneName: 'Zone 1',
        wards: ['C1', 'C2', 'C3', 'A'],
      },
      {
        zoneName: 'Zone 2',
        wards: ['D1', 'D2', 'D3', 'G/South'],
      },
      {
        zoneName: 'Zone 3',
        wards: ['B1', 'B2', 'E1', 'E2'],
      },
      {
        zoneName: 'Zone 4',
        wards: ['F/North', 'F/South', 'G/North'],
      },
    ]

    // 3) Create/find zones and wards
    for (const entry of data) {
      // 3a) Create or find the zone by zoneName
      let zone = await Zone.findOne({
        where: { zoneName: entry.zoneName },
      })

      if (!zone) {
        zone = await Zone.create({
          zoneId: uuidv4(),
          zoneName: entry.zoneName,
        })
        console.log(`Created Zone => ${entry.zoneName}`)
      } else {
        console.log(`Zone already exists => ${zone.zoneName}`)
      }

      // 3b) For each ward in this zone:
      for (const wardName of entry.wards) {
        let ward = await Ward.findOne({
          where: { wardName, zoneId: zone.zoneId },
        })

        if (!ward) {
          ward = await Ward.create({
            wardId: uuidv4(),
            wardName,
            zoneId: zone.zoneId,
          })
          console.log(`\tCreated Ward => ${wardName}`)
        } else {
          console.log(`\tWard already exists => ${wardName}`)
        }
      }
    }

    console.log('Zones and Wards populated successfully!')
  } catch (error) {
    console.error('ERROR in populateZonesAndWards.ts =>', error)
  } finally {
    await sequelize.close()
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
