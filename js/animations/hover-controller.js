/**
 * Contrôleur d'effets au survol
 * Gère les interactions au survol et les animations spéciales pour les éléments interactifs
 */

import { select, selectAll, hasClass, toggleClass, animate } from '../utils/dom-helpers.js';

// Configuration
const CONFIG = {
    // Sélecteurs pour les différents types d'éléments interactifs
    SELECTORS: {
        // Éléments de base avec effet au survol
        HOVER_ELEMENTS: '.btn, .category-tab, .video-card, .hero-btn, .footer-link, .social-icon, .footer-category',
        // Cartes vidéo avec effet spécial au survol
        VIDEO_CARDS: '.video-card',
        // Éléments de navigation
        NAV_LINKS: '.nav-link',
        // Boutons avec effet de ripple
        RIPPLE_BUTTONS: '.btn, .hero-btn, .video-action-btn',
        // Éléments avec effet de magnétisme
        MAGNETIC_ELEMENTS: '[data-magnetic]',
        // Éléments avec effet de flottement
        FLOATING_ELEMENTS: '[data-float]',
        // Éléments avec effet de brillance
        SHINE_ELEMENTS: '[data-shine]'
    },
    // Classes pour les différents états
    CLASSES: {
        HOVER: 'hover',
        ACTIVE: 'active',
        RIPPLE: 'ripple',
        RIPPLE_ELEMENT: 'ripple-element',
        MAGNETIC: 'magnetic',
        FLOAT: 'float',
        SHINE: 'shine',
        SHINE_EFFECT: 'shine-effect'
    },
    // Durées des animations
    DURATIONS: {
        RIPPLE: 600,    // Durée de l'effet de ripple en ms
        MAGNETIC: 300,  // Durée de l'animation magnétique en ms
        FLOAT: 2000,    // Durée de l'animation de flottement en ms
        SHINE: 1500     // Durée de l'effet de brillance en ms
    },
    // Intensité des effets
    INTENSITY: {
        MAGNETIC: 0.5,  // Intensité de l'effet magnétique (0-1)
        FLOAT: 10,      // Amplitude de l'effet de flottement en px
        SHINE: 0.8      // Intensité de l'effet de brillance (0-1)
    }
};

/**
 * État interne des effets au survol
 */
const state = {
    // Indique si l'initialisation a été faite
    initialized: false,
    // Liste des gestionnaires d'événements actifs
    eventHandlers: new Map(),
    // Stocke les éléments en cours d'animation
    animatingElements: new Set()
};

/**
 * Initialise le contrôleur d'effets au survol
 */
export const initHoverController = () => {
    if (state.initialized) return;
    
    // Vérifie si la préférence "reduced motion" est active
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Initialise les différents effets
    initHoverStates();
    
    if (!prefersReducedMotion) {
        initRippleEffect();
        initMagneticEffect();
        initFloatingEffect();
        initShineEffect();
    }
    
    // Marque comme initialisé
    state.initialized = true;
};

/**
 * Initialise les états de survol de base
 */
const initHoverStates = () => {
    // Sélectionne tous les éléments avec effet au survol
    const hoverElements = selectAll(CONFIG.SELECTORS.HOVER_ELEMENTS);
    
    // Ajoute les écouteurs d'événements pour le survol
    hoverElements.forEach(element => {
        // Vérifie si l'écouteur d'événement est déjà enregistré
        if (state.eventHandlers.has(element)) return;
        
        // Fonctions de gestion des événements
        const handleMouseEnter = () => element.classList.add(CONFIG.CLASSES.HOVER);
        const handleMouseLeave = () => element.classList.remove(CONFIG.CLASSES.HOVER);
        
        // Ajoute les écouteurs d'événements
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        
        // Stocke les gestionnaires d'événements pour nettoyage ultérieur
        state.eventHandlers.set(element, {
            mouseenter: handleMouseEnter,
            mouseleave: handleMouseLeave
        });
    });
    
    // Initialise les effets spéciaux pour les cartes vidéo
    initVideoCardHoverEffects();
};

/**
 * Initialise les effets de survol spéciaux pour les cartes vidéo
 */
