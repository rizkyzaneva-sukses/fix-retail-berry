"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle2, AlertTriangle } from "lucide-react"

export default function ReceivingPage() {
  const [search, setSearch] = useState("")
  const [selectedSJ, setSelectedSJ] = useState<string | null>(null)
  const [totalKg, setTotalKg] = useState(0)
  const [items, setItems] = useState<{name: string; kg: number; color: string}[]>([
    { name: "JUMBO", kg: 0, color: "#e11d48" },
    { name: "B", kg: 0, color: "#f59e0b" },
    { name: "AB MIX", kg: 0, color: "#22c55e" },
  ])

  const sortedTotal = items.reduce((s, i) => s + i.kg, 0)
  const diff = Math.abs(sortedTotal - totalKg)
  const tolerance = 0.15
  const balanced = sortedTotal > 0 && diff <= tolerance

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Penerimaan & Sortir</h1>
      <Tabs defaultValue="process">
        <TabsList>
          <TabsTrigger value="process">Proses Penerimaan</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="process">
          <Card>
            <CardHeader><CardTitle>Cari Surat Jalan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Ketik nomor SJ atau nama kebun..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {search && (
                <div className="border rounded-lg divide-y">
                  <button className="w-full text-left p-3 hover:bg-muted" onClick={() => { setSelectedSJ("29072026RH1"); setSearch("") }}>
                    <span className="font-mono font-medium">29072026RH1</span> — Kebun Rahayu — 15 tray
                  </button>
                </div>
              )}

              {selectedSJ && (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{selectedSJ}</Badge>
                    <span className="text-muted-foreground">Kebun Rahayu • 15 tray • Driver 1</span>
                  </div>
                  <div><Label>Total Kg Ditimbang</Label><Input type="number" step="0.1" value={totalKg || ""} onChange={e => setTotalKg(parseFloat(e.target.value) || 0)} placeholder="0.0" /></div>
                  <div className="space-y-2">
                    <Label>Hasil Sortir per Kategori</Label>
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: item.color}} />
                        <span className="w-20 font-medium">{item.name}</span>
                        <Input type="number" step="0.1" className="flex-1" value={item.kg || ""} onChange={e => {
                          const newItems = [...items]
                          newItems[idx].kg = parseFloat(e.target.value) || 0
                          setItems(newItems)
                        }} placeholder="0.0" />
                        <span className="text-sm text-muted-foreground w-16">{totalKg > 0 ? ((item.kg / totalKg) * 100).toFixed(1) + "%" : "-"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    {balanced ? (
                      <><CheckCircle2 className="h-5 w-5 text-green-600" /><span className="text-green-700">Balance ✓ (selisih {diff.toFixed(2)} kg)</span></>
                    ) : sortedTotal > 0 ? (
                      <><AlertTriangle className="h-5 w-5 text-yellow-600" /><span className="text-yellow-700">Belum balance — selisih {diff.toFixed(2)} kg (toleransi {tolerance} kg)</span></>
                    ) : (
                      <span className="text-muted-foreground">Masukkan total kg dan hasil sortir</span>
                    )}
                  </div>
                  <div><Label>Catatan</Label><Textarea placeholder="Opsional" /></div>
                  <Button className="w-full" disabled={!balanced}>Simpan Penerimaan</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card><CardContent className="py-8 text-center text-muted-foreground">Belum ada penerimaan</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
