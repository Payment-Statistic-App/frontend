"use client"

import { useState, useEffect, useRef } from "react"
import type { UserResponse, SemesterResponse } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getStudents } from "@/lib/api/users"
import { FileText, Printer, Download, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ObserverDashboardProps {
  user: UserResponse
  semesters: SemesterResponse[]
}

export function ObserverDashboard({ user, semesters }: ObserverDashboardProps) {
  const [students, setStudents] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

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

  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Панель наблюдателя</h1>
            <p className="text-muted-foreground">Просмотр отчетов по оплате обучения студентами</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setIsReportOpen(true)}>
              <FileText className="mr-2 h-4 w-4" />
              Сводный отчет
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Сводная статистика</CardTitle>
            <CardDescription>Общая информация по оплате</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="text-center p-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2">Загрузка данных...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800">Всего студентов</h3>
                    <p className="text-2xl font-bold text-blue-900">{students.length}</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800">Оплатили хотя бы 1 семестр</h3>
                    <p className="text-2xl font-bold text-green-900">
                      {students.filter((student) => student.transactions.length > 0).length}
                    </p>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-amber-800">Общая сумма оплат</h3>
                    <p className="text-2xl font-bold text-amber-900">
                      {students.reduce((sum, student) => sum + student.transactions.reduce((s, t) => s + t.amount, 0), 0)} ₽
                    </p>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>

        {/* Диалог сводного отчета */}
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Сводный отчет по оплате</DialogTitle>
              <DialogDescription>Информация о статусе оплаты по всем студентам</DialogDescription>
            </DialogHeader>

            <div ref={reportRef} className="report bg-white p-6 rounded-lg border overflow-x-auto">
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
                <p className="mb-1">Подпись: _________________</p>
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
