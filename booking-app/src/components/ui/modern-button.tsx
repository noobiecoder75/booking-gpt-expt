import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
}

const ModernButton = React.forwardRef<HTMLButtonElement, ModernButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    const variants = {
      primary: "bg-clio-blue text-white hover:bg-clio-blue/90 shadow-md shadow-clio-blue/20 border border-transparent",
      secondary: "bg-clio-navy dark:bg-clio-blue text-white hover:opacity-90 shadow-sm border border-transparent",
      outline: "border-2 border-clio-gray-200 dark:border-clio-gray-800 text-clio-gray-900 dark:text-white hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800 bg-transparent",
      ghost: "text-clio-gray-600 dark:text-clio-gray-400 hover:text-clio-gray-900 dark:hover:text-white hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 bg-transparent",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20 border border-transparent"
    }

    const sizes = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base"
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-black uppercase tracking-widest transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-clio-blue/20 focus:ring-offset-2 dark:focus:ring-offset-clio-gray-950 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
ModernButton.displayName = "ModernButton"

export { ModernButton }