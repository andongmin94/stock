import type { Metadata } from "next"

import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css"

export const metadata: Metadata = {
  title: "Stock",
  description: "Hyperliquid XYZ 시장가를 원화로 환산해 보는 사이드프로젝트",
  icons: {
    icon: [
      {
        url: "/stock.svg",
        type: "image/svg+xml",
      },
      {
        url: "/stock.png",
        type: "image/png",
      },
    ],
    apple: "/stock.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
