// Configuration par défaut des liens
const defaultLinks = [
    // Streaming
    { 
        nom: "Netflix", 
        url: "https://www.netflix.com", 
        category: "streaming",
        icon: "🎬",
        color: "linear-gradient(45deg, #e50914, #f40612)",
        description: "Films et séries"
    },
    { 
        nom: "YouTube", 
        url: "https://www.youtube.com", 
        category: "streaming",
        icon: "📺",
        color: "linear-gradient(45deg, #ff0000, #cc0000)",
        description: "Vidéos en ligne"
    },
    { 
        nom: "Twitch", 
        url: "https://www.twitch.tv", 
        category: "streaming",
        icon: "🎮",
        color: "linear-gradient(45deg, #9146ff, #6441a4)",
        description: "Streaming gaming"
    },
    { 
        nom: "Disney+", 
        url: "https://www.disneyplus.com", 
        category: "streaming",
        icon: "🏰",
        color: "linear-gradient(45deg, #113ccf, #004b95)",
        description: "Univers Disney"
    },
    // Outils
    { 
        nom: "ChatGPT", 
        url: "https://chat.openai.com", 
        category: "tools",
        icon: "🤖",
        color: "linear-gradient(45deg, #10a37f, #1a7f64)",
        description: "Assistant IA"
    },
    { 
        nom: "Google", 
        url: "https://www.google.com", 
        category: "tools",
        icon: "🔍",
        color: "linear-gradient(45deg, #4285f4, #34a853)",
        description: "Moteur de recherche"
    },
    { 
        nom: "GitHub", 
        url: "https://github.com", 
        category: "tools",
        icon: "👨‍💻",
        color: "linear-gradient(45deg, #333, #24292e)",
        description: "Code et projets"
    },
    { 
        nom: "Figma", 
        url: "https://www.figma.com", 
        category: "tools",
        icon: "🎨",
        color: "linear-gradient(45deg, #f24e1e, #a259ff)",
        description: "Design collaboratif"
    },
    // Social
    { 
        nom: "Twitter", 
        url: "https://twitter.com", 
        category: "social",
        icon: "🐦",
        color: "linear-gradient(45deg, #1da1f2, #0d8bd9)",
        description: "Réseau social"
    },
    { 
        nom: "Instagram", 
        url: "https://www.instagram.com", 
        category: "social",
        icon: "📸",
        color: "linear-gradient(45deg, #e4405f, #833ab4)",
        description: "Photos et vidéos"
    },
    { 
        nom: "LinkedIn", 
        url: "https://www.linkedin.com", 
        category: "social",
        icon: "💼",
        color: "linear-gradient(45deg, #0077b5, #005885)",
        description: "Réseau professionnel"
    },
    { 
        nom: "Discord", 
        url: "https://discord.com", 
        category: "social",
        icon: "💬",
        color: "linear-gradient(45deg, #7289da, #5b6eae)",
        description: "Chat et communautés"
    }
];

// Variables globales
let liens = [...defaultLinks];
let filteredLinks = [...liens];
let currentCategory = 'trending';
let clickCount = parseInt(localStorage.getItem('clickCount') || '0');

import { signInAnonymously } from "./libs/firebase-auth.js";

window.firebase = { auth, db }; // expose pour compatibilité avec le reste du script

// Forcer l’authentification avant de lancer l’app
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('authOverlay');

  auth.onAuthStateChanged(user => {
    if (user) {
      overlay?.remove();
      document.querySelector('.container')?.removeAttribute('style');

      init(); // votre fonction principale
    } else {
      signInAnonymously(auth).catch(err => {
        console.error("Erreur Firebase:", err);
        overlay.textContent = 'Erreur de connexion. Voir console.';
      });

    }
  });
});


// Initialisation
function init() {
    // Récupérer les éléments DOM
    searchInput = document.getElementById('searchInput');
    linksContainer = document.getElementById('linksContainer');
    categoryTabs = document.querySelectorAll('.category-tab');
    noResults = document.getElementById('noResults');
    totalLinksEl = document.getElementById('totalLinks');
    clickCountEl = document.getElementById('clickCount');

    // Charger les liens sauvegardés depuis localStorage
    loadSavedLinks();
    
    // Authenticate user
    auth.onAuthStateChanged((user) => {
        if (user) {
            updateStats();
            renderLinks();
            setupEventListeners();
            setupParticles();
            addSettingsButton();
            
            // Animation d'entrée pour les liens
            setTimeout(() => {
                const linkItems = document.querySelectorAll('.link-item');
                linkItems.forEach((item, index) => {
                    item.style.animationDelay = `${index * 0.1}s`;
                });
            }, 100);
        }
    });
}

