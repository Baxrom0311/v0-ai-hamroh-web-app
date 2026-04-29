import { AppShell } from "@/components/layout/app-shell"
import { PatientDashboard } from "@/components/dashboard/patient-dashboard"

export const metadata = { title: "Bosh sahifa — NoSkipAI" }

export default function PatientDashboardPage() {
  return (
    <AppShell requireRole="patient">
      <PatientDashboard />
    </AppShell>
  )
}
