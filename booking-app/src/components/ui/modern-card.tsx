import * as React from "react"
import { cn } from "@/lib/utils"

const ModernCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "elevated" | "outline" | "ghost"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 shadow-sm",
    elevated: "bg-white dark:bg-clio-gray-900 border border-clio-gray-200 dark:border-clio-gray-800 shadow-md",
    outline: "border border-clio-gray-300 dark:border-clio-gray-700 bg-transparent hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800/50",
    ghost: "bg-clio-gray-50 dark:bg-clio-gray-800/50 border-0 hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl p-6 transition-all duration-200",
        variants[variant],
        className
      )}
      {...props}
    />
  )
})
ModernCard.displayName = "ModernCard"

const ModernCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-2 mb-4", className)} {...props} />
))
ModernCardHeader.displayName = "ModernCardHeader"

const ModernCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-bold text-clio-gray-900 dark:text-gray-100 leading-tight uppercase tracking-tight",
      className
    )}
    {...props}
  />
))
ModernCardTitle.displayName = "ModernCardTitle"

const ModernCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-clio-gray-600 dark:text-clio-gray-300 font-medium", className)} {...props} />
))
ModernCardContent.displayName = "ModernCardContent"

export { ModernCard, ModernCardHeader, ModernCardTitle, ModernCardContent }