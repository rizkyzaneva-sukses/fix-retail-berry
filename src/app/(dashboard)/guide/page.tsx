"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { BookOpen, HelpCircle, Workflow, Shield } from "lucide-react"

export default function GuidePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Panduan & FAQ</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Panduan Modul</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Pengambilan:</strong> Driver mencatat pickup dari kebun → auto-generate SJ + QR</p>
          <p><strong>Penerimaan:</strong> Sortir menimbang & memecah per kategori → stok bertambah</p>
          <p><strong>Stok:</strong> Live dari ledger mutasi, adjustment butuh approval untuk sorter</p>
          <p><strong>Produk:</strong> Pure (1 kategori) atau mixed (beberapa kategori, total rasio = 100%)</p>
          <p><strong>Penjualan:</strong> Stok dipotong saat konfirmasi, termasuk toleransi susut</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Hak Akses</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><strong>Owner:</strong> Akses penuh semua modul</p>
          <p><strong>Driver:</strong> Pickup & stok (lihat saja)</p>
          <p><strong>Sorter:</strong> Penerimaan & stok</p>
          <p><strong>Sales:</strong> Produk, penjualan, retur (butuh approval)</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5" />FAQ</CardTitle></CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="q1"><AccordionTrigger>Kenapa stok terpotong lebih dari qty jual?</AccordionTrigger><AccordionContent>Karena toleransi susut. Misal JUMBO susut 2%, order 5 kg → stok terpotong 5,1 kg.</AccordionContent></AccordionItem>
            <AccordionItem value="q2"><AccordionTrigger>Bagaimana cara retur?</AccordionTrigger><AccordionContent>Sales ajukan retur per kategori, owner approve. Stok kembali saat disetujui.</AccordionContent></AccordionItem>
            <AccordionItem value="q3"><AccordionTrigger>Kenapa harga di invoice beda dari master?</AccordionTrigger><AccordionContent>Harga bisa di-override per order. Harga default dari master produk, tapi sales bisa ubah.</AccordionContent></AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
