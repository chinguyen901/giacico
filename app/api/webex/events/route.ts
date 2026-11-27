
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID, createHash } from 'crypto'
import { getSql } from '@/lib/db'
// import { verifyWebexSecret } from '@/lib/auth'

function pick(...values: unknown[]): string | null {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') {
      return String(v)
    }
  }
  return null
}

function pickNumber(...values: unknown[]): number | null {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') {
      const n = Number(v)
      if (!Number.isNaN(n)) return n
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  // Bật lại xác thực khi triển khai production:
  // if (!verifyWebexSecret(req)) {
  //   return NextResponse.json(
  //     { error: 'unauthorized' },
  //     { status: 401 }
  //   )
  // }

  let body: Record<string, any>

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'invalid json body' },
      { status: 400 }
    )
  }

  const interactionId = pick(
    body.interaction_id,
    body.InteractionId,
    body.interactionId
  )

  const eventType =
    pick(body.event_type, body.EventType, body.eventType) ?? 'UNKNOWN'

  const eventTimestamp =
    pick(body.event_timestamp, body.EventTimestamp) ??
    new Date().toISOString()

  const source = pick(body.source) ?? 'webex_contact_center'

  const flowId = pick(
    body.flow?.flow_id,
    body.FlowId,
    body.flowId
  )

  const flowVersionLabel = pick(
    body.flow?.flow_version_label,
    body.FlowVersionLabel,
    body.flowVersionLabel
  )

  const entryPointId = pick(
    body.flow?.entry_point_id,
    body.EntryPointId,
    body.entryPointId
  )

  const orgId = pick(body.org_id, body.OrgId, body.orgId)

  const outboundType = pick(body.outbound_type, body.outboundType)

  const callbackType = pick(body.callback?.type, body.CallbackType)
  const callbackReason = pick(body.callback?.reason, body.CallbackReason)
  const scheduleSourceInteractionId = pick(
    body.schedule_source_interaction_id,
    body.ScheduleSourceInteractionId
  )
  // Headers có thể là object (SIP headers) — giữ nguyên, không ép chuỗi.
  const headers = body.Headers ?? body.headers

  const ani = pick(body.calling_side?.ani, body.ANI, body.ani)
  const dnis = pick(body.calling_side?.dnis, body.DNIS, body.dnis)
  const pstnRegion = pick(
    body.calling_side?.pstn_region,
    body.PSTNRegion,
    body.pstnRegion
  )

  const customerType = pick(
    body.classification?.customer_type,
    body.customerType
  )

  const vipMatchedRaw =
    body.classification?.vip_matched ??
    body.vipMatched ??
    null

  const vipMatched =
    vipMatchedRaw === null ? null : Boolean(vipMatchedRaw)

  const routingDecision = pick(
    body.routing?.decision,
    body.routingDecision
  )

  const queueId = pick(
    body.queue?.id,
    body.routing?.queue_id,
    body.QueueID,
    body.queueId
  )

  const queueName = pick(
    body.queue?.name,
    body.routing?.queue_name,
    body.QueueName,
    body.queueName
  )

  const teamId = pick(
    body.team?.id,
    body.routing?.team_id,
    body.TeamID,
    body.teamId
  )

  const teamName = pick(
    body.team?.name,
    body.routing?.team_name,
    body.TeamName,
    body.teamName
  )

  const tenantId = pick(body.tenant_id, body.TenantID, body.tenantId)

  const agentId = pick(
    body.agent?.id,
    body.AgentID,
    body.agentId
  )

  const agentName = pick(
    body.agent?.name,
    body.AgentName,
    body.agentName
  )

  // Webex gửi field email agent là "AgentEmailID" (không phải "AgentEmail").
  const agentEmail = pick(
    body.agent?.email,
    body.AgentEmailID,
    body.agentEmail
  )

  const agentSessionId = pick(
    body.agent?.session_id,
    body.AgentSessionID,
    body.agentSessionId
  )

  // Webex không expose timestamp riêng cho AgentAccepted/ContactEnded/CALL_COMPLETED qua Flow —
  // nếu Flow không gửi được, dùng thời điểm Vercel nhận request làm xấp xỉ.
  // Có agent_id nghĩa là cuộc gọi chắc chắn đã được answer, kể cả khi event_type không nói rõ
  // (trường hợp gửi gộp 1 request duy nhất kiểu CALL_COMPLETED).
  const answeredAt =
    pick(body.timestamps?.answered_at, body.AnsweredAt, body.answeredAt) ??
    (/answer|accept/i.test(eventType) || agentId ? eventTimestamp : null)

  const endedAt =
    pick(body.timestamps?.ended_at, body.EndedAt, body.endedAt) ??
    (/end|disconnect|complet/i.test(eventType) ? eventTimestamp : null)

  const disconnectReason = pick(
    body.disconnect_reason,
    body.DisconnectReason,
    body.disconnectReason
  )

  const wrapupCode = pick(
    body.wrapup_code,
    body.WrapupCode,
    body.wrapupCode
  )

  const durationSeconds = pickNumber(
    body.duration_seconds,
    body.DurationSeconds,
    body.durationSeconds
  )

  const talkDurationSeconds = pickNumber(
    body.talk_duration_seconds,
    body.TalkDurationSeconds,
    body.talkDurationSeconds
  )

  // Dữ liệu phụ không có cột riêng (CAD, outbound_type, callback, InboundChannel...) —
  // giữ lại trong metadata JSONB thay vì bỏ qua, merge dần qua từng event.
  // CAD có thể là object lồng nhau — giữ nguyên kiểu dữ liệu, không ép thành chuỗi.
  const cad = body.agent?.cad ?? body.CAD
  const metadataEntries: Record<string, unknown> = {}
  if (cad !== undefined) metadataEntries.cad = cad
  if (outboundType !== null) metadataEntries.outbound_type = outboundType
  if (callbackType !== null || callbackReason !== null) {
    metadataEntries.callback = { type: callbackType, reason: callbackReason }
  }
  if (scheduleSourceInteractionId !== null)
    metadataEntries.schedule_source_interaction_id = scheduleSourceInteractionId
  if (headers !== undefined) metadataEntries.headers = headers
  if (body.InboundChannel !== undefined)
    metadataEntries.inbound_channel = body.InboundChannel
  if (body.RoutingStrategyID !== undefined)
    metadataEntries.routing_strategy_id = body.RoutingStrategyID
  const metadata =
    Object.keys(metadataEntries).length > 0 ? metadataEntries : null

  const payloadId = randomUUID()

  const payloadHash = createHash('sha256')
    .update(JSON.stringify(body))
    .digest('hex')

  const eventId = randomUUID()

  const sql = getSql()

  try {
    // Không có interaction_id: chỉ lưu raw payload.
    if (!interactionId) {
      await sql`
        INSERT INTO call_raw_payloads (
          payload_id,
          interaction_id,
          source,
          event_type,
          payload,
          payload_hash
        )
        VALUES (
          ${payloadId},
          NULL,
          ${source},
          ${eventType},
          ${JSON.stringify(body)}::jsonb,
          ${payloadHash}
        )
      `

      return NextResponse.json({
        ok: true,
        stored: 'raw_only',
        payload_id: payloadId
      })
    }

    // 1. UPSERT interaction trước để thỏa mãn foreign key.
    // 2. INSERT event.
    // 3. INSERT raw payload.
    // Cả ba thao tác nằm trong một transaction.
    await sql.transaction([
      sql`
        INSERT INTO call_interactions (
          interaction_id,
          org_id,
          flow_id,
          flow_version_label,
          entry_point_id,
          ani,
          dnis,
          pstn_region,
          customer_type,
          vip_matched,
          routing_decision,
          queue_id,
          queue_name,
          team_id,
          team_name,
          tenant_id,
          agent_id,
          agent_name,
          agent_email,
          agent_session_id,
          call_status,
          started_at,
          answered_at,
          ended_at,
          disconnect_reason,
          wrapup_code,
          duration_seconds,
          talk_duration_seconds,
          metadata,
          last_event_type,
          last_event_at
        )
        VALUES (
          ${interactionId},
          ${orgId},
          ${flowId},
          ${flowVersionLabel},
          ${entryPointId},
          ${ani},
          ${dnis},
          ${pstnRegion},
          ${customerType},
          ${vipMatched},
          ${routingDecision},
          ${queueId},
          ${queueName},
          ${teamId},
          ${teamName},
          ${tenantId},
          ${agentId},
          ${agentName},
          ${agentEmail},
          ${agentSessionId},
          ${eventType},
          ${eventTimestamp},
          ${answeredAt},
          ${endedAt},
          ${disconnectReason},
          ${wrapupCode},
          ${durationSeconds},
          ${talkDurationSeconds},
          ${metadata ? JSON.stringify(metadata) : null}::jsonb,
          ${eventType},
          ${eventTimestamp}
        )
        ON CONFLICT (interaction_id) DO UPDATE SET
          org_id = COALESCE(EXCLUDED.org_id, call_interactions.org_id),
          flow_id = COALESCE(
            EXCLUDED.flow_id,
            call_interactions.flow_id
          ),
          flow_version_label = COALESCE(
            EXCLUDED.flow_version_label,
            call_interactions.flow_version_label
          ),
          entry_point_id = COALESCE(
            EXCLUDED.entry_point_id,
            call_interactions.entry_point_id
          ),
          ani = COALESCE(EXCLUDED.ani, call_interactions.ani),
          dnis = COALESCE(EXCLUDED.dnis, call_interactions.dnis),
          pstn_region = COALESCE(
            EXCLUDED.pstn_region,
            call_interactions.pstn_region
          ),
          customer_type = COALESCE(
            EXCLUDED.customer_type,
            call_interactions.customer_type
          ),
          vip_matched = COALESCE(
            EXCLUDED.vip_matched,
            call_interactions.vip_matched
          ),
          routing_decision = COALESCE(
            EXCLUDED.routing_decision,
            call_interactions.routing_decision
          ),
          queue_id = COALESCE(
            EXCLUDED.queue_id,
            call_interactions.queue_id
          ),
          queue_name = COALESCE(
            EXCLUDED.queue_name,
            call_interactions.queue_name
          ),
          team_id = COALESCE(
            EXCLUDED.team_id,
            call_interactions.team_id
          ),
          team_name = COALESCE(
            EXCLUDED.team_name,
            call_interactions.team_name
          ),
          tenant_id = COALESCE(
            EXCLUDED.tenant_id,
            call_interactions.tenant_id
          ),
          agent_id = COALESCE(
            EXCLUDED.agent_id,
            call_interactions.agent_id
          ),
          agent_name = COALESCE(
            EXCLUDED.agent_name,
            call_interactions.agent_name
          ),
          agent_email = COALESCE(
            EXCLUDED.agent_email,
            call_interactions.agent_email
          ),
          agent_session_id = COALESCE(
            EXCLUDED.agent_session_id,
            call_interactions.agent_session_id
          ),
          answered_at = COALESCE(
            EXCLUDED.answered_at,
            call_interactions.answered_at
          ),
          ended_at = COALESCE(
            EXCLUDED.ended_at,
            call_interactions.ended_at
          ),
          disconnect_reason = COALESCE(
            EXCLUDED.disconnect_reason,
            call_interactions.disconnect_reason
          ),
          wrapup_code = COALESCE(
            EXCLUDED.wrapup_code,
            call_interactions.wrapup_code
          ),
          -- Webex Flow không expose duration/talk-time trực tiếp (xem PLAN.md 2.2),
          -- nên tự tính từ started_at/answered_at/ended_at đã thu thập được.
          -- Lưu ý: started_at KHÔNG nằm trong SET ở đây (giữ nguyên giá trị gốc lúc
          -- insert đầu tiên) nên luôn ưu tiên call_interactions.started_at (giá trị
          -- đã lưu) hơn EXCLUDED.started_at (luôn = eventTimestamp của request hiện
          -- tại, kể cả khi request này chỉ là resend/retry) — nếu ưu tiên ngược lại,
          -- duration sẽ luôn ra 0 vì started_at/ended_at bị tính từ cùng 1 request.
          duration_seconds = COALESCE(
            EXCLUDED.duration_seconds,
            call_interactions.duration_seconds,
            CASE
              WHEN COALESCE(EXCLUDED.ended_at, call_interactions.ended_at) IS NOT NULL
               AND COALESCE(call_interactions.started_at, EXCLUDED.started_at) IS NOT NULL
              THEN EXTRACT(EPOCH FROM (
                COALESCE(EXCLUDED.ended_at, call_interactions.ended_at) -
                COALESCE(call_interactions.started_at, EXCLUDED.started_at)
              ))::INTEGER
            END
          ),
          talk_duration_seconds = COALESCE(
            EXCLUDED.talk_duration_seconds,
            call_interactions.talk_duration_seconds,
            CASE
              WHEN COALESCE(EXCLUDED.ended_at, call_interactions.ended_at) IS NOT NULL
               AND COALESCE(EXCLUDED.answered_at, call_interactions.answered_at) IS NOT NULL
              THEN EXTRACT(EPOCH FROM (
                COALESCE(EXCLUDED.ended_at, call_interactions.ended_at) -
                COALESCE(EXCLUDED.answered_at, call_interactions.answered_at)
              ))::INTEGER
            END
          ),
          metadata = COALESCE(call_interactions.metadata, '{}'::jsonb)
            || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
          call_status = EXCLUDED.call_status,
          last_event_type = EXCLUDED.last_event_type,
          last_event_at = EXCLUDED.last_event_at,
          updated_at = now()
      `,
      sql`
        INSERT INTO call_events (
          event_id,
          interaction_id,
          event_type,
          event_source,
          event_timestamp,
          flow_id,
          entry_point_id,
          ani,
          dnis,
          agent_id,
          queue_id,
          team_id,
          event_data
        )
        VALUES (
          ${eventId},
          ${interactionId},
          ${eventType},
          ${source},
          ${eventTimestamp},
          ${flowId},
          ${entryPointId},
          ${ani},
          ${dnis},
          ${agentId},
          ${queueId},
          ${teamId},
          ${JSON.stringify(body)}::jsonb
        )
      `,
      sql`
        INSERT INTO call_raw_payloads (
          payload_id,
          interaction_id,
          event_id,
          source,
          event_type,
          payload,
          payload_hash
        )
        VALUES (
          ${payloadId},
          ${interactionId},
          ${eventId},
          ${source},
          ${eventType},
          ${JSON.stringify(body)}::jsonb,
          ${payloadHash}
        )
      `
    ])

    return NextResponse.json({
      ok: true,
      interaction_id: interactionId,
      event_id: eventId,
      payload_id: payloadId
    })

  } catch (error) {
    console.error('[WEBEX_EVENTS_ERROR]', error)

    return NextResponse.json(
      {
        ok: false,
        error: 'failed_to_store_webex_event'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Webex events endpoint. Gửi POST với JSON body.'
  })
}
