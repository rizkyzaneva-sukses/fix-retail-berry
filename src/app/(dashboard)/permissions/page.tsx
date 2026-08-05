"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"

const modules = ["dashboard","pengambilan","penerimaan","stok","produk","penjualan","retur","keuangan","master_data","laporan","log","panduan","profil"]
const roles = ["owner","driver","sorter","sales"] as const
const perms = ["canView","canCreate","canEdit","canDelete","canApprove"] as const
const permLabels: Record<string, string> = { canView: "Lihat", canCreate: "Buat", canEdit: "Edit", canDelete: "Hapus", canApprove: "Approve" }

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<Record<string, Record<string, Record<string, boolean>>>>(() => {
    const m: any = {}
    for (const role of roles) {
      m[role] = {}
      for (const mod of modules) {
        m[role][mod] = { canView: role === "owner" || ["dashboard","panduan","profil"].includes(mod), canCreate: role === "owner", canEdit: role === "owner", canDelete: role === "owner", canApprove: role === "owner" }
      }
    }
    return m
  })

  const toggle = (role: string, mod: string, perm: string) => {
    setMatrix(prev => ({...prev, [role]: {...prev[role], [mod]: {...prev[role][mod], [perm]: !prev[role][mod][perm]}}}))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hak Akses</h1>
        <Button><Save className="mr-2 h-4 w-4" />Simpan</Button>
      </div>
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Modul</th>
                {roles.map(r => <th key={r} className="text-center p-2" colSpan={5}><Badge>{r}</Badge></th>)}
              </tr>
              <tr className="border-b">
                <th></th>
                {roles.map(r => perms.map(p => <th key={r+p} className="text-center p-1 text-xs text-muted-foreground">{permLabels[p]}</th>))}
              </tr>
            </thead>
            <tbody>
              {modules.map(mod => (
                <tr key={mod} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">{mod}</td>
                  {roles.map(r => perms.map(p => (
                    <td key={r+mod+p} className="text-center p-1">
                      <Checkbox checked={matrix[r]?.[mod]?.[p] || false} onCheckedChange={() => toggle(r, mod, p)} />
                    </td>
                  )))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
