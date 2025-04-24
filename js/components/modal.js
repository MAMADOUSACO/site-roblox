/**
 * Gestion des fenêtres modales dans l'application
 * Permet de créer, ouvrir, fermer et manipuler des fenêtres modales
 * avec support pour les modales de vidéo, contenu dynamique, etc.
 */

import { select, selectAll, onEvent, createElement, toggleClass } from '../utils/dom-helpers.js';
import { parseYoutubeUrl, buildYoutubeUrl } from '../utils/url-parser.js';

/**
 * Configuration par défaut des modales
 */
const defaultConfig = {
  title: '',
  content: '',
  closeButton: true,
  animation: true,
  overlay: true,
  persistent: false, // Si true, ne peut pas être fermée en cliquant sur l'overlay
  onOpen: null,
  onClose: null,
  video: null, // Configuration pour les modales vidéo
  buttons: [] // Boutons personnalisés pour le pied de page
};

/**
 * Classe principale pour gérer les modales
 */
class ModalManager {
  constructor() {
    // Initialisation des propriétés
    this.modals = new Map(); // Stocke les instances de modales par ID
    this.activeModal = null; // Référence à la modale active
    this.overlay = null; // Élément overlay
    this.isTransitioning = false; // Flag pour éviter les transitions simultanées
    
    // Initialise le gestionnaire
    this.init();
  }
  
  /**
   * Initialise le gestionnaire de modales
   */
  init() {
    // Crée l'overlay si nécessaire
    this.createOverlay();
    
    // Initialise les événements globaux
    this.setupGlobalEvents();
    
    // Initialise les modales existantes
    this.initExistingModals();
  }
  
