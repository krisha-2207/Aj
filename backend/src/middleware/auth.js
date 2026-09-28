const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'pharmacy_super_secret_jwt_key_2026_secure';

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        pharmacy: true,
        staffProfile: true,
        dealerProfile: true
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      pharmacyId: user.pharmacyId,
      staffId: user.staffProfile ? user.staffProfile.id : null,
      dealerId: user.dealerProfile ? user.dealerProfile.id : null,
      pharmacy: user.pharmacy
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
    return res.status(500).json({ error: 'Authentication internal error', details: error.message });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Please log in first' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access denied. Your role '${req.user.role}' cannot access this resource. Required: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  roleMiddleware,
  JWT_SECRET
};
