# Notes pour Claude

## Serveur Node.js

- Relancer automatiquement le serveur après chaque modification de code
- Commande : `nohup node server.js > server.log 2>&1 &` depuis `/home/ubuntu/test_rag`
- Pour voir les logs : `tail -f server.log`
- Pour arrêter le serveur : `pkill -f "node server.js"`
