const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../db');
// dotenv se carga en app.js

// ------------------------------------------
// LOGIN: POST /api/auth/login
// ------------------------------------------
router.post('/login', async (req, res) => {
    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
        return res.status(400).json({ message: 'Correo y contraseña requeridos' });
    }
    try {
        const pool = await poolPromise;

        // Buscar usuario por correo
        const result = await pool.request()
            .input('correo', sql.NVarChar(150), correo)
            .query(`
                SELECT IdUsuario, Nombre, Apellido_P, Correo, Contraseña, IdRol
                FROM Usuarios
                WHERE Correo = @correo
            `);

        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas (Usuario no encontrado)' });
        }

        // Comparar contraseña hasheada
        const match = await bcrypt.compare(contraseña, user.Contraseña);

        // Solo funcionarán los usuarios registrados desde /register
        if (!match) {
            return res.status(401).json({ message: 'Credenciales inválidas (Contraseña incorrecta)' });
        }
        // Actualizar UltimoAcceso
        await pool.request()
            .input('IdUsuario', sql.Int, user.IdUsuario)
            .query('UPDATE Usuarios SET UltimoAcceso = GETDATE() WHERE IdUsuario = @IdUsuario');
        // Generar token
        const token = jwt.sign(
            { idUsuario: user.IdUsuario, correo: user.Correo, idRol: user.IdRol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: {
                idUsuario: user.IdUsuario,
                nombre: user.Nombre,
                apellido: user.Apellido_P,
                correo: user.Correo,
                idRol: user.IdRol
            }
        });
    } catch (err) {
        console.error('Error en el login:', err);
        res.status(500).json({ message: 'Error en servidor' });
    }
});

// ------------------------------------------
// REGISTER: POST /api/auth/register
// ------------------------------------------
router.post('/register', async (req, res) => {
    const {
        Nombre,
        Apellido_P,
        Apellido_M,
        Correo,
        Contraseña,
        Telefono,
        IdSitio,
        IdRol
    } = req.body;

    if (!Nombre || !Apellido_P || !Apellido_M || !Correo || !Contraseña || !IdRol) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    try {
        const pool = await poolPromise;

        // Correo ya existe
        const existe = await pool.request()
            .input('Correo', sql.NVarChar(150), Correo)
            .query('SELECT IdUsuario FROM Usuarios WHERE Correo = @Correo');

        if (existe.recordset.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Encriptar contraseña
        const hashed = await bcrypt.hash(Contraseña, 10);

        // Insertar nuevo usuario
        await pool.request()
            .input('Nombre', sql.NVarChar(100), Nombre)
            .input('Apellido_P', sql.NVarChar(100), Apellido_P)
            .input('Apellido_M', sql.NVarChar(100), Apellido_M)
            .input('Correo', sql.NVarChar(150), Correo)
            .input('Contraseña', sql.NVarChar(255), hashed)
            .input('Telefono', sql.NVarChar(20), Telefono || null)
            .input('IdRol', sql.Int, IdRol)
            .query(`
                INSERT INTO Usuarios
                    (Nombre, Apellido_P, Apellido_M, Correo, Contraseña, Telefono, IdRol, FechaRegistro)
                VALUES
                    (@Nombre, @Apellido_P, @Apellido_M, @Correo, @Contraseña, @Telefono, @IdRol, GETDATE())
            `);

        res.status(201).json({ message: 'Usuario registrado con éxito.' });
    } catch (err) {
        console.error('Error en el registro:', err);

        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        res.status(500).json({ message: 'Error en servidor al intentar registrar.' });
    }
});
module.exports = router;