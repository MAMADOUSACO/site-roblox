/**
 * Gestionnaire des onglets de catégories
 * Permet de basculer entre les différentes catégories de tutoriels (débutants, intermédiaires, etc.)
 */

import { select, selectAll, onEvent, scrollToElement, isInViewport } from '../utils/dom-helpers.js';
import { getUrlParam, updateUrlParams } from '../utils/url-parser.js';
import { getItem, setItem } from '../utils/local-storage.js';
import { getAllVideos, getVideosByLevel, getPlaylistsByLevel, LEVEL } from '../data/videos.js';
import { showLoader, hideLoader } from '../animations/loading-animation.js';

// Configuration
const CONFIG = {
  STORAGE_KEY: 'roblox-ui-last-category',
  DEFAULT_CATEGORY: 'debutants',
  CATEGORY_MAPPING: {
    'debutants': LEVEL.BEGINNER,
    'intermediaires': LEVEL.INTERMEDIATE,
    'avances': LEVEL.ADVANCED,
    'principes': LEVEL.PRINCIPLES
  },
  SCROLL_OFFSET: 100,
  DEBOUNCE_DELAY: 100,
  STICKY_THRESHOLD: 100
};

// État interne
const state = {
  activeCategory: CONFIG.DEFAULT_CATEGORY,
  isTransitioning: false,
  isSticky: false,
  highlightPosition: { left: 0, width: 0 }
};

/**
 * Initialise le gestionnaire des onglets
 */
export const initCategorySwitcher = () => {
  const categoryTabs = select('.category-tabs');
  if (!categoryTabs) return;

  // Récupère la catégorie à partir des paramètres d'URL ou du stockage local
  const urlCategory = getUrlParam('category');
  const storedCategory = getItem(CONFIG.STORAGE_KEY);
  
  // Détermine la catégorie active
  state.activeCategory = urlCategory || storedCategory || CONFIG.DEFAULT_CATEGORY;
  
  // Configure les écouteurs d'événements
  setupEventListeners();
  
  // Active la catégorie initiale
  switchToCategory(state.activeCategory, false);
  
  // Configure le comportement sticky pour les onglets
  setupStickyBehavior();
  
  // Mise à jour de la position du highlight après le chargement complet de la page
  window.addEventListener('load', updateHighlightPosition);
  
  // Émet un événement personnalisé pour signaler l'initialisation
  document.dispatchEvent(new CustomEvent('categorySwitcher:initialized'));
};

/**
 * Configure les écouteurs d'événements
 */
const setupEventListeners = () => {
  // Écoute les clics sur les onglets
  onEvent('.category-tab', 'click', handleTabClick);
  
  // Écoute les changements de thème qui pourraient affecter la mise en page
  document.addEventListener('themeChanged', updateHighlightPosition);
  
  // Écoute le redimensionnement de la fenêtre
  window.addEventListener('resize', debounce(updateHighlightPosition, CONFIG.DEBOUNCE_DELAY));
};

/**
 * Gère le clic sur un onglet
 * @param {Event} event - Événement de clic
 */
const handleTabClick = (event) => {
  const tab = event.currentTarget;
  const category = tab.dataset.category;
  
  if (category === state.activeCategory || state.isTransitioning) return;
  
  switchToCategory(category, true);
};

/**
 * Bascule vers une catégorie spécifiée
 * @param {string} category - Catégorie cible
 * @param {boolean} shouldScroll - Si vrai, fait défiler jusqu'à la catégorie
 */
