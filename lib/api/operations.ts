import type { TransactionResponse, TransactionCreate, GroupResponse } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.energy-cerber.ru"

export async function createTransaction(transactionData: TransactionCreate): Promise<TransactionResponse> {
  const token = getCookie("token")

  const response = await fetch(`${API_URL}/operations/new_transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(transactionData),
  })

  if (!response.ok) {
    throw new Error("Failed to create transaction")
  }

  return response.json()
}

export async function addStudentToGroup(groupId: string, userId: string): Promise<GroupResponse> {
  const token = getCookie("token")

  const response = await fetch(`${API_URL}/operations/add_to_group?group_id=${groupId}&user_id=${userId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to add student to group")
  }

  return response.json()
}

export async function removeStudentFromGroup(userId: string): Promise<void> {
  const token = getCookie("token")

  const response = await fetch(`${API_URL}/operations/remove_from_group?user_id=${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to remove student from group")
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
