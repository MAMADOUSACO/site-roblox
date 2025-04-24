/**
 * Gestion de l'affichage des vidéos
 * Contrôle l'affichage, le chargement et l'interaction avec les cartes vidéo
 */

import { 
    select, 
    selectAll, 
    onEvent, 
    createElement, 
    toggleClass,
    hasClass
  } from '../utils/dom-helpers.js';
  
  import { 
    getAllVideos, 
    getVideosByLevel,
    getPlaylistsByLevel,
    getVideoById,
    filterVideos,
    getSimilarVideos,
    LEVEL
  } from '../data/videos.js';
  
  import {
    getThumbnailUrl,
    extractVideoId
  } from '../utils/youtube-thumbnail.js';
  
  import modalManager from './modal.js';
  
  import {
    showLoader,
    hideLoader,
    setVideoCardLoading,
    unsetVideoCardLoading,
    toggleLoadMoreButton
  } from '../animations/loading-animation.js';
  
  // Configuration
  const CONFIG = {
    VIDEOS_PER_PAGE: 6,    // Nombre de vidéos à charger par page
    ANIMATION_DELAY: 100,  // Délai entre les animations d'apparition des cartes
    LAZY_LOAD_THRESHOLD: 0.1, // Seuil pour le chargement paresseux des images
    LOADING_DELAY: 300     // Délai minimal d'affichage du loader
  };
  
  // État du composant
  const state = {
    currentLevel: null,         // Niveau de difficulté actuel
    currentPage: 1,             // Page actuelle pour le chargement progressif
    currentLayout: 'grid',      // Disposition actuelle (grid ou masonry)
    activeFilters: {},          // Filtres actifs
    loadedVideos: new Set(),    // Ensemble des vidéos déjà chargées (pour éviter les doublons)
    isLoading: false,           // État de chargement
    currentSearch: '',          // Terme de recherche actuel
    videoObserver: null,        // Observateur d'intersection pour le chargement paresseux
    totalFilteredVideos: 0      // Nombre total de vidéos après filtrage
  };
  
  /**
   * Initialise le module d'affichage des vidéos
   */
  export const initVideoDisplay = () => {
    // Écoute les événements de changement de catégorie
    document.addEventListener('categoryChanged', handleCategoryChange);
    
    // Écoute les événements de chargement de contenu pour une catégorie
    document.addEventListener('categoryContent:load', handleCategoryContentLoad);
    
    // Écoute les événements de changement de filtres
    document.addEventListener('filters:changed', handleFiltersChange);
    
    // Écoute les clics sur les cartes vidéo
    onEvent('body', 'click', handleVideoCardClick);
    
    // Écoute les clics sur le bouton "Charger plus"
    onEvent('.load-more-btn', 'click', handleLoadMoreClick);
    
    // Écoute les clics sur le bouton de changement de mise en page
    onEvent('.grid-layout-btn', 'click', handleLayoutToggleClick);
    
    // Initialise l'observateur pour le chargement paresseux des images
    initLazyLoading();
    
    // Expose la fonction openVideoModal au niveau global pour permettre son utilisation
    // depuis d'autres composants (comme search.js)
    window.openVideoModal = openVideoModal;
  };
  
  /**
   * Initialise l'observateur pour le chargement paresseux des images
   */
  const initLazyLoading = () => {
    // Vérifie si l'API IntersectionObserver est disponible
    if ('IntersectionObserver' in window) {
      // Configuration de l'observateur
      const options = {
        root: null, // viewport
        rootMargin: '200px', // marge supplémentaire pour charger avant que l'élément soit visible
        threshold: CONFIG.LAZY_LOAD_THRESHOLD
      };
      
      // Fonction de callback pour l'intersection
      const onIntersect = (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const card = entry.target;
            const img = card.querySelector('.video-card__thumbnail img');
            const videoId = card.getAttribute('data-video-id');
            
            // Charge l'image si elle a un attribut data-src mais pas src
            if (img && img.getAttribute('data-src') && !img.src) {
              img.src = img.getAttribute('data-src');
              
              // Ajoute un gestionnaire pour la transition d'opacité
              img.addEventListener('load', () => {
                img.style.opacity = '1';
              });
            }
            
            // Stop d'observer cet élément
            observer.unobserve(card);
          }
        });
      };
      
      // Crée l'observateur
      state.videoObserver = new IntersectionObserver(onIntersect, options);
    }
  };
  
  /**
   * Gère le changement de catégorie
   * @param {CustomEvent} event - Événement personnalisé avec les détails de la catégorie
   */
  const handleCategoryChange = (event) => {
    const { category, level } = event.detail;
    
    // Met à jour l'état actuel
    state.currentLevel = level;
    state.currentPage = 1;
    state.loadedVideos = new Set();
    
    // Charge les vidéos pour cette catégorie
    loadVideosForCategory(level);
  };
  
  /**
   * Gère le chargement de contenu pour une catégorie
   * @param {CustomEvent} event - Événement personnalisé avec les détails du contenu
   */
  const handleCategoryContentLoad = (event) => {
    const { category, level, videos, playlists, container } = event.detail;
    
    // Si le conteneur n'est pas spécifié ou n'existe pas, on sort
    if (!container) return;
    
    // Met à jour l'état actuel
    state.currentLevel = level;
    state.currentPage = 1;
    state.loadedVideos = new Set();
    
    // Charge les vidéos dans le conteneur
    loadVideoCards(videos, container);
    
    // Si nous avons des playlists, les charger après les vidéos
    if (playlists && playlists.length > 0) {
      const playlistTitle = createElement('h3', {
        class: 'title-medium mt-5 mb-3 text-center scroll-fade-up'
      }, `Playlists pour ${getLevelDisplayName(level)}`);
      
      container.parentNode.appendChild(playlistTitle);
      
      const playlistGrid = createElement('div', {
        class: 'video-grid video-grid--masonry stagger-children'
      });
      
      container.parentNode.appendChild(playlistGrid);
      
      // Charge les playlists dans la grille
      loadPlaylistCards(playlists, playlistGrid);
    }
  };
  
  /**
   * Gère le changement de filtres
   * @param {CustomEvent} event - Événement personnalisé avec les détails des filtres
   */
  const handleFiltersChange = (event) => {
    const { filters } = event.detail;
    
    // Met à jour l'état des filtres
    state.activeFilters = filters;
    state.currentPage = 1;
    state.loadedVideos = new Set();
    
    // Applique les filtres aux vidéos
    applyFilters();
  };
  
  /**
   * Gère le clic sur une carte vidéo
   * @param {Event} event - Événement de clic
   */
  const handleVideoCardClick = (event) => {
    // Trouver la carte vidéo la plus proche (si elle existe)
    const videoCard = event.target.closest('.video-card');
    
    if (videoCard) {
      // Éviter le traitement si c'est un clic sur un lien interne
      if (event.target.tagName === 'A' && !event.target.classList.contains('video-card__link')) {
        return;
      }
      
      // Récupérer l'ID de la vidéo
      const videoId = videoCard.getAttribute('data-video-id');
      
      if (videoId) {
        // Empêcher le comportement par défaut (si c'est un lien)
        event.preventDefault();
        
        // Ouvrir la modale avec les détails de la vidéo
        openVideoModal(videoId);
      }
    }
  };
  
  /**
   * Gère le clic sur le bouton "Charger plus"
   * @param {Event} event - Événement de clic
   */
  const handleLoadMoreClick = (event) => {
    // Empêcher le comportement par défaut
    event.preventDefault();
    
    const button = event.currentTarget;
    
    // Afficher l'animation de chargement
    updateLoadMoreButtonState(button, true);
    
    // Incrémenter la page actuelle
    state.currentPage++;
    
    // Simuler un délai de chargement pour une meilleure expérience utilisateur
    setTimeout(() => {
      // Charger plus de vidéos
      if (state.activeFilters && Object.keys(state.activeFilters).length > 0) {
        // Si des filtres sont actifs, charger plus de vidéos filtrées
        loadFilteredVideos();
      } else {
        // Sinon, charger plus de vidéos pour la catégorie actuelle
        loadVideosForCategory(state.currentLevel, true);
      }
      
      // Masquer l'animation de chargement
      updateLoadMoreButtonState(button, false);
    }, CONFIG.LOADING_DELAY);
  };
  
  /**
   * Gère le clic sur un bouton de changement de mise en page
   * @param {Event} event - Événement de clic
   */
  const handleLayoutToggleClick = (event) => {
    const button = event.currentTarget;
    const layout = button.getAttribute('data-layout');
    
    if (layout && layout !== state.currentLayout) {
      // Mettre à jour l'état de la mise en page
      state.currentLayout = layout;
      
      // Mettre à jour les classes active des boutons
      const buttons = selectAll('.grid-layout-btn');
      buttons.forEach(btn => {
        toggleClass(btn, 'active', btn === button);
      });
      
      // Appliquer la nouvelle mise en page
      applyLayout(layout);
    }
  };
  
  /**
   * Applique une mise en page spécifique à la grille de vidéos
   * @param {string} layout - Type de mise en page ('grid' ou 'masonry')
   */
  const applyLayout = (layout) => {
    const videoGrids = selectAll('.video-grid');
    
    videoGrids.forEach(grid => {
      // Ajouter une classe pour l'animation de transition
      grid.classList.add('changing');
      
      // Attendre le prochain frame pour appliquer les changements
      requestAnimationFrame(() => {
        // Supprimer toutes les classes de mise en page
        grid.classList.remove('video-grid--masonry');
        
        // Ajouter la classe correspondant à la mise en page sélectionnée
        if (layout === 'masonry') {
          grid.classList.add('video-grid--masonry');
        }
        
        // Attendre la fin de la transition pour supprimer la classe d'animation
        setTimeout(() => {
          grid.classList.remove('changing');
        }, 300);
      });
    });
  };
  
  /**
   * Charge les vidéos pour une catégorie spécifique
   * @param {string} level - Niveau de difficulté (LEVEL.BEGINNER, etc.)
   * @param {boolean} [append=false] - Si true, ajoute les vidéos aux existantes
   */
  const loadVideosForCategory = (level, append = false) => {
    if (!level) return;
    
    // Récupère les vidéos pour ce niveau
    const videos = getVideosByLevel(level);
    
    // Calcule les vidéos à afficher pour cette page
    const startIndex = (state.currentPage - 1) * CONFIG.VIDEOS_PER_PAGE;
    const endIndex = startIndex + CONFIG.VIDEOS_PER_PAGE;
    const currentPageVideos = videos.slice(startIndex, endIndex);
    
    // Trouve le conteneur de la grille
    const container = select(`#${getLevelIdFromLevel(level)} .video-grid`);
    if (!container) return;
    
    // Affiche ou masque le bouton "Charger plus" en fonction du nombre de vidéos
    updateLoadMoreButtonState(container, endIndex < videos.length);
    
    // Si on ne doit pas ajouter aux vidéos existantes, vider le conteneur
    if (!append) {
      container.innerHTML = '';
    }
    
    // Charge les cartes vidéo
    loadVideoCards(currentPageVideos, container);
  };
  
  /**
   * Charge les cartes vidéo dans un conteneur
   * @param {Array} videos - Tableau d'objets vidéo
   * @param {Element} container - Conteneur où afficher les cartes
   */
  const loadVideoCards = (videos, container) => {
    if (!videos || !container) return;
    
    // Si aucune vidéo n'est trouvée, afficher un message
    if (videos.length === 0) {
      displayEmptyState(container);
      return;
    }
    
    // Pour chaque vidéo
    videos.forEach((video, index) => {
      // Vérifier si la vidéo est déjà chargée
      if (state.loadedVideos.has(video.id)) return;
      
      // Créer la carte vidéo
      const card = createVideoCard(video);
      
      // Ajouter la carte au conteneur
      container.appendChild(card);
      
      // Ajouter l'ID de la vidéo à la liste des vidéos chargées
      state.loadedVideos.add(video.id);
      
      // Observer la carte pour le chargement paresseux
      if (state.videoObserver) {
        state.videoObserver.observe(card);
      }
    });
  };
  
  /**
   * Charge les cartes de playlist dans un conteneur
   * @param {Array} playlists - Tableau d'objets playlist
   * @param {Element} container - Conteneur où afficher les cartes
   */
  const loadPlaylistCards = (playlists, container) => {
    if (!playlists || !container) return;
    
    // Pour chaque playlist
    playlists.forEach(playlist => {
      // Créer la carte de playlist
      const card = createPlaylistCard(playlist);
      
      // Ajouter la carte au conteneur
      container.appendChild(card);
      
      // Observer la carte pour le chargement paresseux
      if (state.videoObserver) {
        state.videoObserver.observe(card);
      }
    });
  };
  
  /**
   * Crée une carte vidéo
   * @param {Object} video - Objet vidéo
   * @returns {Element} Élément de carte vidéo
   */
  const createVideoCard = (video) => {
    // Créer l'élément principal de la carte
    const card = createElement('div', {
      class: 'video-card',
      dataset: {
        videoId: video.id,
        level: video.level
      }
    });
    
    // Créer la vignette
    const thumbnailUrl = video.thumbnailUrl || getThumbnailUrl(video.id);
    const thumbnailContainer = createElement('div', {
      class: 'video-card__thumbnail'
    });
    
    // Créer l'image avec chargement paresseux
    const img = createElement('img', {
      'data-src': thumbnailUrl,
      alt: video.title,
      style: 'opacity: 0; transition: opacity 0.3s ease;'
    });
    
    // Créer l'icône de lecture
    const playIcon = createElement('div', {
      class: 'video-card__play-icon'
    }, `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `);
    
    // Créer l'indicateur de durée
    const duration = createElement('div', {
      class: 'video-card__duration'
    }, video.duration || '');
    
    // Assembler la vignette
    thumbnailContainer.appendChild(img);
    thumbnailContainer.appendChild(playIcon);
    if (video.duration) {
      thumbnailContainer.appendChild(duration);
    }
    
    // Créer le contenu de la carte
    const content = createElement('div', {
      class: 'video-card__content'
    });
    
    // Créer le titre
    const title = createElement('h3', {
      class: 'video-card__title'
    }, video.title);
    
    // Créer l'info du créateur
    const creator = createElement('div', {
      class: 'video-card__creator'
    }, `
      <svg class="video-card__creator-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      ${video.creator}
    `);
    
    // Créer la description
    const description = createElement('div', {
      class: 'video-card__description'
    }, video.description);
    
    // Créer le footer de la carte
    const footer = createElement('div', {
      class: 'video-card__footer'
    });
    
    // Créer les statistiques (vues, date)
    const stats = createElement('div', {
      class: 'video-card__stats'
    });
    
    // Ajouter les vues si disponibles
    if (video.views) {
      const viewsStat = createElement('div', {
        class: 'video-card__stat'
      }, `
        <svg class="video-card__stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        ${video.views}
      `);
      stats.appendChild(viewsStat);
    }
    
    // Ajouter la date si disponible
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
    
    // Ajouter les statistiques au footer
    footer.appendChild(stats);
    
    // Ajouter le badge de niveau
    const badgeClass = `video-card__badge video-card__badge--${video.level}`;
    const badge = createElement('div', {
      class: badgeClass
    }, getLevelDisplayName(video.level));
    
    footer.appendChild(badge);
    
    // Assembler le contenu
    content.appendChild(title);
    content.appendChild(creator);
    content.appendChild(description);
    content.appendChild(footer);
    
    // Ajouter les tags si disponibles
    if (video.tags && video.tags.length > 0) {
      const tagsContainer = createElement('div', {
        class: 'video-card__tags'
      });
      
      video.tags.slice(0, 3).forEach(tag => {
        const tagElement = createElement('span', {
          class: 'video-card__tag'
        }, tag);
        tagsContainer.appendChild(tagElement);
      });
      
      content.appendChild(tagsContainer);
    }
    
    // Ajouter un lien clickable pour l'accessibilité
    const link = createElement('a', {
      class: 'video-card__link',
      href: video.url || `#video-${video.id}`,
      target: video.url ? '_blank' : '',
      rel: video.url ? 'noopener noreferrer' : '',
      'aria-label': `Voir la vidéo: ${video.title}`
    });
    
    // Assembler la carte
    card.appendChild(thumbnailContainer);
    card.appendChild(content);
    card.appendChild(link);
    
    return card;
  };
  
  /**
   * Crée une carte de playlist
   * @param {Object} playlist - Objet playlist
   * @returns {Element} Élément de carte de playlist
   */
  const createPlaylistCard = (playlist) => {
    // Créer l'élément principal de la carte
    const card = createElement('div', {
      class: 'video-card',
      dataset: {
        playlistId: playlist.id,
        level: playlist.level
      }
    });
    
    // Créer la vignette
    const thumbnailUrl = playlist.thumbnailUrl || (playlist.id.includes('youtube') ? getThumbnailUrl(extractVideoId(playlist.url)) : '');
    const thumbnailContainer = createElement('div', {
      class: 'video-card__thumbnail'
    });
    
    // Créer l'image avec chargement paresseux
    const img = createElement('img', {
      'data-src': thumbnailUrl,
      alt: playlist.title,
      style: 'opacity: 0; transition: opacity 0.3s ease;'
    });
    
    // Créer l'icône de lecture
    const playIcon = createElement('div', {
      class: 'video-card__play-icon'
    }, `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#ffffff">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `);
    
    // Assembler la vignette
    thumbnailContainer.appendChild(img);
    thumbnailContainer.appendChild(playIcon);
    
    // Créer le contenu de la carte
    const content = createElement('div', {
      class: 'video-card__content'
    });
    
    // Créer le titre
    const title = createElement('h3', {
      class: 'video-card__title'
    }, playlist.title);
    
    // Créer l'info du créateur
    const creator = createElement('div', {
      class: 'video-card__creator'
    }, `
      <svg class="video-card__creator-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      ${playlist.creator}
    `);
    
    // Créer la description
    const description = createElement('div', {
      class: 'video-card__description'
    }, playlist.description);
    
    // Créer le footer de la carte
    const footer = createElement('div', {
      class: 'video-card__footer'
    });
    
    // Créer les statistiques (nombre de vidéos)
    const stats = createElement('div', {
      class: 'video-card__stats'
    });
    
    // Ajouter le nombre de vidéos
    if (playlist.videoCount) {
      const videoCountStat = createElement('div', {
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
        ${playlist.videoCount} vidéos
      `);
      stats.appendChild(videoCountStat);
    }
    
    // Ajouter les vues si disponibles
    if (playlist.views) {
      const viewsStat = createElement('div', {
        class: 'video-card__stat'
      }, `
        <svg class="video-card__stat-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        ${playlist.views}
      `);
      stats.appendChild(viewsStat);
    }
    
    // Ajouter les statistiques au footer
    footer.appendChild(stats);
    
    // Ajouter le badge de niveau
    const badgeClass = `video-card__badge video-card__badge--${playlist.level}`;
    const badge = createElement('div', {
      class: badgeClass
    }, getLevelDisplayName(playlist.level));
    
    footer.appendChild(badge);
    
    // Assembler le contenu
    content.appendChild(title);
    content.appendChild(creator);
    content.appendChild(description);
    content.appendChild(footer);
    
    // Ajouter un lien clickable pour l'accessibilité
    const link = createElement('a', {
      class: 'video-card__link',
      href: playlist.url || `#playlist-${playlist.id}`,
      target: '_blank',
      rel: 'noopener noreferrer',
      'aria-label': `Voir la playlist: ${playlist.title}`
    });
    
    // Assembler la carte
    card.appendChild(thumbnailContainer);
    card.appendChild(content);
    card.appendChild(link);
    
    return card;
  };
  
  /**
   * Affiche un état vide lorsqu'aucune vidéo n'est trouvée
   * @param {Element} container - Conteneur où afficher l'état vide
   */
  const displayEmptyState = (container) => {
    // Créer l'élément d'état vide
    const emptyState = createElement('div', {
      class: 'video-grid-empty'
    });
    
    // Ajouter l'icône
    const icon = createElement('div', {
      class: 'video-grid-empty-icon'
    }, '🎬');
    
    // Ajouter le titre
    const title = createElement('div', {
      class: 'video-grid-empty-title'
    }, 'Aucune vidéo trouvée');
    
    // Ajouter le message
    const message = createElement('div', {
      class: 'video-grid-empty-message'
    }, 'Essayez d\'ajuster vos filtres ou de rechercher un autre terme.');
    
    // Assembler l'état vide
    emptyState.appendChild(icon);
    emptyState.appendChild(title);
    emptyState.appendChild(message);
    
    // Vider le conteneur et ajouter l'état vide
    container.innerHTML = '';
    container.appendChild(emptyState);
  };
  
  /**
   * Applique les filtres actifs aux vidéos
   */
  const applyFilters = () => {
    // Si aucun filtre n'est actif, revenir à l'affichage normal par catégorie
    if (!state.activeFilters || Object.keys(state.activeFilters).length === 0) {
      loadVideosForCategory(state.currentLevel);
      return;
    }
    
    // Filtrer les vidéos
    loadFilteredVideos();
  };
  
  /**
   * Charge les vidéos filtrées dans la grille
   */
  const loadFilteredVideos = () => {
    // Récupère le conteneur actif
    const activePane = select('.tab-pane.active');
    if (!activePane) return;
    
    const container = select('.video-grid', activePane);
    if (!container) return;
    
    // Affiche l'animation de chargement
    showLoader(container, 'filter-videos');
    
    // Récupère les vidéos filtrées
    const filteredVideos = filterVideos(state.activeFilters);
    
    // Met à jour le nombre total de vidéos filtrées
    state.totalFilteredVideos = filteredVideos.length;
    
    // Calcule les vidéos à afficher pour cette page
    const startIndex = (state.currentPage - 1) * CONFIG.VIDEOS_PER_PAGE;
    const endIndex = startIndex + CONFIG.VIDEOS_PER_PAGE;
    const currentPageVideos = filteredVideos.slice(startIndex, endIndex);
    
    // Vide le conteneur si c'est la première page
    if (state.currentPage === 1) {
      container.innerHTML = '';
    }
    
    // Masque l'animation de chargement après un délai minimal
    setTimeout(() => {
      hideLoader(container, 'filter-videos');
      
      // Affiche ou masque le bouton "Charger plus" en fonction du nombre de vidéos
      updateLoadMoreButtonState(container, endIndex < filteredVideos.length);
      
      // Charge les cartes vidéo
      loadVideoCards(currentPageVideos, container);
    }, CONFIG.LOADING_DELAY);
  };
  
  /**
   * Affiche ou masque le bouton "Charger plus"
   * @param {Element} container - Conteneur parent du bouton
   * @param {boolean} [show=true] - Si true, affiche le bouton
   */
  const updateLoadMoreButtonState = (container, show = true) => {
    if (!container) return;
    
    // Trouve le conteneur du bouton "Charger plus"
    let loadMoreContainer = select('.load-more-container', container.parentNode);
    
    // Si le conteneur n'existe pas et qu'on veut afficher le bouton, le créer
    if (!loadMoreContainer && show) {
      loadMoreContainer = createElement('div', {
        class: 'load-more-container'
      });
      
      const loadMoreBtn = createElement('button', {
        class: 'load-more-btn'
      }, `
        Charger plus de vidéos
        <div class="load-more-spinner"></div>
      `);
      
      loadMoreContainer.appendChild(loadMoreBtn);
      container.parentNode.appendChild(loadMoreContainer);
    }
    
    // Afficher ou masquer le conteneur
    if (loadMoreContainer) {
      loadMoreContainer.style.display = show ? 'flex' : 'none';
    }
  };
  
  /**
   * Ouvre la fenêtre modale pour une vidéo spécifique
   * @param {string} videoId - ID de la vidéo
   */
  export const openVideoModal = (videoId) => {
    // Récupère les données de la vidéo
    const video = getVideoById(videoId);
    
    if (!video) {
      console.error(`Vidéo avec l'ID "${videoId}" non trouvée`);
      return;
    }
    
    // Configuration de la modale vidéo
    const videoConfig = {
      id: video.id,
      videoId: video.id, // ID YouTube
      title: video.title,
      creator: video.creator,
      description: video.description,
      duration: video.duration,
      views: video.views,
      date: video.date,
      url: video.url,
      tags: video.tags,
      category: getLevelDisplayName(video.level),
      categoryDescription: getCategoryDescription(video.level),
      categoryUrl: `#${getLevelIdFromLevel(video.level)}`
    };
    
    // Ouvre la modale
    const modalInstance = modalManager.openVideoModal(videoConfig);
    
    // Charge les vidéos similaires
    loadSimilarVideos(videoId);
  };
  
  /**
   * Charge les vidéos similaires dans la modale
   * @param {string} videoId - ID de la vidéo de référence
   */
  const loadSimilarVideos = (videoId) => {
    // Récupère les vidéos similaires
    const similarVideos = getSimilarVideos(videoId);
    
    // Met à jour la modale avec les vidéos similaires
    modalManager.updateSimilarVideos(`video-modal-${videoId}`, similarVideos);
  };
  
  /**
   * Obtient une description de catégorie selon le niveau
   * @param {string} level - Niveau de difficulté
   * @returns {string} Description de la catégorie
   */
  const getCategoryDescription = (level) => {
    const descriptions = {
      [LEVEL.BEGINNER]: 'Tutoriels pour débutants, parfaits pour commencer à créer des interfaces UI dans ROBLOX.',
      [LEVEL.INTERMEDIATE]: 'Tutoriels de niveau intermédiaire pour approfondir vos connaissances en UI ROBLOX.',
      [LEVEL.ADVANCED]: 'Tutoriels avancés pour maîtriser les techniques professionnelles d\'UI dans ROBLOX.',
      [LEVEL.PRINCIPLES]: 'Principes fondamentaux du design d\'interface qui s\'appliquent à tous les environnements, y compris ROBLOX.'
    };
    
    return descriptions[level] || 'Tutoriels sur l\'UI dans ROBLOX.';
  };
  
  /**
   * Obtient l'ID d'élément HTML à partir du niveau
   * @param {string} level - Niveau de difficulté
   * @returns {string} ID d'élément HTML
   */
  const getLevelIdFromLevel = (level) => {
    const ids = {
      [LEVEL.BEGINNER]: 'debutants',
      [LEVEL.INTERMEDIATE]: 'intermediaires',
      [LEVEL.ADVANCED]: 'avances',
      [LEVEL.PRINCIPLES]: 'principes'
    };
    
    return ids[level] || '';
  };
  
  /**
   * Obtient le nom d'affichage d'un niveau
   * @param {string} level - Niveau de difficulté
   * @returns {string} Nom d'affichage
   */
  const getLevelDisplayName = (level) => {
    const names = {
      [LEVEL.BEGINNER]: 'Débutant',
      [LEVEL.INTERMEDIATE]: 'Intermédiaire',
      [LEVEL.ADVANCED]: 'Avancé',
      [LEVEL.PRINCIPLES]: 'Principes UI'
    };
    
    return names[level] || level;
  };
  
  // Exporte les fonctions publiques
  export default {
    initVideoDisplay,
    openVideoModal
  };