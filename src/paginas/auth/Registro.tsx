import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { RoleSelector } from "@/componentes/UI/RoleSelector";
import { Button } from "@/componentes/UI/Boton";
import { Input } from "@/componentes/UI/Input";
import { registrarUsuario, separarNombre, type RolPantalla } from "@/lib/auth";
import isotipo from "@/recursos/isotipo.webp";

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
    const navigate = useNavigate();
    const [rol, setRol] = useState<RolPantalla>("estudiante");
    const [nombreCompleto, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmarPassword, setConfirmarPassword] = useState("");
    const [verPassword, setVerPassword] = useState(false);
    const [verConfirmar, setVerConfirmar] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);

    const passwordValida = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password);
    const noCoinciden = confirmarPassword.length > 0 && confirmarPassword !== password;

    // Revisa el formulario antes de enviarlo a Supabase. Devuelve el mensaje de error o null.
    const validar = (): string | null => {
        const { apellido } = separarNombre(nombreCompleto);
        if (!nombreCompleto.trim()) return "Escribe tu nombre completo.";
        if (!apellido) return "Escribe tu nombre y tu apellido.";
        if (!email.trim()) return "Escribe tu correo electrónico.";
        if (!passwordValida) return "La contraseña debe tener mínimo 8 caracteres, con letras y números.";
        if (confirmarPassword !== password) return "Las contraseñas no coinciden.";
        return null;
    };

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const mensajeValidacion = validar();
        if (mensajeValidacion) {
            setError(mensajeValidacion);
            return;
        }

        setCargando(true);
        try {
            const resultado = await registrarUsuario({ nombreCompleto, email, password, rol });

            if (resultado === "sesion_iniciada") {
                // La cuenta quedo lista y con sesion: va directo a su panel.
                navigate(rol === "docente" ? "/docente" : "/estudiante", { replace: true });
            } else {
                // Supabase envio un correo de confirmacion: vuelve al login con el aviso.
                navigate("/login", {
                    replace: true,
                    state: {
                        aviso: `Te enviamos un correo a ${email.trim()}. Confírmalo para poder iniciar sesión.`,
                        email: email.trim(),
                    },
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
        } finally {
            setCargando(false);
        }
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
                    <img src={isotipo} alt="" className="h-10 w-10 rounded-xl" />
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

                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* size default trae w-full sm:w-auto; lo sobrescribimos para que ocupe todo el ancho */}
                    <Button type="submit" disabled={cargando} className="mt-2 sm:w-full">
                        <ArrowRight />
                        {cargando ? "Creando tu cuenta..." : "Crear mi cuenta"}
                    </Button>
                </form>

                <p className="mt-6 text-sm text-[#5E7F82]">
                    ¿Ya tienes una cuenta?{" "}
                    <Link to="/login" className="font-bold text-[#14848D]">
                        Inicia sesión
                    </Link>
                </p>
                <p className="mt-5 text-xs text-[#7C9496]">
                    © 2026 handsUp · Aprender nos conecta.
                </p>
            </div>
        </main>
    );
}