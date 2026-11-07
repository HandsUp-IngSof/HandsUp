import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(

    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-['Fredoka',sans-serif] font-bold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: { 
                glow: "bg-[#14848D] text-white border-2 border-[#14848D] hover:bg-[#199ea9] hover:border-[#38d6e3] hover:-translate-y-0.5 hover:shadow-[0_0_10px_#14848D,0_0_25px_#14848D,0_0_45px_rgba(20,132,141,0.7)] active:translate-y-0 active:shadow-[0_0_15px_#14848D]",
                default: "bg-[#14848D] text-white hover:bg-[#14848D]/90",
                outline: "border-2 border-[#14848D] text-[#14848D] bg-transparent hover:bg-[#14848D]/10 hover:shadow-[0_0_15px_rgba(20,132,141,0.3)]",
                ghost: "text-[#14848D] hover:bg-[#14848D]/10",
            },
            size: {
                default: "h-11 px-6 py-2.5 text-base w-full sm:w-auto sm:min-w-[180px]",
                sm: "h-9 rounded-lg px-4 text-sm",
                lg: "h-14 rounded-2xl px-8 text-lg w-full sm:w-auto sm:min-w-[220px]",
                icon: "h-11 w-11",
            },
        }, 
            defaultVariants: {
            variant: "glow",
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