import Header from '@/components/Header'
import Hero from '@/components/Hero'
import ProductGridSimple from '@/components/ProductGridSimple'
import Footer from '@/components/Footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <ProductGridSimple />
      <Footer />
    </main>
  )
}