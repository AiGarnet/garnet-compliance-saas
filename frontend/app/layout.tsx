import type { Metadata } from 'next'
import './globals.css'
import './styles.css'

export const metadata: Metadata = {
  title: 'GarnetAI - Compliance Platform',
  description: 'Compliance management platform for SOC 2, ISO 27001, and more',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        {/* Skip link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        
        {children}
      </body>
    </html>
  )
} 