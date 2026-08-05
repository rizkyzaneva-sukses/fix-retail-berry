"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, CheckCircle2, XCircle, Trash2 } from "lucide-react"

interface Product {
  id: number; name: string; productType: string; basePrice: number; isActive: boolean
  approvalStatus: string; recipes: {category: string; ratio: number}[]
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", productType: "pure", basePrice: 0 })
  const [recipes, setRecipes] = useState<{categoryId: number; category: string; ratio: number}[]>([
    { categoryId: 1, category: "JUMBO", ratio: 1.0 }
  ])

  const totalRatio = recipes.reduce((s, r) => s + r.ratio, 0)
  const ratioOk = Math.abs(totalRatio - 1.0) < 0.001

  const addRecipe = () => setRecipes([...recipes, { categoryId: 2, category: "B", ratio: 0 }])
  const removeRecipe = (idx: number) => setRecipes(recipes.filter((_, i) => i !== idx))

  const handleSave = () => {
    if (!form.name || !ratioOk) return
    setProducts([...products, { id: Date.now(), ...form, isActive: true, approvalStatus: "approved", recipes }])
    setForm({ name: "", productType: "pure", basePrice: 0 })
    setRecipes([{ categoryId: 1, category: "JUMBO", ratio: 1.0 }])
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produk</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Tambah Produk</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Tambah Produk</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nama Produk</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div className="flex gap-4">
                <div className="flex-1"><Label>Tipe</Label>
                  <Select value={form.productType} onValueChange={v => setForm({...form, productType: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pure">Pure</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="flex-1"><Label>Harga/kg</Label><Input type="number" value={form.basePrice || ""} onChange={e => setForm({...form, basePrice: parseFloat(e.target.value) || 0})} /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Resep (total harus 100%)</Label>
                  <Badge variant={ratioOk ? "default" : "destructive"}>{(totalRatio * 100).toFixed(0)}% {ratioOk ? "✓" : "✗"}</Badge>
                </div>
                {recipes.map((r, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <Select value={String(r.categoryId)} onValueChange={v => {
                      const cats: Record<string, string> = {"1":"JUMBO","2":"B","3":"AB MIX"}
                      const newR = [...recipes]; newR[idx].categoryId = parseInt(v); newR[idx].category = cats[v] || ""
                      setRecipes(newR)
                    }}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="1">JUMBO</SelectItem><SelectItem value="2">B</SelectItem><SelectItem value="3">AB MIX</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" step="0.01" min="0" max="1" className="flex-1" value={r.ratio} onChange={e => {
                      const newR = [...recipes]; newR[idx].ratio = parseFloat(e.target.value) || 0; setRecipes(newR)
                    }} />
                    <span className="text-sm text-muted-foreground w-12">{(r.ratio * 100).toFixed(0)}%</span>
                    {recipes.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeRecipe(idx)}><Trash2 className="h-3 w-3" /></Button>}
                  </div>
                ))}
                {form.productType === "mixed" && <Button variant="outline" size="sm" onClick={addRecipe}><Plus className="h-3 w-3 mr-1" />Tambah Kategori</Button>}
              </div>
              <Button onClick={handleSave} className="w-full" disabled={!ratioOk}>Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Tipe</TableHead><TableHead>Harga/kg</TableHead><TableHead>Resep</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada produk</TableCell></TableRow>
            ) : products.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><Badge variant="outline">{p.productType}</Badge></TableCell>
                <TableCell>Rp {p.basePrice.toLocaleString()}</TableCell>
                <TableCell>{p.recipes.map(r => `${r.category} ${(r.ratio*100).toFixed(0)}%`).join(", ")}</TableCell>
                <TableCell><Badge variant={p.approvalStatus === "approved" ? "default" : "secondary"}>{p.approvalStatus}</Badge></TableCell>
                <TableCell><Button variant="outline" size="sm"><Pencil className="h-3 w-3" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
