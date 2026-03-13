const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');

// ====================================================
// OBTENER TODAS LAS TAREAS
// GET /api/tareas
// ====================================================
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                t.IdTarea,
                t.Descripcion,
                t.Estado,
                t.FechaCreacion,
                t.IdUsuario,
                u.Nombre + ' ' + u.Apellido_P AS UsuarioNombre
            FROM Tareas t
            LEFT JOIN Usuarios u ON t.IdUsuario = u.IdUsuario
            ORDER BY t.FechaCreacion DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener tareas:', err);
        res.status(500).json({ message: 'Error al obtener tareas' });
    }
});

// ====================================================
// OBTENER SOLO TAREAS PENDIENTES / EN PROGRESO
// GET /api/tareas/pendientes
// ====================================================
router.get('/pendientes', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        t.IdTarea,
        t.Descripcion,
        t.Estado,
        t.FechaCreacion,
        t.IdUsuario,
        u.Nombre + ' ' + u.Apellido_P AS UsuarioNombre
      FROM Tareas t
      LEFT JOIN Usuarios u ON t.IdUsuario = u.IdUsuario
      WHERE t.Estado IN ('Pendiente', 'En Progreso')
      ORDER BY t.FechaCreacion DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener tareas pendientes:', err);
    res.status(500).json({ message: 'Error al obtener tareas pendientes' });
  }
});

// ====================================================
// OBTENER HISTORIAL DE TAREAS
// GET /api/tareas/historial
// ====================================================
router.get('/historial', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT
                h.IdHistorial,
                h.IdTarea,
                h.Descripcion,
                h.EstadoAnterior,
                h.EstadoNuevo,
                h.FechaCambioEstado
            FROM HistorialTareas h
            ORDER BY h.FechaCambioEstado DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error al obtener historial:', err);
        res.status(500).json({ message: 'Error al obtener historial' });
    }
});

// ====================================================
// OBTENER UNA TAREA POR ID
// GET /api/tareas/:id
// ====================================================
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('IdTarea', sql.Int, id)
            .query('SELECT * FROM Tareas WHERE IdTarea = @IdTarea');

        if (result.recordset.length === 0)
            return res.status(404).json({ message: 'Tarea no encontrada' });

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error' });
    }
});

// ====================================================
// CREAR UNA TAREA
// POST /api/tareas
// ====================================================
router.post('/', async (req, res) => {
    const { Descripcion, IdUsuario } = req.body;

    if (!Descripcion || !IdUsuario)
        return res.status(400).json({ message: 'Faltan datos obligatorios' });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Descripcion', sql.NVarChar(255), Descripcion)
            .input('IdUsuario', sql.Int, IdUsuario)
            .query(`
                INSERT INTO Tareas (Descripcion, IdUsuario)
                OUTPUT INSERTED.*
                VALUES (@Descripcion, @IdUsuario)
            `);

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error('Error al crear tarea:', err);
        res.status(500).json({ message: 'Error al crear tarea' });
    }
});

// ====================================================
// ACTUALIZAR TAREA
// PUT /api/tareas/:id
// ====================================================
router.put('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { Descripcion, IdUsuario, Estado } = req.body;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdTarea', sql.Int, id)
            .input('Descripcion', sql.NVarChar(255), Descripcion)
            .input('IdUsuario', sql.Int, IdUsuario)
            .input('Estado', sql.NVarChar(50), Estado)
            .query(`
                UPDATE Tareas
                SET Descripcion=@Descripcion,
                    IdUsuario=@IdUsuario,
                    Estado=@Estado
                WHERE IdTarea=@IdTarea
            `);

        res.json({ message: 'Tarea actualizada' });
    } catch (err) {
        console.error('Error al actualizar tarea:', err);
        res.status(500).json({ message: 'Error al actualizar tarea' });
    }
});

// ====================================================
// ACTUALIZAR SOLO ESTADO (USA EL TRIGGER)
// PUT /api/tareas/:id/estado
// ====================================================
router.put('/:id/estado', async (req, res) => {
    const id = parseInt(req.params.id);
    const { Estado } = req.body;

    if (!['Pendiente', 'En Progreso', 'Completada'].includes(Estado))
        return res.status(400).json({ message: 'Estado inválido' });

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdTarea', sql.Int, id)
            .input('Estado', sql.NVarChar(50), Estado)
            .query('UPDATE Tareas SET Estado=@Estado WHERE IdTarea=@IdTarea');

        res.json({ message: 'Estado actualizado' });
    } catch (err) {
        console.error('Error al cambiar estado:', err);
        res.status(500).json({ message: 'Error al cambiar estado' });
    }
});

// ====================================================
// ELIMINAR TAREA
// DELETE /api/tareas/:id
// ====================================================
router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdTarea', sql.Int, id)
            .query('DELETE FROM Tareas WHERE IdTarea=@IdTarea');

        res.json({ message: 'Tarea eliminada' });
    } catch (err) {
        console.error('Error al eliminar tarea:', err);
        res.status(500).json({ message: 'Error al eliminar tarea' });
    }
});

module.exports = router;