/**
 * Gestion de la navigation et du header
 * Contrôle le comportement du menu, de l'entête et des liens de navigation
 */

import { select, selectAll, onEvent, toggleClass, scrollToElement, hasClass, closest } from '../utils/dom-helpers.js';

// Configuration
const CONFIG = {
    // Seuil de défilement en pixels pour activer la classe "scrolled" sur le header
    SCROLL_THRESHOLD: 50,
    // Décalage en pixels pour le scroll vers les sections (pour tenir compte du header)
    SCROLL_OFFSET: 80,
    // Durée de l'animation de scroll en ms
    SCROLL_DURATION: 800
};

/**
 * Initialise la navigation
 */
export const initNavigation = () => {
    // Initialise le gestionnaire du header au défilement
    initHeaderScroll();
    
    // Initialise le menu mobile
    initMobileMenu();
    
    // Initialise les liens de navigation avec smooth scroll
    initNavLinks();
    
    // Initialise le bouton "retour en haut"
    initBackToTop();
    
    // Initialise l'activation des liens de navigation en fonction du scroll
    initActiveNavOnScroll();
};

/**
 * Gère l'effet du header au défilement
 */
const initHeaderScroll = () => {
    const header = select('.header');
    if (!header) return;
    
    // Fonction pour vérifier la position de défilement et ajouter/supprimer la classe
    const checkScroll = () => {
        if (window.scrollY > CONFIG.SCROLL_THRESHOLD) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    // Vérifier immédiatement au chargement
    checkScroll();
    
    // Ajouter l'écouteur d'événement pour le scroll
    window.addEventListener('scroll', checkScroll);
};

/**
 * Initialise le menu mobile et son bouton toggle
 */
const initMobileMenu = () => {
    const menuToggle = select('.menu-toggle');
    const nav = select('.nav');
    const overlay = select('.overlay');
    
    if (!menuToggle || !nav || !overlay) return;
    
    // Fonction pour ouvrir/fermer le menu
    const toggleMenu = () => {
        const isActive = hasClass(menuToggle, 'active');
        
        // Toggle les classes
        toggleClass(menuToggle, 'active', !isActive);
        toggleClass(nav, 'active', !isActive);
        toggleClass(overlay, 'active', !isActive);
        
        // Empêcher le défilement du body quand le menu est ouvert
        document.body.style.overflow = !isActive ? 'hidden' : '';
    };
    
    // Ajouter l'écouteur au bouton toggle
    menuToggle.addEventListener('click', toggleMenu);
    
    // Fermer le menu quand on clique sur l'overlay
    overlay.addEventListener('click', toggleMenu);
    
    // Fermer le menu quand on clique sur un lien de navigation (en mobile)
    const navLinks = selectAll('.nav-link', nav);
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hasClass(nav, 'active')) {
                toggleMenu();
            }
        });
    });
    
    // Fermer le menu quand la fenêtre est redimensionnée à une taille desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && hasClass(nav, 'active')) {
            toggleMenu();
        }
    });
};

/**
 * Initialise les liens de navigation avec smooth scroll
 */
const initNavLinks = () => {
    const navLinks = selectAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Récupérer la cible du lien
            const targetId = link.getAttribute('href');
            
            // S'assurer que c'est un lien d'ancrage interne
            if (targetId && targetId.startsWith('#') && targetId !== '#') {
                e.preventDefault();
                
                const targetElement = select(targetId);
                if (targetElement) {
                    // Utiliser la fonction scrollToElement des utilitaires DOM
                    scrollToElement(targetElement, CONFIG.SCROLL_OFFSET, CONFIG.SCROLL_DURATION);
                    
                    // Mettre à jour l'URL sans recharger la page
                    history.pushState(null, null, targetId);
                    
                    // Marquer ce lien comme actif
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    });
    
    // Vérifier si l'URL contient un hash au chargement
    if (window.location.hash && window.location.hash !== '#') {
        const targetElement = select(window.location.hash);
        if (targetElement) {
            // Petit délai pour s'assurer que la page est chargée
            setTimeout(() => {
                scrollToElement(targetElement, CONFIG.SCROLL_OFFSET, CONFIG.SCROLL_DURATION);
                
                // Activer le lien correspondant
                const hashLink = select(`.nav-link[href="${window.location.hash}"]`);
                if (hashLink) {
                    navLinks.forEach(navLink => navLink.classList.remove('active'));
                    hashLink.classList.add('active');
                }
            }, 100);
        }
    }
};

/**
 * Initialise le bouton "retour en haut"
 */
const initBackToTop = () => {
    const backToTop = select('.back-to-top');
    if (!backToTop) return;
    
    // Masquer/afficher le bouton en fonction du défilement
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    // Action de clic pour remonter en haut
    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
};

/**
 * Active automatiquement les liens de navigation en fonction de la section visible
 */
const initActiveNavOnScroll = () => {
    // Récupérer toutes les sections qui correspondent aux liens de navigation
    const sections = selectAll('section[id], div[id].tab-pane');
    const navLinks = selectAll('.nav-link');
    
    if (sections.length === 0 || navLinks.length === 0) return;
    
    // Fonction pour déterminer quelle section est actuellement visible
    const checkActiveSection = () => {
        // Récupérer la position de défilement actuelle avec un petit offset
        const scrollPosition = window.scrollY + CONFIG.SCROLL_OFFSET + 10;
        
        // Trouver la section actuellement visible
        let activeSection = null;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                activeSection = section;
            }
        });
        
        // Si une section est active, activer le lien de navigation correspondant
        if (activeSection) {
            const sectionId = `#${activeSection.id}`;
            
            navLinks.forEach(link => {
                if (link.getAttribute('href') === sectionId) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        }
    };
    
    // Vérifier la section active au défilement
    window.addEventListener('scroll', checkActiveSection);
    
    // Vérifier immédiatement la section active
    checkActiveSection();
};

/**
 * Initialise le système de navigation pour une page spécifique 
 * (autres que la page d'accueil)
 * @param {string} currentPage - Identifiant de la page actuelle
 */
export const initPageNavigation = (currentPage) => {
    // Ajouter une classe à la balise body pour identifier la page
    document.body.classList.add(`page-${currentPage}`);
    
    // Marquer le lien correspondant comme actif dans le header
    const navLinks = selectAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPage)) {
            link.classList.add('active');
        }
    });
    
    // Initialiser les fonctionnalités de base
    initHeaderScroll();
    initMobileMenu();
    initBackToTop();
};

// Export l'API publique
export default {
    initNavigation,
    initPageNavigation
};