'use client'

import { useCallback, useEffect, useState } from 'react'

type Interaction = {
  interaction_id: string
  org_id: string | null
  flow_id: string | null
  flow_version_label: string | null
  entry_point_id: string | null
  ani: string | null
  dnis: string | null
  pstn_region: string | null
  customer_type: string | null
  vip_matched: boolean | null
  routing_decision: string | null
  queue_id: string | null
  queue_name: string | null
  team_id: string | null
  team_name: string | null
  tenant_id: string | null
  agent_id: string | null
  agent_name: string | null
  agent_email: string | null
  agent_session_id: string | null
  call_status: string | null
  started_at: string | null
  answered_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  talk_duration_seconds: number | null
  hold_duration_seconds: number | null
  wrapup_code: string | null
  disconnect_reason: string | null
  transfer_count: number | null
  conference_count: number | null
  metadata: Record<string, unknown> | null
  last_event_type: string | null
  last_event_at: string | null
  created_at: string | null
  updated_at: string | null
}

type Column = {
  id: string
  key: keyof Interaction
  label: string
  render?: (r: Interaction) => string
}

const COLUMNS: Column[] = [
  {
    id: 'updated_at',
    key: 'updated_at',
    label: 'Update lúc',
    render: (r) => (r.updated_at ? new Date(r.updated_at).toLocaleString('vi-VN') : '-'),
  },
  { id: 'last_event_type', key: 'last_event_type', label: 'Event mới nhất' },
  { id: 'interaction_id', key: 'interaction_id', label: 'Interaction ID' },
  { id: 'org_id', key: 'org_id', label: 'Org ID' },
  { id: 'flow_id', key: 'flow_id', label: 'Flow ID' },
  { id: 'flow_version_label', key: 'flow_version_label', label: 'Flow Version' },
  { id: 'entry_point_id', key: 'entry_point_id', label: 'Entry Point ID' },
  { id: 'ani', key: 'ani', label: 'ANI' },
  { id: 'dnis', key: 'dnis', label: 'DNIS' },
  { id: 'pstn_region', key: 'pstn_region', label: 'PSTN Region' },
  { id: 'customer_type', key: 'customer_type', label: 'Loại KH' },
  {
    id: 'vip_matched',
    key: 'vip_matched',
    label: 'VIP',
    render: (r) => (r.vip_matched === null ? '-' : r.vip_matched ? 'Có' : 'Không'),
  },
  { id: 'routing_decision', key: 'routing_decision', label: 'Routing' },
  { id: 'queue_id', key: 'queue_id', label: 'Queue ID' },
  { id: 'queue_name', key: 'queue_name', label: 'Queue' },
  { id: 'team_id', key: 'team_id', label: 'Team ID' },
  { id: 'team_name', key: 'team_name', label: 'Team' },
  { id: 'tenant_id', key: 'tenant_id', label: 'Tenant ID' },
  { id: 'agent_id', key: 'agent_id', label: 'Agent ID' },
  { id: 'agent_name', key: 'agent_name', label: 'Agent' },
  { id: 'agent_email', key: 'agent_email', label: 'Agent Email' },
  { id: 'agent_session_id', key: 'agent_session_id', label: 'Agent Session ID' },
  { id: 'call_status', key: 'call_status', label: 'Trạng thái' },
  {
    id: 'started_at',
    key: 'started_at',
    label: 'Bắt đầu',
    render: (r) => (r.started_at ? new Date(r.started_at).toLocaleString('vi-VN') : '-'),
  },
  {
    id: 'answered_at',
    key: 'answered_at',
    label: 'Trả lời',
    render: (r) => (r.answered_at ? new Date(r.answered_at).toLocaleString('vi-VN') : '-'),
  },
  {
    id: 'ended_at',
    key: 'ended_at',
    label: 'Kết thúc',
    render: (r) => (r.ended_at ? new Date(r.ended_at).toLocaleString('vi-VN') : '-'),
  },
  { id: 'duration_seconds', key: 'duration_seconds', label: 'Thời lượng (s)' },
  { id: 'talk_duration_seconds', key: 'talk_duration_seconds', label: 'Talk time (s)' },
  { id: 'hold_duration_seconds', key: 'hold_duration_seconds', label: 'Hold time (s)' },
  { id: 'wrapup_code', key: 'wrapup_code', label: 'Wrapup code' },
  { id: 'disconnect_reason', key: 'disconnect_reason', label: 'Lý do kết thúc' },
  { id: 'transfer_count', key: 'transfer_count', label: 'Transfer' },
  { id: 'conference_count', key: 'conference_count', label: 'Conference' },
  {
    id: 'headers',
    key: 'metadata',
    label: 'Headers',
    render: (r) => {
      const headers = r.metadata?.headers
      if (headers === undefined || headers === null) return '-'
      return typeof headers === 'string' ? headers : JSON.stringify(headers)
    },
  },
  {
    id: 'metadata_rest',
    key: 'metadata',
    label: 'Metadata (khác)',
    render: (r) => {
      if (!r.metadata) return '-'
      const { headers: _headers, ...rest } = r.metadata
      return Object.keys(rest).length > 0 ? JSON.stringify(rest) : '-'
    },
  },
  {
    id: 'last_event_at',
    key: 'last_event_at',
    label: 'Event lúc',
    render: (r) => (r.last_event_at ? new Date(r.last_event_at).toLocaleString('vi-VN') : '-'),
  },
  {
    id: 'created_at',
    key: 'created_at',
    label: 'Tạo lúc',
    render: (r) => (r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '-'),
  },
]

