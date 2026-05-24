import { AppShell } from "@/components/layout/app-shell"
import { DoseLoopDashboard } from "@/components/dashboard/dose-loop-dashboard"

export const metadata = { title: "Bosh sahifa — NoSkipAI" }

export default function PatientDashboardPage() {
  return (
    <AppShell requireRole="patient">
      <DoseLoopDashboard />
    </AppShell>
  )
}