const initVideoCardHoverEffects = () => {
    // Sélectionne toutes les cartes vidéo
    const videoCards = selectAll(CONFIG.SELECTORS.VIDEO_CARDS);
    
    // Ajoute les écouteurs d'événements pour les cartes vidéo
    videoCards.forEach(card => {
        // Vérifie si l'écouteur d'événement est déjà enregistré
        if (state.eventHandlers.has(card)) {
            const handlers = state.eventHandlers.get(card);
            if (handlers.videoCardHover) return;
        }
        
        // Éléments interactifs spécifiques aux cartes vidéo
        const thumbnail = card.querySelector('.video-card__thumbnail');
        const playIcon = card.querySelector('.video-card__play-icon');
        const title = card.querySelector('.video-card__title');
        
        // Fonctions de gestion des événements
        const handleMouseEnter = () => {
            // Effet spécial sur la vignette et l'icône de lecture
            if (thumbnail) thumbnail.classList.add('hover');
            if (playIcon) playIcon.classList.add('hover');
            if (title) title.classList.add('hover');
        };
        
        const handleMouseLeave = () => {
            // Supprime les effets spéciaux
            if (thumbnail) thumbnail.classList.remove('hover');
            if (playIcon) playIcon.classList.remove('hover');
            if (title) title.classList.remove('hover');
        };
        
        // Ajoute les écouteurs d'événements
        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
        
        // Met à jour les gestionnaires d'événements stockés
        if (state.eventHandlers.has(card)) {
            const handlers = state.eventHandlers.get(card);
            handlers.videoCardHover = { 
                mouseenter: handleMouseEnter, 
                mouseleave: handleMouseLeave 
            };
        } else {
            state.eventHandlers.set(card, {
                mouseenter: handleMouseEnter,
                mouseleave: handleMouseLeave,
                videoCardHover: true
            });
        }
    });
};

/**
 * Initialise l'effet de ripple (ondulation) pour les boutons
 */
const initRippleEffect = () => {
    // Sélectionne tous les boutons avec effet de ripple
    const rippleButtons = selectAll(CONFIG.SELECTORS.RIPPLE_BUTTONS);
    
    // Ajoute les écouteurs d'événements pour l'effet de ripple
    rippleButtons.forEach(button => {
        // Vérifie si l'écouteur d'événement est déjà enregistré
        if (state.eventHandlers.has(button) && state.eventHandlers.get(button).ripple) return;
        
        // Fonction de gestion de l'événement
        const handleClick = (e) => {
            // Ne pas exécuter si l'élément est désactivé
            if (button.disabled || button.classList.contains('disabled')) return;
            
            // Crée l'élément de ripple
            const ripple = document.createElement('span');
            ripple.classList.add(CONFIG.CLASSES.RIPPLE_ELEMENT);
            
            // Position de l'élément parent
            const rect = button.getBoundingClientRect();
            
            // Calcule la taille du ripple
            const size = Math.max(rect.width, rect.height) * 2;
            
            // Position du clic par rapport à l'élément parent
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            // Style du ripple
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // Ajoute le ripple au bouton
            button.appendChild(ripple);
            
            // Supprime le ripple après l'animation
            setTimeout(() => {
                if (ripple.parentElement) {
                    ripple.parentElement.removeChild(ripple);
                }
            }, CONFIG.DURATIONS.RIPPLE);
        };
        
        // Ajoute les écouteurs d'événements
        button.addEventListener('click', handleClick);
        
        // Ajoute la classe ripple au bouton
        button.classList.add(CONFIG.CLASSES.RIPPLE);
        
        // Met à jour les gestionnaires d'événements stockés
        if (state.eventHandlers.has(button)) {
            const handlers = state.eventHandlers.get(button);
            handlers.ripple = { click: handleClick };
        } else {
            state.eventHandlers.set(button, { ripple: { click: handleClick } });
        }
    });
};

/**
 * Initialise l'effet magnétique pour les éléments interactifs
 */
const initMagneticEffect = () => {
    // Sélectionne tous les éléments avec effet magnétique
    const magneticElements = selectAll(CONFIG.SELECTORS.MAGNETIC_ELEMENTS);
    
    // Ajoute les écouteurs d'événements pour l'effet magnétique
    magneticElements.forEach(element => {
        // Vérifie si l'écouteur d'événement est déjà enregistré
        if (state.eventHandlers.has(element) && state.eventHandlers.get(element).magnetic) return;
        
        // Ajoute la classe magnétique
        element.classList.add(CONFIG.CLASSES.MAGNETIC);
        
        // Fonctions de gestion des événements
        const handleMouseMove = (e) => {
            // Ne pas exécuter si l'animation est en cours
            if (state.animatingElements.has(element)) return;
            
            // Position de l'élément
            const rect = element.getBoundingClientRect();
            
            // Centre de l'élément
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Distance du curseur par rapport au centre
            const distanceX = e.clientX - centerX;
            const distanceY = e.clientY - centerY;
            
            // Calcule le déplacement magnétique
            const magneticX = distanceX * CONFIG.INTENSITY.MAGNETIC;
            const magneticY = distanceY * CONFIG.INTENSITY.MAGNETIC;
            
            // Applique la transformation
            element.style.transform = `translate3d(${magneticX}px, ${magneticY}px, 0)`;
        };
        
        const handleMouseLeave = () => {
            // Marque l'élément comme en cours d'animation
            state.animatingElements.add(element);
            
            // Réinitialise la position avec une animation
            animate(
                element,
                { transform: 'translate3d(0, 0, 0)' },
                CONFIG.DURATIONS.MAGNETIC,
                'ease-out',
                () => {
                    // Supprime l'élément de la liste des animations en cours
                    state.animatingElements.delete(element);
                }
            );
        };
        
        // Ajoute les écouteurs d'événements
        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
        
        // Met à jour les gestionnaires d'événements stockés
        if (state.eventHandlers.has(element)) {
            const handlers = state.eventHandlers.get(element);
            handlers.magnetic = { 
                mousemove: handleMouseMove, 
                mouseleave: handleMouseLeave 
            };
        } else {
            state.eventHandlers.set(element, {
                magnetic: { 
                    mousemove: handleMouseMove, 
                    mouseleave: handleMouseLeave 
                }
            });
        }
    });
};

