-- ==========================================
-- BASE DE DATOS: GestionRedes
-- ==========================================
CREATE DATABASE GestionRedes;
GO
USE GestionRedes;
GO

-- ==========================================
-- TABLA: Roles
-- ==========================================
CREATE TABLE Roles (
    IdRol INT IDENTITY(1,1) PRIMARY KEY,
    Rol NVARCHAR(50) NOT NULL  --'Administrador' - 'Usuario'
);
GO

-- ==========================================
-- TABLA: Usuarios
-- ==========================================
CREATE TABLE Usuarios (								-- Almacena la información de los usuarios que acceden al sistema.
    IdUsuario INT IDENTITY(1,1) PRIMARY KEY,        -- Identificador unico
    Nombre NVARCHAR(100) NOT NULL,					-- Nombre del usuario
    Apellido_P NVARCHAR(100) NOT NULL,				-- Apellido Paterno del usuario
    Apellido_M NVARCHAR(100) NOT NULL,				-- Apellido Materno del usuario
    Correo NVARCHAR(150) UNIQUE NOT NULL,           -- Correo Unico (usado para login)
    Contraseña NVARCHAR(255) NOT NULL,              -- Contraseña (guardada encriptada)
    Telefono NVARCHAR(20) NULL,						-- Telefono celular del usuario
    FechaRegistro DATETIME DEFAULT GETDATE(),       -- Fecha automatica de creacion
    UltimoAcceso DATETIME NULL,
	IdRol INT FOREIGN KEY REFERENCES Roles(IdRol)   -- Relacion con tabla Roles
);
GO

-- ==========================================
-- TABLA: Materiales
-- ==========================================
CREATE TABLE Materiales (							-- Inventario de equipos, herramientas o consumibles.
    IdMaterial INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(255),
    Cantidad INT DEFAULT 0,
    FechaRegistro DATETIME DEFAULT GETDATE()
);
GO

-- ==========================================
-- TABLA: Tareas
-- ==========================================
CREATE TABLE Tareas (								-- Tareas asignadas a los técnicos o administradores.
    IdTarea INT IDENTITY(1,1) PRIMARY KEY,
    Descripcion NVARCHAR(255) NOT NULL,
    Estado NVARCHAR(50) DEFAULT 'Pendiente',
	CONSTRAINT CK_Tareas_Estado						-- Restricción de verificación para los 3 estados
	CHECK (Estado IN ('Pendiente', 'En Progreso', 'Completada')),	
    FechaCreacion DATETIME DEFAULT GETDATE(),
	IdUsuario INT NOT NULL,
    FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario)
);
GO

-- ==========================================
-- TABLA: Historial de Tareas
-- ==========================================
CREATE TABLE HistorialTareas (						-- Registra todos los cambios de estado de una tarea.
    IdHistorial INT IDENTITY(1,1) PRIMARY KEY,
    IdTarea INT NOT NULL,
    Descripcion NVARCHAR(255) NULL, 				-- Descripción de la tarea al momento del cambio 
	EstadoAnterior NVARCHAR(50) NULL,				-- Estado antes del cambio
    EstadoNuevo NVARCHAR(50) NOT NULL,				-- Estado después del cambio
    FechaCambioEstado DATETIME DEFAULT GETDATE(),		-- Fecha y hora del cambio de estado
    FOREIGN KEY (IdTarea) REFERENCES Tareas(IdTarea)
);
GO

-- ** TRIGGER AUTOMÁTICO **
-- Se activa automáticamente después de actualizar el estado de una tarea.
CREATE TRIGGER TR_Tareas_Historial_Auto
ON Tareas
AFTER UPDATE
AS
BEGIN
    IF UPDATE(Estado)	-- Solo si la columna 'Estado' fue modificada
    BEGIN
        INSERT INTO HistorialTareas ( 
            IdTarea,
            Descripcion, -- Se inserta NULL o un valor por defecto si lo tuviera (la descripción no está en inserted/deleted)
            EstadoAnterior,
            EstadoNuevo
        )
        SELECT
            i.IdTarea, 
            i.Descripcion, 	-- Descripción de la tarea del registro nuevo (inserted)
            d.Estado, -- d = deleted (valor anterior)
            i.Estado  -- i = inserted (valor nuevo)
        FROM
            inserted i 
        INNER JOIN
            deleted d ON i.IdTarea = d.IdTarea 
        WHERE
            i.Estado <> d.Estado; -- Solo si el estado realmente cambió
    END
