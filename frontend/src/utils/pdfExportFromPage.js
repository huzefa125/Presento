import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Color palette for PDF styling
const COLORS = {
  primary: '#4F46E5',      // Indigo
  secondary: '#10B981',    // Emerald
  accent: '#F59E0B',       // Amber
  success: '#22C55E',      // Green
  error: '#EF4444',        // Red
  info: '#3B82F6',         // Blue
  purple: '#8B5CF6',       // Purple
  pink: '#EC4899',         // Pink
  teal: '#14B8A6',         // Teal
  background: '#FFFFFF',
  text: '#1F2937',
  textLight: '#6B7280',
  border: '#E5E7EB',
  chartColors: [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#3B82F6', '#14B8A6', '#F97316', '#06B6D4'
  ]
};

// Color scheme mapping for different slide types
const SLIDE_TYPE_COLORS = {
  'multiple_choice': {
    primary: '#4F46E5',    // Indigo
    light: '#EEF2FF',
    border: '#818CF8'
  },
  'pick_answer': {
    primary: '#6366F1',    // Indigo variant
    light: '#EEF2FF',
    border: '#818CF8'
  },
  'quiz': {
    primary: '#10B981',    // Emerald
    light: '#D1FAE5',
    border: '#34D399'
  },
  'word_cloud': {
    primary: '#F59E0B',    // Amber
    light: '#FEF3C7',
    border: '#FBBF24'
  },
  'open_ended': {
    primary: '#3B82F6',    // Blue
    light: '#DBEAFE',
    border: '#60A5FA'
  },
  'type_answer': {
    primary: '#3B82F6',    // Blue
    light: '#DBEAFE',
    border: '#60A5FA'
  },
  'scales': {
    primary: '#8B5CF6',    // Purple
    light: '#EDE9FE',
    border: '#A78BFA'
  },
  'ranking': {
    primary: '#EC4899',    // Pink
    light: '#FCE7F3',
    border: '#F472B6'
  },
  'hundred_points': {
    primary: '#14B8A6',    // Teal
    light: '#CCFBF1',
    border: '#5EEAD4'
  },
  'qna': {
    primary: '#F97316',    // Orange
    light: '#FFEDD5',
    border: '#FB923C'
  },
  'guess_number': {
    primary: '#06B6D4',    // Cyan
    light: '#CFFAFE',
    border: '#22D3EE'
  },
  '2x2_grid': {
    primary: '#6366F1',    // Indigo variant
    light: '#EEF2FF',
    border: '#818CF8'
  },
  'pin_on_image': {
    primary: '#EF4444',    // Red
    light: '#FEE2E2',
    border: '#F87171'
  },
  'leaderboard': {
    primary: '#10B981',    // Emerald
    light: '#D1FAE5',
    border: '#34D399'
  },
  'default': {
    primary: '#4F46E5',    // Indigo (default)
    light: '#EEF2FF',
    border: '#818CF8'
  }
};

/**
 * Get color scheme for a slide type
 */
const getSlideTypeColors = (slideType) => {
  return SLIDE_TYPE_COLORS[slideType] || SLIDE_TYPE_COLORS['default'];
};

/**
 * Detect slide type from element
 */