function setupEventListeners() {
    // Recherche
    searchInput.addEventListener('input', handleSearch);
    
    // Catégories
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => handleCategoryChange(tab));
    });
}

// Charger les liens sauvegardés depuis localStorage
function loadSavedLinks() {
    const savedLinks = localStorage.getItem('userLinks');
    if (savedLinks) {
        liens = [...defaultLinks, ...JSON.parse(savedLinks)];
        filteredLinks = [...liens];
    }
}

// Sauvegarder les liens dans localStorage
function saveLinks() {
    localStorage.setItem('userLinks', JSON.stringify(liens.filter(link => !defaultLinks.some(d => d.nom === link.nom))));
    updateStats();
    renderLinks();
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    if (currentCategory === 'trending') {
        filteredLinks = getTrendingLinks().filter(lien => 
            lien.nom.toLowerCase().includes(query) ||
            lien.description.toLowerCase().includes(query)
        );
    } else {
        filteredLinks = liens.filter(lien => 
            (currentCategory === 'all' || lien.category === currentCategory) &&
            (lien.nom.toLowerCase().includes(query) ||
             lien.description.toLowerCase().includes(query))
        );
    }
    renderLinks();
}

function handleCategoryChange(clickedTab) {
    categoryTabs.forEach(tab => tab.classList.remove('active'));
    clickedTab.classList.add('active');
    
    currentCategory = clickedTab.dataset.category;
    
    if (currentCategory === 'trending') {
        filteredLinks = getTrendingLinks();
    } else {
        const query = searchInput.value.toLowerCase();
        filteredLinks = liens.filter(lien => 
            (currentCategory === 'all' || lien.category === currentCategory) &&
            (lien.nom.toLowerCase().includes(query) ||
             lien.description.toLowerCase().includes(query))
        );
    }
    renderLinks();
}

function getTrendingLinks() {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    return liens.map(lien => {
        const voteDoc = db.collection('votes').doc(lien.nom);
        const recentVotes = voteDoc.get().then(doc => {
            if (doc.exists) {
                const votes = doc.data().votes || [];
                return votes.filter(timestamp => timestamp > fiveDaysAgo).length;
            }
            return 0;
        });
        return { ...lien, recentVotes: recentVotes };
    }).sort((a, b) => b.recentVotes - a.recentVotes);
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
        const voteDoc = await db.collection('votes').doc(lien.nom).get();
        const votes = voteDoc.data()?.votes || [];
        const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
        const recentVotes = votes.filter(timestamp => timestamp > fiveDaysAgo).length;
        
        const linkElement = document.createElement('a');
        linkElement.className = 'link-item';
        linkElement.href = lien.url;
        linkElement.target = '_blank';
        
        linkElement.innerHTML = `
            <div class="link-icon" style="background: ${lien.color}">
                ${lien.icon}
            </div>
            <div class="link-content">
                <div class="link-name">${lien.nom}</div>
                <div class="link-description">${lien.description}</div>
                <div class="link-votes">👍 ${recentVotes}</div>
            </div>
        `;
        
        const likeButton = document.createElement('button');
        likeButton.textContent = '👍';
        likeButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await voteForSite(lien);
        });
        linkElement.appendChild(likeButton);
        
        linkElement.addEventListener('click', (e) => handleLinkClick(lien, e));
        linksContainer.appendChild(linkElement);
    }
}

async function voteForSite(lien) {
    const user = auth.currentUser;
    if (!user) return;

    const voteDoc = await db.collection('votes').doc(lien.nom).get();
    const votes = voteDoc.data()?.votes || [];
    const userVote = votes.find(v => v.userId === user.uid);

    if (!userVote) {
        await db.collection('votes').doc(lien.nom).set({
            votes: [...votes, { userId: user.uid, timestamp: Date.now() }]
        }, { merge: true });
        showNotification(`Vous avez voté pour ${lien.nom}`, 'success');
        renderLinks();
    } else {
        showNotification(`Vous avez déjà voté pour ${lien.nom}.`, 'error');
    }
}

