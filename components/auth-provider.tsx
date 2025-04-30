"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { UserResponse } from "@/lib/types"
import { getUserSelf } from "@/lib/api/users"

interface AuthContextType {
  user: UserResponse | null
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Обновляем функцию checkAuth для обработки ошибок авторизации
    const checkAuth = async () => {
      const token = getCookie("token")

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const userData = await getUserSelf(token)

        // Проверяем, вернулся ли специальный объект с флагом unauthorized
        if ("unauthorized" in userData) {
          // Если токен недействителен, перенаправляем на страницу входа
          router.push("/")
          return
        }

        setUser(userData)
      } catch (error) {
        // Если ошибка связана с авторизацией, очищаем токен
        console.error("Ошибка авторизации:", error)
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const logout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    setUser(null)
    router.push("/")
    router.refresh()
  }

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>
}

// Вспомогательная функция для получения значения cookie
function getCookie(name: string) {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
  return undefined
}
