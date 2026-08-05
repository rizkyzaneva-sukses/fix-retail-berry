"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil } from "lucide-react"

interface Category { id: number; name: string; description: string | null; color: string; isActive: boolean; shrinkagePct: number; sortOrder: number }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", color: "#e11d48", shrinkagePct: 0, sortOrder: 0 })

  const handleSave = () => {
    if (!form.name) return
    setCategories([...categories, { id: Date.now(), ...form, isActive: true }])
    setForm({ name: "", description: "", color: "#e11d48", shrinkagePct: 0, sortOrder: 0 })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kategori</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Tambah Kategori</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Kategori</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="JUMBO" /></div>
              <div><Label>Deskripsi</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className="flex gap-4">
                <div className="flex-1"><Label>Warna</Label><Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
                <div className="flex-1"><Label>Susut %</Label><Input type="number" value={form.shrinkagePct} onChange={e => setForm({...form, shrinkagePct: parseFloat(e.target.value) || 0})} /></div>
                <div className="flex-1"><Label>Urutan</Label><Input type="number" value={form.sortOrder} onChange={e => setForm({...form, sortOrder: parseInt(e.target.value) || 0})} /></div>
              </div>
              <Button onClick={handleSave} className="w-full">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Warna</TableHead><TableHead>Nama</TableHead><TableHead>Deskripsi</TableHead><TableHead>Susut %</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada kategori</TableCell></TableRow>
            ) : categories.map(c => (
              <TableRow key={c.id}>
                <TableCell><div className="w-6 h-6 rounded-full" style={{backgroundColor: c.color}} /></TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{c.description || "-"}</TableCell>
                <TableCell>{c.shrinkagePct}%</TableCell>
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