END
GO

-- ==========================================
-- TABLA: Categorias
-- ==========================================
CREATE TABLE Categorias (						-- Define los tipos de sitios remotos.
    IdCategoria INT IDENTITY(1,1) PRIMARY KEY,
    NombreCategoria NVARCHAR(100) NOT NULL
);
GO

-- ==========================================
-- TABLA: Sitios Remotos
-- ==========================================
CREATE TABLE SitiosRemotos (						-- Almacena información detallada de cada ubicación de red remota.			
    IdSitio INT IDENTITY(1,1) PRIMARY KEY,
    Sitio NVARCHAR(255) NOT NULL, 					-- Nombre del sitio
    URLMaps NVARCHAR(255), 							-- URL de Google Maps para fácil navegación
    FechaVisita DATE, 								-- Fecha de la última visita técnica
    Activo NVARCHAR(10), 							-- Estado de la red: 'SI' o 'NO'
    EquipoInstalado NVARCHAR(100), 					-- Modelo del equipo principal
    AnchoBanda NVARCHAR(100), 						-- Detalles de velocidad 
    SSID_Pass NVARCHAR(150), 						-- Contraseña de la red (si aplica)
    Contacto NVARCHAR(100), 						-- Nombre de la persona de contacto en el sitio
    Telefono NVARCHAR(50), 							-- Teléfono del contacto
    IdCategoria INT NOT NULL,
    FOREIGN KEY (IdCategoria) REFERENCES Categorias(IdCategoria)
);
GO

-- ==========================================
-- DATOS INICIALES
-- ==========================================

-- ROLES
INSERT INTO Roles (Rol) 
VALUES ('Administrador'), ('Usuario');
GO

-- USUARIO INICIAL
INSERT INTO Usuarios (Nombre, Apellido_P, Apellido_M, Correo, Contraseña, Telefono, IdRol)
VALUES ('Nubia Marleen', 'Olivo', 'Ruiz',  'nubia@gmail.com', '12345', '6644063212', 1);
SELECT * FROM Usuarios

-- CATEGORÍAS
INSERT INTO Categorias (NombreCategoria) VALUES 
('Palacio Municipal '),
('Oficinas Remotas'),
('Instalaciones SSPC'),
('Delegaciones'),
('Paramunicipales'),
('Subdelegaciones'),
('Escuelas SEPM'),
('Casas de la Cultura'),
('Lugares Publicos'),
('Unidades Deportivas'),
('Bibliotecas'),
('Estaciones SITT'),
('Centros Comunitarios');
SELECT * FROM SitiosRemotos

