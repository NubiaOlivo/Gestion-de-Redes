const API_BASE_URL = 'http://localhost:4000';

document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();
    const mensajeError = document.getElementById("mensajeError");
    mensajeError.textContent = ""; // Limpiar errores previos

    // Validar campos vacíos
    if (correo === "" || contrasena === "") {
        mensajeError.textContent = "Por favor completa todos los campos.";
        return;
    }

    try {
        // El backend espera { correo, contraseña } (con Ñ)
        const body = {
            correo: correo,
            contraseña: contrasena
        };

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
    // Guardar token para futuras peticiones
    localStorage.setItem('authToken', data.token);

    // Guarda el usuario completo
    localStorage.setItem('userData', JSON.stringify({
        idUsuario: data.user.idUsuario,
        nombre: data.user.nombre,
        apellido: data.user.apellido,
        correo: data.user.correo,
        idRol: data.user.idRol
    }));

    alert(`Bienvenido, ${data.user.nombre} ✅`);
    // Ir al dashboard
    window.location.href = "Dashboard.html";
    } else {}

    } catch (error) {
        console.error("Error de conexión:", error);
        mensajeError.textContent = "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
    }
});