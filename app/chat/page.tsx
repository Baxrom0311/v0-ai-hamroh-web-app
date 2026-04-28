import { AppShell } from "@/components/layout/app-shell"
import { ChatView } from "@/components/chat/chat-view"

export const metadata = { title: "AI suhbat — AI Hamroh" }

export default function ChatPage() {
  return (
    <AppShell requireRole="patient">
      <ChatView />
    </AppShell>
  )
}
