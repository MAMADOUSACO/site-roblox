/**
 * Gestion des animations de chargement
 * Contrôle le loader principal de la page et les états de chargement des différents éléments
 */

import { select, selectAll, toggleClass, hasClass } from '../utils/dom-helpers.js';

// Configuration
const CONFIG = {
    // Durée minimale d'affichage du loader principal (ms)
    MIN_LOADER_DURATION: 800,
    // Délai avant de considérer un chargement comme "lent" et afficher un message (ms)
    SLOW_LOAD_THRESHOLD: 3000,
    // Délai d'animation pour les éléments qui apparaissent progressivement (ms)
    STAGGER_DELAY: 100
};

// Stockage de l'état global du chargement
const state = {
    pageLoaded: false,
    loadStartTime: Date.now(),
    activeLoaders: new Set(), // Ensemble des loaders actifs par identifiant
    slowLoadTimers: {} // Timers pour les messages de chargement lent
};

/**
 * Initialise le gestionnaire d'animations de chargement
 */
export const initLoadingAnimations = () => {
    // Masque le loader principal lorsque la page est complètement chargée
    window.addEventListener('load', hidePageLoader);
    
    // Ajoute une classe au body pour indiquer que le JavaScript est activé
    document.body.classList.add('js-enabled');
    
    // Ajoute un timeout pour masquer le loader même si certaines ressources ne se chargent pas
    setTimeout(hidePageLoader, 5000);
    
    // Initialise les animations "stagger" pour les éléments qui apparaissent progressivement
    initStaggerAnimations();
};

/**
 * Masque le loader principal de la page avec une animation
 */
export const hidePageLoader = () => {
    const pageLoader = select('.page-loader');
    if (!pageLoader || hasClass(pageLoader, 'loaded')) return;
    
    // Assure une durée minimale d'affichage du loader pour éviter un flash
    const elapsedTime = Date.now() - state.loadStartTime;
    const remainingTime = Math.max(0, CONFIG.MIN_LOADER_DURATION - elapsedTime);
    
    setTimeout(() => {
        pageLoader.classList.add('loaded');
        state.pageLoaded = true;
        
        // Supprime complètement le loader du DOM après la fin de l'animation
        setTimeout(() => {
            pageLoader.parentNode && pageLoader.parentNode.removeChild(pageLoader);
        }, 1000);
        
        // Déclenche un event custom pour signaler que la page est chargée
        document.dispatchEvent(new CustomEvent('page:loaded'));
    }, remainingTime);
};

/**
 * Initialise les animations "stagger" pour les éléments qui apparaissent progressivement
 */
export const initStaggerAnimations = () => {
    document.addEventListener('page:loaded', () => {
        // Configuration de l'observateur d'intersection
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };
        
        // Fonction appelée lorsqu'un conteneur stagger entre dans le viewport
        const handleIntersection = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    const items = container.querySelectorAll('.stagger-item, .video-card');
                    
                    // Anime chaque élément avec un délai progressif
                    items.forEach((item, index) => {
                        setTimeout(() => {
                            item.classList.add('appear');
                        }, index * CONFIG.STAGGER_DELAY);
                    });
                    
                    // Arrête d'observer cet élément une fois animé
                    observer.unobserve(container);
                }
            });
        };
        
        // Crée l'observateur et observe tous les conteneurs avec des éléments stagger
        const observer = new IntersectionObserver(handleIntersection, options);
        document.querySelectorAll('.stagger-children').forEach(container => {
            observer.observe(container);
        });
    });
};

/**
 * Affiche une animation de chargement pour un conteneur
 * @param {Element|string} container - Conteneur ou sélecteur où afficher l'animation
 * @param {string} [id='global'] - Identifiant unique pour ce loader
 * @param {Object} [options={}] - Options supplémentaires
 * @param {boolean} [options.fullscreen=false] - Si true, affiche un overlay sur toute la page
 * @param {string} [options.message='Chargement...'] - Message à afficher
 * @param {string} [options.loaderType='spinner'] - Type d'animation (spinner, pulse, dots, etc.)
 */
