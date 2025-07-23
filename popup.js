// popup.js

// Configuration par défaut des liens (SANS les icônes manuelles)
const defaultLinks = [
    // Streaming
    { nom: "Netflix", url: "https://www.netflix.com", category: "streaming", description: "Films et séries" },
    { nom: "YouTube", url: "https://www.youtube.com", category: "streaming", description: "Vidéos en ligne" },
    { nom: "Twitch", url: "https://www.twitch.tv", category: "streaming", description: "Streaming gaming" },
    { nom: "Disney+", url: "https://www.disneyplus.com", category: "streaming", description: "Univers Disney" },
    // Outils
    { nom: "ChatGPT", url: "https://chat.openai.com", category: "tools", description: "Assistant IA" },
    { nom: "Google", url: "https://www.google.com", category: "tools", description: "Moteur de recherche" },
    { nom: "GitHub", url: "https://github.com", category: "tools", description: "Code et projets" },
    { nom: "Figma", url: "https://www.figma.com", category: "tools", description: "Design collaboratif" },
    // Social
    { nom: "Twitter", url: "https://twitter.com", category: "social", description: "Réseau social" },
    { nom: "Instagram", url: "https://www.instagram.com", category: "social", description: "Photos et vidéos" },
    { nom: "LinkedIn", url: "https://www.linkedin.com", category: "social", description: "Réseau professionnel" },
    { nom: "Discord", url: "https://discord.com", category: "social", description: "Chat et communautés" }
];

// Variables globales
let liens = [...defaultLinks];
let filteredLinks = [...liens];
let currentCategory = 'all';
let clickCount = 0;
let searchInput, linksContainer, categoryTabs, noResults, totalLinksEl, clickCountEl;


// Import Firebase
import { auth, db } from "./firebase-init.js";

document.addEventListener('DOMContentLoaded', () => {
    showAuthModal();
});

// Modal d'authentification
function showAuthModal() {
    const overlay = document.getElementById('authOverlay');
    
    // Créer le modal d'authentification
    const authModal = document.createElement('div');
    authModal.className = 'auth-modal';
    authModal.innerHTML = `
        <div class="auth-content">
            <div class="auth-header">
                <div class="auth-logo">🎬</div>
                <h2>Bienvenue sur FindMyDream</h2>
                <p>Connectez-vous pour accéder à vos liens favoris</p>
            </div>
            
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login">Connexion</button>
                <button class="auth-tab" data-tab="register">Inscription</button>
                <button class="auth-tab" data-tab="guest">Invité</button>
            </div>
            
            <div class="auth-form" id="loginForm">
                <input type="email" id="loginEmail" placeholder="Email" class="auth-input">
                <input type="password" id="loginPassword" placeholder="Mot de passe" class="auth-input">
                <button id="loginBtn" class="auth-button">Se connecter</button>
                <div class="auth-error" id="loginError"></div>
            </div>
            
            <div class="auth-form hidden" id="registerForm">
                <input type="email" id="registerEmail" placeholder="Email" class="auth-input">
                <input type="password" id="registerPassword" placeholder="Mot de passe" class="auth-input">
                <input type="password" id="confirmPassword" placeholder="Confirmer le mot de passe" class="auth-input">
                <button id="registerBtn" class="auth-button">S'inscrire</button>
                <div class="auth-error" id="registerError"></div>
            </div>
            
            <div class="auth-form hidden" id="guestForm">
                <p class="guest-info">Accès en mode invité (fonctionnalités limitées)</p>
                <button id="guestBtn" class="auth-button guest-button">Continuer en tant qu'invité</button>
            </div>
        </div>
    `;
    
   
    overlay.innerHTML = '';
    overlay.appendChild(authModal);
    
    setupAuthEventListeners();
}

