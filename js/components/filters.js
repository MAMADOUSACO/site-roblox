/**
 * Système de filtres pour les vidéos
 * Gère les interactions UI et l'application des filtres sur les vidéos
 */

import { 
    select, 
    selectAll, 
    onEvent, 
    toggleClass, 
    hasClass,
    createElement,
    closest 
} from '../utils/dom-helpers.js';

import { 
    getItem, 
    setItem, 
    removeItem 
} from '../utils/local-storage.js';

import {
    showLoader,
    hideLoader,
    toggleLoadMoreButton
} from '../animations/loading-animation.js';

import {
    filterVideos,
    LEVEL,
    creators,
    tags
} from '../data/videos.js';

// Stockage local des filtres (pour persistance)
const STORAGE_KEY = 'roblox-ui-filters';

// Configuration
const CONFIG = {
    animationDuration: 300,
    maxTagsToShow: 15,
    debounceTime: 250,
    filterChangeEvent: 'filters:changed'
};

// État des filtres
const state = {
    activeFilters: {
        level: [],
        creator: [],
        tags: [],
        duration: '',
        date: ''
    },
    panelVisible: false,
    searchQuery: ''
};

// Cache pour les éléments DOM fréquemment utilisés
const elements = {
    container: null,
    toggle: null,
    panel: null,
    searchInput: null,
    applyButton: null,
    clearButton: null,
    activeFiltersContainer: null,
    countBadge: null
};

/**
 * Initialise le composant de filtres
 */
export const initFilters = () => {
    // Récupère les éléments principaux
    cacheElements();
    
    // Si les éléments requis ne sont pas trouvés, on sort
    if (!elements.container || !elements.toggle) return;
    
    // Récupère les filtres sauvegardés
    loadSavedFilters();
    
    // Initialise les écouteurs d'événements
    initEventListeners();
    
    // Peuple les filtres avec les données disponibles
    populateFilterOptions();
    
    // Met à jour l'affichage des filtres actifs
    updateActiveFiltersDisplay();
    
    // Met à jour le badge de compteur
    updateFilterCount();
};

/**
 * Met en cache les éléments DOM fréquemment utilisés
 */
const cacheElements = () => {
    elements.container = select('.filters-container');
    if (!elements.container) return;
    
    elements.toggle = select('.filters-toggle', elements.container);
    elements.panel = select('.filters-panel', elements.container);
    elements.searchInput = select('.filter-search-input', elements.container);
    elements.applyButton = select('.filters-apply', elements.container);
    elements.clearButton = select('.filters-clear', elements.container);
    elements.activeFiltersContainer = select('.active-filters', elements.container);
    elements.countBadge = select('.filters-toggle-count', elements.container);
};

/**
 * Initialise tous les écouteurs d'événements
 */
const initEventListeners = () => {
    // Écouteur pour le bouton de toggle du panneau
    if (elements.toggle) {
        onEvent(elements.toggle, 'click', toggleFilterPanel);
    }
    
    // Écouteurs pour les titres de groupes de filtres
    onEvent('.filter-group-title', 'click', toggleFilterGroup);
    
    // Écouteurs pour les checkboxes et boutons radio
    onEvent('.filter-checkbox-input', 'change', handleFilterChange);
    onEvent('.filter-radio-input', 'change', handleFilterChange);
    
    // Écouteur pour les tags de filtre
    onEvent('.filter-tag', 'click', handleTagClick);
    
    // Écouteur pour la recherche dans les filtres
    if (elements.searchInput) {
        onEvent(elements.searchInput, 'input', debounce(handleFilterSearch, CONFIG.debounceTime));
    }
    
    // Écouteurs pour les boutons d'application et de réinitialisation
    if (elements.applyButton) {
        onEvent(elements.applyButton, 'click', applyFilters);
    }
    
    if (elements.clearButton) {
        onEvent(elements.clearButton, 'click', clearAllFilters);
    }
    
    // Écouteur pour supprimer un filtre actif
    if (elements.activeFiltersContainer) {
        onEvent(elements.activeFiltersContainer, 'click', handleActiveFilterRemove);
    }
    
    // Ferme le panneau si on clique en dehors
    document.addEventListener('click', (e) => {
        if (state.panelVisible && !closest(e.target, '.filters-container')) {
            toggleFilterPanel(false);
        }
    });
};

