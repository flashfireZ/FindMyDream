// popup.js

// Import des dépendances Firebase (assurez-vous que le chemin est correct)
import { auth, db } from "./firebase-init.js";
const { serverTimestamp } = firebase.firestore.FieldValue;

// Configuration par défaut des liens
const defaultLinks = [
    { nom: "Netflix", url: "https://www.netflix.com", category: "streaming", description: "Films et séries", likes: 0, dislikes: 0 },
    { nom: "YouTube", url: "https://www.youtube.com", category: "streaming", description: "Vidéos en ligne", likes: 0, dislikes: 0 },
    { nom: "Twitch", url: "https://www.twitch.tv", category: "streaming", description: "Streaming gaming", likes: 0, dislikes: 0 },
    { nom: "Disney+", url: "https://www.disneyplus.com", category: "streaming", description: "Univers Disney", likes: 0, dislikes: 0 },
    { nom: "ChatGPT", url: "https://chat.openai.com", category: "tools", description: "Assistant IA", likes: 0, dislikes: 0 },
    { nom: "Google", url: "https://www.google.com", category: "tools", description: "Moteur de recherche", likes: 0, dislikes: 0 },
    { nom: "GitHub", url: "https://github.com", category: "tools", description: "Code et projets", likes: 0, dislikes: 0 },
    { nom: "Figma", url: "https://www.figma.com", category: "tools", description: "Design collaboratif", likes: 0, dislikes: 0 },
    { nom: "Twitter", url: "https://twitter.com", category: "social", description: "Réseau social", likes: 0, dislikes: 0 },
    { nom: "Instagram", url: "https://www.instagram.com", category: "social", description: "Photos et vidéos", likes: 0, dislikes: 0 },
    { nom: "LinkedIn", url: "https://www.linkedin.com", category: "social", description: "Réseau professionnel", likes: 0, dislikes: 0 },
    { nom: "Discord", url: "https://discord.com", category: "social", description: "Chat et communautés", likes: 0, dislikes: 0 }
];

// Variables globales
let liens = [];
let filteredLinks = [];
let currentCategory = 'all';
let clickCount = 0;
let searchInput, linksContainer, categoryTabs, noResults, totalLinksEl, clickCountEl;
let userVotes = {};
let currentUser = null;

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', showAuthModal);

// --- AUTHENTIFICATION ---
function showAuthModal() {
    const overlay = document.getElementById('authOverlay');
    overlay.innerHTML = '';
    overlay.style.display = 'flex';

    const authModal = document.createElement('div');
    authModal.className = 'auth-modal';
    authModal.innerHTML = `
        <div class="auth-header">
            <div class="auth-logo">🎬</div>
            <h2>Bienvenue sur FindMyStream</h2>
            <p>Connectez-vous pour gérer et voter</p>
        </div>
        <div class="auth-tabs">
            <button class="auth-tab active" data-tab="login">Connexion</button>
            <button class="auth-tab" data-tab="register">Inscription</button>
            <button class="auth-tab" data-tab="guest">Invité</button>
        </div>
        <div class="auth-form" id="loginForm"><!-- ... --></div>
        <div class="auth-form hidden" id="registerForm"><!-- ... --></div>
        <div class="auth-form hidden" id="guestForm"><!-- ... --></div>
    `;
    // Remplir les formulaires pour la lisibilité
    authModal.querySelector('#loginForm').innerHTML = `<input type="email" id="loginEmail" placeholder="Email" class="auth-input"><input type="password" id="loginPassword" placeholder="Mot de passe" class="auth-input"><button id="loginBtn" class="auth-button">Se connecter</button><div class="auth-error" id="loginError"></div>`;
    authModal.querySelector('#registerForm').innerHTML = `<input type="email" id="registerEmail" placeholder="Email" class="auth-input"><input type="password" id="registerPassword" placeholder="Mot de passe" class="auth-input"><input type="password" id="confirmPassword" placeholder="Confirmer" class="auth-input"><button id="registerBtn" class="auth-button">S'inscrire</button><div class="auth-error" id="registerError"></div>`;
    authModal.querySelector('#guestForm').innerHTML = `<p class="guest-info">Accès avec fonctionnalités limitées.</p><button id="guestBtn" class="auth-button guest-button">Continuer en tant qu'invité</button>`;
    
    overlay.appendChild(authModal);
    setupAuthEventListeners();
}

