/**
 * Effets de parallaxe
 * Gère les animations d'éléments avec un effet de parallaxe basé sur le défilement ou le mouvement de la souris
 */

import { select, selectAll, setStyles } from '../utils/dom-helpers.js';

// Configuration
const CONFIG = {
    // Multiplicateurs de vitesse par défaut (valeurs négatives = direction opposée)
    DEFAULT_MULTIPLIERS: {
        SCROLL: 0.15,  // Vitesse de défilement
        MOUSE_X: 0.05, // Sensibilité horizontale à la souris
        MOUSE_Y: 0.05, // Sensibilité verticale à la souris
        ROTATION: 0.02 // Sensibilité de rotation
    },
    // Limites des effets (en pixels ou degrés)
    LIMITS: {
        TRANSLATE: 100, // Déplacement maximum (en px)
        ROTATE: 10      // Rotation maximale (en degrés)
    },
    // Facteurs d'amortissement pour des transitions plus douces
    SMOOTHING: {
        MOUSE: 0.1,     // Amortissement du mouvement de la souris
        SCROLL: 0.05    // Amortissement du défilement
    },
    // Classes pour les différents types d'effets
    CLASSES: {
        PARALLAX: 'parallax',
        MOUSE_PARALLAX: 'mouse-parallax',
        SCROLL_PARALLAX: 'scroll-parallax',
        PARTICLES: 'particles',
        PARTICLE: 'particle'
    }
};

/**
 * État interne des effets de parallaxe
 */
const state = {
    // Position initiale de la souris (centre de l'écran)
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    // Position ciblée de la souris (pour l'effet de lissage)
    targetMouseX: window.innerWidth / 2,
    targetMouseY: window.innerHeight / 2,
    // Position actuelle du défilement
    scrollY: 0,
    // ID de la requête d'animation (pour annulation)
    animationFrameId: null,
    // Indique si l'initialisation a été faite
    initialized: false,
    // Éléments avec effet de parallaxe
    parallaxElements: [],
    // Conteneurs des particules
    particlesContainers: []
};

/**
 * Initialise les effets de parallaxe
 */
export const initParallaxEffects = () => {
    if (state.initialized) return;
    
    // Collecte les éléments avec effet de parallaxe
    collectParallaxElements();
    
    // Initialise les effets de particules
    initParticlesEffects();
    
    // Initialise les écouteurs d'événements
    initEventListeners();
    
    // Démarre la boucle d'animation
    startAnimationLoop();
    
    // Marque comme initialisé
    state.initialized = true;
};

/**
 * Collecte tous les éléments avec effet de parallaxe
 */
