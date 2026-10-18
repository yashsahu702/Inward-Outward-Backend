// utils/helperFunctions.ts
import axios from 'axios'
import Decimal from 'decimal.js'

export function roundToTwoDecimals(
  num: number,
  mode: 'up' | 'down' | 'nearest' = 'nearest'
): number {
  let decimal = new Decimal(num)
  switch (mode) {
    case 'up':
      decimal = decimal.toDecimalPlaces(2, Decimal.ROUND_UP)
      break
    case 'down':
      decimal = decimal.toDecimalPlaces(2, Decimal.ROUND_DOWN)
      break
    case 'nearest':
    default:
      decimal = decimal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      break
  }
  return decimal.toNumber()
}

export async function geocodeAddress(
  address: string,
  apiKey: string,
  retries = 3
): Promise<{ lat: number; lng: number }> {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: apiKey,
        },
      }
    )

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location
      return { lat, lng }
    } else if (response.data.status === 'OVER_QUERY_LIMIT' && retries > 0) {
      // Wait before retrying
      await new Promise((res) => setTimeout(res, 1000))
      return geocodeAddress(address, apiKey, retries - 1)
    } else {
      throw new Error(
        `Geocoding failed for address: ${address}, Status: ${response.data.status}`
      )
    }
  } catch (error: any) {
    throw new Error(
      `Geocoding error for address: ${address}, Error: ${error.message}`
    )
  }
}

export function normalizeDate(dateString: string | Date): Date | null {
  if (!dateString) return null
  const date = new Date(dateString)
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
}
