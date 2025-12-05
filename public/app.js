// État de l'utilisateur courant
let currentUser = null;

// ==================== INITIALISATION ====================

// Vérifier l'authentification au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

/**
 * Vérifier si l'utilisateur est connecté
 */
async function checkAuth() {
    try {
        const response = await fetch('/api/me');
        const result = await response.json();

        if (result.success && result.authenticated) {
            currentUser = result.user;
            hideLoginModal();
            updateUIForUser(result.user);
            // Charger les documents uniquement pour admin
            if (result.user.role === 'admin') {
                listDocuments();
            }
        } else {
            showLoginModal();
        }
    } catch (error) {
        console.error('Erreur lors de la vérification auth:', error);
        showLoginModal();
    }
}

// ==================== LOGIN / LOGOUT ====================

/**
 * Afficher le modal de login
 */
function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('username').focus();
}

/**
 * Cacher le modal de login
 */
function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').textContent = '';
}

/**
 * Gérer la soumission du formulaire de login
 */
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');

    if (!username || !password) {
        errorElement.textContent = 'Veuillez remplir tous les champs';
        return;
    }

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (result.success) {
            currentUser = result.user;
            hideLoginModal();
            updateUIForUser(result.user);
            // Charger les documents uniquement pour admin
            if (result.user.role === 'admin') {
                listDocuments();
            }
        } else {
            errorElement.textContent = result.error || 'Identifiants incorrects';
        }
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        errorElement.textContent = 'Erreur de connexion au serveur';
    }
}

/**
 * Gérer la déconnexion
 */
async function handleLogout() {
    try {
        await fetch('/api/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
    }

    currentUser = null;
    closeUserDropdown();
    showLoginModal();
    document.getElementById('userMenu').style.display = 'none';
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('documentsSection').style.display = 'none';
}

// ==================== USER MENU ====================

/**
 * Toggle le dropdown du menu utilisateur
 */
function toggleUserDropdown() {
    const userMenu = document.getElementById('userMenu');
    userMenu.classList.toggle('open');
}

/**
 * Fermer le dropdown
 */
function closeUserDropdown() {
    document.getElementById('userMenu').classList.remove('open');
}

// Fermer le dropdown en cliquant ailleurs
document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('userMenu');
    if (!userMenu.contains(e.target)) {
        closeUserDropdown();
    }
});

/**
 * Mettre à jour l'interface selon l'utilisateur connecté
 */
function updateUIForUser(user) {
    // Afficher le menu utilisateur
    const userMenu = document.getElementById('userMenu');
    userMenu.style.display = 'block';

    // Mettre à jour le nom et le rôle
    document.getElementById('userDisplayName').textContent = user.username;
    document.getElementById('userRole').textContent = user.role;

    // Afficher/cacher les sections selon le rôle
    const uploadSection = document.getElementById('uploadSection');
    const documentsSection = document.getElementById('documentsSection');

    if (user.role === 'admin') {
        uploadSection.style.display = 'block';
        documentsSection.style.display = 'block';
    } else {
        uploadSection.style.display = 'none';
        documentsSection.style.display = 'none';
    }
}

// ==================== STATUS MESSAGES ====================

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

// ==================== DOCUMENTS ====================

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
            if (response.status === 401 || response.status === 403) {
                showStatus('uploadStatus', 'Accès non autorisé. Reconnectez-vous.', 'error');
            } else {
                showStatus('uploadStatus', `Erreur: ${result.error}`, 'error');
            }
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
            answerArea.innerHTML = marked.parse(result.answer);
        } else {
            answerArea.innerHTML = '<strong style="color: var(--error-color);">Une erreur est survenue lors du traitement de votre demande. Veuillez réessayer.</strong>';
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

            const isAdmin = currentUser && currentUser.role === 'admin';

            documentsList.innerHTML = result.documents.map(doc => `
                <div class="document-item">
                    <div class="document-info">
                        <div class="document-name">${escapeHtml(doc.displayName)}</div>
                        <div class="document-meta">
                            ${doc.wordCount.toLocaleString()} mots • Status: ${doc.status}
                        </div>
                    </div>
                    ${isAdmin ? `
                        <button
                            onclick="deleteDocument('${escapeHtml(doc.displayName)}')"
                            class="btn btn-danger"
                        >
                            Supprimer
                        </button>
                    ` : ''}
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

// ==================== UTILITAIRES ====================

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
