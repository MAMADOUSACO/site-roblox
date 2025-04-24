/**
 * Utilitaires pour manipuler le DOM plus facilement
 */

/**
 * Sélectionne un élément du DOM
 * @param {string} selector - Sélecteur CSS
 * @param {Element} [parent=document] - Élément parent dans lequel chercher
 * @returns {Element|null} Élément trouvé ou null
 */
export const select = (selector, parent = document) => {
    return parent.querySelector(selector);
  };
  
  /**
   * Sélectionne plusieurs éléments du DOM
   * @param {string} selector - Sélecteur CSS
   * @param {Element} [parent=document] - Élément parent dans lequel chercher
   * @returns {NodeList} Liste des éléments trouvés
   */
  export const selectAll = (selector, parent = document) => {
    return parent.querySelectorAll(selector);
  };
  
  /**
   * Ajoute un écouteur d'événement à un ou plusieurs éléments
   * @param {string|Element|NodeList} selector - Sélecteur CSS, élément ou liste d'éléments
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction à exécuter
   */
  export const onEvent = (selector, event, callback) => {
    const elements = typeof selector === 'string' 
      ? selectAll(selector) 
      : selector instanceof NodeList 
        ? selector 
        : [selector];
    
    Array.from(elements).forEach(element => {
      element.addEventListener(event, callback);
    });
  };
  
  /**
   * Crée un élément avec des attributs et du contenu
   * @param {string} tag - Nom de la balise
   * @param {Object} [attributes={}] - Attributs de l'élément
   * @param {string|Element|Array} [content=''] - Contenu de l'élément
   * @returns {Element} Élément créé
   */
  export const createElement = (tag, attributes = {}, content = '') => {
    const element = document.createElement(tag);
    
    // Ajout des attributs
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class' || key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Ajout du contenu
    if (content) {
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else if (content instanceof Element) {
        element.appendChild(content);
      } else if (Array.isArray(content)) {
        content.forEach(item => {
          if (typeof item === 'string') {
            element.innerHTML += item;
          } else if (item instanceof Element) {
            element.appendChild(item);
          }
        });
      }
    }
    
    return element;
  };
  
  /**
   * Ajoute ou supprime une classe d'un élément
   * @param {Element} element - Élément à modifier
   * @param {string} className - Nom de la classe
   * @param {boolean} [condition=true] - Condition pour ajouter/supprimer la classe
   */
  export const toggleClass = (element, className, condition = true) => {
    if (condition) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  };
  
  /**
   * Vérifie si un élément a une classe
   * @param {Element} element - Élément à vérifier
   * @param {string} className - Nom de la classe
   * @returns {boolean} True si l'élément a la classe
   */
  export const hasClass = (element, className) => {
    return element.classList.contains(className);
  };
  
  /**
   * Récupère ou défini les données d'un attribut data-*
   * @param {Element} element - Élément à manipuler
   * @param {string} key - Nom de l'attribut sans 'data-'
   * @param {string} [value] - Valeur à définir (optionnel)
   * @returns {string|undefined} Valeur de l'attribut si aucune valeur n'est fournie
   */
  export const data = (element, key, value) => {
    if (value === undefined) {
      return element.dataset[key];
    }
    
    element.dataset[key] = value;
  };
  
  /**
   * Ajoute du contenu à un élément
   * @param {Element} element - Élément à modifier
   * @param {string|Element|Array} content - Contenu à ajouter
   */
  export const append = (element, content) => {
    if (typeof content === 'string') {
      element.innerHTML += content;
    } else if (content instanceof Element) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(item => {
        if (typeof item === 'string') {
          element.innerHTML += item;
        } else if (item instanceof Element) {
          element.appendChild(item);
        }
      });
    }
  };
  
  /**
   * Définit ou récupère le contenu HTML d'un élément
   * @param {Element} element - Élément à manipuler
   * @param {string} [content] - Contenu HTML à définir (optionnel)
   * @returns {string|undefined} Contenu HTML si aucun contenu n'est fourni
   */
  export const html = (element, content) => {
    if (content === undefined) {
      return element.innerHTML;
    }
    
    element.innerHTML = content;
  };
  
  /**
   * Définit ou récupère le contenu textuel d'un élément
   * @param {Element} element - Élément à manipuler
   * @param {string} [content] - Contenu textuel à définir (optionnel)
   * @returns {string|undefined} Contenu textuel si aucun contenu n'est fourni
   */
  export const text = (element, content) => {
    if (content === undefined) {
      return element.textContent;
    }
    
    element.textContent = content;
  };
  
  /**
   * Supprime un élément du DOM
   * @param {Element} element - Élément à supprimer
   */
  export const remove = (element) => {
    element.parentNode.removeChild(element);
  };
  
  /**
   * Vide le contenu d'un élément
   * @param {Element} element - Élément à vider
   */
  export const empty = (element) => {
    element.innerHTML = '';
  };
  
  /**
   * Trouve l'élément parent le plus proche qui correspond au sélecteur
   * @param {Element} element - Élément de départ
   * @param {string} selector - Sélecteur CSS
   * @returns {Element|null} Élément parent trouvé ou null
   */
  export const closest = (element, selector) => {
    if (element.closest) {
      return element.closest(selector);
    }
    
    // Polyfill pour les navigateurs qui ne supportent pas closest
    let parent = element;
    
    while (parent) {
      if (parent.matches && parent.matches(selector)) {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    return null;
  };
  
  /**
   * Fait défiler la page jusqu'à un élément
   * @param {Element|string} target - Élément ou sélecteur de l'élément cible
   * @param {number} [offset=0] - Décalage en pixels
   * @param {number} [duration=500] - Durée de l'animation en ms
   */
  export const scrollToElement = (target, offset = 0, duration = 500) => {
    const element = typeof target === 'string' ? select(target) : target;
    
    if (!element) return;
    
    const start = window.pageYOffset;
    const targetTop = element.getBoundingClientRect().top + start;
    const distance = targetTop - offset - start;
    let startTime = null;
    
    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeInOutQuad = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      window.scrollTo(0, start + distance * easeInOutQuad);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };
    
    requestAnimationFrame(animation);
  };
  
  /**
   * Détecte si un élément est visible dans le viewport
   * @param {Element} element - Élément à vérifier
   * @param {number} [threshold=0] - Pourcentage de visibilité requis (0 à 1)
   * @returns {boolean} True si l'élément est visible
   */
  export const isInViewport = (element, threshold = 0) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    const verticalVisible = 
      (rect.top >= 0 && rect.top <= windowHeight * (1 - threshold)) ||
      (rect.bottom >= windowHeight * threshold && rect.bottom <= windowHeight) ||
      (rect.top <= 0 && rect.bottom >= windowHeight);
    
    return verticalVisible;
  };
  
  /**
   * Met à jour le style d'un élément
   * @param {Element} element - Élément à modifier
   * @param {Object} styles - Styles CSS à appliquer
   */
  export const setStyles = (element, styles) => {
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value;
    });
  };
  
  /**
   * Anime un élément en modifiant ses propriétés CSS
   * @param {Element} element - Élément à animer
   * @param {Object} properties - Propriétés CSS à animer
   * @param {number} [duration=300] - Durée de l'animation en ms
   * @param {string} [easing='ease'] - Fonction de timing
   * @param {Function} [callback] - Fonction à exécuter à la fin de l'animation
   */
  export const animate = (element, properties, duration = 300, easing = 'ease', callback) => {
    // Sauvegarde des propriétés initiales
    const initialProperties = {};
    
    // Configuration de la transition
    element.style.transition = Object.keys(properties)
      .map(prop => `${prop} ${duration}ms ${easing}`)
      .join(', ');
    
    // Ajout d'un écouteur pour la fin de la transition
    const onTransitionEnd = (e) => {
      if (e.target === element) {
        element.removeEventListener('transitionend', onTransitionEnd);
        element.style.transition = '';
        
        if (typeof callback === 'function') {
          callback();
        }
      }
    };
    
    element.addEventListener('transitionend', onTransitionEnd);
    
    // Application des propriétés
    Object.entries(properties).forEach(([prop, value]) => {
      initialProperties[prop] = element.style[prop];
      element.style[prop] = value;
    });
  };