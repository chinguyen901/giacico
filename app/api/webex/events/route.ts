import { NextRequest, NextResponse } from 'next/server'
import { randomUUID, createHash } from 'crypto'
import { getSql } from '@/lib/db'
import { verifyWebexSecret } from '@/lib/auth'

/** Lấy giá trị đầu tiên không rỗng, để chấp nhận nhiều kiểu tên field Webex có thể gửi. */
function pick(...values: unknown[]): string | null {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return String(v)
  }
  return null
}

export async function POST(req: NextRequest) {
  if (!verifyWebexSecret(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: Record<string, any>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 })
  }

  const sql = getSql()

  const interactionId = pick(body.interaction_id, body.InteractionId, body.interactionId)
  const eventType = pick(body.event_type, body.EventType, body.eventType) ?? 'UNKNOWN'
  const eventTimestamp = pick(body.event_timestamp, body.EventTimestamp) ?? new Date().toISOString()
  const source = pick(body.source) ?? 'webex_contact_center'

  const flowId = pick(body.flow?.flow_id, body.FlowId, body.flowId)
  const entryPointId = pick(body.flow?.entry_point_id, body.EntryPointId, body.entryPointId)
  const ani = pick(body.calling_side?.ani, body.ANI, body.ani)
  const dnis = pick(body.calling_side?.dnis, body.DNIS, body.dnis)
  const customerType = pick(body.classification?.customer_type, body.customerType)
  const vipMatchedRaw = body.classification?.vip_matched ?? body.vipMatched ?? null
  const vipMatched = vipMatchedRaw === null ? null : Boolean(vipMatchedRaw)
  const routingDecision = pick(body.routing?.decision, body.routingDecision)
  const queueId = pick(body.routing?.queue_id, body.queueId)
  const queueName = pick(body.routing?.queue_name, body.queueName)

  // Luôn lưu raw payload trước, bất kể payload có đủ field hay không — không bao giờ mất dữ liệu gốc.
  const payloadId = randomUUID()
  const payloadHash = createHash('sha256').update(JSON.stringify(body)).digest('hex')

  await sql(
    `INSERT INTO call_raw_payloads (payload_id, interaction_id, source, event_type, payload, payload_hash)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
    [payloadId, interactionId, source, eventType, JSON.stringify(body), payloadHash]
  )

  if (!interactionId) {
    return NextResponse.json({ ok: true, stored: 'raw_only', payload_id: payloadId })
  }

  const eventId = randomUUID()
  await sql(
    `INSERT INTO call_events (event_id, interaction_id, event_type, event_source, event_timestamp, flow_id, entry_point_id, ani, dnis, queue_id, event_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
    [eventId, interactionId, eventType, source, eventTimestamp, flowId, entryPointId, ani, dnis, queueId, JSON.stringify(body)]
  )

  await sql(
    `INSERT INTO call_interactions (
       interaction_id, flow_id, entry_point_id, ani, dnis, customer_type, vip_matched,
       routing_decision, queue_id, queue_name, call_status, started_at, last_event_type, last_event_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     ON CONFLICT (interaction_id) DO UPDATE SET
       flow_id = COALESCE(EXCLUDED.flow_id, call_interactions.flow_id),
       entry_point_id = COALESCE(EXCLUDED.entry_point_id, call_interactions.entry_point_id),
       ani = COALESCE(EXCLUDED.ani, call_interactions.ani),
       dnis = COALESCE(EXCLUDED.dnis, call_interactions.dnis),
       customer_type = COALESCE(EXCLUDED.customer_type, call_interactions.customer_type),
       vip_matched = COALESCE(EXCLUDED.vip_matched, call_interactions.vip_matched),
       routing_decision = COALESCE(EXCLUDED.routing_decision, call_interactions.routing_decision),
       queue_id = COALESCE(EXCLUDED.queue_id, call_interactions.queue_id),
       queue_name = COALESCE(EXCLUDED.queue_name, call_interactions.queue_name),
       call_status = EXCLUDED.call_status,
       last_event_type = EXCLUDED.last_event_type,
       last_event_at = EXCLUDED.last_event_at,
       updated_at = now()`,
    [
      interactionId, flowId, entryPointId, ani, dnis, customerType, vipMatched,
      routingDecision, queueId, queueName, eventType, eventTimestamp, eventType, eventTimestamp,
    ]
  )

  return NextResponse.json({ ok: true, interaction_id: interactionId, event_id: eventId, payload_id: payloadId })
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Webex events endpoint. Gửi POST với header x-api-secret.' })
}
