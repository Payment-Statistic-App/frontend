"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { loginUser } from "@/lib/api/users"

const loginSchema = z.object({
  login: z.string().min(1, "Логин обязателен"),
  password: z.string().min(1, "Парол�� обязателен"),
  role: z.enum(["student", "observer", "accountant", "admin"]),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
      role: "student",
    },
  })

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true)

    try {
      const response = await loginUser(data)

      // Сохраняем токен в куки
      document.cookie = `token=${response.access_token}; path=/; max-age=86400; SameSite=Lax`

      toast({
        title: "Успешный вход",
        description: "Вы успешно вошли в систему",
        variant: "default",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast({
        title: "Ошибка входа",
        description: "Неверный логин, пароль или роль",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Вход в систему</CardTitle>
          <CardDescription className="text-center">
            Введите свои данные для входа в систему учета оплаты обучения
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input id="login" placeholder="Введите логин" {...form.register("login")} disabled={isLoading} />
              {form.formState.errors.login && (
                  <p className="text-sm text-red-500">{form.formState.errors.login.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  {...form.register("password")}
                  disabled={isLoading}
              />
              {form.formState.errors.password && (
                  <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <RadioGroup
                  defaultValue="student"
                  className="grid grid-cols-2 gap-4"
                  onValueChange={(value) => form.setValue("role", value as "student" | "observer" | "accountant" | "admin")}
              >
                <div>
                  <RadioGroupItem value="student" id="student" className="peer sr-only" />
                  <Label
                      htmlFor="student"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Студент
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="observer" id="observer" className="peer sr-only" />
                  <Label
                      htmlFor="observer"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Наблюдатель
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="accountant" id="accountant" className="peer sr-only" />
                  <Label
                      htmlFor="accountant"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Бухгалтер
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="admin" id="admin" className="peer sr-only" />
                  <Label
                      htmlFor="admin"
                      className="flex cursor-pointer flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Администратор
                  </Label>
                </div>
              </RadioGroup>
              {form.formState.errors.role && <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
              ) : (
                  "Войти"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
  )
}