function setupAuthEventListeners() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab, .auth-form').forEach(el => el.classList.remove('active', 'hidden'));
            tab.classList.add('active');
            document.querySelectorAll('.auth-form').forEach(f => f.classList.add('hidden'));
            document.getElementById(tab.dataset.tab + 'Form').classList.remove('hidden');
        });
    });

    document.getElementById('loginBtn').addEventListener('click', () => handleAuth('login'));
    document.getElementById('registerBtn').addEventListener('click', () => handleAuth('register'));
    document.getElementById('guestBtn').addEventListener('click', () => handleAuth('guest'));
}

async function handleAuth(type) {
    const errorEl = document.getElementById(`${type}Error`);
    try {
        let userCredential;
        if (type === 'login') {
            userCredential = await auth.signInWithEmailAndPassword(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
        } else if (type === 'register') {
            const password = document.getElementById('registerPassword').value;
            if (password !== document.getElementById('confirmPassword').value) throw { code: 'auth/passwords-not-matching' };
            userCredential = await auth.createUserWithEmailAndPassword(document.getElementById('registerEmail').value, password);
        } else {
            userCredential = await auth.signInAnonymously();
        }
        showNotification('Connexion réussie !', 'success');
    } catch (error) {
        if (errorEl) errorEl.textContent = getAuthErrorMessage(error.code);
        console.error("Erreur d'authentification:", error);
    }
}

auth.onAuthStateChanged(user => {
    const authOverlay = document.getElementById('authOverlay');
    const container = document.querySelector('.container');
    const appFooter = document.querySelector('.app-footer');

    // Mettre à jour la variable globale de l'utilisateur
    currentUser = user; 

    if (user) {
        // Utilisateur connecté : on cache l'overlay et on montre l'application
        authOverlay.style.display = 'none';
        container.style.display = 'flex';
        appFooter.style.display = 'block';
        init(user);
    } else {
        // Utilisateur déconnecté : on montre l'overlay et on cache l'application
        authOverlay.style.display = 'flex';
        container.style.display = 'none';
        appFooter.style.display = 'none';
        
        // On s'assure que le contenu du modal est bien présent dans l'overlay
        if (!authOverlay.querySelector('.auth-modal')) {
            showAuthModal();
        }
    }
});

function getAuthErrorMessage(code) {
    const messages = {
        'auth/user-not-found': 'Utilisateur non trouvé.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/email-already-in-use': 'Cet email est déjà utilisé.',
        'auth/weak-password': 'Le mot de passe doit faire au moins 6 caractères.',
        'auth/invalid-email': 'Format de l\'email invalide.',
        'auth/passwords-not-matching': 'Les mots de passe ne correspondent pas.'
    };
    return messages[code] || 'Une erreur est survenue.';
}

// --- APPLICATION PRINCIPALE ---
async function init(user) {
    searchInput = document.getElementById('searchInput');
    linksContainer = document.getElementById('linksContainer');
    categoryTabs = document.querySelectorAll('.category-tab');
    noResults = document.getElementById('noResults');
    totalLinksEl = document.getElementById('totalLinks');
    clickCountEl = document.getElementById('clickCount');

    await loadAllData(user);
    setupEventListeners(user);
    setupParticles();
}

function setupEventListeners(user) {
    searchInput.addEventListener('input', filterAndRenderLinks);
    categoryTabs.forEach(tab => tab.addEventListener('click', () => handleCategoryChange(tab)));

    const logoutButton = document.getElementById('logoutButton');
    logoutButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`;
    logoutButton.addEventListener('click', () => auth.signOut());

    const addLinkButton = document.getElementById('addLinkButton');
    addLinkButton.addEventListener('click', () => showAddLinkModal(user));
}

// --- GESTION DES DONNÉES ---
async function loadAllData(user) {
    // Charger tous les liens
    const linksQuery = db.collection('links').orderBy('createdAt', 'desc');
    const linksSnapshot = await linksQuery.get();
    liens = linksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Charger les stats globales et les votes de l'utilisateur
    if (user && !user.isAnonymous) {
        const userStatsDoc = await db.collection('users').doc(user.uid).get();
        if (userStatsDoc.exists) {
            const data = userStatsDoc.data();
            clickCount = data.clickCount || 0;
            userVotes = data.votes || {};
        }
    } else {
        clickCount = 0;
        userVotes = {};
    }
    
    filterAndRenderLinks();
}

async function saveNewLink(linkData) {
    if (!currentUser || currentUser.isAnonymous) {
        showNotification('Connectez-vous pour ajouter un lien.', 'error');
        return;
    }
    try {
        const dataToSave = {
            ...linkData,
            author: { uid: currentUser.uid, email: currentUser.email },
            createdAt: serverTimestamp()
        };
        await db.collection('links').add(dataToSave);
        await loadAllData(currentUser); // Recharger toutes les données pour la synchro
        showNotification('Lien ajouté avec succès!', 'success');
    } catch (error) {
        console.error('Erreur sauvegarde lien:', error);
        showNotification('Erreur lors de la sauvegarde.', 'error');
    }
}

async function handleVote(linkId, voteType) {
    if (!currentUser || currentUser.isAnonymous) {
        showNotification('Connectez-vous pour voter.', 'error');
        return;
    }

    const linkRef = db.collection('links').doc(linkId);
    const userRef = db.collection('users').doc(currentUser.uid);
    const currentVote = userVotes[linkId];
    
    const batch = db.batch();
    const increment = firebase.firestore.FieldValue.increment;

    // Logique de vote
    if (currentVote === voteType) { // Annuler le vote
        delete userVotes[linkId];
        batch.update(linkRef, { [voteType === 'like' ? 'likes' : 'dislikes']: increment(-1) });
    } else {
        if (currentVote) { // Changer de vote
            batch.update(linkRef, {
                [currentVote === 'like' ? 'likes' : 'dislikes']: increment(-1),
                [voteType === 'like' ? 'likes' : 'dislikes']: increment(1)
            });
        } else { // Nouveau vote
            batch.update(linkRef, { [voteType === 'like' ? 'likes' : 'dislikes']: increment(1) });
        }
        userVotes[linkId] = voteType;
    }

    batch.set(userRef, { votes: userVotes }, { merge: true });

    try {
        await batch.commit();
        await loadAllData(currentUser); // Recharger pour être sûr de la synchro
    } catch (error) {
        console.error("Erreur de vote :", error);
        showNotification('Erreur lors du vote.', 'error');
    }
}

// --- AFFICHAGE & MANIPULATION DE L'UI ---
function handleCategoryChange(clickedTab) {
    categoryTabs.forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    currentCategory = clickedTab.dataset.category;
    filterAndRenderLinks();
}
function filterAndRenderLinks() {
    const query = searchInput.value.toLowerCase();
    filteredLinks = liens.filter(lien => 
        (currentCategory === 'all' || lien.category === currentCategory) &&
        (lien.nom.toLowerCase().includes(query) || (lien.description && lien.description.toLowerCase().includes(query)))
    );
    renderLinks();
    updateStats();
}

function renderLinks() {
    linksContainer.innerHTML = '';
    noResults.classList.toggle('hidden', filteredLinks.length > 0);
    linksContainer.classList.toggle('hidden', filteredLinks.length === 0);

    filteredLinks.forEach(lien => {
        const linkElement = document.createElement('div');
        linkElement.className = 'link-item';
        
        const faviconUrl = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${lien.url}&size=64`;
        const userVote = userVotes[lien.id];
        
        linkElement.innerHTML = `
            <div class="link-icon"><img src="${faviconUrl}" alt="" class="favicon-img"></div>
            <div class="link-content">
                <div class="link-name">${lien.nom}</div>
                <div class="link-description">${lien.description}</div>
            </div>
            <div class="link-actions">
                <button class="like-btn ${userVote === 'like' ? 'active' : ''}">👍 <span class="like-count">${lien.likes || 0}</span></button>
                <button class="dislike-btn ${userVote === 'dislike' ? 'active' : ''}">👎 <span class="dislike-count">${lien.dislikes || 0}</span></button>
            </div>
        `;
        
        linkElement.querySelector('.link-content').addEventListener('click', () => window.open(lien.url, '_blank'));
        linkElement.querySelector('.like-btn').addEventListener('click', (e) => { e.stopPropagation(); handleVote(lien.id, 'like'); });
        linkElement.querySelector('.dislike-btn').addEventListener('click', (e) => { e.stopPropagation(); handleVote(lien.id, 'dislike'); });

        linksContainer.appendChild(linkElement);
    });
}

