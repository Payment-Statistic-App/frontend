import type { OperationResponse } from "@/lib/types"
import { handleUnauthorized } from "./users"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.energy-cerber.ru"

export async function getOperations(): Promise<OperationResponse[]> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/operations/show_list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      handleUnauthorized()
      return []
    }

    if (!response.ok) {
      throw new Error("Failed to fetch operations")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching operations:", error)
    return []
  }
}

// Вспомогательная функция для получения значения cookie
function getCookie(name: string) {
  if (typeof document === "undefined") return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
  return null
}

// Словарь для перевода типов операций
export const operationTypeNames = {
  user: "Пользователь",
  group: "Группа",
  semester: "Семестр",
  payment: "Оплата",
}

// Функция для получения иконки и названия типа операции
export function getOperationTypeInfo(type: string) {
  switch (type) {
    case "payment":
      return { icon: "FileText", color: "text-green-600", name: operationTypeNames.payment }
    case "user":
      return { icon: "User", color: "text-blue-600", name: operationTypeNames.user }
    case "group":
      return { icon: "Users", color: "text-indigo-600", name: operationTypeNames.group }
    case "semester":
      return { icon: "Calendar", color: "text-purple-600", name: operationTypeNames.semester }
    default:
      return { icon: "FileText", color: "text-gray-600", name: "Другое" }
  }
}
