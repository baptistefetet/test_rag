const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const geminiClient = require('./gemini-client');
const auth = require('./auth');

const router = express.Router();

// Configuration de Multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Conserver le nom original du fichier
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB max
  }
});

// ==================== ROUTES AUTHENTIFICATION ====================

/**
 * POST /api/login
 * Authentifier un utilisateur
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    const user = await auth.authenticate(username, password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Générer le token et créer le cookie
    const token = auth.generateToken(user.username, user.role);

    res.cookie(auth.COOKIE_NAME, token, {
      httpOnly: true,
      maxAge: auth.COOKIE_MAX_AGE,
      sameSite: 'strict'
    });

    res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion'
    });
  }
});

/**
 * POST /api/logout
 * Déconnecter l'utilisateur
 */
router.post('/logout', (req, res) => {
  res.clearCookie(auth.COOKIE_NAME);
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

/**
 * GET /api/me
 * Récupérer l'utilisateur connecté
 */
router.get('/me', (req, res) => {
  const user = auth.getUserFromCookie(req);

  if (!user) {
    return res.json({
      success: true,
      authenticated: false,
      user: null
    });
  }

  res.json({
    success: true,
    authenticated: true,
    user: {
      username: user.username,
      role: user.role
    }
  });
});

// ==================== ROUTES DOCUMENTS ====================

/**
 * POST /api/upload
 * Upload un fichier vers le File Search Store (admin uniquement)
 */
router.post('/upload', auth.requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    const filePath = req.file.path;
    const displayName = req.file.originalname;

    // Uploader vers Gemini
    await geminiClient.uploadDocument(filePath, displayName);

    // Supprimer le fichier temporaire après upload
    await fs.unlink(filePath);

    res.json({
      success: true,
      fileName: displayName,
      message: 'Fichier uploadé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);

    // Nettoyer le fichier temporaire en cas d'erreur
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Erreur lors de la suppression du fichier temporaire:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'upload du fichier'
    });
  }
});

/**
 * POST /api/query
 * Interroger les documents avec une question
 */
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Question manquante ou invalide'
      });
    }

    const answer = await geminiClient.queryDocuments(question.trim());

    res.json({
      success: true,
      answer: answer
    });
  } catch (error) {
    console.error('Erreur lors de la requête:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'interrogation des documents'
    });
  }
});

/**
 * GET /api/documents
 * Lister tous les documents du store
 */
router.get('/documents', async (req, res) => {
  try {
    const documents = await geminiClient.listDocuments();

    res.json({
      success: true,
      documents: documents,
      count: documents.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des documents:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la récupération des documents'
    });
  }
});

/**
 * DELETE /api/documents/:displayName
 * Supprimer un document par son nom
 */
router.delete('/documents/:displayName', async (req, res) => {
  try {
    const { displayName } = req.params;

    if (!displayName) {
      return res.status(400).json({
        success: false,
        error: 'Nom de document manquant'
      });
    }

    const deleted = await geminiClient.deleteDocument(decodeURIComponent(displayName));

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Document non trouvé'
      });
    }

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la suppression du document'
    });
  }
});

/**
 * GET /api/status
 * Vérifier le statut de l'API
 */
router.get('/status', (req, res) => {
  const store = geminiClient.getStore();
  res.json({
    success: true,
    status: 'online',
    storeInitialized: !!store,
    storeName: store ? store.displayName : null
  });
});

module.exports = router;