function updateStats() {
    totalLinksEl.textContent = liens.length;
    clickCountEl.textContent = clickCount; // Note: clickCount is now global, not per-user
}

function showAddLinkModal(user) {
    const modal = document.createElement('div');
    modal.className = 'auth-overlay';
    modal.innerHTML = `
        <div class="auth-modal">
            <h2 style="margin-bottom: 24px;">Ajouter un nouveau lien</h2>
            <div class="auth-form" style="min-height: auto; gap: 16px;">
                <input type="text" id="newNom" placeholder="Nom du site" class="auth-input">
                <input type="url" id="newUrl" placeholder="URL du site" class="auth-input">
                <input type="text" id="newDescription" placeholder="Description (courte)" maxlength="35" class="auth-input">
                <select id="newCategory" class="auth-input">
                    <option value="" disabled selected>Choisir une catégorie</option>
                    <option value="streaming">Streaming</option>
                    <option value="tools">Outils</option>
                    <option value="social">Social</option>
                    <option value="work">Travail</option>
                    <option value="other">Autre</option>
                </select>
                <button id="addLink" class="auth-button" style="margin-top: 10px;">Enregistrer</button>
            </div>
            <button id="closeModalBtn" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: white; font-size: 24px; cursor: pointer;">×</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeModal = () => document.body.removeChild(modal);

    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    
    document.getElementById('addLink').addEventListener('click', async () => {
        const linkData = {
            nom: document.getElementById('newNom').value.trim(),
            url: document.getElementById('newUrl').value.trim(),
            category: document.getElementById('newCategory').value,
            description: document.getElementById('newDescription').value.trim(),
            likes: 0,
            dislikes: 0
        };

        if (linkData.nom && linkData.url && linkData.category) {
            await saveNewLink(linkData);
            closeModal();
        } else {
            showNotification('Veuillez remplir tous les champs.', 'error');
        }
    });
}

// --- EFFETS VISUELS ---
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        if(notification.parentElement) {
            notification.parentElement.removeChild(notification);
        }
    }, 3000);
}

function setupParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    setInterval(() => {
        const particle = document.createElement('div');
        Object.assign(particle.style, {
            position: 'absolute', width: '3px', height: '3px',
            background: 'rgba(255, 255, 255, 0.1)', borderRadius: '50%',
            pointerEvents: 'none',
            left: `${Math.random() * 100}%`,
            animation: `float ${8 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 8}s`
        });
        particlesContainer.appendChild(particle);
        setTimeout(() => {
            if (particle.parentElement) {
                particlesContainer.removeChild(particle);
            }
        }, 12000);
    }, 1000);

    if (!document.getElementById('particle-styles')) {
        const styles = document.createElement('style');
        styles.id = 'particle-styles';
        styles.textContent = `@keyframes float {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; } 90% { opacity: 1; }
            100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }`;
        document.head.appendChild(styles);
    }
}
