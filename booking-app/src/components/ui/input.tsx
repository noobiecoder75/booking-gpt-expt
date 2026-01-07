import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, ...props }, ref) => {
    // Handle NaN values for number inputs - convert to empty string
    const sanitizedValue = 
      type === "number" && typeof value === "number" && isNaN(value)
        ? ""
        : value;

    return (
      <input
        type={type}
        value={sanitizedValue}
        className={cn(
          "flex h-12 w-full rounded-xl border border-clio-gray-200 dark:border-clio-gray-800 bg-clio-gray-50 dark:bg-clio-gray-900 px-4 py-3 text-sm font-medium text-clio-gray-900 dark:text-gray-100 transition-smooth placeholder:text-clio-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clio-blue/20 focus-visible:border-clio-blue dark:focus-visible:border-clio-blue/50 hover:border-clio-gray-300 dark:hover:border-clio-gray-700 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };