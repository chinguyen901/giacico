import { NextRequest, NextResponse } from 'next/server'
import { getSql } from '@/lib/db'
import { buildInteractionFilters } from '@/lib/filters'
import { toCsv } from '@/lib/csv'

const MAX_EXPORT_ROWS = 5000

export async function GET(req: NextRequest) {
  const sql = getSql()
  const { searchParams } = new URL(req.url)
  const { where, params } = buildInteractionFilters(searchParams)

  const rows = await sql(
    `SELECT interaction_id, org_id, flow_id, flow_version_label, entry_point_id,
            ani, dnis, pstn_region, customer_type, vip_matched, routing_decision,
            queue_id, queue_name, team_id, team_name, tenant_id,
            agent_id, agent_name, agent_email, agent_session_id,
            call_status, started_at, answered_at, ended_at,
            duration_seconds, talk_duration_seconds, hold_duration_seconds, wrapup_code,
            disconnect_reason, transfer_count, conference_count, metadata,
            last_event_type, last_event_at, created_at, updated_at
     FROM call_interactions
     ${where}
     ORDER BY updated_at DESC NULLS LAST
     LIMIT ${MAX_EXPORT_ROWS}`,
    params
  )

  const csv = toCsv(rows as Record<string, unknown>[])
  const filename = `call_interactions_${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
