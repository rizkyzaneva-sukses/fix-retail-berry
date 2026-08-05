"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Log Aktivitas</h1>
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <Input placeholder="Cari..." className="flex-1" />
            <Select><SelectTrigger className="w-40"><SelectValue placeholder="Aksi" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua</SelectItem></SelectContent>
            </Select>
            <Input type="date" className="w-40" />
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Waktu</TableHead><TableHead>User</TableHead><TableHead>Aksi</TableHead>
              <TableHead>Ringkasan</TableHead><TableHead>Detail</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada log</TableCell></TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