/**
 * Charge les filtres sauvegardés depuis le stockage local
 */
const loadSavedFilters = () => {
    const savedFilters = getItem(STORAGE_KEY);
    if (savedFilters) {
        state.activeFilters = {...state.activeFilters, ...savedFilters};
    }
};

/**
 * Sauvegarde l'état actuel des filtres dans le stockage local
 */
const saveFilters = () => {
    setItem(STORAGE_KEY, state.activeFilters);
};

/**
 * Ouvre ou ferme le panneau de filtres
 * @param {Event|boolean} eventOrState - Événement ou état booléen
 */
const toggleFilterPanel = (eventOrState) => {
    // Détermine si le panneau doit être visible
    const shouldBeVisible = typeof eventOrState === 'boolean' 
        ? eventOrState 
        : !state.panelVisible;
    
    // Met à jour l'état
    state.panelVisible = shouldBeVisible;
    
    // Met à jour le DOM
    if (elements.panel) {
        toggleClass(elements.panel, 'visible', shouldBeVisible);
    }
    
    if (elements.toggle) {
        toggleClass(elements.toggle, 'active', shouldBeVisible);
    }
};

/**
 * Ouvre ou ferme un groupe de filtres
 * @param {Event} event - Événement de clic
 */
const toggleFilterGroup = (event) => {
    const title = event.currentTarget;
    const icon = title.querySelector('.filter-group-title-icon');
    const content = title.nextElementSibling;
    
    if (!content || !icon) return;
    
    const isCollapsed = hasClass(icon, 'collapsed');
    
    // Inverse l'état
    toggleClass(icon, 'collapsed', !isCollapsed);
    toggleClass(content, 'collapsed', !isCollapsed);
};

/**
 * Gère le changement de valeur des filtres checkbox et radio
 * @param {Event} event - Événement de changement
 */
const handleFilterChange = (event) => {
    const input = event.target;
    const value = input.value;
    const type = input.type;
    const name = input.name;
    
    if (type === 'checkbox') {
        // Identifie quel type de filtre est changé
        let filterType;
        
        if (value === 'beginner' || value === 'intermediate' || value === 'advanced' || value === 'principles') {
            filterType = 'level';
        } else if (creators.some(creator => creator.id === value)) {
            filterType = 'creator';
        } else {
            filterType = 'tags';
        }
        
        // Met à jour l'état du filtre
        const currentFilters = [...state.activeFilters[filterType]];
        
        if (input.checked) {
            // Ajoute le filtre s'il n'est pas déjà présent
            if (!currentFilters.includes(value)) {
                currentFilters.push(value);
            }
        } else {
            // Supprime le filtre
            const index = currentFilters.indexOf(value);
            if (index !== -1) {
                currentFilters.splice(index, 1);
            }
        }
        
        state.activeFilters[filterType] = currentFilters;
    } else if (type === 'radio') {
        // Pour les boutons radio, on remplace directement la valeur
        state.activeFilters[name] = value;
    }
    
    // Mise à jour de l'affichage
    updateActiveFiltersDisplay();
    updateFilterCount();
};

/**
 * Gère le clic sur un tag de filtre
 * @param {Event} event - Événement de clic
 */
const handleTagClick = (event) => {
    const tag = event.currentTarget;
    const isActive = hasClass(tag, 'active');
    
    // Récupère tous les tags du même groupe
    const tagGroup = closest(tag, '.filter-tags');
    if (!tagGroup) return;
    
    // Récupère le type de filtre (date, etc.)
    const filterType = tagGroup.dataset.filterType || 'date';
    
    // Si c'est un filtre exclusif (comme la date), on désactive les autres
    const allTags = selectAll('.filter-tag', tagGroup);
    allTags.forEach(t => {
        toggleClass(t, 'active', false);
    });
    
    // Active ce tag si ce n'était pas déjà le cas
    toggleClass(tag, 'active', !isActive);
    
    // Met à jour l'état
    state.activeFilters[filterType] = !isActive ? tag.dataset.value || tag.textContent.trim() : '';
    
    // Mise à jour de l'affichage
    updateActiveFiltersDisplay();
    updateFilterCount();
};

