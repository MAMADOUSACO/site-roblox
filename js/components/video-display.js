/**
 * Gestion de l'affichage des vidéos dans l'application
 * Permet d'afficher, filtrer et interagir avec les cartes de vidéos
 */

import { select, selectAll, createElement, hasClass, toggleClass } from '../utils/dom-helpers.js';
import { getItem, setItem } from '../utils/local-storage.js';
import videosData, { LEVEL, getVideosByLevel, getPlaylistsByLevel, filterVideos, getSimilarVideos } from '../data/videos.js';
import modalManager from './modal.js';

/**
 * Configuration par défaut pour l'affichage des vidéos
 */
const defaultConfig = {
  itemsPerPage: 6,      // Nombre de vidéos par page
  animateEntrance: true, // Anime l'entrée des vidéos
  layout: 'grid',        // Type de mise en page (grid ou masonry)
  sortBy: 'default',     // Critère de tri (default, date, views)
  filter: null,          // Filtre par défaut
  category: 'debutants', // Catégorie par défaut
  emptyMessage: 'Aucune vidéo trouvée. Essayez de modifier vos critères de recherche.'
};

/**
 * Mapping des niveaux anglais vers français
 */
const levelMapping = {
  'beginner': 'debutants',
  'intermediate': 'intermediaires',
  'advanced': 'avances',
  'principles': 'principes'
};

/**
 * Mapping inverse des niveaux français vers anglais
 */
const levelMappingReverse = {
  'debutants': 'beginner',
  'intermediaires': 'intermediate',
  'avances': 'advanced',
  'principes': 'principles'
};

/**
 * Classe principale pour la gestion des vidéos
 */
class VideoDisplayManager {
  constructor(config = {}) {
    // Configuration
    this.config = { ...defaultConfig, ...config };
    
    // Nombre total de vidéos chargées par catégorie
    this.loadedCount = {
      debutants: 0,
      intermediaires: 0,
      avances: 0,
      principes: 0
    };
    
    // État actuel de l'affichage
    this.currentCategory = this.config.category;
    this.currentFilters = this.config.filter || {};
    this.currentSort = this.config.sortBy;
    this.currentLayout = this.config.layout;
    
    // Cache des éléments DOM fréquemment utilisés
    this.domElements = {
      videoGrids: {},
      loadMoreButtons: {},
      categoryTabs: null,
      categoryTabsHighlight: null
    };
    
    // Vidéos vues récemment (stockées dans localStorage)
    this.recentlyViewed = getItem('recentlyViewed', []);
    
    // Favoris (stockés dans localStorage)
    this.favorites = getItem('favoriteVideos', []);
    
    // Initialisation
    this.init();
  }
  
  /**
   * Initialise le gestionnaire d'affichage des vidéos
   */
  init() {
    // Cache les éléments DOM fréquemment utilisés
    this.cacheDomElements();
    
    // Initialise les onglets de catégories
    this.initCategoryTabs();
    
    // Charge les vidéos initiales
    this.loadInitialVideos();
    
    // Configure les écouteurs d'événements
    this.setupEventListeners();
  }
  
  /**
   * Met en cache les éléments DOM fréquemment utilisés
   */
  cacheDomElements() {
    // Grilles de vidéos pour chaque catégorie
    const tabs = selectAll('.tab-pane');
    tabs.forEach(tab => {
      const categoryId = tab.id;
      const videoGrid = select('.video-grid', tab);
      if (videoGrid) {
        this.domElements.videoGrids[categoryId] = videoGrid;
      }
      
      const loadMoreButton = select('.load-more-btn', tab);
      if (loadMoreButton) {
        this.domElements.loadMoreButtons[categoryId] = loadMoreButton;
      }
    });
    
    // Onglets de catégories
    this.domElements.categoryTabs = selectAll('.category-tab');
    this.domElements.categoryTabsHighlight = select('.category-tabs-highlight');
  }
  
  /**
   * Initialise les onglets de catégories
   */
  initCategoryTabs() {
    if (!this.domElements.categoryTabs || !this.domElements.categoryTabsHighlight) return;
    
    // Positionnement initial de la barre de surlignage
    const activeTab = select('.category-tab.active');
    if (activeTab) {
      this.updateCategoryTabHighlight(activeTab);
    }
  }
  
  /**
   * Met à jour la barre de surlignage des onglets
   * @param {HTMLElement} tabElement - Élément onglet actif
   */
  updateCategoryTabHighlight(tabElement) {
    if (!this.domElements.categoryTabsHighlight) return;
    
    const { width, left } = tabElement.getBoundingClientRect();
    const tabsContainer = tabElement.parentElement;
    const containerLeft = tabsContainer.getBoundingClientRect().left;
    
    // Position relative à partir de la gauche du conteneur
    const highlightLeft = left - containerLeft;
    
    // Mise à jour de la position et largeur
    this.domElements.categoryTabsHighlight.style.width = `${width}px`;
    this.domElements.categoryTabsHighlight.style.left = `${highlightLeft}px`;
  }
  
