import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Cargando } from "@/componentes/UI/Cargando";

// Carga diferida: cada pantalla se descarga solo cuando el usuario la abre,
// asi la primera carga de la aplicacion es mas liviana.
const Login = lazy(() => import("@/paginas/auth/Login").then((m) => ({ default: m.Login })));
const Registro = lazy(() => import("@/paginas/auth/Registro").then((m) => ({ default: m.Registro })));

// Panel estudiante (SCRUM-58): misma idea que el del docente.
const PanelEstudiante = lazy(() =>
    import("@/paginas/estudiante/Panel_estudiante").then((m) => ({ default: m.PanelEstudiante })),
);
const InicioEstudiante = lazy(() =>
    import("@/paginas/estudiante/InicioEstudiante").then((m) => ({ default: m.InicioEstudiante })),
);
const DiccionarioEstudiante = lazy(() =>
    import("@/paginas/estudiante/PaginasEstudiante").then((m) => ({ default: m.DiccionarioEstudiante })),
);
const ClasesEstudiante = lazy(() =>
    import("@/paginas/estudiante/ClasesEstudiante").then((m) => ({ default: m.ClasesEstudiante })),
);
const ProgresoEstudiante = lazy(() =>
    import("@/paginas/estudiante/ProgresoEstudiante").then((m) => ({ default: m.ProgresoEstudiante })),
);
const ContactoDocentePagina = lazy(() =>
    import("@/paginas/estudiante/ContactoDocente").then((m) => ({ default: m.ContactoDocentePagina })),
);
const MensajesEstudiante = lazy(() =>
    import("@/paginas/estudiante/PaginasEstudiante").then((m) => ({ default: m.MensajesEstudiante })),
);
const ModuloEstudiante = lazy(() =>
    import("@/paginas/estudiante/ModuloEstudiante").then((m) => ({ default: m.ModuloEstudiante })),
);
const PerfilEstudiante = lazy(() =>
    import("@/paginas/estudiante/PerfilEstudiante").then((m) => ({ default: m.PerfilEstudiante })),
);
const RutaProtegida = lazy(() =>
    import("@/componentes/RutaProtegida").then((m) => ({ default: m.RutaProtegida })),
);

// Panel docente: la plantilla (menu y encabezado) queda fija y solo cambia el contenido.
const PanelDocente = lazy(() =>
    import("@/paginas/docente/Panel_docente").then((m) => ({ default: m.PanelDocente })),
);
const InicioDocente = lazy(() =>
    import("@/paginas/docente/InicioDocente").then((m) => ({ default: m.InicioDocente })),
);
const CalendarioDocente = lazy(() =>
    import("@/paginas/docente/CalendarioDocente").then((m) => ({ default: m.CalendarioDocente })),
);
const EstudiantesDocente = lazy(() =>
    import("@/paginas/docente/EstudiantesDocente").then((m) => ({ default: m.EstudiantesDocente })),
);
const MensajesDocente = lazy(() =>
    import("@/paginas/docente/MensajesDocente").then((m) => ({ default: m.MensajesDocente })),
);
const ModulosDocente = lazy(() =>
    import("@/paginas/docente/ModulosDocente").then((m) => ({ default: m.ModulosDocente })),
);
const PerfilDocente = lazy(() =>
    import("@/paginas/docente/PerfilDocente").then((m) => ({ default: m.PerfilDocente })),
);

export function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<Cargando />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/registro" element={<Registro />} />
                    <Route
                        path="/estudiante"
                        element={
                            <RutaProtegida rol="estudiante">
                                <PanelEstudiante />
                            </RutaProtegida>
                        }
                    >
                        <Route index element={<InicioEstudiante />} />
                        <Route path="modulo/:moduloId" element={<ModuloEstudiante />} />
                        <Route path="progreso" element={<ProgresoEstudiante />} />
                        <Route path="docente" element={<ContactoDocentePagina />} />
                        <Route path="diccionario" element={<DiccionarioEstudiante />} />
                        <Route path="clases" element={<ClasesEstudiante />} />
                        <Route path="mensajes" element={<MensajesEstudiante />} />
                        <Route path="perfil" element={<PerfilEstudiante />} />
                        <Route path="*" element={<Navigate to="/estudiante" replace />} />
                    </Route>
                    <Route
                        path="/docente"
                        element={
                            <RutaProtegida rol="profesor">
                                <PanelDocente />
                            </RutaProtegida>
                        }
                    >
                        <Route index element={<InicioDocente />} />
                        <Route path="calendario" element={<CalendarioDocente />} />
                        <Route path="modulos" element={<ModulosDocente />} />
                        <Route path="estudiantes" element={<EstudiantesDocente />} />
                        <Route path="mensajes" element={<MensajesDocente />} />
                        <Route path="perfil" element={<PerfilDocente />} />
                        <Route path="*" element={<Navigate to="/docente" replace />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
