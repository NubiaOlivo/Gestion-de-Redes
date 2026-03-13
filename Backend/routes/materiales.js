const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');

// =====================
// MULTER (IMAGEN)
// =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/materiales'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `material-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// =====================
// GET ALL MATERIALES
// =====================
router.get('/', async (req, res) => {
  try {
    const { IdSitio } = req.query;

    let query = `
      SELECT 
        m.IdMaterial AS id,
        m.FechaRegistro,
        m.IdDispositivo AS idDispositivo,
        d.NombreDispositivo AS dispositivo,
        m.Marca AS marca,
        m.Modelo AS modelo,
        m.NumeroSerie AS numeroSerie,
        m.NumeroInventario AS numeroInventario,
        m.Descripcion AS descripcion,
        m.RutaImagen AS rutaImagen,
        m.IdSitio
      FROM Materiales m
      LEFT JOIN CatalogoDispositivos d ON d.IdDispositivo = m.IdDispositivo
    `;

    if (IdSitio) {
      query += ` WHERE m.IdSitio = @IdSitio`;
    }

    query += ` ORDER BY m.IdMaterial DESC`;

    const pool = await poolPromise;
    const request = pool.request();

    if (IdSitio) {
      request.input('IdSitio', sql.Int, parseInt(IdSitio, 10));
    }

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (err) {
    console.error('Error al obtener materiales:', err);
    res.status(500).json({ message: 'Error al obtener materiales' });
  }
});

// =====================
// GET UNO POR ID
// =====================
router.get('/:id', /*authMiddleware,*/ async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('IdMaterial', sql.Int, id)
      .query(`
        SELECT 
          m.IdMaterial AS id,
          m.Nombre AS nombre,
          m.Descripcion AS descripcion,
          m.Cantidad AS cantidad,
          m.FechaRegistro,

          m.IdDispositivo AS idDispositivo,
          d.NombreDispositivo AS dispositivo,

          m.Marca AS marca,
          m.Modelo AS modelo,
          m.NumeroSerie AS numeroSerie,
          m.NumeroInventario AS numeroInventario,
          m.RutaImagen AS rutaImagen
        FROM Materiales m
        LEFT JOIN CatalogoDispositivos d ON d.IdDispositivo = m.IdDispositivo
        WHERE m.IdMaterial = @IdMaterial
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Material no encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener material:', err);
    res.status(500).json({ message: 'Error al obtener material' });
  }
});

// =====================
// CREATE material (IMAGEN)
// =====================
router.post('/', upload.single('imagen'), async (req, res) => {
  const {
    IdDispositivo, Marca, Modelo, NumeroSerie, NumeroInventario, Descripcion, IdSitio,
    idDispositivo, marca, modelo, numeroSerie, numeroInventario, descripcion, idSitio
  } = req.body;

  // Normalización de datos
  const idDispositivoFinal = IdDispositivo ?? idDispositivo ?? null;
  const marcaFinal = Marca ?? marca ?? null;
  const modeloFinal = Modelo ?? modelo ?? null;
  const numeroSerieFinal = NumeroSerie ?? numeroSerie ?? null;
  const numeroInventarioFinal = NumeroInventario ?? numeroInventario ?? null;
  const descripcionFinal = Descripcion ?? descripcion ?? null;
  const idSitioFinal = IdSitio ?? idSitio ?? null;

  // Nombre automático
  const nombreFinal = [marcaFinal, modeloFinal].filter(Boolean).join(' ');

  // Validaciones
  if (!idDispositivoFinal) {
    return res.status(400).json({ message: 'IdDispositivo es requerido' });
  }
  if (!idSitioFinal) {
    return res.status(400).json({ message: 'IdSitio es requerido' });
  }
  const rutaImagen = req.file
    ? `/uploads/materiales/${req.file.filename}`
    : null;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('Nombre', sql.NVarChar(100), nombreFinal)
      .input('IdSitio', sql.Int, parseInt(idSitioFinal, 10))
      .input('IdDispositivo', sql.Int, parseInt(idDispositivoFinal, 10))
      .input('Marca', sql.NVarChar(100), marcaFinal)
      .input('Modelo', sql.NVarChar(100), modeloFinal)
      .input('NumeroSerie', sql.NVarChar(100), numeroSerieFinal)
      .input('NumeroInventario', sql.NVarChar(100), numeroInventarioFinal)
      .input('Descripcion', sql.NVarChar(255), descripcionFinal)
      .input('RutaImagen', sql.NVarChar(255), rutaImagen)
      .query(`
        INSERT INTO Materiales
          (Nombre, IdSitio, IdDispositivo, Marca, Modelo, NumeroSerie, NumeroInventario, Descripcion, RutaImagen)
        OUTPUT
          INSERTED.IdMaterial AS id,
          INSERTED.Nombre AS nombre,
          INSERTED.IdSitio AS idSitio,
          INSERTED.IdDispositivo AS idDispositivo,
          INSERTED.Marca AS marca,
          INSERTED.Modelo AS modelo,
          INSERTED.NumeroSerie AS numeroSerie,
          INSERTED.NumeroInventario AS numeroInventario,
          INSERTED.Descripcion AS descripcion,
          INSERTED.RutaImagen AS rutaImagen,
          INSERTED.FechaRegistro
        VALUES
          (@Nombre, @IdSitio, @IdDispositivo, @Marca, @Modelo, @NumeroSerie, @NumeroInventario, @Descripcion, @RutaImagen)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error al crear material:', err);
    res.status(500).json({ message: 'Error al crear material' });
  }
});

