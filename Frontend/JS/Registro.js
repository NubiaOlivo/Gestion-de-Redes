const API_BASE_URL = 'http://localhost:4000';

document.addEventListener("DOMContentLoaded", async () => {

    console.log('registro.js cargado');

    // CARGAR SITIOS EN EL SELECT
    try {
        const response = await fetch(`${API_BASE_URL}/api/sitios`);
        const sitios = await response.json();

        const select = document.getElementById("IdSitio");

        sitios.forEach(sitio => {
            const option = document.createElement("option");
            option.value = sitio.IdSitio;
            option.textContent = sitio.Sitio;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando sitios:", error);
    }

    // REGISTRO DE USUARIO
    const form = document.getElementById("registroForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nombres = document.getElementById("nombres").value.trim();
        const apellidos = document.getElementById("apellidos").value.trim();
        const correo = document.getElementById("correo").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const IdSitio = document.getElementById("IdSitio").value;
        const contrasena = document.getElementById("contrasena").value.trim();
        const confirmar = document.getElementById("confirmar").value.trim();
        const mensajeError = document.getElementById("mensajeError");

        mensajeError.textContent = "";

        if (!nombres || !apellidos || !correo || !contrasena || !confirmar) {
            mensajeError.textContent = "Todos los campos son obligatorios.";
            return;
        }
        if (!IdSitio) {
            mensajeError.textContent = "Debes seleccionar un sitio o dependencia.";
            return;
        }
        if (contrasena !== confirmar) {
            mensajeError.textContent = "Las contraseñas no coinciden.";
            return;
        }
        if (contrasena.length < 6) {
            mensajeError.textContent = "La contraseña debe tener al menos 6 caracteres.";
            return;
        }

        const partesApellidos = apellidos.split(' ');
        const apellidoP = partesApellidos[0] || 'N/A';
        const apellidoM = partesApellidos.slice(1).join(' ') || 'N/A';

        const userData = {
            Nombre: nombres,
            Apellido_P: apellidoP,
            Apellido_M: apellidoM,
            Correo: correo,
            Contraseña: contrasena,
            Telefono: telefono,
            IdRol: 2,
            IdSitio: parseInt(IdSitio)
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.ok) {
                alert("Usuario registrado con éxito. Ahora inicia sesión.");
                window.location.href = "login.html";
            } else {
                mensajeError.textContent = data.message || "Error al registrar usuario.";
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            mensajeError.textContent = "No se pudo conectar con el servidor.";
        }
    });
});