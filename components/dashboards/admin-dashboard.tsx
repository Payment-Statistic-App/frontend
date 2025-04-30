"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import type { UserResponse, SemesterResponse, GroupResponse, OperationResponse } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
    getSemesters,
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
    User,
    FileText,
    Users,
    Calendar,
    ArrowDown,
    ArrowUp,
} from "lucide-react"
import { formatDateTime, formatPhoneNumber, isValidPhoneNumber } from "@/lib/utils"
import { Pagination } from "@/components/pagination"
import { Badge } from "@/components/ui/badge"

interface AdminDashboardProps {
    user: UserResponse
    semesters: SemesterResponse[]
}

export function AdminDashboard({ user, semesters: initialSemesters }: AdminDashboardProps) {
    const [users, setUsers] = useState<UserResponse[]>([])
    const [groups, setGroups] = useState<GroupResponse[]>([])
    const [operations, setOperations] = useState<OperationResponse[]>([])
    const [semesters, setSemesters] = useState<SemesterResponse[]>(initialSemesters)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [operationFilter, setOperationFilter] = useState<string>("all")
    const [dateFilter, setDateFilter] = useState<string>("all")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
    const [currentOperationsPage, setCurrentOperationsPage] = useState(1)
    const [currentUsersPage, setCurrentUsersPage] = useState(1)
    const [currentGroupsPage, setCurrentGroupsPage] = useState(1)
    const [currentSemestersPage, setCurrentSemestersPage] = useState(1)
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

    // Формы
    const [newUserForm, setNewUserForm] = useState({
        name: "",
        surname: "",
        patronymic: "",
        phone: "",
        login: "",
        password: "",
        role: "student" as "student" | "observer" | "accountant" | "admin",
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
                const [usersData, groupsData, operationsData, semestersData] = await Promise.all([
                    getAllUsers(),
                    getGroups(),
                    getOperations(),
                    getSemesters(),
                ])

                // Сортировка пользователей от новых к старым (по ID)
                const sortedUsers = [...usersData].sort((a, b) => {
                    return b.id.localeCompare(a.id)
                })

                setUsers(sortedUsers)
                setGroups(groupsData)
                setOperations(operationsData)

                // Сортировка семестров от старых к новым (по ID)
                const sortedSemesters = [...semestersData].sort((a, b) => {
                    return a.id.localeCompare(b.id)
                })
                setSemesters(sortedSemesters)
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

    // Пагинация для пользователей
    const totalUsersPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
    const paginatedUsers = filteredUsers.slice((currentUsersPage - 1) * ITEMS_PER_PAGE, currentUsersPage * ITEMS_PER_PAGE)

    // Пагинация для групп
    const totalGroupsPages = Math.ceil(groups.length / ITEMS_PER_PAGE)
    const paginatedGroups = groups.slice((currentGroupsPage - 1) * ITEMS_PER_PAGE, currentGroupsPage * ITEMS_PER_PAGE)

    // Пагинация для семестров
    const totalSemestersPages = Math.ceil(semesters.length / ITEMS_PER_PAGE)
    const paginatedSemesters = semesters.slice(
        (currentSemestersPage - 1) * ITEMS_PER_PAGE,
        currentSemestersPage * ITEMS_PER_PAGE,
    )

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

    // Пагинация для операций
    const totalOperationsPages = Math.ceil(filteredOperations.length / ITEMS_PER_PAGE)
    const paginatedOperations = filteredOperations.slice(
        (currentOperationsPage - 1) * ITEMS_PER_PAGE,
        currentOperationsPage * ITEMS_PER_PAGE,
    )

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
            // Добавляем нового пользователя в начало списка (сортировка от новых к старым)
            setUsers([newUser, ...users])
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

            // Добавляем новый семестр и сортируем от старых к новым
            const updatedSemesters = [...semesters, newSemester].sort((a, b) => {
                return a.id.localeCompare(b.id)
            })

            setSemesters(updatedSemesters)
            setIsNewSemesterOpen(false)
            setNewSemesterForm({ name: "" })

            toast({
                title: "Успешно",
                description: "Семестр успешно создан",
            })

            // Обновляем список операций
            const operationsData = await getOperations()
            setOperations(operationsData)
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

            // Обновляем семестр в списке и сохраняем сортировку
            const updatedSemesters = semesters.map((s) => (s.id === updatedSemester.id ? updatedSemester : s))

            setSemesters(updatedSemesters)
            setIsEditSemesterOpen(false)

            toast({
                title: "Успешно",
                description: "Семестр успешно обновлен",
            })

            // Обновляем список операций
            const operationsData = await getOperations()
            setOperations(operationsData)
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

            // Удаляем семестр из списка
            const updatedSemesters = semesters.filter((s) => s.id !== semesterId)
            setSemesters(updatedSemesters)

            toast({
                title: "Успешно",
                description: "Семестр успешно удален",
            })

            // Обновляем список операций
            const operationsData = await getOperations()
            setOperations(operationsData)
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

            // Сортировка пользователей от новых к старым
            const sortedUsers = [...updatedUsers].sort((a, b) => {
                return b.id.localeCompare(a.id)
            })

            setUsers(sortedUsers)
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

            // Сортировка пользователей от новых к старым
            const sortedUsers = [...updatedUsers].sort((a, b) => {
                return b.id.localeCompare(a.id)
            })

            setUsers(sortedUsers)
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
    const getRoleName = (role: string) => {
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

    // Функция для отображения информации об инициаторе
    const handleShowInitiatorInfo = (initiator: OperationResponse["initiator"]) => {
        setSelectedInitiator(initiator)
        setIsInitiatorInfoOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">Админ-панель</h2>
                    <p className="text-sm text-muted-foreground">Управляйте пользователями, группами, семестрами и операциями.</p>
                </div>
            </div>

            <Tabs defaultValue="users" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="users">Пользователи</TabsTrigger>
                    <TabsTrigger value="groups">Группы</TabsTrigger>
                    <TabsTrigger value="semesters">Семестры</TabsTrigger>
                    <TabsTrigger value="operations">Операции</TabsTrigger>
                </TabsList>
                <TabsContent value="users" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-2">
                            <Input
                                type="search"
                                placeholder="Поиск пользователей..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Все роли" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все роли</SelectItem>
                                    <SelectItem value="student">Студент</SelectItem>
                                    <SelectItem value="observer">Наблюдатель</SelectItem>
                                    <SelectItem value="accountant">Бухгалтер</SelectItem>
                                    <SelectItem value="admin">Администратор</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={() => setIsNewUserOpen(true)} className="w-full sm:w-auto">
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Добавить пользователя</span>
                            <span className="sm:hidden">Добавить</span>
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="rounded-md border min-w-[800px]">
                                <table className="w-full text-sm">
                                    <thead className="[&amp;:not([align=left])]:text-left">
                                    <tr className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">ФИО</th>
                                        <th className="h-12 px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">Телефон</th>
                                        <th className="h-12 px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">Логин</th>
                                        <th className="h-12 px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">Роль</th>
                                        <th className="h-12 px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">Действия</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            <td className="p-4 align-middle font-medium">
                                                {user.surname} {user.name} {user.patronymic}
                                            </td>
                                            <td className="p-4 align-middle">{user.phone}</td>
                                            <td className="p-4 align-middle">{user.login}</td>
                                            <td className="p-4 align-middle">{getRoleName(user.role)}</td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        variant="ghost"
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
                                                        <Edit className="h-4 w-4 mr-2 sm:mr-0" />
                                                        <span className="sm:hidden md:inline">Изменить</span>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)}>
                                                        <Trash className="h-4 w-4 mr-2 sm:mr-0" />
                                                        <span className="sm:hidden md:inline">Удалить</span>
                                                    </Button>
                                                    {user.group_id ? (
                                                        <Button variant="ghost" size="sm" onClick={() => handleRemoveFromGroup(user.id)}>
                                                            <X className="h-4 w-4 mr-2 sm:mr-0" />
                                                            <span className="sm:hidden md:inline">Из группы</span>
                                                        </Button>
                                                    ) : user.role === "student" ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUserForGroup(user)
                                                                setIsAddToGroupOpen(true)
                                                            }}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2 sm:mr-0" />
                                                            <span className="sm:hidden md:inline">В группу</span>
                                                        </Button>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-4 text-center">
                                                Нет пользователей
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <Pagination currentPage={currentUsersPage} totalPages={totalUsersPages} onPageChange={setCurrentUsersPage} />
                </TabsContent>
                <TabsContent value="groups" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Input
                            type="search"
                            placeholder="Поиск групп..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-auto sm:flex-1"
                        />
                        <Button onClick={() => setIsNewGroupOpen(true)} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Добавить группу</span>
                            <span className="sm:hidden">Добавить</span>
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="rounded-md border min-w-[600px]">
                                <table className="w-full text-sm">
                                    <thead className="[&amp;:not([align=left])]:text-left">
                                    <tr className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 text-left px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">
                                            Название
                                        </th>
                                        <th className="h-12 text-left px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">
                                            Студенты
                                        </th>
                                        <th className="h-12 text-left px-4 font-medium [&amp;:[data-state=selected]]:text-foreground pl-7">
                                            Действия
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedGroups.map((group) => (
                                        <tr
                                            key={group.id}
                                            className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            <td className="p-4 align-middle font-medium">{group.name}</td>
                                            <td className="p-4 align-middle">
                                                <div className="max-h-32 overflow-y-auto">
                                                    {group.users && group.users.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {group.users.map((student) => (
                                                                <div
                                                                    key={student.id}
                                                                    className="flex items-center bg-muted rounded-md px-2 py-1 text-xs"
                                                                >
                                    <span className="mr-1">
                                      {student.surname} {student.name}
                                    </span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                                                        onClick={() => handleRemoveFromGroup(student.id)}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">Нет студентов</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedGroup(group)
                                                            setEditGroupForm({ name: group.name })
                                                            setIsEditGroupOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2 sm:mr-0" />
                                                        <span className="sm:hidden md:inline">Изменить</span>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)}>
                                                        <Trash className="h-4 w-4 mr-2 sm:mr-0" />
                                                        <span className="sm:hidden md:inline">Удалить</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedGroups.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center">
                                                Нет групп
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <Pagination
                        currentPage={currentGroupsPage}
                        totalPages={totalGroupsPages}
                        onPageChange={setCurrentGroupsPage}
                    />
                </TabsContent>
                <TabsContent value="semesters" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Input
                            type="search"
                            placeholder="Поиск семестров..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-auto sm:flex-1"
                        />
                        <Button onClick={() => setIsNewSemesterOpen(true)} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Добавить семестр</span>
                            <span className="sm:hidden">Добавить</span>
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="rounded-md border min-w-[600px]">
                                <table className="w-full text-sm">
                                    <thead className="[&amp;:not([align=left])]:text-left">
                                    <tr className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 text-left px-4 font-medium [&amp;:[data-state=selected]]:text-foreground">
                                            Название
                                        </th>
                                        <th className="h-12 text-left px-4 font-medium [&amp;:[data-state=selected]]:text-foreground pl-7">
                                            Действия
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedSemesters.map((semester) => (
                                        <tr
                                            key={semester.id}
                                            className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            <td className="p-4 align-middle font-medium">{semester.name}</td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedSemester(semester)
                                                            setEditSemesterForm({ name: semester.name })
                                                            setIsEditSemesterOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2 sm:mr-0" />
                                                        <span className="sm:hidden md:inline">Изменить</span>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteSemester(semester.id)}>
                                                        <Trash className="h-4 w-4 mr-2 sm:mr-0" />
                                                        <span className="sm:hidden md:inline">Удалить</span>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedSemesters.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="p-4 text-center">
                                                Нет семестров
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <Pagination
                        currentPage={currentSemestersPage}
                        totalPages={totalSemestersPages}
                        onPageChange={setCurrentSemestersPage}
                    />
                </TabsContent>
                <TabsContent value="operations" className="space-y-4">
                    <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2">
                            <Input
                                type="search"
                                placeholder="Поиск операций..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full md:w-auto"
                            />
                            <Select value={operationFilter} onValueChange={setOperationFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Все типы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все действия</SelectItem>
                                    <SelectItem value="payment">Оплаты</SelectItem>
                                    <SelectItem value="user">Пользователи</SelectItem>
                                    <SelectItem value="group">Группы</SelectItem>
                                    <SelectItem value="semester">Семестры</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Все даты" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все даты</SelectItem>
                                    <SelectItem value="today">Сегодня</SelectItem>
                                    <SelectItem value="week">За неделю</SelectItem>
                                    <SelectItem value="month">За месяц</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" size="sm" onClick={toggleSortDirection} className="w-full sm:w-auto md:mt-0">
                            {sortDirection === "desc" ? (
                                <>
                                    Сначала новые <ArrowDown className="ml-2 h-4 w-4" />
                                </>
                            ) : (
                                <>
                                    Сначала старые <ArrowUp className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Загрузка...
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="rounded-md border min-w-[800px]">
                                <table className="w-full text-sm">
                                    <thead className="[&amp;:not([align=left])]:text-left">
                                    <tr className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 font-medium [&amp;[data-state=selected]]:text-foreground">
                                            Дата и время
                                        </th>
                                        <th className="h-12 px-4 font-medium [&amp;[data-state=selected]]:text-foreground">Тип</th>
                                        <th className="h-12 px-4 font-medium [&amp;[data-state=selected]]:text-foreground">
                                            Комментарий
                                        </th>
                                        <th className="h-12 px-4 font-medium [&amp;[data-state=selected]]:text-foreground">Инициатор</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paginatedOperations.map((operation) => (
                                        <tr
                                            key={operation.id}
                                            className="m-0 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                                        >
                                            <td className="p-4 align-middle">{formatDateTime(operation.created_at)}</td>
                                            <td className="p-4 align-middle font-medium">
                                                <div className="flex items-center space-x-2">
                                                    {renderOperationIcon(operation.type)}
                                                    <span>{operationTypeNames[operation.type]}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">{operation.comment}</td>
                                            <td className="p-4 align-middle">
                                                <Button variant="link" onClick={() => handleShowInitiatorInfo(operation.initiator)}>
                                                    {operation.initiator.surname} {operation.initiator.name}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {paginatedOperations.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-4 text-center">
                                                Нет операций
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    <Pagination
                        currentPage={currentOperationsPage}
                        totalPages={totalOperationsPages}
                        onPageChange={setCurrentOperationsPage}
                    />
                </TabsContent>
            </Tabs>

            {/* Модальные окна */}
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
                                maxLength={17}
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
                                onKeyDown={(e) => {
                                    // Если номер уже полный и это не управляющая клавиша - блокируем ввод
                                    if (
                                        isValidPhoneNumber(newUserForm.phone) &&
                                        !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                                    ) {
                                        e.preventDefault()
                                    }
                                }}
                                maxLength={20} // Фиксированная длина полного номера
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
                                onValueChange={(value: "student" | "observer" | "accountant" | "admin") =>
                                    setNewUserForm({ ...newUserForm, role: value })
                                }
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

            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Редактировать пользователя</DialogTitle>
                        <DialogDescription>Измените данные пользователя в системе.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Имя
                            </Label>
                            <Input
                                id="name"
                                value={editUserForm.name}
                                onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="surname" className="text-right">
                                Фамилия
                            </Label>
                            <Input
                                id="surname"
                                value={editUserForm.surname}
                                onChange={(e) => setEditUserForm({ ...editUserForm, surname: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="patronymic" className="text-right">
                                Отчество
                            </Label>
                            <Input
                                id="patronymic"
                                value={editUserForm.patronymic}
                                onChange={(e) => setEditUserForm({ ...editUserForm, patronymic: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Телефон
                            </Label>
                            <Input
                                id="phone"
                                value={editUserForm.phone}
                                onChange={(e) => handlePhoneChange(e, setEditUserForm, editUserForm)}
                                className="col-span-3"
                            />
                        </div>
                        {phoneError && <p className="text-red-500 col-span-4 text-center">{phoneError}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsEditUserOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" onClick={handleEditUser}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNewGroupOpen} onOpenChange={setIsNewGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Создать группу</DialogTitle>
                        <DialogDescription>Создайте новую группу в системе.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Название
                            </Label>
                            <Input
                                id="name"
                                value={newGroupForm.name}
                                onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsNewGroupOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" onClick={handleCreateGroup}>
                            Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditGroupOpen} onOpenChange={setIsEditGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Редактировать группу</DialogTitle>
                        <DialogDescription>Измените название группы в системе.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Название
                            </Label>
                            <Input
                                id="name"
                                value={editGroupForm.name}
                                onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsEditGroupOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" onClick={handleEditGroup}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isNewSemesterOpen} onOpenChange={setIsNewSemesterOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Создать семестр</DialogTitle>
                        <DialogDescription>Создайте новый семестр в системе.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Название
                            </Label>
                            <Input
                                id="name"
                                value={newSemesterForm.name}
                                onChange={(e) => setNewSemesterForm({ ...newSemesterForm, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsNewSemesterOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" onClick={handleCreateSemester}>
                            Создать
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditSemesterOpen} onOpenChange={setIsEditSemesterOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Редактировать семестр</DialogTitle>
                        <DialogDescription>Измените название семестра в системе.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Название
                            </Label>
                            <Input
                                id="name"
                                value={editSemesterForm.name}
                                onChange={(e) => setEditSemesterForm({ ...editSemesterForm, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsEditSemesterOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" onClick={handleEditSemester}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isAddToGroupOpen} onOpenChange={setIsAddToGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Добавить в группу</DialogTitle>
                        <DialogDescription>Добавьте студента в группу.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="groupId" className="text-right">
                                Группа
                            </Label>
                            <Select
                                value={addToGroupForm.groupId}
                                onValueChange={(value) => setAddToGroupForm({ ...addToGroupForm, groupId: value })}
                            >
                                <SelectTrigger className="col-span-3">
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
                        <Button type="button" variant="secondary" onClick={() => setIsAddToGroupOpen(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" onClick={handleAddToGroup}>
                            Добавить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isInitiatorInfoOpen} onOpenChange={setIsInitiatorInfoOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Информация об инициаторе</DialogTitle>
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
                        <Button type="button" variant="secondary" onClick={() => setIsInitiatorInfoOpen(false)}>
                            Закрыть
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