// Configuration des événements d'authentification
function setupAuthEventListeners() {
    // Gestion des onglets
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
            
            tab.classList.add('active');
            const tabType = tab.dataset.tab;
            document.getElementById(tabType + 'Form').classList.remove('hidden');
        });
    });
    
    // Connexion
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const errorEl = document.getElementById('loginError');
        
        if (!email || !password) {
            errorEl.textContent = 'Veuillez remplir tous les champs';
            return;
        }
        
        try {
            await auth.signInWithEmailAndPassword(email, password);
            showNotification('Connexion réussie !', 'success');
        } catch (error) {
            console.error("Détail de l'erreur de connexion :", error); // <-- AJOUTEZ CECI
            errorEl.textContent = getAuthErrorMessage(error.code);
            }
    });
    
    // Inscription
    document.getElementById('registerBtn').addEventListener('click', async () => {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorEl = document.getElementById('registerError');
        
        if (!email || !password || !confirmPassword) {
            errorEl.textContent = 'Veuillez remplir tous les champs';
            return;
        }
        
        if (password !== confirmPassword) {
            errorEl.textContent = 'Les mots de passe ne correspondent pas';
            return;
        }
        
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            showNotification('Inscription réussie !', 'success');
        } catch (error) {
            errorEl.textContent = getAuthErrorMessage(error.code);
        }
    });
    
    // Mode invité
    document.getElementById('guestBtn').addEventListener('click', async () => {
        try {
            await auth.signInAnonymously();
            showNotification('Connecté en mode invité', 'info');
        } catch (error) {
            console.error('Erreur connexion invité:', error);
        }
    });
    
    // Écouter les changements d'état d'authentification
    auth.onAuthStateChanged(user => {
        if (user) {
            document.getElementById('authOverlay').remove();
            document.querySelector('.container').style.display = 'block';
            document.querySelector('.app-footer').style.display = 'flex';
            init(user);
        }
    });
}

// Messages d'erreur Firebase
function getAuthErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'Utilisateur non trouvé';
        case 'auth/wrong-password':
            return 'Mot de passe incorrect';
        case 'auth/email-already-in-use':
            return 'Cet email est déjà utilisé';
        case 'auth/weak-password':
            return 'Mot de passe trop faible';
        case 'auth/invalid-email':
            return 'Email invalide';
        default:
            return 'Erreur de connexion';
    }
}

