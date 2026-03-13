const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// GET all categorias
router.get('/', /*authMiddleware,*/ async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT IdCategoria, NombreCategoria FROM Categorias ORDER BY NombreCategoria');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener categorias' });
  }
});

// CREATE categoria
router.post('/', /*authMiddleware,*/ async (req, res) => {
  const { NombreCategoria } = req.body;
  if (!NombreCategoria) return res.status(400).json({ message: 'NombreCategoria requerido' });
  try {
    const pool = await poolPromise;
    await pool.request().input('NombreCategoria', sql.NVarChar(100), NombreCategoria).query('INSERT INTO Categorias (NombreCategoria) VALUES (@NombreCategoria)');
    res.json({ message: 'Categoria creada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear categoria' });
  }
});

// UPDATE categoria
router.put('/:id', /*authMiddleware,*/ async (req, res) => {
  const id = parseInt(req.params.id);
  const { NombreCategoria } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request().input('IdCategoria', sql.Int, id).input('NombreCategoria', sql.NVarChar(100), NombreCategoria)
      .query('UPDATE Categorias SET NombreCategoria=@NombreCategoria WHERE IdCategoria=@IdCategoria');
    res.json({ message: 'Categoria actualizada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar categoria' });
  }
});

// DELETE categoria
router.delete('/:id', /*authMiddleware,*/ async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const pool = await poolPromise;
    await pool.request().input('IdCategoria', sql.Int, id).query('DELETE FROM Categorias WHERE IdCategoria=@IdCategoria');
    res.json({ message: 'Categoria eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar categoria' });
  }
});

module.exports = router;