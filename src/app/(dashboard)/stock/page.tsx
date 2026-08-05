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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Package, ArrowUpDown, Plus, Minus } from "lucide-react"

interface StockCard { category: string; color: string; currentKg: number }

export default function StockPage() {
  const [stocks] = useState<StockCard[]>([
    { category: "JUMBO", color: "#e11d48", currentKg: 0 },
    { category: "B", color: "#f59e0b", currentKg: 0 },
    { category: "AB MIX", color: "#22c55e", currentKg: 0 },
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stok</h1>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stocks.map(s => (
          <Card key={s.category}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{backgroundColor: s.color + "20"}}>
                  <Package className="h-5 w-5" style={{color: s.color}} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.category}</p>
                  <p className="text-2xl font-bold">{s.currentKg.toFixed(1)} <span className="text-sm font-normal">kg</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="movements">
        <TabsList>
          <TabsTrigger value="movements">Riwayat Mutasi</TabsTrigger>
          <TabsTrigger value="adjust">Adjustment</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mutasi Stok</CardTitle>
              <div className="flex gap-2">
                <Select><SelectTrigger className="w-40"><SelectValue placeholder="Tipe" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="in_sorting">Masuk (Sortir)</SelectItem>
                    <SelectItem value="out_sale">Keluar (Jual)</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="in_return">Retur</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="date" className="w-40" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Tanggal</TableHead><TableHead>Kategori</TableHead><TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Qty (kg)</TableHead><TableHead>Keterangan</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada mutasi</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjust">
          <Card>
            <CardHeader><CardTitle>Adjustment Stok</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Kategori</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">JUMBO</SelectItem>
                      <SelectItem value="2">B</SelectItem>
                      <SelectItem value="3">AB MIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Qty (+/-) kg</Label><Input type="number" step="0.1" placeholder="+10 atau -5" /></div>
                <div><Label>Alasan</Label><Textarea placeholder="Wajib diisi" /></div>
              </div>
              <Button>Simpan Adjustment</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer">
          <Card>
            <CardHeader><CardTitle>Transfer Antar Kategori</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Dari</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Asal" /></SelectTrigger>
                    <SelectContent><SelectItem value="1">JUMBO</SelectItem><SelectItem value="2">B</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Ke</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Tujuan" /></SelectTrigger>
                    <SelectContent><SelectItem value="2">B</SelectItem><SelectItem value="3">AB MIX</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Qty kg</Label><Input type="number" step="0.1" /></div>
                <div><Label>Alasan</Label><Input placeholder="Wajib" /></div>
              </div>
              <Button>Transfer</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
