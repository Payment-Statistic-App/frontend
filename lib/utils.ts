import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Форматирование даты
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

// Форматирование даты и времени
export function formatDateTime(dateString: string): string {
  // Преобразуем строку даты в объект Date
  const date = new Date(dateString)

  // Добавляем 3 часа для UTC+3
  const adjustedDate = new Date(date.getTime() + 3 * 60 * 60 * 1000)

  // Форматируем дату и время в локальном формате
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(adjustedDate)
}

// Форматирование номера телефона
export function formatPhoneNumber(value: string): string {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, "")

  // Если номер начинается с 7 или 8, оставляем только 8
  let formattedNumber = digits
  if (digits.startsWith("7") || digits.startsWith("8")) {
    formattedNumber = "8" + digits.substring(1)
  } else if (digits.length > 0 && !digits.startsWith("8")) {
    // Если номер не начинается с 8, добавляем 8 в начало
    formattedNumber = "8" + digits
  }

  // Форматируем номер в виде 8 (XXX) XXX-XX-XX
  if (formattedNumber.length > 0) {
    formattedNumber = formattedNumber.substring(0, 11) // Ограничиваем до 11 цифр

    // Форматируем номер
    if (formattedNumber.length > 1) {
      formattedNumber = "8" + formattedNumber.substring(1)
    }
    if (formattedNumber.length > 1) {
      formattedNumber = formattedNumber.substring(0, 1) + " " + formattedNumber.substring(1)
    }
    if (formattedNumber.length > 4) {
      formattedNumber =
        formattedNumber.substring(0, 2) + "(" + formattedNumber.substring(2, 5) + ")" + formattedNumber.substring(5)
    }
    if (formattedNumber.length > 9) {
      formattedNumber = formattedNumber.substring(0, 9) + "-" + formattedNumber.substring(9)
    }
    if (formattedNumber.length > 12) {
      formattedNumber = formattedNumber.substring(0, 12) + "-" + formattedNumber.substring(12)
    }
  }

  return formattedNumber
}

// Валидация номера телефона
export function isValidPhoneNumber(value: string): boolean {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, "")

  // Проверяем, что номер начинается с 8 и содержит 11 цифр
  return digits.startsWith("8") && digits.length === 11
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
