const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const config = require('./src/config');
const geminiClient = require('./src/gemini-client');
const routes = require('./src/routes');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir les fichiers statiques du dossier public
app.use(express.static('public'));

// Routes API
app.use('/api', routes);

// Route par défaut - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

// Fonction pour démarrer le serveur
async function startServer() {
  try {
    console.log('='.repeat(50));
    console.log('Gemini File Search - Démarrage');
    console.log('='.repeat(50));

    // Initialiser le File Search Store au démarrage
    console.log('\nInitialisation du File Search Store...');
    await geminiClient.initializeStore();
    console.log('Store initialisé avec succès!\n');

    // Démarrer le serveur Express
    app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`✓ Serveur démarré sur http://localhost:${PORT}`);
      console.log(`✓ Interface web: http://localhost:${PORT}`);
      console.log(`✓ API endpoint: http://localhost:${PORT}/api`);
      console.log('='.repeat(50));
      console.log('\nPrêt à recevoir des requêtes!\n');
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error.message);
    console.error('\nVérifiez que:');
    console.error('1. Votre GEMINI_API_KEY est correctement configurée dans .env');
    console.error('2. Vous avez accès à l\'API Gemini File Search');
    console.error('3. Votre connexion internet fonctionne\n');
    process.exit(1);
  }
}

// Gestion de l'arrêt propre du serveur
process.on('SIGINT', () => {
  console.log('\n\nArrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nArrêt du serveur...');
  process.exit(0);
});

// Démarrer le serveur
startServer();
