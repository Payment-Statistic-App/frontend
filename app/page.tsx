  import { redirect } from "next/navigation"
  import { cookies } from "next/headers"
  import { LoginForm } from "@/components/login-form"
  import {getUserSelf} from "@/lib/api/users";

  export default async function Home() {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")

    if (token) {
      const userData = await getUserSelf(token.value)
      if (!("unauthorized" in userData)) {
        redirect("/dashboard")
      }
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </main>
    )
  }