-- SITIOS REMOTOS 
INSERT INTO SitiosRemotos (Sitio, URLMaps, FechaVisita, Activo, EquipoInstalado, AnchoBanda, SSID_Pass, Contacto, Telefono, IdCategoria)
VALUES
('Biblioteca Benito Juarez (Coordinación)', 'https://maps.app.goo.gl/SAqbsN1Sy8Z6oymT9', '2025-03-20', 'SI', 'Ubiquiti SWX-M222G', 'Dw: 195.68 Up: 197.10', 'Movilidad | MovTij@2025', 'Irlanda Hernandez', '6648045586', 11),
('Braulio Maldonado', '', '', '', '', '', '', '', '', 11),
('Dr. Gustavo Aubanel Vallejo', '', '', '', '', '', '', '', '', 11),
('Fernando Jordan', '', '', '', '', '', '', '', '', 11),
('Francisco Eusebio Kino', '', '', '', '', '', '', '', '', 11),
('Francisco Javier Clavijero', '', '', '', '', '', '', '', '', 11),
('Ignacio Zaragoza', '', '', '', '', '', '', '', '', 11),
('Jose Maria Morelos y Pavon', '', '', '', '', '', '', '', '', 11),
('Jose Vasconcelos', '', '', '', '', '', '', '', '', 11),
('Josefa Ortiz de Dominguez', '', '', '', '', '', '', '', '', 11),
('Josefina Rendon Parra', '', '', '', '', '', '', '', '', 11),
('Juan Maria de Salvatierra', '', '', '', '', '', '', '', '', 11),
('Juan Rulfo', '', '', '', '', '', '', '', '', 11),
('Luis Donaldo Colosio', '', '', '', '', '', '', '', '', 11),
('Manuel Clemente Rojo', '', '', '', '', '', '', '', '', 11),
('Maria Luisa Melo de Remes', '', '', '', '', '', '', '', '', 11),
('Nezahualcoyotl', '', '', '', '', '', '', '', '', 11),
('Otilio Montaño', '', '', '', '', '', '', '', '', 11),
('Ricardo Flores Magon', '', '', '', '', '', '', '', '', 11),
('Solidaridad', '', '', '', '', '', '', '', '', 11),
('Sor Juana Ines de la Cruz', '', '', '', '', '', '', '', '', 11),
('Casa de la Cultura Tijuana', '', '', '', '', '', '', '', '', 8),
('Cerro Colorado', '', '', '', '', '', '', '', '', 8),
('Museo de Historia de la Ciudad', '', '', '', '', '', '', '', '', 8),
('Pipila', '', '', '', '', '', '', '', '', 8),
('Playas de Tijuana', '', '', '', '', '', '', '', '', 8),
('San Antonio de Los Buenos', '', '', '', '', '', '', '', '', 8),
('10 de mayo (Otay Centenario)', '', '', '', '', '', '', '', '', 13),
('Aleman (Centro)', '', '', '', '', '', '', '', '', 13),
('Altiplano (Presa ALR)', '', '', '', '', '', '', '', '', 13),
('Angelitos (Playas de Tijuana)', '', '', '', '', '', '', '', '', 13),
('Buena Vista (Otay Centenario)', '', '', '', '', '', '', '', '', 13),
('Camino Verde (Sanchez Taboada)', '', '', '', '', '', '', '', '', 13),
('Club de La Alegria (Centro)', '', '', '', '', '', '', '', '', 13),
('Col. Independencia (Centro)', '', '', '', '', '', '', '', '', 13),
('Cumbres 2 (Playas de Tijuana)', '', '', '', '', '', '', '', '', 13),
('Guaycura (Cerro Colorado)', '', '', '', '', '', '', '', '', 13),
('Lagunitas (San Antonio de los Buenos)', '', '', '', '', '', '', '', '', 13),
('Libertad Calle 13 (Otay Centenario)', '', '', '', '', '', '', '', '', 13),
('Loma Dorada (Cerro Colorado)', '', '', '', '', '', '', '', '', 13),
('Lomas del Valle (Presa Este)', '', '', '', '', '', '', '', '', 13),
('Los Pinos (La Mesa)', '', '', '', '', '', '', '', '', 13),
('Nuevo Milenio (San Antonio de los Buenos)', '', '', '', '', '', '', '', '', 13),
('Parajes del Valle (Presa Este)', '', '', '', '', '', '', '', '', 13),
('Pedregal de Santa Julia (San Antonio de los Buenos)', '', '', '', '', '', '', '', '', 13),
('Plan de Iguala (La Mesa)', '', '', '', '', '', '', '', '', 13),
('Rancho Las Flores (Playas de Tijuana)', '', '', '', '', '', '', '', '', 13),
('Reforma II (Sanchez Taboada)', '', '', '', '', '', '', '', '', 13),
('Rincon Dorado (Cerro Colorado)', '', '', '', '', '', '', '', '', 13),
('Sanchez Taboada (Sanchez Taboada)', '', '', '', '', '', '', '', '', 13),
('Tijuana Progreso (Presa Este)', '', '', '', '', '', '', '', '', 13),
('Villa del Campo (Presa Este)', '', '', '', '', '', '', '', '', 13),
('Villa del Real (Presa ALR)', '', '', '', '', '', '', '', '', 13),
('Villas del Sol IV (Presa ALR)', '', '', '', '', '', '', '', '', 13),
('Villasana (La Mesa)', '', '', '', '', '', '', '', '', 13),
('Centro', '', '', '', '', '', '', '', '', 4),
('Cerro Colorado', '', '', '', '', '', '', '', '', 4),
('La Mesa', '', '', '', '', '', '', '', '', 4),
('La Presa ALR', '', '', '', '', '', '', '', '', 4),
('La Presa Este', '', '', '', '', '', '', '', '', 4),
('Otay Centenario', '', '', '', '', '', '', '', '', 4),
('Playas', '', '', '', '', '', '', '', '', 4),
('San Antonio de los Buenos', '', '', '', '', '', '', '', '', 4),
('Sánchez Taboada', '', '', '', '', '', '', '', '', 4),
('Preparatoria Municipal de Tijuana', '', '', '', '', '', '', '', '', 7),
('Primaria Carlos Villalbazo', '', '', '', '', '', '', '', '', 7),
('Primaria Club de Leones', '', '', '', '', '', '', '', '', 7),
('Primaria Club Soroptimista', '', '', '', '', '', '', '', '', 7),
('Primaria Emma A de Bustamante', '', '', '', '', '', '', '', '', 7),
('Primaria Manuel Quiroz Labastida', '', '', '', '', '', '', '', '', 7),
('Secundaria Adolfo Lopez Mateos', '', '', '', '', '', '', '', '', 7),
('Secundaria Xicotencatl Leyva Aleman', '', '', '', '', '', '', '', '', 7),
('Terminal Insurgentes', '', '', '', '', '', '', '', '', 12),
('Rio Alamar', '', '', '', '', '', '', '', '', 12),
('Central Camionera', '', '', '', '', '', '', '', '', 12),
('Guadalupe Victoria', '', '', '', '', '', '', '', '', 12),
('Alvaro Obregon', '', '', '', '', '', '', '', '', 12),
('Buena Vista', '', '', '', '', '', '', '', '', 12),
('Centinela', '', '', '', '', '', '', '', '', 12),
('Juan Ojeda Robles', '', '', '', '', '', '', '', '', 12),
('Hospital General', '', '', '', '', '', '', '', '', 12),
('CREA', '', '', '', '', '', '', '', '', 12),
('Palacio Municipal', '', '', '', '', '', '', '', '', 12),
('Simon Bolivar Norte', '', '', '', '', '', '', '', '', 12),
('Diana Cazadora', '', '', '', '', '', '', '', '', 12),
('Pueblo Amigo', '', '', '', '', '', '', '', '', 12),
('Garita Puerta Mexico', '', '', '', '', '', '', '', '', 12),
('Amistad', '', '', '', '', '', '', '', '', 12),
('Terminal Centro', '', '', '', '', '', '', '', '', 12),
('Calle Tercera', '', '', '', '', '', '', '', '', 12),
('Jai Alai', '', '', '', '', '', '', '', '', 12),
('Negrete', '', '', '', '', '', '', '', '', 12),
('Seminario', '', '', '', '', '', '', '', '', 12),
('Quintana Roo', '', '', '', '', '', '', '', '', 12),
('Telefonica', '', '', '', '', '', '', '', '', 12),
('Clinica 1', '', '', '', '', '', '', '', '', 12),
('Plaza Rio', '', '', '', '', '', '', '', '', 12),
('Cuauhtemoc', '', '', '', '', '', '', '', '', 12),
('Ignacio Zaragoza', '', '', '', '', '', '', '', '', 12),
('Minarete', '', '', '', '', '', '', '', '', 12),
('Ferrocarril', '', '', '', '', '', '', '', '', 12),
('20 de Noviembre', '', '', '', '', '', '', '', '', 12),
('Americas', '', '', '', '', '', '', '', '', 12),
('Unidad Deportiva Tijuana', '', '', '', '', '', '', '', '', 12),
('Ermita', '', '', '', '', '', '', '', '', 12),
('Cruz Roja', '', '', '', '', '', '', '', '', 12),
('Paseo de Guaycura', '', '', '', '', '', '', '', '', 12),
('Cienega', '', '', '', '', '', '', '', '', 12),
('Division del Norte', '', '', '', '', '', '', '', '', 12),
('Constitucion de 1917', '', '', '', '', '', '', '', '', 12),
('Arboledas', '', '', '', '', '', '', '', '', 12),
('Mexico Lindo', '', '', '', '', '', '', '', '', 12),
('Simon Bolivar Sur', '', '', '', '', '', '', '', '', 12),
('Templo', '', '', '', '', '', '', '', '', 12),
('Parque Morelos', '', '', '', '', '', '', '', '', 12),
('CEART', '', '', '', '', '', '', '', '', 12),
('Mazzanine', '', '', '', '', '', '', '', '', 12),
('Alamos', '', '', '', '', '', '', '', '', 12),
('C2 Centro de Control y Mando', '', '', '', '', '', '', '', '', 3),
('C4-Mexicali', '', '', '', '', '', '', '', '', 3),
('Comandancia Natura', '', '', '', '', '', '', '', '', 3),
('Ministerio Publico Central Camionera', '', '', '', '', '', '', '', '', 3),
('R1 Direccion Administrativa Centenario', '', '', '', '', '', '', '', '', 3),
('R3 Comandancia Regional Sur', '', '', '', '', '', '', '', '', 3),
('Sección Patrullas', '', '', '', '', '', '', '', '', 3),
('Talleres Patrullas Rosas Magallón', '', '', '', '', '', '', '', '', 3),
('Av. Revolucion y calle sexta', '', '', '', '', '', '', '', '', 9),
('Malecon Playas de Tijuana', '', '', '', '', '', '', '', '', 9),
('Parque de la Amistad', '', '', '', '', '', '', '', '', 9),
('Parque Las Californias', '', '', '', '', '', '', '', '', 9),
('Parque Morelos', '', '', '', '', '', '', '', '', 9),
('Parque Teniente Guerrero', '', '', '', '', '', '', '', '', 9),
('Plaza Santa Cecilia', '', '', '', '', '', '', '', '', 9),
('Almacén General Municipal', '', '', '', '', '', '', '', '', 2),
('Control Animal Municipal', '', '', '', '', '', '', '', '', 2),
('Control Sanitario', '', '', '', '', '', '', '', '', 2),
('Coordinacion de Delegaciones', '', '', '', '', '', '', '', '', 2),
('Cruce Fronterizo Pase Medico', '', '', '', '', '', '', '', '', 2),
('Dirección de Bomberos', '', '', '', '', '', '', '', '', 2),
('Direccion de Vialidad y Transporte', '', '', '', '', '', '', '', '', 2),
('Direccion Municipal de Salud', '', '', '', '', '', '', '', '', 2),
('Estancia Municipal de Infractores', '', '', '', '', '', '', '', '', 2),
('Oficina Semaforos Servicios Publicos', '', '', '', '', '', '', '', '', 2),
('Reloj (Arco Tijuana)', '', '', '', '', '', '', '', '', 2),
('Protección Civil', '', '', '', '', '', '', '', '', 2),
('Rezagos Municipales', '', '', '', '', '', '', '', '', 2),
('Talleres Municipales Via Rápida', '', '', '', '', '', '', '', '', 2),
('Palacio Municipal', '', '', '', '', '', '', '', '', 1),
('Sindicatura', '', '', '', '', '', '', '', '', 1),
('COTUCO - Comite de Turismo y Convenciones de Tijuana', '', '', '', '', '', '', '', '', 5),
('DESOM - Desarrollo Social Municipal', '', '', '', '', '', '', '', '', 5),
('IMAC - Instituto Municipal de Arte y Cultura', '', '', '', '', '', '', '', '', 5),
('IMCAD - Instituto Municipal Contra las Adicciones', '', '', '', '', '', '', '', '', 5),
('IMDET - Instituto Municipal del Deporte de Tijuana', '', '', '', '', '', '', '', '', 5),
('IMJUV - Instituto Municipal de la Juventud', '', '', '', '', '', '', '', '', 5),
('IMMUJER - Instituto Municipal de la Mujer', '', '', '', '', '', '', '', '', 5),
('IMPAC - Instituto Municipal de Participacion Ciudadana de Tijuana', '', '', '', '', '', '', '', '', 5),
('IMPLAN - Instituto Metropolitano de Planeacion de Tijuana', '', '', '', '', '', '', '', '', 5),
('PROMUN - Fideicomiso Promotora Municipal de Tijuana', '', '', '', '', '', '', '', '', 5),
('SDIF - Sistema para el Desarrollo Integral de la Familia', '', '', '', '', '', '', '', '', 5),
('SIMPATT - Sistema Municipal de Parques Tematicos de Tijuana', '', '', '', '', '', '', '', '', 5),
('SITT - Sistema Integral de Transporte de Tijuana', '', '', '', '', '', '', '', '', 5),
('Camino Verde', '', '', '', '', '', '', '', '', 6),
('El Tecolote', '', '', '', '', '', '', '', '', 6),
('Florido Mariano', '', '', '', '', '', '', '', '', 6),
('Insurgentes', '', '', '', '', '', '', '', '', 6),
('La Gloria', '', '', '', '', '', '', '', '', 6),
('La Villa', '', '', '', '', '', '', '', '', 6),
('Lomas del Porvenir', '', '', '', '', '', '', '', '', 6),
('Los Pinos', '', '', '', '', '', '', '', '', 6),
('Mesa de Otay', '', '', '', '', '', '', '', '', 6),
('Miguel Aleman', '', '', '', '', '', '', '', '', 6),
('Salvatierra', '', '', '', '', '', '', '', '', 6),
('Sánchez Taboada', '', '', '', '', '', '', '', '', 6),
('Auditorio Municipal "Fausto Gutierrez Moreno"', '', '', '', '', '', '', '', '', 10),
('Benito Juárez', '', '', '', '', '', '', '', '', 10),
('CREA', '', '', '', '', '', '', '', '', 10),
('Del Bosque', '', '', '', '', '', '', '', '', 10),
('El Dorado', '', '', '', '', '', '', '', '', 10),
('El Mirador', '', '', '', '', '', '', '', '', 10),
('El Rubí', '', '', '', '', '', '', '', '', 10),
('Gimnasio Ernesto "Pajarito" Ruiz"', '', '', '', '', '', '', '', '', 10),
('Gimnasio Independencia Nacional', '', '', '', '', '', '', '', '', 10),
('Gran Tenochtitlán', '', '', '', '', '', '', '', '', 10),
('Jorge Fitch', '', '', '', '', '', '', '', '', 10),
('La Morita', '', '', '', '', '', '', '', '', 10),
('Las Californias', '', '', '', '', '', '', '', '', 10),
('Las Cascadas', '', '', '', '', '', '', '', '', 10),
('Las Huertas', '', '', '', '', '', '', '', '', 10),
('Mariano Matamoros', '', '', '', '', '', '', '', '', 10),
('Nueva Tijuana', '', '', '', '', '', '', '', '', 10),
('Parque Azteca', '', '', '', '', '', '', '', '', 10),
('Planetario', '', '', '', '', '', '', '', '', 10),
('Reforma', '', '', '', '', '', '', '', '', 10),
('Salvatierra', '', '', '', '', '', '', '', '', 10),
('Sánchez Taboada', '', '', '', '', '', '', '', '', 10),
('Tijuana', '', '', '', '', '', '', '', '', 10),
('Torres del Mariano', '', '', '', '', '', '', '', '', 10);

