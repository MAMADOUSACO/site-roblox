/**
 * Observateur de défilement
 * Gère les animations déclenchées par le défilement et l'observation d'éléments dans le viewport
 */

import { select, selectAll, hasClass, toggleClass, isInViewport, scrollToElement } from '../utils/dom-helpers.js';

// Configuration
const CONFIG = {
    // Seuil de visibilité pour déclencher les animations
    VISIBILITY_THRESHOLD: 0.1,
    // Décalage du haut de la page pour les animations (header height)
    HEADER_OFFSET: 70,
    // Classes d'animation
    CLASSES: {
        ACTIVE: 'active',
        VISIBLE: 'visible',
        SCROLLED: 'scrolled',
        ANIMATED: 'animated',
        FADE_UP: 'scroll-fade-up',
        FADE_DOWN: 'scroll-fade-down',
        FADE_LEFT: 'scroll-fade-left',
        FADE_RIGHT: 'scroll-fade-right',
        ZOOM_IN: 'scroll-zoom-in',
        ZOOM_OUT: 'scroll-zoom-out'
    },
    // Durée des animations pour le retard entre les éléments
    ANIMATION_DELAY: 150,
    // Seuil de défilement pour afficher le bouton "back-to-top" (en pixels)
    BACK_TO_TOP_THRESHOLD: 300
};

/**
 * État interne de l'observateur de défilement
 */
const state = {
    // Dernier défilement connu
    lastScrollY: 0,
    // Direction du défilement (1 = vers le bas, -1 = vers le haut)
    scrollDirection: 1,
    // Timeouts pour limiter le nombre d'appels
    scrollTimeout: null,
    resizeTimeout: null,
    // Observateur d'intersection
    observer: null,
    // Éléments à animer lors du défilement
    animatedElements: [],
    // Indique si l'initialisation a été faite
    initialized: false
};

/**
 * Initialise l'observateur de défilement
 */
export const initScrollObserver = () => {
    if (state.initialized) return;
    
    // Initialise les observers et event listeners
    initIntersectionObserver();
    initScrollListeners();
    initBackToTopButton();
    initSmoothScrollLinks();
    
    // Marque comme initialisé
    state.initialized = true;
};

/**
 * Initialise l'observateur d'intersection pour les animations au défilement
 */
const initIntersectionObserver = () => {
    // Configuration de l'observateur
    const options = {
        root: null, // viewport
        rootMargin: `${-CONFIG.HEADER_OFFSET}px 0px 0px 0px`,
        threshold: CONFIG.VISIBILITY_THRESHOLD
    };
    
    // Fonction de callback pour l'intersection
    const handleIntersection = (entries, observer) => {
        entries.forEach((entry, index) => {
            const element = entry.target;
            
            // Délai progressif pour les effets en cascade
            const delay = index * CONFIG.ANIMATION_DELAY;
            
            if (entry.isIntersecting) {
                // Ajoute la classe active avec un délai pour les effets en cascade
                setTimeout(() => {
                    element.classList.add(CONFIG.CLASSES.VISIBLE);
                    element.classList.add(CONFIG.CLASSES.ANIMATED);
                    
                    // Pour les éléments avec ID, déclenche un événement personnalisé
                    if (element.id) {
                        document.dispatchEvent(new CustomEvent('section:visible', {
                            detail: { id: element.id, element }
                        }));
                    }
                }, delay);
                
                // Cesse d'observer cet élément s'il ne doit être animé qu'une fois
                if (!element.hasAttribute('data-always-animate')) {
                    observer.unobserve(element);
                }
            } else if (element.hasAttribute('data-always-animate')) {
                // Si l'élément sort du viewport mais doit être toujours animé
                element.classList.remove(CONFIG.CLASSES.VISIBLE);
            }
        });
    };
    
    // Crée l'observateur
    state.observer = new IntersectionObserver(handleIntersection, options);
    
    // Collecte et observe tous les éléments animés au défilement
    collectAnimatedElements();
};

/**
 * Collecte tous les éléments qui doivent être animés au défilement
 */
