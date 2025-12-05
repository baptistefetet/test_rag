// Charger la liste des documents au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    listDocuments();
});

/**
 * Afficher un message de statut
 */
function showStatus(elementId, message, type = 'info') {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `status-message ${type}`;

    // Auto-effacer les messages de succès après 5 secondes
    if (type === 'success') {
        setTimeout(() => {
            element.textContent = '';
            element.className = 'status-message';
        }, 5000);
    }
}

/**
 * Uploader un document
 */
async function uploadDocument() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        showStatus('uploadStatus', 'Veuillez sélectionner un fichier', 'error');
        return;
    }

    // Vérifier la taille du fichier (100 MB max)
    const maxSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSize) {
        showStatus('uploadStatus', 'Le fichier est trop volumineux (max 100 MB)', 'error');
        return;
    }

    showStatus('uploadStatus', 'Upload en cours...', 'loading');

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            showStatus('uploadStatus', `✓ ${result.message}`, 'success');
            fileInput.value = ''; // Réinitialiser l'input
            listDocuments(); // Rafraîchir la liste
        } else {
            showStatus('uploadStatus', `Erreur: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        showStatus('uploadStatus', 'Erreur de connexion au serveur', 'error');
    }
}

/**
 * Interroger les documents
 */
async function queryDocuments() {
    const questionInput = document.getElementById('questionInput');
    const answerArea = document.getElementById('answerArea');
    const question = questionInput.value.trim();

    if (!question) {
        alert('Veuillez entrer une question');
        return;
    }

    answerArea.innerHTML = '<div class="spinner"></div> Recherche en cours...';
    answerArea.style.display = 'block';

    try {
        const response = await fetch('/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        const result = await response.json();

        if (result.success) {
            answerArea.textContent = result.answer;
        } else {
            answerArea.innerHTML = `<strong style="color: var(--error-color);">Erreur:</strong> ${result.error}`;
        }
    } catch (error) {
        console.error('Erreur lors de la requête:', error);
        answerArea.innerHTML = '<strong style="color: var(--error-color);">Erreur de connexion au serveur</strong>';
    }
}

/**
 * Lister tous les documents
 */
async function listDocuments() {
    const documentsList = document.getElementById('documentsList');
    documentsList.innerHTML = '<p class="loading">Chargement...</p>';

    try {
        const response = await fetch('/api/documents');
        const result = await response.json();

        if (result.success) {
            if (result.documents.length === 0) {
                documentsList.innerHTML = '<p class="loading">Aucun document uploadé</p>';
                return;
            }

            documentsList.innerHTML = result.documents.map(doc => `
                <div class="document-item">
                    <div class="document-info">
                        <div class="document-name">${escapeHtml(doc.displayName)}</div>
                        <div class="document-meta">
                            ${doc.wordCount.toLocaleString()} mots • Status: ${doc.status}
                        </div>
                    </div>
                    <button
                        onclick="deleteDocument('${escapeHtml(doc.displayName)}')"
                        class="btn btn-danger"
                    >
                        Supprimer
                    </button>
                </div>
            `).join('');
        } else {
            documentsList.innerHTML = `<p class="loading" style="color: var(--error-color);">Erreur: ${result.error}</p>`;
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        documentsList.innerHTML = '<p class="loading" style="color: var(--error-color);">Erreur de connexion au serveur</p>';
    }
}

/**
 * Supprimer un document
 */
async function deleteDocument(displayName) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${displayName}" ?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/documents/${encodeURIComponent(displayName)}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            listDocuments(); // Rafraîchir la liste
        } else {
            alert(`Erreur: ${result.error}`);
        }
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur de connexion au serveur');
    }
}

/**
 * Échapper les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Permettre l'envoi de la question avec Entrée (Ctrl+Entrée pour nouvelle ligne)
 */
document.getElementById('questionInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault();
        queryDocuments();
    }
});
