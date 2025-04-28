"use client"

import { useState, useEffect } from "react"
import type { UserResponse } from "@/lib/types"
import { StudentDashboard } from "@/components/dashboards/student-dashboard"
import { ObserverDashboard } from "@/components/dashboards/observer-dashboard"
import { AccountantDashboard } from "@/components/dashboards/accountant-dashboard"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import { DashboardHeader } from "@/components/dashboard-header"
import { getSemesters } from "@/lib/api/infra"

interface DashboardContentProps {
  user: UserResponse
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const semestersData = await getSemesters()
        setSemesters(semestersData)
      } catch (error) {
        console.error("Ошибка при загрузке семестров:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSemesters()
  }, [])

  const renderDashboard = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-[calc(100vh-64px)]">Загрузка...</div>
    }

    switch (user.role) {
      case "student":
        return <StudentDashboard user={user} semesters={semesters} />
      case "observer":
        return <ObserverDashboard user={user} semesters={semesters} />
      case "accountant":
        return <AccountantDashboard user={user} semesters={semesters} />
      case "admin":
        return <AdminDashboard user={user} semesters={semesters} />
      default:
        return <div>Неизвестная роль</div>
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader user={user} />
      <div className="flex-1 container mx-auto py-6 px-4">{renderDashboard()}</div>
    </div>
  )
}