export const switchToCategory = (category, shouldScroll = true) => {
  if (!CONFIG.CATEGORY_MAPPING[category] || state.isTransitioning) return;
  
  state.isTransitioning = true;
  
  // Met à jour l'URL
  updateUrlParams({ category }, { replace: true });
  
  // Stocke la dernière catégorie
  setItem(CONFIG.STORAGE_KEY, category);
  
  // Récupère les éléments DOM
  const tabs = selectAll('.category-tab');
  const activeTab = select(`.category-tab[data-category="${category}"]`);
  const panes = selectAll('.tab-pane');
  const targetPane = select(`#${category}`);
  
  if (!activeTab || !targetPane) return;
  
  // Affiche un loader
  showLoader(targetPane.parentNode, 'category-content');
  
  // Marque l'onglet actif
  tabs.forEach(tab => tab.classList.remove('active'));
  activeTab.classList.add('active');
  
  // Met à jour la position du highlight
  updateHighlightPosition();
  
  // Anime la transition des panneaux
  panes.forEach(pane => {
    if (pane.classList.contains('active')) {
      pane.classList.add('fade-exit');
      
      pane.addEventListener('animationend', function handler() {
        pane.classList.remove('active', 'fade-exit');
        pane.removeEventListener('animationend', handler);
        
        // Active le panneau cible après la fin de l'animation
        targetPane.classList.add('active', 'fade-enter');
        
        targetPane.addEventListener('animationend', function targetHandler() {
          targetPane.classList.remove('fade-enter');
          targetPane.removeEventListener('animationend', targetHandler);
          
          // Termine la transition
          state.isTransitioning = false;
          hideLoader(targetPane.parentNode, 'category-content');
          
          // Déclenche un événement personnalisé
          document.dispatchEvent(new CustomEvent('categoryChanged', {
            detail: { category, level: CONFIG.CATEGORY_MAPPING[category] }
          }));
        }, { once: true });
      }, { once: true });
    }
  });
  
  // Si aucun panneau n'est actif ou si l'animation ne fonctionne pas
  if (!select('.tab-pane.active')) {
    panes.forEach(pane => pane.classList.remove('active'));
    targetPane.classList.add('active');
    state.isTransitioning = false;
    hideLoader(targetPane.parentNode, 'category-content');
  }
  
  // Met à jour la catégorie active dans l'état
  state.activeCategory = category;
  
  // Fait défiler jusqu'à la catégorie si nécessaire
  if (shouldScroll && !isInViewport(targetPane)) {
    scrollToElement(targetPane, CONFIG.SCROLL_OFFSET);
  }
  
  // Charge le contenu de la catégorie si non déjà chargé
  if (targetPane.querySelector('.video-grid:empty')) {
    loadCategoryContent(category);
  }
};

/**
 * Met à jour la position de la barre de surlignage
 */
const updateHighlightPosition = () => {
  const activeTab = select('.category-tab.active');
  const highlight = select('.category-tabs-highlight');
  
  if (!activeTab || !highlight) return;
  
  const rect = activeTab.getBoundingClientRect();
  const parentRect = activeTab.parentNode.getBoundingClientRect();
  
  highlight.style.width = `${rect.width}px`;
  highlight.style.left = `${rect.left - parentRect.left}px`;
  
  // Met à jour l'état
  state.highlightPosition = {
    left: rect.left - parentRect.left,
    width: rect.width
  };
};

/**
 * Configure le comportement sticky pour les onglets
 */
const setupStickyBehavior = () => {
  const categoryTabs = select('.category-tabs');
  if (!categoryTabs) return;
  
  // Fonction qui vérifie si les onglets doivent être en mode sticky
  const checkStickyState = () => {
    const rect = categoryTabs.getBoundingClientRect();
    const shouldBeSticky = rect.top <= CONFIG.STICKY_THRESHOLD;
    
    if (shouldBeSticky !== state.isSticky) {
      categoryTabs.classList.toggle('sticky', shouldBeSticky);
      state.isSticky = shouldBeSticky;
      
      // Met à jour la position du highlight
      if (shouldBeSticky) {
        setTimeout(updateHighlightPosition, 100);
      }
    }
  };
  
  // Écoute l'événement de défilement
  window.addEventListener('scroll', throttle(checkStickyState, 100));
  
  // Vérifie l'état initial
  checkStickyState();
};

/**
 * Charge le contenu d'une catégorie
 * @param {string} category - Catégorie à charger
 */
const loadCategoryContent = (category) => {
  const level = CONFIG.CATEGORY_MAPPING[category];
  const targetPane = select(`#${category}`);
  
  if (!targetPane || !level) return;
  
  const videoGrid = targetPane.querySelector('.video-grid');
  if (!videoGrid) return;
  
  // Obtient les vidéos et playlists pour cette catégorie
  const videos = getVideosByLevel(level);
  const playlists = getPlaylistsByLevel(level);
  
  // Charge les vidéos dans la grille (à implémenter par l'équipe de développement)
  // Cette partie serait mieux implémentée dans video-display.js
  
  // Déclenche un événement pour signaler que le contenu est prêt à être chargé
  document.dispatchEvent(new CustomEvent('categoryContent:load', {
    detail: { category, level, videos, playlists, container: videoGrid }
  }));
};

/**
 * Fonction utilitaire pour limiter la fréquence d'appel d'une fonction
 * @param {Function} fn - Fonction à limiter
 * @param {number} delay - Délai en ms
 * @returns {Function} Fonction limitée
 */
function throttle(fn, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

/**
 * Fonction utilitaire pour retarder l'appel d'une fonction
 * @param {Function} fn - Fonction à retarder
 * @param {number} delay - Délai en ms
 * @returns {Function} Fonction retardée
 */
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export default {
  initCategorySwitcher,
  switchToCategory
};