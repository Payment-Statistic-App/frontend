"use client"

import { useState } from "react"
import type { UserResponse, SemesterResponse } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTransaction } from "@/lib/api/operations"
import { useToast } from "@/hooks/use-toast"
import { Loader2, CreditCard, Calendar, Lock } from "lucide-react"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserResponse
  semester: SemesterResponse
}

export function PaymentDialog({ open, onOpenChange, user, semester }: PaymentDialogProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  })
  const { toast } = useToast()

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Имитация задержки платежа
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Создание транзакции
      await createTransaction({
        semester_id: semester.id,
        amount: 75000, // Фиксированная сумма для примера
      })

      toast({
        title: "Оплата успешна",
        description: `Вы успешно оплатили ${semester.name}`,
      })

      // Закрываем диалог и перезагружаем страницу
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error("Ошибка при оплате:", error)
      toast({
        title: "Ошибка оплаты",
        description: "Не удалось выполнить платеж. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateCardDetails = () => {
    if (cardDetails.number.replace(/\s/g, "").length !== 16) {
      toast({
        title: "Ошибка валидации",
        description: "Номер карты должен содержать 16 цифр",
        variant: "destructive",
      })
      return false
    }

    if (!cardDetails.name) {
      toast({
        title: "Ошибка валидации",
        description: "Введите имя владельца карты",
        variant: "destructive",
      })
      return false
    }

    if (!cardDetails.expiry.match(/^\d{2}\/\d{2}$/)) {
      toast({
        title: "Ошибка валидации",
        description: "Срок действия должен быть в формате MM/YY",
        variant: "destructive",
      })
      return false
    }

    if (cardDetails.cvc.length !== 3) {
      toast({
        title: "Ошибка валидации",
        description: "CVC код должен содержать 3 цифры",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleNext = () => {
    if (step === 1) {
      if (validateCardDetails()) {
        setStep(2)
      }
    } else if (step === 2) {
      handlePayment()
    }
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(" ")
    } else {
      return value
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Оплата семестра</DialogTitle>
          <DialogDescription>{semester.name} - 75 000 ₽</DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number" className="flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Номер карты
              </Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                maxLength={19}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-name">Имя владельца</Label>
              <Input
                id="card-name"
                placeholder="IVAN IVANOV"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="card-expiry" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Срок действия
                </Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => {
                    let value = e.target.value
                    // Автоматически добавляем слеш после ввода двух цифр месяца
                    if (value.length === 2 && !value.includes("/")) {
                      value += "/"
                    }
                    setCardDetails({ ...cardDetails, expiry: value })
                  }}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cvc" className="flex items-center">
                  <Lock className="h-4 w-4 mr-2" />
                  CVC
                </Label>
                <Input
                  id="card-cvc"
                  type="password"
                  placeholder="123"
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/\D/g, "") })}
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6">
            <div className="rounded-lg bg-muted p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Семестр:</span>
                <span className="font-medium">{semester.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Студент:</span>
                <span className="font-medium">
                  {user.surname} {user.name} {user.patronymic}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Номер карты:</span>
                <span className="font-medium">**** **** **** {cardDetails.number.slice(-4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сумма:</span>
                <span className="font-medium">75 000 ₽</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 ? (
            <Button onClick={handleNext}>Продолжить</Button>
          ) : (
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                "Подтвердить оплату"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
