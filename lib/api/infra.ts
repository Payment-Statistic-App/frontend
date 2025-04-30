import type { SemesterResponse, GroupResponse } from "@/lib/types"
import { handleUnauthorized } from "./users"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.energy-cerber.ru"

export async function getSemesters(): Promise<SemesterResponse[]> {
  try {
    const response = await fetch(`${API_URL}/infra/semesters`)

    if (!response.ok) {
      throw new Error("Failed to fetch semesters")
    }

    const semesters = await response.json()

    // Сортировка семестров от старых к новым (предполагаем, что id содержит временную метку)
    return semesters.sort((a: SemesterResponse, b: SemesterResponse) => a.id.localeCompare(b.id))
  } catch (error) {
    console.error("Error fetching semesters:", error)
    return []
  }
}

export async function getGroups(groupId?: string): Promise<GroupResponse[]> {
  const url = new URL(`${API_URL}/infra/groups`)
  if (groupId) {
    url.searchParams.append("group_id", groupId)
  }

  const token = getCookie("token")

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      handleUnauthorized()
      return []
    }

    if (!response.ok) {
      throw new Error("Failed to fetch groups")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching groups:", error)
    return []
  }
}

export async function createGroup(groupName: string): Promise<GroupResponse> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/infra/new_group?group_name=${encodeURIComponent(groupName)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      handleUnauthorized()
      return {} as GroupResponse
    }

    if (!response.ok) {
      throw new Error("Failed to create group")
    }

    return response.json()
  } catch (error) {
    console.error("Error creating group:", error)
    throw error
  }
}

export async function createSemester(semesterName: string): Promise<SemesterResponse> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/infra/new_semester?semester_name=${encodeURIComponent(semesterName)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      handleUnauthorized()
      return {} as SemesterResponse
    }

    if (!response.ok) {
      throw new Error("Failed to create semester")
    }

    return response.json()
  } catch (error) {
    console.error("Error creating semester:", error)
    throw error
  }
}

export async function editGroup(groupId: string, newGroupName: string): Promise<GroupResponse> {
  const token = getCookie("token")

  try {
    const response = await fetch(
        `${API_URL}/infra/edit_group/${groupId}?new_group_name=${encodeURIComponent(newGroupName)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
    )

    if (response.status === 401) {
      handleUnauthorized()
      return {} as GroupResponse
    }

    if (!response.ok) {
      throw new Error("Failed to edit group")
    }

    return response.json()
  } catch (error) {
    console.error("Error editing group:", error)
    throw error
  }
}

export async function editSemester(semesterId: string, newSemesterName: string): Promise<SemesterResponse> {
  const token = getCookie("token")

  try {
    const response = await fetch(
        `${API_URL}/infra/edit_semester/${semesterId}?new_semester_name=${encodeURIComponent(newSemesterName)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
    )

    if (response.status === 401) {
      handleUnauthorized()
      return {} as SemesterResponse
    }

    if (!response.ok) {
      throw new Error("Failed to edit semester")
    }

    return response.json()
  } catch (error) {
    console.error("Error editing semester:", error)
    throw error
  }
}

export async function deleteGroup(groupId: string): Promise<void> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/infra/delete_group/${groupId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error("Failed to delete group")
    }
  } catch (error) {
    console.error("Error deleting group:", error)
    throw error
  }
}

export async function deleteSemester(semesterId: string): Promise<void> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/infra/delete_semester/${semesterId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      handleUnauthorized()
      return
    }

    if (!response.ok) {
      throw new Error("Failed to delete semester")
    }
  } catch (error) {
    console.error("Error deleting semester:", error)
    throw error
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
