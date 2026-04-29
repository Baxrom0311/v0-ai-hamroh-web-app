import { AppShell } from "@/components/layout/app-shell"
import { AdherenceView } from "@/components/adherence/adherence-view"

export default function AdherencePage() {
  return (
    <AppShell requireRole="patient">
      <AdherenceView />
    </AppShell>
  )
}
