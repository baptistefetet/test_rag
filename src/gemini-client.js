const { GoogleGenAI } = require('@google/genai');
const config = require('./config');
const path = require('path');
const fs = require('fs');

// Charger le pre-prompt depuis prompt.md
const PROMPT_FILE = path.join(__dirname, '..', 'prompt.md');
let systemPrompt = '';

try {
  systemPrompt = fs.readFileSync(PROMPT_FILE, 'utf8');
  console.log('Pre-prompt chargé depuis prompt.md');
} catch (error) {
  console.warn('Fichier prompt.md non trouvé, utilisation sans pre-prompt');
}

// Initialiser le client Gemini
const ai = new GoogleGenAI({
  apiKey: config.gemini.apiKey
});

// Variable pour stocker l'instance du File Search Store
let fileSearchStore = null;

/**
 * Initialiser ou récupérer le File Search Store
 */
async function initializeStore() {
  console.log(`Recherche du store "${config.gemini.fileSearchStoreName}"...`);

  // Lister tous les stores existants
  const pager = await ai.fileSearchStores.list({ config: { pageSize: 10 } });
  let page = pager.page;

  // Chercher le store par nom
  while (true) {
    for (const store of page) {
      if (store.displayName === config.gemini.fileSearchStoreName) {
        fileSearchStore = store;
        console.log(`Store trouvé: ${store.name}`);
        return store;
      }
    }
    if (!pager.hasNextPage()) break;
    page = await pager.nextPage();
  }

  // Si le store n'existe pas, le créer
  console.log(`Store non trouvé. Création d'un nouveau store...`);
  const createOp = await ai.fileSearchStores.create({
    config: { displayName: config.gemini.fileSearchStoreName }
  });

  fileSearchStore = createOp;
  console.log(`Store créé: ${fileSearchStore.name}`);
  return fileSearchStore;
}

/**
 * Uploader un document vers le File Search Store
 * @param {string} filePath - Chemin du fichier à uploader
 * @param {string} displayName - Nom d'affichage optionnel
 * @returns {Promise<Object>} Opération d'upload complétée
 */
async function uploadDocument(filePath, displayName = null) {
  if (!fileSearchStore) {
    throw new Error('File Search Store non initialisé. Appelez initializeStore() d\'abord.');
  }

  const fileName = displayName || path.basename(filePath);
  console.log(`Upload du fichier: ${fileName}...`);

  // Démarrer l'upload
  let operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: filePath,
    fileSearchStoreName: fileSearchStore.name,
    config: {
      displayName: fileName
    }
  });

  // Polling de l'opération jusqu'à complétion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    operation = await ai.operations.get({ operation });
  }

  if (operation.error) {
    throw new Error(`Erreur lors de l'upload: ${operation.error.message}`);
  }

  console.log(`Fichier uploadé avec succès: ${fileName}`);
  return operation;
}

/**
 * Interroger les documents avec une question
 * @param {string} question - La question à poser
 * @returns {Promise<string>} La réponse du modèle
 */
async function queryDocuments(question) {
  if (!fileSearchStore) {
    throw new Error('File Search Store non initialisé. Appelez initializeStore() d\'abord.');
  }

  // Combiner le pre-prompt avec la question de l'utilisateur
  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n${question}`
    : question;

  console.log(`Question: ${question}`);

  const response = await ai.models.generateContent({
    model: config.gemini.model,
    contents: fullPrompt,
    config: {
      tools: [{
        fileSearch: {
          fileSearchStoreNames: [fileSearchStore.name]
        }
      }]
    }
  });

  return response.text;
}

/**
 * Lister tous les documents du File Search Store
 * @returns {Promise<Array>} Liste des documents
 */
async function listDocuments() {
  if (!fileSearchStore) {
    throw new Error('File Search Store non initialisé. Appelez initializeStore() d\'abord.');
  }

  const documents = [];
  let documentPager = await ai.fileSearchStores.documents.list({
    parent: fileSearchStore.name
  });

  while (true) {
    for (const doc of documentPager.page) {
      documents.push({
        name: doc.name,
        displayName: doc.displayName,
        wordCount: doc.structuredData?.wordCount || 0,
        status: doc.structuredData?.processingStatus || 'unknown'
      });
    }
    if (!documentPager.hasNextPage()) break;
    documentPager = await documentPager.nextPage();
  }

  return documents;
}

/**
 * Supprimer un document par son nom d'affichage
 * @param {string} displayName - Nom d'affichage du document
 * @returns {Promise<boolean>} true si supprimé, false si non trouvé
 */
async function deleteDocument(displayName) {
  if (!fileSearchStore) {
    throw new Error('File Search Store non initialisé. Appelez initializeStore() d\'abord.');
  }

  console.log(`Recherche du document: ${displayName}...`);

  // Trouver le document
  let documentPager = await ai.fileSearchStores.documents.list({
    parent: fileSearchStore.name
  });

  let foundDoc = null;
  while (true) {
    for (const doc of documentPager.page) {
      if (doc.displayName === displayName) {
        foundDoc = doc;
        break;
      }
    }
    if (foundDoc || !documentPager.hasNextPage()) break;
    documentPager = await documentPager.nextPage();
  }

  if (!foundDoc) {
    console.log(`Document non trouvé: ${displayName}`);
    return false;
  }

  // Supprimer le document
  await ai.fileSearchStores.documents.delete({
    name: foundDoc.name,
    config: { force: true }
  });

  console.log(`Document supprimé: ${displayName}`);
  return true;
}

/**
 * Supprimer complètement le File Search Store
 * @returns {Promise<void>}
 */
async function deleteStore() {
  if (!fileSearchStore) {
    throw new Error('File Search Store non initialisé.');
  }

  console.log(`Suppression du store: ${fileSearchStore.name}...`);

  await ai.fileSearchStores.delete({
    name: fileSearchStore.name,
    config: { force: true }
  });

  fileSearchStore = null;
  console.log('Store supprimé avec succès');
}

/**
 * Obtenir l'instance actuelle du store
 * @returns {Object|null} L'instance du store ou null
 */
function getStore() {
  return fileSearchStore;
}

module.exports = {
  initializeStore,
  uploadDocument,
  queryDocuments,
  listDocuments,
  deleteDocument,
  deleteStore,
  getStore
};
