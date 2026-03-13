const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', /*authMiddleware,*/ async (req, res) => {
  try {
    const pool = await poolPromise;
    
    const result = await pool.request().query('SELECT * FROM vw_SitiosRemotosConCategoria ORDER BY Sitio');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener sitios' });
  }
});

// GET sitio
router.get('/:id', /*authMiddleware,*/ async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const pool = await poolPromise;
    const result = await pool.request().input('IdSitio', sql.Int, id).query('SELECT * FROM SitiosRemotos WHERE IdSitio = @IdSitio');
    if (result.recordset.length === 0) return res.status(404).json({ message: 'Sitio no encontrado' });
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error' });
  }
});

// CREATE sitio
router.post('/', /*authMiddleware,*/ async (req, res) => {
  const { Sitio, URLMaps, FechaVisita, Activo, EquipoInstalado, AnchoBanda, SSID_Pass, Contacto, Telefono, IdCategoria } = req.body;
  if (!Sitio || !IdCategoria) return res.status(400).json({ message: 'Sitio e IdCategoria son requeridos' });
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Sitio', sql.NVarChar(255), Sitio)
      .input('URLMaps', sql.NVarChar(255), URLMaps || null)
      .input('FechaVisita', sql.Date, FechaVisita || null)
      .input('Activo', sql.NVarChar(10), Activo || null)
      .input('EquipoInstalado', sql.NVarChar(100), EquipoInstalado || null)
      .input('AnchoBanda', sql.NVarChar(100), AnchoBanda || null)
      .input('SSID_Pass', sql.NVarChar(150), SSID_Pass || null)
      .input('Contacto', sql.NVarChar(100), Contacto || null)
      .input('Telefono', sql.NVarChar(50), Telefono || null)
      .input('IdCategoria', sql.Int, IdCategoria)
      .query(`INSERT INTO SitiosRemotos (Sitio, URLMaps, FechaVisita, Activo, EquipoInstalado, AnchoBanda, SSID_Pass, Contacto, Telefono, IdCategoria)
              VALUES (@Sitio,@URLMaps,@FechaVisita,@Activo,@EquipoInstalado,@AnchoBanda,@SSID_Pass,@Contacto,@Telefono,@IdCategoria)`);
    res.json({ message: 'Sitio creado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear sitio' });
  }
});

// UPDATE sitio
router.put('/:id', /*authMiddleware,*/ async (req, res) => {
  const id = parseInt(req.params.id);
  const { Sitio, URLMaps, FechaVisita, Activo, EquipoInstalado, AnchoBanda, SSID_Pass, Contacto, Telefono, IdCategoria } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('IdSitio', sql.Int, id)
      .input('Sitio', sql.NVarChar(255), Sitio)
      .input('URLMaps', sql.NVarChar(255), URLMaps || null)
      .input('FechaVisita', sql.Date, FechaVisita ? new Date(`${FechaVisita}T00:00:00`) : null)
      .input('Activo', sql.NVarChar(10), Activo || null)
      .input('EquipoInstalado', sql.NVarChar(100), EquipoInstalado || null)
      .input('AnchoBanda', sql.NVarChar(100), AnchoBanda || null)
      .input('SSID_Pass', sql.NVarChar(150), SSID_Pass || null)
      .input('Contacto', sql.NVarChar(100), Contacto || null)
      .input('Telefono', sql.NVarChar(50), Telefono || null)
      .input('IdCategoria', sql.Int, IdCategoria)
      .query(`UPDATE SitiosRemotos 
        SET Sitio=@Sitio, 
        URLMaps=@URLMaps, 
        FechaVisita=@FechaVisita, 
        Activo=@Activo, 
        EquipoInstalado=@EquipoInstalado,
        AnchoBanda=@AnchoBanda, 
        SSID_Pass=@SSID_Pass, 
        Contacto=@Contacto, 
        Telefono=@Telefono, 
        IdCategoria=@IdCategoria 
        WHERE IdSitio=@IdSitio`);
    res.json({ message: 'Sitio actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar sitio' });
  }
});

// DELETE sitio
router.delete('/:id', /*authMiddleware,*/ async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const pool = await poolPromise;
    await pool.request().input('IdSitio', sql.Int, id).query('DELETE FROM SitiosRemotos WHERE IdSitio=@IdSitio');
    res.json({ message: 'Sitio eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar sitio' });
  }
});

module.exports = router;