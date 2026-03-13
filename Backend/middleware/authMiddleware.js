const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Normaliza el usuario para todo el sistema
    req.user = {
    IdUsuario: decoded.idUsuario,
    IdSitio: decoded.idSitio || null,
    Rol: decoded.idRol
  };
    next();
  } catch (err) {
    console.error('Error al verificar token:', err);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};