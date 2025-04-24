/**
 * Theme Switcher Component
 * 
 * Gère le basculement entre les thèmes clair et sombre
 * - Alterne entre les thèmes clairs et sombres
 * - Enregistre la préférence utilisateur dans localStorage
 * - Applique la préférence sauvegardée au chargement de la page
 * - Respecte la préférence système si aucune préférence n'est définie
 */

// Initialisation du thème au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initThemeSwitcher();
});

/**
 * Initialise le commutateur de thème
 */
function initThemeSwitcher() {
    const themeSwitch = document.querySelector('.theme-switch');
    
    if (!themeSwitch) return;
    
    // Vérifie si un thème a été sauvegardé
    const savedTheme = localStorage.getItem('roblox-ui-theme');
    
    // Applique le thème sauvegardé ou utilise la préférence système
    if (savedTheme === 'dark') {
        applyDarkTheme();
    } else if (savedTheme === 'light') {
        applyLightTheme();
    } else {
        // Vérifie la préférence système
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyDarkTheme();
        }
    }
    
    // Ajoute l'événement de clic pour basculer le thème
    themeSwitch.addEventListener('click', toggleTheme);

    // Écoute les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('roblox-ui-theme')) {
            if (e.matches) {
                applyDarkTheme(false); // N'enregistre pas dans localStorage
            } else {
                applyLightTheme(false); // N'enregistre pas dans localStorage
            }
        }
    });
}

/**
 * Bascule entre les thèmes clair et sombre
 */
function toggleTheme() {
    const body = document.body;
    
    if (body.classList.contains('dark-theme')) {
        applyLightTheme();
    } else {
        applyDarkTheme();
    }
}

/**
 * Applique le thème sombre
 * @param {boolean} savePreference - Indique si la préférence doit être sauvegardée
 */
function applyDarkTheme(savePreference = true) {
    const body = document.body;
    const themeSwitch = document.querySelector('.theme-switch');
    
    body.classList.add('dark-theme');
    themeSwitch.classList.add('dark');
    
    if (savePreference) {
        localStorage.setItem('roblox-ui-theme', 'dark');
    }
    
    // Met à jour les éléments spécifiques au thème
    updateThemeSpecificElements('dark');
}

/**
 * Applique le thème clair
 * @param {boolean} savePreference - Indique si la préférence doit être sauvegardée
 */
function applyLightTheme(savePreference = true) {
    const body = document.body;
    const themeSwitch = document.querySelector('.theme-switch');
    
    body.classList.remove('dark-theme');
    themeSwitch.classList.remove('dark');
    
    if (savePreference) {
        localStorage.setItem('roblox-ui-theme', 'light');
    }
    
    // Met à jour les éléments spécifiques au thème
    updateThemeSpecificElements('light');
}

/**
 * Met à jour les éléments spécifiques au thème
 * @param {string} theme - Le thème à appliquer ('light' ou 'dark')
 */
function updateThemeSpecificElements(theme) {
    // Met à jour la couleur du thème pour le navigateur
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#1e1e24' : '#00a2ff');
    }
    
    // Met à jour les couleurs des SVG si nécessaire
    const svgElements = document.querySelectorAll('svg');
    svgElements.forEach(svg => {
        // Nous pourrions ajuster les couleurs des SVG ici si nécessaire
    });
    
    // Déclenche un événement personnalisé pour informer d'autres composants
    document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
}

// Exporte les fonctions pour une utilisation dans d'autres modules
export { initThemeSwitcher, toggleTheme, applyDarkTheme, applyLightTheme };