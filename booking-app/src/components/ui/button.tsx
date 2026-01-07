import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-clio-blue text-white hover:bg-clio-blue-hover shadow-sm border-0",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        outline:
          "border border-clio-gray-200 dark:border-clio-gray-700 bg-white dark:bg-clio-gray-900 hover:bg-clio-gray-50 dark:hover:bg-clio-gray-800 hover:border-clio-gray-300 dark:hover:border-clio-gray-600 text-clio-gray-700 dark:text-clio-gray-300 shadow-sm",
        secondary:
          "bg-clio-navy dark:bg-clio-blue text-white hover:bg-clio-navy/90 dark:hover:bg-clio-blue/90 shadow-sm",
        ghost: "hover:bg-clio-gray-100 dark:hover:bg-clio-gray-800 hover:text-clio-gray-900 dark:hover:text-white text-clio-gray-700 dark:text-clio-gray-300",
        link: "text-clio-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };