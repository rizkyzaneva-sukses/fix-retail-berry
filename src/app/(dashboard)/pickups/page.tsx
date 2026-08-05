"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Plus, QrCode, Printer, Eye, X, Edit } from "lucide-react"
import { format } from "date-fns"

interface Pickup {
  id: number; sjNumber: string; farmName: string; driverName: string; pickupDate: string
  trayCount: number; status: "pending" | "received" | "cancelled"; notes: string | null
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function PickupsPage() {
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [tab, setTab] = useState("form")
  const [form, setForm] = useState({
    pickupDate: format(new Date(), "yyyy-MM-dd"),
    farmId: "", driverId: "", trayCount: 0, notes: ""
  })

  const generateSJ = (farmCode: string, date: string) => {
    const d = new Date(date)
    const dd = String(d.getDate()).padStart(2, "0")
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const yyyy = d.getFullYear()
    return `${dd}${mm}${yyyy}${farmCode}`
  }

  const handleSubmit = () => {
    if (!form.farmId || form.trayCount <= 0) return
    const sj = generateSJ("RH1", form.pickupDate)
    setPickups([...pickups, {
      id: Date.now(), sjNumber: sj, farmName: "Kebun Rahayu", driverName: "Driver 1",
      pickupDate: form.pickupDate, trayCount: form.trayCount, status: "pending", notes: form.notes
    }])
    setForm({ pickupDate: format(new Date(), "yyyy-MM-dd"), farmId: "", driverId: "", trayCount: 0, notes: "" })
    setTab("history")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengambilan (Pickup)</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="form">Form Pickup</TabsTrigger>
          <TabsTrigger value="history">Riwayat</TabsTrigger>
          <TabsTrigger value="corrections">Permintaan Koreksi</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader><CardTitle>Buat Pickup Baru</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Tanggal</Label><Input type="date" value={form.pickupDate} onChange={e => setForm({...form, pickupDate: e.target.value})} /></div>
                <div><Label>Kebun</Label>
                  <Select value={form.farmId} onValueChange={v => setForm({...form, farmId: v})}>
                    <SelectTrigger><SelectValue placeholder="Pilih kebun" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Kebun Rahayu (RH1)</SelectItem>
                      <SelectItem value="2">Kebun Makmur (MK1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Tray</Label><Input type="number" min={1} value={form.trayCount || ""} onChange={e => setForm({...form, trayCount: parseInt(e.target.value) || 0})} /></div>
                <div><Label>Catatan</Label><Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Opsional" /></div>
              </div>
              <Button onClick={handleSubmit} className="w-full"><Plus className="mr-2 h-4 w-4" />Buat Pickup</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>No. SJ</TableHead><TableHead>Kebun</TableHead><TableHead>Driver</TableHead>
                <TableHead>Tanggal</TableHead><TableHead>Tray</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {pickups.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada pickup</TableCell></TableRow>
                ) : pickups.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-medium">{p.sjNumber}</TableCell>
                    <TableCell>{p.farmName}</TableCell>
                    <TableCell>{p.driverName}</TableCell>
                    <TableCell>{p.pickupDate}</TableCell>
                    <TableCell>{p.trayCount}</TableCell>
                    <TableCell><Badge className={statusColors[p.status]}>{p.status}</Badge></TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="outline" size="sm"><QrCode className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm"><Printer className="h-3 w-3" /></Button>
                      {p.status === "pending" && <Button variant="destructive" size="sm"><X className="h-3 w-3" /></Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="corrections">
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            Belum ada permintaan koreksi
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
