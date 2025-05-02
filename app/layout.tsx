import type React from "react"
import { OrderProvider } from "@/contexts/order-context"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <OrderProvider>{children}</OrderProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
