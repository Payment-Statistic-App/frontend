import type { SemesterResponse, GroupResponse } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.energy-cerber.ru"

export async function getSemesters(): Promise<SemesterResponse[]> {
  const response = await fetch(`${API_URL}/infra/semesters`)

  if (!response.ok) {
    throw new Error("Failed to fetch semesters")
  }

  return response.json()
}

export async function getGroups(groupId?: string): Promise<GroupResponse[]> {
  const url = new URL(`${API_URL}/infra/groups`)
  if (groupId) {
    url.searchParams.append("group_id", groupId)
  }

  const token = getCookie("token")

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch groups")
  }

  return response.json()
}

export async function createGroup(groupName: string): Promise<GroupResponse> {
  const token = getCookie("token")

  const response = await fetch(`${API_URL}/infra/new_group?group_name=${encodeURIComponent(groupName)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to create group")
  }

  return response.json()
}

export async function createSemester(semesterName: string): Promise<SemesterResponse> {
  const token = getCookie("token")

  const response = await fetch(`${API_URL}/infra/new_semester?semester_name=${encodeURIComponent(semesterName)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to create semester")
  }

  return response.json()
}

export async function editGroup(groupId: string, newGroupName: string): Promise<GroupResponse> {
  const token = getCookie("token")

  const response = await fetch(
    `${API_URL}/infra/edit_group/${groupId}?new_group_name=${encodeURIComponent(newGroupName)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to edit group")
  }

  return response.json()
}

export async function editSemester(semesterId: string, newSemesterName: string): Promise<SemesterResponse> {
  const token = getCookie("token")

  const response = await fetch(
    `${API_URL}/infra/edit_semester/${semesterId}?new_semester_name=${encodeURIComponent(newSemesterName)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to edit semester")
  }

  return response.json()
}

export async function deleteGroup(groupId: string): Promise<void> {
  const token = getCookie("token")

  const response = await fetch(`${API_URL}/infra/delete_group/${groupId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to delete group")
  }
}

export async function deleteSemester(semesterId: string): Promise<void> {
  const token = getCookie("token")

  const response = await fetch(`${API_URL}/infra/delete_semester/${semesterId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to delete semester")
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
