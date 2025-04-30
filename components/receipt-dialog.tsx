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
              margin: 0;
              color: #000;
            }
            .receipt {
              max-width: 800px;
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
              margin-bottom: 5px;
            }
            .subtitle {
              margin-bottom: 5px;
            }
            .content {
              margin-bottom: 20px;
            }
            .content p {
              margin-bottom: 15px;
              line-height: 1.5;
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
              width: 40%;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .date {
              position: absolute;
              top: 20px;
              left: 20px;
              font-size: 12px;
            }
            .page-number {
              position: absolute;
              bottom: 20px;
              right: 20px;
              font-size: 12px;
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
              margin: 0;
              color: #000;
            }
            .receipt {
              max-width: 800px;
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
              margin-bottom: 5px;
            }
            .subtitle {
              margin-bottom: 5px;
            }
            .content {
              margin-bottom: 20px;
            }
            .content p {
              margin-bottom: 15px;
              line-height: 1.5;
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
              width: 40%;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .date {
              position: absolute;
              top: 20px;
              left: 20px;
              font-size: 12px;
            }
            .page-number {
              position: absolute;
              bottom: 20px;
              right: 20px;
              font-size: 12px;
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

  // Форматируем ID транзакции для отображения в справке
  const formattedTransactionId = transaction.id.substring(0, 8)

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Справка об оплате</DialogTitle>
            <DialogDescription>Справка об оплате за {semester?.name || "семестр"}</DialogDescription>
          </DialogHeader>

          <div ref={receiptRef} className="receipt bg-white p-6 overflow-auto" style={{ position: "relative" }}>
            <div
                className="date text-xs text-muted-foreground"
                style={{ position: "absolute", top: "20px", left: "20px" }}
            >
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString().slice(0, 5)}
            </div>

            <div className="header text-center mb-6">
              <div className="title uppercase font-bold text-2xl mb-1">СПРАВКА ОБ ОПЛАТЕ</div>
              <div className="subtitle mb-1">№ {formattedTransactionId}</div>
              <div className="subtitle">от {formatDate(transaction.created_at)}</div>
            </div>

            <div className="content">
              <p className="mb-4 leading-relaxed">
                Настоящая справка подтверждает, что студент{" "}
                <strong>
                  {user.surname} {user.name} {user.patronymic}
                </strong>{" "}
                произвел оплату за обучение в размере <strong>{transaction.amount} ₽</strong> за{" "}
                <strong>{semester?.name || "семестр"}</strong>.
              </p>

              <div className="w-full overflow-hidden border border-gray-200 rounded-sm">
                <table className="w-full border-collapse">
                  <tbody>
                  <tr>
                    <th className="border border-gray-200 p-3 bg-gray-50 w-2/5 text-left">ФИО студента</th>
                    <td className="border border-gray-200 p-3">
                      {user.surname} {user.name} {user.patronymic}
                    </td>
                  </tr>
                  <tr>
                    <th className="border border-gray-200 p-3 bg-gray-50 w-2/5 text-left">Семестр</th>
                    <td className="border border-gray-200 p-3">{semester?.name || "Не указан"}</td>
                  </tr>
                  <tr>
                    <th className="border border-gray-200 p-3 bg-gray-50 w-2/5 text-left">Сумма оплаты</th>
                    <td className="border border-gray-200 p-3">{transaction.amount} ₽</td>
                  </tr>
                  <tr>
                    <th className="border border-gray-200 p-3 bg-gray-50 w-2/5 text-left">Дата оплаты</th>
                    <td className="border border-gray-200 p-3">{formatDate(transaction.created_at)}</td>
                  </tr>
                  <tr>
                    <th className="border border-gray-200 p-3 bg-gray-50 w-2/5 text-left">Номер транзакции</th>
                    <td className="border border-gray-200 p-3">{transaction.id}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="footer mt-8 flex justify-between">
              <div>
                <p>Подпись уполномоченного лица: _________________</p>
              </div>
              <div>
                <p>М.П.</p>
              </div>
            </div>

            <div
                className="page-number text-xs text-muted-foreground"
                style={{ position: "absolute", bottom: "20px", right: "20px" }}
            >
              1/1
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
