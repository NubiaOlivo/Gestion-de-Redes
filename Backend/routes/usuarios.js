const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../db');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/authMiddleware');

// GET all usuarios (protected)
router.get('/', authMiddleware, async (req, res) => {
try {
const pool = await poolPromise;
const result = await pool.request().query('SELECT IdUsuario, Nombre, Apellido_P, Apellido_M, Correo, Telefono, FechaRegistro, UltimoAcceso, IdRol FROM Usuarios');
res.json(result.recordset);
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error' });
}
});

// CREATE usuario
router.post('/', authMiddleware, async (req, res) => {
const { Nombre, Apellido_P, Apellido_M, Correo, Contraseña, Telefono, IdRol } = req.body;
if (!Nombre || !Apellido_P || !Apellido_M || !Correo || !Contraseña || !IdRol)
return res.status(400).json({ message: 'Faltan campos' });

try {
const hashed = await bcrypt.hash(Contraseña, 10);
const pool = await poolPromise;
await pool.request()
.input('Nombre', sql.NVarChar(100), Nombre)
.input('Apellido_P', sql.NVarChar(100), Apellido_P)
.input('Apellido_M', sql.NVarChar(100), Apellido_M)
.input('Correo', sql.NVarChar(150), Correo)
.input('Contraseña', sql.NVarChar(255), hashed)
.input('Telefono', sql.NVarChar(20), Telefono || null)
.input('IdRol', sql.Int, IdRol)
.query(`INSERT INTO Usuarios (Nombre, Apellido_P, Apellido_M, Correo, Contraseña, Telefono, IdRol)
VALUES (@Nombre,@Apellido_P,@Apellido_M,@Correo,@Contraseña,@Telefono,@IdRol)`);
res.json({ message: 'Usuario creado' });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error' });
}
});

// UPDATE usuario
router.put('/:id', authMiddleware, async (req, res) => {
const id = parseInt(req.params.id);
const { Nombre, Apellido_P, Apellido_M, Telefono, IdRol } = req.body;
try {
const pool = await poolPromise;
await pool.request()
.input('IdUsuario', sql.Int, id)
.input('Nombre', sql.NVarChar(100), Nombre)
.input('Apellido_P', sql.NVarChar(100), Apellido_P)
.input('Apellido_M', sql.NVarChar(100), Apellido_M)
.input('Telefono', sql.NVarChar(20), Telefono || null)
.input('IdRol', sql.Int, IdRol)
.query(`UPDATE Usuarios SET Nombre=@Nombre, Apellido_P=@Apellido_P, Apellido_M=@Apellido_M, Telefono=@Telefono, IdRol=@IdRol WHERE IdUsuario=@IdUsuario`);
res.json({ message: 'Usuario actualizado' });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error' });
}
});

// DELETE usuario
router.delete('/:id', authMiddleware, async (req, res) => {
const id = parseInt(req.params.id);
try {
const pool = await poolPromise;
await pool.request().input('IdUsuario', sql.Int, id).query('DELETE FROM Usuarios WHERE IdUsuario=@IdUsuario');
res.json({ message: 'Usuario eliminado' });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error' });
}
});
// ==============================
// CAMBIAR CONTRASEÑA
// PUT /api/usuarios/:id/password
// ==============================
router.put('/:id/password', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { passwordActual, passwordNueva } = req.body;

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  if (passwordNueva.length < 8) {
    return res.status(400).json({ message: 'La nueva contraseña debe tener mínimo 8 caracteres.' });
  }

  try {
    const pool = await poolPromise;

    // Obtener hash actual del usuario
    const result = await pool.request()
      .input('IdUsuario', sql.Int, id)
      .query('SELECT Contraseña FROM Usuarios WHERE IdUsuario = @IdUsuario');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const hashDB = result.recordset[0].Contraseña;

    // Comparar contraseña actual con el hash
    const ok = await bcrypt.compare(passwordActual, hashDB);
    if (!ok) {
      return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
    }

    // Hashear la nueva contraseña
    const nuevoHash = await bcrypt.hash(passwordNueva, 10);

    // Guardar en BD
    await pool.request()
      .input('IdUsuario', sql.Int, id)
      .input('Nueva', sql.NVarChar(255), nuevoHash)
      .query('UPDATE Usuarios SET Contraseña = @Nueva WHERE IdUsuario = @IdUsuario');

    return res.json({ message: 'Contraseña actualizada' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;