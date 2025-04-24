/**
 * Gestion des tooltips (infobulles) dans l'application
 * Permet d'afficher des infobulles personnalisées au survol ou au focus d'éléments
 */

import { select, selectAll, onEvent, createElement } from '../utils/dom-helpers.js';

/**
 * Configuration par défaut des tooltips
 */
const defaultConfig = {
  position: 'top', // Positions possibles: top, bottom, left, right
  variant: '', // Variantes: primary, secondary, accent, success, warning, light
  size: '', // Tailles: sm, lg
  interactive: false, // Si le tooltip permet l'interaction (clics)
  multiline: false, // Si le tooltip permet le texte multiligne
  showDelay: 200, // Délai avant affichage (ms)
  hideDelay: 200, // Délai avant masquage (ms)
  pulse: false, // Animation de pulsation
  withIcon: false // Afficher avec une icône
};

/**
 * Classe principale pour gérer les tooltips
 */
class TooltipManager {
  constructor() {
    this.tooltips = new Map(); // Stocke les tooltips actifs
    this.timers = new Map(); // Stocke les timers pour délais
    
    // Initialisation
    this.init();
  }
  
  /**
   * Initialise le gestionnaire de tooltips
   */
  init() {
    // Initialise les tooltips existants dans le HTML
    this.initExistingTooltips();
    
    // Écoute les événements globaux
    this.setupGlobalEvents();
  }
  
  /**
   * Initialise les tooltips existants dans le HTML
   */
  initExistingTooltips() {
    const tooltipContainers = selectAll('.tooltip-container');
    
    tooltipContainers.forEach(container => {
      // Vérifie si le tooltip existe déjà dans le container
      if (!select('.tooltip', container)) {
        // Récupère les paramètres depuis les attributs data-*
        const content = container.getAttribute('data-tooltip') || '';
        const position = container.getAttribute('data-tooltip-position') || defaultConfig.position;
        const variant = container.getAttribute('data-tooltip-variant') || defaultConfig.variant;
        const size = container.getAttribute('data-tooltip-size') || defaultConfig.size;
        const interactive = container.hasAttribute('data-tooltip-interactive');
        const multiline = container.hasAttribute('data-tooltip-multiline');
        const pulse = container.hasAttribute('data-tooltip-pulse');
        const withIcon = container.hasAttribute('data-tooltip-with-icon');
        
        // Crée le tooltip
        this.create(container, {
          content,
          position,
          variant,
          size,
          interactive,
          multiline,
          pulse,
          withIcon
        });
      }
      
      // Ajoute les écouteurs d'événements
      this.setupTooltipEvents(container);
    });
  }
  
  /**
   * Configure les événements globaux
   */
  setupGlobalEvents() {
    // Ferme les tooltips interactifs lors d'un clic en dehors
    document.addEventListener('click', (event) => {
      const tooltipContainers = selectAll('.tooltip-container');
      
      tooltipContainers.forEach(container => {
        const tooltip = select('.tooltip', container);
        
        if (tooltip && tooltip.classList.contains('tooltip-interactive')) {
          // Vérifie si le clic est en dehors du tooltip et de son container
          if (!container.contains(event.target) && !tooltip.contains(event.target)) {
            this.hide(container);
          }
        }
      });
    });
    
    // Repositionne les tooltips lors du redimensionnement de la fenêtre
    window.addEventListener('resize', () => {
      this.tooltips.forEach((tooltip, container) => {
        if (tooltip.classList.contains('visible')) {
          this.position(container, tooltip);
        }
      });
    });
    
    // Crée les tooltips dynamiques pour les éléments ajoutés plus tard
    document.addEventListener('DOMContentLoaded', () => {
      this.observeDynamicTooltips();
    });
  }
  
  /**
   * Configure les événements pour un tooltip spécifique
   * @param {HTMLElement} container - Conteneur du tooltip
   */
  setupTooltipEvents(container) {
    // Pour les tooltips non interactifs : affiche au survol ou au focus
    container.addEventListener('mouseenter', () => {
      const tooltip = this.tooltips.get(container);
      if (tooltip && !tooltip.classList.contains('tooltip-interactive')) {
        this.show(container);
      }
    });
    
    container.addEventListener('mouseleave', () => {
      const tooltip = this.tooltips.get(container);
      if (tooltip && !tooltip.classList.contains('tooltip-interactive')) {
        this.hide(container);
      }
    });
    
    container.addEventListener('focus', () => {
      this.show(container);
    });
    
    container.addEventListener('blur', () => {
      const tooltip = this.tooltips.get(container);
      if (tooltip && !tooltip.classList.contains('tooltip-interactive')) {
        this.hide(container);
      }
    });
    
    // Pour les tooltips interactifs : toggle au clic
    container.addEventListener('click', (e) => {
      const tooltip = this.tooltips.get(container);
      if (tooltip && tooltip.classList.contains('tooltip-interactive')) {
        if (tooltip.classList.contains('visible')) {
          this.hide(container);
        } else {
          this.show(container);
        }
        e.stopPropagation();
      }
    });
  }
  
