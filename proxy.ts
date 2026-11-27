import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Bảo vệ dashboard + API đọc/export bằng Basic Auth vì repo/URL là public.
 * Không áp dụng cho /api/webex/events — endpoint đó dùng API_SECRET riêng (xem lib/auth.ts).
 * Nếu DASHBOARD_USER/DASHBOARD_PASSWORD chưa được set trong env, middleware bỏ qua (không khoá) —
 * luôn set 2 biến này trên Vercel trước khi public URL.
 */
export function proxy(req: NextRequest) {
  const expectedUser = process.env.DASHBOARD_USER
  const expectedPass = process.env.DASHBOARD_PASSWORD

  if (!expectedUser || !expectedPass) {
    return NextResponse.next()
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Basic ')) {
    const base64 = authHeader.slice('Basic '.length)
    const [user, pass] = Buffer.from(base64, 'base64').toString('utf-8').split(':')
    if (user === expectedUser && pass === expectedPass) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Webex Call Viewer"' },
  })
}

export const config = {
  matcher: ['/', '/api/interactions', '/api/export'],
}
