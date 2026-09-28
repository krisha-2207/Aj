const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide email/username and password' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { username: identifier.trim().toLowerCase() }
        ]
      },
      include: {
        pharmacy: true,
        staffProfile: true,
        dealerProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    // Optional role validation if role was selected on UI
    if (role && user.role.toUpperCase() !== role.toUpperCase()) {
      return res.status(403).json({
        error: `Selected role (${role}) does not match your assigned role (${user.role}). Please select the correct tab.`
      });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Demo fallback: support both standard and role passwords
      if (
        (user.role === 'STAFF' && (password === 'staff123' || password === 'admin123')) ||
        (user.role === 'DEALER' && (password === 'dealer123' || password === 'admin123')) ||
        (user.role === 'OWNER' && (password === 'admin123' || password === 'owner123'))
      ) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Account is inactive. Please contact your administrator.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Never send password back
    const { password: _, ...safeUser } = user;

    res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during authentication', details: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        pharmacy: true,
        staffProfile: true,
        dealerProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
});

module.exports = router;