const LIMIT = 50

export default function Home() {
  const [rows, setRows] = useState<Interaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [offset, setOffset] = useState(0)

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (customerType) params.set('customer_type', customerType)
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    params.set('limit', String(LIMIT))
    params.set('offset', String(offset))
    return params.toString()
  }, [search, customerType, dateFrom, dateTo, offset])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/interactions?${buildQuery()}`)
      if (!res.ok) throw new Error(`Lỗi tải dữ liệu (${res.status})`)
      const data = await res.json()
      setRows(data.rows)
      setTotal(data.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  useEffect(() => {
    load()
  }, [load])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setOffset(0)
  }

  const exportHref = `/api/export?${buildQuery()}`

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Webex Call Data</h1>
        <p className="mt-1 text-sm text-slate-500">
          Dữ liệu cuộc gọi thu thập từ Webex Contact Center Flow Designer.
        </p>
      </header>

      <form
        onSubmit={handleFilterSubmit}
        className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Tìm ANI / DNIS</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="VD: 1001"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Loại khách</label>
          <select
            value={customerType}
            onChange={(e) => setCustomerType(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          >
            <option value="">Tất cả</option>
            <option value="VIP">VIP</option>
            <option value="STANDARD">STANDARD</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Từ ngày</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Đến ngày</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Lọc
        </button>

        <a
          href={exportHref}
          className="ml-auto rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Export CSV
        </a>
      </form>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {COLUMNS.map((col) => (
                <th key={col.id} className="whitespace-nowrap px-4 py-3">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-slate-400">
                  Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-slate-400">
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.interaction_id} className="border-t border-slate-100 hover:bg-slate-50">
                  {COLUMNS.map((col) => (
                    <td key={col.id} className="whitespace-nowrap px-4 py-2">
                      {col.render
                        ? col.render(r)
                        : ((r[col.key] as string | number | null) ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
        <span>
          {total === 0 ? '0 kết quả' : `${offset + 1}–${Math.min(offset + LIMIT, total)} / ${total}`}
        </span>
        <div className="flex gap-2">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Trước
          </button>
          <button
            disabled={offset + LIMIT >= total}
            onClick={() => setOffset(offset + LIMIT)}
            className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    </main>
  )
}
