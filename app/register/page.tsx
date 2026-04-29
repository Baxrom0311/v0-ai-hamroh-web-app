import { RegisterForm } from "@/components/auth/register-form"
import { AuthShell } from "@/components/auth/auth-shell"

export const metadata = {
  title: "Ro'yxatdan o'tish — NoSkip-AI",
}

export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  )
}