const detectSlideType = (slideElement) => {
  if (!slideElement) return 'default';
  
  // First, check for data-slide-type attribute (most reliable - added to PresentationResults)
  const dataType = slideElement.getAttribute('data-slide-type');
  if (dataType && SLIDE_TYPE_COLORS[dataType]) {
    return dataType;
  }
  
  // Check parent elements for data-slide-type (in case we're checking a child element)
  let parent = slideElement.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    const parentDataType = parent.getAttribute('data-slide-type');
    if (parentDataType && SLIDE_TYPE_COLORS[parentDataType]) {
      return parentDataType;
    }
    parent = parent.parentElement;
    depth++;
  }
  
  // Check for result component classes that indicate slide type
  const allClasses = slideElement.querySelectorAll('[class*="Result"]');
  
  // Check for specific result component classes
  for (const elem of allClasses) {
    const elemClasses = Array.from(elem.classList || []);
    for (const cls of elemClasses) {
      // Match patterns like "MCQResult", "QuizResult", etc.
      if (cls.includes('Result')) {
        let type = cls.toLowerCase()
          .replace('result', '')
          .replace('mcq', 'multiple_choice')
          .replace('pickanswer', 'pick_answer')
          .replace('typeanswer', 'type_answer')
          .replace('pinonimage', 'pin_on_image')
          .replace('google', 'google_slides')
          .replace('powerpoint', 'powerpoint')
          .replace('two', '2x2_grid')
          .replace('grid', '2x2_grid');
        
        // Handle specific mappings
        if (type === 'qna') type = 'qna';
        if (type === 'quiz') type = 'quiz';
        if (type === 'wordcloud') type = 'word_cloud';
        if (type === 'openended') type = 'open_ended';
        if (type === 'guessnumber') type = 'guess_number';
        if (type === 'hundredpoints') type = 'hundred_points';
        
        if (SLIDE_TYPE_COLORS[type]) {
          return type;
        }
      }
    }
  }
  
  // Try to infer from content structure
  const textContent = slideElement.textContent?.toLowerCase() || '';
  if (textContent.includes('quiz') || slideElement.querySelector('[class*="quiz"]')) return 'quiz';
  if (textContent.includes('word') || slideElement.querySelector('[class*="word"]')) return 'word_cloud';
  if (textContent.includes('scale') || slideElement.querySelector('[class*="scale"]')) return 'scales';
  if (textContent.includes('rank') || slideElement.querySelector('[class*="rank"]')) return 'ranking';
  if (textContent.includes('leaderboard')) return 'leaderboard';
  
  return 'default';
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * Apply colorful styling to element for PDF export
 */