function handleLinkClick(lien, event) {
    clickCount++;
    localStorage.setItem('clickCount', clickCount.toString());
    updateStats();
    
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
function addSettingsButton() {
    const header = document.querySelector('.header');
    const settingsButton = document.createElement('button');
    settingsButton.innerHTML = '⚙️';
    settingsButton.className = 'settings-button';
    settingsButton.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    settingsButton.addEventListener('mouseover', () => {
        settingsButton.style.background = 'rgba(255, 255, 255, 0.3)';
        settingsButton.style.transform = 'scale(1.1)';
    });
    
    settingsButton.addEventListener('mouseout', () => {
        settingsButton.style.background = 'rgba(255, 255, 255, 0.2)';
        settingsButton.style.transform = 'scale(1)';
    });
    
    settingsButton.addEventListener('click', showSettingsModal);
    header.appendChild(settingsButton);
}

// Modal de paramètres
function showSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'settings-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 25px;
        border-radius: 15px;
        width: 300px;
        color: white;
        position: relative;
        animation: slideIn 0.3s ease;
    `;
    
    modalContent.innerHTML = `
        <h2 style="margin-bottom: 20px; text-align: center;">⚙️ Paramètres</h2>
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: 600;">Ajouter un lien :</label>
            <input type="text" id="newNom" placeholder="Nom" style="width: 100%; padding: 5px; margin-bottom: 5px; border: none; border-radius: 4px;">
            <input type="text" id="newUrl" placeholder="URL" style="width: 100%; padding: 5px; margin-bottom: 5px; border: none; border-radius: 4px;">
            <select id="newCategory" style="width: 100%; padding: 5px; margin-bottom: 5px; border: none; border-radius: 4px;">
                <option value="streaming">Streaming</option>
                <option value="tools">Outils</option>
                <option value="social">Social</option>
            </select>
            <input type="text" id="newIcon" placeholder="Icône (ex: 🎬)" style="width: 100%; padding: 5px; margin-bottom: 5px; border: none; border-radius: 4px;">
            <input type="text" id="newColor" placeholder="Couleur (ex: linear-gradient(...))" style="width: 100%; padding: 5px; margin-bottom: 5px; border: none; border-radius: 4px;">
            <input type="text" id="newDescription" placeholder="Description" style="width: 100%; padding: 5px; margin-bottom: 10px; border: none; border-radius: 4px;">
            <button id="addLink" style="width: 100%; padding: 5px; background: #27ae60; border: none; border-radius: 4px; color: white; cursor: pointer;">Ajouter</button>
        </div>
        <button id="resetLinks" style="width: 100%; padding: 10px; background: #e74c3c; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600;">Réinitialiser les liens</button>
        <button id="closeModal" style="position: absolute; top: 10px; right: 15px; background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Styles pour les animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Event listeners
    document.getElementById('closeModal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    document.getElementById('addLink').addEventListener('click', () => {
        const nom = document.getElementById('newNom').value.trim();
        const url = document.getElementById('newUrl').value.trim();
        const category = document.getElementById('newCategory').value;
        const icon = document.getElementById('newIcon').value || '🔗';
        const color = document.getElementById('newColor').value || 'linear-gradient(45deg, #6c5ce7, #a29bfe)';
        const description = document.getElementById('newDescription').value || 'Site web';

        if (nom && url) {
            liens.push({
                nom,
                url: url.startsWith('http') ? url : `https://${url}`,
                category,
                icon,
                color,
                description
            });
            saveLinks();
            showNotification('Lien ajouté avec succès!', 'success');
            document.getElementById('newNom').value = '';
            document.getElementById('newUrl').value = '';
            document.getElementById('newIcon').value = '';
            document.getElementById('newColor').value = '';
            document.getElementById('newDescription').value = '';
        } else {
            showNotification('Veuillez entrer un nom et une URL.', 'error');
        }
    });
    
    document.getElementById('resetLinks').addEventListener('click', () => {
        localStorage.removeItem('userLinks');
        liens = [...defaultLinks];
        filteredLinks = [...liens];
        updateStats();
        renderLinks();
        showNotification('Liens réinitialisés!', 'success');
        document.body.removeChild(modal);
    });
    
    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Système de notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 12px;
        font-weight: 600;
        z-index: 2000;
        animation: slideInRight 0.3s ease, slideOutRight 0.3s ease 2.7s forwards;
        max-width: 250px;
    `;
    
    const colors = {
        info: 'background: linear-gradient(45deg, #3498db, #2980b9)',
        success: 'background: linear-gradient(45deg, #27ae60, #229954)',
        error: 'background: linear-gradient(45deg, #e74c3c, #c0392b)'
    };
    
    notification.style.cssText += colors[type];
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
    
    // Styles pour l'animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    if (!document.head.querySelector('style[data-notifications]')) {
        style.setAttribute('data-notifications', 'true');
        document.head.appendChild(style);
    }
}

// Animation de particules
function setupParticles() {
    function createParticle() {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 3px;
            height: 3px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            pointer-events: none;
            animation: particle 3s linear forwards;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (document.body.contains(particle)) {
                document.body.removeChild(particle);
            }
        }, 3000);
    }

    // Style pour l'animation des particules
    const particleStyle = document.createElement('style');
    particleStyle.textContent = `
        @keyframes particle {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    
    if (!document.head.querySelector('style[data-particles]')) {
        particleStyle.setAttribute('data-particles', 'true');
        document.head.appendChild(particleStyle);
    }

    // Créer des particules de temps en temps
    setInterval(createParticle, 2000);
}

