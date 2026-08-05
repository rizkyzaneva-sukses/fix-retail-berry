"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, BarChart3, TrendingUp, Package, Users } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Laporan</h1>
        <div className="flex gap-2">
          <Input type="date" className="w-40" />
          <Input type="date" className="w-40" />
          <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Omzet", value: "Rp 0", icon: TrendingUp },
          { label: "HPP", value: "Rp 0", icon: Package },
          { label: "Pengeluaran", value: "Rp 0", icon: BarChart3 },
          { label: "Laba Bersih", value: "Rp 0", icon: TrendingUp },
        ].map((kpi, i) => (
          <Card key={i}><CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
            <p className="text-xl font-bold">{kpi.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Stok Saat Ini</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[{name:"JUMBO",kg:0,color:"#e11d48"},{name:"B",kg:0,color:"#f59e0b"},{name:"AB MIX",kg:0,color:"#22c55e"}].map(c => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor:c.color}} />
                  <span className="flex-1">{c.name}</span>
                  <span className="font-mono">{c.kg} kg</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Produk Terlaris</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground text-sm">Belum ada data</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Performa Driver</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground text-sm">Belum ada data</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Perbandingan Kebun</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground text-sm">Belum ada data</p></CardContent>
        </Card>
      </div>
    </div>
  )
}
