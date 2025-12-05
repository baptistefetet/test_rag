require('dotenv').config();

// Validation de la configuration
function validateConfig() {
  const requiredEnvVars = ['GEMINI_API_KEY'];
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes: ${missing.join(', ')}\n` +
      `Veuillez les définir dans le fichier .env`
    );
  }
}

// Valider la configuration au chargement
validateConfig();

// Exporter la configuration
module.exports = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    fileSearchStoreName: process.env.FILE_SEARCH_STORE_NAME || 'my-documents-store'
  },
  server: {
    port: process.env.PORT || 3000
  }
};
