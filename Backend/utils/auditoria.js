// Historial de usuarios
const { sql, poolPromise } = require('../db');

async function registrarActividad(req, modulo, accion, descripcion) {
  if (!req.user) return;

  const pool = await poolPromise;

  await pool.request()
    .input('IdUsuario', sql.Int, req.user.IdUsuario)
    .input('IdSitio', sql.Int, req.user.IdSitio)
    .input('Modulo', sql.NVarChar, modulo)
    .input('Accion', sql.NVarChar, accion)
    .input('Descripcion', sql.NVarChar, descripcion)
    .query(`
      INSERT INTO AuditoriaUsuarios
      (IdUsuario, IdSitio, Modulo, Accion, Descripcion)
      VALUES (@IdUsuario, @IdSitio, @Modulo, @Accion, @Descripcion)
    `);
}
module.exports = { registrarActividad };