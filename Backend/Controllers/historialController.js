const { poolPromise, sql } = require('../db');

exports.getHistorial = async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                IdHistorial,
                IdTarea,
                Descripcion,
                EstadoAnterior,
                EstadoNuevo,
                FechaCambioEstado
            FROM HistorialTareas
            ORDER BY FechaCambioEstado DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al obtener historial' });
    }
};