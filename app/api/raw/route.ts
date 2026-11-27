import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/db'

/**
 * Debug endpoint: trả về đúng JSON gốc Webex gửi lên (chưa qua parse/lọc field),
 * lấy thẳng từ call_raw_payloads. Dùng để đối chiếu tên field thật khi cấu hình
 * HTTP Request Activity trong Flow Designer.
 */
export async function GET(req: NextRequest) {
  const sql = getSql()
  const { searchParams } = new URL(req.url)

  const interactionId = searchParams.get('interaction_id')
  const limit = Math.min(Number(searchParams.get('limit') ?? 20) || 20, 100)

  const rows = interactionId
    ? await sql(
        `SELECT payload_id, interaction_id, event_id, source, event_type,
                received_at, payload
         FROM call_raw_payloads
         WHERE interaction_id = $1
         ORDER BY received_at DESC
         LIMIT $2`,
        [interactionId, limit]
      )
    : await sql(
        `SELECT payload_id, interaction_id, event_id, source, event_type,
                received_at, payload
         FROM call_raw_payloads
         ORDER BY received_at DESC
         LIMIT $1`,
        [limit]
      )

  return NextResponse.json({ rows })
}