const collectParallaxElements = () => {
    // Sélectionne tous les éléments avec les classes de parallaxe
    const selectors = [
        `.${CONFIG.CLASSES.PARALLAX}`,
        `.${CONFIG.CLASSES.MOUSE_PARALLAX}`,
        `.${CONFIG.CLASSES.SCROLL_PARALLAX}`,
        '[data-parallax]',
        '[data-parallax-speed]'
    ].join(', ');
    
    // Sélectionne tous les éléments correspondants
    const elements = selectAll(selectors);
    
    // Stocke les informations sur les éléments
    state.parallaxElements = Array.from(elements).map(element => {
        // Récupère les attributs de configuration
        const speedAttr = element.getAttribute('data-parallax-speed') || '1';
        const directionAttr = element.getAttribute('data-parallax-direction') || 'both';
        const scrollSpeedAttr = element.getAttribute('data-scroll-speed') || '1';
        const mouseSpeedAttr = element.getAttribute('data-mouse-speed') || '1';
        const rotateAttr = element.getAttribute('data-parallax-rotate') || '0';
        const maxTranslate = element.getAttribute('data-max-translate') || CONFIG.LIMITS.TRANSLATE.toString();
        
        // Détermine le type d'effet de parallaxe
        const isMouseParallax = element.classList.contains(CONFIG.CLASSES.MOUSE_PARALLAX) || 
                                directionAttr.includes('mouse') || 
                                parseFloat(mouseSpeedAttr) !== 0;
                               
        const isScrollParallax = element.classList.contains(CONFIG.CLASSES.SCROLL_PARALLAX) || 
                                 directionAttr.includes('scroll') || 
                                 parseFloat(scrollSpeedAttr) !== 0;
        
        // Configuration de l'élément
        return {
            element,
            // Vitesses
            scrollSpeed: parseFloat(scrollSpeedAttr) * CONFIG.DEFAULT_MULTIPLIERS.SCROLL,
            mouseXSpeed: parseFloat(mouseSpeedAttr) * CONFIG.DEFAULT_MULTIPLIERS.MOUSE_X,
            mouseYSpeed: parseFloat(mouseSpeedAttr) * CONFIG.DEFAULT_MULTIPLIERS.MOUSE_Y,
            rotateSpeed: parseFloat(rotateAttr) * CONFIG.DEFAULT_MULTIPLIERS.ROTATION,
            // Type d'effet
            useMouseEffect: isMouseParallax,
            useScrollEffect: isScrollParallax,
            // Direction
            direction: directionAttr,
            // Position initiale (sera définie au premier rendu)
            initialX: 0,
            initialY: 0,
            // Limites
            maxTranslate: parseFloat(maxTranslate),
            // État actuel
            currentX: 0,
            currentY: 0,
            targetX: 0,
            targetY: 0,
            rotation: 0
        };
    });
    
    // On met à jour les positions initiales
    updateElementsInitialPositions();
};

/**
 * Initialise les effets de particules
 */
const initParticlesEffects = () => {
    // Sélectionne tous les conteneurs de particules
    const containers = selectAll(`.${CONFIG.CLASSES.PARTICLES}`);
    
    state.particlesContainers = Array.from(containers).map(container => {
        // Récupère les attributs de configuration
        const countAttr = container.getAttribute('data-particles-count');
        const speedAttr = container.getAttribute('data-particles-speed') || '1';
        
        // Détermine le nombre de particules
        const count = countAttr ? parseInt(countAttr) : container.querySelectorAll(`.${CONFIG.CLASSES.PARTICLE}`).length;
        
        // Crée les particules si nécessaire
        if (countAttr && count > 0) {
            createParticles(container, count);
        }
        
        // Récupère toutes les particules
        const particles = container.querySelectorAll(`.${CONFIG.CLASSES.PARTICLE}`);
        
        // Configure les particules
        const particlesConfig = Array.from(particles).map(particle => {
            // Position actuelle (sera mise à jour dans la boucle d'animation)
            const rect = particle.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Configuration aléatoire pour chaque particule
            return {
                element: particle,
                // Vitesse aléatoire pour chaque particule (entre 0.5 et 1.5 fois la vitesse de base)
                speedX: (0.5 + Math.random()) * parseFloat(speedAttr) * CONFIG.DEFAULT_MULTIPLIERS.MOUSE_X,
                speedY: (0.5 + Math.random()) * parseFloat(speedAttr) * CONFIG.DEFAULT_MULTIPLIERS.MOUSE_Y,
                // Position initiale relative au conteneur
                initialX: rect.left - containerRect.left + rect.width / 2,
                initialY: rect.top - containerRect.top + rect.height / 2,
                // État actuel
                currentX: 0,
                currentY: 0,
                // Limites (10-50% de la taille du conteneur)
                maxTranslate: (10 + Math.random() * 40) / 100 * Math.min(containerRect.width, containerRect.height)
            };
        });
        
        return {
            container,
            particles: particlesConfig
        };
    });
};

/**
 * Crée des particules dans un conteneur
 * @param {Element} container - Conteneur des particules
 * @param {number} count - Nombre de particules à créer
 */
