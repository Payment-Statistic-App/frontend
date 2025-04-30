import type { UserResponse, UserCreate, UserEdit, UserLogin, Token } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.energy-cerber.ru"

export async function getUserSelf(token: string): Promise<UserResponse | { unauthorized: true }> {
  try {
    const response = await fetch(`${API_URL}/users/self`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      // Если токен недействителен, очищаем его
      if (typeof document !== "undefined") {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      }
      // Возвращаем объект с флагом unauthorized
      return { unauthorized: true }
    }

    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching user data:", error)
    // В случае других ошибок также возвращаем объект с флагом unauthorized
    return { unauthorized: true }
  }
}

export async function getStudents(studentId?: string): Promise<UserResponse[]> {
  const url = new URL(`${API_URL}/users/students`)
  if (studentId) {
    url.searchParams.append("student_id", studentId)
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
      throw new Error("Failed to fetch students")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching students:", error)
    return []
  }
}

export async function getAllUsers(): Promise<UserResponse[]> {
  const url = new URL(`${API_URL}/users/all`)

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
      throw new Error("Failed to fetch users")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function createUser(userData: UserCreate): Promise<UserResponse> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/users/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (response.status === 401) {
      handleUnauthorized()
      return {} as UserResponse
    }

    if (!response.ok) {
      throw new Error("Failed to create user")
    }

    return response.json()
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function editUser(userId: string, userData: UserEdit): Promise<UserResponse> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/users/edit/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (response.status === 401) {
      handleUnauthorized()
      return {} as UserResponse
    }

    if (!response.ok) {
      throw new Error("Failed to edit user")
    }

    return response.json()
  } catch (error) {
    console.error("Error editing user:", error)
    throw error
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/users/delete/${userId}`, {
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
      throw new Error("Failed to delete user")
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export async function loginUser(loginData: UserLogin): Promise<Token> {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  })

  if (!response.ok) {
    throw new Error("Failed to login")
  }

  return response.json()
}

export async function refreshToken(): Promise<Token> {
  const token = getCookie("token")

  try {
    const response = await fetch(`${API_URL}/users/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      handleUnauthorized()
      return {} as Token
    }

    if (!response.ok) {
      throw new Error("Failed to refresh token")
    }

    return response.json()
  } catch (error) {
    console.error("Error refreshing token:", error)
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

// Функция для обработки ошибки авторизации
export function handleUnauthorized() {
  if (typeof document !== "undefined") {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Используем setTimeout для перенаправления, чтобы избежать ошибок при рендеринге
    setTimeout(() => {
      window.location.href = "/"
    }, 0)
  }
}
