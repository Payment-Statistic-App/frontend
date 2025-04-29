"use client"

import { useState, useEffect, useRef } from "react"
import type { UserResponse, SemesterResponse, TransactionResponse } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReceiptDialog } from "@/components/receipt-dialog"
import { getStudents } from "@/lib/api/users"
import { formatDate } from "@/lib/utils"
import { Download, Printer, FileText, Loader2 } from "lucide-react"
import { Pagination } from "@/components/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AccountantDashboardProps {
  user: UserResponse
  semesters: SemesterResponse[]
}

export function AccountantDashboard({ user, semesters }: AccountantDashboardProps) {
  const [students, setStudents] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponse | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<UserResponse | null>(null)
  const [selectedSemester, setSelectedSemester] = useState<SemesterResponse | null>(null)
  const [currentTransactionsPage, setCurrentTransactionsPage] = useState(1)
  const [currentStudentsPage, setCurrentStudentsPage] = useState(1)
  const reportRef = useRef<HTMLDivElement>(null)

  // Количество записей на странице
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsData = await getStudents()
        setStudents(studentsData)
      } catch (error) {
        console.error("Ошибка при загрузке студентов:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Функция для проверки оплаты семестра
  const isSemesterPaid = (studentTransactions: any[], semesterId: string) => {
    return studentTransactions.some((transaction) => transaction.semester_id === semesterId)
  }

  // Функция для получения транзакции по семестру
  const getTransactionBySemester = (studentTransactions: any[], semesterId: string) => {
    return studentTransactions.find((transaction) => transaction.semester_id === semesterId)
  }

  // Фильтрация студентов по поисковому запросу
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.surname} ${student.name} ${student.patronymic}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  // Пагинация для студентов
  const totalStudentsPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginatedStudents = filteredStudents.slice(
      (currentStudentsPage - 1) * ITEMS_PER_PAGE,
      currentStudentsPage * ITEMS_PER_PAGE,
  )

  // Получение всех транзакций всех студентов
  const allTransactions = students
      .flatMap((student) =>
          student.transactions.map((transaction) => ({
            ...transaction,
            student: student,
          })),
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // Фильтрация транзакций по поисковому запросу
  const filteredTransactions = allTransactions.filter((transaction) => {
    const fullName =
        `${transaction.student.surname} ${transaction.student.name} ${transaction.student.patronymic}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  // Пагинация для транзакций
  const totalTransactionsPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  const paginatedTransactions = filteredTransactions.slice(
      (currentTransactionsPage - 1) * ITEMS_PER_PAGE,
      currentTransactionsPage * ITEMS_PER_PAGE,
  )

  const handleViewReceipt = (
      transaction: TransactionResponse,
      student: UserResponse,
      semester: SemesterResponse | null = null,
  ) => {
    setSelectedTransaction(transaction)
    setSelectedStudent(student)
    setSelectedSemester(semester)
    setIsReceiptOpen(true)
  }

  // Функция для печати отчета
  const handlePrintReport = () => {
    const content = reportRef.current
    if (!content) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Сводный отчет по оплате</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .report {
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .paid {
              color: green;
              font-weight: bold;
            }
            .unpaid {
              color: red;
              font-weight: bold;
            }
            .summary {
              margin-top: 30px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  // Функция для скачивания отчета
  const handleDownloadReport = () => {
    const content = reportRef.current
    if (!content) return

    const html = `
      <html>
        <head>
          <title>Сводный отчет по оплате</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .report {
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
            }
            .subtitle {
              font-size: 16px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .paid {
              color: green;
              font-weight: bold;
            }
            .unpaid {
              color: red;
              font-weight: bold;
            }
            .summary {
              margin-top: 30px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .footer {
              margin-top: 40px;
              text-align: right;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Сводный_отчет_по_оплате_${new Date().toLocaleDateString()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Расчет статистики
  const totalStudents = students.length
  const totalPaidStudents = students.filter((student) => student.transactions.length > 0).length
  const totalAmount = students.reduce((sum, student) => sum + student.transactions.reduce((s, t) => s + t.amount, 0), 0)

  // Расчет статистики по семестрам
  const semesterStats = semesters.map((semester) => {
    const paidCount = students.filter((student) =>
        student.transactions.some((t) => t.semester_id === semester.id),
    ).length
    const totalAmount = students.reduce(
        (sum, student) =>
            sum + student.transactions.filter((t) => t.semester_id === semester.id).reduce((s, t) => s + t.amount, 0),
        0,
    )

    return {
      semester,
      paidCount,
      unpaidCount: totalStudents - paidCount,
      paidPercentage: totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0,
      totalAmount,
    }
  })

  // Группировка семестров для отображения в таблице (максимум 5 колонок)
  const MAX_COLUMNS = 5
  const SEMESTERS_PER_COLUMN = Math.ceil(semesters.length / MAX_COLUMNS)

  // Разбиваем семестры на группы
  const semesterGroups = [] as SemesterResponse[][]
  for (let i = 0; i < semesters.length; i += SEMESTERS_PER_COLUMN) {
    semesterGroups.push(semesters.slice(i, i + SEMESTERS_PER_COLUMN))
  }

  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Панель бухгалтера</h1>
            <p className="text-muted-foreground">Управление и проверка платежей студентов</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setIsReportOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Сводный отчет
            </Button>
          </div>
        </div>

        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input placeholder="Поиск по ФИО студента" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="payments">Платежи</TabsTrigger>
            <TabsTrigger value="students">Студенты</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>История платежей</CardTitle>
                <CardDescription>Все платежи студентов</CardDescription>
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
                          <div className="col-span-4">Студент</div>
                          <div className="col-span-2">Семестр</div>
                          <div className="col-span-2">Сумма</div>
                          <div className="col-span-2">Дата</div>
                          <div className="col-span-2 text-right">Действия</div>
                        </div>
                        <div className="divide-y">
                          {paginatedTransactions.map((transaction) => {
                            const semester = semesters.find((s) => s.id === transaction.semester_id)

                            return (
                                <div key={transaction.id} className="grid grid-cols-12 p-4 text-sm items-center">
                                  <div className="col-span-4">
                                    {transaction.student.surname} {transaction.student.name} {transaction.student.patronymic}
                                  </div>
                                  <div className="col-span-2">{semester ? semester.name : transaction.semester_id}</div>
                                  <div className="col-span-2">{transaction.amount} ₽</div>
                                  <div className="col-span-2">{formatDate(transaction.created_at)}</div>
                                  <div className="col-span-2 text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewReceipt(transaction, transaction.student, semester)}
                                    >
                                      Справка
                                    </Button>
                                  </div>
                                </div>
                            )
                          })}

                          {filteredTransactions.length === 0 && (
                              <div className="p-4 text-center text-muted-foreground">Платежи не найдены</div>
                          )}
                        </div>
                      </div>
                    </div>
                )}
                <Pagination
                    currentPage={currentTransactionsPage}
                    totalPages={totalTransactionsPages}
                    onPageChange={setCurrentTransactionsPage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Отчет по оплате</CardTitle>
                <CardDescription>Статус оплаты по всем студентам</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                    <div className="text-center p-4">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="mt-2">Загрузка данных...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full rounded-md border min-w-[800px]">
                        <thead>
                        <tr className="bg-muted text-sm font-medium">
                          <th className="p-4 text-left">ФИО студента</th>
                          {semesterGroups.map((group, groupIndex) => (
                              <th key={groupIndex} className="p-4 text-center">
                                {group.map((semester) => semester.name).join(", ")}
                              </th>
                          ))}
                          <th className="p-4 text-center">Всего оплачено</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {paginatedStudents.map((student) => {
                          // Подсчет общей суммы оплаты
                          const totalPaid = student.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

                          return (
                              <tr key={student.id} className="text-sm">
                                <td className="p-4">
                                  {student.surname} {student.name} {student.patronymic}
                                </td>

                                {semesterGroups.map((group, groupIndex) => (
                                    <td key={groupIndex} className="p-4 text-center">
                                      <div className="flex flex-col gap-2">
                                        {group.map((semester) => {
                                          const isPaid = isSemesterPaid(student.transactions, semester.id)
                                          const transaction = getTransactionBySemester(student.transactions, semester.id)

                                          return (
                                              <div key={semester.id} className="flex items-center justify-center">
                                                <span className="text-xs font-medium mr-2">{semester.name}:</span>
                                                {isPaid ? (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-6 p-0 text-green-600 font-medium"
                                                        onClick={() => {
                                                          if (transaction) {
                                                            handleViewReceipt(transaction, student, semester)
                                                          }
                                                        }}
                                                    >
                                                      Отчет
                                                    </Button>
                                                ) : (
                                                    <Badge
                                                        variant="destructive"
                                                        className="bg-red-100 text-red-800 hover:bg-red-100"
                                                    >
                                                      Не оплачено
                                                    </Badge>
                                                )}
                                              </div>
                                          )
                                        })}
                                      </div>
                                    </td>
                                ))}

                                <td className="p-4 text-center font-medium">{totalPaid} ₽</td>
                              </tr>
                          )
                        })}

                        {filteredStudents.length === 0 && (
                            <tr>
                              <td colSpan={semesterGroups.length + 2} className="p-4 text-center text-muted-foreground">
                                Студенты не найдены
                              </td>
                            </tr>
                        )}
                        </tbody>
                      </table>
                    </div>
                )}
                <Pagination
                    currentPage={currentStudentsPage}
                    totalPages={totalStudentsPages}
                    onPageChange={setCurrentStudentsPage}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedTransaction && selectedStudent && (
            <ReceiptDialog
                open={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                transaction={selectedTransaction}
                user={selectedStudent}
                semester={selectedSemester || semesters.find((s) => s.id === selectedTransaction.semester_id) || null}
            />
        )}

        {/* Диалог сводного отчета */}
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Сводный отчет по оплате</DialogTitle>
              <DialogDescription>Информация о статусе оплаты по всем студентам</DialogDescription>
            </DialogHeader>

            <div ref={reportRef} className="report bg-white p-6 rounded-lg border">
              <div className="header text-center mb-6">
                <div className="title text-2xl font-bold">СВОДНЫЙ ОТЧЕТ ПО ОПЛАТЕ</div>
                <div className="subtitle text-gray-500 mt-1">от {new Date().toLocaleDateString()}</div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                  <tr>
                    <th className="border p-2 bg-gray-50">ФИО студента</th>
                    {semesters.map((semester) => (
                        <th key={semester.id} className="border p-2 bg-gray-50">
                          {semester.name}
                        </th>
                    ))}
                    <th className="border p-2 bg-gray-50">Всего оплачено</th>
                  </tr>
                  </thead>
                  <tbody>
                  {students.map((student) => {
                    const totalPaid = student.transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

                    return (
                        <tr key={student.id}>
                          <td className="border p-2">
                            {student.surname} {student.name} {student.patronymic}
                          </td>

                          {semesters.map((semester) => {
                            const isPaid = isSemesterPaid(student.transactions, semester.id)
                            const transaction = student.transactions.find((t) => t.semester_id === semester.id)

                            return (
                                <td key={semester.id} className="border p-2 text-center">
                                  {isPaid ? (
                                      <span className="text-green-600 font-medium">
                                  Оплачено ({transaction ? transaction.amount : 0} ₽)
                                </span>
                                  ) : (
                                      <span className="text-red-600 font-medium">Не оплачено</span>
                                  )}
                                </td>
                            )
                          })}

                          <td className="border p-2 text-center font-medium">{totalPaid} ₽</td>
                        </tr>
                    )
                  })}
                  </tbody>
                </table>
              </div>

              <div className="summary mt-8 pt-4 border-t">
                <h3 className="text-lg font-medium mb-3">Статистика по семестрам:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50">Семестр</th>
                      <th className="border p-2 bg-gray-50">Оплатили</th>
                      <th className="border p-2 bg-gray-50">Не оплатили</th>
                      <th className="border p-2 bg-gray-50">Процент оплаты</th>
                      <th className="border p-2 bg-gray-50">Общая сумма</th>
                    </tr>
                    </thead>
                    <tbody>
                    {semesterStats.map((stat) => (
                        <tr key={stat.semester.id}>
                          <td className="border p-2">{stat.semester.name}</td>
                          <td className="border p-2">{stat.paidCount} студентов</td>
                          <td className="border p-2">{stat.unpaidCount} студентов</td>
                          <td className="border p-2">{stat.paidPercentage}%</td>
                          <td className="border p-2">{stat.totalAmount} ₽</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="summary mt-8 pt-4 border-t">
                <h3 className="text-lg font-medium mb-3">Общая статистика:</h3>
                <p className="mb-1">
                  Всего студентов: <strong>{totalStudents}</strong>
                </p>
                <p className="mb-1">
                  Оплатили хотя бы один семестр: <strong>{totalPaidStudents}</strong>
                </p>
                <p className="mb-1">
                  Общая сумма оплат: <strong>{totalAmount} ₽</strong>
                </p>
              </div>

              <div className="footer mt-8 text-right">
                <p className="mb-1">Подпись бухгалтера: _________________</p>
                <p>Дата: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handlePrintReport} className="w-full sm:w-auto">
                <Printer className="mr-2 h-4 w-4" />
                Печать
              </Button>
              <Button onClick={handleDownloadReport} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Скачать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
