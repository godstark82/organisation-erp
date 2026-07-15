import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"
import { AppProviders } from "@/components/providers/app-providers"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "AgencyOS",
    template: "%s | AgencyOS",
  },
  description: "Premium agency operations platform for modern teams",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} font-sans antialiased`}
    >
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
