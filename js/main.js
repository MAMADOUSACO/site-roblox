/**
 * Script principal
 * Point d'entrée initialisant tous les modules de l'application
 */

// Importation des animations
import { initHoverController } from './animations/hover-controller.js';
import { initLoadingAnimations } from './animations/loading-animation.js';
import { initParallaxEffects } from './animations/parallax-effect.js';
import { initScrollObserver } from './animations/scroll-observer.js';

// Importation des composants
import { initNavigation } from './components/navigation.js';
import { initThemeSwitcher } from './components/theme-switcher.js';
import { initCategorySwitcher } from './components/category-switcher.js';
import { initSearch } from './components/search.js';
import { initFilters } from './components/filters.js';
import { initVideoDisplay } from './components/video-display.js';
import modalManager from './components/modal.js';
import tooltipManager from './components/tooltip.js';

// Importation des utilitaires
import * as domHelpers from './utils/dom-helpers.js';

// Configuration
const CONFIG = {
  INIT_DELAY: 100,          // Délai avant l'initialisation (ms)
  LOADER_MIN_DURATION: 800  // Durée minimale du loader (ms)
};

/**
 * Initialise l'application
 */
const initApp = () => {
  console.log('🚀 Initialisation de l\'application...');
  
  try {
    // Phase 1: Initialisation des animations de base et du chargement
    initLoadingAnimations();
    
    // Phase 2: Initialisation des composants de base de l'UI
    initNavigation();
    initThemeSwitcher();
    
    // Phase 3: Initialisation des composants interactifs
    initParallaxEffects();
    initScrollObserver();
    initHoverController();
    
    // Phase 4: Initialisation des composants liés au contenu
    initVideoDisplay();
    initCategorySwitcher();
    initSearch();
    initFilters();
    
    // Phase 5: Initialisation des événements globaux
    setupGlobalEvents();
    
    console.log('✅ Application initialisée avec succès');
    
    // Émission d'un événement personnalisé pour signaler l'initialisation complète
    document.dispatchEvent(new CustomEvent('app:initialized'));
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de l\'application:', error);
  }
};

/**
 * Configure les écouteurs d'événements globaux
 */
const setupGlobalEvents = () => {
  // Gestion du clic sur les éléments avec attribut data-scroll-to
  domHelpers.onEvent('[data-scroll-to]', 'click', (e) => {
    const target = e.currentTarget.getAttribute('data-scroll-to');
    const element = domHelpers.select(target);
    
    if (element) {
      e.preventDefault();
      const offset = parseInt(e.currentTarget.getAttribute('data-offset') || '0');
      domHelpers.scrollToElement(element, offset);
    }
  });
  
  // Gestion des liens avec préchargement
  domHelpers.onEvent('a[data-preload]', 'mouseenter', (e) => {
    const href = e.currentTarget.getAttribute('href');
    
    if (href && !e.currentTarget._preloaded) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = href;
      document.head.appendChild(link);
      e.currentTarget._preloaded = true;
    }
  });
  
  // Gestion des vidéos lazyload
  const lazyVideos = domHelpers.selectAll('video[loading="lazy"]');
  if (lazyVideos.length > 0) {
    const lazyVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const source = video.querySelector('source');
          
          if (source && source.dataset.src) {
            source.src = source.dataset.src;
            video.load();
            lazyVideoObserver.unobserve(video);
          }
        }
      });
    });
    
    lazyVideos.forEach(video => {
      lazyVideoObserver.observe(video);
    });
  }
  
  // Écoute les changements d'état de l'historique
  window.addEventListener('popstate', () => {
    // Si la page contient des paramètres de catégorie, activer cette catégorie
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
      // Utilise la fonction du module category-switcher
      if (typeof switchToCategory === 'function') {
        switchToCategory(category, false); // false = ne pas scroller
      }
    }
  });
};

/**
 * Gère l'état de prêt du DOM et démarre l'application
 */
const handleDOMReady = () => {
  // Vérifie si le DOM est déjà chargé
  if (document.readyState === 'loading') {
    // Si le DOM n'est pas encore chargé, attend l'événement DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      // Ajoute un petit délai pour s'assurer que tout est bien chargé
      setTimeout(initApp, CONFIG.INIT_DELAY);
    });
  } else {
    // Si le DOM est déjà chargé, initialise l'application avec un léger délai
    setTimeout(initApp, CONFIG.INIT_DELAY);
  }
};

// Démarrer l'application
handleDOMReady();

// Exposer certaines fonctions et modules globalement pour le débogage
window.app = {
  modalManager,
  tooltipManager,
  domHelpers
};