// Initialisation de l'application
async function init(user) {
    // Récupérer les éléments DOM
    searchInput = document.getElementById('searchInput');
    linksContainer = document.getElementById('linksContainer');
    categoryTabs = document.querySelectorAll('.category-tab');
    noResults = document.getElementById('noResults');
    totalLinksEl = document.getElementById('totalLinks');
    clickCountEl = document.getElementById('clickCount');

    // Charger les données utilisateur
    await loadUserData(user);
    
    updateStats();
    renderLinks();
    setupEventListeners();
    setupParticles();
    addSettingsButton(user);
    
    // Animation d'entrée pour les liens
    setTimeout(() => {
        const linkItems = document.querySelectorAll('.link-item');
        linkItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.1}s`;
        });
    }, 100);
}

// Charger les données utilisateur depuis Firestore
async function loadUserData(user) {
    try {
        // Charger les liens personnalisés
        const userLinksRef = db.collection('users').doc(user.uid).collection('links');
        const userLinksSnap = await userLinksRef.get();
        const userLinks = userLinksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        liens = [...defaultLinks, ...userLinks];
        filteredLinks = [...liens];
        
        // Charger les statistiques
        const userStatsRef = db.collection('users').doc(user.uid).collection('stats').doc('general');
        const userStatsSnap = await userStatsRef.get();
        if (userStatsSnap.exists()) {
            clickCount = userStatsSnap.data().clickCount || 0;
        }
    } catch (error) {
        console.error('Erreur chargement données:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

// Sauvegarder un nouveau lien
async function saveNewLink(linkData) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const userLinksRef = db.collection('users').doc(user.uid).collection('links');
        await userLinksRef.add(linkData);
        
        liens.push({ ...linkData, id: Date.now().toString() });
        filteredLinks = [...liens];
        
        updateStats();
        renderLinks();
        showNotification('Lien ajouté avec succès!', 'success');
    } catch (error) {
        console.error('Erreur sauvegarde lien:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
    }
}

// Mettre à jour les statistiques dans Firestore
async function updateClickCount() {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        clickCount++;
        const userStatsRef = db.collection('users').doc(user.uid).collection('stats').doc('general');
        await userStatsRef.set({ clickCount }, { merge: true });
        updateStats();
    } catch (error) {
        console.error('Erreur mise à jour stats:', error);
    }
}

function setupEventListeners() {
    // Recherche
    searchInput.addEventListener('input', handleSearch);
    
    // Catégories
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => handleCategoryChange(tab));
    });
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    filteredLinks = liens.filter(lien => 
        (currentCategory === 'all' || lien.category === currentCategory) &&
        (lien.nom.toLowerCase().includes(query) ||
         lien.description.toLowerCase().includes(query))
    );
    renderLinks();
}

function handleCategoryChange(clickedTab) {
    categoryTabs.forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    
    currentCategory = clickedTab.dataset.category;
    
    const query = searchInput.value.toLowerCase();
    filteredLinks = liens.filter(lien => 
        (currentCategory === 'all' || lien.category === currentCategory) &&
        (lien.nom.toLowerCase().includes(query) ||
         lien.description.toLowerCase().includes(query))
    );
    renderLinks();
}

async function renderLinks() {
    linksContainer.innerHTML = '';
    
    if (filteredLinks.length === 0) {
        noResults.classList.remove('hidden');
        linksContainer.classList.add('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    linksContainer.classList.remove('hidden');
    
    for (const lien of filteredLinks) {
        const linkElement = document.createElement('a');
        linkElement.className = 'link-item';
        linkElement.href = lien.url;
        linkElement.target = '_blank';
        
        // --- LA MAGIE EST ICI ---
        // On construit l'URL de l'image en utilisant le service de Google
        const faviconUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${lien.url}&size=64`;
        
        linkElement.innerHTML = `
            <div class="link-icon">
                <img src="${faviconUrl}" alt="Logo de ${lien.nom}" class="favicon-img">
            </div>
            <div class="link-content">
                <div class="link-name">${lien.nom}</div>
            </div>
        `;
        
        linkElement.addEventListener('click', (e) => handleLinkClick(lien, e));
        linksContainer.appendChild(linkElement);
    }
}

function handleLinkClick(lien, event) {
    updateClickCount();
    
    // Animation de clic
    const clickedElement = event.currentTarget;
    clickedElement.style.transform = 'scale(0.95)';
    setTimeout(() => {
        clickedElement.style.transform = '';
    }, 150);
}

function updateStats() {
    totalLinksEl.textContent = liens.length;
    clickCountEl.textContent = clickCount;
}

// Ajouter un bouton de paramètres
function addSettingsButton(user) {
    const header = document.querySelector('.header');
    
    // Bouton paramètres
    const settingsButton = document.createElement('button');
    // Icône SVG pour les Paramètres (engrenage)
    settingsButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    settingsButton.className = 'settings-button';
  
    // Bouton déconnexion
    const logoutButton = document.createElement('button');
    // Icône SVG pour la Déconnexion (sortie)
    logoutButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
    logoutButton.className = 'logout-button';

    settingsButton.addEventListener('click', () => showSettingsModal(user));
    logoutButton.addEventListener('click', async () => {
        await auth.signOut();
        location.reload();
    });
    
    header.appendChild(settingsButton);
    header.appendChild(logoutButton);
}

