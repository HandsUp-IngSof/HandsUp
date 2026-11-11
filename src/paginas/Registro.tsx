import React from "react";
import { useState } from "react";

export function Registro() {
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    return (
        <div>
            <h1>Crear Cuenta</h1>
            <p>Bienvenido a HandsUp</p>
        </div>
    );
}