const applyColorfulStyles = (element) => {
  if (!element) return null;

  // Store original styles
  const originalStyles = {
    backgroundColor: element.style.backgroundColor,
    color: element.style.color,
    className: element.className
  };

  // Create a style element with colorful CSS
  const styleId = 'pdf-export-colorful-styles';
  let styleElement = document.getElementById(styleId);
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }

  // Colorful CSS that overrides dark theme
  // Use a more direct approach with inline styles via JavaScript
  const applyStylesToElement = (el) => {
    if (!el) return;
    
    // Check if element has dark background classes
    const classList = Array.from(el.classList || []);
    const hasDarkBg = classList.some(cls => 
      cls.includes('bg-[#1') || cls.includes('bg-[#2') || 
      cls === 'bg-[#1A1A1A]' || cls === 'bg-[#1F1F1F]' || cls === 'bg-[#232323]'
    );
    
    if (hasDarkBg) {
      el.style.backgroundColor = '#FFFFFF';
    }
    
    // Check for dark text colors
    const hasDarkText = classList.some(cls => 
      cls.includes('text-[#E0E0E0]') || cls.includes('text-[#B0B0B0]')
    );
    
    if (hasDarkText) {
      el.style.color = '#1F2937';
    }
    
    // Check for dark borders
    const hasDarkBorder = classList.some(cls => 
      cls.includes('border-[#2A2A2A]') || cls.includes('border-[#2F2F2F]')
    );
    
    if (hasDarkBorder) {
      el.style.borderColor = '#E5E7EB';
    }
    
    // Apply to children
    Array.from(el.children || []).forEach(child => applyStylesToElement(child));
  };

  // Apply styles recursively
  applyStylesToElement(element);

  // Add global CSS for headers and other elements with vibrant colors
  // Override any oklch/oklab colors and gradients to use rgb/hex
  styleElement.textContent = `
    .pdf-export-mode {
      background: #FFFFFF !important;
    }
    
    /* Override all gradient backgrounds - html2canvas doesn't support oklch/oklab in gradients */
    .pdf-export-mode * {
      background-image: none !important;
    }
    
    /* Override gradient backgrounds with colorful solid colors */
    .pdf-export-mode [class*="gradient"],
    .pdf-export-mode [class*="from-"],
    .pdf-export-mode [class*="to-"],
    .pdf-export-mode [class*="via-"] {
      background: #F0F9FF !important;
      background-image: none !important;
      background-color: #F0F9FF !important;
    }
    
    /* Colorful headers - colors will be applied via JavaScript based on slide type */
    .pdf-export-mode h2 {
      padding-bottom: 12px !important;
      margin-bottom: 20px !important;
      font-weight: bold !important;
      background-image: none !important;
      padding: 12px 16px !important;
      border-radius: 8px !important;
    }
    
    .pdf-export-mode h3 {
      padding-left: 16px !important;
      margin-bottom: 16px !important;
      font-weight: 700 !important;
      background-image: none !important;
      padding: 10px 16px !important;
      border-radius: 6px !important;
      font-size: 1.25rem !important;
    }
    
    /* Apply slide-type-specific colors via data attributes */
    .pdf-export-mode h3[data-pdf-color] {
      /* Colors applied inline via JavaScript */
    }
    
    /* Colorful cards and containers */
    .pdf-export-mode [class*="rounded"],
    .pdf-export-mode [class*="bg-\\[#1"],
    .pdf-export-mode [class*="bg-\\[#2"] {
      background: #F8FAFC !important;
      background-color: #F8FAFC !important;
      border: 2px solid #E2E8F0 !important;
      border-radius: 12px !important;
      padding: 16px !important;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.1) !important;
    }
    
    /* Colorful stat boxes and metrics */
    .pdf-export-mode [class*="text-\\[#4CAF50\\]"],
    .pdf-export-mode [class*="text-green"] {
      color: #10B981 !important;
      font-weight: 700 !important;
      background: #D1FAE5 !important;
      padding: 4px 12px !important;
      border-radius: 6px !important;
    }
    
    /* Colorful numbers and scores */
    .pdf-export-mode [class*="text-\\[#E0E0E0\\]"]:has-text("\\d+"),
    .pdf-export-mode strong,
    .pdf-export-mode b {
      color: #1F2937 !important;
      font-weight: 700 !important;
    }
    
    /* Colorful chart containers */
    .pdf-export-mode canvas {
      background: #FFFFFF !important;
      border: 2px solid #E2E8F0 !important;
      border-radius: 8px !important;
      padding: 12px !important;
    }
    
    /* Colorful bars and progress indicators */
    .pdf-export-mode [class*="bg-blue"],
    .pdf-export-mode [class*="bg-green"],
    .pdf-export-mode [class*="bg-yellow"],
    .pdf-export-mode [class*="bg-purple"],
    .pdf-export-mode [class*="bg-pink"] {
      border-radius: 6px !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }
    
    /* Colorful tables */
    .pdf-export-mode table {
      border-collapse: separate !important;
      border-spacing: 0 !important;
      border: 2px solid #E2E8F0 !important;
      border-radius: 8px !important;
      overflow: hidden !important;
    }
    
    .pdf-export-mode table thead {
      background: #4F46E5 !important;
      color: #FFFFFF !important;
    }
    
    .pdf-export-mode table tbody tr:nth-child(even) {
      background: #F8FAFC !important;
    }
    
    .pdf-export-mode table tbody tr:nth-child(odd) {
      background: #FFFFFF !important;
    }
    
    .pdf-export-mode table td,
    .pdf-export-mode table th {
      padding: 12px !important;
      border: 1px solid #E2E8F0 !important;
    }
    
    /* Colorful badges and tags */
    .pdf-export-mode [class*="badge"],
    .pdf-export-mode [class*="tag"],
    .pdf-export-mode [class*="chip"] {
      background: #4F46E5 !important;
      color: #FFFFFF !important;
      padding: 6px 12px !important;
      border-radius: 20px !important;
      font-weight: 600 !important;
      font-size: 0.875rem !important;
    }
    
    /* Hide buttons and interactive elements */
    .pdf-export-mode button,
    .pdf-export-mode [role="button"],
    .pdf-export-mode [class*="sticky"] button {
      display: none !important;
      visibility: hidden !important;
    }
    
    /* Colorful text for responses */
    .pdf-export-mode p,
    .pdf-export-mode span,
    .pdf-export-mode div:not([class*="bg"]) {
      color: #1F2937 !important;
    }
    
    /* Ensure proper spacing */
    .pdf-export-mode {
      padding: 20px !important;
    }
    
    /* Colorful section dividers */
    .pdf-export-mode hr,
    .pdf-export-mode [class*="border"] {
      border-color: #4F46E5 !important;
      border-width: 2px !important;
    }
  `;
  
  // Remove unsupported color functions and enhance with colorful styling
  const enhanceColorfulStyling = (el) => {
    if (!el) return;
    
    try {
      const computedStyle = window.getComputedStyle(el);
      const classList = Array.from(el.classList || []);
      const tagName = el.tagName?.toLowerCase();
      const textContent = el.textContent || '';
      
      // Remove oklch/oklab from background-image and apply colorful backgrounds
      if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
        const bgImage = computedStyle.backgroundImage;
        if (bgImage.includes('oklch') || bgImage.includes('oklab') || bgImage.includes('gradient')) {
          el.style.backgroundImage = 'none';
          // Apply colorful background based on element type
          if (tagName === 'h2') {
            el.style.backgroundColor = '#EEF2FF';
          } else if (tagName === 'h3') {
            el.style.backgroundColor = '#F8FAFC';
          } else if (classList.some(c => c.includes('card') || c.includes('container') || c.includes('Result'))) {
            el.style.backgroundColor = '#F8FAFC';
          } else {
            el.style.backgroundColor = '#FFFFFF';
          }
        }
      }
      
      // Enhance headers with vibrant colors
      if (tagName === 'h2') {
        el.style.backgroundColor = '#EEF2FF';
        el.style.color = '#4F46E5';
        el.style.padding = '12px 16px';
        el.style.borderRadius = '8px';
        el.style.borderBottom = '4px solid #4F46E5';
        el.style.fontWeight = '700';
      }
      
      if (tagName === 'h3') {
        // Check if this h3 already has slide-specific colors applied
        const pdfColor = el.getAttribute('data-pdf-color');
        const slideType = el.getAttribute('data-slide-type');
        
        if (pdfColor && slideType) {
          // Already has slide-specific colors, don't override
          const slideColors = getSlideTypeColors(slideType);
          el.style.setProperty('background-color', slideColors.light, 'important');
          el.style.setProperty('color', slideColors.primary, 'important');
          el.style.setProperty('border-left', `5px solid ${slideColors.primary}`, 'important');
        } else {
          // Find parent slide container to get slide type
          let parent = el.parentElement;
          let slideContainer = null;
          while (parent && parent !== document.body) {
            const parentClasses = Array.from(parent.classList || []);
            const hasDataType = parent.getAttribute('data-slide-type');
            if (hasDataType || parentClasses.some(c => c.includes('w-full') && (c.includes('mb-6') || c.includes('mb-8')))) {
              slideContainer = parent;
              break;
            }
            parent = parent.parentElement;
          }
          
          if (slideContainer) {
            const detectedType = detectSlideType(slideContainer);
            const slideColors = getSlideTypeColors(detectedType);
            el.style.setProperty('background-color', slideColors.light, 'important');
            el.style.setProperty('color', slideColors.primary, 'important');
            el.style.setProperty('border-left', `5px solid ${slideColors.primary}`, 'important');
            el.setAttribute('data-pdf-color', slideColors.primary);
            el.setAttribute('data-slide-type', detectedType);
          } else {
            // Fallback to default blue
            el.style.backgroundColor = '#F8FAFC';
            el.style.color = '#4F46E5';
            el.style.borderLeft = '5px solid #4F46E5';
          }
        }
        el.style.setProperty('padding', '10px 16px', 'important');
        el.style.setProperty('border-radius', '6px', 'important');
        el.style.setProperty('font-weight', '700', 'important');
      }
      
      // Enhance stat numbers, scores, and metrics
      if (classList.some(c => c.includes('stat') || c.includes('score') || c.includes('count') || c.includes('total')) ||
          /^\d+$/.test(textContent.trim()) && textContent.trim().length < 10) {
        el.style.color = '#10B981';
        el.style.fontWeight = '700';
        el.style.fontSize = '1.25rem';
        if (!el.style.backgroundColor || el.style.backgroundColor === 'transparent') {
          el.style.backgroundColor = '#D1FAE5';
          el.style.padding = '4px 12px';
          el.style.borderRadius = '6px';
        }
      }
      
      // Enhance percentage values
      if (textContent.includes('%')) {
        el.style.color = '#3B82F6';
        el.style.fontWeight = '600';
      }
      
      // Remove oklch/oklab from color and apply slide-type colors
      if (computedStyle.color && (computedStyle.color.includes('oklch') || computedStyle.color.includes('oklab'))) {
        // Get slide type colors
        let slideType = 'default';
        let slideColors = SLIDE_TYPE_COLORS['default'];
        let parent = el.parentElement;
        while (parent && parent !== document.body) {
          const parentClasses = Array.from(parent.classList || []);
          if (parentClasses.some(c => c.includes('w-full') && (c.includes('mb-6') || c.includes('mb-8')))) {
            slideType = detectSlideType(parent);
            slideColors = getSlideTypeColors(slideType);
            break;
          }
          parent = parent.parentElement;
        }
        
        if (tagName === 'h2' || tagName === 'h3') {
          el.style.color = slideColors.primary;
        } else {
          el.style.color = '#1F2937';
        }
      }
      
      // Remove oklch/oklab from background-color and apply colorful backgrounds
      if (computedStyle.backgroundColor && (computedStyle.backgroundColor.includes('oklch') || computedStyle.backgroundColor.includes('oklab'))) {
        if (classList.some(c => c.includes('dark') || c.includes('bg-[#1') || c.includes('bg-[#2'))) {
          el.style.backgroundColor = '#F8FAFC';
          el.style.border = '2px solid #E2E8F0';
          el.style.borderRadius = '12px';
          el.style.padding = '16px';
        } else {
          el.style.backgroundColor = '#FFFFFF';
        }
      }
      
      // Apply colorful borders
      if (computedStyle.borderColor && (computedStyle.borderColor.includes('oklch') || computedStyle.borderColor.includes('oklab'))) {
        el.style.borderColor = '#E2E8F0';
        el.style.borderWidth = '2px';
        if (!el.style.borderRadius) {
          el.style.borderRadius = '8px';
        }
      }
      
      // Enhance cards and containers
      if (classList.some(c => c.includes('rounded') || c.includes('card') || c.includes('container'))) {
        if (!el.style.backgroundColor || el.style.backgroundColor === 'transparent' || el.style.backgroundColor.includes('rgb(31, 41, 55)')) {
          el.style.backgroundColor = '#F8FAFC';
        }
        el.style.border = '2px solid #E2E8F0';
        el.style.borderRadius = '12px';
        el.style.padding = '16px';
        el.style.boxShadow = '0 2px 8px rgba(79, 70, 229, 0.1)';
      }
      
    } catch (e) {
      // Ignore errors for elements that can't be styled
    }
    
    // Recursively apply to children
    Array.from(el.children || []).forEach(child => enhanceColorfulStyling(child));
  };
  
  // Enhance colorful styling before applying styles
  enhanceColorfulStyling(element);

  // Add class to element
  element.classList.add('pdf-export-mode');

  return originalStyles;
};

