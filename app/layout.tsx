import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/context/authContext'
import { AdminProvider } from '@/context/adminContext' // Add this import
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });
        //  ${_geist.className} ${_geistMono.className}  
export const metadata: Metadata = {
  title: 'Admin Dashboard - Kadick Integrated',
  description: 'Professional admin dashboard for employee management',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`

        font-sans antialiased`}>
        <AuthProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
          <Toaster richColors position="top-right" />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}