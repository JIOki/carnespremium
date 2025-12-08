import { Inter, Lora } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const lora = Lora({ 
  subsets: ['latin'], 
  variable: '--font-lora',
  weight: ['400', '500', '600', '700'],
  display: 'swap'
})

export const metadata = {
  title: 'Carnes Premium - Los Mejores Cortes Entregados a tu Puerta',
  description: 'Descubre la excelencia gastronómica con nuestros cortes premium de carne. Entrega rápida, calidad garantizada y servicio excepcional.',
  keywords: 'carnes premium, cortes de carne, entrega a domicilio, carne de res, carnes selectas',
  authors: [{ name: 'MiniMax Agent' }],
  creator: 'MiniMax Agent',
  openGraph: {
    title: 'Carnes Premium - Los Mejores Cortes Entregados a tu Puerta',
    description: 'Descubre la excelencia gastronómica con nuestros cortes premium de carne.',
    url: 'https://carnespremium.com',
    siteName: 'Carnes Premium',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carnes Premium - Los Mejores Cortes',
    description: 'Descubre la excelencia gastronómica con nuestros cortes premium de carne.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${lora.variable}`}>
      <body className={`${inter.className} bg-neutral-50 text-neutral-900`}>
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'font-sans',
              duration: 4000,
              style: {
                background: '#FFFFFF',
                color: '#1C1C1C',
                border: '1px solid #EAEAEA',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-card)',
              },
              success: {
                iconTheme: {
                  primary: '#228B22',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#D93025',
                  secondary: '#FFFFFF',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}