const createParticles = (container, count) => {
    const containerRect = container.getBoundingClientRect();
    
    // Vide le conteneur des particules existantes
    const existingParticles = container.querySelectorAll(`.${CONFIG.CLASSES.PARTICLE}`);
    existingParticles.forEach(particle => particle.remove());
    
    // Crée les nouvelles particules
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = CONFIG.CLASSES.PARTICLE;
        
        // Position aléatoire dans le conteneur
        const size = 5 + Math.random() * 15; // Taille entre 5 et 20px
        const posX = Math.random() * (containerRect.width - size);
        const posY = Math.random() * (containerRect.height - size);
        
        // Styles de base
        setStyles(particle, {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            left: `${posX}px`,
            top: `${posY}px`,
            borderRadius: '50%',
            opacity: `${0.1 + Math.random() * 0.6}`, // Opacité entre 0.1 et 0.7
            transition: 'transform 0.6s var(--ease-out-timing)'
        });
        
        // Ajoute la particule au conteneur
        container.appendChild(particle);
    }
};

/**
 * Met à jour les positions initiales des éléments
 */
const updateElementsInitialPositions = () => {
    // Met à jour les positions initiales de chaque élément
    state.parallaxElements.forEach(item => {
        const rect = item.element.getBoundingClientRect();
        item.initialX = rect.left + rect.width / 2;
        item.initialY = rect.top + rect.height / 2;
    });
};

/**
 * Initialise les écouteurs d'événements
 */
const initEventListeners = () => {
    // Écouteur pour le mouvement de la souris
    document.addEventListener('mousemove', (e) => {
        state.targetMouseX = e.clientX;
        state.targetMouseY = e.clientY;
    });
    
    // Écouteur pour le défilement
    window.addEventListener('scroll', () => {
        state.scrollY = window.scrollY;
    }, { passive: true });
    
    // Écouteur pour le redimensionnement
    window.addEventListener('resize', () => {
        // Réinitialise la position de la souris au centre de l'écran
        state.targetMouseX = window.innerWidth / 2;
        state.targetMouseY = window.innerHeight / 2;
        
        // Met à jour les positions initiales des éléments
        updateElementsInitialPositions();
    });
};

/**
 * Démarre la boucle d'animation
 */
const startAnimationLoop = () => {
    // Vérifie si la préférence "reduced motion" est active
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Désactive les animations de parallaxe si l'utilisateur préfère réduire les animations
        return;
    }
    
    // Fonction d'animation
    const animate = () => {
        // Lisse le mouvement de la souris
        state.mouseX += (state.targetMouseX - state.mouseX) * CONFIG.SMOOTHING.MOUSE;
        state.mouseY += (state.targetMouseY - state.mouseY) * CONFIG.SMOOTHING.MOUSE;
        
        // Met à jour la position des éléments avec effet de parallaxe
        updateParallaxElements();
        
        // Met à jour la position des particules
        updateParticlesPositions();
        
        // Continue la boucle d'animation
        state.animationFrameId = requestAnimationFrame(animate);
    };
    
    // Démarre l'animation
    state.animationFrameId = requestAnimationFrame(animate);
};

/**
 * Met à jour la position des éléments avec effet de parallaxe
 */
