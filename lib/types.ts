export interface UserResponse {
  id: string
  name: string
  surname: string
  patronymic: string
  group_id: string | null
  group_name: string | null
  role: "student" | "observer" | "accountant" | "admin"
  phone: string
  login: string
  transactions: TransactionResponse[]
}

export interface UserCreate {
  name: string
  surname: string
  patronymic: string
  role: "student" | "observer" | "accountant" | "admin"
  phone: string
  login: string
  password: string
}

export interface UserEdit {
  name: string
  surname: string
  patronymic: string
  phone: string
}

export interface UserLogin {
  login: string
  password: string
  role: "student" | "observer" | "accountant" | "admin"
}

export interface Token {
  access_token: string
  refresh_token?: string
  token_type: string
}

export interface SemesterResponse {
  id: string
  name: string
}

export interface GroupResponse {
  id: string
  name: string
  users: UserResponse[]
}

export interface TransactionResponse {
  id: string
  user_id: string
  semester_id: string
  amount: number
  comment: string
  created_at: string
}

export interface TransactionCreate {
  semester_id: string
  amount: number
}

export interface SuccessfulResponse {
  success: string
}

// Обновленный интерфейс для операций
export interface OperationResponse {
  id: string
  type: "user" | "group" | "semester" | "payment"
  user_id: string
  comment: string
  created_at: string
  initiator: {
    id: string
    name: string
    surname: string
    patronymic: string
    role: "student" | "observer" | "accountant" | "admin"
  }
}
