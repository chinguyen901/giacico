import { neon } from '@neondatabase/serverless'

/**
 * neon() trả về một hàm có thể gọi theo 2 cách:
 *  - sql`SELECT ...`          (tagged template, query cố định)
 *  - sql(text, params)        (dùng khi cần build query động/có filter)
 */
export function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }
  return neon(url)
}