  /**
   * Crée l'élément overlay pour les modales
   */
  createOverlay() {
    // Vérifie si l'overlay existe déjà
    this.overlay = select('.modal-overlay');
    
    if (!this.overlay) {
      // Crée l'élément overlay
      this.overlay = createElement('div', {
        class: 'modal-overlay'
      });
      
      // Ajoute l'overlay au body
      document.body.appendChild(this.overlay);
      
      // Ajoute l'événement de clic pour fermer les modales non persistantes
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay && this.activeModal) {
          const modalInstance = this.modals.get(this.activeModal.id);
          
          if (modalInstance && !modalInstance.config.persistent) {
            this.close(this.activeModal.id);
          }
        }
      });
    }
  }
  
  /**
   * Configure les événements globaux
   */
  setupGlobalEvents() {
    // Ferme la modale active avec la touche Echap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        const modalInstance = this.modals.get(this.activeModal.id);
        
        if (modalInstance && !modalInstance.config.persistent) {
          this.close(this.activeModal.id);
        }
      }
    });
    
    // Écoute les clics sur les déclencheurs de modales
    onEvent('[data-modal-trigger]', 'click', (e) => {
      e.preventDefault();
      
      const modalId = e.currentTarget.getAttribute('data-modal-trigger');
      if (modalId) {
        this.open(modalId);
      }
    });
    
    // Écoute les clics sur les boutons de fermeture de modales
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-close]') || e.target.closest('[data-modal-close]')) {
        e.preventDefault();
        
        const modalElement = e.target.closest('.modal');
        if (modalElement) {
          this.close(modalElement.id);
        } else if (this.activeModal) {
          this.close(this.activeModal.id);
        }
      }
    });
  }
  
  /**
   * Initialise les modales existantes dans le HTML
   */
  initExistingModals() {
    const modalElements = selectAll('.modal');
    
    modalElements.forEach(modalElement => {
      const modalId = modalElement.id || `modal-${Math.random().toString(36).substring(2, 9)}`;
      
      // Si l'élément n'a pas d'ID, lui en assigner un
      if (!modalElement.id) {
        modalElement.id = modalId;
      }
      
      // Configuration à partir des attributs data-*
      const config = {
        title: modalElement.getAttribute('data-modal-title') || select('.modal-title', modalElement)?.textContent || '',
        persistent: modalElement.hasAttribute('data-modal-persistent'),
        animation: !modalElement.hasAttribute('data-modal-no-animation')
      };
      
      // Enregistre la modale
      this.register(modalId, config, modalElement);
    });
  }
  
  /**
   * Enregistre une modale
   * @param {string} id - Identifiant de la modale
   * @param {Object} config - Configuration de la modale
   * @param {HTMLElement} [element] - Élément modal existant (optionnel)
   * @returns {Object} Instance de modale
   */
  register(id, config = {}, element = null) {
    // Fusionne la configuration par défaut avec celle fournie
    const modalConfig = { ...defaultConfig, ...config };
    
    // Crée ou utilise l'élément modal
    const modalElement = element || this.createElement(id, modalConfig);
    
    // Stocke l'instance
    const modalInstance = {
      id,
      element: modalElement,
      config: modalConfig,
      isOpen: false
    };
    
    this.modals.set(id, modalInstance);
    
    return modalInstance;
  }
  
  /**
   * Crée l'élément modal
   * @param {string} id - Identifiant de la modale
   * @param {Object} config - Configuration de la modale
   * @returns {HTMLElement} Élément modal créé
   */
  createElement(id, config) {
    // Crée l'élément principal
    const modalElement = createElement('div', {
      id,
      class: 'modal'
    });
    
    // Crée l'en-tête de la modale
    const modalHeader = createElement('div', {
      class: 'modal-header'
    });
    
    // Titre
    const modalTitle = createElement('h3', {
      class: 'modal-title'
    }, config.title);
    
    modalHeader.appendChild(modalTitle);
    
    // Bouton de fermeture
    if (config.closeButton !== false) {
      const closeButton = createElement('button', {
        class: 'modal-close',
        'aria-label': 'Fermer',
        'data-modal-close': ''
      }, `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `);
      
      modalHeader.appendChild(closeButton);
    }
    
    // Corps de la modale
    const modalBody = createElement('div', {
      class: 'modal-body'
    });
    
    // Si c'est une modale vidéo
    if (config.video) {
      this.createVideoContent(modalBody, config.video);
    } else if (config.content) {
      // Contenu normal
      modalBody.innerHTML = config.content;
    }
    
    // Pied de page
    const modalFooter = createElement('div', {
      class: 'modal-footer'
    });
    
    // Ajoute les boutons personnalisés
    if (config.buttons && config.buttons.length > 0) {
      const buttonsContainer = createElement('div', {
        class: 'modal-buttons'
      });
      
      config.buttons.forEach(button => {
        const btnElement = createElement('button', {
          class: `button ${button.class || ''}`,
          type: button.type || 'button',
          dataset: { modalClose: button.close ? 'true' : undefined },
          onclick: (e) => {
            if (typeof button.onClick === 'function') {
              button.onClick(e);
            }
            
            if (button.close) {
              this.close(id);
            }
          }
        }, button.text || '');
        
        buttonsContainer.appendChild(btnElement);
      });
      
      modalFooter.appendChild(buttonsContainer);
    }
    
    // Assemble la modale
    modalElement.appendChild(modalHeader);
    modalElement.appendChild(modalBody);
    
    // Ajoute le pied de page seulement s'il a du contenu
    if (modalFooter.children.length > 0) {
      modalElement.appendChild(modalFooter);
    }
    
    // Ajoute la modale à l'overlay
    this.overlay.appendChild(modalElement);
    
    return modalElement;
  }
  
  /**
   * Crée le contenu d'une modale vidéo
   * @param {HTMLElement} modalBody - Élément corps de la modale
   * @param {Object} videoConfig - Configuration de la vidéo
   */
  createVideoContent(modalBody, videoConfig) {
    // Structure de la modale vidéo
    const videoContent = createElement('div', {
      class: 'video-modal-content'
    });
    
    // Partie principale (vidéo + infos)
    const videoMain = createElement('div', {
      class: 'video-modal-main'
    });
    
    // Iframe pour la vidéo
    const videoEmbed = createElement('div', {
      class: 'video-embed'
    });
    
    // Informations sur la vidéo
    const videoInfo = createElement('div', {
      class: 'video-info'
    });
    
    // Titre de la vidéo
    const videoTitle = createElement('h2', {
      class: 'video-title'
    }, videoConfig.title || '');
    
    // Créateur de la vidéo
    const videoCreator = createElement('div', {
      class: 'video-creator'
    }, `
      <svg class="video-creator-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      ${videoConfig.creator || ''}
    `);
    
    // Métadonnées de la vidéo
    const videoMeta = createElement('div', {
      class: 'video-meta'
    });
    
    // Vues
    if (videoConfig.views) {
      const viewsItem = createElement('div', {
        class: 'video-meta-item'
      }, `
        <svg class="video-meta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        <span class="video-views">${videoConfig.views}</span>
      `);
      
      videoMeta.appendChild(viewsItem);
    }
    
    // Date
    if (videoConfig.date) {
      const dateItem = createElement('div', {
        class: 'video-meta-item'
      }, `
        <svg class="video-meta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="video-date">${videoConfig.date}</span>
      `);
      
      videoMeta.appendChild(dateItem);
    }
    
    // Durée
    if (videoConfig.duration) {
      const durationItem = createElement('div', {
        class: 'video-meta-item'
      }, `
        <svg class="video-meta-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span class="video-duration">${videoConfig.duration}</span>
      `);
      
      videoMeta.appendChild(durationItem);
    }
    
    // Description
    const videoDescription = createElement('div', {
      class: 'video-description'
    }, videoConfig.description || '');
    
    // Actions (boutons)
    const videoActions = createElement('div', {
      class: 'video-actions'
    });
    
    // Bouton YouTube
    if (videoConfig.url) {
      const watchButton = createElement('a', {
        class: 'video-action-btn video-action-primary watch-youtube',
        href: videoConfig.url,
        target: '_blank',
        rel: 'noopener noreferrer'
      }, `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
        </svg>
        Voir sur YouTube
      `);
      
      videoActions.appendChild(watchButton);
    }
    
    // Bouton favoris
    const bookmarkButton = createElement('button', {
      class: 'video-action-btn video-action-secondary add-bookmark',
      'data-video-id': videoConfig.id
    }, `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
      Ajouter aux favoris
    `);
    
    // Bouton partage
    const shareButton = createElement('button', {
      class: 'video-action-btn video-action-secondary share-video',
      'data-video-id': videoConfig.id,
      'data-video-url': videoConfig.url
    }, `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
      </svg>
      Partager
    `);
    
    videoActions.appendChild(bookmarkButton);
    videoActions.appendChild(shareButton);
    
    // Tags
    const videoTags = createElement('div', {
      class: 'video-tags'
    });
    
    if (videoConfig.tags && videoConfig.tags.length > 0) {
      videoConfig.tags.forEach(tag => {
        const tagElement = createElement('span', {
          class: 'video-tag'
        }, tag);
        
        videoTags.appendChild(tagElement);
      });
    }
    
    // Assembler les informations vidéo
    videoInfo.appendChild(videoTitle);
    videoInfo.appendChild(videoCreator);
    videoInfo.appendChild(videoMeta);
    videoInfo.appendChild(videoDescription);
    videoInfo.appendChild(videoActions);
    videoInfo.appendChild(videoTags);
    
    // Assembler la partie principale
    videoMain.appendChild(videoEmbed);
    videoMain.appendChild(videoInfo);
    
    // Partie secondaire (vidéos similaires, etc.)
    const videoSidebar = createElement('div', {
      class: 'video-modal-sidebar'
    });
    
    // Titre des vidéos similaires
    const relatedTitle = createElement('h4', {
      class: 'related-videos-title'
    }, 'Vidéos similaires');
    
    // Conteneur des vidéos similaires
    const relatedVideos = createElement('div', {
      class: 'related-videos'
    });
    
    // Carte de catégorie
    const categoryCard = createElement('div', {
      class: 'video-category-card'
    });
    
    // Titre de la catégorie
    const categoryTitle = createElement('h4', {
      class: 'video-category-title'
    }, `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <span class="video-category-name">${videoConfig.category || 'Catégorie'}</span>
    `);
    
    // Description de la catégorie
    const categoryDescription = createElement('p', {
      class: 'video-category-description'
    }, videoConfig.categoryDescription || 'Description de la catégorie avec des informations utiles.');
    
    // Lien vers la catégorie
    const categoryLink = createElement('a', {
      class: 'video-category-link',
      href: videoConfig.categoryUrl || `#${videoConfig.category?.toLowerCase() || ''}`
    }, `
      Explorer cette catégorie
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
      </svg>
    `);
    
    // Assembler la carte de catégorie
    categoryCard.appendChild(categoryTitle);
    categoryCard.appendChild(categoryDescription);
    categoryCard.appendChild(categoryLink);
    
    // Assembler la barre latérale
    videoSidebar.appendChild(relatedTitle);
    videoSidebar.appendChild(relatedVideos);
    videoSidebar.appendChild(categoryCard);
    
    // Assembler le contenu
    videoContent.appendChild(videoMain);
    videoContent.appendChild(videoSidebar);
    
    // Ajouter à la modale
    modalBody.appendChild(videoContent);
    
    // Si l'URL de la vidéo est fournie, créer l'iframe
    if (videoConfig.videoId) {
      this.updateVideoEmbed(videoEmbed, videoConfig.videoId);
    }
  }
  
  /**
   * Met à jour l'embed vidéo avec l'ID YouTube
   * @param {HTMLElement} videoEmbed - Élément conteneur de la vidéo
   * @param {string} videoId - ID de la vidéo YouTube
   */
  updateVideoEmbed(videoEmbed, videoId) {
    // Vide le conteneur
    videoEmbed.innerHTML = '';
    
    // Crée l'iframe
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    
    // Ajoute l'iframe au conteneur
    videoEmbed.appendChild(iframe);
  }
  
  /**
   * Met à jour les vidéos similaires dans une modale vidéo
   * @param {string} modalId - ID de la modale
   * @param {Array} videos - Tableau d'objets vidéo similaires
   */
  updateSimilarVideos(modalId, videos) {
    const modalInstance = this.modals.get(modalId);
    if (!modalInstance) return;
    
    const relatedVideos = select('.related-videos', modalInstance.element);
    if (!relatedVideos) return;
    
    // Vide le conteneur
    relatedVideos.innerHTML = '';
    
    // Si pas de vidéos, affiche un message
    if (!videos || videos.length === 0) {
      const emptyMessage = createElement('p', {
        class: 'related-videos-empty'
      }, 'Aucune vidéo similaire disponible');
      
      relatedVideos.appendChild(emptyMessage);
      return;
    }
    
    // Crée les éléments pour chaque vidéo
    videos.forEach(video => {
      const relatedVideo = createElement('div', {
        class: 'related-video',
        dataset: { videoId: video.id }
      });
      
      // Vignette
      const thumbnail = createElement('div', {
        class: 'related-video-thumbnail'
      }, `<img src="${video.thumbnailUrl || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`}" alt="${video.title}">`);
      
      // Informations
      const info = createElement('div', {
        class: 'related-video-info'
      });
      
      // Titre
      const title = createElement('div', {
        class: 'related-video-title'
      }, video.title);
      
      // Métadonnées
      const meta = createElement('div', {
        class: 'related-video-meta'
      }, `${video.creator} • ${video.views || ''}`);
      
      // Assembler
      info.appendChild(title);
      info.appendChild(meta);
      
      relatedVideo.appendChild(thumbnail);
      relatedVideo.appendChild(info);
      
      // Ajouter l'événement de clic
      relatedVideo.addEventListener('click', () => {
        // Ferme la modale actuelle et ouvre celle de la vidéo similaire
        this.close(modalId);
        this.openVideoModal(video);
      });
      
      relatedVideos.appendChild(relatedVideo);
    });
  }
  
  /**
   * Met à jour la catégorie dans une modale vidéo
   * @param {string} modalId - ID de la modale
   * @param {Object} category - Informations sur la catégorie
   */
  updateCategory(modalId, category) {
    const modalInstance = this.modals.get(modalId);
    if (!modalInstance) return;
    
    const categoryName = select('.video-category-name', modalInstance.element);
    const categoryDescription = select('.video-category-description', modalInstance.element);
    const categoryLink = select('.video-category-link', modalInstance.element);
    
    if (categoryName) {
      categoryName.textContent = category.name || 'Catégorie';
    }
    
    if (categoryDescription) {
      categoryDescription.textContent = category.description || '';
    }
    
    if (categoryLink) {
      categoryLink.href = category.url || `#${category.name?.toLowerCase() || ''}`;
    }
  }
  
  /**
   * Ouvre une modale vidéo avec les informations de la vidéo
   * @param {Object} videoData - Données de la vidéo
   */
  openVideoModal(videoData) {
    // Crée un ID unique pour la modale
    const modalId = `video-modal-${videoData.id || Math.random().toString(36).substring(2, 9)}`;
    
    // Configuration de la modale
    const config = {
      title: 'Détails de la vidéo',
      video: {
        id: videoData.id,
        videoId: videoData.id, // ID YouTube
        title: videoData.title,
        creator: videoData.creator,
        description: videoData.description,
        duration: videoData.duration,
        views: videoData.views,
        date: videoData.date,
        url: videoData.url,
        tags: videoData.tags,
        category: videoData.level || videoData.category,
        categoryDescription: this.getCategoryDescription(videoData.level || videoData.category),
        categoryUrl: `#${(videoData.level || videoData.category)?.toLowerCase() || ''}`
      }
    };
    
    // Vérifie si la modale existe déjà
    let modalInstance = this.modals.get(modalId);
    
    if (!modalInstance) {
      // Crée la modale si elle n'existe pas
      modalInstance = this.register(modalId, config);
    } else {
      // Met à jour la modale existante
      this.updateVideoModal(modalId, config.video);
    }
    
    // Ouvre la modale
    this.open(modalId);
    
    // Retourne l'instance pour une utilisation en chaîne
    return modalInstance;
  }
  
  /**
   * Met à jour une modale vidéo existante
   * @param {string} modalId - ID de la modale
   * @param {Object} videoData - Nouvelles données vidéo
   */
  updateVideoModal(modalId, videoData) {
    const modalInstance = this.modals.get(modalId);
    if (!modalInstance) return;
    
    // Met à jour le titre
    const titleElement = select('.video-title', modalInstance.element);
    if (titleElement && videoData.title) {
      titleElement.textContent = videoData.title;
    }
    
    // Met à jour le créateur
    const creatorElement = select('.video-creator', modalInstance.element);
    if (creatorElement && videoData.creator) {
      const creatorText = creatorElement.lastChild;
      if (creatorText) {
        creatorText.textContent = videoData.creator;
      } else {
        creatorElement.appendChild(document.createTextNode(videoData.creator));
      }
    }
    
    // Met à jour les vues
    const viewsElement = select('.video-views', modalInstance.element);
    if (viewsElement && videoData.views) {
      viewsElement.textContent = videoData.views;
    }
    
    // Met à jour la date
    const dateElement = select('.video-date', modalInstance.element);
    if (dateElement && videoData.date) {
      dateElement.textContent = videoData.date;
    }
    
    // Met à jour la durée
    const durationElement = select('.video-duration', modalInstance.element);
    if (durationElement && videoData.duration) {
      durationElement.textContent = videoData.duration;
    }
    
    // Met à jour la description
    const descriptionElement = select('.video-description', modalInstance.element);
    if (descriptionElement && videoData.description) {
      descriptionElement.textContent = videoData.description;
    }
    
    // Met à jour l'URL YouTube
    const watchButton = select('.watch-youtube', modalInstance.element);
    if (watchButton && videoData.url) {
      watchButton.href = videoData.url;
    }
    
    // Met à jour les tags
    const tagsContainer = select('.video-tags', modalInstance.element);
    if (tagsContainer && videoData.tags) {
      // Vide le conteneur
      tagsContainer.innerHTML = '';
      
      // Ajoute les nouveaux tags
      videoData.tags.forEach(tag => {
        const tagElement = createElement('span', {
          class: 'video-tag'
        }, tag);
        
        tagsContainer.appendChild(tagElement);
      });
    }
    
    // Met à jour l'embed vidéo
    const videoEmbed = select('.video-embed', modalInstance.element);
    if (videoEmbed && videoData.videoId) {
      this.updateVideoEmbed(videoEmbed, videoData.videoId);
    }
    
    // Met à jour la catégorie
    if (videoData.category) {
      this.updateCategory(modalId, {
        name: videoData.category,
        description: videoData.categoryDescription || this.getCategoryDescription(videoData.category),
        url: videoData.categoryUrl || `#${videoData.category.toLowerCase()}`
      });
    }
  }
  
  /**
   * Obtient la description d'une catégorie
   * @param {string} category - Nom de la catégorie
   * @returns {string} Description de la catégorie
   */
  getCategoryDescription(category) {
    if (!category) return '';
    
    const categories = {
      beginner: 'Tutoriels pour débutants, parfaits pour commencer à créer des interfaces UI dans ROBLOX.',
      intermediate: 'Tutoriels de niveau intermédiaire pour approfondir vos connaissances en UI ROBLOX.',
      advanced: 'Tutoriels avancés pour maîtriser les techniques professionnelles d\'UI dans ROBLOX.',
      principles: 'Principes fondamentaux du design d\'interface qui s\'appliquent à tous les environnements, y compris ROBLOX.'
    };
    
    return categories[category.toLowerCase()] || 'Tutoriels sur l\'UI dans ROBLOX.';
  }
  
  /**
   * Ouvre une modale
   * @param {string} id - Identifiant de la modale
   * @returns {Object} Instance de modale
   */
  open(id) {
    // Vérifie si la modale existe
    const modalInstance = this.modals.get(id);
    if (!modalInstance) {
      console.error(`Modale avec l'ID "${id}" non trouvée`);
      return null;
    }
    
    // Vérifie si une transition est en cours
    if (this.isTransitioning) {
      return modalInstance;
    }
    
    // Marque le début de la transition
    this.isTransitioning = true;
    
    // Si une autre modale est déjà ouverte, la ferme d'abord
    if (this.activeModal && this.activeModal.id !== id) {
      this.close(this.activeModal.id, false);
    }
    
    // Active l'overlay
    toggleClass(this.overlay, 'active', true);
    
    // Récupère l'élément modal
    const modalElement = modalInstance.element;
    
    // Applique l'animation si nécessaire
    if (modalInstance.config.animation !== false) {
      modalElement.classList.add('animate-in');
      
      // Supprime la classe d'animation après la fin de l'animation
      const onAnimationEnd = () => {
        modalElement.classList.remove('animate-in');
        modalElement.removeEventListener('animationend', onAnimationEnd);
        
        // Fin de la transition
        this.isTransitioning = false;
      };
      
      modalElement.addEventListener('animationend', onAnimationEnd);
    } else {
      // Pas d'animation
      this.isTransitioning = false;
    }
    
    // Active la modale
    toggleClass(modalElement, 'active', true);
    
    // Met à jour l'instance
    modalInstance.isOpen = true;
    this.activeModal = modalInstance;
    
    // Exécute le callback onOpen
    if (typeof modalInstance.config.onOpen === 'function') {
      modalInstance.config.onOpen(modalInstance);
    }
    
    // Désactive le défilement du body
    document.body.style.overflow = 'hidden';
    
    // Trigger événement personnalisé
    modalElement.dispatchEvent(new CustomEvent('modal:opened', {
      detail: { modalId: id }
    }));
    
    return modalInstance;
  }
  
  /**
   * Ferme une modale
   * @param {string} id - Identifiant de la modale
   * @param {boolean} [hideOverlay=true] - Si true, masque l'overlay
   * @returns {boolean} True si la fermeture a réussi
   */
  close(id, hideOverlay = true) {
    // Vérifie si la modale existe
    const modalInstance = this.modals.get(id);
    if (!modalInstance) {
      console.error(`Modale avec l'ID "${id}" non trouvée`);
      return false;
    }
    
    // Vérifie si une transition est en cours
    if (this.isTransitioning) {
      return false;
    }
    
    // Marque le début de la transition
    this.isTransitioning = true;
    
    // Récupère l'élément modal
    const modalElement = modalInstance.element;
    
    // Applique l'animation si nécessaire
    if (modalInstance.config.animation !== false) {
      modalElement.classList.add('animate-out');
      
      // Supprime la classe d'animation après la fin de l'animation
      const onAnimationEnd = () => {
        modalElement.classList.remove('animate-out');
        toggleClass(modalElement, 'active', false);
        modalElement.removeEventListener('animationend', onAnimationEnd);
        
        // Masque l'overlay si demandé et qu'aucune autre modale n'est active
        if (hideOverlay) {
          toggleClass(this.overlay, 'active', false);
        }
        
        // Fin de la transition
        this.isTransitioning = false;
      };
      
      modalElement.addEventListener('animationend', onAnimationEnd);
    } else {
      // Pas d'animation
      toggleClass(modalElement, 'active', false);
      
      // Masque l'overlay si demandé
      if (hideOverlay) {
        toggleClass(this.overlay, 'active', false);
      }
      
      // Fin de la transition
      this.isTransitioning = false;
    }
    
    // Met à jour l'instance
    modalInstance.isOpen = false;
    
    // Réinitialise la modale active
    if (this.activeModal && this.activeModal.id === id) {
      this.activeModal = null;
    }
    
    // Exécute le callback onClose
    if (typeof modalInstance.config.onClose === 'function') {
      modalInstance.config.onClose(modalInstance);
    }
    
    // Réactive le défilement du body si aucune modale n'est active
    if (!this.activeModal) {
      document.body.style.overflow = '';
    }
    
    // Trigger événement personnalisé
    modalElement.dispatchEvent(new CustomEvent('modal:closed', {
      detail: { modalId: id }
    }));
    
    return true;
  }
  
  /**
   * Supprime une modale
   * @param {string} id - Identifiant de la modale
   * @returns {boolean} True si la suppression a réussi
   */
  remove(id) {
    // Vérifie si la modale existe
    const modalInstance = this.modals.get(id);
    if (!modalInstance) {
      console.error(`Modale avec l'ID "${id}" non trouvée`);
      return false;
    }
    
    // Si la modale est ouverte, la ferme d'abord
    if (modalInstance.isOpen) {
      this.close(id);
    }
    
    // Supprime l'élément du DOM
    modalInstance.element.remove();
    
    // Supprime l'instance
    this.modals.delete(id);
    
    return true;
  }
  
  /**
   * Met à jour le contenu d'une modale
   * @param {string} id - Identifiant de la modale
   * @param {string|HTMLElement} content - Nouveau contenu
   * @returns {boolean} True si la mise à jour a réussi
   */
  updateContent(id, content) {
    // Vérifie si la modale existe
    const modalInstance = this.modals.get(id);
    if (!modalInstance) {
      console.error(`Modale avec l'ID "${id}" non trouvée`);
      return false;
    }
    
    // Récupère le corps de la modale
    const modalBody = select('.modal-body', modalInstance.element);
    if (!modalBody) {
      console.error(`Corps de modale non trouvé pour l'ID "${id}"`);
      return false;
    }
    
    // Met à jour le contenu
    if (typeof content === 'string') {
      modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      modalBody.innerHTML = '';
      modalBody.appendChild(content);
    }
    
    return true;
  }
  
  /**
   * Met à jour le titre d'une modale
   * @param {string} id - Identifiant de la modale
   * @param {string} title - Nouveau titre
   * @returns {boolean} True si la mise à jour a réussi
   */
  updateTitle(id, title) {
    // Vérifie si la modale existe
    const modalInstance = this.modals.get(id);
    if (!modalInstance) {
      console.error(`Modale avec l'ID "${id}" non trouvée`);
      return false;
    }
    
    // Récupère le titre de la modale
    const modalTitle = select('.modal-title', modalInstance.element);
    if (!modalTitle) {
      console.error(`Titre de modale non trouvé pour l'ID "${id}"`);
      return false;
    }
    
    // Met à jour le titre
    modalTitle.textContent = title;
    
    // Met à jour la configuration
    modalInstance.config.title = title;
    
    return true;
  }
  
  /**
   * Vérifie si une modale est ouverte
   * @param {string} id - Identifiant de la modale
   * @returns {boolean} True si la modale est ouverte
   */
  isOpen(id) {
    const modalInstance = this.modals.get(id);
    return modalInstance ? modalInstance.isOpen : false;
  }
  
  /**
   * Récupère une instance de modale
   * @param {string} id - Identifiant de la modale
   * @returns {Object|null} Instance de modale ou null si non trouvée
   */
  get(id) {
    return this.modals.get(id) || null;
  }
  
  /**
   * Récupère toutes les instances de modales
   * @returns {Object} Map des instances de modales
   */
  getAll() {
    return this.modals;
  }
}

// Crée et exporte une instance unique du gestionnaire de modales
const modalManager = new ModalManager();

export default modalManager;