import { AppShell } from "@/components/layout/app-shell"
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard"

export default function DoctorPage() {
  return (
    <AppShell>
      <DoctorDashboard />
    </AppShell>
  )
}
