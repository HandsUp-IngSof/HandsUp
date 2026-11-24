import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Cargando } from "@/componentes/UI/Cargando";

// Carga diferida: cada pantalla se descarga solo cuando el usuario la abre,
// asi la primera carga de la aplicacion es mas liviana.
const Login = lazy(() => import("@/paginas/auth/Login").then((m) => ({ default: m.Login })));
const Registro = lazy(() => import("@/paginas/auth/Registro").then((m) => ({ default: m.Registro })));
const PanelEstudiante = lazy(() =>
    import("@/paginas/estudiante/Panel_estudiante").then((m) => ({ default: m.PanelEstudiante })),
);
const PanelDocente = lazy(() =>
    import("@/paginas/docente/Panel_docente").then((m) => ({ default: m.PanelDocente })),
);
const RutaProtegida = lazy(() =>
    import("@/componentes/RutaProtegida").then((m) => ({ default: m.RutaProtegida })),
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
                    />
                    <Route
                        path="/docente"
                        element={
                            <RutaProtegida rol="profesor">
                                <PanelDocente />
                            </RutaProtegida>
                        }
                    />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

export default App;
