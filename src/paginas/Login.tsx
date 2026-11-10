import React, { useState } from "react";
import { Mail, Eye, EyeOff, ArrowRight, ShieldCheck, HelpCircle, CheckCircle2 } from "lucide-react";

import { Button } from "../componentes/UI/Boton";
import { Input } from "../componentes/UI/Input";
import { RoleSelector } from "../componentes/UI/RoleSelector";

import isotipo from "../recursos/isotipo.png";

export function Login() {
  const [role, setRole] = useState<"estudiante" | "docente">("estudiante");
  const [email, setEmail] = useState("valentina.gomez@correo.com");
  const [password, setPassword] = useState("............");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ role, email, password, rememberMe });
    alert(`Iniciando sesión como ${role}...`);
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-['Fredoka',sans-serif]">
      
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA: Fondo Menta/Teal MÁS INTENSO           */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#C5E5E4] p-12 flex-col justify-between relative overflow-hidden">
        
        {/* Contenedor Superior Agrupado (Elimina el espacio gigante) */}
        <div className="space-y-6 max-w-lg">
          
          {/* Isotipo + Marca */}
          <div className="flex items-center gap-3">
            <img 
              src={isotipo} 
              alt="handsUp Isotipo" 
              className="h-10 w-auto object-contain" 
            />
            <span className="text-2xl font-bold text-[#14848D] tracking-tight">
              handsUp
            </span>
          </div>

          <p className="text-sm text-slate-700 font-medium">
            Un espacio para aprender, expresarte y encontrarnos.
          </p>

          {/* Badges / Viñetas */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#14848D]/30 text-xs text-[#14848D] font-medium shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>A tu ritmo</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#14848D]/30 text-xs text-[#14848D] font-medium shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Docentes de LSC</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 border border-[#14848D]/30 text-xs text-[#14848D] font-medium shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Desde Colombia</span>
            </div>
          </div>

          {/* Tarjeta Informativa (Ubicada inmediatamente debajo) */}
          <div className="bg-white/85 backdrop-blur-md border border-[#14848D]/20 rounded-3xl p-7 shadow-sm mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-[#D81B60]" />
              <span className="text-xs font-bold text-[#D81B60] tracking-wider uppercase">
                Una nueva forma de conectar
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800 leading-tight mb-3">
              Tus manos tienen mucho que decir.
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Aprende Lengua de Señas Colombiana a tu ritmo, con personas que te acompañan de verdad.
            </p>
          </div>

        </div>

        {/* Pie de página inferior */}
        <div className="text-xs text-slate-500 font-medium">
          © 2026 handsUp - Aprender nos conecta.
        </div>
      </div>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA: Formulario                               */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-16 overflow-y-auto">
        
        <div className="flex justify-end">
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#14848D] transition-colors">
            <HelpCircle className="w-4 h-4" />
            <span>¿Necesitas ayuda?</span>
          </button>
        </div>

        <div className="max-w-md w-full mx-auto my-auto py-8">
          
          <div className="mb-6">
            <span className="text-xs font-bold text-[#D81B60] tracking-wider uppercase">
              QUÉ BUENO TENERTE AQUÍ
            </span>
            <h1 className="text-3xl font-bold text-slate-800 mt-1">
              Inicia sesión
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Tu próxima conversación empieza aquí.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">
                Quiero ingresar como
              </label>
              <RoleSelector value={role} onChange={setRole} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Correo electrónico
              </label>
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.nombre@correo.com"
                  className="pr-10"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#14848D] focus:ring-[#14848D] accent-[#14848D] cursor-pointer"
                />
                <span className="text-xs text-slate-500">Recordarme</span>
              </label>

              <a
                href="#forgot"
                className="text-xs font-bold text-[#14848D] hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button type="submit" variant="glow" size="lg" className="w-full mt-4 flex items-center justify-center gap-2">
              <ArrowRight className="w-5 h-5" />
              <span>Ingresar como {role}</span>
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            ¿Es tu primera vez?{" "}
            <a href="#register" className="font-bold text-[#14848D] hover:underline">
              Crea tu cuenta
            </a>
          </p>

          <div className="mt-8 flex items-center gap-3 bg-[#C5E5E4]/40 border border-[#14848D]/20 rounded-xl p-3.5">
            <ShieldCheck className="w-5 h-5 text-[#14848D] shrink-0" />
            <p className="text-xs text-slate-600 leading-snug">
              Tus datos están seguros. Tú eliges cómo aprender y con quién conectar.
            </p>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 space-y-1">
          <p>Al ingresar aceptas los Términos de uso y la Política de privacidad.</p>
          <p>© 2026 handsUp - Aprender nos conecta.</p>
        </div>
      </div>

    </div>
    );
}