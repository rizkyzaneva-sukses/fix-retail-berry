"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <Card>
        <CardHeader><CardTitle>Umum</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Nama Perusahaan</Label><Input defaultValue="Strawberry Fresh Supply" /></div>
          <div><Label>Toleransi Balance Penerimaan (kg)</Label><Input type="number" step="0.01" defaultValue="0.15" /></div>
          <div><Label>Toleransi Susut Default (%)</Label><Input type="number" step="0.1" defaultValue="0" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>WhatsApp (WAHA)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3"><Label>Aktifkan WAHA</Label><Switch /></div>
          <div><Label>WAHA URL</Label><Input defaultValue="http://localhost:3000" /></div>
          <div><Label>Session</Label><Input defaultValue="default" /></div>
          <div><Label>API Key</Label><Input type="password" placeholder="Opsional" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Database</CardTitle></CardHeader>
        <CardContent>
          <Button variant="outline">Backup Database</Button>
        </CardContent>
      </Card>
      <Button><Save className="mr-2 h-4 w-4" />Simpan Semua</Button>
    </div>
  )
}