const updateParallaxElements = () => {
    // Dimensions de la fenêtre
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Position relative de la souris (de -1 à 1, où 0,0 est le centre)
    const mouseXRatio = (state.mouseX - windowWidth / 2) / windowWidth * 2;
    const mouseYRatio = (state.mouseY - windowHeight / 2) / windowHeight * 2;
    
    // Met à jour chaque élément
    state.parallaxElements.forEach(item => {
        const { element, useMouseEffect, useScrollEffect, direction, 
                scrollSpeed, mouseXSpeed, mouseYSpeed, rotateSpeed, maxTranslate } = item;
        
        // Calcule les décalages en fonction de la souris
        let translateX = 0;
        let translateY = 0;
        let rotateX = 0;
        let rotateY = 0;
        
        // Effet de la souris
        if (useMouseEffect) {
            // Déplacement horizontal en fonction de la position de la souris
            if (direction.includes('both') || direction.includes('horizontal') || direction.includes('x')) {
                translateX = mouseXRatio * mouseXSpeed * maxTranslate;
            }
            
            // Déplacement vertical en fonction de la position de la souris
            if (direction.includes('both') || direction.includes('vertical') || direction.includes('y')) {
                translateY = mouseYRatio * mouseYSpeed * maxTranslate;
            }
            
            // Rotation en fonction de la position de la souris
            if (rotateSpeed !== 0) {
                rotateX = -mouseYRatio * rotateSpeed * CONFIG.LIMITS.ROTATE;
                rotateY = mouseXRatio * rotateSpeed * CONFIG.LIMITS.ROTATE;
            }
        }
        
        // Effet du défilement
        if (useScrollEffect) {
            // Déplacement vertical en fonction du défilement
            translateY += state.scrollY * scrollSpeed;
        }
        
        // Applique les transformations
        let transform = '';
        
        if (translateX !== 0 || translateY !== 0) {
            transform += `translate3d(${translateX}px, ${translateY}px, 0) `;
        }
        
        if (rotateX !== 0 || rotateY !== 0) {
            transform += `rotateX(${rotateX}deg) rotateY(${rotateY}deg) `;
        }
        
        if (transform) {
            element.style.transform = transform;
        }
    });
};

/**
 * Met à jour la position des particules
 */
const updateParticlesPositions = () => {
    // Position relative de la souris (de -1 à 1, où 0,0 est le centre)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const mouseXRatio = (state.mouseX - windowWidth / 2) / windowWidth * 2;
    const mouseYRatio = (state.mouseY - windowHeight / 2) / windowHeight * 2;
    
    // Met à jour chaque conteneur de particules
    state.particlesContainers.forEach(container => {
        container.particles.forEach(particle => {
            // Calcule le décalage en fonction de la souris
            const translateX = mouseXRatio * particle.speedX * particle.maxTranslate;
            const translateY = mouseYRatio * particle.speedY * particle.maxTranslate;
            
            // Applique la transformation
            particle.element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
        });
    });
};

/**
 * Actualise manuellement les effets de parallaxe
 * Utile si des éléments sont ajoutés dynamiquement au DOM
 */
export const refreshParallaxEffects = () => {
    // Arrête la boucle d'animation
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
    }
    
    // Réinitialise l'état
    state.parallaxElements = [];
    state.particlesContainers = [];
    
    // Collecte à nouveau les éléments
    collectParallaxElements();
    initParticlesEffects();
    
    // Redémarre la boucle d'animation
    startAnimationLoop();
};

/**
 * Active les effets de parallaxe pour un conteneur spécifique
 * @param {Element|string} container - Conteneur ou sélecteur du conteneur
 */
export const activateParallaxForContainer = (container) => {
    const containerEl = typeof container === 'string' ? select(container) : container;
    if (!containerEl) return;
    
    // Sélectionne tous les éléments avec effet de parallaxe dans le conteneur
    const selectors = [
        `.${CONFIG.CLASSES.PARALLAX}`,
        `.${CONFIG.CLASSES.MOUSE_PARALLAX}`,
        `.${CONFIG.CLASSES.SCROLL_PARALLAX}`,
        '[data-parallax]',
        '[data-parallax-speed]'
    ].join(', ');
    
    const elements = containerEl.querySelectorAll(selectors);
    const particlesContainers = containerEl.querySelectorAll(`.${CONFIG.CLASSES.PARTICLES}`);
    
    if (elements.length === 0 && particlesContainers.length === 0) return;
    
    // Actualise les effets
    refreshParallaxEffects();
};

// Exporte l'API publique
export default {
    initParallaxEffects,
    refreshParallaxEffects,
    activateParallaxForContainer
};