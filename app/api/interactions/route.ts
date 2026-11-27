import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/db'
import { buildInteractionFilters } from '@/lib/filters'

export async function GET(req: NextRequest) {
  const sql = getSql()
  const { searchParams } = new URL(req.url)

  const limit = Math.min(Number(searchParams.get('limit') ?? 50) || 50, 200)
  const offset = Math.max(Number(searchParams.get('offset') ?? 0) || 0, 0)

  const { where, params } = buildInteractionFilters(searchParams)

  const listParams = [...params, limit, offset]
  const limitIdx = params.length + 1
  const offsetIdx = params.length + 2

  const rows = await sql(
    `SELECT interaction_id, ani, dnis, customer_type, vip_matched, routing_decision,
            queue_name, team_name, agent_name, call_status, started_at, ended_at,
            duration_seconds, disconnect_reason
     FROM call_interactions
     ${where}
     ORDER BY started_at DESC NULLS LAST
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listParams
  )

  const countRows = await sql(
    `SELECT COUNT(*)::int AS total FROM call_interactions ${where}`,
    params
  )

  return NextResponse.json({ rows, total: countRows[0]?.total ?? 0 })
}
