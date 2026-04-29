import { AppShell } from "@/components/layout/app-shell"
import { FamilyDashboard } from "@/components/dashboard/family-dashboard"

export default function FamilyPage() {
  return (
    <AppShell requireRole="family">
      <FamilyDashboard />
    </AppShell>
  )
}
