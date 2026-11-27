import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Webex Call Data Viewer',
  description: 'Xem và export dữ liệu cuộc gọi thu thập từ Webex Contact Center',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  )
}