  /**
   * Observe les modifications du DOM pour initialiser les tooltips dynamiques
   */
  observeDynamicTooltips() {
    // Utilise MutationObserver pour surveiller les ajouts d'éléments
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              // Recherche de nouveaux tooltips containers
              if (node.classList && node.classList.contains('tooltip-container')) {
                if (!this.tooltips.has(node)) {
                  this.initExistingTooltips();
                }
              }
              
              // Recherche dans les enfants
              const newContainers = selectAll('.tooltip-container', node);
              if (newContainers.length > 0) {
                this.initExistingTooltips();
              }
            }
          });
        }
      });
    });
    
    // Démarre l'observation
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Crée un tooltip pour un conteneur
   * @param {HTMLElement} container - Conteneur du tooltip
   * @param {Object} config - Configuration du tooltip
   * @returns {HTMLElement} Élément tooltip créé
   */
  create(container, config = {}) {
    // Fusionne la configuration par défaut avec celle fournie
    const tooltipConfig = { ...defaultConfig, ...config };
    
    // Récupère le contenu du tooltip
    let content = tooltipConfig.content;
    if (!content) {
      content = container.getAttribute('data-tooltip') || '';
    }
    
    // Détermine la position du tooltip
    const position = tooltipConfig.position;
    
    // Crée l'élément tooltip
    const tooltip = createElement('div', {
      class: `tooltip tooltip-${position}`
    });
    
    // Ajoute les classes pour les variantes et options
    if (tooltipConfig.variant) {
      tooltip.classList.add(`tooltip-${tooltipConfig.variant}`);
    }
    
    if (tooltipConfig.size) {
      tooltip.classList.add(`tooltip-${tooltipConfig.size}`);
    }
    
    if (tooltipConfig.multiline) {
      tooltip.classList.add('tooltip-multiline');
    }
    
    if (tooltipConfig.interactive) {
      tooltip.classList.add('tooltip-interactive');
    }
    
    if (tooltipConfig.pulse) {
      tooltip.classList.add('tooltip-pulse');
    }
    
    // Ajoute une icône si nécessaire
    if (tooltipConfig.withIcon) {
      const icon = tooltipConfig.icon || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>';
      
      const tooltipContent = createElement('div', {
        class: 'tooltip-with-icon'
      });
      
      const iconElement = createElement('span', {
        class: 'tooltip-icon'
      }, icon);
      
      const textElement = createElement('span', {}, content);
      
      tooltipContent.appendChild(iconElement);
      tooltipContent.appendChild(textElement);
      
      tooltip.appendChild(tooltipContent);
    } else {
      tooltip.innerHTML = content;
    }
    
    // Si c'est un tooltip interactif avec en-tête, corps et pied de page
    if (tooltipConfig.interactive && tooltipConfig.header) {
      const header = createElement('div', {
        class: 'tooltip-interactive-header'
      }, tooltipConfig.header);
      
      const body = createElement('div', {
        class: 'tooltip-interactive-body'
      }, content);
      
      tooltip.innerHTML = '';
      tooltip.appendChild(header);
      tooltip.appendChild(body);
      
      // Ajoute des boutons si nécessaire
      if (tooltipConfig.buttons) {
        const footer = createElement('div', {
          class: 'tooltip-interactive-footer'
        });
        
        tooltipConfig.buttons.forEach(button => {
          const btnElement = createElement('button', {
            class: `tooltip-btn tooltip-btn-${button.type || 'secondary'}`,
            onclick: (e) => {
              if (typeof button.onClick === 'function') {
                button.onClick(e);
              }
              e.stopPropagation();
            }
          }, button.text || '');
          
          footer.appendChild(btnElement);
        });
        
        tooltip.appendChild(footer);
      }
    }
    
    // Ajoute le tooltip au conteneur
    container.appendChild(tooltip);
    
    // Stocke le tooltip
    this.tooltips.set(container, tooltip);
    
    return tooltip;
  }
  
  /**
   * Affiche un tooltip
   * @param {HTMLElement} container - Conteneur du tooltip
   */
  show(container) {
    // Récupère ou crée le tooltip
    let tooltip = this.tooltips.get(container);
    if (!tooltip) {
      tooltip = this.create(container);
    }
    
    // Annule le timer de masquage s'il existe
    if (this.timers.has(container)) {
      clearTimeout(this.timers.get(container));
      this.timers.delete(container);
    }
    
    // Applique un délai avant affichage
    const showDelay = parseInt(container.getAttribute('data-tooltip-delay') || defaultConfig.showDelay);
    
    const timerId = setTimeout(() => {
      // Positionne le tooltip
      this.position(container, tooltip);
      
      // Rend le tooltip visible
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
      tooltip.classList.add('visible');
      
      // Supprime le timer
      this.timers.delete(container);
      
      // Trigger événement personnalisé
      container.dispatchEvent(new CustomEvent('tooltip:shown'));
    }, showDelay);
    
    // Stocke le timer
    this.timers.set(container, timerId);
  }
  
  /**
   * Masque un tooltip
   * @param {HTMLElement} container - Conteneur du tooltip
   */
  hide(container) {
    const tooltip = this.tooltips.get(container);
    if (!tooltip) return;
    
    // Annule le timer d'affichage s'il existe
    if (this.timers.has(container)) {
      clearTimeout(this.timers.get(container));
      this.timers.delete(container);
    }
    
    // Applique un délai avant masquage
    const hideDelay = parseInt(container.getAttribute('data-tooltip-hide-delay') || defaultConfig.hideDelay);
    
    const timerId = setTimeout(() => {
      // Masque le tooltip
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
      tooltip.classList.remove('visible');
      
      // Supprime le timer
      this.timers.delete(container);
      
      // Trigger événement personnalisé
      container.dispatchEvent(new CustomEvent('tooltip:hidden'));
    }, hideDelay);
    
    // Stocke le timer
    this.timers.set(container, timerId);
  }
  
  /**
   * Positionne correctement un tooltip par rapport à son conteneur
   * @param {HTMLElement} container - Conteneur du tooltip
   * @param {HTMLElement} tooltip - Élément tooltip
   */
  position(container, tooltip) {
    // Récupère les dimensions et positions
    const containerRect = container.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Détermine la position du tooltip
    const position = tooltip.classList.contains('tooltip-top') ? 'top' :
                    tooltip.classList.contains('tooltip-bottom') ? 'bottom' :
                    tooltip.classList.contains('tooltip-left') ? 'left' : 
                    tooltip.classList.contains('tooltip-right') ? 'right' : 'top';
    
    // Calcule les coordonnées selon la position
    let left, top;
    
    switch (position) {
      case 'top':
        left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
        top = containerRect.top - tooltipRect.height - 10;
        break;
      case 'bottom':
        left = containerRect.left + (containerRect.width / 2) - (tooltipRect.width / 2);
        top = containerRect.bottom + 10;
        break;
      case 'left':
        left = containerRect.left - tooltipRect.width - 10;
        top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
        break;
      case 'right':
        left = containerRect.right + 10;
        top = containerRect.top + (containerRect.height / 2) - (tooltipRect.height / 2);
        break;
    }
    
    // Ajuste la position pour éviter les débordements
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Ajustement horizontal
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > windowWidth - 10) {
      left = windowWidth - tooltipRect.width - 10;
    }
    
    // Ajustement vertical
    if (top < 10) {
      if (position === 'top') {
        // Bascule vers le bas si pas assez d'espace en haut
        top = containerRect.bottom + 10;
        tooltip.classList.remove('tooltip-top');
        tooltip.classList.add('tooltip-bottom');
      } else {
        top = 10;
      }
    } else if (top + tooltipRect.height > windowHeight - 10) {
      if (position === 'bottom') {
        // Bascule vers le haut si pas assez d'espace en bas
        top = containerRect.top - tooltipRect.height - 10;
        tooltip.classList.remove('tooltip-bottom');
        tooltip.classList.add('tooltip-top');
      } else {
        top = windowHeight - tooltipRect.height - 10;
      }
    }
    
    // Applique les coordonnées
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }
  
  /**
   * Met à jour le contenu d'un tooltip
   * @param {HTMLElement} container - Conteneur du tooltip
   * @param {string} content - Nouveau contenu
   */
  updateContent(container, content) {
    const tooltip = this.tooltips.get(container);
    if (tooltip) {
      if (tooltip.classList.contains('tooltip-with-icon')) {
        const textElement = tooltip.querySelector('.tooltip-with-icon > span:not(.tooltip-icon)');
        if (textElement) {
          textElement.innerHTML = content;
        }
      } else if (tooltip.classList.contains('tooltip-interactive')) {
        const bodyElement = tooltip.querySelector('.tooltip-interactive-body');
        if (bodyElement) {
          bodyElement.innerHTML = content;
        } else {
          tooltip.innerHTML = content;
        }
      } else {
        tooltip.innerHTML = content;
      }
      
      // Met à jour l'attribut data
      container.setAttribute('data-tooltip', content);
    }
  }
  
  /**
   * Supprime un tooltip
   * @param {HTMLElement} container - Conteneur du tooltip
   */
  remove(container) {
    const tooltip = this.tooltips.get(container);
    if (tooltip) {
      tooltip.remove();
      this.tooltips.delete(container);
      
      // Supprime le timer si existant
      if (this.timers.has(container)) {
        clearTimeout(this.timers.get(container));
        this.timers.delete(container);
      }
    }
  }
}

// Crée et exporte une instance unique du gestionnaire de tooltips
const tooltipManager = new TooltipManager();

export default tooltipManager;