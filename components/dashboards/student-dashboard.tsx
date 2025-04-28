"use client"

import { useState } from "react"
import type { UserResponse, SemesterResponse, TransactionResponse } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentDialog } from "@/components/payment-dialog"
import { ReceiptDialog } from "@/components/receipt-dialog"
import { formatDate } from "@/lib/utils"

interface StudentDashboardProps {
  user: UserResponse
  semesters: SemesterResponse[]
}

export function StudentDashboard({ user, semesters }: StudentDashboardProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<SemesterResponse | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionResponse | null>(null)

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
              <p className="text-base">{user.group_id ? user.group_id : "Не назначена"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Оплата семестров</CardTitle>
          <CardDescription>Статус оплаты по семестрам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="rounded-md border min-w-[600px]">
              <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                <div className="col-span-4">Семестр</div>
                <div className="col-span-3 text-center">Статус</div>
                <div className="col-span-5 text-right">Действия</div>
              </div>
              <div className="divide-y">
                {semesters.map((semester) => {
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
                            Справка об оплате
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>История платежей</CardTitle>
          <CardDescription>Ваши платежи за обучение</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="rounded-md border min-w-[600px]">
              <div className="grid grid-cols-12 p-4 text-sm font-medium bg-muted">
                <div className="col-span-4">Семестр</div>
                <div className="col-span-3">Сумма</div>
                <div className="col-span-3">Дата</div>
                <div className="col-span-2 text-right">Действия</div>
              </div>
              <div className="divide-y">
                {user.transactions.map((transaction) => {
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
        </CardContent>
      </Card>

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
