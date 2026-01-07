import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-clio-blue focus:ring-offset-2 shadow-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-clio-blue text-white hover:bg-clio-blue/90",
        secondary:
          "border-transparent bg-clio-gray-100 dark:bg-clio-gray-800 text-clio-gray-600 dark:text-clio-gray-400 hover:bg-clio-gray-200 dark:hover:bg-clio-gray-700",
        destructive:
          "border-transparent bg-red-600 dark:bg-red-900/30 text-white dark:text-red-400 hover:bg-red-700 dark:hover:bg-red-900/50",
        outline: "text-clio-gray-900 dark:text-white border-clio-gray-200 dark:border-clio-gray-800 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }