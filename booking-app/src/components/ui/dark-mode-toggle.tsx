"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { ModernButton } from "./modern-button"

const DarkModeToggle = () => {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <ModernButton
      variant="ghost"
      size="sm"
      onClick={toggleDarkMode}
      aria-label="Toggle dark mode"
      className="w-10 h-10 p-0 rounded-xl bg-clio-gray-50 dark:bg-clio-gray-900 border border-clio-gray-100 dark:border-clio-gray-800 text-clio-gray-500 hover:text-clio-blue dark:hover:text-white"
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </ModernButton>
  )
}

export { DarkModeToggle }