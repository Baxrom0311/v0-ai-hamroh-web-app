"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { PatientNotification } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, CheckCheck, Stethoscope, AlertTriangle, Info, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

function notificationIcon(type: string) {
  if (type.includes("doctor") || type.includes("review")) return <Stethoscope className="size-4" />
  if (type.includes("escalat") || type.includes("urgent")) return <AlertTriangle className="size-4" />
  return <Info className="size-4" />
}

function notificationColor(type: string) {
  if (type.includes("urgent") || type.includes("critical") || type.includes("escalat")) return "text-red-600 bg-red-50"
  if (type.includes("doctor") || type.includes("review")) return "text-blue-600 bg-blue-50"
  return "text-gray-600 bg-gray-50"
}

function timeAgo(iso: string | null) {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "hozirgina"
  if (mins < 60) return `${mins} daqiqa oldin`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} soat oldin`
  const days = Math.floor(hours / 24)
  return `${days} kun oldin`
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<PatientNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.notifications().then((data) => {
      setNotifications(data.notifications)
      setUnreadCount(data.unread_count)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const markRead = async (id: number) => {
    await api.markNotificationRead(id)
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount((c) => Math.max(0, c - 1))
  }

  const markAllRead = async () => {
    await api.markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-5" />
          <h1 className="text-xl font-semibold">Bildirishnomalar</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="size-4 mr-1" /> Barchasini o&apos;qilgan deb belgilash
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Bell className="size-8 mx-auto mb-2 opacity-40" />
            <p>Hozircha bildirishnomalar yo&apos;q</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn("cursor-pointer transition-colors", !n.is_read && "border-blue-200 bg-blue-50/30")}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <CardContent className="flex items-start gap-3 py-3 px-4">
                <div className={cn("rounded-full p-2 mt-0.5", notificationColor(n.type))}>
                  {notificationIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm", !n.is_read && "font-medium")}>{n.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="size-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{timeAgo(n.sent_at)}</span>
                    {!n.is_read && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Yangi</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
