"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Lock } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Profil</h1>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Info Akun</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Nama</span><span className="font-medium">Owner</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Username</span><span className="font-medium">owner</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge>owner</Badge></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Ganti Password</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Password Lama</Label><Input type="password" /></div>
          <div><Label>Password Baru (min 8 karakter)</Label><Input type="password" /></div>
          <div><Label>Konfirmasi Password Baru</Label><Input type="password" /></div>
          <Button>Simpan Password</Button>
        </CardContent>
      </Card>
    </div>
  )
}
