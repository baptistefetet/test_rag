# Gemini File Search - Application Node.js

Application web simple permettant d'interroger des documents stockés dans un File Search Store de Gemini en utilisant l'API Google native.

## Fonctionnalités

- Upload de documents (PDF, TXT, DOCX, MD, JSON, etc.)
- Interrogation des documents avec Gemini AI
- Liste et gestion des documents uploadés
- Interface web HTML/JavaScript vanilla
- API REST pour toutes les opérations

## Prérequis

- Node.js v18 ou supérieur
- Une clé API Gemini (obtenue sur [Google AI Studio](https://aistudio.google.com/app/apikey))
- Accès à l'API Gemini File Search

## Installation

1. Cloner ou télécharger ce projet

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
   - Copier `.env` et renseigner votre clé API Gemini
   - Remplacer `your_api_key_here` par votre vraie clé API

```env
GEMINI_API_KEY=votre_cle_api_ici
FILE_SEARCH_STORE_NAME=my-documents-store
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

## Utilisation

### Démarrer le serveur

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

### Développement avec auto-reload

```bash
npm run dev
```

### Utiliser l'interface web

1. Ouvrir `http://localhost:3000` dans votre navigateur
2. **Uploader des documents** : Cliquez sur "Choisir un fichier" puis "Uploader"
3. **Poser des questions** : Tapez votre question et cliquez sur "Interroger"
4. **Gérer les documents** : Voir la liste, supprimer des documents

### Formats de fichiers supportés

- Documents : PDF, DOCX, TXT, MD
- Données : JSON, CSV
- Code source : JS, TS, PY, JAVA, etc.
- Taille max : 100 MB par fichier

## Structure du projet

```
gemini-file-search/
├── server.js              # Point d'entrée du serveur Express
├── package.json           # Dépendances et scripts
├── .env                   # Configuration (à ne pas commiter)
├── .gitignore            # Fichiers à ignorer par git
├── src/
│   ├── config.js         # Configuration centralisée
│   ├── gemini-client.js  # Client Gemini et gestion File Search Store
│   └── routes.js         # Routes API REST
├── public/               # Frontend statique
│   ├── index.html        # Interface web
│   ├── style.css         # Styles CSS
│   └── app.js           # Logique frontend JavaScript
└── uploads/              # Dossier temporaire pour fichiers uploadés
```

## API Endpoints

### POST /api/upload
Upload un fichier vers le File Search Store
- Body : multipart/form-data avec le champ `file`
- Response : `{ success: true, fileName: string }`

### POST /api/query
Interroger les documents avec une question
- Body : `{ question: string }`
- Response : `{ success: true, answer: string }`

### GET /api/documents
Lister tous les documents du store
- Response : `{ success: true, documents: [...] }`

### DELETE /api/documents/:displayName
Supprimer un document
- Response : `{ success: true }`

### GET /api/status
Vérifier le statut de l'API
- Response : `{ success: true, status: 'online', storeInitialized: boolean }`

## Limitations

- **Max stores par projet** : 10
- **Max taille par document** : 100 MB
- **Expiration** : Les documents dans le File Search Store sont persistants (pas d'expiration)

## Tarification

- **Indexation initiale** : $0.15 par million de tokens
- **Stockage** : Gratuit
- **Recherche** : Gratuit
- **Tokens récupérés** : Facturés comme contexte input au modèle

## Dépannage

### Erreur "Variables d'environnement manquantes"
- Vérifier que le fichier `.env` existe et contient `GEMINI_API_KEY`

### Erreur lors de l'initialisation du store
- Vérifier que votre clé API est valide
- Vérifier que vous avez accès à l'API File Search
- Vérifier votre connexion internet

### Fichier trop volumineux
- Vérifier que le fichier fait moins de 100 MB
- Formats non supportés peuvent causer des erreurs

## Technologies utilisées

- **Backend** : Node.js, Express
- **Frontend** : HTML, CSS, JavaScript vanilla
- **API** : @google/genai v1.31.0
- **Upload** : Multer
- **Configuration** : dotenv

## Ressources

- [Documentation Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search)
- [API Reference](https://ai.google.dev/api/file-search/file-search-stores)
- [SDK GitHub](https://github.com/googleapis/js-genai)
- [Obtenir une clé API](https://aistudio.google.com/app/apikey)

## Licence

MIT
