'use client'

import { useEffect, useState } from 'react'
import {
  Boxes,
  TrendingUp,
  Truck,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'

interface UserInfo {
  id: number
  role: string
  name: string
  username: string
}

interface SummaryCard {
  title: string
  value: string
  change: string
  changeType: 'up' | 'down' | 'neutral'
  icon: React.ElementType
  color: string
}

const summaryCards: SummaryCard[] = [
  {
    title: 'Total Stok',
    value: '—',
    change: '—',
    changeType: 'neutral',
    icon: Boxes,
    color: 'bg-blue-500',
  },
  {
    title: 'Omzet Hari Ini',
    value: '—',
    change: '—',
    changeType: 'neutral',
    icon: TrendingUp,
    color: 'bg-green-500',
  },
  {
    title: 'Pickup Pending',
    value: '—',
    change: '—',
    changeType: 'neutral',
    icon: Truck,
    color: 'bg-amber-500',
  },
  {
    title: 'Revenue Bulan Ini',
    value: '—',
    change: '—',
    changeType: 'neutral',
    icon: Wallet,
    color: 'bg-[#e11d48]',
  },
]

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Selamat datang, {user?.name || '...'} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Berikut ringkasan aktivitas toko hari ini.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <div className={`${card.color} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <div className="mt-1 flex items-center gap-1 text-sm">
                {card.changeType === 'up' && (
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                )}
                {card.changeType === 'down' && (
                  <ArrowDownRight className="w-4 h-4 text-red-500" />
                )}
                <span
                  className={
                    card.changeType === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : card.changeType === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-400'
                  }
                >
                  {card.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Penjualan Mingguan
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Grafik akan tersedia segera</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Stok per Kategori
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-center">
              <Boxes className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Grafik akan tersedia segera</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aktivitas Terakhir
          </h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 animate-pulse" />
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse" />
            </div>
          ))}
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 pt-2">
            Belum ada aktivitas
          </p>
        </div>
      </div>
    </div>
  )
}
