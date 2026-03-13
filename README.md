# Gestion-de-Redes
Sistema para administrar Sitios remotos

Este proyecto es una plataforma para la administración de sitios remotos, inventario de materiales y control de tareas técnicas.

## Instalación y Configuración

### 1. Base de Datos (SQL Server)
Para levantar la base de datos, sigue estos pasos:
* Localiza el archivo `Backend/GESTION_REDES.sql`.
* Ejecuta el script en tu gestor de SQL Server para crear la base de datos `GestionRedes` y todas sus tablas.
* El script ya incluye:
    * Estructura de tablas (Usuarios, Materiales, Tareas, SitiosRemotos, etc.).
    * Triggers para el historial de tareas y vistas para reportes.
    * Datos iniciales de categorías y sitios.

### 2. Configuración del Backend
* Ve a la carpeta `Backend`.
* Ejecuta `npm install` para instalar las dependencias necesarias.
* Configura tus credenciales de base de datos en el archivo `.env` (basado en `.env.example`).
* Inicia el servidor con: `node app.js`.

### 3. Acceso al Sistema
* Una vez el servidor esté corriendo, abre el archivo `Frontend/HTML/Login.html` en tu navegador.
* **Usuario de prueba:** `nubia@gmail.com`.
* **Contraseña:** `12345`.

## Estructura del Proyecto
* **Backend/**: Servidor Express, controladores, rutas y script de SQL.
* **Frontend/**: Interfaz de usuario con carpetas para HTML, CSS y JS.