/**
 * Gère la recherche dans les filtres
 * @param {Event} event - Événement d'input
 */
const handleFilterSearch = (event) => {
    const searchText = event.target.value.toLowerCase();
    state.searchQuery = searchText;
    
    // Recherche dans les étiquettes des filtres
    const filterLabels = selectAll('.filter-checkbox-label, .filter-radio-label');
    
    filterLabels.forEach(label => {
        const text = label.textContent.toLowerCase();
        const filterItem = closest(label, '.filter-checkbox, .filter-radio');
        
        if (filterItem) {
            // Affiche/masque en fonction de la recherche
            if (searchText === '' || text.includes(searchText)) {
                filterItem.style.display = '';
            } else {
                filterItem.style.display = 'none';
            }
        }
    });
    
    // Si la recherche est vide, assure-toi que tout est visible
    if (searchText === '') {
        filterLabels.forEach(label => {
            const filterItem = closest(label, '.filter-checkbox, .filter-radio');
            if (filterItem) {
                filterItem.style.display = '';
            }
        });
    }
};

/**
 * Applique les filtres et met à jour l'affichage des vidéos
 */
const applyFilters = () => {
    // Ferme le panneau
    toggleFilterPanel(false);
    
    // Sauvegarde les filtres
    saveFilters();
    
    // Déclenche un événement personnalisé pour que d'autres composants puissent réagir
    document.dispatchEvent(new CustomEvent(CONFIG.filterChangeEvent, { 
        detail: { filters: state.activeFilters }
    }));
    
    // Affiche une animation de chargement
    const videoGrid = select('.video-grid');
    if (videoGrid) {
        showLoader(videoGrid, 'filter-application');
        
        // Simule un petit délai pour l'expérience utilisateur
        setTimeout(() => {
            // Filtre et affiche les vidéos
            filterAndDisplayVideos();
            
            // Cache l'animation de chargement
            hideLoader(videoGrid, 'filter-application');
        }, 300);
    } else {
        filterAndDisplayVideos();
    }
};

/**
 * Filtre les vidéos selon les critères actuels et les affiche
 */
const filterAndDisplayVideos = () => {
    // Cette fonction serait idéalement implémentée dans video-display.js
    // Ici, on se contente de déclencher l'événement qui sera capté par ce composant
};

/**
 * Supprime tous les filtres actifs
 */
const clearAllFilters = () => {
    // Réinitialise l'état
    state.activeFilters = {
        level: [],
        creator: [],
        tags: [],
        duration: '',
        date: ''
    };
    
    // Réinitialise tous les inputs
    const checkboxes = selectAll('.filter-checkbox-input');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    const radios = selectAll('.filter-radio-input');
    radios.forEach(radio => {
        if (radio.value === '') {
            radio.checked = true;
        } else {
            radio.checked = false;
        }
    });
    
    // Réinitialise les tags
    const tags = selectAll('.filter-tag.active');
    tags.forEach(tag => {
        tag.classList.remove('active');
    });
    
    // Met à jour l'affichage
    updateActiveFiltersDisplay();
    updateFilterCount();
    
    // Supprime les filtres sauvegardés
    removeItem(STORAGE_KEY);
};

/**
 * Gère la suppression d'un filtre actif
 * @param {Event} event - Événement de clic
 */