-- ==========================================
-- VISTA: Sitios Remotos y Categorias
-- ==========================================
-- Combina la información de los sitios remotos con el nombre de su categoría.
CREATE VIEW dbo.vw_SitiosRemotosConCategoria
AS
SELECT 
    s.IdSitio,
    s.Sitio,
    s.URLMaps,
    s.FechaVisita,
    s.Activo,
    s.EquipoInstalado,
    s.AnchoBanda,
    s.SSID_Pass,
    s.Contacto,
    s.Telefono,
    s.IdCategoria,
    c.NombreCategoria
FROM dbo.SitiosRemotos AS s
INNER JOIN dbo.Categorias   AS c
    ON s.IdCategoria = c.IdCategoria;
GO

SELECT * FROM vw_SitiosRemotosConCategoria;

-- ==========================================
-- TABLA: Catalogo de Dispositivos en tabla Materiales
-- ==========================================
CREATE TABLE CatalogoDispositivos (
    IdDispositivo INT IDENTITY(1,1) PRIMARY KEY,
    NombreDispositivo NVARCHAR(100) NOT NULL UNIQUE,
    Activo BIT DEFAULT 1,
    FechaRegistro DATETIME DEFAULT GETDATE()
);

-- MODIFICAR TABLA MATERIAL
ALTER TABLE Materiales ADD
    IdDispositivo INT,
    Marca NVARCHAR(100),
    Modelo NVARCHAR(100),
    NumeroSerie NVARCHAR(100),
    NumeroInventario NVARCHAR(100);