const collectAnimatedElements = () => {
    // Sélectionne tous les éléments avec les classes d'animation au défilement
    const selectors = [
        `.${CONFIG.CLASSES.FADE_UP}`,
        `.${CONFIG.CLASSES.FADE_DOWN}`,
        `.${CONFIG.CLASSES.FADE_LEFT}`,
        `.${CONFIG.CLASSES.FADE_RIGHT}`,
        `.${CONFIG.CLASSES.ZOOM_IN}`,
        `.${CONFIG.CLASSES.ZOOM_OUT}`,
        '[data-scroll-animate]'
    ].join(', ');
    
    // Sélectionne tous les éléments correspondants
    const elements = selectAll(selectors);
    state.animatedElements = Array.from(elements);
    
    // Observe chaque élément
    state.animatedElements.forEach(element => {
        state.observer.observe(element);
    });
};

/**
 * Initialise les écouteurs d'événements de défilement
 */
const initScrollListeners = () => {
    // Enregistre la position de défilement initiale
    state.lastScrollY = window.scrollY;
    
    // Écouteur d'événement de défilement avec throttling
    window.addEventListener('scroll', () => {
        if (state.scrollTimeout) return;
        
        state.scrollTimeout = setTimeout(() => {
            // Détermine la direction du défilement
            const currentScrollY = window.scrollY;
            state.scrollDirection = currentScrollY > state.lastScrollY ? 1 : -1;
            state.lastScrollY = currentScrollY;
            
            // Met à jour l'état des éléments en fonction du défilement
            updateScrollState();
            
            // Réinitialise le timeout
            state.scrollTimeout = null;
        }, 10);
    }, { passive: true });
    
    // Écouteur de redimensionnement avec debouncing
    window.addEventListener('resize', () => {
        if (state.resizeTimeout) {
            clearTimeout(state.resizeTimeout);
        }
        
        state.resizeTimeout = setTimeout(() => {
            // Recalcule les éléments animés
            if (state.observer) {
                state.animatedElements.forEach(element => {
                    state.observer.unobserve(element);
                });
                collectAnimatedElements();
            }
        }, 200);
    });
};

/**
 * Met à jour l'état des éléments en fonction du défilement
 */
const updateScrollState = () => {
    const scrollY = window.scrollY;
    
    // Mise à jour du header (compact lorsqu'on défile vers le bas)
    const header = select('.header');
    if (header) {
        toggleClass(header, CONFIG.CLASSES.SCROLLED, scrollY > 50);
    }
    
    // Mise à jour du bouton "back-to-top"
    const backToTopBtn = select('.back-to-top');
    if (backToTopBtn) {
        toggleClass(backToTopBtn, CONFIG.CLASSES.ACTIVE, scrollY > CONFIG.BACK_TO_TOP_THRESHOLD);
    }
    
    // Mise à jour des éléments observables manuellement (non gérés par IntersectionObserver)
    state.animatedElements.forEach(element => {
        if (element.hasAttribute('data-manual-animate')) {
            const isVisible = isInViewport(element, CONFIG.VISIBILITY_THRESHOLD);
            toggleClass(element, CONFIG.CLASSES.VISIBLE, isVisible);
        }
    });
    
    // Mise à jour des sections active dans la navigation
    updateActiveNavigation();
};

/**
 * Met à jour la section active dans la navigation
 */
const updateActiveNavigation = () => {
    // Récupère tous les liens de navigation
    const navLinks = selectAll('.nav-link');
    if (navLinks.length === 0) return;
    
    // Parcours tous les liens pour trouver la section correspondante
    let activeLink = null;
    
    Array.from(navLinks).forEach(link => {
        // Récupère l'ID de la section cible (sans le #)
        const targetId = link.getAttribute('href')?.replace('#', '');
        if (!targetId) return;
        
        // Récupère la section correspondante
        const targetSection = document.getElementById(targetId);
        if (!targetSection) return;
        
        // Vérifie si la section est visible
        const rect = targetSection.getBoundingClientRect();
        const isVisible = rect.top <= CONFIG.HEADER_OFFSET + 100 && rect.bottom > CONFIG.HEADER_OFFSET;
        
        if (isVisible) {
            activeLink = link;
        }
        
        // Retire la classe active
        link.classList.remove(CONFIG.CLASSES.ACTIVE);
    });
    
    // Ajoute la classe active au lien correspondant
    if (activeLink) {
        activeLink.classList.add(CONFIG.CLASSES.ACTIVE);
    } else if (navLinks.length > 0 && window.scrollY < 100) {
        // Si aucun lien n'est actif et qu'on est en haut de la page, active le premier lien
        navLinks[0].classList.add(CONFIG.CLASSES.ACTIVE);
    }
};