const handleActiveFilterRemove = (event) => {
    const removeButton = closest(event.target, '.active-filter-remove');
    if (!removeButton) return;
    
    const filter = closest(removeButton, '.active-filter');
    if (!filter) return;
    
    const filterType = filter.dataset.type;
    const filterValue = filter.dataset.value;
    
    if (filterType && filterValue) {
        // Supprime le filtre de l'état
        if (Array.isArray(state.activeFilters[filterType])) {
            const index = state.activeFilters[filterType].indexOf(filterValue);
            if (index !== -1) {
                state.activeFilters[filterType].splice(index, 1);
            }
        } else {
            state.activeFilters[filterType] = '';
        }
        
        // Met à jour les checkboxes/radios correspondants
        if (filterType === 'level' || filterType === 'creator' || filterType === 'tags') {
            const checkbox = select(`.filter-checkbox-input[value="${filterValue}"]`);
            if (checkbox) {
                checkbox.checked = false;
            }
        } else {
            const radios = selectAll(`.filter-radio-input[name="${filterType}"]`);
            radios.forEach(radio => {
                if (radio.value === '') {
                    radio.checked = true;
                }
            });
            
            // Réinitialise aussi les tags actifs
            const tags = selectAll(`.filter-tag[data-filter-type="${filterType}"].active`);
            tags.forEach(tag => {
                tag.classList.remove('active');
            });
        }
        
        // Met à jour l'affichage
        updateActiveFiltersDisplay();
        updateFilterCount();
    }
};

/**
 * Met à jour l'affichage des filtres actifs
 */
const updateActiveFiltersDisplay = () => {
    if (!elements.activeFiltersContainer) return;
    
    // Vide le conteneur
    elements.activeFiltersContainer.innerHTML = '';
    
    // Ajoute les filtres par niveau
    state.activeFilters.level.forEach(level => {
        const levelName = getLevelDisplayName(level);
        addActiveFilterTag('level', level, levelName);
    });
    
    // Ajoute les filtres par créateur
    state.activeFilters.creator.forEach(creatorId => {
        const creator = creators.find(c => c.id === creatorId);
        if (creator) {
            addActiveFilterTag('creator', creatorId, creator.name);
        }
    });
    
    // Ajoute les filtres par tags
    state.activeFilters.tags.forEach(tagId => {
        const tag = tags.find(t => t.id === tagId);
        if (tag) {
            addActiveFilterTag('tags', tagId, tag.name);
        }
    });
    
    // Ajoute le filtre de durée
    if (state.activeFilters.duration) {
        const durationName = getDurationDisplayName(state.activeFilters.duration);
        addActiveFilterTag('duration', state.activeFilters.duration, durationName);
    }
    
    // Ajoute le filtre de date
    if (state.activeFilters.date) {
        const dateName = getDateDisplayName(state.activeFilters.date);
        addActiveFilterTag('date', state.activeFilters.date, dateName);
    }
    
    // Ajoute un bouton "Tout effacer" s'il y a des filtres actifs
    const hasActiveFilters = hasAnyActiveFilter();
    if (hasActiveFilters) {
        const clearAllButton = createElement('button', {
            class: 'clear-all-filters',
            onclick: clearAllFilters
        }, 'Tout effacer');
        
        elements.activeFiltersContainer.appendChild(clearAllButton);
    }
};

/**
 * Ajoute un tag de filtre actif à l'affichage
 * @param {string} type - Type de filtre
 * @param {string} value - Valeur du filtre
 * @param {string} displayName - Nom à afficher
 */
