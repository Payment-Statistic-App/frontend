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

  // Получаем данные пользователя
  const userData = await getUserSelf(token.value)

  // Проверяем, вернулся ли специальный объект с флагом unauthorized
  if ("unauthorized" in userData) {
    // Если токен недействителен, перенаправляем на страницу входа
    redirect("/")
  }

  // Если все в порядке, рендерим компонент
  return (
      <main className="min-h-screen bg-gray-50">
        <DashboardContent user={userData} />
      </main>
  )
}
