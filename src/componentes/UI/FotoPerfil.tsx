import { useEffect, useRef, useState } from "react";
import { Plus, User, X } from "lucide-react";
import { cn } from "../../lib/utils";

interface FotoPerfilProps {
    value: File | null;
    onChange: (file: File | null) => void;
    maxSizeMB?: number;
    // Foto que el usuario ya tiene guardada; se muestra mientras no elija una nueva.
    urlActual?: string | null;
    // Muestra "(opcional)" debajo (en el registro). En el panel se oculta.
    opcional?: boolean;
}

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

export function FotoPerfil({ value, onChange, maxSizeMB = 2, urlActual = null, opcional = true }: FotoPerfilProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [previewArchivo, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const preview = previewArchivo ?? urlActual;

    // Crea la vista previa cuando hay archivo y libera la memoria al cambiar o desmontar
    useEffect(() => {
        if (!value) {
            setPreview(null);
            return;
        }
        const url = URL.createObjectURL(value);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [value]);

    const abrirSelector = () => inputRef.current?.click();

    const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const archivo = e.target.files?.[0];
        e.target.value = ""; // permite volver a elegir el mismo archivo
        if (!archivo) return;

        if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
            setError("Usa una imagen JPG, PNG o WEBP.");
            return;
        }
        if (archivo.size > maxSizeMB * 1024 * 1024) {
            setError(`La imagen no puede pesar más de ${maxSizeMB} MB.`);
            return;
        }

        setError("");
        onChange(archivo);
    };

    const quitar = () => {
        setError("");
        onChange(null);
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative">
                <button
                    type="button"
                    onClick={abrirSelector}
                    aria-label={preview ? "Cambiar foto de perfil" : "Agregar foto de perfil"}
                    className={cn(
                        "flex h-24 w-24 items-center justify-center overflow-hidden rounded-full",
                        "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14848D] focus-visible:ring-offset-2",
                        preview
                            ? "border-2 border-[#14848D]"
                            : "border-2 border-dashed border-[#14848D]/40 bg-[#F2F9F9] text-[#14848D]/60 hover:border-[#14848D] hover:bg-[#14848D]/10"
                    )}
                >
                    {preview ? (
                        <img src={preview} alt="Vista previa de tu foto" className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-10 w-10" />
                    )}
                </button>

                {/* Botón + / quitar */}
                {value ? (
                    <button
                        type="button"
                        onClick={quitar}
                        aria-label="Quitar foto"
                        className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#B5246E] shadow-md ring-1 ring-slate-200 hover:bg-[#B5246E] hover:text-white transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={abrirSelector}
                        aria-label="Agregar foto de perfil"
                        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#14848D] text-white shadow-md ring-2 ring-white hover:bg-[#199ea9] transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept={TIPOS_PERMITIDOS.join(",")}
                    onChange={handleArchivo}
                    className="hidden"
                />
            </div>

            <p className="text-xs text-[#5E7F82] font-['Fredoka',sans-serif]">
                Foto de perfil {opcional && <span className="text-[#7C9496]">(opcional)</span>}
            </p>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}