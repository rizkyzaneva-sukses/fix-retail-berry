"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, UserCheck, UserX } from "lucide-react"

interface User { id: number; name: string; username: string; role: string; phone: string | null; isActive: boolean }

const roleColors: Record<string, string> = { owner: "bg-red-100 text-red-800", driver: "bg-blue-100 text-blue-800", sorter: "bg-green-100 text-green-800", sales: "bg-purple-100 text-purple-800" }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "driver", phone: "" })

  const handleSave = () => {
    if (!form.name || !form.username || !form.password) return
    setUsers([...users, { id: Date.now(), name: form.name, username: form.username, role: form.role, phone: form.phone, isActive: true }])
    setForm({ name: "", username: "", password: "", role: "driver", phone: "" })
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">User</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Tambah User</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah User</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nama</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
              <div><Label>Username</Label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} /></div>
              <div><Label>Password (min 8 char)</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
              <div><Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="sorter">Sorter</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="08xx" /></div>
              <Button onClick={handleSave} className="w-full">Simpan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Belum ada user</TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell><Badge className={roleColors[u.role] || ""}>{u.role}</Badge></TableCell>
                <TableCell>{u.phone || "-"}</TableCell>
                <TableCell>{u.isActive ? <UserCheck className="h-4 w-4 text-green-600" /> : <UserX className="h-4 w-4 text-red-600" />}</TableCell>
                <TableCell><Button variant="outline" size="sm"><Pencil className="h-3 w-3" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  )
}