/**
 * Remove colorful styles and restore original
 */
const removeColorfulStyles = (element, originalStyles) => {
  if (!element) return;

  // Remove class
  element.classList.remove('pdf-export-mode');

  // Remove style element
  const styleElement = document.getElementById('pdf-export-colorful-styles');
  if (styleElement) {
    styleElement.remove();
  }

  // Restore original styles if provided
  if (originalStyles) {
    element.style.backgroundColor = originalStyles.backgroundColor;
    element.style.color = originalStyles.color;
    if (originalStyles.className) {
      element.className = originalStyles.className;
    }
  }
};

/**
 * Wait for all images and charts to load
 */
const waitForContentLoad = async (element) => {
  return new Promise((resolve) => {
    // Wait for images
    const images = element.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      resolve();
      return;
    }

    const checkComplete = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        // Additional delay for charts to render
        setTimeout(resolve, 500);
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        checkComplete();
      } else {
        img.onload = checkComplete;
        img.onerror = checkComplete;
      }
    });
  });
};

/**
 * Capture element as image with colorful styling
 */
export const captureResultsPageAsPDF = async (element, presentation, filename, slideCount = 0) => {
  if (!element) {
    throw new Error('Element not found for PDF export');
  }

  try {
    // Apply colorful styles
    const originalStyles = applyColorfulStyles(element);

    // Wait for content to load
    await waitForContentLoad(element);

    // Small delay to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find all individual slide containers FIRST and apply slide-specific colors
    // This must happen BEFORE we capture, so colors are applied correctly
    // Each slide is in a div with class "w-full mb-6" or "mb-8" and has data-slide-type attribute
    // IMPORTANT: Only capture top-level slide containers, not nested ones
    
    // First, find all potential slide containers
    const allPotentialSlides = Array.from(element.querySelectorAll('div[data-slide-type]')).filter(div => {
      const classList = Array.from(div.classList || []);
      // Check if it has mb-6 or mb-8 (slide spacing) and contains an h3 with "Slide" text
      const hasSlideSpacing = classList.some(c => c.includes('mb-6') || c.includes('mb-8'));
      const hasSlideHeader = div.querySelector('h3') && div.querySelector('h3').textContent.includes('Slide');
      return hasSlideSpacing && hasSlideHeader;
    });
    
    // Filter out nested slides - only keep top-level slide containers
    // A slide is nested if it's a descendant of another slide container
    let slidesToCapture = allPotentialSlides.filter((slide, index) => {
      // Check if this slide is nested inside any other slide
      for (let i = 0; i < allPotentialSlides.length; i++) {
        if (i !== index && allPotentialSlides[i].contains(slide)) {
          // This slide is nested inside another slide, exclude it
          return false;
        }
      }
      return true;
    });

    // If no slide containers found with data-slide-type, try finding divs that contain h3 with "Slide"
    if (slidesToCapture.length === 0) {
      const fallbackSlides = Array.from(element.querySelectorAll('div')).filter(div => {
        const h3 = div.querySelector('h3');
        const classList = Array.from(div.classList || []);
        const hasSlideSpacing = classList.some(c => c.includes('mb-6') || c.includes('mb-8'));
        return h3 && h3.textContent && /Slide\s+\d+/.test(h3.textContent) && hasSlideSpacing;
      });
      
      // Filter out nested slides from fallback
      slidesToCapture = fallbackSlides.filter((slide, index) => {
        for (let i = 0; i < fallbackSlides.length; i++) {
          if (i !== index && fallbackSlides[i].contains(slide)) {
            return false;
          }
        }
        return true;
      });
    }

    // If still no slides found, fall back to capturing the whole element
    if (slidesToCapture.length === 0) {
      slidesToCapture = [element];
    }
    
    // Debug: Log detected slides to help identify duplicates
    console.log(`Found ${slidesToCapture.length} slide containers to capture:`, 
      slidesToCapture.map((slide, idx) => ({
        index: idx,
        slideType: slide.getAttribute('data-slide-type'),
        h3Text: slide.querySelector('h3')?.textContent,
        hasImage: slide.querySelector('img') !== null
      }))
    );
    
    // Detect slide type for each slide and apply type-specific colors
    slidesToCapture.forEach((slideElement, index) => {
      // First, try to get data-slide-type directly from the element
      let slideType = slideElement.getAttribute('data-slide-type');
      
      // If not found, try detectSlideType
      if (!slideType || !SLIDE_TYPE_COLORS[slideType]) {
        slideType = detectSlideType(slideElement);
      }
      
      // Fallback to default if still not found
      if (!slideType || !SLIDE_TYPE_COLORS[slideType]) {
        slideType = 'default';
      }
      
      const slideColors = getSlideTypeColors(slideType);
      
      // Debug: Log detected slide type
      console.log(`Slide ${index + 1} detected type: ${slideType}`, {
        dataAttr: slideElement.getAttribute('data-slide-type'),
        detectedType: detectSlideType(slideElement),
        finalType: slideType,
        colors: slideColors
      });
      
      // Apply slide-type-specific styling to the slide container
      const h3 = slideElement.querySelector('h3');
      if (h3) {
        // Use setProperty with 'important' to override CSS !important rules
        h3.style.setProperty('background-color', slideColors.light, 'important');
        h3.style.setProperty('color', slideColors.primary, 'important');
        h3.style.setProperty('border-left', `5px solid ${slideColors.primary}`, 'important');
        h3.style.setProperty('font-weight', '700', 'important');
        h3.style.setProperty('padding', '10px 16px', 'important');
        h3.style.setProperty('border-radius', '6px', 'important');
        // Remove any conflicting CSS classes that might override
        h3.classList.add('pdf-slide-header');
        // Store color and type for reference
        h3.setAttribute('data-pdf-color', slideColors.primary);
        h3.setAttribute('data-slide-type', slideType);
      }
      
      // Also apply slide type to the container itself for easier detection
      slideElement.setAttribute('data-pdf-slide-type', slideType);
      slideElement.setAttribute('data-slide-type', slideType); // Ensure it's set
      
      // Apply border color to cards/containers within this slide
      const cards = slideElement.querySelectorAll('[class*="rounded"], [class*="card"], [class*="container"]');
      cards.forEach(card => {
        if (card !== h3) { // Don't override h3 styles
          const cardStyle = window.getComputedStyle(card);
          // Apply border color with !important
          card.style.setProperty('border-color', slideColors.border, 'important');
          // Apply light background if it's a dark background
          if (cardStyle.backgroundColor && (
            cardStyle.backgroundColor.includes('rgb(31, 41, 55)') || 
            cardStyle.backgroundColor.includes('rgb(26, 26, 26)') ||
            cardStyle.backgroundColor.includes('rgb(35, 35, 35)') ||
            cardStyle.backgroundColor.includes('rgb(42, 42, 42)')
          )) {
            card.style.setProperty('background-color', slideColors.light, 'important');
          }
        }
      });
      
      // Apply primary color to important elements (stats, scores, counts)
      const importantElements = slideElement.querySelectorAll('[class*="stat"], [class*="score"], [class*="count"], [class*="total"], [class*="percentage"]');
      importantElements.forEach(elem => {
        const elemStyle = window.getComputedStyle(elem);
        if (!elemStyle.color || elemStyle.color.includes('rgb(224, 224, 224)') || elemStyle.color.includes('rgb(176, 176, 176)')) {
          elem.style.setProperty('color', slideColors.primary, 'important');
          elem.style.setProperty('font-weight', '700', 'important');
        }
      });
      
      // Apply slide type color to table headers if present
      const tableHeaders = slideElement.querySelectorAll('table thead, table th');
      tableHeaders.forEach(header => {
        header.style.setProperty('background-color', slideColors.primary, 'important');
        header.style.setProperty('color', '#FFFFFF', 'important');
      });
    });
    
    // Additional delay to ensure slide-specific colors are fully applied
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture each slide separately
    const slideCanvases = [];
    for (let i = 0; i < slidesToCapture.length; i++) {
      const slideElement = slidesToCapture[i];
      
      // Wait a bit between captures to ensure rendering
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const slideCanvas = await html2canvas(slideElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: slideElement.scrollWidth,
        height: slideElement.scrollHeight,
        windowWidth: slideElement.scrollWidth,
        windowHeight: slideElement.scrollHeight,
        onclone: (clonedDoc) => {
        // Remove unsupported color functions (oklch, oklab) from cloned document - this is the key fix
        try {
          const clonedElement = clonedDoc.querySelector('.pdf-export-mode') || clonedDoc.body;
          if (clonedElement) {
            // Get all elements in the cloned document
            const allElements = clonedElement.querySelectorAll('*');
            const clonedWindow = clonedDoc.defaultView || window;
            
            allElements.forEach(elem => {
              try {
                const style = clonedWindow.getComputedStyle(elem);
                
                // Remove oklch/oklab from background-image (most common issue)
                if (style.backgroundImage && style.backgroundImage !== 'none') {
                  const bgImage = style.backgroundImage;
                  if (bgImage.includes('oklch') || bgImage.includes('oklab') || 
                      (bgImage.includes('gradient') && (bgImage.includes('oklch') || bgImage.includes('oklab')))) {
                    elem.style.backgroundImage = 'none';
                    elem.style.backgroundColor = '#FFFFFF';
                  }
                }
                
                // Remove oklch/oklab from color
                if (style.color && (style.color.includes('oklch') || style.color.includes('oklab'))) {
                  elem.style.color = '#1F2937';
                }
                
                // Remove oklch/oklab from background-color
                if (style.backgroundColor && (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab'))) {
                  elem.style.backgroundColor = '#FFFFFF';
                }
                
                // Remove oklch/oklab from border-color
                if (style.borderColor && (style.borderColor.includes('oklch') || style.borderColor.includes('oklab'))) {
                  elem.style.borderColor = '#E5E7EB';
                }
                
                // Remove oklch/oklab from outline-color
                if (style.outlineColor && (style.outlineColor.includes('oklch') || style.outlineColor.includes('oklab'))) {
                  elem.style.outlineColor = '#E5E7EB';
                }
                
                // Remove any gradient that might contain oklch/oklab
                if (style.backgroundImage && style.backgroundImage.includes('gradient')) {
                  const bgImage = style.backgroundImage;
                  if (bgImage.includes('oklch') || bgImage.includes('oklab')) {
                    elem.style.backgroundImage = 'none';
                    elem.style.backgroundColor = '#FFFFFF';
                  }
                }
                
                // Also check all CSS properties that might contain colors
                const colorProperties = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 
                                       'borderRightColor', 'borderBottomColor', 'borderLeftColor',
                                       'outlineColor', 'textDecorationColor', 'columnRuleColor'];
                
                colorProperties.forEach(prop => {
                  try {
                    const value = style[prop];
                    if (value && (value.includes('oklch') || value.includes('oklab'))) {
                      elem.style[prop] = prop === 'color' ? '#1F2937' : 
                                        (prop.includes('border') || prop.includes('outline')) ? '#E5E7EB' : '#FFFFFF';
                    }
                  } catch (e) {
                    // Ignore
                  }
                });
              } catch (e) {
                // Ignore errors for specific elements
                console.warn('Error processing element for PDF:', e);
              }
            });
          }
        } catch (e) {
          console.warn('Error in onclone callback:', e);
        }
      }
      });
      
      slideCanvases.push(slideCanvas);
    }

    // Remove colorful styles
    removeColorfulStyles(element, originalStyles);

    // Create PDF
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // Add cover page with white background and black text
    doc.setFillColor(255, 255, 255); // White background
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    const titleText = presentation?.title || 'Untitled Presentation';
    const titleLines = doc.splitTextToSize(titleText, pageWidth - 40);
    doc.text(titleLines, pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Detailed Results Report', pageWidth / 2, pageHeight / 2 + 5, { align: 'center' });
    
    doc.setFontSize(12);
    const dateStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Generated on ${dateStr}`, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
    
    // Display slide count
    const totalSlides = slideCanvases.length || slideCount || 
                       element.querySelectorAll('h3').length || 
                       (presentation?.slides?.length) || 0;
    doc.text(`${totalSlides} Slide${totalSlides !== 1 ? 's' : ''}`, pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });

    // Helper function to add footer to a page
    const addFooter = (pageNum, totalPages) => {
      const footerY = pageHeight - 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0); // Black text
      
      // Left side: inavora.com
      doc.text('inavora.com', margin, footerY);
      
      // Right side: Page number
      const pageText = `Page ${pageNum}${totalPages > 1 ? ` of ${totalPages}` : ''}`;
      const pageTextWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth - margin - pageTextWidth, footerY);
    };

    // Calculate total pages (cover + one page per slide)
    const totalPdfPages = slideCanvases.length + 1; // +1 for cover page
    addFooter(1, totalPdfPages);

    // Add each slide as a separate page
    const contentWidth = pageWidth - (margin * 2);
    const maxContentHeight = pageHeight - (margin * 2) - 15; // Reserve space for footer

    for (let i = 0; i < slideCanvases.length; i++) {
      doc.addPage();
      const currentPageNum = i + 2; // +2 because cover page is page 1
      const slideCanvas = slideCanvases[i];
      
      // Get image data
      const slideImgData = slideCanvas.toDataURL('image/png', 1.0);
      
      // Calculate dimensions to fit on page
      const slideWidth = slideCanvas.width;
      const slideHeight = slideCanvas.height;
      const slideRatio = slideWidth / slideHeight;
      
      // Calculate dimensions for PDF
      let slideWidthInMm = contentWidth;
      let slideHeightInMm = slideWidthInMm / slideRatio;
      
      // If slide is too tall, scale it down to fit
      if (slideHeightInMm > maxContentHeight) {
        slideHeightInMm = maxContentHeight;
        slideWidthInMm = slideHeightInMm * slideRatio;
        // Center horizontally if narrower than content width
        const xOffset = (contentWidth - slideWidthInMm) / 2;
        
        // Add image to PDF (centered)
        doc.addImage(
          slideImgData,
          'PNG',
          margin + xOffset,
          margin,
          slideWidthInMm,
          slideHeightInMm
        );
      } else {
        // Add image to PDF (full width)
        doc.addImage(
          slideImgData,
          'PNG',
          margin,
          margin,
          slideWidthInMm,
          slideHeightInMm
        );
      }
      
      // Add footer to each slide page
      addFooter(currentPageNum, totalPdfPages);
    }

    // Save PDF
    doc.save(`${filename || 'presentation_results'}.pdf`);

    // Restore original styles before refreshing
    removeColorfulStyles(element, originalStyles);

    // Refresh the page after PDF download is initiated
    // Use a small delay to ensure the download starts before refresh
    setTimeout(() => {
      window.location.reload();
    }, 500);

  } catch (error) {
    console.error('Error capturing page for PDF:', error);
    // Restore original styles even on error (if styles were applied)
    try {
      const styleElement = document.getElementById('pdf-export-colorful-styles');
      if (styleElement) {
        styleElement.remove();
      }
      element.classList.remove('pdf-export-mode');
    } catch (cleanupError) {
      console.warn('Error cleaning up styles:', cleanupError);
    }
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

