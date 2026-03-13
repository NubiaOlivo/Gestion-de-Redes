const { poolPromise, sql } = require('../db');

// GET ALL tareas
exports.getTareas = async (req, res) => {
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
        console.error(err);
        res.status(500).json({ message: 'Error al obtener tareas' });
    }
};

// GET single
exports.getTarea = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const pool = await poolPromise;
        const result = await pool.request()
            .input('IdTarea', sql.Int, id)
            .query(`SELECT * FROM Tareas WHERE IdTarea=@IdTarea`);

        if (!result.recordset[0])
            return res.status(404).json({ message: 'Tarea no encontrada' });

        res.json(result.recordset[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error en servidor' });
    }
};

// CREATE tarea
exports.createTarea = async (req, res) => {
    const { Descripcion, IdUsuario } = req.body;

    if (!Descripcion || !IdUsuario)
        return res.status(400).json({ message: 'Faltan campos' });

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('Descripcion', sql.NVarChar(255), Descripcion)
            .input('IdUsuario', sql.Int, IdUsuario)
            .query(`
                INSERT INTO Tareas (Descripcion, IdUsuario)
                VALUES (@Descripcion, @IdUsuario)
            `);

        res.status(201).json({ message: 'Tarea creada con éxito' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al crear tarea' });
    }
};

// UPDATE tarea
exports.updateTarea = async (req, res) => {
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
                SET Descripcion=@Descripcion, IdUsuario=@IdUsuario, Estado=@Estado
                WHERE IdTarea=@IdTarea
            `);

        res.json({ message: 'Tarea actualizada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al actualizar tarea' });
    }
};

// UPDATE estado (usa trigger)
exports.updateEstado = async (req, res) => {
    const id = parseInt(req.params.id);
    const { Estado } = req.body;

    if (!['Pendiente','En Progreso','Completada'].includes(Estado))
        return res.status(400).json({ message: 'Estado inválido' });

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdTarea', sql.Int, id)
            .input('Estado', sql.NVarChar(50), Estado)
            .query(`
                UPDATE Tareas 
                SET Estado=@Estado 
                WHERE IdTarea=@IdTarea
            `);

        res.json({ message: 'Estado actualizado' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al cambiar estado' });
    }
};

// DELETE tarea
exports.deleteTarea = async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('IdTarea', sql.Int, id)
            .query(`DELETE FROM Tareas WHERE IdTarea=@IdTarea`);

        res.json({ message: 'Tarea eliminada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al eliminar tarea' });
    }
};