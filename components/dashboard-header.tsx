"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { UserResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Menu, User, X } from "lucide-react"

interface DashboardHeaderProps {
  user: UserResponse
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/")
    router.refresh()
  }

  // Изменим функцию getRoleName
  const getRoleName = (role: string) => {
    switch (role) {
      case "student":
        return "Студент"
      case "observer":
        return "Директор"
      case "accountant":
        return "Бухгалтер"
      case "admin":
        return "Администратор"
      default:
        return role
    }
  }

  return (
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-primary">
                Система учета оплаты
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user.surname} {user.name} {user.patronymic} | {getRoleName(user.role)}
            </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Меню пользователя</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Выйти</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
            <div className="md:hidden border-t p-4">
              <div className="flex flex-col space-y-3">
                <div className="text-sm font-medium">
                  {user.surname} {user.name} {user.patronymic}
                </div>
                <div className="text-sm text-muted-foreground">{getRoleName(user.role)}</div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="w-full justify-start">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </Button>
              </div>
            </div>
        )}
      </header>
  )
}
