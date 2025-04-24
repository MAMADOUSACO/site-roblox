/**
 * Utilitaires pour faciliter l'utilisation du localStorage
 * avec gestion des erreurs et support de types complexes
 */

/**
 * Vérifie si le localStorage est disponible
 * @returns {boolean} True si localStorage est disponible
 */
const isLocalStorageAvailable = () => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  /**
   * Enregistre une valeur dans le localStorage
   * @param {string} key - Clé de stockage
   * @param {any} value - Valeur à stocker (sera convertie en JSON)
   * @param {number} [expiryTime] - Temps d'expiration en millisecondes (optionnel)
   * @returns {boolean} True si l'opération a réussi
   */
  export const setItem = (key, value, expiryTime) => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return false;
    }
    
    try {
      const item = {
        value: value,
        timestamp: Date.now()
      };
      
      // Ajouter le temps d'expiration si fourni
      if (expiryTime) {
        item.expiry = Date.now() + expiryTime;
      }
      
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement dans localStorage:', error);
      return false;
    }
  };
  
  /**
   * Récupère une valeur du localStorage
   * @param {string} key - Clé de stockage
   * @param {any} [defaultValue=null] - Valeur par défaut si la clé n'existe pas
   * @returns {any} Valeur stockée ou valeur par défaut
   */
  export const getItem = (key, defaultValue = null) => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return defaultValue;
    }
    
    try {
      const itemStr = localStorage.getItem(key);
      
      // Retourne la valeur par défaut si la clé n'existe pas
      if (!itemStr) {
        return defaultValue;
      }
      
      const item = JSON.parse(itemStr);
      
      // Vérifie si l'objet stocké est expiré
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      return item.value;
    } catch (error) {
      console.error('Erreur lors de la récupération depuis localStorage:', error);
      return defaultValue;
    }
  };
  
  /**
   * Supprime une valeur du localStorage
   * @param {string} key - Clé de stockage
   * @returns {boolean} True si l'opération a réussi
   */
  export const removeItem = (key) => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression depuis localStorage:', error);
      return false;
    }
  };
  
  /**
   * Efface toutes les données du localStorage
   * @returns {boolean} True si l'opération a réussi
   */
  export const clearAll = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return false;
    }
    
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'effacement du localStorage:', error);
      return false;
    }
  };
  
  /**
   * Vérifie si une clé existe dans le localStorage
   * @param {string} key - Clé à vérifier
   * @returns {boolean} True si la clé existe
   */
  export const hasItem = (key) => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return false;
    }
    
    try {
      const item = localStorage.getItem(key);
      return item !== null;
    } catch (error) {
      console.error('Erreur lors de la vérification dans localStorage:', error);
      return false;
    }
  };
  
  /**
   * Récupère toutes les clés du localStorage
   * @returns {Array} Liste des clés
   */
  export const getAllKeys = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return [];
    }
    
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Erreur lors de la récupération des clés du localStorage:', error);
      return [];
    }
  };
  
  /**
   * Nettoie les éléments expirés du localStorage
   * @returns {number} Nombre d'éléments supprimés
   */
  export const clearExpired = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return 0;
    }
    
    let removedCount = 0;
    
    try {
      const keys = getAllKeys();
      const now = Date.now();
      
      keys.forEach(key => {
        const itemStr = localStorage.getItem(key);
        
        if (itemStr) {
          try {
            const item = JSON.parse(itemStr);
            
            if (item.expiry && now > item.expiry) {
              localStorage.removeItem(key);
              removedCount++;
            }
          } catch (e) {
            // Ignorer les éléments qui ne sont pas au format JSON attendu
          }
        }
      });
      
      return removedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage des éléments expirés:', error);
      return 0;
    }
  };
  
  /**
   * Récupère la taille totale utilisée par le localStorage
   * @returns {number} Taille en octets
   */
  export const getSize = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return 0;
    }
    
    try {
      let totalSize = 0;
      const keys = getAllKeys();
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        totalSize += (key.length + value.length) * 2; // caractères UTF-16 = 2 octets
      });
      
      return totalSize;
    } catch (error) {
      console.error('Erreur lors du calcul de la taille du localStorage:', error);
      return 0;
    }
  };
  
  /**
   * Récupère un objet avec toutes les valeurs du localStorage
   * @returns {Object} Objet contenant toutes les valeurs
   */
  export const getAllItems = () => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return {};
    }
    
    try {
      const keys = getAllKeys();
      const items = {};
      
      keys.forEach(key => {
        items[key] = getItem(key);
      });
      
      return items;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les éléments:', error);
      return {};
    }
  };
  
  /**
   * Définit plusieurs éléments à la fois dans le localStorage
   * @param {Object} items - Objet contenant les paires clé-valeur à stocker
   * @param {number} [expiryTime] - Temps d'expiration en millisecondes (optionnel)
   * @returns {boolean} True si l'opération a réussi
   */
  export const setItems = (items, expiryTime) => {
    if (!isLocalStorageAvailable()) {
      console.warn('LocalStorage n\'est pas disponible dans ce navigateur');
      return false;
    }
    
    try {
      Object.entries(items).forEach(([key, value]) => {
        setItem(key, value, expiryTime);
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement multiple dans localStorage:', error);
      return false;
    }
  };
  
  /**
   * Enregistre un tableau dans le localStorage
   * @param {string} key - Clé de stockage
   * @param {Array} array - Tableau à stocker
   * @param {number} [expiryTime] - Temps d'expiration en millisecondes (optionnel)
   * @returns {boolean} True si l'opération a réussi
   */
  export const setArray = (key, array, expiryTime) => {
    return setItem(key, array, expiryTime);
  };
  
  /**
   * Récupère un tableau du localStorage
   * @param {string} key - Clé de stockage
   * @param {Array} [defaultValue=[]] - Valeur par défaut si la clé n'existe pas
   * @returns {Array} Tableau stocké ou valeur par défaut
   */
  export const getArray = (key, defaultValue = []) => {
    const value = getItem(key, defaultValue);
    return Array.isArray(value) ? value : defaultValue;
  };
  
  /**
   * Ajoute un élément à un tableau stocké dans le localStorage
   * @param {string} key - Clé de stockage
   * @param {any} item - Élément à ajouter
   * @param {number} [expiryTime] - Temps d'expiration en millisecondes (optionnel)
   * @returns {boolean} True si l'opération a réussi
   */
  export const addToArray = (key, item, expiryTime) => {
    const array = getArray(key);
    array.push(item);
    return setArray(key, array, expiryTime);
  };
  
  /**
   * Supprime un élément d'un tableau stocké dans le localStorage
   * @param {string} key - Clé de stockage
   * @param {Function} predicate - Fonction de filtre (retourne true pour les éléments à garder)
   * @param {number} [expiryTime] - Temps d'expiration en millisecondes (optionnel)
   * @returns {boolean} True si l'opération a réussi
   */
  export const removeFromArray = (key, predicate, expiryTime) => {
    const array = getArray(key);
    const filteredArray = array.filter(predicate);
    return setArray(key, filteredArray, expiryTime);
  };
  
  export default {
    setItem,
    getItem,
    removeItem,
    clearAll,
    hasItem,
    getAllKeys,
    clearExpired,
    getSize,
    getAllItems,
    setItems,
    setArray,
    getArray,
    addToArray,
    removeFromArray
  };