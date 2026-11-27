-- Chạy file này trong Neon SQL Editor nếu đây là database MỚI.
-- Nếu bạn đã có database Neon từ sandbox trước (đã tạo call_interactions/call_events/call_raw_payloads
-- theo PLAN.md), có thể bỏ qua bước này và chỉ cần dùng connection string cũ.

CREATE TABLE IF NOT EXISTS call_interactions (
  interaction_id TEXT PRIMARY KEY,
  org_id TEXT,
  flow_id TEXT,
  flow_version_label TEXT,
  entry_point_id TEXT,
  ani TEXT,
  dnis TEXT,
  pstn_region TEXT,
  call_direction TEXT,
  caller_name TEXT,
  caller_number_raw TEXT,
  caller_number_normalized TEXT,
  contact_channel TEXT,
  customer_type TEXT,
  vip_matched BOOLEAN,
  routing_decision TEXT,
  queue_id TEXT,
  queue_name TEXT,
  team_id TEXT,
  team_name TEXT,
  agent_id TEXT,
  agent_name TEXT,
  agent_email TEXT,
  agent_session_id TEXT,
  tenant_id TEXT,
  call_status TEXT,
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  last_event_type TEXT,
  last_event_at TIMESTAMPTZ,
  disconnect_reason TEXT,
  duration_seconds INTEGER,
  ring_duration_seconds INTEGER,
  talk_duration_seconds INTEGER,
  hold_duration_seconds INTEGER,
  wrapup_code TEXT,
  transfer_count INTEGER DEFAULT 0,
  conference_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_events (
  event_id TEXT PRIMARY KEY,
  interaction_id TEXT REFERENCES call_interactions(interaction_id) ON DELETE CASCADE,
  event_type TEXT,
  event_source TEXT,
  event_timestamp TIMESTAMPTZ,
  flow_id TEXT,
  entry_point_id TEXT,
  ani TEXT,
  dnis TEXT,
  agent_id TEXT,
  queue_id TEXT,
  team_id TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS call_raw_payloads (
  payload_id TEXT PRIMARY KEY,
  interaction_id TEXT,
  event_id TEXT,
  source TEXT,
  event_type TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB,
  payload_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_call_interactions_started_at ON call_interactions (started_at);
CREATE INDEX IF NOT EXISTS idx_call_interactions_customer_type ON call_interactions (customer_type);
CREATE INDEX IF NOT EXISTS idx_call_interactions_ani ON call_interactions (ani);
CREATE INDEX IF NOT EXISTS idx_call_interactions_dnis ON call_interactions (dnis);
CREATE INDEX IF NOT EXISTS idx_call_events_interaction_id ON call_events (interaction_id);
CREATE INDEX IF NOT EXISTS idx_call_events_event_timestamp ON call_events (event_timestamp);
CREATE INDEX IF NOT EXISTS idx_call_raw_payloads_interaction_id ON call_raw_payloads (interaction_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_call_interactions_updated_at ON call_interactions;
CREATE TRIGGER trg_call_interactions_updated_at
  BEFORE UPDATE ON call_interactions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
