/**
 * Utility function to get branding colors from institution
 * @param {Object} institution - Institution object with branding property
 * @returns {Object} Object with primaryColor and secondaryColor
 */
export const getBrandingColors = (institution) => {
    return {
        primaryColor: institution?.branding?.primaryColor || '#3b82f6',
        secondaryColor: institution?.branding?.secondaryColor || '#14b8a6'
    };
};

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string
 * @returns {Object|null} RGB object with r, g, b properties or null
 */
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

/**
 * Get RGB color string with opacity
 * @param {string} hex - Hex color string
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
export const getRgbaColor = (hex, opacity = 1) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(59, 130, 246, ${opacity})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
};

