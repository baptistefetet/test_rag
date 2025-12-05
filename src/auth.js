const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '..', 'users.json');
const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 jours

/**
 * Charger les utilisateurs depuis le fichier JSON
 */
function loadUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs:', error);
    return {};
  }
}

/**
 * Hasher un mot de passe avec bcrypt
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Vérifier un mot de passe contre son hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Générer un token simple (username encodé en base64 avec timestamp)
 */
function generateToken(username, role) {
  const payload = {
    username,
    role,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Décoder et vérifier un token
 */
function verifyToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));

    // Vérifier que le token n'est pas expiré (7 jours)
    if (Date.now() - decoded.timestamp > COOKIE_MAX_AGE) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Authentifier un utilisateur
 */
async function authenticate(username, password) {
  const users = loadUsers();
  const user = users[username];

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    username,
    role: user.role
  };
}

/**
 * Middleware pour vérifier l'authentification
 */
function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Session expirée'
    });
  }

  req.user = decoded;
  next();
}

/**
 * Middleware pour vérifier le rôle admin
 */
function requireAdmin(req, res, next) {
  const token = req.cookies[COOKIE_NAME];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Non authentifié'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Session expirée'
    });
  }

  if (decoded.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux administrateurs'
    });
  }

  req.user = decoded;
  next();
}

/**
 * Obtenir l'utilisateur depuis le cookie (sans bloquer)
 */
function getUserFromCookie(req) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;
  return verifyToken(token);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticate,
  requireAuth,
  requireAdmin,
  getUserFromCookie,
  COOKIE_NAME,
  COOKIE_MAX_AGE
};
