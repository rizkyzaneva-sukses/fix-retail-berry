"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Phone, MapPin } from "lucide-react"

interface Customer { id: number; name: string; phone: string | null; address: string | null; defaultDiscountPct: number; isActive: boolean }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", phone: "", address: "", defaultDiscountPct: 0, notes: "" })

  const handleSave = () => {
    if (!form.name) return
    setCustomers([...customers, { id: Date.now(), name: form.name, phone: form.phone, address: form.address, defaultDiscountPct: form.defaultDiscountPct, isActive: true }])
    setForm({ name: "", phone: "", address: "", defaultDiscountPct: 0, notes: "" })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pelanggan</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Tambah Pelanggan</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Pelanggan</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="08xx" /></div>
              <div><Label>Alamat</Label><Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div><Label>Diskon Default %</Label><Input type="number" value={form.defaultDiscountPct} onChange={e => setForm({...form, defaultDiscountPct: parseFloat(e.target.value) || 0})} /></div>
              <Button onClick={handleSave} className="w-full">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Phone</TableHead><TableHead>Alamat</TableHead><TableHead>Diskon</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada pelanggan</TableCell></TableRow>
            ) : customers.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span> : "-"}</TableCell>
                <TableCell>{c.address ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.address}</span> : "-"}</TableCell>
                <TableCell>{c.defaultDiscountPct}%</TableCell>
                <TableCell><Badge variant={c.isActive ? "default" : "secondary"}>{c.isActive ? "Aktif" : "Nonaktif"}</Badge></TableCell>
                <TableCell><Button variant="outline" size="sm"><Pencil className="h-3 w-3" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