  /**
   * Charge les vidéos initiales pour la catégorie active
   */
  loadInitialVideos() {
    // Détermine la catégorie active
    const activePaneId = select('.tab-pane.active')?.id || this.currentCategory;
    
    // Charge les vidéos pour cette catégorie
    this.loadVideos(activePaneId);
  }
  
  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // Événements pour les onglets de catégories
    this.domElements.categoryTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        const categoryId = tab.getAttribute('data-category');
        this.switchCategory(categoryId);
      });
    });
    
    // Événements pour les boutons "Charger plus"
    Object.entries(this.domElements.loadMoreButtons).forEach(([categoryId, button]) => {
      button.addEventListener('click', () => {
        this.loadMoreVideos(categoryId);
      });
    });
    
    // Événement de changement de disposition
    selectAll('.grid-layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const layout = btn.getAttribute('data-layout');
        if (layout) {
          this.changeLayout(layout);
        }
      });
    });
    
    // Événement d'ajout aux favoris
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.add-bookmark');
      if (target) {
        const videoId = target.getAttribute('data-video-id');
        if (videoId) {
          this.toggleFavorite(videoId);
          
          // Met à jour le texte du bouton
          const isFavorite = this.favorites.includes(videoId);
          target.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            ${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          `;
        }
      }
    });
    
    // Événement de partage
    document.addEventListener('click', (e) => {
      const target = e.target.closest('.share-video');
      if (target) {
        const videoId = target.getAttribute('data-video-id');
        const videoUrl = target.getAttribute('data-video-url');
        if (videoUrl) {
          this.shareVideo(videoUrl);
        }
      }
    });
    
    // Événements pour les filtres
    const applyFiltersBtn = select('.filters-apply');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        const filters = this.collectFilters();
        this.applyFilters(filters);
      });
    }
    
    const clearFiltersBtn = select('.filters-clear');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
    
    // Gestion de la recherche
    const searchInput = select('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        
        // Cache/affiche le bouton de suppression
        const clearButton = select('.search-clear');
        if (clearButton) {
          toggleClass(clearButton, 'visible', searchTerm.length > 0);
        }
        
        // Effectue la recherche si au moins 3 caractères
        if (searchTerm.length >= 3) {
          this.search(searchTerm);
        } else if (searchTerm.length === 0) {
          // Réinitialise l'affichage
          this.resetSearch();
        }
      });
      
      // Bouton de suppression
      const clearSearchBtn = select('.search-clear');
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          toggleClass(clearSearchBtn, 'visible', false);
          this.resetSearch();
        });
      }
    }
  }
  
  /**
   * Change la catégorie active
   * @param {string} categoryId - Identifiant de la catégorie
   */
  switchCategory(categoryId) {
    // Vérifie si c'est déjà la catégorie active
    if (this.currentCategory === categoryId) return;
    
    // Met à jour la catégorie courante
    this.currentCategory = categoryId;
    
    // Met à jour les classes des onglets
    this.domElements.categoryTabs.forEach(tab => {
      const tabCategory = tab.getAttribute('data-category');
      toggleClass(tab, 'active', tabCategory === categoryId);
      
      // Met à jour le surlignage
      if (tabCategory === categoryId) {
        this.updateCategoryTabHighlight(tab);
      }
    });
    
    // Met à jour l'affichage des panneaux
    const tabPanes = selectAll('.tab-pane');
    tabPanes.forEach(pane => {
      toggleClass(pane, 'active', pane.id === categoryId);
    });
    
    // Charge les vidéos si elles n'ont pas encore été chargées
    if (this.loadedCount[categoryId] === 0) {
      this.loadVideos(categoryId);
    }
  }
  
  /**
   * Charge les vidéos pour une catégorie spécifique
   * @param {string} categoryId - Identifiant de la catégorie
   * @param {boolean} [append=false] - Si true, ajoute les vidéos au lieu de remplacer
   */
  loadVideos(categoryId, append = false) {
    // Vérifie si la catégorie est valide
    if (!categoryId || !this.domElements.videoGrids[categoryId]) return;
    
    // Conversion de la catégorie en niveau
    const level = levelMappingReverse[categoryId];
    if (!level) return;
    
    // Récupère les vidéos pour ce niveau
    const videos = getVideosByLevel(level);
    
    // Si aucune vidéo, affiche un message
    if (!videos || videos.length === 0) {
      this.showEmptyState(categoryId);
      return;
    }
    
    // Calcule le nombre de vidéos à charger
    const startIndex = append ? this.loadedCount[categoryId] : 0;
    const endIndex = startIndex + this.config.itemsPerPage;
    const videosToDiplay = videos.slice(startIndex, endIndex);
    
    // Si aucune vidéo à afficher, masque le bouton "Charger plus"
    if (videosToDiplay.length === 0) {
      this.hideLoadMoreButton(categoryId);
      return;
    }
    
    // Affiche les vidéos
    this.displayVideos(categoryId, videosToDiplay, append);
    
    // Met à jour le compteur de vidéos chargées
    this.loadedCount[categoryId] = endIndex;
    
    // Masque le bouton "Charger plus" si toutes les vidéos sont chargées
    if (endIndex >= videos.length) {
      this.hideLoadMoreButton(categoryId);
    } else {
      this.showLoadMoreButton(categoryId);
    }
    
    // Charge également les playlists si on vient de charger la première page
    if (startIndex === 0) {
      this.loadPlaylists(categoryId, level);
    }
  }
  
  /**
   * Charge les playlists pour une catégorie
   * @param {string} categoryId - Identifiant de la catégorie
   * @param {string} level - Niveau (beginner, intermediate, etc.)
   */
  loadPlaylists(categoryId, level) {
    // Récupère les playlists pour ce niveau
    const playlists = getPlaylistsByLevel(level);
    
    // Si aucune playlist, ne fait rien
    if (!playlists || playlists.length === 0) return;
    
    // Trouve le conteneur de playlists (différent de la grille vidéo normale)
    const playlistContainer = select('.video-grid--masonry', select(`#${categoryId}`));
    if (!playlistContainer) return;
    
    // Vide le conteneur si nécessaire
    if (!hasClass(playlistContainer, 'loaded')) {
      playlistContainer.innerHTML = '';
    }
    
    // Affiche les playlists
    playlists.forEach(playlist => {
      const playlistElement = this.createVideoCard(playlist, true);
      playlistContainer.appendChild(playlistElement);
    });
    
    // Marque le conteneur comme chargé
    toggleClass(playlistContainer, 'loaded', true);
  }
  
  /**
   * Charge plus de vidéos pour une catégorie
   * @param {string} categoryId - Identifiant de la catégorie
   */
  loadMoreVideos(categoryId) {
    // Affiche l'indicateur de chargement
    const loadMoreButton = this.domElements.loadMoreButtons[categoryId];
    if (loadMoreButton) {
      toggleClass(loadMoreButton, 'loading', true);
    }
    
    // Charge les vidéos supplémentaires avec un léger délai pour l'animation
    setTimeout(() => {
      this.loadVideos(categoryId, true);
      
      // Masque l'indicateur de chargement
      if (loadMoreButton) {
        toggleClass(loadMoreButton, 'loading', false);
      }
    }, 500);
  }
  
  /**
   * Affiche les vidéos dans une grille
   * @param {string} categoryId - Identifiant de la catégorie
   * @param {Array} videos - Tableau d'objets vidéo
   * @param {boolean} [append=false] - Si true, ajoute les vidéos au lieu de remplacer
   */
  displayVideos(categoryId, videos, append = false) {
    const videoGrid = this.domElements.videoGrids[categoryId];
    if (!videoGrid) return;
    
    // Vide la grille si on ne fait pas d'ajout
    if (!append) {
      videoGrid.innerHTML = '';
    }
    
    // Animation d'apparition de la grille
    if (this.config.animateEntrance && !append) {
      toggleClass(videoGrid, 'changing', true);
      setTimeout(() => {
        toggleClass(videoGrid, 'changing', false);
      }, 300);
    }
    
    // Crée et ajoute les cartes de vidéos
    videos.forEach((video, index) => {
      const videoCard = this.createVideoCard(video);
      
      // Ajoute un délai d'animation proportionnel à l'index
      if (this.config.animateEntrance) {
        videoCard.style.animationDelay = `${0.1 + index * 0.05}s`;
      }
      
      videoGrid.appendChild(videoCard);
    });
  }
  
  /**
   * Crée une carte de vidéo à partir des données
   * @param {Object} video - Données de la vidéo
   * @param {boolean} [isPlaylist=false] - Si true, crée une carte de playlist
   * @returns {HTMLElement} Élément de la carte de vidéo
   */
  createVideoCard(video, isPlaylist = false) {
    // Conteneur principal
    const card = createElement('div', {
      class: 'video-card',
      'data-video-id': video.id
    });
    
    // Vignette
    const thumbnail = createElement('div', {
      class: 'video-card__thumbnail'
    });
    
    // Image de la vignette
    const thumbnailImg = createElement('img', {
      src: video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`,
      alt: video.title
    });
    
    // Icône de lecture
    const playIcon = createElement('div', {
      class: 'video-card__play-icon'
    }, `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `);
    
    // Durée (pour les vidéos individuelles)
    let durationElement = null;
    if (!isPlaylist && video.duration) {
      durationElement = createElement('div', {
        class: 'video-card__duration'
      }, video.duration);
    }
    
    // Contenu
    const content = createElement('div', {
      class: 'video-card__content'
    });
    
    // Titre
    const title = createElement('h3', {
      class: 'video-card__title'
    }, video.title);
    
    // Créateur
    const creator = createElement('div', {
      class: 'video-card__creator'
    }, `
      <svg class="video-card__creator-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      ${video.creator}
    `);
    
    // Description
    const description = createElement('div', {
      class: 'video-card__description'
    }, video.description);
    
    // Pied de carte
    const footer = createElement('div', {
      class: 'video-card__footer'
    });
    
    // Statistiques
    const stats = createElement('div', {
      class: 'video-card__stats'
    });
    
    // Pour les playlists, affiche le nombre de vidéos
    if (isPlaylist && video.videoCount) {
      const playlistStat = createElement('div', {
        class: 'video-card__stat'
      }, `
        <svg class="video-card__stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
          <line x1="7" y1="2" x2="7" y2="22"></line>
          <line x1="17" y1="2" x2="17" y2="22"></line>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <line x1="2" y1="7" x2="7" y2="7"></line>
          <line x1="2" y1="17" x2="7" y2="17"></line>
          <line x1="17" y1="17" x2="22" y2="17"></line>
          <line x1="17" y1="7" x2="22" y2="7"></line>
        </svg>
        ${video.videoCount} vidéos
      `);
      
      stats.appendChild(playlistStat);
    } else {
      // Pour les vidéos individuelles, affiche les vues et la date
      if (video.views) {
        const viewsStat = createElement('div', {
          class: 'video-card__stat'
        }, `
          <svg class="video-card__stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          ${video.views} vues
        `);
        
        stats.appendChild(viewsStat);
      }
      
      if (video.date) {
        const dateStat = createElement('div', {
          class: 'video-card__stat'
        }, `
          <svg class="video-card__stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          ${video.date}
        `);
        
        stats.appendChild(dateStat);
      }
    }
    
    footer.appendChild(stats);
    
    // Badge de niveau
    const badgeClass = `video-card__badge video-card__badge--${video.level}`;
    const badgeText = levelMapping[video.level] ? levelMapping[video.level].charAt(0).toUpperCase() + levelMapping[video.level].slice(1) : 'Général';
    
    const badge = createElement('div', {
      class: badgeClass
    }, badgeText);
    
    footer.appendChild(badge);
    
    // Lien vers la vidéo
    const link = createElement('a', {
      href: video.url || `#video-${video.id}`,
      class: 'video-card__link',
      target: '_blank',
      rel: 'noopener noreferrer'
    }, video.title);
    
    // Assemblage de la carte
    thumbnail.appendChild(thumbnailImg);
    thumbnail.appendChild(playIcon);
    if (durationElement) {
      thumbnail.appendChild(durationElement);
    }
    
    content.appendChild(title);
    content.appendChild(creator);
    content.appendChild(description);
    content.appendChild(footer);
    
    card.appendChild(thumbnail);
    card.appendChild(content);
    card.appendChild(link);
    
    // Événement au clic
    card.addEventListener('click', (e) => {
      // Évite de déclencher si on clique sur le lien externe
      if (e.target.tagName !== 'A' && !e.target.closest('a[target="_blank"]')) {
        e.preventDefault();
        this.openVideoDetails(video);
      }
    });
    
    return card;
  }
  
  /**
   * Ouvre la modale de détails pour une vidéo
   * @param {Object} video - Données de la vidéo
   */
  openVideoDetails(video) {
    // Ajoute la vidéo aux vidéos récemment vues
    this.addToRecentlyViewed(video.id);
    
    // Récupère des vidéos similaires
    const similarVideos = getSimilarVideos(video.id, 4);
    
    // Ouvre la modale
    const modalInstance = modalManager.openVideoModal(video);
    
    // Met à jour les vidéos similaires
    if (modalInstance) {
      modalManager.updateSimilarVideos(modalInstance.id, similarVideos);
      
      // Met à jour le bouton favoris
      const bookmarkButton = select('.add-bookmark', modalInstance.element);
      if (bookmarkButton) {
        const isFavorite = this.favorites.includes(video.id);
        bookmarkButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          ${isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        `;
      }
    }
  }
  
  /**
   * Ajoute une vidéo aux vidéos récemment vues
   * @param {string} videoId - Identifiant de la vidéo
   */
  addToRecentlyViewed(videoId) {
    // Si la vidéo est déjà dans la liste, la retire
    const index = this.recentlyViewed.indexOf(videoId);
    if (index !== -1) {
      this.recentlyViewed.splice(index, 1);
    }
    
    // Ajoute la vidéo au début de la liste
    this.recentlyViewed.unshift(videoId);
    
    // Limite la liste à 10 vidéos
    if (this.recentlyViewed.length > 10) {
      this.recentlyViewed.pop();
    }
    
    // Enregistre dans le localStorage
    setItem('recentlyViewed', this.recentlyViewed);
  }
  
  /**
   * Ajoute ou retire une vidéo des favoris
   * @param {string} videoId - Identifiant de la vidéo
   * @returns {boolean} True si la vidéo a été ajoutée, false si elle a été retirée
   */
  toggleFavorite(videoId) {
    const index = this.favorites.indexOf(videoId);
    
    if (index === -1) {
      // Ajoute aux favoris
      this.favorites.push(videoId);
      setItem('favoriteVideos', this.favorites);
      return true;
    } else {
      // Retire des favoris
      this.favorites.splice(index, 1);
      setItem('favoriteVideos', this.favorites);
      return false;
    }
  }
  
  /**
   * Partage une vidéo
   * @param {string} videoUrl - URL de la vidéo
   */
  shareVideo(videoUrl) {
    // Vérifie si l'API de partage est disponible
    if (navigator.share) {
      navigator.share({
        title: 'Tutoriel UI ROBLOX',
        text: 'Regarde ce tutoriel sur la création d\'interfaces UI dans ROBLOX!',
        url: videoUrl
      })
      .catch(error => {
        console.warn('Erreur lors du partage:', error);
        this.fallbackShare(videoUrl);
      });
    } else {
      // Méthode de secours si l'API n'est pas disponible
      this.fallbackShare(videoUrl);
    }
  }
  
  /**
   * Méthode de secours pour le partage
   * @param {string} url - URL à partager
   */
  fallbackShare(url) {
    // Copie l'URL dans le presse-papier
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('URL copiée dans le presse-papier!');
      })
      .catch(() => {
        // Si la copie échoue, affiche l'URL pour copie manuelle
        prompt('Copiez cette URL pour partager:', url);
      });
  }
  
  /**
   * Change la disposition des vidéos
   * @param {string} layout - Type de disposition ('grid' ou 'masonry')
   */
  changeLayout(layout) {
    // Vérifie si c'est déjà la disposition active
    if (this.currentLayout === layout) return;
    
    // Met à jour la disposition courante
    this.currentLayout = layout;
    
    // Met à jour les classes des boutons
    selectAll('.grid-layout-btn').forEach(btn => {
      const btnLayout = btn.getAttribute('data-layout');
      toggleClass(btn, 'active', btnLayout === layout);
    });
    
    // Met à jour les grilles
    Object.values(this.domElements.videoGrids).forEach(grid => {
      // Animation de transition
      toggleClass(grid, 'changing', true);
      
      setTimeout(() => {
        // Supprime les anciennes classes de disposition
        grid.classList.remove('video-grid--masonry', 'video-grid--grid');
        
        // Ajoute la nouvelle classe
        if (layout === 'masonry') {
          grid.classList.add('video-grid--masonry');
        } else {
          grid.classList.add('video-grid--grid');
        }
        
        // Fin de l'animation
        toggleClass(grid, 'changing', false);
      }, 300);
    });
  }
  
  /**
   * Effectue une recherche de vidéos
   * @param {string} query - Terme de recherche
   */
  search(query) {
    // Affiche l'indicateur de chargement
    const searchLoading = select('.search-loading');
    if (searchLoading) {
      toggleClass(searchLoading, 'visible', true);
    }
    
    // Simule un délai de recherche (à remplacer par la vraie recherche)
    setTimeout(() => {
      // Recherche dans videos.js
      const searchResults = videosData.searchVideos(query);
      
      // Affiche les résultats
      this.displaySearchResults(searchResults);
      
      // Cache l'indicateur de chargement
      if (searchLoading) {
        toggleClass(searchLoading, 'visible', false);
      }
    }, 300);
  }
  
  /**
   * Affiche les résultats de recherche
   * @param {Array} results - Résultats de recherche
   */
  displaySearchResults(results) {
    const resultsContainer = select('.search-results');
    if (!resultsContainer) return;
    
    // Vide le conteneur
    resultsContainer.innerHTML = '';
    
    // Si aucun résultat, affiche un message
    if (!results || results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-results-empty">
          <div class="search-results-empty-icon">🔍</div>
          <h3 class="search-results-empty-title">Aucun résultat trouvé</h3>
          <p class="search-results-empty-message">Essayez d'autres termes ou consultez les catégories.</p>
        </div>
      `;
    } else {
      // Crée les éléments pour chaque résultat
      results.forEach(result => {
        const resultItem = createElement('div', {
          class: 'search-result-item',
          dataset: { videoId: result.id }
        });
        
        // Vignette
        const thumbnail = createElement('div', {
          class: 'search-result-thumbnail'
        }, `<img src="${result.thumbnailUrl || `https://i.ytimg.com/vi/${result.id}/mqdefault.jpg`}" alt="${result.title}">`);
        
        // Contenu
        const content = createElement('div', {
          class: 'search-result-content'
        });
        
        // Titre
        const title = createElement('div', {
          class: 'search-result-title'
        }, result.title);
        
        // Informations
        const info = createElement('div', {
          class: 'search-result-info'
        });
        
        // Catégorie
        const category = createElement('span', {
          class: 'search-result-category'
        }, levelMapping[result.level] ? levelMapping[result.level].charAt(0).toUpperCase() + levelMapping[result.level].slice(1) : 'Général');
        
        // Créateur
        const creator = document.createTextNode(result.creator);
        
        // Séparateur
        const separator = createElement('span', {
          class: 'search-result-separator'
        }, '•');
        
        // Vues
        const views = document.createTextNode(result.views || '');
        
        // Assemblage des infos
        info.appendChild(category);
        info.appendChild(document.createTextNode(' '));
        info.appendChild(creator);
        
        if (result.views) {
          info.appendChild(separator);
          info.appendChild(views);
        }
        
        // Assemblage du contenu
        content.appendChild(title);
        content.appendChild(info);
        
        // Assemblage de l'élément résultat
        resultItem.appendChild(thumbnail);
        resultItem.appendChild(content);
        
        // Événement au clic
        resultItem.addEventListener('click', () => {
          // Ferme les résultats de recherche
          toggleClass(resultsContainer, 'visible', false);
          
          // Ouvre les détails de la vidéo
          this.openVideoDetails(result);
        });
        
        resultsContainer.appendChild(resultItem);
      });
    }
    
    // Affiche les résultats
    toggleClass(resultsContainer, 'visible', true);
  }
  
  /**
   * Réinitialise la recherche
   */
  resetSearch() {
    const resultsContainer = select('.search-results');
    if (resultsContainer) {
      toggleClass(resultsContainer, 'visible', false);
    }
  }
  
  /**
   * Collecte les filtres actifs
   * @returns {Object} Objet contenant les filtres actifs
   */
  collectFilters() {
    const filters = {};
    
    // Filtres par niveau
    const levelInputs = selectAll('input[type="checkbox"][value^="beginner"], input[type="checkbox"][value^="intermediate"], input[type="checkbox"][value^="advanced"], input[type="checkbox"][value^="principles"]');
    const selectedLevels = Array.from(levelInputs)
      .filter(input => input.checked)
      .map(input => input.value);
    
    if (selectedLevels.length > 0) {
      filters.level = selectedLevels.length === 1 ? selectedLevels[0] : selectedLevels;
    }
    
    // Filtres par créateur
    const creatorInputs = selectAll('input[type="checkbox"][value^="roblox-visuals"], input[type="checkbox"][value^="alvinblox"], input[type="checkbox"][value^="ezpi"]');
    const selectedCreators = Array.from(creatorInputs)
      .filter(input => input.checked)
      .map(input => input.value);
    
    if (selectedCreators.length > 0) {
      filters.creator = selectedCreators.length === 1 ? selectedCreators[0] : selectedCreators;
    }
    
    // Filtre par durée
    const durationInput = select('input[name="duration"]:checked');
    if (durationInput && durationInput.value) {
      filters.duration = durationInput.value;
    }
    
    // Filtre par date
    const activeDateFilter = select('.filter-tag.active:not(:first-child)');
    if (activeDateFilter) {
      const dateText = activeDateFilter.textContent.trim().toLowerCase();
      
      if (dateText.includes('dernier mois')) {
        filters.date = 'month';
      } else if (dateText.includes('derniers 6 mois')) {
        filters.date = 'six-months';
      } else if (dateText.includes('dernière année')) {
        filters.date = 'year';
      } else if (dateText.includes('plus d\'un an')) {
        filters.date = 'older';
      }
    }
    
    return filters;
  }
  
  /**
   * Applique les filtres aux vidéos
   * @param {Object} filters - Filtres à appliquer
   */
  applyFilters(filters) {
    // Met à jour les filtres actuels
    this.currentFilters = filters;
    
    // Applique les filtres à toutes les catégories
    Object.keys(this.loadedCount).forEach(categoryId => {
      // Réinitialise le compte de vidéos chargées
      this.loadedCount[categoryId] = 0;
      
      // Convertit la catégorie en niveau
      const level = levelMappingReverse[categoryId];
      if (!level) return;
      
      // Récupère les vidéos filtrées
      const filteredVideos = filterVideos({ ...filters, level });
      
      // Affiche les vidéos
      const videoGrid = this.domElements.videoGrids[categoryId];
      if (videoGrid) {
        // Vide la grille
        videoGrid.innerHTML = '';
        
        // Si aucune vidéo, affiche un message
        if (!filteredVideos || filteredVideos.length === 0) {
          this.showEmptyState(categoryId);
          return;
        }
        
        // Calcule le nombre de vidéos à charger
        const videosToDiplay = filteredVideos.slice(0, this.config.itemsPerPage);
        
        // Affiche les vidéos
        this.displayVideos(categoryId, videosToDiplay, false);
        
        // Met à jour le compteur de vidéos chargées
        this.loadedCount[categoryId] = Math.min(this.config.itemsPerPage, filteredVideos.length);
        
        // Masque le bouton "Charger plus" si toutes les vidéos sont chargées
        if (this.loadedCount[categoryId] >= filteredVideos.length) {
          this.hideLoadMoreButton(categoryId);
        } else {
          this.showLoadMoreButton(categoryId);
        }
      }
    });
    
    // Affiche les filtres actifs
    this.updateActiveFiltersDisplay(filters);
    
    // Ferme le panneau de filtres
    const filtersPanel = select('.filters-panel');
    if (filtersPanel) {
      toggleClass(filtersPanel, 'visible', false);
    }
    
    // Met à jour le compteur de filtres
    const filtersCount = Object.keys(filters).length;
    const filtersToggleCount = select('.filters-toggle-count');
    if (filtersToggleCount) {
      filtersToggleCount.textContent = filtersCount;
      toggleClass(filtersToggleCount, 'active', filtersCount > 0);
    }
  }
  
  /**
   * Met à jour l'affichage des filtres actifs
   * @param {Object} filters - Filtres actifs
   */
  updateActiveFiltersDisplay(filters) {
    const activeFiltersContainer = select('.active-filters');
    if (!activeFiltersContainer) return;
    
    // Vide le conteneur
    activeFiltersContainer.innerHTML = '';
    
    // Si aucun filtre, masque le conteneur
    if (!filters || Object.keys(filters).length === 0) {
      activeFiltersContainer.style.display = 'none';
      return;
    }
    
    // Affiche le conteneur
    activeFiltersContainer.style.display = 'flex';
    
    // Crée les éléments pour chaque filtre
    Object.entries(filters).forEach(([key, value]) => {
      let filterName, filterValue;
      
      switch (key) {
        case 'level':
          filterName = 'Niveau';
          filterValue = Array.isArray(value) 
            ? value.map(v => this.getReadableFilterValue(v, key)).join(', ')
            : this.getReadableFilterValue(value, key);
          break;
        case 'creator':
          filterName = 'Créateur';
          filterValue = Array.isArray(value)
            ? value.map(v => this.getReadableFilterValue(v, key)).join(', ')
            : this.getReadableFilterValue(value, key);
          break;
        case 'duration':
          filterName = 'Durée';
          filterValue = this.getReadableFilterValue(value, key);
          break;
        case 'date':
          filterName = 'Date';
          filterValue = this.getReadableFilterValue(value, key);
          break;
        default:
          filterName = key;
          filterValue = value;
      }
      
      const filterItem = createElement('div', {
        class: 'active-filter',
        dataset: { filterKey: key, filterValue: value }
      });
      
      const filterText = document.createTextNode(`${filterName}: ${filterValue}`);
      
      const removeButton = createElement('span', {
        class: 'active-filter-remove',
        title: 'Supprimer ce filtre',
        dataset: { filterKey: key }
      }, `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `);
      
      // Événement au clic sur le bouton de suppression
      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const filterKey = e.currentTarget.getAttribute('data-filter-key');
        
        // Supprime le filtre
        delete this.currentFilters[filterKey];
        
        // Réapplique les filtres
        this.applyFilters(this.currentFilters);
      });
      
      filterItem.appendChild(filterText);
      filterItem.appendChild(removeButton);
      
      activeFiltersContainer.appendChild(filterItem);
    });
    
    // Bouton pour supprimer tous les filtres
    if (Object.keys(filters).length > 0) {
      const clearAllButton = createElement('button', {
        class: 'clear-all-filters'
      }, 'Effacer tout');
      
      // Événement au clic
      clearAllButton.addEventListener('click', () => {
        this.clearFilters();
      });
      
      activeFiltersContainer.appendChild(clearAllButton);
    }
  }
  
  /**
   * Obtient une valeur lisible pour un filtre
   * @param {string} value - Valeur du filtre
   * @param {string} key - Clé du filtre
   * @returns {string} Valeur lisible
   */
  getReadableFilterValue(value, key) {
    switch (key) {
      case 'level':
        const levelNames = {
          'beginner': 'Débutant',
          'intermediate': 'Intermédiaire',
          'advanced': 'Avancé',
          'principles': 'Principes UI'
        };
        return levelNames[value] || value;
        
      case 'creator':
        // Convertit roblox-visuals en Roblox Visuals
        return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
      case 'duration':
        const durationNames = {
          'short': 'Courte (< 10 min)',
          'medium': 'Moyenne (10-20 min)',
          'long': 'Longue (> 20 min)'
        };
        return durationNames[value] || value;
        
      case 'date':
        const dateNames = {
          'month': 'Dernier mois',
          'six-months': 'Derniers 6 mois',
          'year': 'Dernière année',
          'older': 'Plus d\'un an'
        };
        return dateNames[value] || value;
        
      default:
        return value;
    }
  }
  
  /**
   * Efface tous les filtres
   */
  clearFilters() {
    // Décoche toutes les cases à cocher
    selectAll('input[type="checkbox"]').forEach(input => {
      input.checked = false;
    });
    
    // Réinitialise les boutons radio
    const defaultRadio = select('input[name="duration"][value=""]');
    if (defaultRadio) {
      defaultRadio.checked = true;
    }
    
    // Réinitialise les tags de date
    const dateTags = selectAll('.filter-tag');
    dateTags.forEach((tag, index) => {
      toggleClass(tag, 'active', index === 0);
    });
    
    // Réinitialise les filtres actuels
    this.currentFilters = {};
    
    // Recharge les vidéos pour toutes les catégories
    Object.keys(this.loadedCount).forEach(categoryId => {
      this.loadedCount[categoryId] = 0;
      this.loadVideos(categoryId);
    });
    
    // Vide l'affichage des filtres actifs
    const activeFiltersContainer = select('.active-filters');
    if (activeFiltersContainer) {
      activeFiltersContainer.innerHTML = '';
      activeFiltersContainer.style.display = 'none';
    }
    
    // Réinitialise le compteur de filtres
    const filtersToggleCount = select('.filters-toggle-count');
    if (filtersToggleCount) {
      filtersToggleCount.textContent = '0';
      toggleClass(filtersToggleCount, 'active', false);
    }
    
    // Ferme le panneau de filtres
    const filtersPanel = select('.filters-panel');
    if (filtersPanel) {
      toggleClass(filtersPanel, 'visible', false);
    }
  }
  
  /**
   * Affiche un état vide pour une catégorie
   * @param {string} categoryId - Identifiant de la catégorie
   */
  showEmptyState(categoryId) {
    const videoGrid = this.domElements.videoGrids[categoryId];
    if (!videoGrid) return;
    
    // Crée l'élément d'état vide
    const emptyState = createElement('div', {
      class: 'video-grid-empty'
    }, `
      <div class="video-grid-empty-icon">🎬</div>
      <h3 class="video-grid-empty-title">Aucune vidéo trouvée</h3>
      <p class="video-grid-empty-message">${this.config.emptyMessage}</p>
      <button class="btn btn-primary reset-filters">Réinitialiser les filtres</button>
    `);
    
    // Événement au clic sur le bouton de réinitialisation
    const resetButton = select('.reset-filters', emptyState);
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        this.clearFilters();
      });
    }
    
    // Vide la grille et ajoute l'état vide
    videoGrid.innerHTML = '';
    videoGrid.appendChild(emptyState);
    
    // Masque le bouton "Charger plus"
    this.hideLoadMoreButton(categoryId);
  }
  
  /**
   * Masque le bouton "Charger plus" pour une catégorie
   * @param {string} categoryId - Identifiant de la catégorie
   */
  hideLoadMoreButton(categoryId) {
    const loadMoreButton = this.domElements.loadMoreButtons[categoryId];
    if (loadMoreButton) {
      loadMoreButton.style.display = 'none';
    }
  }
  
  /**
   * Affiche le bouton "Charger plus" pour une catégorie
   * @param {string} categoryId - Identifiant de la catégorie
   */
  showLoadMoreButton(categoryId) {
    const loadMoreButton = this.domElements.loadMoreButtons[categoryId];
    if (loadMoreButton) {
      loadMoreButton.style.display = 'flex';
    }
  }
}

// Crée et exporte une instance unique du gestionnaire d'affichage des vidéos
const videoDisplayManager = new VideoDisplayManager();

export default videoDisplayManager;