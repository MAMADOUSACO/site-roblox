/**
 * Structure de données contenant toutes les vidéos et playlists
 * par catégorie, avec méthodes pour filtrer et récupérer les vidéos.
 */

// Enum pour les niveaux
export const LEVEL = {
    BEGINNER: 'beginner',
    INTERMEDIATE: 'intermediate',
    ADVANCED: 'advanced',
    PRINCIPLES: 'principles'
  };
  
  // Structure des vidéos
  export const videos = {
    // Vidéos pour débutants
    [LEVEL.BEGINNER]: [
      {
        id: 'lCQyCGkkWHA',
        title: 'ROBLOX UI TUTORIAL: Anime Game | Roblox Visuals',
        creator: 'Roblox Visuals',
        description: 'Tutoriel sur la création d\'une interface utilisateur de style anime pour les jeux Roblox.',
        url: 'https://www.youtube.com/watch?v=lCQyCGkkWHA',
        thumbnailUrl: 'https://i.ytimg.com/vi/lCQyCGkkWHA/maxresdefault.jpg',
        duration: '10:16',
        views: '16K',
        date: 'Il y a 1 an',
        tags: ['anime', 'design', 'tutorial'],
        level: LEVEL.BEGINNER
      },
      {
        id: 'DzCX8xeHxyI',
        title: 'How to Make a GUI in Roblox Studio (2023)',
        creator: 'AlvinBlox',
        description: 'Guide complet sur la création d\'interfaces graphiques dans Roblox Studio, couvrant les bases de la création et de la personnalisation des éléments UI.',
        url: 'https://www.youtube.com/watch?v=DzCX8xeHxyI',
        thumbnailUrl: 'https://i.ytimg.com/vi/DzCX8xeHxyI/maxresdefault.jpg',
        duration: '15:13',
        views: '226K',
        date: 'Il y a 1 an',
        tags: ['gui', 'basics', 'tutorial'],
        level: LEVEL.BEGINNER
      },
      {
        id: 'L8Fg1pxPrzY',
        title: 'Roblox Studio - UI Design Tutorial',
        creator: 'Ezpi',
        description: 'Tutoriel sur la conception d\'interfaces utilisateur dans Roblox Studio, couvrant les principes de base du design UI.',
        url: 'https://www.youtube.com/watch?v=L8Fg1pxPrzY',
        thumbnailUrl: 'https://i.ytimg.com/vi/L8Fg1pxPrzY/maxresdefault.jpg',
        duration: '10:00',
        views: '4.3K',
        date: 'Il y a 1 an',
        tags: ['design', 'tutorial', 'basics'],
        level: LEVEL.BEGINNER
      }
    ],
    
    // Vidéos de niveau intermédiaire
    [LEVEL.INTERMEDIATE]: [
      {
        id: '9kuWl_t1AOE',
        title: 'Essential UI Tips & Tricks | Roblox Studio',
        creator: 'Stewiepfing',
        description: 'Tutoriel couvrant des astuces et techniques intermédiaires pour l\'UI dans Roblox, incluant la correction de bugs UIStroke, l\'amélioration des barres de progression avec UICorner, UIAspectRatioConstraint, UIPageLayout et la gestion de ScrollingFrame CanvasSize.',
        url: 'https://www.youtube.com/watch?v=9kuWl_t1AOE',
        thumbnailUrl: 'https://i.ytimg.com/vi/9kuWl_t1AOE/maxresdefault.jpg',
        duration: '12:45', // Durée estimée car non spécifiée
        views: '130K',
        date: 'Il y a 9 mois',
        tags: ['tricks', 'tips', 'uistroke', 'uicorner', 'scrollingframe'],
        level: LEVEL.INTERMEDIATE
      },
      {
        id: 'l3575QQNdkc',
        title: 'Roblox Tutorial • Complete GUI Guide',
        creator: 'alphajpeg',
        description: 'Guide complet sur l\'UI dans Roblox, couvrant le scaling, le dimensionnement, le positionnement, les objets UI, les composants UI et d\'autres fonctionnalités importantes.',
        url: 'https://www.youtube.com/watch?v=l3575QQNdkc',
        thumbnailUrl: 'https://i.ytimg.com/vi/l3575QQNdkc/maxresdefault.jpg',
        duration: '18:07',
        views: '1.3K',
        date: 'Il y a 2 ans',
        tags: ['gui', 'guide', 'complete', 'scaling', 'positioning'],
        level: LEVEL.INTERMEDIATE,
        chapters: [
          { title: 'Introduction', time: '0:00' },
          { title: 'Scaling, Sizing, & Positioning', time: '0:33' },
          { title: 'UI Objects', time: '3:15' },
          { title: 'UI Components', time: '8:35' },
          { title: 'Important Extras', time: '15:15' }
        ]
      },
      {
        id: 'ui-positioning-article',
        title: 'UI Positioning For Dummies | Using Anchor Points Effectively, Common Mistakes, Basic Layouts & More!',
        creator: 'lowrescat',
        description: 'Guide détaillé sur le positionnement UI dans Roblox, expliquant en profondeur le fonctionnement des points d\'ancrage, comment les utiliser efficacement, les erreurs courantes à éviter, et comment créer des mises en page de base. L\'article couvre également la réactivité des interfaces et l\'utilisation d\'objets spéciaux comme UIListLayout et UIGridLayout.',
        url: 'https://devforum.roblox.com/t/ui-positioning-for-dummies-using-anchor-points-effectively-common-mistakes-basic-layouts-more/2312197',
        thumbnailUrl: 'https://doy2mn9upadnk.cloudfront.net/uploads/default/original/4X/c/5/9/c59b85e8f03ff66e82cd69cf2de5a81906b3f6a8.jpeg',
        isArticle: true,
        date: 'Avril 2023',
        tags: ['positioning', 'anchor points', 'layouts', 'uilistlayout', 'uigridlayout'],
        level: LEVEL.INTERMEDIATE
      }
    ],
    
    // Vidéos avancées
    [LEVEL.ADVANCED]: [
      {
        id: 'b1zRHs5ToC4',
        title: 'How to make an Advanced Main Menu // Roblox Studio Tutorial',
        creator: 'Asadrith',
        description: 'Tutoriel détaillé sur la création d\'un menu principal avancé dans Roblox Studio, couvrant la création de l\'interface graphique, la configuration de la caméra, la création de popups, et le scripting des boutons.',
        url: 'https://www.youtube.com/watch?v=b1zRHs5ToC4',
        thumbnailUrl: 'https://i.ytimg.com/vi/b1zRHs5ToC4/maxresdefault.jpg',
        duration: '43:13',
        views: '119K',
        date: 'Il y a 2 ans',
        tags: ['main menu', 'advanced', 'camera', 'popups', 'scripting'],
        level: LEVEL.ADVANCED,
        chapters: [
          { title: 'Intro', time: '0:00' },
          { title: 'Making the Gui', time: '0:15' },
          { title: 'Making the camera', time: '5:00' },
          { title: 'Making the Popups', time: '8:00' },
          { title: 'Scripting the Buttons', time: '25:20' },
          { title: 'Final Test', time: '42:08' },
          { title: 'Outro', time: '42:54' }
        ]
      },
      {
        id: '9U5CPvRyQR0',
        title: 'How to Create a Professional & Advanced UI | Roblox Studio',
        creator: 'Stoicescu Luca',
        description: 'Tutoriel sur l\'amélioration du design UI dans Roblox Studio pour créer des interfaces plus professionnelles et visuellement attrayantes.',
        url: 'https://www.youtube.com/watch?v=9U5CPvRyQR0',
        thumbnailUrl: 'https://i.ytimg.com/vi/9U5CPvRyQR0/maxresdefault.jpg',
        duration: '6:10',
        views: '122',
        date: 'Il y a 4 semaines',
        tags: ['professional', 'advanced', 'design', 'uistroke', 'uicorner', 'fonts'],
        level: LEVEL.ADVANCED,
        keyPoints: [
          'Comment changer les polices pour une UI plus moderne',
          'Comment utiliser UIStrokes pour améliorer la visibilité du texte',
          'Comment ajouter UICorners pour des éléments arrondis et lisses',
          'Comment faire ressortir les éléments UI avec des astuces de style simples'
        ]
      },
      {
        id: 'Cp1elU3C4Yc',
        title: 'Roblox Advanced UI animations tutorial!',
        creator: 'polarisprog',
        description: 'Tutoriel avancé sur les animations d\'interface utilisateur dans Roblox, montrant comment créer des transitions et des effets visuels dynamiques pour améliorer l\'expérience utilisateur.',
        url: 'https://www.youtube.com/watch?v=Cp1elU3C4Yc',
        thumbnailUrl: 'https://i.ytimg.com/vi/Cp1elU3C4Yc/maxresdefault.jpg',
        duration: '15:30', // Durée estimée car non spécifiée
        views: '103K',
        date: 'Il y a 3 ans',
        tags: ['animations', 'transitions', 'advanced', 'effects'],
        level: LEVEL.ADVANCED
      },
      {
        id: 'roblox-advanced-gui-playlist',
        title: 'Roblox Advanced Gui Tutorial : #1, Loading Gui',
        creator: 'megabytes',
        description: 'Tutoriel sur la création d\'un écran de chargement avancé dans Roblox.',
        url: 'https://www.youtube.com/playlist?list=PL39-QwOWQMpV0MLD3n659S1WMKQeQU7Yw',
        thumbnailUrl: 'https://i.ytimg.com/vi/placeholder/maxresdefault.jpg',
        duration: '14:26',
        views: '1.2K',
        date: 'Il y a 10 ans',
        tags: ['loading', 'gui', 'advanced'],
        level: LEVEL.ADVANCED,
        isPlaylist: true
      }
    ],
    
    // Vidéos sur les principes de design UI
    [LEVEL.PRINCIPLES]: [
      {
        id: 'NTmh8l-Xl4c',
        title: 'UI Design Principles | Everything You Need To Know',
        creator: 'DesignWithArash',
        description: 'Guide complet sur les principes les plus importants du design d\'interface utilisateur et comment les appliquer dans vos projets. Présenté par un designer UI/UX et instructeur universitaire avec plus de 7 ans d\'expérience.',
        url: 'https://www.youtube.com/watch?v=NTmh8l-Xl4c',
        thumbnailUrl: 'https://i.ytimg.com/vi/NTmh8l-Xl4c/maxresdefault.jpg',
        duration: '18:45', // Durée estimée car non spécifiée
        views: '191K',
        date: 'Il y a 2 ans',
        tags: ['principles', 'design', 'guide'],
        level: LEVEL.PRINCIPLES
      },
      {
        id: 'uwNClNmekGU',
        title: '4 Foundational UI Design Principles | C.R.A.P.',
        creator: 'Jesse Showalter',
        description: 'Présentation des quatre principes fondamentaux du design UI connus sous l\'acronyme C.R.A.P. (Contrast, Repetition, Alignment, Proximity). Ces principes peuvent être utilisés pour tout design visuel mais sont particulièrement importants pour les designers d\'interfaces utilisateur.',
        url: 'https://www.youtube.com/watch?v=uwNClNmekGU',
        thumbnailUrl: 'https://i.ytimg.com/vi/uwNClNmekGU/maxresdefault.jpg',
        duration: '9:22',
        views: '240K',
        date: 'Il y a 3 ans',
        tags: ['principles', 'crap', 'contrast', 'repetition', 'alignment', 'proximity'],
        level: LEVEL.PRINCIPLES,
        chapters: [
          { title: 'Intro', time: '0:00' },
          { title: 'CRAP', time: '0:25' },
          { title: 'Contrast', time: '0:40' },
          { title: 'Repetition', time: '3:16' },
          { title: 'Alignment', time: '4:48' },
          { title: 'Proximity', time: '6:56' }
        ]
      },
      {
        id: 'yV3gfOOrVTU',
        title: 'UI Design Basics',
        creator: 'Ricardo Costa',
        description: 'Présentation des principes les plus importants du design UI que chaque designer devrait connaître. Couvre des sujets comme la clarté, la cohérence, la hiérarchie visuelle et l\'accessibilité, ainsi que les huit règles d\'or de Ben Shneiderman pour le design d\'interface.',
        url: 'https://www.youtube.com/watch?v=yV3gfOOrVTU',
        thumbnailUrl: 'https://i.ytimg.com/vi/yV3gfOOrVTU/maxresdefault.jpg',
        duration: '5:32',
        views: '963',
        date: 'Il y a 8 mois',
        tags: ['basics', 'principles', 'clarity', 'consistency', 'hierarchy', 'accessibility'],
        level: LEVEL.PRINCIPLES
      },
      {
        id: 'ui-ux-design-playlist',
        title: 'UI/UX Design Playlist',
        creator: 'DesignWithArash',
        description: 'Collection complète de 77 vidéos couvrant tous les aspects du design UI/UX, des principes fondamentaux aux techniques avancées. Inclut des tutoriels sur les principes de design, les erreurs à éviter, la création de composants spécifiques, l\'utilisation d\'outils comme Figma, et bien plus encore.',
        url: 'https://www.youtube.com/playlist?list=PLjiHFwhbHYlHSpAflJwjsKAyMaMhASm0F',
        thumbnailUrl: 'https://i.ytimg.com/vi/NTmh8l-Xl4c/maxresdefault.jpg', // Using thumbnail from first video
        isPlaylist: true,
        videoCount: 77,
        views: '352,118',
        date: 'Vidéos publiées au cours des 2 dernières années',
        tags: ['principles', 'design', 'ui/ux', 'figma', 'components'],
        level: LEVEL.PRINCIPLES,
        notableVideos: [
          'How to Become a UI/UX Designer in 2023? | A Beginner\'s Guide',
          'UI Design Principles | Everything You Need To Know',
          '10 UI Design Mistakes to Avoid',
          'How to Design Great Buttons in Figma? | UI Design',
          'The Golden Ratio in UI Design'
        ]
      }
    ]
  };
  
  // Structure des playlists
  export const playlists = {
    [LEVEL.BEGINNER]: [
      {
        id: 'roblox-ui-tutorials-playlist',
        title: 'Roblox UI Tutorials (Playlist)',
        creator: 'Roblox Visuals',
        description: 'Série de tutoriels sur la création d\'interfaces utilisateur dans Roblox, incluant des designs spécifiques comme anime, bouton en bois et design neige.',
        url: 'https://www.youtube.com/playlist?list=PLg3IX-5kLEJZOHlFcZXPJS7Ce7Ij1dRk8',
        thumbnailUrl: 'https://i.ytimg.com/vi/lCQyCGkkWHA/maxresdefault.jpg',
        videoCount: 3,
        level: LEVEL.BEGINNER,
        videos: [
          'ROBLOX UI TUTORIAL: Anime Game | Roblox Visuals',
          'ROBLOX UI Tutorial: Wood Button | Roblox Visuals',
          'ROBLOX UI Tutorial: Snow Design | Roblox Visuals'
        ]
      },
      {
        id: 'roblox-ui-design-tutorials-playlist',
        title: 'Roblox UI Design Tutorials (Playlist)',
        creator: 'Ezpi',
        description: 'Collection de tutoriels sur la conception d\'interfaces utilisateur dans Roblox Studio, couvrant différents aspects du design UI.',
        url: 'https://www.youtube.com/playlist?list=PLQ1Qd31Hmi3Xnlu8u9hCYClLurMQYJIrz',
        thumbnailUrl: 'https://i.ytimg.com/vi/L8Fg1pxPrzY/maxresdefault.jpg',
        videoCount: 5,
        level: LEVEL.BEGINNER,
        videos: [
          'Roblox Studio - UI Design Tutorial',
          'Roblox Studio - UI Design Tutorial 2',
          'Roblox Studio - UI Design Tutorial 3',
          'Roblox Studio - UI Design Tutorial 4',
          'Roblox Studio - UI Design Tutorial 5'
        ]
      }
    ],
    [LEVEL.INTERMEDIATE]: [],
    [LEVEL.ADVANCED]: [
      {
        id: 'roblox-advanced-gui-playlist',
        title: 'Roblox Advanced Gui Tutorial (Playlist)',
        creator: 'megabytes',
        description: 'Série de tutoriels avancés sur la création d\'interfaces graphiques dans Roblox, commençant par la création d\'un écran de chargement.',
        url: 'https://www.youtube.com/playlist?list=PL39-QwOWQMpV0MLD3n659S1WMKQeQU7Yw',
        thumbnailUrl: 'https://i.ytimg.com/vi/placeholder/maxresdefault.jpg',
        videoCount: 1,
        level: LEVEL.ADVANCED,
        videos: [
          'Roblox Advanced Gui Tutorial : #1, Loading Gui (14:26)'
        ]
      }
    ],
    [LEVEL.PRINCIPLES]: [
      {
        id: 'ui-ux-design-playlist',
        title: 'UI/UX Design (Playlist)',
        creator: 'DesignWithArash',
        description: 'Collection complète de 77 vidéos couvrant tous les aspects du design UI/UX, des principes fondamentaux aux techniques avancées.',
        url: 'https://www.youtube.com/playlist?list=PLjiHFwhbHYlHSpAflJwjsKAyMaMhASm0F',
        thumbnailUrl: 'https://i.ytimg.com/vi/NTmh8l-Xl4c/maxresdefault.jpg',
        videoCount: 77,
        views: '352,118',
        date: 'Vidéos publiées au cours des 2 dernières années',
        level: LEVEL.PRINCIPLES,
        notableVideos: [
          'How to Become a UI/UX Designer in 2023? | A Beginner\'s Guide',
          'UI Design Principles | Everything You Need To Know',
          '10 UI Design Mistakes to Avoid',
          'How to Design Great Buttons in Figma? | UI Design',
          'The Golden Ratio in UI Design'
        ]
      }
    ]
  };
  
  // Les créateurs de contenu
  export const creators = [
    { id: 'roblox-visuals', name: 'Roblox Visuals', count: 3 },
    { id: 'alvinblox', name: 'AlvinBlox', count: 1 },
    { id: 'ezpi', name: 'Ezpi', count: 5 },
    { id: 'stewiepfing', name: 'Stewiepfing', count: 1 },
    { id: 'alphajpeg', name: 'alphajpeg', count: 1 },
    { id: 'lowrescat', name: 'lowrescat', count: 1 },
    { id: 'asadrith', name: 'Asadrith', count: 1 },
    { id: 'stoicescu-luca', name: 'Stoicescu Luca', count: 1 },
    { id: 'polarisprog', name: 'polarisprog', count: 1 },
    { id: 'megabytes', name: 'megabytes', count: 1 },
    { id: 'designwitharash', name: 'DesignWithArash', count: 2 },
    { id: 'jesse-showalter', name: 'Jesse Showalter', count: 1 },
    { id: 'ricardo-costa', name: 'Ricardo Costa', count: 1 }
  ];
  
  // Étiquettes (tags) pour le filtrage
  export const tags = [
    { id: 'anime', name: 'Anime', count: 1 },
    { id: 'design', name: 'Design', count: 8 },
    { id: 'tutorial', name: 'Tutoriel', count: 10 },
    { id: 'gui', name: 'GUI', count: 3 },
    { id: 'basics', name: 'Bases', count: 4 },
    { id: 'tricks', name: 'Astuces', count: 1 },
    { id: 'tips', name: 'Conseils', count: 1 },
    { id: 'uistroke', name: 'UIStroke', count: 2 },
    { id: 'uicorner', name: 'UICorner', count: 2 },
    { id: 'scrollingframe', name: 'ScrollingFrame', count: 1 },
    { id: 'scaling', name: 'Scaling', count: 1 },
    { id: 'positioning', name: 'Positionnement', count: 2 },
    { id: 'anchor points', name: 'Points d\'ancrage', count: 1 },
    { id: 'layouts', name: 'Mises en page', count: 1 },
    { id: 'uilistlayout', name: 'UIListLayout', count: 1 },
    { id: 'uigridlayout', name: 'UIGridLayout', count: 1 },
    { id: 'main menu', name: 'Menu principal', count: 1 },
    { id: 'advanced', name: 'Avancé', count: 4 },
    { id: 'camera', name: 'Caméra', count: 1 },
    { id: 'popups', name: 'Popups', count: 1 },
    { id: 'scripting', name: 'Scripting', count: 1 },
    { id: 'professional', name: 'Professionnel', count: 1 },
    { id: 'fonts', name: 'Polices', count: 1 },
    { id: 'animations', name: 'Animations', count: 1 },
    { id: 'transitions', name: 'Transitions', count: 1 },
    { id: 'effects', name: 'Effets', count: 1 },
    { id: 'loading', name: 'Chargement', count: 1 },
    { id: 'principles', name: 'Principes', count: 4 },
    { id: 'guide', name: 'Guide', count: 2 },
    { id: 'crap', name: 'C.R.A.P.', count: 1 },
    { id: 'contrast', name: 'Contraste', count: 1 },
    { id: 'repetition', name: 'Répétition', count: 1 },
    { id: 'alignment', name: 'Alignement', count: 1 },
    { id: 'proximity', name: 'Proximité', count: 1 },
    { id: 'clarity', name: 'Clarté', count: 1 },
    { id: 'consistency', name: 'Cohérence', count: 1 },
    { id: 'hierarchy', name: 'Hiérarchie', count: 1 },
    { id: 'accessibility', name: 'Accessibilité', count: 1 },
    { id: 'ui/ux', name: 'UI/UX', count: 1 },
    { id: 'figma', name: 'Figma', count: 1 },
    { id: 'components', name: 'Composants', count: 1 }
  ];
  
  /**
   * Récupère toutes les vidéos pour un niveau spécifique
   * @param {string} level - Niveau de difficulté (utiliser les constantes LEVEL)
   * @returns {Array} Tableau des vidéos pour ce niveau
   */
  export const getVideosByLevel = (level) => {
    return videos[level] || [];
  };
  
  /**
   * Récupère toutes les playlists pour un niveau spécifique
   * @param {string} level - Niveau de difficulté (utiliser les constantes LEVEL)
   * @returns {Array} Tableau des playlists pour ce niveau
   */
  export const getPlaylistsByLevel = (level) => {
    return playlists[level] || [];
  };
  
  /**
   * Récupère toutes les vidéos de tous les niveaux
   * @returns {Array} Tableau de toutes les vidéos
   */
  export const getAllVideos = () => {
    return Object.values(videos).flat();
  };
  
  /**
   * Récupère toutes les playlists de tous les niveaux
   * @returns {Array} Tableau de toutes les playlists
   */
  export const getAllPlaylists = () => {
    return Object.values(playlists).flat();
  };
  
  /**
   * Récupère une vidéo par son ID
   * @param {string} id - ID de la vidéo
   * @returns {Object|null} Objet vidéo ou null si non trouvé
   */
  export const getVideoById = (id) => {
    const allVideos = getAllVideos();
    return allVideos.find(video => video.id === id) || null;
  };
  
  /**
   * Récupère une playlist par son ID
   * @param {string} id - ID de la playlist
   * @returns {Object|null} Objet playlist ou null si non trouvé
   */
  export const getPlaylistById = (id) => {
    const allPlaylists = getAllPlaylists();
    return allPlaylists.find(playlist => playlist.id === id) || null;
  };
  
  /**
   * Recherche des vidéos par mot-clé
   * @param {string} query - Terme de recherche
   * @returns {Array} Tableau des vidéos correspondantes
   */
  export const searchVideos = (query) => {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const searchTerm = query.toLowerCase().trim();
    const allVideos = getAllVideos();
    
    return allVideos.filter(video => {
      return (
        video.title.toLowerCase().includes(searchTerm) ||
        video.creator.toLowerCase().includes(searchTerm) ||
        video.description.toLowerCase().includes(searchTerm) ||
        (video.tags && video.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    });
  };
  
  /**
   * Filtre les vidéos selon plusieurs critères
   * @param {Object} filters - Critères de filtrage
   * @param {string} [filters.level] - Niveau de difficulté
   * @param {string} [filters.creator] - Créateur du contenu
   * @param {Array} [filters.tags] - Tableau d'étiquettes
   * @param {string} [filters.duration] - Durée (short, medium, long)
   * @param {string} [filters.date] - Période (month, six-months, year, older)
   * @returns {Array} Tableau des vidéos filtrées
   */
  export const filterVideos = (filters = {}) => {
    let result = getAllVideos();
    
    // Filtre par niveau
    if (filters.level) {
      result = result.filter(video => video.level === filters.level);
    }
    
    // Filtre par créateur
    if (filters.creator) {
      result = result.filter(video => {
        const creatorId = filters.creator.toLowerCase();
        return video.creator.toLowerCase().includes(creatorId) || 
               video.creator.toLowerCase().replace(/\s+/g, '-') === creatorId;
      });
    }
    
    // Filtre par tags
    if (filters.tags && filters.tags.length > 0) {
      result = result.filter(video => {
        if (!video.tags) return false;
        return filters.tags.some(tag => video.tags.includes(tag));
      });
    }
    
    // Filtre par durée
    if (filters.duration) {
      result = result.filter(video => {
        if (!video.duration) return false;
        
        const minutes = parseInt(video.duration.split(':')[0]);
        
        switch (filters.duration) {
          case 'short':
            return minutes < 10;
          case 'medium':
            return minutes >= 10 && minutes <= 20;
          case 'long':
            return minutes > 20;
          default:
            return true;
        }
      });
    }
    
    // Filtre par date
    if (filters.date) {
      const currentDate = new Date();
      
      result = result.filter(video => {
        if (!video.date) return false;
        
        // Analyse approximative de la date relative
        const dateText = video.date.toLowerCase();
        
        switch (filters.date) {
          case 'month':
            return dateText.includes('jour') || 
                   dateText.includes('semaine') || 
                   (dateText.includes('mois') && dateText.includes('1 mois'));
          case 'six-months':
            return dateText.includes('jour') || 
                   dateText.includes('semaine') || 
                   dateText.includes('mois');
          case 'year':
            return dateText.includes('jour') || 
                   dateText.includes('semaine') || 
                   dateText.includes('mois') || 
                   (dateText.includes('an') && dateText.includes('1 an'));
          case 'older':
            return dateText.includes('an') && !dateText.includes('1 an');
          default:
            return true;
        }
      });
    }
    
    return result;
  };
  
  /**
   * Récupère des vidéos similaires à une vidéo donnée
   * @param {string} videoId - ID de la vidéo de référence
   * @param {number} [limit=4] - Nombre maximum de vidéos à retourner
   * @returns {Array} Tableau des vidéos similaires
   */
  export const getSimilarVideos = (videoId, limit = 4) => {
    const video = getVideoById(videoId);
    
    if (!video) {
      return [];
    }
    
    const allVideos = getAllVideos();
    const similarVideos = allVideos
      .filter(v => v.id !== videoId) // Exclure la vidéo actuelle
      .map(v => {
        // Calculer un score de similarité
        let score = 0;
        
        // Même niveau
        if (v.level === video.level) {
          score += 3;
        }
        
        // Même créateur
        if (v.creator === video.creator) {
          score += 4;
        }
        
        // Tags en commun
        if (video.tags && v.tags) {
          const commonTags = video.tags.filter(tag => v.tags.includes(tag));
          score += commonTags.length * 2;
        }
        
        return { ...v, similarityScore: score };
      })
      .filter(v => v.similarityScore > 0) // Exclure les vidéos sans similarité
      .sort((a, b) => b.similarityScore - a.similarityScore) // Trier par score
      .slice(0, limit); // Limiter le nombre de résultats
    
    return similarVideos;
  };
  
  /**
   * Récupère des vidéos recommandées pour l'utilisateur
   * @param {Object} [preferences={}] - Préférences de l'utilisateur
   * @param {Array} [preferences.viewedVideos=[]] - IDs des vidéos déjà vues
   * @param {Array} [preferences.preferredTags=[]] - Tags préférés
   * @param {string} [preferences.preferredLevel] - Niveau préféré
   * @param {number} [limit=6] - Nombre maximum de vidéos à retourner
   * @returns {Array} Tableau des vidéos recommandées
   */
  export const getRecommendedVideos = (preferences = {}, limit = 6) => {
    const { viewedVideos = [], preferredTags = [], preferredLevel } = preferences;
    
    const allVideos = getAllVideos();
    const recommendedVideos = allVideos
      .filter(v => !viewedVideos.includes(v.id)) // Exclure les vidéos déjà vues
      .map(v => {
        // Calculer un score de recommandation
        let score = 0;
        
        // Niveau préféré
        if (preferredLevel && v.level === preferredLevel) {
          score += 3;
        }
        
        // Tags préférés
        if (preferredTags.length > 0 && v.tags) {
          const matchingTags = preferredTags.filter(tag => v.tags.includes(tag));
          score += matchingTags.length * 2;
        }
        
        // Bonus pour les vidéos populaires
        if (v.views) {
          const viewsNumber = parseInt(v.views.replace(/[^\d]/g, ''));
          if (viewsNumber > 100000) score += 2;
          else if (viewsNumber > 10000) score += 1;
        }
        
        return { ...v, recommendationScore: score };
      })
      .sort((a, b) => {
        // Si les scores sont égaux, prioriser les vidéos plus récentes
        if (b.recommendationScore === a.recommendationScore) {
          return a.date.includes('jour') ? -1 : 1;
        }
        return b.recommendationScore - a.recommendationScore;
      })
      .slice(0, limit); // Limiter le nombre de résultats
    
    return recommendedVideos;
  };
  
  /**
   * Structure initiale de données avec toutes les méthodes pour y accéder
   */
  export default {
    LEVEL,
    videos,
    playlists,
    creators,
    tags,
    getVideosByLevel,
    getPlaylistsByLevel,
    getAllVideos,
    getAllPlaylists,
    getVideoById,
    getPlaylistById,
    searchVideos,
    filterVideos,
    getSimilarVideos,
    getRecommendedVideos
  };