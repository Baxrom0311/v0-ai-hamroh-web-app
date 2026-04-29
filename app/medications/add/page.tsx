import { AppShell } from "@/components/layout/app-shell"
import { AddMedicationForm } from "@/components/medications/add-medication-form"

export default function AddMedicationPage() {
  return (
    <AppShell requireRole="patient">
      <AddMedicationForm />
    </AppShell>
  )
}
