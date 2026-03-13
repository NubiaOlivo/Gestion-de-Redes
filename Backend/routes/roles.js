const express = require('express');
const router = express.Router();
const { poolPromise } = require('../db');

// GET all roles
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT IdRol, Rol FROM Roles ORDER BY IdRol');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
});

module.exports = router;