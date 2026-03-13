const { sql, poolPromise } = require('../db');

// GET /api/materiales
exports.listar = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
          IdMaterial AS id,
          Nombre     AS nombre,
          Descripcion AS descripcion,
          Cantidad   AS cantidad,
          FechaRegistro
      FROM Materiales
      ORDER BY IdMaterial DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error listar materiales:', err);
    res.status(500).json({ message: 'Error al obtener materiales' });
  }
};

// POST /api/materiales
exports.crear = async (req, res) => {
  try {
    const { nombre, descripcion, cantidad } = req.body;

    if (!nombre || cantidad == null || isNaN(parseInt(cantidad))) {
      return res.status(400).json({ message: 'Nombre y cantidad son obligatorios' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('Nombre', sql.NVarChar(100), nombre)
      .input('Descripcion', sql.NVarChar(255), descripcion || null)
      .input('Cantidad', sql.Int, parseInt(cantidad))
      .query(`
        INSERT INTO Materiales (Nombre, Descripcion, Cantidad)
        OUTPUT INSERTED.IdMaterial AS id,
               INSERTED.Nombre     AS nombre,
               INSERTED.Descripcion AS descripcion,
               INSERTED.Cantidad   AS cantidad
        VALUES (@Nombre, @Descripcion, @Cantidad)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error crear material:', err);
    res.status(500).json({ message: 'Error al crear material' });
  }
};

// PUT /api/materiales/:id
exports.actualizar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, descripcion, cantidad } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('IdMaterial', sql.Int, id)
      .input('Nombre', sql.NVarChar(100), nombre)
      .input('Descripcion', sql.NVarChar(255), descripcion || null)
      .input('Cantidad', sql.Int, parseInt(cantidad))
      .query(`
        UPDATE Materiales
        SET Nombre = @Nombre,
            Descripcion = @Descripcion,
            Cantidad = @Cantidad
        WHERE IdMaterial = @IdMaterial
      `);

    res.json({ message: 'Material actualizado' });
  } catch (err) {
    console.error('Error actualizar material:', err);
    res.status(500).json({ message: 'Error al actualizar material' });
  }
};

// DELETE /api/materiales/:id
exports.eliminar = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const pool = await poolPromise;
    await pool.request()
      .input('IdMaterial', sql.Int, id)
      .query('DELETE FROM Materiales WHERE IdMaterial = @IdMaterial');

    res.json({ message: 'Material eliminado' });
  } catch (err) {
    console.error('Error eliminar material:', err);
    res.status(500).json({ message: 'Error al eliminar material' });
  }
};