'use client'

import { useCallback, useEffect, useState } from 'react'

type Interaction = {
  interaction_id: string
  ani: string | null
  dnis: string | null
  customer_type: string | null
  vip_matched: boolean | null
  routing_decision: string | null
  queue_name: string | null
  team_name: string | null
  agent_name: string | null
  call_status: string | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  disconnect_reason: string | null
}

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
              <th className="px-4 py-3">Interaction ID</th>
              <th className="px-4 py-3">ANI</th>
              <th className="px-4 py-3">DNIS</th>
              <th className="px-4 py-3">Loại KH</th>
              <th className="px-4 py-3">Queue</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Bắt đầu</th>
              <th className="px-4 py-3">Thời lượng (s)</th>
              <th className="px-4 py-3">Lý do kết thúc</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-slate-400">
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.interaction_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.interaction_id}</td>
                  <td className="px-4 py-2">{r.ani ?? '-'}</td>
                  <td className="px-4 py-2">{r.dnis ?? '-'}</td>
                  <td className="px-4 py-2">{r.customer_type ?? '-'}</td>
                  <td className="px-4 py-2">{r.queue_name ?? '-'}</td>
                  <td className="px-4 py-2">{r.agent_name ?? '-'}</td>
                  <td className="px-4 py-2">{r.call_status ?? '-'}</td>
                  <td className="px-4 py-2">{r.started_at ? new Date(r.started_at).toLocaleString('vi-VN') : '-'}</td>
                  <td className="px-4 py-2">{r.duration_seconds ?? '-'}</td>
                  <td className="px-4 py-2">{r.disconnect_reason ?? '-'}</td>
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
