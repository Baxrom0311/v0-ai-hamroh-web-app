import { AppShell } from "@/components/layout/app-shell"
import { ChatView } from "@/components/chat/chat-view"

export const metadata = { title: "AI suhbat — NoSkip-AI" }

export default function ChatPage() {
  return (
    <AppShell requireRole="patient" flush>
      <ChatView />
    </AppShell>
  )
}