const addActiveFilterTag = (type, value, displayName) => {
    if (!elements.activeFiltersContainer) return;
    
    const filterTag = createElement('div', {
        class: 'active-filter',
        dataset: {
            type: type,
            value: value
        }
    });
    
    const filterLabel = document.createTextNode(displayName);
    filterTag.appendChild(filterLabel);
    
    const removeButton = createElement('span', {
        class: 'active-filter-remove'
    }, 
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`);
    
    filterTag.appendChild(removeButton);
    elements.activeFiltersContainer.appendChild(filterTag);
};

/**
 * Met à jour le compteur de filtres actifs
 */
const updateFilterCount = () => {
    if (!elements.countBadge) return;
    
    const count = getActiveFilterCount();
    elements.countBadge.textContent = count;
    
    // Mise en évidence du badge si des filtres sont actifs
    toggleClass(elements.countBadge, 'has-filters', count > 0);
};

/**
 * Retourne le nombre total de filtres actifs
 * @returns {number} Nombre de filtres actifs
 */
const getActiveFilterCount = () => {
    let count = 0;
    
    count += state.activeFilters.level.length;
    count += state.activeFilters.creator.length;
    count += state.activeFilters.tags.length;
    
    if (state.activeFilters.duration) count++;
    if (state.activeFilters.date) count++;
    
    return count;
};

/**
 * Vérifie si au moins un filtre est actif
 * @returns {boolean} True si au moins un filtre est actif
 */
const hasAnyActiveFilter = () => {
    return getActiveFilterCount() > 0;
};

/**
 * Peuple les options de filtres basées sur les données disponibles
 */
const populateFilterOptions = () => {
    // Cette fonction serait utilisée si on voulait générer dynamiquement
    // les options de filtre au lieu de les avoir en HTML statique
    // Pour simplifier, on présume que les filtres sont déjà dans le HTML
    
    // Néanmoins, on synchronise l'état des filtres avec les éléments HTML
    syncFiltersWithDOM();
};

/**
 * Synchronise l'état des filtres avec les éléments DOM
 */
const syncFiltersWithDOM = () => {
    // Synchronise les niveaux
    state.activeFilters.level.forEach(level => {
        const checkbox = select(`.filter-checkbox-input[value="${level}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Synchronise les créateurs
    state.activeFilters.creator.forEach(creatorId => {
        const checkbox = select(`.filter-checkbox-input[value="${creatorId}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Synchronise les tags
    state.activeFilters.tags.forEach(tagId => {
        const checkbox = select(`.filter-checkbox-input[value="${tagId}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
    
    // Synchronise la durée
    if (state.activeFilters.duration) {
        const radio = select(`.filter-radio-input[name="duration"][value="${state.activeFilters.duration}"]`);
        if (radio) {
            radio.checked = true;
        }
    }
    
    // Synchronise la date
    if (state.activeFilters.date) {
        const tag = select(`.filter-tag[data-value="${state.activeFilters.date}"]`);
        if (tag) {
            tag.classList.add('active');
        }
    }
};

/**
 * Obtient le nom d'affichage pour un niveau
 * @param {string} level - ID du niveau
 * @returns {string} Nom d'affichage
 */
const getLevelDisplayName = (level) => {
    const levelMap = {
        [LEVEL.BEGINNER]: 'Débutant',
        [LEVEL.INTERMEDIATE]: 'Intermédiaire',
        [LEVEL.ADVANCED]: 'Avancé',
        [LEVEL.PRINCIPLES]: 'Principes UI'
    };
    
    return levelMap[level] || level;
};

/**
 * Obtient le nom d'affichage pour une durée
 * @param {string} duration - ID de la durée
 * @returns {string} Nom d'affichage
 */
const getDurationDisplayName = (duration) => {
    const durationMap = {
        'short': 'Courte (< 10 min)',
        'medium': 'Moyenne (10-20 min)',
        'long': 'Longue (> 20 min)'
    };
    
    return durationMap[duration] || duration;
};

/**
 * Obtient le nom d'affichage pour une date
 * @param {string} date - ID de la date
 * @returns {string} Nom d'affichage
 */
const getDateDisplayName = (date) => {
    const dateMap = {
        'month': 'Dernier mois',
        'six-months': 'Derniers 6 mois',
        'year': 'Dernière année',
        'older': 'Plus d\'un an'
    };
    
    return dateMap[date] || date;
};

/**
 * Fonction utilitaire pour debounce (limiter la fréquence d'appel)
 * @param {Function} func - Fonction à appeler
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debounced
 */
const debounce = (func, wait) => {
    let timeout;
    
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Récupère l'état actuel des filtres
 * @returns {Object} État des filtres
 */
export const getActiveFilters = () => {
    return {...state.activeFilters};
};

/**
 * Définit l'état des filtres et met à jour l'interface
 * @param {Object} filters - Nouveaux filtres à appliquer
 */
export const setActiveFilters = (filters) => {
    state.activeFilters = {...state.activeFilters, ...filters};
    
    // Met à jour l'affichage
    syncFiltersWithDOM();
    updateActiveFiltersDisplay();
    updateFilterCount();
    
    // Sauvegarde les filtres
    saveFilters();
};

// Exporte les fonctions publiques
export default {
    initFilters,
    getActiveFilters,
    setActiveFilters,
    clearAllFilters,
    applyFilters
};