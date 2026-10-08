import { useEffect, useRef, useState, useCallback } from 'react';
import { BarChart3, Cloud, MessageSquare, Sliders, ChartBarDecreasing, Plus, X, MessagesSquare, CircleQuestionMark, SquareStack, Grid2X2, MapPin, Brain, Trophy, GripVertical, Settings, FileText, Presentation, Monitor, Type, Image, Video, BookOpen, Sparkles, GitCompare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getThemeStyleVars } from '../../constants/themes';
import SlideThumbnailPreview from './SlideThumbnailPreview';
import { useOrderedSlides } from '../../hooks/useOrderedSlides';

const SlideBar = ({ slides, currentSlideIndex, onSlideSelect, onDeleteSlide, onNewSlideClick, showNewSlideDropdown, onSlideReorder, isHorizontal = false, onEditSlide, theme, onAiGenerateClick }) => {
  const { t } = useTranslation();
  const themeStyleVars = getThemeStyleVars(theme);
  
  const { displaySlides, displayCurrentSlideIndex, handleSlideSelect, handleDeleteSlide, handleSlideReorder } = useOrderedSlides({ slides, currentSlideIndex, onSlideSelect, onDeleteSlide, onSlideReorder });

  const itemRefs = useRef([]);
  const containerRef = useRef(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Touch drag state - using refs for performance
  const touchDragStateRef = useRef({
    isActive: false,
    startIndex: null,
    startX: null,
    startY: null,
    currentX: null,
    currentY: null,
    draggedElement: null,
    lastDragOverIndex: null, // Store last known drag over index
  });
  const [touchDragActive, setTouchDragActive] = useState(false);

  // Auto-scroll state - using refs to avoid re-renders
  const scrollAnimationRef = useRef(null);
  const scrollSpeedRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  const lastAutoScrollCheckRef = useRef(0);
  const currentPositionRef = useRef({ x: 0, y: 0 });
  
  // Auto-scroll configuration
  const EDGE_THRESHOLD = 60; // Distance from edge in pixels to trigger scroll
  const MAX_SCROLL_SPEED = 40; // Maximum pixels per frame (increased for faster scrolling)
  const SCROLL_DECELERATION = 0.92; // How quickly scroll speed decreases
  const AUTO_SCROLL_THROTTLE = 16; // Throttle auto-scroll checks to ~60fps

  useEffect(() => {
    const currentItem = itemRefs.current[displayCurrentSlideIndex];
    if (currentItem && typeof currentItem.scrollIntoView === 'function') {
      if (isHorizontal) {
        currentItem.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      } else {
        currentItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [displayCurrentSlideIndex, displaySlides.length, isHorizontal]);


  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index);
    // Add visual feedback
    if (e.target) {
      e.target.style.opacity = '0.5';
    }
  };

  // Optimized auto-scroll functionality with useCallback - Define these first to avoid hoisting issues
  const stopAutoScroll = useCallback(() => {
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }
    scrollSpeedRef.current = 0;
  }, []);

  const calculateScrollSpeed = useCallback((clientX, clientY) => {
    const container = containerRef.current;
    if (!container) return 0;

    // Cache container rect to avoid repeated getBoundingClientRect calls
    const containerRect = container.getBoundingClientRect();
    let distanceFromEdge = 0;
    let scrollDirection = 0;

    if (isHorizontal) {
      const distanceFromLeft = clientX - containerRect.left;
      const distanceFromRight = containerRect.right - clientX;

      if (distanceFromLeft < EDGE_THRESHOLD) {
        distanceFromEdge = EDGE_THRESHOLD - distanceFromLeft;
        scrollDirection = -1;
      } else if (distanceFromRight < EDGE_THRESHOLD) {
        distanceFromEdge = EDGE_THRESHOLD - distanceFromRight;
        scrollDirection = 1;
      } else {
        return 0;
      }
    } else {
      const distanceFromTop = clientY - containerRect.top;
      const distanceFromBottom = containerRect.bottom - clientY;

      if (distanceFromTop < EDGE_THRESHOLD) {
        distanceFromEdge = EDGE_THRESHOLD - distanceFromTop;
        scrollDirection = -1;
      } else if (distanceFromBottom < EDGE_THRESHOLD) {
        distanceFromEdge = EDGE_THRESHOLD - distanceFromBottom;
        scrollDirection = 1;
      } else {
        return 0;
      }
    }

    // Optimized speed calculation using linear interpolation for smoother response
    const normalizedDistance = Math.min(distanceFromEdge / EDGE_THRESHOLD, 1);
    // Use smoother easing function with faster acceleration
    const easedDistance = normalizedDistance * normalizedDistance * (3 - 2 * normalizedDistance);
    // Apply power curve for faster response near edges
    const speed = Math.pow(easedDistance, 0.8) * MAX_SCROLL_SPEED * scrollDirection;

    return speed;
  }, [isHorizontal, EDGE_THRESHOLD, MAX_SCROLL_SPEED]);

  const startAutoScroll = useCallback((speed) => {
    const container = containerRef.current;
    if (!container) return;
    
    if (scrollAnimationRef.current) {
      scrollSpeedRef.current = speed;
      return;
    }
    
    scrollSpeedRef.current = speed;
    lastScrollTimeRef.current = performance.now();
    
    const scroll = (currentTime) => {
      const container = containerRef.current;
      if (!container || Math.abs(scrollSpeedRef.current) < 0.1) {
        stopAutoScroll();
        return;
      }

      const deltaTime = Math.max(currentTime - lastScrollTimeRef.current, 0);
      lastScrollTimeRef.current = currentTime;
      
      // Use fixed timestep for consistent scrolling
      const fixedDelta = 16.67; // 60fps
      const normalizedSpeed = scrollSpeedRef.current * (deltaTime / fixedDelta);

      if (isHorizontal) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        const newScrollLeft = Math.max(0, Math.min(maxScroll, container.scrollLeft + normalizedSpeed));
        container.scrollLeft = newScrollLeft;
        
        // Stop if at boundaries
        if ((newScrollLeft <= 0 && scrollSpeedRef.current < 0) || 
            (newScrollLeft >= maxScroll && scrollSpeedRef.current > 0)) {
          stopAutoScroll();
          return;
        }
      } else {
        const maxScroll = container.scrollHeight - container.clientHeight;
        const newScrollTop = Math.max(0, Math.min(maxScroll, container.scrollTop + normalizedSpeed));
        container.scrollTop = newScrollTop;
        
        // Stop if at boundaries
        if ((newScrollTop <= 0 && scrollSpeedRef.current < 0) || 
            (newScrollTop >= maxScroll && scrollSpeedRef.current > 0)) {
          stopAutoScroll();
          return;
        }
      }

      // Smooth deceleration
      scrollSpeedRef.current *= SCROLL_DECELERATION;

      scrollAnimationRef.current = requestAnimationFrame(scroll);
    };

    scrollAnimationRef.current = requestAnimationFrame(scroll);
  }, [isHorizontal, SCROLL_DECELERATION, stopAutoScroll]);

  const handleAutoScroll = useCallback((clientX, clientY) => {
    const now = performance.now();
    
    // Throttle auto-scroll calculations to reduce overhead
    if (now - lastAutoScrollCheckRef.current < AUTO_SCROLL_THROTTLE) {
      return;
    }
    lastAutoScrollCheckRef.current = now;
    
    // Cache position to avoid repeated calculations
    currentPositionRef.current = { x: clientX, y: clientY };
    
    const speed = calculateScrollSpeed(clientX, clientY);
    
    if (Math.abs(speed) < 0.1) {
      stopAutoScroll();
    } else {
      if (scrollAnimationRef.current) {
        // Smoothly interpolate to new speed to avoid jitter
        scrollSpeedRef.current = scrollSpeedRef.current * 0.7 + speed * 0.3;
      } else {
        startAutoScroll(speed);
      }
    }
  }, [calculateScrollSpeed, startAutoScroll, stopAutoScroll, AUTO_SCROLL_THROTTLE]);

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  // Drag handlers - defined after auto-scroll functions
  const handleDragEnd = (e) => {
    if (e.target) {
      e.target.style.transition = 'all 0.2s ease-out';
      e.target.style.opacity = '1';
      setTimeout(() => {
        if (e.target) {
          e.target.style.transition = '';
        }
      }, 200);
    }
    stopAutoScroll();
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Handle auto-scroll for mouse drag
    if (draggedIndex !== null) {
      handleAutoScroll(e.clientX, e.clientY);
      
      if (draggedIndex !== index) {
        setDragOverIndex(index);
      }
    }
    
    // Stop event propagation to prevent container handler from firing
    e.stopPropagation();
  }, [draggedIndex, handleAutoScroll]);

  const handleDragLeave = () => {
    setDragOverIndex(null);
    stopAutoScroll();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    stopAutoScroll();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      // Use internal handleSlideReorder which converts ordered indices to original indices
      handleSlideReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Check if a slide is draggable - only auto-generated leaderboards are not draggable
  const isSlideDraggable = useCallback((slide) => {
    // Auto-generated leaderboard slides are not draggable
    if (slide.type === 'leaderboard' && slide.leaderboardSettings?.isAutoGenerated) {
      return false;
    }
    
    // All other slides are draggable if there's more than one slide
    return displaySlides.length > 1;
  }, [displaySlides]);

  // Touch event handlers for mobile drag and drop
  const handleTouchStart = useCallback((e, index) => {
    const slide = slides[index];
    if (!isSlideDraggable(slide)) {
      return;
    }

    // Don't prevent default initially - only prevent if user actually drags
    // This allows scrolling and click events to work normally
    
    const touch = e.touches[0];
    const element = e.currentTarget;
    
    touchDragStateRef.current = {
      isActive: true,
      startIndex: index,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      draggedElement: element,
      hasMoved: false, // Track if user actually dragged
      startTime: Date.now(), // Track when touch started
      containerScrollLeft: containerRef.current?.scrollLeft || 0,
      containerScrollTop: containerRef.current?.scrollTop || 0,
      wasScrolling: false, // Track if user was scrolling
      lastDragOverIndex: null,
    };

    setTouchDragActive(true);
    setDraggedIndex(index);
    setIsDragging(true);
    
    // Don't modify element styles initially - only if user drags
    // This allows click to work normally for taps and scrolling to work
  }, [slides, isSlideDraggable]);

  // Attach touchstart listeners to slide elements
  // Use passive: true initially to allow scrolling, then switch to non-passive only when dragging
  useEffect(() => {
    const cleanupFunctions = [];
    
    itemRefs.current.forEach((element, index) => {
      if (element) {
        // Always attach touch handlers for all slides
        const touchStartHandler = (e) => {
          // Only handle drag for draggable slides
          if (displaySlides.length > 1 && !(displaySlides[index]?.type === 'leaderboard' && displaySlides[index]?.leaderboardSettings?.isAutoGenerated)) {
            handleTouchStart(e, index);
            // Don't prevent default here - allow scrolling initially
          } else {
            // For non-draggable slides (single slide or leaderboard), just select on tap
            // Only prevent default if it's a tap, not a scroll
            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;
            
            // Use a timeout to check if user scrolled
            const timeoutId = setTimeout(() => {
              const currentTouch = e.touches?.[0];
              if (currentTouch) {
                const deltaX = Math.abs(currentTouch.clientX - startX);
                const deltaY = Math.abs(currentTouch.clientY - startY);
                if (deltaX < 5 && deltaY < 5) {
                  // It's a tap, select the slide
                  handleSlideSelect(index);
                }
              }
            }, 150);
            
            // Store timeout to clear if touch moves
            element._tapTimeout = timeoutId;
          }
        };
        
        // Use passive: true to allow scrolling, we'll handle preventDefault in touchmove
        element.addEventListener('touchstart', touchStartHandler, { passive: true });
        cleanupFunctions.push(() => {
          element.removeEventListener('touchstart', touchStartHandler);
          if (element._tapTimeout) {
            clearTimeout(element._tapTimeout);
          }
        });
      }
    });
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [displaySlides, handleTouchStart, handleSlideSelect]);

  const handleTouchCancel = useCallback(() => {
    const dragState = touchDragStateRef.current;
    stopAutoScroll();
    
    if (dragState.draggedElement) {
      dragState.draggedElement.style.transition = 'all 0.2s ease-out';
      dragState.draggedElement.style.opacity = '';
      dragState.draggedElement.style.transform = '';
      dragState.draggedElement.style.zIndex = '';
      dragState.draggedElement.style.cursor = '';
      
      setTimeout(() => {
        if (dragState.draggedElement) {
          dragState.draggedElement.style.transition = '';
        }
      }, 200);
    }
    touchDragStateRef.current = {
      isActive: false,
      startIndex: null,
      startX: null,
      startY: null,
      currentX: null,
      currentY: null,
      draggedElement: null,
      containerScrollLeft: null,
      containerScrollTop: null,
      wasScrolling: false,
      isDragging: false,
      lastDragOverIndex: null,
    };
    setTouchDragActive(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  }, [stopAutoScroll]);

  const handleTouchMove = useCallback((e) => {
    const dragState = touchDragStateRef.current;
    if (!dragState.isActive) return;

    const touch = e.touches[0];
    if (!touch) return;
    
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // Check if user has moved enough to consider it a drag (not a tap or scroll)
    const deltaX = Math.abs(touchX - dragState.startX);
    const deltaY = Math.abs(touchY - dragState.startY);
    const DRAG_THRESHOLD = 10; // Reduced threshold for better responsiveness
    
    // Check if container has scrolled - if so, user is scrolling, not dragging
    const container = containerRef.current;
    const hasScrolled = container && (
      Math.abs(container.scrollLeft - (dragState.containerScrollLeft || 0)) > 5 ||
      Math.abs(container.scrollTop - (dragState.containerScrollTop || 0)) > 5
    );
    
    // Check if movement is primarily in the scroll direction
    // For horizontal layout, vertical movement = scrolling
    // For vertical layout, horizontal movement = scrolling
    const isScrollDirection = isHorizontal 
      ? (deltaY > deltaX * 1.5 && deltaY > 15) // Vertical movement in horizontal layout = scrolling (more strict)
      : (deltaX > deltaY * 1.5 && deltaX > 15); // Horizontal movement in vertical layout = scrolling (more strict)
    
    // If container scrolled or movement is clearly in scroll direction, cancel drag and allow scrolling
    // Only cancel if we haven't started dragging yet
    if ((hasScrolled || isScrollDirection) && !dragState.hasMoved) {
      dragState.wasScrolling = true;
      handleTouchCancel();
      return;
    }
    
    // If we've already started dragging, don't cancel even if there's some scroll
    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
      // User is dragging - mark as moved and add visual feedback
      if (!dragState.hasMoved) {
        dragState.hasMoved = true;
        dragState.isDragging = true;
        
        // Add visual feedback only when dragging starts
        if (dragState.draggedElement) {
          dragState.draggedElement.style.opacity = '0.8';
          dragState.draggedElement.style.transform = 'scale(1.05)';
          dragState.draggedElement.style.zIndex = '1000';
          dragState.draggedElement.style.willChange = 'transform';
          dragState.draggedElement.style.pointerEvents = 'none';
          dragState.draggedElement.style.transition = 'none'; // Disable transitions during drag
          dragState.draggedElement.style.cursor = 'grabbing';
        }
      }
      
      // Now that we're dragging, prevent default to stop scrolling
      if (e.cancelable && dragState.isDragging) {
        e.preventDefault();
      }
    } else {
      // Not enough movement yet - allow scrolling
      // Don't prevent default, let the container scroll
      return;
    }
    
    // Update ref immediately for performance
    dragState.currentX = touchX;
    dragState.currentY = touchY;

    // Update dragged element position directly (no state update needed)
    if (dragState.draggedElement) {
      const deltaX = touchX - dragState.startX;
      const deltaY = touchY - dragState.startY;
      
      // Use transform3d for hardware acceleration with smoother scale
      dragState.draggedElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(1.05)`;
    }

    // Calculate drag over index - check all items for accurate detection
    let newDragOverIndex = null;
    const startIdx = dragState.startIndex;
    
    // Check all items to find the correct drop position
    // Also check the last slide even if it's the startIdx (for edge cases)
    for (let idx = 0; idx < itemRefs.current.length; idx++) {
      const ref = itemRefs.current[idx];
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (isHorizontal) {
          // Horizontal layout - check if touch is over this slide
          if (touchX >= rect.left && touchX <= rect.right) {
            const centerX = rect.left + rect.width / 2;
            // Determine if we should insert before or after this slide
            if (idx !== startIdx) {
              newDragOverIndex = touchX < centerX ? idx : idx + 1;
              break;
            } else {
              // If we're over the dragged slide itself, check if we're past its center
              // This helps when dragging to the end
              if (touchX > centerX && idx === itemRefs.current.length - 1) {
                // We're past the center of the last slide, so drop after it
                newDragOverIndex = idx + 1;
                break;
              }
            }
          }
        } else {
          // Vertical layout - check if touch is over this slide
          if (touchY >= rect.top && touchY <= rect.bottom) {
            const centerY = rect.top + rect.height / 2;
            // Determine if we should insert before or after this slide
            if (idx !== startIdx) {
              newDragOverIndex = touchY < centerY ? idx : idx + 1;
              break;
            } else {
              // If we're over the dragged slide itself, check if we're past its center
              // This helps when dragging to the end
              if (touchY > centerY && idx === itemRefs.current.length - 1) {
                // We're past the center of the last slide, so drop after it
                newDragOverIndex = idx + 1;
                break;
              }
            }
          }
        }
      }
    }

    // If no slide found, check if we're at the beginning or end
    if (newDragOverIndex === null) {
      // Check if we're before the first slide
      if (itemRefs.current[0]) {
        const firstRect = itemRefs.current[0].getBoundingClientRect();
        if (isHorizontal && touchX < firstRect.left) {
          newDragOverIndex = 0;
        } else if (!isHorizontal && touchY < firstRect.top) {
          newDragOverIndex = 0;
        }
      }
      
      // Check if we're after the last slide or near the end of container
      if (newDragOverIndex === null && itemRefs.current[itemRefs.current.length - 1]) {
        const lastRect = itemRefs.current[itemRefs.current.length - 1].getBoundingClientRect();
        const container = containerRef.current;
        const containerRect = container?.getBoundingClientRect();
        
        // Check if touch is after the last slide OR near the end of the container
        const isAfterLastSlide = isHorizontal 
          ? touchX > lastRect.right
          : touchY > lastRect.bottom;
        
        const isNearContainerEnd = containerRect && (isHorizontal
          ? touchX > containerRect.right - 50 // Within 50px of container right edge
          : touchY > containerRect.bottom - 50); // Within 50px of container bottom edge
        
        if (isAfterLastSlide || isNearContainerEnd) {
          newDragOverIndex = itemRefs.current.length;
        }
      }
    }

    // Adjust for insertion point
    // If dragging forward (to a higher index), we need to account for the removed item
    if (newDragOverIndex !== null && newDragOverIndex > startIdx) {
      // If newDragOverIndex is itemRefs.current.length (after last slide), it means drop at last position
      if (newDragOverIndex === itemRefs.current.length) {
        newDragOverIndex = itemRefs.current.length - 1;
      } else {
        // For other forward moves, subtract 1 because the dragged item will be removed from its position
        newDragOverIndex -= 1;
      }
    }
    // If dragging backward (to a lower index), no adjustment needed

    // Fallback: If we're dragging forward and haven't found a target, and we're past the middle of the last slide, drop at last position
    if (newDragOverIndex === null && startIdx < itemRefs.current.length - 1) {
      const lastRef = itemRefs.current[itemRefs.current.length - 1];
      if (lastRef) {
        const lastRect = lastRef.getBoundingClientRect();
        const lastCenter = isHorizontal 
          ? lastRect.left + lastRect.width / 2
          : lastRect.top + lastRect.height / 2;
        const touchPos = isHorizontal ? touchX : touchY;
        
        if (touchPos > lastCenter) {
          newDragOverIndex = itemRefs.current.length - 1;
        }
      }
    }

    // Debug log removed - too verbose

    // Update drag over index if it changed
    // Allow dragOverIndex to be up to itemRefs.current.length - 1 (last position)
    if (newDragOverIndex !== null && newDragOverIndex !== startIdx && newDragOverIndex >= 0 && newDragOverIndex <= itemRefs.current.length - 1) {
      setDragOverIndex(newDragOverIndex);
      // Store in ref as backup
      dragState.lastDragOverIndex = newDragOverIndex;
    } else if (newDragOverIndex === null || newDragOverIndex === startIdx) {
      setDragOverIndex(null);
      // Don't clear lastDragOverIndex yet - keep it as fallback
    }
    
    // Handle auto-scroll
    handleAutoScroll(touchX, touchY);
  }, [isHorizontal, handleAutoScroll, handleTouchCancel]);

  const handleTouchEnd = useCallback((e) => {
    const dragState = touchDragStateRef.current;
    if (!dragState.isActive) return;

    stopAutoScroll();

    // Get current drag over index from state
    const currentDragOverIndex = dragOverIndex;
    const hasMoved = dragState.hasMoved;
    const startIndex = dragState.startIndex;

    // Reset dragged element styles with smooth transition
    if (dragState.draggedElement && hasMoved) {
      dragState.draggedElement.style.transition = 'all 0.2s ease-out';
      dragState.draggedElement.style.opacity = '';
      dragState.draggedElement.style.transform = '';
      dragState.draggedElement.style.zIndex = '';
      dragState.draggedElement.style.willChange = '';
      dragState.draggedElement.style.pointerEvents = '';
      dragState.draggedElement.style.cursor = '';
      
      // Remove transition after animation completes
      setTimeout(() => {
        if (dragState.draggedElement) {
          dragState.draggedElement.style.transition = '';
        }
      }, 200);
    }

    // Perform reorder if we have a valid drop target and user actually dragged
    const wasScrolling = dragState.wasScrolling;
    // Use currentDragOverIndex from state, or fallback to lastDragOverIndex from ref
    const finalDragOverIndex = currentDragOverIndex !== null ? currentDragOverIndex : dragState.lastDragOverIndex;
    
    if (hasMoved && finalDragOverIndex !== null && 
        finalDragOverIndex !== startIndex && 
        finalDragOverIndex >= 0 && 
        finalDragOverIndex <= itemRefs.current.length - 1) {
      handleSlideReorder(startIndex, finalDragOverIndex);
    } else if (!hasMoved && !wasScrolling && startIndex !== null) {
      // If user didn't drag and wasn't scrolling, treat it as a tap/click - select the slide
      // Use setTimeout to avoid interfering with scroll
      setTimeout(() => {
        handleSlideSelect(startIndex);
      }, 100);
    }

    // Reset state immediately
    touchDragStateRef.current = {
      isActive: false,
      startIndex: null,
      startX: null,
      startY: null,
      currentX: null,
      currentY: null,
      draggedElement: null,
      hasMoved: false,
      startTime: null,
      containerScrollLeft: null,
      containerScrollTop: null,
      wasScrolling: false,
      isDragging: false,
      lastDragOverIndex: null,
    };
    
    // Use requestAnimationFrame to ensure state updates happen after the selection
    requestAnimationFrame(() => {
      setTouchDragActive(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsDragging(false);
    });
  }, [dragOverIndex, handleSlideReorder, handleSlideSelect, stopAutoScroll]);

  // Add global touch move and end listeners when dragging
  useEffect(() => {
    if (!touchDragActive) return;

    const touchMoveHandler = (e) => {
      // Call handleTouchMove - it will handle preventDefault when needed
      handleTouchMove(e);
    };
    const touchEndHandler = (e) => handleTouchEnd(e);
    const touchCancelHandler = () => handleTouchCancel();
    
    // Start with passive listener - handleTouchMove will call preventDefault when dragging
    // Note: preventDefault in passive listeners will be ignored, but that's okay
    // The actual prevention happens when we detect dragging in handleTouchMove
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler, { passive: true });
    document.addEventListener('touchcancel', touchCancelHandler, { passive: true });
    
    return () => {
      document.removeEventListener('touchmove', touchMoveHandler);
      document.removeEventListener('touchend', touchEndHandler);
      document.removeEventListener('touchcancel', touchCancelHandler);
    };
  }, [touchDragActive, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  // Horizontal layout for mobile/tablet
  if (isHorizontal) {
    return (
      <div className="w-full bg-canvas border-t border-hairline shadow-[var(--shadow-level-1)]">
        <div 
          className="flex items-center gap-3 px-4 py-3 overflow-x-auto scrollbar-hide touch-pan-x" 
          ref={containerRef}
          style={{ 
            touchAction: 'pan-x pinch-zoom',
            WebkitOverflowScrolling: 'touch'
          }} // Allow horizontal scrolling
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedIndex !== null) {
              handleAutoScroll(e.clientX, e.clientY);
            }
          }}
          onDragLeave={(e) => {
            // Only stop scroll if we're actually leaving the container
            if (!e.currentTarget.contains(e.relatedTarget)) {
              stopAutoScroll();
            }
          }}
        >
          {/* New Slide Button - Fixed on left */}
          <button
            onClick={onNewSlideClick}
            className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 w-20 h-20 rounded-xl transition-all touch-manipulation ${
              showNewSlideDropdown
                ? 'bg-primary-active text-on-primary shadow-[var(--shadow-level-1)] scale-105'
                : 'bg-surface border-2 border-dashed border-primary text-primary hover:bg-canvas-soft active:scale-95'
            }`}
          >
            {showNewSlideDropdown ? (
              <>
                <X className="h-6 w-6" />
                <span className="text-xs font-semibold">{t('presentation.new_slide_cancel')}</span>
              </>
            ) : (
              <>
                <Plus className="h-6 w-6" />
                <span className="text-xs font-semibold">{t('presentation.new_slide')}</span>
              </>
            )}
          </button>

          {/* Slides List - Horizontal Scroll */}
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto scrollbar-hide"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pinch-zoom'
            }}
          >
            {displaySlides.map((slide, index) => (
              <div key={slide.id} className="flex flex-col items-center gap-1">
              <div
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                draggable={isSlideDraggable(slide)}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onClick={(e) => {
                  // Only handle click if not dragging and touch wasn't used
                  // On touch devices, handleTouchEnd will handle the selection
                  if (!isDragging && !touchDragActive) {
                    e.stopPropagation();
                    handleSlideSelect(index);
                  }
                }}
                className={`relative group flex-shrink-0 cursor-move rounded-xl border-2 transition-all touch-manipulation ${
                  draggedIndex === index
                    ? 'opacity-50 scale-95'
                    : dragOverIndex === index
                    ? 'border-primary scale-110'
                    : displayCurrentSlideIndex === index
                    ? 'border-primary bg-canvas-soft shadow-[var(--shadow-level-1)] scale-105'
                    : 'border-hairline bg-surface hover:border-ink-faint active:scale-95'
                }`}
                style={{ 
                  width: '130px', 
                  height: '80px',
                  transition: touchDragActive && touchDragStateRef.current.startIndex === index ? 'none' : 'all 0.2s'
                }}
              >
                {/* Drag Handle - Only show for draggable slides */}
                {isSlideDraggable(slide) && (
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-surface border border-hairline rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-ink-muted" />
                  </div>
                )}
                {/* Slide Number Badge */}
                <div className={`absolute -top-2 -left-2 w-7 h-7 sm:w-8 sm:h-8 bg-primary text-on-primary text-xs sm:text-sm font-bold rounded-full flex items-center justify-center shadow-[var(--shadow-level-1)] ${
                  currentSlideIndex === index ? 'ring-2 ring-primary ring-offset-2 ring-offset-canvas' : ''
                }`}>
                  {index + 1}
                </div>

                {/* Slide Preview */}
                <div className="w-full h-full rounded-lg overflow-hidden border border-hairline" style={themeStyleVars}>
                  <SlideThumbnailPreview slide={slide} isHorizontal={isHorizontal} />
                </div>

                {/* Active Indicator */}
                {displayCurrentSlideIndex === index && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"></div>
                )}

                 {/* Edit Button */}
                 {onEditSlide && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       onEditSlide(index);
                     }}
                     onMouseDown={(e) => e.stopPropagation()}
                     onPointerDown={(e) => e.stopPropagation()}
                     className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1.5 bg-primary rounded-full shadow-[var(--shadow-level-1)] hover:bg-primary-active transition-all z-20 touch-manipulation"
                     title="Edit slide"
                   >
                     <Settings className="h-3.5 w-3.5 text-on-primary" />
                   </button>
                 )}

                 {/* Delete Button - Only show for deletable slides */}
                 {displaySlides.length > 1 && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDeleteSlide(index);
                     }}
                     onMouseDown={(e) => e.stopPropagation()}
                     onPointerDown={(e) => e.stopPropagation()}
                     className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1.5 bg-surface border border-hairline rounded-full shadow-[var(--shadow-level-1)] hover:bg-canvas-soft transition-all z-20 touch-manipulation"
                     title="Delete slide"
                   >
                     <X className="h-3.5 w-3.5 text-red-500" />
                   </button>
                 )}

              </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vertical layout for desktop
  return (
    <aside className="w-full sm:w-56 lg:w-44 bg-canvas border-r border-hairline flex flex-col min-h-0 h-full">
      {/* New Slide Button - Sticky at top */}
      <div className="sticky top-0 z-10 bg-canvas p-3 border-b border-hairline">
        <button
          onClick={onNewSlideClick}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm active:scale-95 ${
            showNewSlideDropdown
              ? 'bg-gray-800 text-white hover:bg-gray-900'
              : 'bg-[#1E293B] text-white hover:bg-black'
          }`}
        >
          {showNewSlideDropdown ? (
            <>
              <X className="h-4 w-4" />
              <span>{t('presentation.new_slide_cancel') || 'Cancel'}</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>{t('presentation.new_slide') || 'New slide'}</span>
            </>
          )}
        </button>
      </div>

      {/* Slides List */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar touch-pan-y" 
          ref={containerRef}
          style={{ 
            touchAction: 'pan-y pinch-zoom',
            WebkitOverflowScrolling: 'touch'
          }} // Allow vertical scrolling
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedIndex !== null) {
              handleAutoScroll(e.clientX, e.clientY);
            }
          }}
          onDragLeave={(e) => {
            // Only stop scroll if we're actually leaving the container
            if (!e.currentTarget.contains(e.relatedTarget)) {
              stopAutoScroll();
            }
          }}
        >
        {displaySlides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            draggable={isSlideDraggable(slide)}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onClick={(e) => {
              // Only handle click if not dragging and touch wasn't used
              // On touch devices, handleTouchEnd will handle the selection
              if (!isDragging && !touchDragActive) {
                e.stopPropagation();
                handleSlideSelect(index);
              }
            }}
            className={`relative group ${
              isSlideDraggable(slide) 
                ? 'cursor-move' 
                : 'cursor-pointer'
            } rounded-lg border transition-all ${
              draggedIndex === index
                ? 'opacity-50 scale-95'
                : dragOverIndex === index
                ? 'border-primary scale-105 bg-canvas-soft'
                : displayCurrentSlideIndex === index
                ? 'border-primary bg-canvas-soft shadow-[var(--shadow-level-1)]'
                : 'border-hairline bg-surface hover:border-ink-faint'
            }`}
            style={{
              transition: touchDragActive && touchDragStateRef.current.startIndex === index ? 'none' : 'all 0.2s'
            }}
          >
            {/* Drag Handle - Only show for draggable slides */}
            {isSlideDraggable(slide) && (
              <div className="absolute top-1 left-1 w-5 h-5 bg-surface border border-hairline rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-3.5 w-3.5 text-ink-muted" />
              </div>
            )}
            {/* Slide Number Badge */}
            <div className="absolute -top-2 -left-2 w-5 h-5 bg-primary text-on-primary text-xs font-semibold rounded-full flex items-center justify-center shadow-[var(--shadow-level-1)]">
              {index + 1}
            </div>

            {/* Slide Preview */}
            <div className="p-2 pt-3">
              <div className="aspect-video bg-canvas-soft rounded overflow-hidden border border-hairline" style={themeStyleVars}>
                <SlideThumbnailPreview slide={slide} isHorizontal={isHorizontal} />
              </div>
            </div>

            {/* Delete Button (shows on hover) */}
            {displaySlides.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSlide(index);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-surface border border-hairline rounded-full shadow-[var(--shadow-level-1)] hover:bg-canvas-soft transition-all"
                title="Delete slide"
              >
                <X className="h-3 w-3 text-red-500" />
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SlideBar;
