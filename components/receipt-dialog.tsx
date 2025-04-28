"use client"

import { useRef } from "react"
import type { UserResponse, SemesterResponse, TransactionResponse } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Download, Printer } from "lucide-react"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: TransactionResponse
  user: UserResponse
  semester: SemesterResponse | null
}

export function ReceiptDialog({ open, onOpenChange, transaction, user, semester }: ReceiptDialogProps) {
  const receiptRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = receiptRef.current
    if (!content) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Справка об оплате</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ccc;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              margin-bottom: 20px;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
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

  const handleDownload = () => {
    const content = receiptRef.current
    if (!content) return

    const html = `
      <html>
        <head>
          <title>Справка об оплате</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              border: 1px solid #ccc;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              margin-bottom: 20px;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
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
    a.download = `Справка_об_оплате_${formatDate(transaction.created_at)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Справка об оплате</DialogTitle>
          <DialogDescription>Справка об оплате за {semester?.name || "семестр"}</DialogDescription>
        </DialogHeader>

        <div ref={receiptRef} className="receipt">
          <div className="header">
            <div className="title">СПРАВКА ОБ ОПЛАТЕ</div>
            <div>№ {transaction.id.substring(0, 8)}</div>
            <div>от {formatDate(transaction.created_at)}</div>
          </div>

          <div className="content">
            <p>
              Настоящая справка подтверждает, что студент{" "}
              <strong>
                {user.surname} {user.name} {user.patronymic}
              </strong>
              произвел оплату за обучение в размере <strong>{transaction.amount} ₽</strong>
              за <strong>{semester?.name || "семестр"}</strong>.
            </p>

            <table>
              <thead>
                <tr>
                  <th>Параметр</th>
                  <th>Значение</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ФИО студента</td>
                  <td>
                    {user.surname} {user.name} {user.patronymic}
                  </td>
                </tr>
                <tr>
                  <td>Семестр</td>
                  <td>{semester?.name || "Не указан"}</td>
                </tr>
                <tr>
                  <td>Сумма оплаты</td>
                  <td>{transaction.amount} ₽</td>
                </tr>
                <tr>
                  <td>Дата оплаты</td>
                  <td>{formatDate(transaction.created_at)}</td>
                </tr>
                <tr>
                  <td>Номер транзакции</td>
                  <td>{transaction.id}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="footer">
            <div>
              <p>Подпись уполномоченного лица: _________________</p>
            </div>
            <div>
              <p>М.П.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handlePrint} className="w-full sm:w-auto">
            <Printer className="mr-2 h-4 w-4" />
            Печать
          </Button>
          <Button onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Скачать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
