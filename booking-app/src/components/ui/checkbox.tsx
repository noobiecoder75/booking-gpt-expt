"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded-md border border-clio-gray-300 dark:border-clio-gray-700 bg-white dark:bg-clio-gray-950 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clio-blue/20 focus-visible:border-clio-blue disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-clio-blue data-[state=checked]:border-clio-blue data-[state=checked]:text-white transition-all",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3 w-3" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
