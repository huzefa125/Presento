import { useCallback, useMemo } from 'react';

/**
 * Reorders slides so each quiz's linked leaderboard immediately follows it
 * (leaderboards otherwise sort wherever their own "order" field puts them),
 * and maps selection/delete/reorder callbacks between that display order and
 * the original "slides" array index space the rest of the app expects.
 *
 * Split out of SlideBar.jsx; see CODE_STANDARDS.md. Pure/derived from props -
 * no refs, no DOM, no drag-and-drop state, which is why it extracts cleanly
 * as a hook while the drag-and-drop logic (deeply tied to refs/touch events)
 * was deliberately left inline in SlideBar.jsx.
 */
export function useOrderedSlides({ slides, currentSlideIndex, onSlideSelect, onDeleteSlide, onSlideReorder }) {
  const orderedSlides = useMemo(() => {
    if (!slides || slides.length === 0) return [];
    
    // First, ensure slides are sorted by order field (with fallback to index)
    const sortedSlides = [...slides].sort((a, b) => {
      // Use order field if available, otherwise use index as fallback
      const orderA = a.order !== undefined && a.order !== null ? a.order : 999999;
      const orderB = b.order !== undefined && b.order !== null ? b.order : 999999;
      
      // If orders are equal, maintain original array order
      if (orderA === orderB) {
        return 0;
      }
      return orderA - orderB;
    });
    
    // Create a map of quiz slide IDs to their leaderboards
    const quizToLeaderboard = new Map();
    const unlinkedLeaderboards = [];
    
    // Helper function to get all possible ID representations for a slide
    const getAllSlideIds = (slide) => {
      const ids = new Set();
      if (!slide) return ids;
      
      // Try both id and _id fields
      const id1 = slide.id;
      const id2 = slide._id;
      
      if (id1) {
        ids.add(String(id1));
        if (typeof id1 === 'object' && id1.toString) {
          ids.add(id1.toString());
        }
      }
      
      if (id2) {
        ids.add(String(id2));
        if (typeof id2 === 'object' && id2.toString) {
          ids.add(id2.toString());
        }
      }
      
      return ids;
    };
    
    // Build a map of all quiz slide IDs to their slides
    // Use a map that stores all possible ID formats for each quiz
    const quizSlideMap = new Map(); // Map of quiz slide -> all its ID strings
    const quizIdToSlide = new Map(); // Map of any ID string -> quiz slide
    
    sortedSlides.forEach(slide => {
      if (slide.type === 'quiz') {
        const allIds = getAllSlideIds(slide);
        quizSlideMap.set(slide, allIds);
        // Map each ID format to the quiz slide
        allIds.forEach(idStr => {
          quizIdToSlide.set(idStr, slide);
        });
      }
    });
    
    // Map leaderboards to their linked quiz slides
    sortedSlides.forEach(slide => {
      if (slide.type === 'leaderboard') {
        const linkedQuizId = slide.leaderboardSettings?.linkedQuizSlideId;
        if (linkedQuizId) {
          // Try to find matching quiz by comparing all possible ID formats
          const linkedIdStr = String(linkedQuizId);
          const linkedIdStr2 = (linkedQuizId && typeof linkedQuizId === 'object' && linkedQuizId.toString) 
            ? linkedQuizId.toString() 
            : linkedIdStr;
          
          // Try to find the quiz that matches this linked ID
          let matchingQuiz = null;
          
          // First try direct lookup in the ID map
          matchingQuiz = quizIdToSlide.get(linkedIdStr) || quizIdToSlide.get(linkedIdStr2);
          
          // If not found, try comparing with all quiz IDs using the Set
          if (!matchingQuiz) {
            for (const [quizSlide, quizIds] of quizSlideMap.entries()) {
              if (quizIds.has(linkedIdStr) || quizIds.has(linkedIdStr2)) {
                matchingQuiz = quizSlide;
                break;
              }
            }
          }
          
          if (matchingQuiz) {
            // Store the leaderboard with all possible quiz ID formats as keys
            // This ensures we can find it regardless of which ID format is used
            const allQuizIds = getAllSlideIds(matchingQuiz);
            allQuizIds.forEach(quizIdStr => {
              quizToLeaderboard.set(quizIdStr, slide);
            });
          } else {
            // Leaderboard linked to a quiz that doesn't exist or ID mismatch
            unlinkedLeaderboards.push(slide);
          }
        } else {
          // Leaderboard without a linked quiz (final leaderboard)
          unlinkedLeaderboards.push(slide);
        }
      }
    });
    
    // Build ordered array: iterate through sorted slides and insert leaderboards after their quiz
    const orderedSlidesArray = [];
    const processedLeaderboards = new Set();
    
    sortedSlides.forEach(slide => {
      // Skip leaderboards in the first pass - we'll add them after their quiz
      if (slide.type === 'leaderboard') {
        return;
      }
      
      // Add the slide
      orderedSlidesArray.push(slide);
      
      // If this is a quiz slide, add its linked leaderboard right after
      if (slide.type === 'quiz') {
        // Try all possible ID formats to find the leaderboard
        const quizIds = getAllSlideIds(slide);
        let linkedLeaderboard = null;
        
        // Try to find the leaderboard using any of the quiz's ID formats
        for (const quizIdStr of quizIds) {
          linkedLeaderboard = quizToLeaderboard.get(quizIdStr);
          if (linkedLeaderboard) break;
        }
        
        if (linkedLeaderboard) {
          const leaderboardId = String(linkedLeaderboard.id || linkedLeaderboard._id);
          if (leaderboardId && !processedLeaderboards.has(leaderboardId)) {
            orderedSlidesArray.push(linkedLeaderboard);
            processedLeaderboards.add(leaderboardId);
          }
        }
      }
    });
    
    // Add any remaining leaderboards that weren't linked to a quiz (final leaderboards)
    // These should maintain their original order
    unlinkedLeaderboards.forEach(leaderboard => {
      const leaderboardId = String(leaderboard.id || leaderboard._id);
      if (!processedLeaderboards.has(leaderboardId)) {
        orderedSlidesArray.push(leaderboard);
        processedLeaderboards.add(leaderboardId);
      }
    });
    
    return orderedSlidesArray;
  }, [slides]);
  
  // Map currentSlideIndex to the ordered slides array
  // Since we're reordering, we need to find the correct index in the ordered array
  const getOrderedIndex = useCallback((originalIndex) => {
    if (!slides || originalIndex < 0 || originalIndex >= slides.length) return 0;
    const originalSlide = slides[originalIndex];
    const orderedIndex = orderedSlides.findIndex(s => {
      const originalId = originalSlide.id || originalSlide._id;
      const orderedId = s.id || s._id;
      return String(originalId) === String(orderedId);
    });
    return orderedIndex >= 0 ? orderedIndex : 0;
  }, [slides, orderedSlides]);
  
  const mappedCurrentSlideIndex = useMemo(() => {
    return getOrderedIndex(currentSlideIndex);
  }, [currentSlideIndex, getOrderedIndex]);
  
  // When a slide is selected in the ordered array, find its index in the original array
  const handleSlideSelect = useCallback((orderedIndex) => {
    if (!slides || orderedIndex < 0 || orderedIndex >= orderedSlides.length) return;
    const selectedSlide = orderedSlides[orderedIndex];
    const originalIndex = slides.findIndex(s => {
      const selectedId = selectedSlide.id || selectedSlide._id;
      const originalId = s.id || s._id;
      return String(selectedId) === String(originalId);
    });
    if (originalIndex >= 0 && onSlideSelect) {
      onSlideSelect(originalIndex);
    }
  }, [slides, orderedSlides, onSlideSelect]);
  
  // When deleting a slide, use the original index
  const handleDeleteSlide = useCallback((orderedIndex) => {
    if (!slides || orderedIndex < 0 || orderedIndex >= orderedSlides.length) return;
    const selectedSlide = orderedSlides[orderedIndex];
    const originalIndex = slides.findIndex(s => {
      const selectedId = selectedSlide.id || selectedSlide._id;
      const originalId = s.id || s._id;
      return String(selectedId) === String(originalId);
    });
    if (originalIndex >= 0 && onDeleteSlide) {
      onDeleteSlide(originalIndex);
    }
  }, [slides, orderedSlides, onDeleteSlide]);
  
  // When reordering, map both indices back to original array
  const handleSlideReorder = useCallback((fromOrderedIndex, toOrderedIndex) => {
    if (!slides || !onSlideReorder) return;
    
    if (fromOrderedIndex < 0 || fromOrderedIndex >= orderedSlides.length || 
        toOrderedIndex < 0 || toOrderedIndex >= orderedSlides.length) {
      return;
    }
    
    const fromSlide = orderedSlides[fromOrderedIndex];
    const toSlide = orderedSlides[toOrderedIndex];
    
    if (!fromSlide || !toSlide) return;
    
    const fromOriginalIndex = slides.findIndex(s => {
      const fromId = fromSlide.id || fromSlide._id;
      const originalId = s.id || s._id;
      return String(fromId) === String(originalId);
    });
    
    const toOriginalIndex = slides.findIndex(s => {
      const toId = toSlide.id || toSlide._id;
      const originalId = s.id || s._id;
      return String(toId) === String(originalId);
    });
    
    if (fromOriginalIndex >= 0 && toOriginalIndex >= 0) {
      onSlideReorder(fromOriginalIndex, toOriginalIndex);
    }
  }, [slides, orderedSlides, onSlideReorder]);
  
  return {
    displaySlides: orderedSlides,
    displayCurrentSlideIndex: mappedCurrentSlideIndex,
    handleSlideSelect,
    handleDeleteSlide,
    handleSlideReorder,
  };
}
