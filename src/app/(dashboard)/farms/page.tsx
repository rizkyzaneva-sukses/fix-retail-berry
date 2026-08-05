"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, MapPin } from "lucide-react"

interface Farm {
  id: number; name: string; code: string; location: string | null; isActive: boolean
}

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", location: "" })

  const handleSave = () => {
    if (!form.name || !form.code) return
    setFarms([...farms, { id: Date.now(), name: form.name, code: form.code.toUpperCase(), location: form.location, isActive: true }])
    setForm({ name: "", code: "", location: "" })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kebun</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Tambah Kebun</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Kebun</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nama Kebun</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama kebun" /></div>
              <div><Label>Kode (max 10 char)</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="RH1" maxLength={10} /></div>
              <div><Label>Lokasi</Label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Lembang" /></div>
              <Button onClick={handleSave} className="w-full">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Kode</TableHead><TableHead>Lokasi</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {farms.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada data kebun</TableCell></TableRow>
              ) : farms.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell><Badge variant="outline">{f.code}</Badge></TableCell>
                  <TableCell>{f.location ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{f.location}</span> : "-"}</TableCell>
                  <TableCell><Badge variant={f.isActive ? "default" : "secondary"}>{f.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm"><Pencil className="h-3 w-3" /></Button>
                    <Button variant="destructive" size="sm"><Trash2 className="h-3 w-3" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
