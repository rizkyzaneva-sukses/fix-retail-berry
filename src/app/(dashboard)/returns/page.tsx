"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Retur</h1>
        <Button><Plus className="mr-2 h-4 w-4" />Buat Retur</Button>
      </div>
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Belum ada retur. Klik &quot;Buat Retur&quot; untuk memulai.
        </CardContent>
      </Card>
    </div>
  )
}
