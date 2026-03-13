const { poolPromise } = require('../db');

exports.obtenerSitios = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT IdSitio, Sitio
      FROM SitiosRemotos
      ORDER BY Sitio
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error obtener sitios:', error);
    res.status(500).json({ mensaje: 'Error al obtener sitios' });
  }
};