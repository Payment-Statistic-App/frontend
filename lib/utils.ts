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

// Форматирование номера телефона - улучшенная версия
export function formatPhoneNumber(value: string): string {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, "")

  // Если пустая строка, возвращаем пустую строку
  if (!digits) return ""

  // Ограничиваем до 11 цифр
  const limitedDigits = digits.substring(0, 11)

  // Если номер начинается с 7 или 8, заменяем на 8
  let formattedNumber = limitedDigits
  if (formattedNumber.startsWith("7") || formattedNumber.startsWith("8")) {
    formattedNumber = "8" + formattedNumber.substring(1)
  } else if (formattedNumber.length > 0) {
    // Если номер не начинается с 8, добавляем 8 в начало
    formattedNumber = "8" + formattedNumber
  }

  // Ограничиваем до 11 цифр снова после возможного добавления 8
  formattedNumber = formattedNumber.substring(0, 11)

  // Форматируем номер в виде 8 (XXX) XXX-XX-XX
  if (formattedNumber.length <= 1) {
    return formattedNumber
  } else if (formattedNumber.length <= 4) {
    return `${formattedNumber.substring(0, 1)} (${formattedNumber.substring(1)}`
  } else if (formattedNumber.length <= 7) {
    return `${formattedNumber.substring(0, 1)} (${formattedNumber.substring(1, 4)}) ${formattedNumber.substring(4)}`
  } else if (formattedNumber.length <= 9) {
    return `${formattedNumber.substring(0, 1)} (${formattedNumber.substring(1, 4)}) ${formattedNumber.substring(4, 7)}-${formattedNumber.substring(7)}`
  } else {
    return `${formattedNumber.substring(0, 1)} (${formattedNumber.substring(1, 4)}) ${formattedNumber.substring(4, 7)}-${formattedNumber.substring(7, 9)}-${formattedNumber.substring(9, 11)}`
  }
}

// Валидация номера телефона - улучшенная версия
export function isValidPhoneNumber(value: string): boolean {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, "")

  // Проверяем, что номер содержит 11 цифр и начинается с 8
  return digits.length === 11 && (digits.startsWith("8") || digits.startsWith("7"))
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
