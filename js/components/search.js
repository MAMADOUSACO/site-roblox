/**
 * Module de recherche
 * Gère la fonctionnalité de recherche et le panneau de recherche avancée
 */

import { 
    select, 
    selectAll, 
    onEvent, 
    toggleClass,
    createElement,
    hasClass
  } from '../utils/dom-helpers.js';
  
  import { 
    setItem, 
    getItem, 
    addToArray, 
    getArray, 
    removeFromArray 
  } from '../utils/local-storage.js';
  
  import { 
    showLoader, 
    hideLoader 
  } from '../animations/loading-animation.js';
  
  import { 
    searchVideos,
    getAllVideos,
    filterVideos,
    LEVEL
  } from '../data/videos.js';
  
  import { getThumbnailUrl, extractVideoId } from '../utils/youtube-thumbnail.js';
  
  // Configuration
  const CONFIG = {
    SEARCH_DELAY: 300,           // Délai avant lancement de la recherche (ms)
    MIN_SEARCH_LENGTH: 2,        // Longueur minimale pour lancer une recherche
    MAX_RESULTS: 10,             // Nombre maximum de résultats affichés
    MAX_RECENT_SEARCHES: 5,      // Nombre maximum de recherches récentes à conserver
    STORAGE_KEY: 'recent-searches', // Clé pour le stockage local
    HIGHLIGHT_CLASS: 'search-highlight' // Classe pour la mise en surbrillance des résultats
  };
  
  // État du composant
  const state = {
    searchTimeout: null,         // Timeout pour la recherche
    currentQuery: '',            // Requête de recherche actuelle
    isLoading: false,            // État de chargement
    isAdvancedSearchOpen: false, // État du panneau de recherche avancée
    advancedFilters: {           // Filtres avancés
      level: '',
      creator: '',
      duration: '',
      date: ''
    }
  };
  
  /**
   * Initialise le composant de recherche
   */
  export const initSearch = () => {
    // Sélection des éléments
    const searchInput = select('.search-input');
    const searchClear = select('.search-clear');
    const searchIcon = select('.search-icon');
    const searchLoading = select('.search-loading');
    const searchResults = select('.search-results');
    const advancedToggle = select('.advanced-search-toggle');
    const advancedPanel = select('.advanced-search-panel');
    const advancedForm = select('.advanced-search-form');
    const resetButton = select('.advanced-search-panel .filters-clear');
    const applyButton = select('.advanced-search-panel .filters-apply');
    
    if (!searchInput) return;
    
    // Événement de saisie dans le champ de recherche
    onEvent(searchInput, 'input', handleSearchInput);
    
    // Événement de focus sur le champ de recherche
    onEvent(searchInput, 'focus', () => {
      if (searchInput.value.length > 0) {
        showSearchResults();
      } else {
        showRecentSearches();
      }
    });
    
    // Événement de clic sur le bouton d'effacement
    if (searchClear) {
      onEvent(searchClear, 'click', clearSearch);
    }
    
    // Événement de clic en dehors pour masquer les résultats
    document.addEventListener('click', (e) => {
      const container = select('.search-container');
      if (container && !container.contains(e.target)) {
        hideSearchResults();
      }
    });
    
    // Événement de clic sur le bouton de recherche avancée
    if (advancedToggle) {
      onEvent(advancedToggle, 'click', toggleAdvancedSearch);
    }
    
    // Événements pour les boutons du panneau de recherche avancée
    if (resetButton) {
      onEvent(resetButton, 'click', resetAdvancedSearch);
    }
    
    if (applyButton) {
      onEvent(applyButton, 'click', applyAdvancedSearch);
    }
    
    // Initialisation des recherches récentes
    initRecentSearches();
  };
  
  /**
   * Gère la saisie dans le champ de recherche
   * @param {Event} e - Événement d'input
   */
  const handleSearchInput = (e) => {
    const searchInput = e.target;
    const query = searchInput.value.trim();
    const searchClear = select('.search-clear');
    
    // Mise à jour de l'état
    state.currentQuery = query;
    
    // Affichage/masquage du bouton d'effacement
    if (searchClear) {
      toggleClass(searchClear, 'visible', query.length > 0);
    }
    
    // Annulation de la recherche précédente
    if (state.searchTimeout) {
      clearTimeout(state.searchTimeout);
    }
    
    // Si la recherche est vide, masquer les résultats
    if (query.length === 0) {
      hideSearchResults();
      showRecentSearches();
      return;
    }
    
    // Lancement de la recherche après délai
    if (query.length >= CONFIG.MIN_SEARCH_LENGTH) {
      setSearchLoading(true);
      state.searchTimeout = setTimeout(() => {
        performSearch(query);
      }, CONFIG.SEARCH_DELAY);
    }
  };
  
  /**
   * Effectue la recherche et affiche les résultats
   * @param {string} query - Requête de recherche
   */
  const performSearch = (query) => {
    // Appliquer les filtres avancés si nécessaires
    const filters = { ...state.advancedFilters };
    
    // Recherche dans les vidéos
    let results = searchVideos(query);
    
    // Application des filtres avancés si renseignés
    if (filters.level || filters.creator || filters.duration || filters.date) {
      results = filterVideos({
        ...filters,
        searchQuery: query
      });
    }
    
    // Limitation du nombre de résultats
    const limitedResults = results.slice(0, CONFIG.MAX_RESULTS);
    
    // Affichage des résultats
    displaySearchResults(limitedResults, query);
    
    // Fin du chargement
    setSearchLoading(false);
    
    // Si nous avons des résultats, ajouter à l'historique
    if (results.length > 0 && query.length >= CONFIG.MIN_SEARCH_LENGTH) {
      addToRecentSearches(query);
    }
  };
  
  /**
   * Affiche les résultats de recherche
   * @param {Array} results - Résultats de recherche
   * @param {string} query - Requête de recherche
   */
  const displaySearchResults = (results, query) => {
    const searchResults = select('.search-results');
    if (!searchResults) return;
    
    // Vider les résultats précédents
    searchResults.innerHTML = '';
    
    // Si aucun résultat
    if (results.length === 0) {
      searchResults.innerHTML = `
        <div class="search-results-empty">
          <div class="search-results-empty-icon">🔍</div>
          <div class="search-results-empty-title">Aucun résultat trouvé</div>
          <div class="search-results-empty-message">
            Essayez avec d'autres termes ou vérifiez vos filtres.
          </div>
        </div>
      `;
    } else {
      // Création des éléments de résultat
      results.forEach(video => {
        const resultItem = createElement('div', {
          className: 'search-result-item',
          dataset: { id: video.id }
        });
        
        // Extraction de la miniature
        const thumbnailUrl = video.thumbnailUrl || getThumbnailUrl(video.id);
        
        // Mise en surbrillance du texte correspondant à la recherche
        const highlightedTitle = highlightText(video.title, query);
        
        resultItem.innerHTML = `
          <div class="search-result-thumbnail">
            <img src="${thumbnailUrl}" alt="${video.title}">
          </div>
          <div class="search-result-content">
            <div class="search-result-title">${highlightedTitle}</div>
            <div class="search-result-info">
              <span class="search-result-category">${getLevelLabel(video.level)}</span>
              <span class="search-result-creator">${video.creator}</span>
              ${video.duration ? `<span class="search-result-separator">•</span><span class="search-result-duration">${video.duration}</span>` : ''}
            </div>
          </div>
        `;
        
        // Événement de clic sur un résultat
        resultItem.addEventListener('click', () => {
          handleResultClick(video);
        });
        
        searchResults.appendChild(resultItem);
      });
    }
    
    // Affichage des résultats
    showSearchResults();
  };
  
  /**
   * Met en surbrillance le texte correspondant à la recherche
   * @param {string} text - Texte à traiter
   * @param {string} query - Requête de recherche
   * @returns {string} Texte avec mise en surbrillance
   */
  const highlightText = (text, query) => {
    if (!query || query.length < 2) return text;
    
    // Échapper les caractères spéciaux pour éviter les problèmes de regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Créer une expression régulière pour rechercher le terme (insensible à la casse)
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // Remplacer toutes les occurrences par la version surlignée
    return text.replace(regex, `<span class="${CONFIG.HIGHLIGHT_CLASS}">$1</span>`);
  };
  
  /**
   * Gère le clic sur un résultat de recherche
   * @param {Object} video - Données de la vidéo
   */
  const handleResultClick = (video) => {
    // Rediriger vers la vidéo ou afficher le modal
    if (typeof window.openVideoModal === 'function') {
      window.openVideoModal(video.id);
    } else {
      window.location.href = video.url;
    }
    
    // Masquer les résultats
    hideSearchResults();
    
    // Effacer la recherche
    const searchInput = select('.search-input');
    if (searchInput) {
      searchInput.value = '';
      state.currentQuery = '';
      
      // Masquer le bouton d'effacement
      const searchClear = select('.search-clear');
      if (searchClear) {
        searchClear.classList.remove('visible');
      }
    }
  };
  
  /**
   * Affiche les résultats de recherche
   */
  const showSearchResults = () => {
    const searchResults = select('.search-results');
    if (!searchResults) return;
    
    searchResults.classList.add('visible');
  };
  
  /**
   * Masque les résultats de recherche
   */
  const hideSearchResults = () => {
    const searchResults = select('.search-results');
    if (!searchResults) return;
    
    searchResults.classList.remove('visible');
  };
  
  /**
   * Efface la recherche
   */
  const clearSearch = () => {
    const searchInput = select('.search-input');
    const searchClear = select('.search-clear');
    
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
      state.currentQuery = '';
    }
    
    if (searchClear) {
      searchClear.classList.remove('visible');
    }
    
    // Masquer les résultats
    hideSearchResults();
    
    // Afficher les recherches récentes
    showRecentSearches();
  };
  
  /**
   * Active/désactive l'état de chargement
   * @param {boolean} isLoading - État de chargement
   */
  const setSearchLoading = (isLoading) => {
    state.isLoading = isLoading;
    
    const searchLoading = select('.search-loading');
    const searchIcon = select('.search-icon');
    
    if (searchLoading) {
      toggleClass(searchLoading, 'visible', isLoading);
    }
    
    if (searchIcon) {
      toggleClass(searchIcon, 'hidden', isLoading);
    }
  };
  
  /**
   * Affiche/masque le panneau de recherche avancée
   */
  const toggleAdvancedSearch = () => {
    const advancedToggle = select('.advanced-search-toggle');
    const advancedPanel = select('.advanced-search-panel');
    
    if (!advancedToggle || !advancedPanel) return;
    
    state.isAdvancedSearchOpen = !state.isAdvancedSearchOpen;
    
    toggleClass(advancedToggle, 'active', state.isAdvancedSearchOpen);
    toggleClass(advancedPanel, 'visible', state.isAdvancedSearchOpen);
  };
  
  /**
   * Réinitialise les filtres de recherche avancée
   */
  const resetAdvancedSearch = () => {
    const selects = selectAll('.advanced-search-select');
    
    // Réinitialiser tous les selects
    selects.forEach(select => {
      select.selectedIndex = 0;
    });
    
    // Réinitialiser l'état
    state.advancedFilters = {
      level: '',
      creator: '',
      duration: '',
      date: ''
    };
    
    // Si une recherche est en cours, la relancer sans les filtres
    if (state.currentQuery.length >= CONFIG.MIN_SEARCH_LENGTH) {
      performSearch(state.currentQuery);
    }
  };
  
  /**
   * Applique les filtres de recherche avancée
   */
  const applyAdvancedSearch = () => {
    // Récupérer les valeurs des filtres
    const levelSelect = select('.advanced-search-select[name="level"]');
    const creatorSelect = select('.advanced-search-select[name="creator"]');
    const durationSelect = select('.advanced-search-select[name="duration"]');
    const dateSelect = select('.advanced-search-select[name="date"]');
    
    // Mettre à jour l'état
    state.advancedFilters = {
      level: levelSelect ? levelSelect.value : '',
      creator: creatorSelect ? creatorSelect.value : '',
      duration: durationSelect ? durationSelect.value : '',
      date: dateSelect ? dateSelect.value : ''
    };
    
    // Masquer le panneau
    toggleAdvancedSearch();
    
    // Relancer la recherche avec les filtres
    if (state.currentQuery.length >= CONFIG.MIN_SEARCH_LENGTH) {
      performSearch(state.currentQuery);
    } else {
      // Si pas de recherche en cours, afficher un message
      const searchResults = select('.search-results');
      if (searchResults) {
        searchResults.innerHTML = `
          <div class="search-results-empty">
            <div class="search-results-empty-icon">🔍</div>
            <div class="search-results-empty-title">Entrez une recherche</div>
            <div class="search-results-empty-message">
              Veuillez saisir un terme de recherche pour utiliser les filtres.
            </div>
          </div>
        `;
        showSearchResults();
      }
    }
  };
  
  /**
   * Initialise l'affichage des recherches récentes
   */
  const initRecentSearches = () => {
    const searchResults = select('.search-results');
    if (!searchResults) return;
    
    // Récupération des recherches récentes depuis le localStorage
    const recentSearches = getArray(CONFIG.STORAGE_KEY, []);
    
    // Si pas de recherches récentes, ne rien faire
    if (recentSearches.length === 0) return;
    
    // Création de l'élément de recherches récentes
    const recentSearchesContainer = createElement('div', {
      className: 'recent-searches'
    });
    
    recentSearchesContainer.innerHTML = `
      <div class="recent-searches-title">Recherches récentes</div>
      <div class="recent-searches-list"></div>
    `;
    
    const recentSearchesList = recentSearchesContainer.querySelector('.recent-searches-list');
    
    // Ajout des recherches récentes
    recentSearches.forEach(search => {
      const tag = createElement('div', {
        className: 'recent-search-tag'
      });
      
      tag.innerHTML = `
        <span class="recent-search-tag-text">${search}</span>
        <span class="recent-search-tag-close" data-search="${search}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
      `;
      
      // Événement de clic sur une recherche récente
      tag.addEventListener('click', (e) => {
        // Si clic sur le bouton de fermeture
        if (e.target.closest('.recent-search-tag-close')) {
          e.stopPropagation();
          const search = e.target.closest('.recent-search-tag-close').dataset.search;
          removeFromRecentSearches(search);
          tag.remove();
          
          // Si plus de recherches récentes, masquer le conteneur
          if (recentSearchesList.children.length === 0) {
            recentSearchesContainer.remove();
          }
        } else {
          // Sinon, appliquer la recherche
          const searchInput = select('.search-input');
          if (searchInput) {
            searchInput.value = search;
            searchInput.focus();
            state.currentQuery = search;
            
            // Afficher le bouton d'effacement
            const searchClear = select('.search-clear');
            if (searchClear) {
              searchClear.classList.add('visible');
            }
            
            // Lancer la recherche
            performSearch(search);
          }
        }
      });
      
      recentSearchesList.appendChild(tag);
    });
    
    searchResults.appendChild(recentSearchesContainer);
  };
  
  /**
   * Affiche les recherches récentes
   */
  const showRecentSearches = () => {
    const searchResults = select('.search-results');
    if (!searchResults) return;
    
    // Vider les résultats précédents
    searchResults.innerHTML = '';
    
    // Récupération des recherches récentes
    const recentSearches = getArray(CONFIG.STORAGE_KEY, []);
    
    // Si pas de recherches récentes, ne rien faire
    if (recentSearches.length === 0) return;
    
    // Affichage des recherches récentes
    initRecentSearches();
    showSearchResults();
  };
  
  /**
   * Ajoute une recherche à l'historique des recherches récentes
   * @param {string} search - Recherche à ajouter
   */
  const addToRecentSearches = (search) => {
    if (!search || search.length < CONFIG.MIN_SEARCH_LENGTH) return;
    
    // Récupération des recherches récentes
    let recentSearches = getArray(CONFIG.STORAGE_KEY, []);
    
    // Suppression si déjà présente
    recentSearches = recentSearches.filter(item => item !== search);
    
    // Ajout en début de liste
    recentSearches.unshift(search);
    
    // Limitation du nombre de recherches
    if (recentSearches.length > CONFIG.MAX_RECENT_SEARCHES) {
      recentSearches = recentSearches.slice(0, CONFIG.MAX_RECENT_SEARCHES);
    }
    
    // Sauvegarde
    setItem(CONFIG.STORAGE_KEY, recentSearches);
  };
  
  /**
   * Supprime une recherche de l'historique des recherches récentes
   * @param {string} search - Recherche à supprimer
   */
  const removeFromRecentSearches = (search) => {
    if (!search) return;
    
    // Récupération des recherches récentes
    const recentSearches = getArray(CONFIG.STORAGE_KEY, []);
    
    // Suppression
    const updatedSearches = recentSearches.filter(item => item !== search);
    
    // Sauvegarde
    setItem(CONFIG.STORAGE_KEY, updatedSearches);
  };
  
  /**
   * Obtient le libellé d'un niveau
   * @param {string} level - Niveau (BEGINNER, INTERMEDIATE, etc.)
   * @returns {string} Libellé du niveau
   */
  const getLevelLabel = (level) => {
    switch (level) {
      case LEVEL.BEGINNER:
        return 'Débutant';
      case LEVEL.INTERMEDIATE:
        return 'Intermédiaire';
      case LEVEL.ADVANCED:
        return 'Avancé';
      case LEVEL.PRINCIPLES:
        return 'Principes';
      default:
        return 'Tous niveaux';
    }
  };
  
  // Exportation de l'API publique
  export default {
    initSearch,
    performSearch
  };