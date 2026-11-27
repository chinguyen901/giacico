/**
 * Webex Flow gọi POST /api/webex/events kèm header x-api-secret (hoặc Authorization: Bearer <secret>).
 * Đây là secret riêng, khác với Basic Auth bảo vệ dashboard/export (xem proxy.ts).
 */
export function verifyWebexSecret(req: Request): boolean {
  const expected = process.env.API_SECRET
  if (!expected) return false

  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const custom = req.headers.get('x-api-secret')
  const provided = custom ?? bearer

  return provided === expected
}
