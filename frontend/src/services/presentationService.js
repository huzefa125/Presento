import api from '../config/api';

/**
 * Presentation Service - API calls for presentations and slides
 */

// Create a new presentation
export const createPresentation = async (title) => {
  try {
    const response = await api.post('/presentations', { title });
    return response.data;
  } catch (error) {
    console.error('Create presentation error:', error);
    throw error;
  }
};

// Get all user presentations
export const getUserPresentations = async (limit = 20, skip = 0) => {
  try {
    const response = await api.get(`/presentations?limit=${limit}&skip=${skip}`);
    return response.data;
  } catch (error) {
    console.error('Get presentations error:', error);
    throw error;
  }
};

// Get single presentation with all slides
export const getPresentationById = async (id) => {
  try {
    const response = await api.get(`/presentations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Get presentation error:', error);
    throw error;
  }
};

// Update presentation
export const updatePresentation = async (id, data) => {
  try {
    const response = await api.put(`/presentations/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Update presentation error:', error);
    throw error;
  }
};

// Delete presentation
export const deletePresentation = async (id) => {
  try {
    const response = await api.delete(`/presentations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete presentation error:', error);
    throw error;
  }
};

// Create a new slide
export const createSlide = async (presentationId, slideData) => {
  try {
    const response = await api.post(`/presentations/${presentationId}/slides`, slideData);
    return response.data;
  } catch (error) {
    console.error('Create slide error:', error);
    throw error;
  }
};

// Update slide
export const updateSlide = async (presentationId, slideId, slideData) => {
  try {
    const response = await api.put(`/presentations/${presentationId}/slides/${slideId}`, slideData);
    return response.data;
  } catch (error) {
    console.error('Update slide error:', error);
    throw error;
  }
};

// Delete slide
export const deleteSlide = async (presentationId, slideId) => {
  try {
    const response = await api.delete(`/presentations/${presentationId}/slides/${slideId}`);
    return response.data;
  } catch (error) {
    console.error('Delete slide error:', error);
    throw error;
  }
};

// LocalStorage helpers
const STORAGE_KEY = 'current_presentation_draft ';

export const saveDraftToLocalStorage = (presentationId, data) => {
  try {
    const draft = {
      presentationId,
      data,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Save to localStorage error:', error);
  }
};

export const getDraftFromLocalStorage = (presentationId) => {
  try {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      if (parsed.presentationId === presentationId) {
        return parsed.data;
      }
    }
    return null;
  } catch (error) {
    console.error('Get from localStorage error:', error);
    return null;
  }
};

export const clearDraftFromLocalStorage = (presentationId = null) => {
  try {
    // If presentationId is provided, only clear if it matches
    if (presentationId) {
      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.presentationId === presentationId) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } else {
      // Clear all drafts
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Clear localStorage error:', error);
  }
};

export const hasDraftInLocalStorage = (presentationId) => {
  try {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      const parsed = JSON.parse(draft);
      return parsed.presentationId === presentationId;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

// Upload image to Cloudinary with retry logic for rate limiting
export const uploadImage = async (base64Image, retries = 3) => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await api.post('/upload/image', { image: base64Image });
      return response.data;
    } catch (error) {
      // If it's a 429 error and we have retries left, wait and retry
      if (error.response?.status === 429 && attempt < retries - 1) {
        const retryAfter = error.response?.data?.retryAfter 
          ? parseInt(error.response.data.retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        
        console.warn(`Upload rate limited. Retrying after ${retryAfter / 1000}s... (attempt ${attempt + 1}/${retries})`);
        await delay(retryAfter);
        continue;
      }
      
      // For other errors or final attempt, throw the error
      console.error('Upload image error:', error);
      throw error;
    }
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const response = await api.delete('/upload/image', { data: { publicId } });
    return response.data;
  } catch (error) {
    console.error('Delete image error:', error);
    throw error;
  }
};

// Upload PowerPoint file to Cloudinary
export const uploadPowerPoint = async (base64PowerPoint, retries = 3) => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Set a longer timeout for PowerPoint uploads (5 minutes for large files)
      const response = await api.post('/upload/powerpoint', { powerpoint: base64PowerPoint }, {
        timeout: 300000 // 5 minutes timeout for large PowerPoint uploads
      });
      return response.data;
    } catch (error) {
      // If it's a 429 error and we have retries left, wait and retry
      if (error.response?.status === 429 && attempt < retries - 1) {
        const retryAfter = error.response?.data?.retryAfter 
          ? parseInt(error.response.data.retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        
        console.warn(`Upload rate limited. Retrying after ${retryAfter / 1000}s... (attempt ${attempt + 1}/${retries})`);
        await delay(retryAfter);
        continue;
      }
      
      // For other errors or final attempt, throw the error
      console.error('Upload PowerPoint error:', error);
      throw error;
    }
  }
};

// Upload PDF file to Cloudinary
export const uploadPdf = async (base64Pdf, retries = 3) => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Set a longer timeout for PDF uploads (5 minutes for large files)
      const response = await api.post('/upload/pdf', { pdf: base64Pdf }, {
        timeout: 300000 // 5 minutes timeout for large PDF uploads
      });
      return response.data;
    } catch (error) {
      // If it's a 429 error and we have retries left, wait and retry
      if (error.response?.status === 429 && attempt < retries - 1) {
        const retryAfter = error.response?.data?.retryAfter 
          ? parseInt(error.response.data.retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        
        console.warn(`Upload rate limited. Retrying after ${retryAfter / 1000}s... (attempt ${attempt + 1}/${retries})`);
        await delay(retryAfter);
        continue;
      }
      
      // For other errors or final attempt, throw the error
      console.error('Upload PDF error:', error);
      throw error;
    }
  }
};

// Upload video to Cloudinary with retry logic for rate limiting
export const uploadVideo = async (base64Video, retries = 3) => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Set a longer timeout for video uploads (10 minutes for large files)
      const response = await api.post('/upload/video', { video: base64Video }, {
        timeout: 600000 // 10 minutes timeout for large video uploads
      });
      return response.data;
    } catch (error) {
      // If it's a 429 error and we have retries left, wait and retry
      if (error.response?.status === 429 && attempt < retries - 1) {
        const retryAfter = error.response?.data?.retryAfter 
          ? parseInt(error.response.data.retryAfter) * 1000 
          : Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        
        console.warn(`Upload rate limited. Retrying after ${retryAfter / 1000}s... (attempt ${attempt + 1}/${retries})`);
        await delay(retryAfter);
        continue;
      }
      
      // Handle timeout errors specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Upload timeout. The video file may be too large or your connection is slow. Please try again with a smaller file or check your internet connection.');
      }
      
      // For other errors or final attempt, throw the error
      console.error('Upload video error:', error);
      throw error;
    }
  }
};

// Get user's uploaded images
export const getUserImages = async () => {
  try {
    const response = await api.get('/upload/images');
    return response.data;
  } catch (error) {
    console.error('Get user images error:', error);
    throw error;
  }
};

// Get presentation results
export const getPresentationResults = async (id) => {
  try {
    const response = await api.get(`/presentations/${id}/results`);
    return response.data;
  } catch (error) {
    console.error('Get presentation results error:', error);
    throw error;
  }
};

// Export presentation results
export const exportPresentationResults = async (id, format = 'csv') => {
  try {
    const response = await api.get(`/presentations/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Export presentation results error:', error);
    throw error;
  }
};

// Toggle QnA status
export const toggleQnaStatus = async (presentationId, questionId, isAnswered) => {
  try {
    const response = await api.put(`/presentations/${presentationId}/qna/${questionId}/status`, { isAnswered });
    return response.data;
  } catch (error) {
    console.error('Toggle QnA status error:', error);
    throw error;
  }
};

// Get all responses for a specific slide
export const getSlideResponses = async (presentationId, slideId) => {
  try {
    const response = await api.get(`/presentations/${presentationId}/slides/${slideId}/responses`);
    return response.data;
  } catch (error) {
    console.error('Get slide responses error:', error);
    throw error;
  }
};

// Clear all results for a presentation
export const clearPresentationResults = async (presentationId) => {
  try {
    const response = await api.delete(`/presentations/${presentationId}/results`);
    return response.data;
  } catch (error) {
    console.error('Clear presentation results error:', error);
    throw error;
  }
};

// Clear results for a specific slide
export const clearSlideResults = async (presentationId, slideId) => {
  try {
    const response = await api.delete(`/presentations/${presentationId}/slides/${slideId}/results`);
    return response.data;
  } catch (error) {
    console.error('Clear slide results error:', error);
    throw error;
  }
};

// Recalculate and fix scores for existing quiz results
export const recalculatePresentationScores = async (presentationId) => {
  try {
    const response = await api.post(`/presentations/${presentationId}/recalculate-scores`);
    return response.data;
  } catch (error) {
    console.error('Recalculate scores error:', error);
    throw error;
  }
};