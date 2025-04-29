"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const [inputPage, setInputPage] = useState<string>(currentPage.toString())

    // Обновляем значение в поле ввода при изменении currentPage
    useEffect(() => {
        setInputPage(currentPage.toString())
    }, [currentPage])

    const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputPage(e.target.value)
    }

    const handlePageInputSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const pageNumber = Number.parseInt(inputPage)
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            onPageChange(pageNumber)
        } else {
            setInputPage(currentPage.toString())
        }
    }

    if (totalPages <= 1) return null

    return (
        <div className="flex items-center justify-center space-x-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-2">
                <Input
                    className="w-16 h-8 text-center"
                    value={inputPage}
                    onChange={handlePageInputChange}
                    onBlur={() => setInputPage(currentPage.toString())}
                />
                <span className="text-sm">из {totalPages}</span>
            </form>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
            >
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
