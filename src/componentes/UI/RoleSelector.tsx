import { GraduationCap, Presentation, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleSelectorProps {
    value: "estudiante" | "docente";
    onChange: (role: "estudiante" | "docente") => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
    return (
    <div className="grid grid-cols-2 gap-4 w-full">
        {/* Opción Estudiante */}
        <button
        type="button"
        onClick={() => onChange("estudiante")}
        className={cn(
            "flex items-center justify-center gap-2 h-14 rounded-xl border-2 font-['Fredoka',sans-serif] font-medium transition-all duration-200",
            value === "estudiante"
            ? "border-[#14848D] bg-[#14848D]/10 text-[#14848D]"
            : "border-slate-200 text-slate-600 hover:border-slate-300"
        )}
    >
        <GraduationCap className="w-5 h-5" />
        <span>Estudiante</span>
        {value === "estudiante" && <CheckCircle2 className="w-4 h-4 text-[#14848D] ml-1" />}
    </button>

      {/* Opción Docente */}
        <button
        type="button"
        onClick={() => onChange("docente")}
        className={cn(
            "flex items-center justify-center gap-2 h-14 rounded-xl border-2 font-['Fredoka',sans-serif] font-medium transition-all duration-200",
            value === "docente"
            ? "border-[#14848D] bg-[#14848D]/10 text-[#14848D]"
            : "border-slate-200 text-slate-600 hover:border-slate-300"
        )}
        >
        <Presentation className="w-5 h-5" />
        <span>Docente</span>
        {value === "docente" && <CheckCircle2 className="w-4 h-4 text-[#14848D] ml-1" />}
        </button>
    </div>
    );
}