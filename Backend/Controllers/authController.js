const { sql, poolPromise } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {

    console.log("BODY RECIBIDO:", req.body);
    console.log("IdSitio TIPO:", typeof req.body.IdSitio, "VALOR:", req.body.IdSitio);

    const {
      Nombre,
      Apellido_P,
      Apellido_M,
      Correo,
      Contraseña,
      Telefono,
      IdRol,
      IdSitio
    } = req.body;
    
    const pool = await poolPromise;

    // Correo ya existe
    const existe = await pool.request()
      .input('Correo', sql.NVarChar, Correo)
      .query('SELECT IdUsuario FROM Usuarios WHERE Correo = @Correo');

    if (existe.recordset.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }
    // Digitos para la contraseña
    const hash = await bcrypt.hash(Contraseña, 10);

    await pool.request()
      .input('Nombre', sql.NVarChar, Nombre)
      .input('Apellido_P', sql.NVarChar, Apellido_P)
      .input('Apellido_M', sql.NVarChar, Apellido_M || '')
      .input('Correo', sql.NVarChar, Correo)
      .input('Contrasena', sql.NVarChar, hash)
      .input('Telefono', sql.NVarChar, Telefono)
      .input('IdRol', sql.Int, IdRol || 2)
      .input('IdSitio', sql.Int, IdSitio) 
      .query(`
        INSERT INTO Usuarios (Nombre, Apellido_P, Apellido_M, Correo, Contraseña, Telefono, IdRol, IdSitio)
        VALUES (@Nombre, @Apellido_P, @Apellido_M, @Correo, @Contrasena, @Telefono, @IdRol, @IdSitio)
      `);

    res.status(201).json({ message: 'Usuario registrado con éxito' });
  } catch (err) {
    console.error('Error register:', err);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

exports.login = async (req, res) => {
  try {
    const { correo, contraseña } = req.body;

    const pool = await poolPromise;

  const result = await pool.request()
  .input('Correo', sql.NVarChar, correo)
  .query(`
    SELECT 
      IdUsuario,
      Nombre,
      Apellido_P,
      Apellido_M,
      Correo,
      Contraseña,
      IdRol,
      IdSitio
    FROM Usuarios
    WHERE Correo = @Correo
  `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const usuario = result.recordset[0];

    const ok = await bcrypt.compare(contraseña, usuario.Contraseña);
    if (!ok) {
      return res.status(401).json({ message: 'Correo o contraseña incorrectos' });
    }

    const payload = 
    {
      idUsuario: usuario.IdUsuario,
      idRol: usuario.IdRol,
      idSitio: usuario.IdSitio
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto', { expiresIn: '8h' });

    res.json({
      token,
      user: {
        id: usuario.IdUsuario,
        nombre: usuario.Nombre,
        apellidoP: usuario.Apellido_P,
        correo: usuario.Correo,
        rol: usuario.IdRol
      }
    });
  } catch (err) {
    console.error('Error login:', err);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};