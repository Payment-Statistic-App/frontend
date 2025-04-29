import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getUserSelf } from "@/lib/api/users"
import { DashboardContent } from "@/components/dashboard-content"

async function refreshToken(): Promise<{ access_token: string; refresh_token: string } | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/refresh`, {
      method: 'POST',
      credentials: 'include', // Для отправки httpOnly cookies
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    return null
  }
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")

  if (!token) {
    redirect("/")
  }

  try {
    // Пытаемся получить данные пользователя
    const user = await getUserSelf(token.value)
    return (
      <main className="min-h-screen bg-gray-50">
        <DashboardContent user={user} />
      </main>
    )
  } catch (error) {
    const newTokens = await refreshToken()
    
    if (newTokens) {
      cookieStore.set("token", newTokens.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })
      
      try {
        const user = await getUserSelf(newTokens.access_token)
        return (
          <main className="min-h-screen bg-gray-50">
            <DashboardContent user={user} />
          </main>
        )
      } catch (innerError) {
        //redirect("/api/auth/signout")
      }
    } else {
      //redirect("/api/auth/signout")
    }
  }
}