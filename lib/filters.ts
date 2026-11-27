export function buildInteractionFilters(searchParams: URLSearchParams) {
  const customerType = searchParams.get('customer_type')
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const search = searchParams.get('search')

  const conditions: string[] = []
  const params: unknown[] = []

  if (customerType) {
    params.push(customerType)
    conditions.push(`customer_type = $${params.length}`)
  }
  if (dateFrom) {
    params.push(dateFrom)
    conditions.push(`started_at >= $${params.length}`)
  }
  if (dateTo) {
    params.push(dateTo)
    conditions.push(`started_at <= $${params.length}`)
  }
  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(ani ILIKE $${params.length} OR dnis ILIKE $${params.length})`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return { where, params }
}
