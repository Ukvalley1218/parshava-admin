/**
 * Image URL Utility
 * Constructs full URL for images stored on the server
 */

// Default fallback image (freepik)
const DEFAULT_FALLBACK = 'https://img.freepik.com/free-photo/modern-stationary-collection-arrangement_23-2149309643.jpg?semt=ais_rp_progressive&w=740&q=80';

// Get the base URL for static assets (images, documents, etc.)
// VITE_API_BASE_URL is like 'http://localhost:3000/api'
// For static files, we need to remove the '/api' part
const getServerBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://parshava-backend.onrender.com/api';

  if (apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4); // Remove '/api'
  }
  return apiUrl;
};

/**
 * Get full URL for an image path
 * @param {string} imagePath - Relative path like '/uploads/products/images/file.jpg'
 * @param {string} fallback - Fallback URL if no image provided
 * @returns {string} Full URL to the image
 */
export const getImageUrl = (imagePath, fallback = DEFAULT_FALLBACK) => {
  // If no image path, return fallback
  if (!imagePath || imagePath.trim() === '') {
    return fallback;
  }

  // If already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Construct full URL
  const baseUrl = getServerBaseUrl();
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  return `${baseUrl}${path}`;
};

export default {
  getImageUrl,
};