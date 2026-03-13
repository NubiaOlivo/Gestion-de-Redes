const bcrypt = require('bcrypt');
const { poolPromise, sql } = require('../db');

exports.cambiarPassword = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { passwordActual, passwordNueva } = req.body;

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ message: 'Faltan datos' });
    }

    const pool = await poolPromise;

    // obtener contraseña actual
    const result = await pool.request()
      .input('IdUsuario', sql.Int, id)
      .query('SELECT Contraseña FROM Usuarios WHERE IdUsuario = @IdUsuario');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const hashDB = result.recordset[0].Contraseña;

    // comparar contraseña actual
    const ok = await bcrypt.compare(passwordActual, hashDB);
    if (!ok) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    // encriptar nueva contraseña
    const nuevoHash = await bcrypt.hash(passwordNueva, 10);

    // guardar nueva contraseña
    await pool.request()
      .input('IdUsuario', sql.Int, id)
      .input('Contrasena', sql.NVarChar, nuevoHash)
      .query('UPDATE Usuarios SET Contraseña = @Contrasena WHERE IdUsuario = @IdUsuario');

    res.json({ message: 'Contraseña actualizada' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};