ALTER TABLE Materiales
ADD CONSTRAINT FK_Materiales_Dispositivo
FOREIGN KEY (IdDispositivo)
REFERENCES CatalogoDispositivos(IdDispositivo);

ALTER TABLE Materiales
ADD RutaImagen NVARCHAR(255) NULL;

-- DISPOSITIVOS BASE EN CATALOGO 
INSERT INTO CatalogoDispositivos (NombreDispositivo)
SELECT v.Nombre
FROM (VALUES
 ('Switch'),
 ('Router'),
 ('DVR / NVR'),
 ('Access Point'),
 ('Baterias UPS'),
 ('Server'),
 ('Monitor')
) v(Nombre)
WHERE NOT EXISTS (
    SELECT 1
    FROM CatalogoDispositivos c
    WHERE c.NombreDispositivo = v.Nombre
);

SELECT * FROM CatalogoDispositivos ORDER BY NombreDispositivo;

SELECT*FROM Usuarios
SELECT * FROM Tareas
SELECT * FROM Materiales
SELECT * FROM HistorialTareas
SELECT * FROM SitiosRemotos

-- Inventario de MAATERIALES para cada sitio 
-- Agregue un nuevo IdSitio en la tabla Materiales, para enlazarlo con la tabla de SitiosRemotos
ALTER TABLE Materiales
ADD IdSitio INT NOT NULL;

