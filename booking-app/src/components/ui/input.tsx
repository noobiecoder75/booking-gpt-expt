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
          "flex h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100 transition-smooth placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 dark:focus-visible:border-blue-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-800/80 disabled:cursor-not-allowed disabled:opacity-50 shadow-soft",
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