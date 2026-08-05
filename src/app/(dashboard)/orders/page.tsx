"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, FileText, Truck, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"

interface OrderItem { productId: number; productName: string; qtyKg: number; unitPrice: number; subtotal: number }
interface Order { id: number; invoice: string; customer: string; status: string; total: number; date: string }

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [items, setItems] = useState<OrderItem[]>([{ productId: 0, productName: "", qtyKg: 0, unitPrice: 0, subtotal: 0 }])
  const [form, setForm] = useState({
    customerId: "", saleDate: format(new Date(), "yyyy-MM-dd"), shippingPayer: "buyer_direct",
    shippingCost: 0, discountAmount: 0, notes: ""
  })

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  const total = Math.max(subtotal - form.discountAmount, 0) + (form.shippingPayer === "seller_billed" ? form.shippingCost : 0)

  const addItem = () => setItems([...items, { productId: 0, productName: "", qtyKg: 0, unitPrice: 0, subtotal: 0 }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  const handleSubmit = () => {
    if (!form.customerId || items.length === 0) return
    const inv = `INV-${format(new Date(), "yyyyMMdd")}-${String(orders.length + 1).padStart(4, "0")}`
    setOrders([...orders, { id: Date.now(), invoice: inv, customer: "Customer 1", status: "confirmed", total, date: form.saleDate }])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Penjualan</h1>
      <Tabs defaultValue="create">
        <TabsList>
          <TabsTrigger value="create">Buat Order</TabsTrigger>
          <TabsTrigger value="list">Daftar Penjualan</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader><CardTitle>Order Baru</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Pelanggan</Label>
                  <Select value={form.customerId} onValueChange={v => setForm({...form, customerId: v})}>
                    <SelectTrigger><SelectValue placeholder="Pilih pelanggan" /></SelectTrigger>
                    <SelectContent><SelectItem value="1">Customer 1</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Tanggal</Label><Input type="date" value={form.saleDate} onChange={e => setForm({...form, saleDate: e.target.value})} /></div>
                <div><Label>Penanggung Ongkir</Label>
                  <Select value={form.shippingPayer} onValueChange={v => setForm({...form, shippingPayer: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer_direct">Buyer bayar langsung</SelectItem>
                      <SelectItem value="seller_billed">Seller talangi, ditagih buyer</SelectItem>
                      <SelectItem value="seller_free">Free ongkir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Biaya Kirim</Label><Input type="number" value={form.shippingCost || ""} onChange={e => setForm({...form, shippingCost: parseFloat(e.target.value) || 0})} /></div>
              </div>

              <div>
                <Label>Item Produk</Label>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2">
                    <Select value={String(item.productId)} onValueChange={v => {
                      const newItems = [...items]; newItems[idx].productId = parseInt(v); setItems(newItems)
                    }}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="Produk" /></SelectTrigger>
                      <SelectContent><SelectItem value="1">Produk A</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Kg" className="w-24" value={item.qtyKg || ""} onChange={e => {
                      const newItems = [...items]
                      newItems[idx].qtyKg = parseFloat(e.target.value) || 0
                      newItems[idx].subtotal = newItems[idx].qtyKg * newItems[idx].unitPrice
                      setItems(newItems)
                    }} />
                    <Input type="number" placeholder="Harga/kg" className="w-32" value={item.unitPrice || ""} onChange={e => {
                      const newItems = [...items]
                      newItems[idx].unitPrice = parseFloat(e.target.value) || 0
                      newItems[idx].subtotal = newItems[idx].qtyKg * newItems[idx].unitPrice
                      setItems(newItems)
                    }} />
                    <span className="w-24 text-sm">Rp {item.subtotal.toLocaleString()}</span>
                    {items.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeItem(idx)}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="mt-2" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Tambah Item</Button>
              </div>

              <div><Label>Diskon</Label><Input type="number" value={form.discountAmount || ""} onChange={e => setForm({...form, discountAmount: parseFloat(e.target.value) || 0})} /></div>
              <div><Label>Catatan</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>

              <div className="p-4 bg-muted rounded-lg space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>Rp {subtotal.toLocaleString()}</span></div>
                {form.discountAmount > 0 && <div className="flex justify-between text-red-600"><span>Diskon</span><span>-Rp {form.discountAmount.toLocaleString()}</span></div>}
                {form.shippingPayer === "seller_billed" && form.shippingCost > 0 && <div className="flex justify-between"><span>Ongkir</span><span>Rp {form.shippingCost.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>Rp {total.toLocaleString()}</span></div>
              </div>
              <Button onClick={handleSubmit} className="w-full">Simpan Order</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Invoice</TableHead><TableHead>Pelanggan</TableHead><TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada order</TableCell></TableRow>
                ) : orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.invoice}</TableCell>
                    <TableCell>{o.customer}</TableCell>
                    <TableCell>{o.date}</TableCell>
                    <TableCell><Badge className={statusColors[o.status]}>{o.status}</Badge></TableCell>
                    <TableCell className="text-right">Rp {o.total.toLocaleString()}</TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="outline" size="sm"><FileText className="h-3 w-3" /></Button>
                      {o.status === "confirmed" && <Button variant="outline" size="sm"><Truck className="h-3 w-3" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
