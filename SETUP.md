# Guide de configuration rapide

## Étape 1 : Obtenir une clé API Gemini

1. Allez sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Connectez-vous avec votre compte Google
3. Cliquez sur "Create API Key" ou "Get API Key"
4. Sélectionnez ou créez un projet Google Cloud
5. Copiez la clé API générée

## Étape 2 : Configurer le fichier .env

Ouvrez le fichier `.env` et remplacez `your_api_key_here` par votre clé API :

```env
GEMINI_API_KEY=AIzaSy...votre_clé_ici
FILE_SEARCH_STORE_NAME=my-documents-store
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

## Étape 3 : Démarrer l'application

```bash
npm start
```

Ouvrez votre navigateur sur `http://localhost:3000`

## Vérification

Si tout fonctionne correctement, vous devriez voir dans la console :

```
==================================================
Gemini File Search - Démarrage
==================================================

Initialisation du File Search Store...
Recherche du store "my-documents-store"...
Store non trouvé. Création d'un nouveau store...
Store créé: fileSearchStores/xxxxx
Store initialisé avec succès!

==================================================
✓ Serveur démarré sur http://localhost:3000
✓ Interface web: http://localhost:3000
✓ API endpoint: http://localhost:3000/api
==================================================

Prêt à recevoir des requêtes!
```

## En cas de problème

### Erreur : "Variables d'environnement manquantes: GEMINI_API_KEY"
- Vérifiez que le fichier `.env` existe
- Vérifiez que `GEMINI_API_KEY` est bien défini
- Pas d'espaces autour du `=`

### Erreur : "API key not valid"
- Vérifiez que vous avez copié toute la clé API
- Vérifiez qu'il n'y a pas d'espaces au début ou à la fin
- Essayez de générer une nouvelle clé API

### Erreur : "Discovery Engine API has not been used"
- L'API File Search nécessite peut-être d'activer certains services dans Google Cloud
- Attendez quelques minutes après avoir créé la clé API
- Vérifiez que votre compte a accès à l'API Gemini

### Le serveur ne démarre pas
- Vérifiez que Node.js v18+ est installé : `node --version`
- Vérifiez que les dépendances sont installées : `npm install`
- Vérifiez que le port 3000 n'est pas déjà utilisé

## Premiers pas

1. **Testez avec un document simple**
   - Créez un fichier `test.txt` avec quelques paragraphes
   - Uploadez-le via l'interface
   - Posez une question simple comme "De quoi parle ce document ?"

2. **Ajoutez plus de documents**
   - Uploadez plusieurs documents sur le même sujet
   - Gemini pourra chercher dans tous les documents

3. **Posez des questions complexes**
   - "Compare les informations dans les différents documents"
   - "Résume les points principaux"
   - "Trouve des contradictions"

## Limites importantes

- Vous êtes limité à **10 File Search Stores** par projet Google Cloud
- Si vous atteignez cette limite, vous devrez supprimer des stores ou créer un nouveau projet
- Chaque fichier peut faire maximum **100 MB**

## Ressources utiles

- [Documentation Gemini File Search](https://ai.google.dev/gemini-api/docs/file-search)
- [Obtenir une clé API](https://aistudio.google.com/app/apikey)
- [Google AI Studio](https://aistudio.google.com/)
- [Tarification](https://ai.google.dev/pricing)

Bon développement ! 🚀
