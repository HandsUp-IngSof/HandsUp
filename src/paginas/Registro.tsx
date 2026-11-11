import React from "react";
import { useState } from "react";
import { RoleSelector } from "@/componentes/UI/RoleSelector"; 
import { Button } from "@/componentes/UI/Boton";
import { Input } from "@/componentes/UI/Input";
import { Mail } from "lucide-react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";


interface CampoProps {
    id: string;
    label: string;
    hint?: string;
    icono?: React.ReactNode;
    children: React.ReactNode;
}


function Campo({ id, label, hint, icono, children }: CampoProps) {
    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm text-[#12383C] font-['Fredoka',sans-serif]">
                {label}
            </label>
            <div className="relative">
                {children}
                {icono && (
                    <span className="absolute inset-y-0 right-4 flex items-center text-[#2F5F63]">
                        {icono}
                    </span>
                )}
            </div>
            {hint && <p className="text-xs text-[#5E7F82]">{hint}</p>}
        </div>
    );
}

export function Registro() {
    const [rol, setRol] = useState<"estudiante" | "docente">("estudiante");
    const [nombreCompleto, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmarPassword, setConfirmarPassword] = useState("");
    const [verPassword, setVerPassword] = useState(false);
    const [verConfirmar, setVerConfirmar] = useState(false);

    const passwordValida = /^(?=.[A-Za-z])(?=.\d).{8,}$/.test(password);
    const noCoinciden = confirmarPassword.length > 0 && confirmarPassword !== password;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordValida || noCoinciden) return;
        // TODO: llamar a tu API
        console.log({ rol, nombreCompleto, email, password });
    };

    const ojo = (visible: boolean, set: (v: boolean) => void) => (
        <button
            type="button"
            onClick={() => set(!visible)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="hover:text-[#14848D]"
        >
            {visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
    );

    return (
        <main className="min-h-screen bg-white flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md flex flex-col items-center">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-6">
                    <img src="/logo-handsup.png" alt="" className="h-10 w-10 rounded-xl" />
                    <span className="text-3xl font-bold font-['Fredoka',sans-serif] text-[#14848D]">
                        hands<span className="text-[#B5246E]">Up</span>
                    </span>
                </div>

                {/* Encabezado */}
                <p className="text-xs font-bold uppercase tracking-wide text-[#B5246E] font-['Fredoka',sans-serif]">
                    Tu primer paso para conectar
                </p>
                <h1 className="mt-2 text-4xl font-bold text-[#12383C] font-['Fredoka',sans-serif]">
                    Crea tu cuenta
                </h1>
                <p className="mt-3 text-base text-[#5E7F82] text-center">
                    Empieza a aprender, compartir y conectar en LSC.
                </p>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="mt-8 w-full flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-[#12383C] font-['Fredoka',sans-serif]">
                            Quiero ser parte como
                        </span>
                        <RoleSelector value={rol} onChange={setRol} />
                    </div>

                    <Campo id="nombre" label="Nombre completo">
                        <Input
                            id="nombre"
                            placeholder="¿Cómo te llamas?"
                            value={nombreCompleto}
                            onChange={(e) => setNombre(e.target.value)}
                            autoComplete="name"
                        />
                    </Campo>

                    <Campo id="email" label="Correo electrónico" icono={<Mail size={18} />}> 
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            className="pr-12"
                        />
                    </Campo>

                    <Campo
                        id="password"
                        label="Contraseña"
                        hint="Mínimo 8 caracteres, una letra y un número."
                        icono={ojo(verPassword, setVerPassword)}
                    >
                        <Input
                            id="password"
                            type={verPassword ? "text" : "password"}
                            placeholder="Crea una contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            error={password.length > 0 && !passwordValida}
                            className="pr-12"
                        />
                    </Campo>

                    <Campo
                        id="confirmar"
                        label="Confirmar contraseña"
                        hint={noCoinciden ? "Las contraseñas no coinciden." : undefined}
                        icono={ojo(verConfirmar, setVerConfirmar)}
                    >
                        <Input
                            id="confirmar"
                            type={verConfirmar ? "text" : "password"}
                            placeholder="Repite tu contraseña"
                            value={confirmarPassword}
                            onChange={(e) => setConfirmarPassword(e.target.value)}
                            autoComplete="new-password"
                            error={noCoinciden}
                            className="pr-12"
                        />
                    </Campo>

                    {/* size default trae w-full sm:w-auto; lo sobrescribimos para que ocupe todo el ancho */}
                    <Button type="submit" className="mt-2 sm:w-full">
                        <ArrowRight />
                        Crear mi cuenta
                    </Button>
                </form>

                <p className="mt-6 text-sm text-[#5E7F82]">
                    ¿Ya tienes una cuenta?{" "}
                    <a href="/login" className="font-bold text-[#14848D]">
                        Inicia sesión
                    </a>
                </p>
                <p className="mt-5 text-xs text-[#7C9496]">
                    © 2026 handsUp · Aprender nos conecta.
                </p>
            </div>
        </main>
    );
}