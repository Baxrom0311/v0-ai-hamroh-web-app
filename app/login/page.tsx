import { LoginForm } from "@/components/auth/login-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata = {
  title: "Kirish — NoSkipAI",
}

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  )
}
