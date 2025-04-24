/**
 * Utilitaires pour analyser et manipuler les URLs et les paramètres de requête
 */

/**
 * Analyse une chaîne de requête et retourne un objet avec les paramètres
 * @param {string} queryString - Chaîne de requête (commence généralement par '?')
 * @returns {Object} Objet contenant les paramètres
 */
export const parseQueryString = (queryString) => {
    // Supprime le point d'interrogation initial s'il existe
    const query = queryString.startsWith('?') ? queryString.substring(1) : queryString;
    
    // Si la chaîne est vide, retourne un objet vide
    if (!query) {
      return {};
    }
    
    // Divise la chaîne en paires clé-valeur et construit l'objet
    return query.split('&').reduce((params, pair) => {
      const [key, value] = pair.split('=');
      
      // Décode les clés et les valeurs URI
      const decodedKey = decodeURIComponent(key);
      const decodedValue = value ? decodeURIComponent(value) : '';
      
      // Gère les tableaux dans les paramètres (param[]=value1&param[]=value2)
      if (decodedKey.endsWith('[]')) {
        const arrayKey = decodedKey.slice(0, -2);
        if (!params[arrayKey]) {
          params[arrayKey] = [];
        }
        params[arrayKey].push(decodedValue);
      } else {
        // Pour les paramètres simples
        params[decodedKey] = decodedValue;
      }
      
      return params;
    }, {});
  };
  
  /**
   * Récupère les paramètres de l'URL actuelle
   * @returns {Object} Objet contenant les paramètres de l'URL
   */
  export const getUrlParams = () => {
    return parseQueryString(window.location.search);
  };
  
  /**
   * Récupère un paramètre spécifique de l'URL actuelle
   * @param {string} name - Nom du paramètre à récupérer
   * @param {string|null} defaultValue - Valeur par défaut si le paramètre n'existe pas
   * @returns {string|null} Valeur du paramètre ou valeur par défaut
   */
  export const getUrlParam = (name, defaultValue = null) => {
    const params = getUrlParams();
    return params[name] !== undefined ? params[name] : defaultValue;
  };
  
  /**
   * Construit une chaîne de requête à partir d'un objet de paramètres
   * @param {Object} params - Objet contenant les paramètres
   * @returns {string} Chaîne de requête (commence par '?')
   */
  export const buildQueryString = (params) => {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    
    const queryParts = [];
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        // Ignore les valeurs null/undefined
        return;
      }
      
      if (Array.isArray(value)) {
        // Gère les tableaux
        value.forEach(item => {
          queryParts.push(`${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`);
        });
      } else {
        // Gère les valeurs simples
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });
    
    return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  };
  
  /**
   * Met à jour les paramètres de l'URL actuelle sans recharger la page
   * @param {Object} params - Paramètres à mettre à jour
   * @param {Object} options - Options de mise à jour
   * @param {boolean} [options.replace=false] - Remplacer l'état actuel au lieu de l'ajouter à l'historique
   * @param {boolean} [options.merge=true] - Fusionner avec les paramètres existants
   */
  export const updateUrlParams = (params, { replace = false, merge = true } = {}) => {
    const currentParams = merge ? getUrlParams() : {};
    const updatedParams = { ...currentParams, ...params };
    
    // Supprime les paramètres avec des valeurs null ou undefined
    Object.keys(updatedParams).forEach(key => {
      if (updatedParams[key] === null || updatedParams[key] === undefined) {
        delete updatedParams[key];
      }
    });
    
    const queryString = buildQueryString(updatedParams);
    const newUrl = `${window.location.pathname}${queryString}${window.location.hash}`;
    
    if (replace) {
      window.history.replaceState({}, '', newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  };
  
  /**
   * Supprime des paramètres de l'URL actuelle
   * @param {string|Array} paramNames - Nom(s) des paramètre(s) à supprimer
   * @param {boolean} [replace=true] - Remplacer l'état actuel au lieu de l'ajouter à l'historique
   */
  export const removeUrlParams = (paramNames, replace = true) => {
    const params = getUrlParams();
    const names = Array.isArray(paramNames) ? paramNames : [paramNames];
    
    names.forEach(name => {
      delete params[name];
    });
    
    const queryString = buildQueryString(params);
    const newUrl = `${window.location.pathname}${queryString}${window.location.hash}`;
    
    if (replace) {
      window.history.replaceState({}, '', newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  };
  
  /**
   * Vérifie si un paramètre spécifique existe dans l'URL
   * @param {string} name - Nom du paramètre
   * @returns {boolean} True si le paramètre existe
   */
  export const hasUrlParam = (name) => {
    const params = getUrlParams();
    return params[name] !== undefined;
  };
  
  /**
   * Analyse les composants d'une URL
   * @param {string} url - URL à analyser
   * @returns {Object} Objet contenant les différents composants de l'URL
   */
  export const parseUrl = (url) => {
    try {
      const parser = document.createElement('a');
      parser.href = url;
      
      // Extraction des paramètres de requête
      const queryParams = parseQueryString(parser.search);
      
      // Extraction des fragments
      const hashParts = parser.hash.startsWith('#') ? parser.hash.substring(1) : parser.hash;
      const hashParams = hashParts.includes('?') 
        ? parseQueryString(hashParts.split('?')[1]) 
        : {};
      
      return {
        protocol: parser.protocol,
        host: parser.host,
        hostname: parser.hostname,
        port: parser.port,
        pathname: parser.pathname,
        search: parser.search,
        hash: parser.hash,
        queryParams,
        hashParams,
        origin: parser.origin || `${parser.protocol}//${parser.host}`,
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse de l\'URL:', error);
      return {
        protocol: '',
        host: '',
        hostname: '',
        port: '',
        pathname: '',
        search: '',
        hash: '',
        queryParams: {},
        hashParams: {},
        origin: '',
      };
    }
  };
  
  /**
   * Construit une URL complète à partir des composants
   * @param {Object} components - Composants de l'URL
   * @returns {string} URL complète
   */
  export const buildUrl = (components) => {
    const {
      protocol = window.location.protocol,
      host = window.location.host,
      pathname = '',
      queryParams = {},
      hash = '',
    } = components;
    
    const queryString = buildQueryString(queryParams);
    const hashString = hash ? `#${hash}` : '';
    
    // Assure que le protocole a ":" à la fin
    const normalizedProtocol = protocol.endsWith(':') ? protocol : `${protocol}:`;
    
    return `${normalizedProtocol}//${host}${pathname}${queryString}${hashString}`;
  };
  
  /**
   * Récupère les segments du chemin de l'URL
   * @param {string} [pathname=window.location.pathname] - Chemin à analyser
   * @returns {Array} Tableau des segments du chemin
   */
  export const getPathSegments = (pathname = window.location.pathname) => {
    return pathname.split('/').filter(segment => segment !== '');
  };
  
  /**
   * Joins les segments de chemin en une seule URL
   * @param {...string} segments - Segments de chemin à joindre
   * @returns {string} Chemin URL combiné
   */
  export const joinPaths = (...segments) => {
    return segments
      .map(segment => segment.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  };
  
  /**
   * Vérifie si une URL est absolue
   * @param {string} url - URL à vérifier
   * @returns {boolean} True si l'URL est absolue
   */
  export const isAbsoluteUrl = (url) => {
    return /^(?:[a-z]+:)?\/\//i.test(url);
  };
  
  /**
   * Vérifie si une URL est relative
   * @param {string} url - URL à vérifier
   * @returns {boolean} True si l'URL est relative
   */
  export const isRelativeUrl = (url) => {
    return !isAbsoluteUrl(url);
  };
  
  /**
   * Convertit une URL relative en URL absolue
   * @param {string} relativeUrl - URL relative
   * @param {string} [base=window.location.origin] - URL de base
   * @returns {string} URL absolue
   */
  export const toAbsoluteUrl = (relativeUrl, base = window.location.origin) => {
    if (isAbsoluteUrl(relativeUrl)) {
      return relativeUrl;
    }
    
    // Normaliser l'URL de base pour s'assurer qu'elle se termine par "/"
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    // Normaliser l'URL relative pour s'assurer qu'elle ne commence pas par "/"
    const normalizedRelative = relativeUrl.startsWith('/') 
      ? relativeUrl.substring(1) 
      : relativeUrl;
    
    return `${normalizedBase}${normalizedRelative}`;
  };
  
  /**
   * Extrait les paramètres d'une URL YouTube
   * @param {string} url - URL YouTube
   * @returns {Object|null} Objet contenant l'ID de la vidéo et d'autres paramètres, ou null si invalide
   */
  export const parseYoutubeUrl = (url) => {
    if (!url) return null;
    
    // Patterns pour différents formats d'URL YouTube
    const patterns = [
      // youtu.be/ID
      /youtu\.be\/([^?&#]+)/,
      // youtube.com/watch?v=ID
      /youtube\.com\/watch\?(?:[^&]+&)*v=([^&#]+)/,
      // youtube.com/embed/ID
      /youtube\.com\/embed\/([^?&#]+)/,
      // youtube.com/v/ID
      /youtube\.com\/v\/([^?&#]+)/
    ];
    
    let videoId = null;
    
    // Teste chaque pattern
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        videoId = match[1];
        break;
      }
    }
    
    if (!videoId) {
      return null;
    }
    
    // Parse les autres paramètres
    const urlObj = parseUrl(url);
    const { queryParams } = urlObj;
    
    return {
      videoId,
      start: queryParams.t || queryParams.start,
      list: queryParams.list, // ID de playlist
      index: queryParams.index, // Index dans la playlist
      ...queryParams
    };
  };
  
  /**
   * Construit une URL YouTube à partir des paramètres
   * @param {Object} params - Paramètres de l'URL
   * @param {string} params.videoId - ID de la vidéo
   * @param {string} [params.format='embed'] - Format de l'URL (embed, watch, short)
   * @param {Object} [params.options={}] - Options supplémentaires (start, autoplay, etc.)
   * @returns {string} URL YouTube
   */
  export const buildYoutubeUrl = (params) => {
    const { videoId, format = 'embed', options = {} } = params;
    
    if (!videoId) {
      throw new Error('VideoId est requis pour générer une URL YouTube');
    }
    
    let baseUrl;
    
    switch (format) {
      case 'embed':
        baseUrl = `https://www.youtube.com/embed/${videoId}`;
        break;
      case 'watch':
        baseUrl = `https://www.youtube.com/watch?v=${videoId}`;
        break;
      case 'short':
        baseUrl = `https://youtu.be/${videoId}`;
        break;
      default:
        baseUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Construire les paramètres de requête
    const queryParams = { ...options };
    
    // Supprimer videoId de queryParams s'il existe
    delete queryParams.videoId;
    
    // Pour les URLs de type 'watch' ou 'short', le paramètre 't' est utilisé pour le temps de départ
    if ((format === 'watch' || format === 'short') && queryParams.start) {
      queryParams.t = queryParams.start;
      delete queryParams.start;
    }
    
    const queryString = buildQueryString(queryParams);
    
    return `${baseUrl}${queryString}`;
  };
  
  export default {
    parseQueryString,
    getUrlParams,
    getUrlParam,
    buildQueryString,
    updateUrlParams,
    removeUrlParams,
    hasUrlParam,
    parseUrl,
    buildUrl,
    getPathSegments,
    joinPaths,
    isAbsoluteUrl,
    isRelativeUrl,
    toAbsoluteUrl,
    parseYoutubeUrl,
    buildYoutubeUrl
  };