const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
//GET
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT IdDispositivo, NombreDispositivo
      FROM CatalogoDispositivos
      WHERE Activo = 1
      ORDER BY NombreDispositivo
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener dispositivos' });
  }
});

//POST
router.post('/', async (req, res) => {
  try {
    const { NombreDispositivo } = req.body;
    if (!NombreDispositivo || !NombreDispositivo.trim()) {
      return res.status(400).json({ message: 'NombreDispositivo requerido' });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('NombreDispositivo', sql.NVarChar(100), NombreDispositivo.trim())
      .query(`
        INSERT INTO CatalogoDispositivos (NombreDispositivo)
        OUTPUT INSERTED.IdDispositivo, INSERTED.NombreDispositivo
        VALUES (@NombreDispositivo)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    if (err?.number === 2627 || err?.number === 2601) {
      return res.status(409).json({ message: 'Ese dispositivo ya existe' });
    }
    res.status(500).json({ message: 'Error al agregar dispositivo' });
  }
});

// EDITAR NOMBRE DISPOSITIVO
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { NombreDispositivo } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    if (!NombreDispositivo || !NombreDispositivo.trim()) {
      return res.status(400).json({ message: 'NombreDispositivo requerido' });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('IdDispositivo', sql.Int, id)
      .input('NombreDispositivo', sql.NVarChar(100), NombreDispositivo.trim())
      .query(`
        UPDATE CatalogoDispositivos
        SET NombreDispositivo = @NombreDispositivo
        WHERE IdDispositivo = @IdDispositivo AND Activo = 1
      `);

    // si no encontró fila
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }

    res.json({ message: 'Dispositivo actualizado' });
  } catch (err) {
    console.error(err);
    if (err?.number === 2627 || err?.number === 2601) {
      return res.status(409).json({ message: 'Ese dispositivo ya existe' });
    }
    res.status(500).json({ message: 'Error al actualizar dispositivo' });
  }
});

// ELIMINAR
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const pool = await poolPromise;

    // Verificar si el dispositivo está en uso en Materiales
    const usado = await pool.request()
      .input('IdDispositivo', sql.Int, id)
      .query(`
        SELECT COUNT(*) AS total
        FROM Materiales
        WHERE IdDispositivo = @IdDispositivo
      `);

    if (usado.recordset[0].total > 0) {
      return res.status(409).json({
        message: 'No se puede eliminar: este dispositivo está en uso en Materiales.'
      });
    }

    const result = await pool.request()
      .input('IdDispositivo', sql.Int, id)
      .query(`
        DELETE FROM CatalogoDispositivos
        WHERE IdDispositivo = @IdDispositivo
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Dispositivo no encontrado' });
    }

    res.json({ message: 'Dispositivo eliminado (borrado real)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar dispositivo' });
  }
});

module.exports = router;