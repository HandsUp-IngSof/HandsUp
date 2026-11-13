import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn([
                        "flex h-11 w-full rounded-xl border border-[#14848D]/20",
                        "bg-[#F2F9F9] hover:bg-[#F2F9F9] active:bg-[#F2F9F9]",
                        "px-4 py-2 text-base font-['Fredoka',sans-serif] font-medium",
                        "outline-none transition-all duration-300 ease-out",
                        "text-slate-700 dark:text-slate-300",
                        "placeholder:text-purple-300/80 dark:placeholder:text-purple-300/40",
                        "border-[#C4B5FD] hover:border-[#A78BFA]",
                        "focus:border-[#A78BFA] focus:bg-[#F2F9F9]",
                        "focus:shadow-[0_0_20px_rgba(167,139,250,0.55)]",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-[#FCA5A5] hover:border-[#F87171] focus:border-[#F87171] focus:shadow-[0_0_20px_rgba(248,113,113,0.55)]",
            className, 
            ])}
        ref={ref}
        {...props}
        />
        );
    }
);
Input.displayName = "Input";

export { Input };