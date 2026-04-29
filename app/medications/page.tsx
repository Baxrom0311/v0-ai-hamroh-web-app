import { AppShell } from "@/components/layout/app-shell"
import { MedicationsList } from "@/components/medications/medications-list"

export default function MedicationsPage() {
  return (
    <AppShell requireRole="patient">
      <MedicationsList />
    </AppShell>
  )
}
