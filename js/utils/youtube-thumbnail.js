/**
 * Utilitaires pour manipuler les vignettes (thumbnails) YouTube
 * Fournit des fonctions pour générer les URLs des vignettes à partir des IDs vidéo
 */

import { parseYoutubeUrl } from './url-parser.js';

/**
 * Tailles disponibles pour les vignettes YouTube
 */
export const THUMBNAIL_QUALITY = {
  DEFAULT: 'default',       // 120x90
  MEDIUM: 'mqdefault',      // 320x180
  HIGH: 'hqdefault',        // 480x360
  STANDARD: 'sddefault',    // 640x480
  MAXRES: 'maxresdefault'   // 1280x720
};

/**
 * Extrait l'ID de vidéo YouTube à partir d'une URL
 * @param {string} url - URL YouTube
 * @returns {string|null} ID de la vidéo ou null si non valide
 */
export const extractVideoId = (url) => {
  if (!url) return null;
  
  const parsedUrl = parseYoutubeUrl(url);
  return parsedUrl ? parsedUrl.videoId : null;
};

/**
 * Génère l'URL d'une vignette YouTube à partir de l'ID de vidéo
 * @param {string} videoId - ID de la vidéo YouTube
 * @param {string} [quality=THUMBNAIL_QUALITY.HIGH] - Qualité de la vignette
 * @returns {string} URL de la vignette
 */
export const getThumbnailUrl = (videoId, quality = THUMBNAIL_QUALITY.HIGH) => {
  if (!videoId) return '';
  
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Génère l'URL d'une vignette YouTube à partir d'une URL de vidéo
 * @param {string} url - URL de la vidéo YouTube
 * @param {string} [quality=THUMBNAIL_QUALITY.HIGH] - Qualité de la vignette
 * @returns {string} URL de la vignette
 */
export const getThumbnailFromUrl = (url, quality = THUMBNAIL_QUALITY.HIGH) => {
  const videoId = extractVideoId(url);
  return videoId ? getThumbnailUrl(videoId, quality) : '';
};

/**
 * Obtient toutes les vignettes disponibles pour une vidéo YouTube
 * @param {string} videoId - ID de la vidéo YouTube
 * @returns {Object} Objet contenant les URLs de toutes les tailles de vignettes
 */
export const getAllThumbnails = (videoId) => {
  if (!videoId) return {};
  
  return {
    default: getThumbnailUrl(videoId, THUMBNAIL_QUALITY.DEFAULT),
    medium: getThumbnailUrl(videoId, THUMBNAIL_QUALITY.MEDIUM),
    high: getThumbnailUrl(videoId, THUMBNAIL_QUALITY.HIGH),
    standard: getThumbnailUrl(videoId, THUMBNAIL_QUALITY.STANDARD),
    maxres: getThumbnailUrl(videoId, THUMBNAIL_QUALITY.MAXRES)
  };
};

/**
 * Vérifie si une URL de vignette YouTube est valide
 * @param {string} thumbnailUrl - URL de la vignette à vérifier
 * @returns {Promise<boolean>} Promise qui résout à true si l'URL est valide
 */
export const isValidThumbnail = async (thumbnailUrl) => {
  if (!thumbnailUrl) return false;
  
  try {
    const response = await fetch(thumbnailUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'URL de la vignette:', error);
    return false;
  }
};

/**
 * Obtient la meilleure qualité de vignette disponible pour une vidéo
 * Teste les qualités de la plus haute à la plus basse jusqu'à en trouver une valide
 * @param {string} videoId - ID de la vidéo YouTube
 * @returns {Promise<string>} URL de la meilleure vignette disponible
 */
export const getBestThumbnail = async (videoId) => {
  if (!videoId) return '';
  
  const qualities = [
    THUMBNAIL_QUALITY.MAXRES,
    THUMBNAIL_QUALITY.STANDARD,
    THUMBNAIL_QUALITY.HIGH,
    THUMBNAIL_QUALITY.MEDIUM,
    THUMBNAIL_QUALITY.DEFAULT
  ];
  
  for (const quality of qualities) {
    const url = getThumbnailUrl(videoId, quality);
    const isValid = await isValidThumbnail(url);
    
    if (isValid) {
      return url;
    }
  }
  
  // Retourne la vignette haute qualité par défaut si aucune n'est validée
  return getThumbnailUrl(videoId, THUMBNAIL_QUALITY.HIGH);
};

/**
 * Précharge une vignette YouTube pour améliorer les performances
 * @param {string} thumbnailUrl - URL de la vignette à précharger
 * @returns {Promise<boolean>} Promise qui résout à true si le préchargement réussit
 */
export const preloadThumbnail = (thumbnailUrl) => {
  return new Promise((resolve) => {
    if (!thumbnailUrl) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      resolve(true);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    img.src = thumbnailUrl;
  });
};

/**
 * Crée un élément d'image avec la vignette YouTube
 * @param {string} videoId - ID de la vidéo YouTube
 * @param {string} [quality=THUMBNAIL_QUALITY.HIGH] - Qualité de la vignette
 * @param {Object} [attributes={}] - Attributs HTML supplémentaires pour l'élément img
 * @returns {HTMLImageElement} Élément img avec la vignette
 */
export const createThumbnailElement = (videoId, quality = THUMBNAIL_QUALITY.HIGH, attributes = {}) => {
  const img = document.createElement('img');
  const thumbnailUrl = getThumbnailUrl(videoId, quality);
  
  img.src = thumbnailUrl;
  img.alt = `Vignette YouTube pour la vidéo ${videoId}`;
  
  // Appliquer les attributs supplémentaires
  Object.entries(attributes).forEach(([key, value]) => {
    img.setAttribute(key, value);
  });
  
  return img;
};

/**
 * Remplace les URLs de YouTube standard par des URLs de vignettes
 * Utile pour transformer des liens YouTube en vignettes cliquables
 * @param {string} html - Code HTML contenant des liens YouTube
 * @param {string} [quality=THUMBNAIL_QUALITY.HIGH] - Qualité des vignettes
 * @returns {string} HTML avec les liens YouTube remplacés par des vignettes
 */
export const replaceLinksByThumbnails = (html, quality = THUMBNAIL_QUALITY.HIGH) => {
  if (!html) return '';
  
  // Regex pour trouver les liens YouTube
  const youtubeRegex = /<a[^>]*href=["'](https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^"'&]+)["'][^>]*>([^<]+)<\/a>/gi;
  
  return html.replace(youtubeRegex, (match, url, _, __, text) => {
    const videoId = extractVideoId(url);
    
    if (!videoId) return match;
    
    const thumbnailUrl = getThumbnailUrl(videoId, quality);
    
    return `<a href="${url}" class="youtube-thumbnail-link" target="_blank" rel="noopener noreferrer">
              <img src="${thumbnailUrl}" alt="${text}" class="youtube-thumbnail" loading="lazy">
              <div class="youtube-play-button"></div>
            </a>`;
  });
};

export default {
  THUMBNAIL_QUALITY,
  extractVideoId,
  getThumbnailUrl,
  getThumbnailFromUrl,
  getAllThumbnails,
  isValidThumbnail,
  getBestThumbnail,
  preloadThumbnail,
  createThumbnailElement,
  replaceLinksByThumbnails
};