/**
 * Initialise l'effet de flottement pour les éléments interactifs
 */
const initFloatingEffect = () => {
    // Sélectionne tous les éléments avec effet de flottement
    const floatingElements = selectAll(CONFIG.SELECTORS.FLOATING_ELEMENTS);
    
    // Ajoute les écouteurs d'événements pour l'effet de flottement
    floatingElements.forEach(element => {
        // Ajoute la classe de flottement
        element.classList.add(CONFIG.CLASSES.FLOAT);
        
        // Obtient l'amplitude personnalisée
        const amplitude = parseFloat(element.getAttribute('data-float-amplitude')) || CONFIG.INTENSITY.FLOAT;
        
        // Crée une animation CSS avec un délai aléatoire
        const delay = Math.random() * CONFIG.DURATIONS.FLOAT;
        
        // Applique l'animation CSS
        element.style.animation = `float ${CONFIG.DURATIONS.FLOAT}ms ease-in-out infinite`;
        element.style.animationDelay = `${delay}ms`;
        
        // Ajoute un keyframe personnalisé si ce n'est pas déjà fait
        if (!document.querySelector('#float-keyframes')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'float-keyframes';
            styleElement.textContent = `
                @keyframes float {
                    0% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-${amplitude}px);
                    }
                    100% {
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(styleElement);
        }
    });
};

/**
 * Initialise l'effet de brillance pour les éléments interactifs
 */
const initShineEffect = () => {
    // Sélectionne tous les éléments avec effet de brillance
    const shineElements = selectAll(CONFIG.SELECTORS.SHINE_ELEMENTS);
    
    // Ajoute les écouteurs d'événements pour l'effet de brillance
    shineElements.forEach(element => {
        // Vérifie si l'écouteur d'événement est déjà enregistré
        if (state.eventHandlers.has(element) && state.eventHandlers.get(element).shine) return;
        
        // Ajoute la classe de brillance
        element.classList.add(CONFIG.CLASSES.SHINE);
        
        // Crée l'élément de brillance s'il n'existe pas déjà
        if (!element.querySelector(`.${CONFIG.CLASSES.SHINE_EFFECT}`)) {
            const shineEffect = document.createElement('div');
            shineEffect.classList.add(CONFIG.CLASSES.SHINE_EFFECT);
            element.appendChild(shineEffect);
        }
        
        // Fonctions de gestion des événements
        const handleMouseEnter = () => {
            const shineEffect = element.querySelector(`.${CONFIG.CLASSES.SHINE_EFFECT}`);
            if (shineEffect) {
                // Réinitialise l'animation
                shineEffect.style.animation = 'none';
                
                // Force un reflow
                void shineEffect.offsetWidth;
                
                // Démarre l'animation
                shineEffect.style.animation = `shine ${CONFIG.DURATIONS.SHINE}ms ease-in-out`;
            }
        };
        
        // Ajoute les écouteurs d'événements
        element.addEventListener('mouseenter', handleMouseEnter);
        
        // Met à jour les gestionnaires d'événements stockés
        if (state.eventHandlers.has(element)) {
            const handlers = state.eventHandlers.get(element);
            handlers.shine = { mouseenter: handleMouseEnter };
        } else {
            state.eventHandlers.set(element, {
                shine: { mouseenter: handleMouseEnter }
            });
        }
        
        // Ajoute un keyframe personnalisé si ce n'est pas déjà fait
        if (!document.querySelector('#shine-keyframes')) {
            const styleElement = document.createElement('style');
            styleElement.id = 'shine-keyframes';
            styleElement.textContent = `
                @keyframes shine {
                    0% {
                        transform: translateX(-100%) skewX(-45deg);
                        opacity: 0;
                    }
                    30% {
                        opacity: ${CONFIG.INTENSITY.SHINE};
                    }
                    100% {
                        transform: translateX(100%) skewX(-45deg);
                        opacity: 0;
                    }
                }
                
                .${CONFIG.CLASSES.SHINE_EFFECT} {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, ${CONFIG.INTENSITY.SHINE}) 50%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    pointer-events: none;
                    z-index: 1;
                }
            `;
            document.head.appendChild(styleElement);
        }
    });
};

/**
 * Actualise manuellement les effets de survol
 * Utile si des éléments sont ajoutés dynamiquement au DOM
 */
export const refreshHoverEffects = () => {
    initHoverStates();
    
    // Vérifie si la préférence "reduced motion" est active
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        initRippleEffect();
        initMagneticEffect();
        initFloatingEffect();
        initShineEffect();
    }
};

/**
 * Active manuellement les effets de survol pour un conteneur
 * @param {Element|string} container - Conteneur ou sélecteur du conteneur
 */
export const activateHoverEffectsForContainer = (container) => {
    const containerEl = typeof container === 'string' ? select(container) : container;
    if (!containerEl) return;
    
    // Vérifie si la préférence "reduced motion" est active
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Sélectionne tous les éléments avec effet au survol dans le conteneur
    const hoverElements = containerEl.querySelectorAll(CONFIG.SELECTORS.HOVER_ELEMENTS);
    
    // Initialise les états de survol pour ces éléments
    hoverElements.forEach(element => {
        // Vérifie si l'écouteur d'événement est déjà enregistré
        if (state.eventHandlers.has(element)) return;
        
        // Fonctions de gestion des événements
        const handleMouseEnter = () => element.classList.add(CONFIG.CLASSES.HOVER);
        const handleMouseLeave = () => element.classList.remove(CONFIG.CLASSES.HOVER);
        
        // Ajoute les écouteurs d'événements
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        
        // Stocke les gestionnaires d'événements pour nettoyage ultérieur
        state.eventHandlers.set(element, {
            mouseenter: handleMouseEnter,
            mouseleave: handleMouseLeave
        });
    });
    
    // Initialise les effets spéciaux dans le conteneur
    if (!prefersReducedMotion) {
        // Sélectionne tous les boutons avec effet de ripple dans le conteneur
        const rippleButtons = containerEl.querySelectorAll(CONFIG.SELECTORS.RIPPLE_BUTTONS);
        if (rippleButtons.length > 0) initRippleEffect();
        
        // Sélectionne tous les éléments avec effet magnétique dans le conteneur
        const magneticElements = containerEl.querySelectorAll(CONFIG.SELECTORS.MAGNETIC_ELEMENTS);
        if (magneticElements.length > 0) initMagneticEffect();
        
        // Sélectionne tous les éléments avec effet de flottement dans le conteneur
        const floatingElements = containerEl.querySelectorAll(CONFIG.SELECTORS.FLOATING_ELEMENTS);
        if (floatingElements.length > 0) initFloatingEffect();
        
        // Sélectionne tous les éléments avec effet de brillance dans le conteneur
        const shineElements = containerEl.querySelectorAll(CONFIG.SELECTORS.SHINE_ELEMENTS);
        if (shineElements.length > 0) initShineEffect();
    }
    
    // Cartes vidéo
    const videoCards = containerEl.querySelectorAll(CONFIG.SELECTORS.VIDEO_CARDS);
    if (videoCards.length > 0) initVideoCardHoverEffects();
};

/**
 * Nettoie les écouteurs d'événements pour un conteneur
 * @param {Element|string} container - Conteneur ou sélecteur du conteneur
 */
export const cleanupHoverEffects = (container) => {
    const containerEl = typeof container === 'string' ? select(container) : container;
    if (!containerEl) return;
    
    // Sélectionne tous les éléments avec effet au survol dans le conteneur
    const hoverElements = containerEl.querySelectorAll(
        [...Object.values(CONFIG.SELECTORS)].join(', ')
    );
    
    // Supprime les écouteurs d'événements
    hoverElements.forEach(element => {
        if (state.eventHandlers.has(element)) {
            const handlers = state.eventHandlers.get(element);
            
            // Supprime tous les écouteurs d'événements
            Object.values(handlers).forEach(eventHandlers => {
                if (typeof eventHandlers === 'object' && eventHandlers !== null) {
                    Object.entries(eventHandlers).forEach(([event, handler]) => {
                        element.removeEventListener(event, handler);
                    });
                }
            });
            
            // Supprime de la Map
            state.eventHandlers.delete(element);
        }
    });
};

// Exporte l'API publique
export default {
    initHoverController,
    refreshHoverEffects,
    activateHoverEffectsForContainer,
    cleanupHoverEffects
};