export const showLoader = (container, id = 'global', options = {}) => {
    const { 
        fullscreen = false,
        message = 'Chargement...',
        loaderType = 'spinner'
    } = options;
    
    // Récupère l'élément conteneur
    const containerEl = typeof container === 'string' ? select(container) : container;
    if (!containerEl) return;
    
    // Crée le loader s'il n'existe pas déjà
    let loaderOverlay = containerEl.querySelector('.loading-overlay');
    
    if (!loaderOverlay) {
        loaderOverlay = document.createElement('div');
        loaderOverlay.className = 'loading-overlay';
        
        // Contenu du loader
        const loaderContent = document.createElement('div');
        loaderContent.className = 'loading-content';
        
        // Animation de chargement
        const loaderAnimation = document.createElement('div');
        loaderAnimation.className = loaderType;
        
        if (loaderType === 'dot-loader') {
            for (let i = 0; i < 3; i++) {
                const dot = document.createElement('div');
                dot.className = 'dot';
                loaderAnimation.appendChild(dot);
            }
        } else if (loaderType === 'spinner') {
            // Le spinner est un élément simple
        }
        
        // Message de chargement
        if (message) {
            const messageEl = document.createElement('p');
            messageEl.className = 'loading-message';
            messageEl.textContent = message;
            loaderContent.appendChild(messageEl);
        }
        
        loaderContent.insertBefore(loaderAnimation, loaderContent.firstChild);
        loaderOverlay.appendChild(loaderContent);
        containerEl.appendChild(loaderOverlay);
        
        // Position relative pour le conteneur si pas déjà configuré
        if (getComputedStyle(containerEl).position === 'static') {
            containerEl.style.position = 'relative';
        }
    }
    
    // Ajoute la classe fullscreen si nécessaire
    if (fullscreen) {
        loaderOverlay.classList.add('fullscreen');
    }
    
    // Ajoute ce loader à la liste des loaders actifs
    state.activeLoaders.add(id);
    
    // Affiche le loader
    setTimeout(() => {
        loaderOverlay.classList.add('active');
    }, 0);
    
    // Configure un timer pour afficher un message si le chargement est lent
    state.slowLoadTimers[id] = setTimeout(() => {
        const messageEl = loaderOverlay.querySelector('.loading-message');
        if (messageEl) {
            messageEl.textContent = 'Le chargement prend plus de temps que prévu...';
        }
    }, CONFIG.SLOW_LOAD_THRESHOLD);
};

/**
 * Masque une animation de chargement
 * @param {Element|string} container - Conteneur ou sélecteur où masquer l'animation
 * @param {string} [id='global'] - Identifiant du loader à masquer
 */
export const hideLoader = (container, id = 'global') => {
    // Récupère l'élément conteneur
    const containerEl = typeof container === 'string' ? select(container) : container;
    if (!containerEl) return;
    
    // Récupère le loader
    const loaderOverlay = containerEl.querySelector('.loading-overlay');
    if (!loaderOverlay) return;
    
    // Masque le loader
    loaderOverlay.classList.remove('active');
    
    // Retire ce loader de la liste des loaders actifs
    state.activeLoaders.delete(id);
    
    // Annule le timer pour le message de chargement lent
    if (state.slowLoadTimers[id]) {
        clearTimeout(state.slowLoadTimers[id]);
        delete state.slowLoadTimers[id];
    }
    
    // Supprime le loader du DOM après l'animation
    setTimeout(() => {
        if (loaderOverlay.parentNode) {
            loaderOverlay.parentNode.removeChild(loaderOverlay);
        }
    }, 300);
};

/**
 * Vérifie si un loader est actif
 * @param {string} [id='global'] - Identifiant du loader
 * @returns {boolean} True si le loader est actif
 */
export const isLoading = (id = 'global') => {
    return state.activeLoaders.has(id);
};

/**
 * Met une carte vidéo en état de chargement
 * @param {Element} videoCard - Élément carte vidéo
 */
export const setVideoCardLoading = (videoCard) => {
    if (!videoCard) return;
    
    // Sauvegarde le contenu original
    if (!videoCard.dataset.originalContent) {
        const content = videoCard.querySelector('.video-card__content');
        if (content) {
            videoCard.dataset.originalContent = content.innerHTML;
        }
    }
    
    // Ajoute la classe de chargement
    videoCard.classList.add('loading');
    
    // Crée le contenu de chargement
    const content = videoCard.querySelector('.video-card__content');
    if (content) {
        content.innerHTML = `
            <div class="skeleton-loader skeleton-loader-title"></div>
            <div class="skeleton-loader skeleton-loader-text"></div>
            <div class="skeleton-loader skeleton-loader-text"></div>
            <div class="skeleton-loader skeleton-loader-text"></div>
            <div class="video-card__footer">
                <div class="skeleton-loader" style="width: 60%;"></div>
            </div>
        `;
    }
};