// Modal de paramètres améliorée
function showSettingsModal(user) {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
  
    const modalContent = document.createElement('div');
    
    
    modalContent.innerHTML = `
        <h2 style="margin-bottom: 20px; text-align: center;">⚙️ Paramètres</h2>
    
    <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 10px;">
        <!-- ... (partie Utilisateur, inchangée) ... -->
    </div>
    
    <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Ajouter un lien :</label>
        <input type="text" id="newNom" placeholder="Nom du site" style="...">
        <input type="text" id="newUrl" placeholder="URL (ex: https://site.com)" style="...">
        <select id="newCategory" style="...">
            <option value="streaming">🎬 Streaming</option>
            <option value="tools">🔧 Outils</option>
            <!-- ... autres options ... -->
        </select>
        <input type="text" id="newDescription" placeholder="Description" style="...">

        <!-- Champs cachés mais nécessaires pour que le code ne plante pas -->
        <input type="text" id="newIcon" style="display: none;">
        <input type="text" id="newColor" style="display: none;">

        <button id="addLink" style="...">Ajouter le lien</button>
    </div>
    
    <!-- ... le reste du modal (stats, bouton fermer) ... -->
`;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('closeModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('addLink').addEventListener('click', async () => {
    const nom = document.getElementById('newNom').value.trim();
    const url = document.getElementById('newUrl').value.trim();
    const category = document.getElementById('newCategory').value;
    const description = document.getElementById('newDescription').value || 'Site web';

    if (nom && url) {
    // On recrée un objet complet, comme les objets par défaut
    const linkData = {
        nom,
        url: url.startsWith('http') ? url : `https://${url}`,
        category,
        description,
        // On ajoute des valeurs par défaut pour l'icône et la couleur.
        // Même si on ne les affiche pas (on utilise le favicon),
        // il est bon de les avoir pour la cohérence des données.
        icon: '🔗', 
        color: 'linear-gradient(45deg, #6c5ce7, #a29bfe)',
        createdAt: Date.now()
    };
    
    await saveNewLink(linkData);
        
        // Vider les champs
        document.getElementById('newNom').value = '';
        document.getElementById('newUrl').value = '';
        document.getElementById('newDescription').value = '';
    } else {
        showNotification('Veuillez entrer un nom et une URL.', 'error');
    }
});
    
    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Système de notifications amélioré
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
  
    
    const colors = {
        info: 'background: linear-gradient(45deg, #3498db, #2980b9)',
        success: 'background: linear-gradient(45deg, #27ae60, #229954)',
        error: 'background: linear-gradient(45deg, #e74c3c, #c0392b)'
    };
    
    notification.style.cssText += colors[type];
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// Système de particules pour l'arrière-plan
function setupParticles() {
    const particlesContainer = document.createElement('div');
    particlesContainer.id = 'particles';
    
    
    document.body.appendChild(particlesContainer);
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 3px;
            height: 3px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            pointer-events: none;
            animation: float ${8 + Math.random() * 4}s linear infinite;
        `;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        
        particlesContainer.appendChild(particle);
        
        setTimeout(() => {
            if (particlesContainer.contains(particle)) {
                particlesContainer.removeChild(particle);
            }
        }, 12000);
    }
    
    // Créer des particules en continu
    setInterval(createParticle, 1000);
    
    
}

// Gérer les touches du clavier pour des raccourcis
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K pour focus sur la recherche
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    // Échap pour vider la recherche
    if (e.key === 'Escape') {
        if (searchInput && searchInput.value) {
            searchInput.value = '';
            handleSearch({ target: { value: '' } });
            searchInput.blur();
        }
    }
});

// Gestion de la visibilité de la page pour économiser les ressources
document.addEventListener('visibilitychange', () => {
    const particles = document.getElementById('particles');
    if (particles) {
        particles.style.display = document.hidden ? 'none' : 'block';
    }
});

// Fonction utilitaire pour valider les URLs
function isValidURL(string) {
    try {
        const url = new URL(string.startsWith('http') ? string : `https://${string}`);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}



// Export pour les modules si nécessaire
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        init,
        showNotification,
        saveNewLink,
        updateClickCount
    };
}