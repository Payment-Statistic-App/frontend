"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import type { UserResponse, SemesterResponse, GroupResponse, OperationResponse } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllUsers } from "@/lib/api/users"
import {
  getGroups,
  createGroup,
  editGroup,
  deleteGroup,
  createSemester,
  editSemester,
  deleteSemester,
} from "@/lib/api/infra"
import { addStudentToGroup, removeStudentFromGroup } from "@/lib/api/operations"
import { createUser, editUser, deleteUser } from "@/lib/api/users"
import { getOperations, operationTypeNames, getOperationTypeInfo } from "@/lib/api/activity"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Plus,
  Trash,
  Edit,
  UserPlus,
  X,
  Filter,
  User,
  FileText,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowDown,
  ArrowUp,
} from "lucide-react"
import { formatDateTime, formatPhoneNumber, isValidPhoneNumber } from "@/lib/utils"

interface AdminDashboardProps {
  user: UserResponse
  semesters: SemesterResponse[]
}

export function AdminDashboard({ user, semesters }: AdminDashboardProps) {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [groups, setGroups] = useState<GroupResponse[]>([])
  const [operations, setOperations] = useState<OperationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [operationFilter, setOperationFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [phoneError, setPhoneError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isInitiatorInfoOpen, setIsInitiatorInfoOpen] = useState(false)
  const [selectedInitiator, setSelectedInitiator] = useState<OperationResponse["initiator"] | null>(null)
  const { toast } = useToast()

  // Количество записей на странице
  const ITEMS_PER_PAGE = 10

  // Диалоги
  const [isNewUserOpen, setIsNewUserOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [isNewSemesterOpen, setIsNewSemesterOpen] = useState(false)
  const [isEditSemesterOpen, setIsEditSemesterOpen] = useState(false)
  const [isAddToGroupOpen, setIsAddToGroupOpen] = useState(false)

  // Выбранные элементы для редактирования
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<GroupResponse | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<SemesterResponse | null>(null)
  const [selectedUserForGroup, setSelectedUserForGroup] = useState<UserResponse | null>(null)

  interface newUserForm{
    name: string,
    surname: string,
    patronymic: string,
    phone: string,
    login: string,
    password: string,
    role: "student" | "observer" | "accountant" | "admin";
  }
  // Формы
  const [newUserForm, setNewUserForm] = useState<newUserForm>({
    name: "",
    surname: "",
    patronymic: "",
    phone: "",
    login: "",
    password: "",
    role: "student",
  })

  const [editUserForm, setEditUserForm] = useState({
    name: "",
    surname: "",
    patronymic: "",
    phone: "",
  })

  const [newGroupForm, setNewGroupForm] = useState({
    name: "",
  })

  const [editGroupForm, setEditGroupForm] = useState({
    name: "",
  })

  const [newSemesterForm, setNewSemesterForm] = useState({
    name: "",
  })

  const [editSemesterForm, setEditSemesterForm] = useState({
    name: "",
  })

  const [addToGroupForm, setAddToGroupForm] = useState({
    groupId: "",
  })

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, groupsData, operationsData] = await Promise.all([getAllUsers(), getGroups(), getOperations()])

        setUsers(usersData)
        setGroups(groupsData)
        setOperations(operationsData)
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Обработчик изменения номера телефона с форматированием
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, formSetter: Function, form: any) => {
    const formattedPhone = formatPhoneNumber(e.target.value)
    formSetter({ ...form, phone: formattedPhone })

    // Валидация номера телефона
    if (formattedPhone && !isValidPhoneNumber(formattedPhone)) {
      setPhoneError("Введите корректный номер телефона")
    } else {
      setPhoneError("")
    }
  }

  // Обработчик изменения пароля с валидацией
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value
    setNewUserForm({ ...newUserForm, password })

    if (password && password.length < 8) {
      setPasswordError("Пароль должен содержать минимум 8 символов")
    } else {
      setPasswordError("")
    }
  }

  // Фильтрация пользователей по поисковому запросу и роли
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.surname} ${user.name} ${user.patronymic}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Фильтрация и сортировка операций
  const filteredOperations = useMemo(() => {
    // Фильтрация
    const filtered = operations.filter((operation) => {
      const initiatorName =
        `${operation.initiator.surname} ${operation.initiator.name} ${operation.initiator.patronymic}`.toLowerCase()
      const matchesSearch =
        operation.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        initiatorName.includes(searchTerm.toLowerCase())
      const matchesType = operationFilter === "all" || operation.type === operationFilter

      // Фильтрация по дате
      let matchesDate = true
      if (dateFilter !== "all") {
        const today = new Date()
        const operationDate = new Date(operation.created_at)

        if (dateFilter === "today") {
          matchesDate =
            operationDate.getDate() === today.getDate() &&
            operationDate.getMonth() === today.getMonth() &&
            operationDate.getFullYear() === today.getFullYear()
        } else if (dateFilter === "week") {
          const weekAgo = new Date()
          weekAgo.setDate(today.getDate() - 7)
          matchesDate = operationDate >= weekAgo
        } else if (dateFilter === "month") {
          const monthAgo = new Date()
          monthAgo.setMonth(today.getMonth() - 1)
          matchesDate = operationDate >= monthAgo
        }
      }

      return matchesSearch && matchesType && matchesDate
    })

    // Сортировка
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortDirection === "desc" ? dateB - dateA : dateA - dateB
    })

    return filtered
  }, [operations, searchTerm, operationFilter, dateFilter, sortDirection])

  // Пагинация
  const totalPages = Math.ceil(filteredOperations.length / ITEMS_PER_PAGE)
  const paginatedOperations = filteredOperations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Обработчики форм
  const handleCreateUser = async () => {
    // Валидация номера телефона
    if (!isValidPhoneNumber(newUserForm.phone)) {
      toast({
        title: "Ошибка валидации",
        description: "Введите корректный номер телефона",
        variant: "destructive",
      })
      return
    }

    // Валидация пароля
    if (newUserForm.password.length < 8) {
      toast({
        title: "Ошибка валидации",
        description: "Пароль должен содержать минимум 8 символов",
        variant: "destructive",
      })
      return
    }

    try {
      const newUser = await createUser(newUserForm)
      setUsers([...users, newUser])
      setIsNewUserOpen(false)
      setNewUserForm({
        name: "",
        surname: "",
        patronymic: "",
        phone: "",
        login: "",
        password: "",
        role: "student",
      })
      setPasswordError("")

      toast({
        title: "Успешно",
        description: "Пользователь успешно создан",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при создании пользователя:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать пользователя",
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async () => {
    if (!selectedUser) return

    // Валидация номера телефона
    if (!isValidPhoneNumber(editUserForm.phone)) {
      toast({
        title: "Ошибка валидации",
        description: "Введите корректный номер телефона",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedUser = await editUser(selectedUser.id, editUserForm)
      setUsers(users.map((s) => (s.id === updatedUser.id ? updatedUser : s)))
      setIsEditUserOpen(false)

      toast({
        title: "Успешно",
        description: "Пользователь успешно обновлен",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при обновлении пользователя:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить пользователя",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) return

    try {
      await deleteUser(userId)
      setUsers(users.filter((s) => s.id !== userId))

      toast({
        title: "Успешно",
        description: "Пользователь успешно удален",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при удалении пользователя:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive",
      })
    }
  }

  const handleCreateGroup = async () => {
    try {
      const newGroup = await createGroup(newGroupForm.name)
      setGroups([...groups, newGroup])
      setIsNewGroupOpen(false)
      setNewGroupForm({ name: "" })

      toast({
        title: "Успешно",
        description: "Группа успешно создана",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при создании группы:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать группу",
        variant: "destructive",
      })
    }
  }

  const handleEditGroup = async () => {
    if (!selectedGroup) return

    try {
      const updatedGroup = await editGroup(selectedGroup.id, editGroupForm.name)
      setGroups(groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)))
      setIsEditGroupOpen(false)

      toast({
        title: "Успешно",
        description: "Группа успешно обновлена",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при обновлении группы:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить группу",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту группу?")) return

    try {
      await deleteGroup(groupId)
      setGroups(groups.filter((g) => g.id !== groupId))

      toast({
        title: "Успешно",
        description: "Группа успешно удалена",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при удалении группы:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить группу",
        variant: "destructive",
      })
    }
  }

  const handleCreateSemester = async () => {
    try {
      const newSemester = await createSemester(newSemesterForm.name)
      // Обновляем локальный список семестров
      const updatedSemesters = [...semesters, newSemester]
      // Здесь нужно обновить состояние семестров в родительском компоненте
      setIsNewSemesterOpen(false)
      setNewSemesterForm({ name: "" })

      toast({
        title: "Успешно",
        description: "Семестр успешно создан",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)

      // Перезагружаем страницу для обновления данных
      window.location.reload()
    } catch (error) {
      console.error("Ошибка при создании семестра:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать семестр",
        variant: "destructive",
      })
    }
  }

  const handleEditSemester = async () => {
    if (!selectedSemester) return

    try {
      const updatedSemester = await editSemester(selectedSemester.id, editSemesterForm.name)
      // Обновляем локальный список семестров
      const updatedSemesters = semesters.map((s) => (s.id === updatedSemester.id ? updatedSemester : s))
      // Здесь нужно обновить состояние семестров в родительском компоненте
      setIsEditSemesterOpen(false)

      toast({
        title: "Успешно",
        description: "Семестр успешно обновлен",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)

      // Перезагружаем страницу для обновления данных
      window.location.reload()
    } catch (error) {
      console.error("Ошибка при обновлении семестра:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить семестр",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSemester = async (semesterId: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот семестр?")) return

    try {
      await deleteSemester(semesterId)
      // Обновляем локальный список семестров
      const updatedSemesters = semesters.filter((s) => s.id !== semesterId)
      // Здесь нужно обновить состояние семестров в родительском компоненте

      toast({
        title: "Успешно",
        description: "Семестр успешно удален",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)

      // Перезагружаем страницу для обновления данных
      window.location.reload()
    } catch (error) {
      console.error("Ошибка при удалении семестра:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить семестр",
        variant: "destructive",
      })
    }
  }

  const handleAddToGroup = async () => {
    if (!selectedUserForGroup) return

    try {
      await addStudentToGroup(addToGroupForm.groupId, selectedUserForGroup.id)

      // Обновляем данные
      const updatedUsers = await getAllUsers()
      const updatedGroups = await getGroups()

      setUsers(updatedUsers)
      setGroups(updatedGroups)

      setIsAddToGroupOpen(false)

      toast({
        title: "Успешно",
        description: "Студент добавлен в группу",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при добавлении студента в группу:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить студента в группу",
        variant: "destructive",
      })
    }
  }

  const handleRemoveFromGroup = async (userId: string) => {
    try {
      await removeStudentFromGroup(userId)

      // Обновляем данные
      const updatedUsers = await getAllUsers()
      const updatedGroups = await getGroups()

      setUsers(updatedUsers)
      setGroups(updatedGroups)

      toast({
        title: "Успешно",
        description: "Студент удален из группы",
      })

      // Обновляем список операций
      const operationsData = await getOperations()
      setOperations(operationsData)
    } catch (error) {
      console.error("Ошибка при удалении студента из группы:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить студента из группы",
        variant: "destructive",
      })
    }
  }

  // Функция для получения названия роли
  const getRoleName = (role: "student" | "observer" | "accountant" | "admin") => {
    switch (role) {
      case "student":
        return "Студент"
      case "observer":
        return "Наблюдатель"
      case "accountant":
        return "Бухгалтер"
      case "admin":
        return "Администратор"
      default:
        return role
    }
  }

  // Функция для отображения иконки типа операции
  const renderOperationIcon = (type: string) => {
    const info = getOperationTypeInfo(type)
    switch (info.icon) {
      case "FileText":
        return <FileText className={`h-4 w-4 ${info.color}`} />
      case "User":
        return <User className={`h-4 w-4 ${info.color}`} />
      case "Users":
        return <Users className={`h-4 w-4 ${info.color}`} />
      case "Calendar":
        return <Calendar className={`h-4 w-4 ${info.color}`} />
      default:
        return <FileText className={`h-4 w-4 ${info.color}`} />
    }
  }

  // Функция для переключения направления сортировки
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "desc" ? "asc" : "desc")
  }

  // Функция для отображения пагинации
  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm">
          Страница {currentPage} из {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Функция для отображения информации об инициаторе
  const handleShowInitiatorInfo = (initiator: OperationResponse["initiator"]) => {
    setSelectedInitiator(initiator)
    setIsInitiatorInfoOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Панель администратора</h1>
          <p className="text-muted-foreground">Управление пользователями, группами и семестрами</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="groups">Группы</TabsTrigger>
          <TabsTrigger value="semesters">Семестры</TabsTrigger>
          <TabsTrigger value="activity">Журнал</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>Добавление, редактирование и удаление пользователей</CardDescription>
              </div>
              <Button onClick={() => setIsNewUserOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по ФИО"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Фильтр по роли" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все роли</SelectItem>
                      <SelectItem value="student">Студенты</SelectItem>
                      <SelectItem value="observer">Наблюдатели</SelectItem>
                      <SelectItem value="accountant">Бухгалтеры</SelectItem>
                      <SelectItem value="admin">Администраторы</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Загрузка данных...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="rounded-md border min-w-[800px]">
                    <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                      <div className="col-span-3">ФИО</div>
                      <div className="col-span-2">Роль</div>
                      <div className="col-span-2">Телефон</div>
                      <div className="col-span-2">Логин</div>
                      <div className="col-span-3 text-right">Действия</div>
                    </div>
                    <div className="divide-y">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="grid grid-cols-12 p-4 text-sm items-center">
                          <div className="col-span-3">
                            {user.surname} {user.name} {user.patronymic}
                          </div>
                          <div className="col-span-2">
                            <Badge variant="outline">{getRoleName(user.role)}</Badge>
                          </div>
                          <div className="col-span-2">{user.phone}</div>
                          <div className="col-span-2">{user.login}</div>
                          <div className="col-span-3 text-right space-x-2">
                            {user.role === "student" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserForGroup(user)
                                  setAddToGroupForm({ groupId: user.group_id || "" })
                                  setIsAddToGroupOpen(true)
                                }}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Группа
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setEditUserForm({
                                  name: user.name,
                                  surname: user.surname,
                                  patronymic: user.patronymic,
                                  phone: user.phone,
                                })
                                setIsEditUserOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {filteredUsers.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">Пользователи не найдены</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Управление группами</CardTitle>
                <CardDescription>Добавление, редактирование и удаление групп</CardDescription>
              </div>
              <Button onClick={() => setIsNewGroupOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Загрузка данных...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="rounded-md border min-w-[800px]">
                    <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                      <div className="col-span-3">Название группы</div>
                      <div className="col-span-6">Студенты</div>
                      <div className="col-span-3 text-right">Действия</div>
                    </div>
                    <div className="divide-y">
                      {groups.map((group) => (
                        <div key={group.id} className="grid grid-cols-12 p-4 text-sm items-center">
                          <div className="col-span-3">{group.name}</div>
                          <div className="col-span-6">
                            {group.users.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {group.users.map((user) => (
                                  <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                                    {user.surname} {user.name.charAt(0)}.
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 ml-1"
                                      onClick={() => handleRemoveFromGroup(user.id)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Нет студентов</span>
                            )}
                          </div>
                          <div className="col-span-3 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGroup(group)
                                setEditGroupForm({ name: group.name })
                                setIsEditGroupOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {groups.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">Группы не найдены</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semesters" className="mt-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Управление семестрами</CardTitle>
                <CardDescription>Добавление, редактирование и удаление семестров</CardDescription>
              </div>
              <Button onClick={() => setIsNewSemesterOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Загрузка данных...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="rounded-md border min-w-[600px]">
                    <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                      <div className="col-span-9">Название семестра</div>
                      <div className="col-span-3 text-right">Действия</div>
                    </div>
                    <div className="divide-y">
                      {semesters.map((semester) => (
                        <div key={semester.id} className="grid grid-cols-12 p-4 text-sm items-center">
                          <div className="col-span-9">{semester.name}</div>
                          <div className="col-span-3 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSemester(semester)
                                setEditSemesterForm({ name: semester.name })
                                setIsEditSemesterOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteSemester(semester.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {semesters.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">Семестры не найдены</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Журнал действий</CardTitle>
              <CardDescription>История всех действий в системе</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по описанию или инициатору"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={operationFilter} onValueChange={setOperationFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Фильтр по типу" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все действия</SelectItem>
                      <SelectItem value="payment">Оплаты</SelectItem>
                      <SelectItem value="user">Пользователи</SelectItem>
                      <SelectItem value="group">Группы</SelectItem>
                      <SelectItem value="semester">Семестры</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Фильтр по дате" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все время</SelectItem>
                      <SelectItem value="today">Сегодня</SelectItem>
                      <SelectItem value="week">За неделю</SelectItem>
                      <SelectItem value="month">За месяц</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loading ? (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Загрузка данных...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="rounded-md border min-w-[800px]">
                    <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                      <div className="col-span-3 flex items-center gap-1 cursor-pointer" onClick={toggleSortDirection}>
                        Дата и время
                        {sortDirection === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                      </div>
                      <div className="col-span-2">Инициатор</div>
                      <div className="col-span-2">Тип действия</div>
                      <div className="col-span-5">Описание</div>
                    </div>
                    <div className="divide-y">
                      {paginatedOperations.map((operation) => (
                        <div key={operation.id} className="grid grid-cols-12 p-4 text-sm items-center">
                          <div className="col-span-3">{formatDateTime(operation.created_at)}</div>
                          <div className="col-span-2">
                            {operation.initiator ? (
                              <Button
                                variant="link"
                                className="p-0 h-auto text-sm font-normal"
                                onClick={() => handleShowInitiatorInfo(operation.initiator)}
                              >
                                {operation.initiator.surname} {operation.initiator.name.charAt(0)}.
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">Неизвестно</span>
                            )}
                          </div>
                          <div className="col-span-2">
                            <div className="flex items-center gap-1">
                              {renderOperationIcon(operation.type)}
                              <span>
                                {operationTypeNames[operation.type as keyof typeof operationTypeNames] ||
                                  operation.type}
                              </span>
                            </div>
                          </div>
                          <div className="col-span-5">{operation.comment}</div>
                        </div>
                      ))}

                      {filteredOperations.length === 0 && (
                        <div className="p-4 text-center text-muted-foreground">Действия не найдены</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {renderPagination()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог создания пользователя */}
      <Dialog open={isNewUserOpen} onOpenChange={setIsNewUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать пользователя</DialogTitle>
            <DialogDescription>Заполните форму для создания нового пользователя</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surname">Фамилия</Label>
                <Input
                  id="surname"
                  placeholder="Иванов"
                  value={newUserForm.surname}
                  onChange={(e) => setNewUserForm({ ...newUserForm, surname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input
                  id="name"
                  placeholder="Иван"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patronymic">Отчество</Label>
              <Input
                id="patronymic"
                placeholder="Иванович"
                value={newUserForm.patronymic}
                onChange={(e) => setNewUserForm({ ...newUserForm, patronymic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                placeholder="8 (999) 123-45-67"
                value={newUserForm.phone}
                onChange={(e) => handlePhoneChange(e, setNewUserForm, newUserForm)}
              />
              {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                placeholder="ivanov_ii"
                value={newUserForm.login}
                onChange={(e) => setNewUserForm({ ...newUserForm, login: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Минимум 8 символов"
                value={newUserForm.password}
                onChange={handlePasswordChange}
              />
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select
                value={newUserForm.role}
                onValueChange={(value: "student" | "observer" | "accountant" | "admin") => setNewUserForm({ ...newUserForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Студент</SelectItem>
                  <SelectItem value="observer">Наблюдатель</SelectItem>
                  <SelectItem value="accountant">Бухгалтер</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateUser}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования пользователя */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>Измените данные пользователя</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-surname">Фамилия</Label>
                <Input
                  id="edit-surname"
                  placeholder="Иванов"
                  value={editUserForm.surname}
                  onChange={(e) => setEditUserForm({ ...editUserForm, surname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Имя</Label>
                <Input
                  id="edit-name"
                  placeholder="Иван"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-patronymic">Отчество</Label>
              <Input
                id="edit-patronymic"
                placeholder="Иванович"
                value={editUserForm.patronymic}
                onChange={(e) => setEditUserForm({ ...editUserForm, patronymic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Телефон</Label>
              <Input
                id="edit-phone"
                placeholder="8 (999) 123-45-67"
                value={editUserForm.phone}
                onChange={(e) => handlePhoneChange(e, setEditUserForm, editUserForm)}
              />
              {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditUser}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания группы */}
      <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать группу</DialogTitle>
            <DialogDescription>Введите название новой группы</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Название группы</Label>
              <Input
                id="group-name"
                placeholder="ИТ-101"
                value={newGroupForm.name}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateGroup}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования группы */}
      <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать группу</DialogTitle>
            <DialogDescription>Измените название группы</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-group-name">Название группы</Label>
              <Input
                id="edit-group-name"
                placeholder="ИТ-101"
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditGroup}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания семестра */}
      <Dialog open={isNewSemesterOpen} onOpenChange={setIsNewSemesterOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Создать семестр</DialogTitle>
            <DialogDescription>Введите название нового семестра</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="semester-name">Название семестра</Label>
              <Input
                id="semester-name"
                placeholder="Осенний семестр 2023"
                value={newSemesterForm.name}
                onChange={(e) => setNewSemesterForm({ ...newSemesterForm, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateSemester}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования семестра */}
      <Dialog open={isEditSemesterOpen} onOpenChange={setIsEditSemesterOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать семестр</DialogTitle>
            <DialogDescription>Измените название семестра</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-semester-name">Название семестра</Label>
              <Input
                id="edit-semester-name"
                placeholder="Осенний семестр 2023"
                value={editSemesterForm.name}
                onChange={(e) => setEditSemesterForm({ ...editSemesterForm, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditSemester}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления студента в группу */}
      <Dialog open={isAddToGroupOpen} onOpenChange={setIsAddToGroupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Добавить в группу</DialogTitle>
            <DialogDescription>Выберите группу для студента</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-select">Группа</Label>
              <Select
                value={addToGroupForm.groupId}
                onValueChange={(value) => setAddToGroupForm({ ...addToGroupForm, groupId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddToGroup}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог информации об инициаторе */}
      <Dialog open={isInitiatorInfoOpen} onOpenChange={setIsInitiatorInfoOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Информация об инициаторе</DialogTitle>
            <DialogDescription>Подробные данные о пользователе</DialogDescription>
          </DialogHeader>
          {selectedInitiator && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">ID пользователя</p>
                    <p className="font-medium">{selectedInitiator.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Роль</p>
                    <Badge variant="outline">{getRoleName(selectedInitiator.role)}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ФИО</p>
                  <p className="font-medium">
                    {selectedInitiator.surname} {selectedInitiator.name} {selectedInitiator.patronymic}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsInitiatorInfoOpen(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