ALTER TABLE Materiales
ADD CONSTRAINT FK_Materiales_Sitios
FOREIGN KEY (IdSitio)
REFERENCES SitiosRemotos(IdSitio);

-- Consulta
SELECT m.*, c.NombreCategoria
FROM Materiales m
JOIN SitiosRemotos s ON m.IdSitio = s.IdSitio
JOIN Categorias c ON s.IdCategoria = c.IdCategoria;

SELECT * FROM Materiales
WHERE (@IdSitio IS NULL OR IdSitio = @IdSitio)

-- Vista de materiales de sitios remotos 
SELECT 
    m.IdMaterial,
    m.Nombre,
    m.Marca,
    m.Modelo,
    m.NumeroSerie,
    m.NumeroInventario,
    m.IdSitio,
    s.Sitio AS NombreSitio
FROM Materiales m
INNER JOIN SitiosRemotos s ON s.IdSitio = m.IdSitio
ORDER BY m.IdMaterial DESC;

-- Agregar IdSitio a Usuarios, Para saber “desde qué dependencia/sitio entró”, el usuario debe estar ligado a un sitio.
ALTER TABLE Usuarios
ADD IdSitio INT NULL;

ALTER TABLE Usuarios
ADD CONSTRAINT FK_Usuarios_Sitios
FOREIGN KEY (IdSitio) REFERENCES SitiosRemotos(IdSitio);
 
 -- Nueva tabla Historial de accesos (LOGIN / LOGOUT)
 /*  Aquí se guarda: Quién entró, Desde qué sitio, A qué hora.
 Esto se inserta en el authController, no con trigger.*/
