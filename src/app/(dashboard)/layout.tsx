"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sprout,
  Tags,
  Users,
  UserCircle,
  Truck,
  PackageCheck,
  Boxes,
  ShoppingBasket,
  ShoppingCart,
  Undo2,
  Wallet,
  BarChart3,
  Shield,
  Settings,
  BookOpen,
  Menu,
  X,
  ClipboardList,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { label: "KEBUN & PASOKAN", isGroup: true },
  { href: "/farms", label: "Kebun", icon: Sprout },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/pickups", label: "Pickup / SJ", icon: Truck },
  { href: "/receiving", label: "Penerimaan", icon: PackageCheck },
  { label: "INVENTARIS & PRODUKSI", isGroup: true },
  { href: "/stock", label: "Stok", icon: Boxes },
  { href: "/products", label: "Produk", icon: ShoppingBasket },
  { label: "PENJUALAN & KEUANGAN", isGroup: true },
  { href: "/customers", label: "Pelanggan", icon: UserCircle },
  { href: "/orders", label: "Penjualan", icon: ShoppingCart },
  { href: "/returns", label: "Retur", icon: Undo2 },
  { href: "/finance", label: "Keuangan", icon: Wallet },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { label: "ADMINISTRASI", isGroup: true },
  { href: "/users", label: "Pengguna", icon: Users },
  { href: "/permissions", label: "Hak Akses", icon: Shield },
  { href: "/audit", label: "Log Aktivitas", icon: Activity },
  { href: "/settings", label: "Pengaturan", icon: Settings },
  { href: "/profile", label: "Profil", icon: ClipboardList },
  { href: "/guide", label: "Panduan", icon: BookOpen },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0 flex",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sprout className="h-5 w-5 text-green-600" />
            <span>Retail Strawberry</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item, i) =>
            item.isGroup ? (
              <div key={i} className="pt-4 pb-1 px-2">
                <p className="text-[11px] font-semibold text-muted-foreground tracking-wider">{item.label}</p>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href || pathname?.startsWith(item.href + "/")
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0" />}
                {item.label}
              </Link>
            )
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Admin</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
