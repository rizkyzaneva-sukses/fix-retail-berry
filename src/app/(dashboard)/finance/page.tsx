"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

interface ExpenseRow { date: string; categoryId: string; amount: number; description: string }

export default function FinancePage() {
  const [rows, setRows] = useState<ExpenseRow[]>([{ date: new Date().toISOString().slice(0,10), categoryId: "", amount: 0, description: "" }])
  const addRow = () => setRows([...rows, { date: new Date().toISOString().slice(0,10), categoryId: "", amount: 0, description: "" }])
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Keuangan</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-sm text-muted-foreground">Pendapatan</p><p className="text-xl font-bold">Rp 0</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><TrendingDown className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-sm text-muted-foreground">Pengeluaran</p><p className="text-xl font-bold">Rp 0</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-sm text-muted-foreground">HPP</p><p className="text-xl font-bold">Rp 0</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><DollarSign className="h-5 w-5 text-purple-600" /></div>
          <div><p className="text-sm text-muted-foreground">Laba Kotor</p><p className="text-xl font-bold">Rp 0</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList>
          <TabsTrigger value="expenses">Pengeluaran</TabsTrigger>
          <TabsTrigger value="input">Input Pengeluaran</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Tanggal</TableHead><TableHead>Kategori</TableHead><TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Jumlah</TableHead><TableHead>Tipe</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada pengeluaran</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="input">
          <Card>
            <CardHeader><CardTitle>Input Pengeluaran</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {rows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input type="date" className="w-40" value={row.date} onChange={e => {
                    const newR = [...rows]; newR[idx].date = e.target.value; setRows(newR)
                  }} />
                  <Select value={row.categoryId} onValueChange={v => {
                    const newR = [...rows]; newR[idx].categoryId = v; setRows(newR)
                  }}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Kategori" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Operasional</SelectItem>
                      <SelectItem value="2">Gaji</SelectItem>
                      <SelectItem value="3">Lain-lain</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Jumlah" className="w-32" value={row.amount || ""} onChange={e => {
                    const newR = [...rows]; newR[idx].amount = parseFloat(e.target.value) || 0; setRows(newR)
                  }} />
                  <Input placeholder="Deskripsi" className="flex-1" value={row.description} onChange={e => {
                    const newR = [...rows]; newR[idx].description = e.target.value; setRows(newR)
                  }} />
                  <Button variant="ghost" size="sm" onClick={() => removeRow(idx)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addRow}><Plus className="h-3 w-3 mr-1" />Tambah Baris</Button>
                <Button>Simpan Semua</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card><CardContent className="py-8 text-center text-muted-foreground">
            Kelola kategori pengeluaran di Master Data
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
