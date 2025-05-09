"use client"

import { useState } from "react"
import type { UserResponse, SemesterResponse, TransactionResponse } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentDialog } from "@/components/payment-dialog"
import { ReceiptDialog } from "@/components/receipt-dialog"
import { formatDate } from "@/lib/utils"
import { Pagination } from "@/components/pagination"
// Импортируем компонент Tabs
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StudentDashboardProps {
  user: UserResponse
  semesters: SemesterResponse[]
}

export function StudentDashboard({ user, semesters }: StudentDashboardProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<SemesterResponse | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponse | null>(null)
  const [currentSemestersPage, setCurrentSemestersPage] = useState(1)
  const [currentTransactionsPage, setCurrentTransactionsPage] = useState(1)

  // Количество записей на странице
  const ITEMS_PER_PAGE = 10

  // Функция для проверки оплаты семестра
  const isSemesterPaid = (semesterId: string) => {
    return user.transactions.some((transaction) => transaction.semester_id === semesterId)
  }

  // Функция для получения транзакции по семестру
  const getTransactionBySemester = (semesterId: string) => {
    return user.transactions.find((transaction) => transaction.semester_id === semesterId)
  }

  const handlePayClick = (semester: SemesterResponse) => {
    setSelectedSemester(semester)
    setIsPaymentOpen(true)
  }

  const handleReceiptClick = (semester: SemesterResponse) => {
    const transaction = getTransactionBySemester(semester.id)
    if (transaction) {
      setSelectedTransaction(transaction)
      setIsReceiptOpen(true)
    }
  }

  // Пагинация для семестров
  const totalSemestersPages = Math.ceil(semesters.length / ITEMS_PER_PAGE)
  const paginatedSemesters = semesters.slice(
      (currentSemestersPage - 1) * ITEMS_PER_PAGE,
      currentSemestersPage * ITEMS_PER_PAGE,
  )

  // Пагинация для транзакций
  const totalTransactionsPages = Math.ceil(user.transactions.length / ITEMS_PER_PAGE)
  const paginatedTransactions = user.transactions.slice(
      (currentTransactionsPage - 1) * ITEMS_PER_PAGE,
      currentTransactionsPage * ITEMS_PER_PAGE,
  )

  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Личный кабинет студента</h1>
            <p className="text-muted-foreground">Управление оплатой обучения и просмотр статуса платежей</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Информация о студенте</CardTitle>
            <CardDescription>Ваши персональные данные</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">ФИО</h3>
                <p className="text-base">
                  {user.surname} {user.name} {user.patronymic}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Телефон</h3>
                <p className="text-base">{user.phone}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Логин</h3>
                <p className="text-base">{user.login}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Группа</h3>
                <p className="text-base">{user.group_name ? user.group_name : "Не назначена"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="semesters" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="semesters">Оплата семестров</TabsTrigger>
            <TabsTrigger value="history">История платежей</TabsTrigger>
          </TabsList>

          <TabsContent value="semesters" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Оплата семестров</CardTitle>
                <CardDescription>Статус оплаты по семестрам</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="rounded-md border min-w-[600px] w-full">
                    <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                      <div className="col-span-4">Семестр</div>
                      <div className="col-span-3 text-center">Статус</div>
                      <div className="col-span-5 text-right">Действия</div>
                    </div>
                    <div className="divide-y">
                      {paginatedSemesters.map((semester) => {
                        const isPaid = isSemesterPaid(semester.id)
                        const transaction = getTransactionBySemester(semester.id)

                        return (
                            <div key={semester.id} className="grid grid-cols-12 p-4 text-sm items-center">
                              <div className="col-span-4">{semester.name}</div>
                              <div className="col-span-3 text-center">
                                {isPaid ? (
                                    <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-100">
                                      Оплачено
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">
                                      Не оплачено
                                    </Badge>
                                )}
                              </div>
                              <div className="col-span-5 text-right space-x-2">
                                {isPaid ? (
                                    <Button variant="outline" size="sm" onClick={() => handleReceiptClick(semester)}>
                                      <span className="hidden sm:inline">Справка об оплате</span>
                                      <span className="sm:hidden">Справка</span>
                                    </Button>
                                ) : (
                                    <Button variant="default" size="sm" onClick={() => handlePayClick(semester)}>
                                      Оплатить
                                    </Button>
                                )}
                              </div>
                            </div>
                        )
                      })}

                      {semesters.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground">Нет доступных семестров для оплаты</div>
                      )}
                    </div>
                  </div>
                </div>
                {totalSemestersPages > 1 && (
                    <Pagination
                        currentPage={currentSemestersPage}
                        totalPages={totalSemestersPages}
                        onPageChange={setCurrentSemestersPage}
                    />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>История платежей</CardTitle>
                <CardDescription>Ваши платежи за обучение</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="rounded-md border min-w-[600px] w-full">
                    <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                      <div className="col-span-4">Семестр</div>
                      <div className="col-span-3">Сумма</div>
                      <div className="col-span-3">Дата</div>
                      <div className="col-span-2 text-right">Действия</div>
                    </div>
                    <div className="divide-y">
                      {paginatedTransactions.map((transaction) => {
                        const semester = semesters.find((s) => s.id === transaction.semester_id)

                        return (
                            <div key={transaction.id} className="grid grid-cols-12 p-4 text-sm items-center">
                              <div className="col-span-4">{semester ? semester.name : transaction.semester_id}</div>
                              <div className="col-span-3">{transaction.amount} ₽</div>
                              <div className="col-span-3">{formatDate(transaction.created_at)}</div>
                              <div className="col-span-2 text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTransaction(transaction)
                                      setIsReceiptOpen(true)
                                    }}
                                >
                                  Справка
                                </Button>
                              </div>
                            </div>
                        )
                      })}

                      {user.transactions.length === 0 && (
                          <div className="p-4 text-center text-muted-foreground">У вас пока нет платежей</div>
                      )}
                    </div>
                  </div>
                </div>
                {totalTransactionsPages > 1 && (
                    <Pagination
                        currentPage={currentTransactionsPage}
                        totalPages={totalTransactionsPages}
                        onPageChange={setCurrentTransactionsPage}
                    />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedSemester && (
            <PaymentDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen} user={user} semester={selectedSemester} />
        )}

        {selectedTransaction && (
            <ReceiptDialog
                open={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                transaction={selectedTransaction}
                user={user}
                semester={semesters.find((s) => s.id === selectedTransaction.semester_id) || null}
            />
        )}
      </div>
  )
}
