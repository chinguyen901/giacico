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
    `SELECT interaction_id, org_id, flow_id, flow_version_label, entry_point_id,
            ani, dnis, pstn_region, customer_type, vip_matched, routing_decision,
            queue_id, queue_name, team_id, team_name, tenant_id,
            agent_id, agent_name, agent_email, agent_session_id,
            call_status, started_at, answered_at, ended_at,
            duration_seconds, talk_duration_seconds, hold_duration_seconds,
            wrapup_code, disconnect_reason, transfer_count, conference_count,
            metadata, last_event_type, last_event_at, created_at, updated_at
     FROM call_interactions
     ${where}
     ORDER BY updated_at DESC NULLS LAST
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    listParams
  )

  const countRows = await sql(
    `SELECT COUNT(*)::int AS total FROM call_interactions ${where}`,
    params
  )

  return NextResponse.json({ rows, total: countRows[0]?.total ?? 0 })
}