/**
 * Restaure une carte vidéo de l'état de chargement
 * @param {Element} videoCard - Élément carte vidéo
 */
export const unsetVideoCardLoading = (videoCard) => {
    if (!videoCard) return;
    
    // Retire la classe de chargement
    videoCard.classList.remove('loading');
    
    // Restaure le contenu original
    if (videoCard.dataset.originalContent) {
        const content = videoCard.querySelector('.video-card__content');
        if (content) {
            content.innerHTML = videoCard.dataset.originalContent;
            delete videoCard.dataset.originalContent;
        }
    }
};

/**
 * Gère l'état de chargement du bouton "Charger plus"
 * @param {Element|string} button - Élément bouton ou sélecteur
 * @param {boolean} isLoading - État de chargement
 */
export const toggleLoadMoreButton = (button, isLoading) => {
    const buttonEl = typeof button === 'string' ? select(button) : button;
    if (!buttonEl) return;
    
    // Active/désactive l'état de chargement
    buttonEl.disabled = isLoading;
    toggleClass(buttonEl, 'loading', isLoading);
    
    // Spinner de chargement
    const spinner = buttonEl.querySelector('.load-more-spinner');
    if (spinner) {
        toggleClass(spinner, 'active', isLoading);
    }
    
    // Texte du bouton
    buttonEl.textContent = isLoading ? 'Chargement...' : 'Charger plus de vidéos';
    
    // Rajoute le spinner s'il a été remplacé par le texte
    if (isLoading && !buttonEl.querySelector('.load-more-spinner')) {
        const newSpinner = document.createElement('div');
        newSpinner.className = 'load-more-spinner active';
        buttonEl.appendChild(newSpinner);
    }
};

/**
 * Affiche une animation de chargement pour les vignettes
 * @param {Element|NodeList|string} thumbnails - Éléments vignettes ou sélecteur
 */
export const showThumbnailLoader = (thumbnails) => {
    const elements = typeof thumbnails === 'string' 
        ? selectAll(thumbnails) 
        : thumbnails instanceof NodeList 
            ? thumbnails 
            : [thumbnails];
    
    Array.from(elements).forEach(thumbnail => {
        if (!thumbnail) return;
        
        // Sauvegarde l'URL de l'image
        const img = thumbnail.querySelector('img');
        if (img && img.src && !thumbnail.dataset.originalSrc) {
            thumbnail.dataset.originalSrc = img.src;
            
            // Remplace par l'animation de chargement
            thumbnail.classList.add('thumbnail-loading');
            img.style.opacity = '0';
            
            // Crée le loader
            const loader = document.createElement('div');
            loader.className = 'thumbnail-loader';
            thumbnail.appendChild(loader);
        }
    });
};

/**
 * Masque l'animation de chargement des vignettes
 * @param {Element|NodeList|string} thumbnails - Éléments vignettes ou sélecteur
 */
export const hideThumbnailLoader = (thumbnails) => {
    const elements = typeof thumbnails === 'string' 
        ? selectAll(thumbnails) 
        : thumbnails instanceof NodeList 
            ? thumbnails 
            : [thumbnails];
    
    Array.from(elements).forEach(thumbnail => {
        if (!thumbnail) return;
        
        // Restaure l'image originale
        const img = thumbnail.querySelector('img');
        if (img && thumbnail.dataset.originalSrc) {
            img.src = thumbnail.dataset.originalSrc;
            img.style.opacity = '1';
            delete thumbnail.dataset.originalSrc;
            
            // Supprime le loader
            thumbnail.classList.remove('thumbnail-loading');
            const loader = thumbnail.querySelector('.thumbnail-loader');
            if (loader) {
                thumbnail.removeChild(loader);
            }
        }
    });
};

// Export l'API publique
export default {
    initLoadingAnimations,
    hidePageLoader,
    showLoader,
    hideLoader,
    isLoading,
    setVideoCardLoading,
    unsetVideoCardLoading,
    toggleLoadMoreButton,
    showThumbnailLoader,
    hideThumbnailLoader
};