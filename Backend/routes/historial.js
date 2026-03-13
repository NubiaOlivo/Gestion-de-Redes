const express = require('express');
const router = express.Router();

// IMPORTAR CONTROLADOR
const historialController = require('../Controllers/historialController');

// GET /api/historial
router.get('/', historialController.getHistorial);

module.exports = router;