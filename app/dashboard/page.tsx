import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getUserSelf } from "@/lib/api/users"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")

  if (!token) {
    redirect("/")
  }

  try {
    const user = await getUserSelf(token.value)
    return (
      <main className="min-h-screen bg-gray-50">
        <DashboardContent user={user} />
      </main>
    )
  } catch (error) {
    // Instead of modifying cookies here, redirect to a route handler
    redirect("/api/auth/signout")
  }
}