CREATE TABLE HistorialAccesos (
    IdAcceso INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NOT NULL,
    IdSitio INT NOT NULL,
    FechaHora DATETIME DEFAULT GETDATE(),
    Accion NVARCHAR(20), -- LOGIN / LOGOUT
    CONSTRAINT FK_HA_Usuarios FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario),
    CONSTRAINT FK_HA_Sitios FOREIGN KEY (IdSitio) REFERENCES SitiosRemotos(IdSitio));

-- Nueva tabla: ¿Qué modificó esta persona?
CREATE TABLE AuditoriaUsuarios (
    IdAuditoria INT IDENTITY(1,1) PRIMARY KEY,
    IdUsuario INT NOT NULL,
    IdSitio INT NOT NULL,
    Modulo NVARCHAR(50),   -- Materiales, Tareas, Usuarios, Sitios
    Accion NVARCHAR(20),   -- INSERT, UPDATE, DELETE
    Descripcion NVARCHAR(255),
    FechaHora DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_AU_Usuarios FOREIGN KEY (IdUsuario) REFERENCES Usuarios(IdUsuario),
    CONSTRAINT FK_AU_Sitios FOREIGN KEY (IdSitio) REFERENCES SitiosRemotos(IdSitio));

-- Consulta (historial completo para admin)
-- Resultado ejemplo: Nubia Olivo | Palacio Municipal | Materiales | UPDATE | Editó material ID 5 | 11:03
SELECT 
    u.Nombre,
    u.Apellido_P,
    s.Sitio,
    a.Modulo,
    a.Accion,
    a.Descripcion,
    a.FechaHora
FROM AuditoriaUsuarios a
JOIN Usuarios u ON a.IdUsuario = u.IdUsuario
JOIN SitiosRemotos s ON a.IdSitio = s.IdSitio
ORDER BY a.FechaHora DESC;


SELECT TOP 5 IdUsuario, IdSitio FROM Usuarios;
SELECT * FROM SitiosRemotos;
SELECT Nombre, IdSitio FROM Usuarios;