/**
 * Initialise le bouton de retour en haut de page
 */
const initBackToTopButton = () => {
    const backToTopBtn = select('.back-to-top');
    if (!backToTopBtn) return;
    
    // Cache le bouton initialement
    backToTopBtn.classList.remove(CONFIG.CLASSES.ACTIVE);
    
    // Ajoute l'écouteur de clic
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

/**
 * Initialise les liens avec défilement doux
 */
const initSmoothScrollLinks = () => {
    // Récupère tous les liens qui pointent vers des ancres
    const smoothScrollLinks = selectAll('a[href^="#"]:not([href="#"])');
    
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Récupère l'ID de la cible
            const targetId = link.getAttribute('href')?.replace('#', '');
            if (!targetId) return;
            
            // Récupère l'élément cible
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;
            
            // Empêche le comportement par défaut
            e.preventDefault();
            
            // Défile jusqu'à l'élément cible
            scrollToElement(targetElement, CONFIG.HEADER_OFFSET, 800);
            
            // Ferme le menu mobile si ouvert
            const mobileMenu = select('.nav.active');
            const overlay = select('.overlay.active');
            const menuToggle = select('.menu-toggle.active');
            
            if (mobileMenu) mobileMenu.classList.remove(CONFIG.CLASSES.ACTIVE);
            if (overlay) overlay.classList.remove(CONFIG.CLASSES.ACTIVE);
            if (menuToggle) menuToggle.classList.remove(CONFIG.CLASSES.ACTIVE);
        });
    });
};

/**
 * Actualise manuellement les animations de défilement
 * Utile si des éléments sont ajoutés dynamiquement au DOM
 */
export const refreshScrollAnimations = () => {
    if (!state.observer) {
        initScrollObserver();
        return;
    }
    
    // Arrête d'observer les éléments actuels
    state.animatedElements.forEach(element => {
        state.observer.unobserve(element);
    });
    
    // Collecte et observe les nouveaux éléments
    collectAnimatedElements();
    
    // Met à jour l'état du défilement
    updateScrollState();
};

/**
 * Active manuellement les animations d'un conteneur
 * @param {Element|string} container - Conteneur ou sélecteur du conteneur
 */
export const activateScrollAnimations = (container) => {
    const containerEl = typeof container === 'string' ? select(container) : container;
    if (!containerEl) return;
    
    // Récupère tous les éléments animés dans le conteneur
    const animatedElements = containerEl.querySelectorAll([
        `.${CONFIG.CLASSES.FADE_UP}`,
        `.${CONFIG.CLASSES.FADE_DOWN}`,
        `.${CONFIG.CLASSES.FADE_LEFT}`,
        `.${CONFIG.CLASSES.FADE_RIGHT}`,
        `.${CONFIG.CLASSES.ZOOM_IN}`,
        `.${CONFIG.CLASSES.ZOOM_OUT}`,
        '[data-scroll-animate]'
    ].join(', '));
    
    // Active les animations avec un délai progressif
    Array.from(animatedElements).forEach((element, index) => {
        const delay = index * CONFIG.ANIMATION_DELAY;
        
        setTimeout(() => {
            element.classList.add(CONFIG.CLASSES.VISIBLE);
            element.classList.add(CONFIG.CLASSES.ANIMATED);
        }, delay);
    });
};

/**
 * Vérifie si un élément est actuellement visible dans le viewport
 * @param {Element|string} element - Élément ou sélecteur de l'élément
 * @returns {boolean} True si l'élément est visible
 */
export const isElementVisible = (element) => {
    const el = typeof element === 'string' ? select(element) : element;
    if (!el) return false;
    
    return isInViewport(el, CONFIG.VISIBILITY_THRESHOLD);
};

// Exporte l'API publique
export default {
    initScrollObserver,
    refreshScrollAnimations,
    activateScrollAnimations,
    isElementVisible
};