import { Inter, Lora } from 'next/font/google'
import './globals.css'

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${lora.variable}`}>
      <body className={`${inter.className} bg-neutral-50 text-neutral-900`}>
        {children}
      </body>
    </html>
  )
}