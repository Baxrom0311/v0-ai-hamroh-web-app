import { AppShell } from "@/components/layout/app-shell"
import { NotificationsView } from "@/components/notifications/notifications-view"

export const metadata = { title: "Bildirishnomalar — NoSkipAI" }

export default function NotificationsPage() {
  return (
    <AppShell requireRole="patient">
      <NotificationsView />
    </AppShell>
  )
}