// =====================
// UPDATE material 
// =====================
router.put('/:id', upload.single('imagen'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

    const {
      IdDispositivo, Marca, Modelo, NumeroSerie, NumeroInventario, Descripcion,
      idDispositivo, marca, modelo, numeroSerie, numeroInventario, descripcion
    } = req.body;

    const idDispositivoFinal = IdDispositivo ?? idDispositivo ?? null;
    const marcaFinal = Marca ?? marca ?? null;
    const modeloFinal = Modelo ?? modelo ?? null;
    const numeroSerieFinal = NumeroSerie ?? numeroSerie ?? null;
    const numeroInventarioFinal = NumeroInventario ?? numeroInventario ?? null;
    const descripcionFinal = Descripcion ?? descripcion ?? null;

    if (!idDispositivoFinal) {
      return res.status(400).json({ message: 'IdDispositivo es requerido' });
    }

    const rutaImagen = req.file ? `/uploads/materiales/${req.file.filename}` : null;

    const pool = await poolPromise;

    let query = `
      UPDATE Materiales
      SET
        IdDispositivo = @IdDispositivo,
        Marca = @Marca,
        Modelo = @Modelo,
        NumeroSerie = @NumeroSerie,
        NumeroInventario = @NumeroInventario,
        Descripcion = @Descripcion
    `;

    if (rutaImagen) query += `, RutaImagen = @RutaImagen`;
    query += ` WHERE IdMaterial = @IdMaterial`;

    const request = pool.request()
      .input('IdMaterial', sql.Int, id)
      .input('IdDispositivo', sql.Int, parseInt(idDispositivoFinal, 10))
      .input('Marca', sql.NVarChar(100), marcaFinal)
      .input('Modelo', sql.NVarChar(100), modeloFinal)
      .input('NumeroSerie', sql.NVarChar(100), numeroSerieFinal)
      .input('NumeroInventario', sql.NVarChar(100), numeroInventarioFinal)
      .input('Descripcion', sql.NVarChar(255), descripcionFinal);

    if (rutaImagen) request.input('RutaImagen', sql.NVarChar(255), rutaImagen);

    await request.query(query);

    res.json({ message: 'Material actualizado en BD' });
  } catch (err) {
    console.error('Error al actualizar material:', err);
    res.status(500).json({ message: 'Error al actualizar material' });
  }
});

// =====================
// DELETE material
// =====================
router.delete('/:id', /*authMiddleware,*/ async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ message: 'ID inválido' });

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('IdMaterial', sql.Int, id)
      .query('DELETE FROM Materiales WHERE IdMaterial=@IdMaterial');

    res.json({ message: 'Material eliminado' });
  } catch (err) {
    console.error('Error al eliminar material:', err);
    res.status(500).json({ message: 'Error al eliminar material' });
  }
});

module.exports = router;