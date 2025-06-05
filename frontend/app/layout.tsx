import type { Metadata } from 'next'
import './globals.css'
import './styles.css'
import { ThemeInitializer } from '@/components/ThemeInitializer'

export const metadata: Metadata = {
  title: 'GarnetAI - Compliance Platform',
  description: 'Compliance management platform for SOC 2, ISO 27001, and more',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
      { url: '/IconOnly_Transparent_NoBuffer.png', sizes: '32x32', type: 'image/png' },
      { url: '/IconOnly_Transparent_NoBuffer.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: '/IconOnly_Transparent_NoBuffer.png',
    shortcut: '/favicon.ico'
  },
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
        
        <ThemeInitializer />
        {children}
      </body>
    </html>
  )
} 