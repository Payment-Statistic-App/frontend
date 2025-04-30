import * as XLSX from "xlsx"

// Функция для создания и скачивания Excel файла в браузере
export function downloadExcel(data: any[], fileName: string, sheetName = "Sheet1") {
  // Создаем новую книгу Excel
  const workbook = XLSX.utils.book_new()

  // Преобразуем данные в формат для Excel
  const worksheet = XLSX.utils.json_to_sheet(data)

  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Создаем бинарные данные в формате xlsx
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })

  // Создаем Blob из бинарных данных
  const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

  // Создаем URL для Blob
  const url = URL.createObjectURL(blob)

  // Создаем ссылку для скачивания
  const a = document.createElement("a")
  a.href = url
  a.download = `${fileName}.xlsx`

  // Добавляем ссылку в DOM, кликаем по ней и удаляем
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  // Освобождаем URL
  URL.revokeObjectURL(url)
}

// Функция для форматирования данных студентов для отчета
export function formatStudentsForExcel(students: any[], semesters: any[]) {
  return students.map((student) => {
    // Базовая информация о студенте
    const studentData: any = {
      ФИО: `${student.surname} ${student.name} ${student.patronymic}`,
      Телефон: student.phone,
      Группа: student.group_name || "Не назначена",
    }

    // Добавляем информацию по каждому семестру
    semesters.forEach((semester) => {
      const transaction = student.transactions.find((t: any) => t.semester_id === semester.id)
      studentData[`${semester.name}`] = transaction ? `Оплачено (${transaction.amount} ₽)` : "Не оплачено"
    })

    // Добавляем общую сумму оплат
    studentData["Всего оплачено"] = `${student.transactions.reduce((sum: number, t: any) => sum + t.amount, 0)} ₽`

    return studentData
  })
}

// Функция для форматирования данных одного студента для отчета
export function formatStudentForExcel(student: any, semesters: any[]) {
  const transactions = student.transactions || []

  // Формируем данные о платежах
  const paymentsData = transactions.map((transaction: any) => {
    const semester = semesters.find((s) => s.id === transaction.semester_id)
    return {
      Семестр: semester ? semester.name : transaction.semester_id,
      Сумма: `${transaction.amount} ₽`,
      "Дата оплаты": new Date(transaction.created_at).toLocaleDateString(),
      "ID транзакции": transaction.id,
    }
  })

  // Если нет транзакций, добавляем пустую строку
  if (paymentsData.length === 0) {
    paymentsData.push({
      Семестр: "-",
      Сумма: "-",
      "Дата оплаты": "-",
      "ID транзакции": "-",
    })
  }

  return paymentsData
}

// Функция для создания статистики по семестрам
export function formatSemesterStatsForExcel(students: any[], semesters: any[]) {
  const totalStudents = students.length

  return semesters.map((semester) => {
    const paidCount = students.filter((student) =>
      student.transactions.some((t: any) => t.semester_id === semester.id),
    ).length

    const totalAmount = students.reduce(
      (sum, student) =>
        sum +
        student.transactions
          .filter((t: any) => t.semester_id === semester.id)
          .reduce((s: number, t: any) => s + t.amount, 0),
      0,
    )

    return {
      Семестр: semester.name,
      Оплатили: `${paidCount} студентов`,
      "Не оплатили": `${totalStudents - paidCount} студентов`,
      "Процент оплаты": `${totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0}%`,
      "Общая сумма": `${totalAmount} ₽`,
    }
  })
}
