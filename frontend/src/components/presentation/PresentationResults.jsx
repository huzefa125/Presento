import { useState, useRef, useMemo } from 'react';
import { LoaderCircle, Download, Trash2, ChevronDown } from 'lucide-react';
import * as presentationService from '../../services/presentationService';
import { formatSlideDataForExport } from '../../utils/exportUtils';
import { captureResultsPageAsPDF } from '../../utils/pdfExportFromPage';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getEffectivePlan, getEffectiveStatus } from '../../utils/subscriptionUtils';
import ConfirmDialog from '../common/ConfirmDialog';
import SlideResultRenderer from './SlideResultRenderer';
import { usePresentationResultsData } from '../../hooks/usePresentationResultsData';

const PresentationResults = ({ slides, presentationId }) => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const { results, setResults, presentation, isLoading, error } = usePresentationResultsData({ presentationId, slides, t });
    const [isExporting, setIsExporting] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [clearDialogType, setClearDialogType] = useState(null); // 'all' or 'slide'
    const [slideToClear, setSlideToClear] = useState(null); // Store slideId when clearing a specific slide
    const [showClearDropdown, setShowClearDropdown] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [showIndividualClearButtons, setShowIndividualClearButtons] = useState(false); // Show clear buttons on each slide
    const resultsRef = useRef(null);
    const exportButtonRef = useRef(null);
    const clearButtonRef = useRef(null);
    // Check if user has access to export (CSV/Excel only)
    const canExport = (() => {
        // Check if user is an institution admin (has institutionAdminToken)
        const hasInstitutionAdminToken = sessionStorage.getItem('institutionAdminToken') !== null;
        
        if (hasInstitutionAdminToken) {
            return true;
        }
        
        if (!currentUser) {
            return false;
        }
        
        const plan = getEffectivePlan(currentUser?.subscription);
        const isInstitutionUser = currentUser?.isInstitutionUser === true;
        const hasInstitutionId = currentUser?.institutionId && currentUser?.institutionId !== null;
        const hasInstitutionPlan = currentUser?.subscription?.institutionPlan?.institutionId || 
                                   currentUser?.subscription?.institutionPlan?.inheritedFrom === 'institution';
        
        // Show export for:
        // 1. Lifetime plan users
        // 2. Institution plan users (plan === 'institution')
        // 3. Pro plan users with active subscription
        // 4. Users linked to institutions (isInstitutionUser, hasInstitutionId, or hasInstitutionPlan)
        const status = getEffectiveStatus(currentUser?.subscription);
        return plan === 'lifetime' || 
               plan === 'institution' ||
               (plan === 'pro' && status === 'active') ||
               isInstitutionUser ||
               hasInstitutionId ||
               hasInstitutionPlan;
    })();

    const handleExportData = async (format) => {
        if (!presentationId || !slides || slides.length === 0) {
            toast.error(t('presentation_results.no_presentation_available'));
            return;
        }
        
        setIsExporting(true);
        try {
            // Fetch all slide responses
            const allSlideData = [];
            
            for (const slide of slides) {
                try {
                    const slideId = slide.id || slide._id;
                    if (!slideId) continue;
                    
                    // Skip slides with temporary IDs (not saved to database yet)
                    if (slideId.startsWith('temp-') || !/^[0-9a-fA-F]{24}$/.test(slideId)) {
                        console.warn(`Skipping slide with temporary ID: ${slideId}`);
                        continue;
                    }
                    
                    const response = await presentationService.getSlideResponses(presentationId, slideId);
                    
                    if (response && response.success && response.slide && response.responses) {
                        const formattedData = formatSlideDataForExport(
                            response.slide,
                            response.responses,
                            response.aggregatedData
                        );
                        allSlideData.push({
                            slide,
                            formattedData,
                            slideIndex: slides.indexOf(slide)
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching data for slide ${slide.id || slide._id}:`, err);
                    // Continue with other slides even if one fails
                }
            }
            
            if (allSlideData.length === 0) {
                toast.error(t('presentation_results.no_data_to_export'));
                setIsExporting(false);
                return;
            }
            
            // Generate filename
            const sanitizedTitle = (presentation?.title || t('presentation_results.default_title')).replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `${sanitizedTitle}_results_${dateStr}`;
            
            if (format === 'csv') {
                // Export all slides to a single CSV file
                exportAllSlidesToCSV(allSlideData, filename);
            } else if (format === 'excel') {
                // Export all slides to a multi-sheet Excel file
                exportAllSlidesToExcel(allSlideData, filename);
            } else if (format === 'pdf') {
                // Export results page as PDF with colorful styling
                // Find the main results container
                const mainContainer = document.querySelector('.max-w-5xl');
                if (!mainContainer) {
                    toast.error(t('presentation_results.export_pdf_failed'));
                    setIsExporting(false);
                    return;
                }
                
                // Pass slide count for cover page
                await captureResultsPageAsPDF(mainContainer, presentation, filename, slides?.length || allSlideData.length);
                toast.success(t('presentation_results.exported_pdf_success', { count: allSlideData.length }));
            } else {
                toast.success(t('presentation_results.exported_success', { count: allSlideData.length, format: format.toUpperCase() }));
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('presentation_results.export_failed'));
        } finally {
            setIsExporting(false);
        }
    };
    
    // Export all slides to CSV
    const exportAllSlidesToCSV = (allSlideData, filename) => {
        let csvContent = `"${presentation?.title || t('presentation_results.default_title')}"\n`;
        csvContent += `"${t('presentation_results.exported')}: ${new Date().toLocaleString()}"\n`;
        csvContent += `"${t('presentation_results.total_slides')}: ${allSlideData.length}"\n\n`;
        
        allSlideData.forEach(({ formattedData, slideIndex }) => {
            const { question, summary, detailed, metadata } = formattedData;
            
            csvContent += `"${'='.repeat(80)}"\n`;
            csvContent += `"${t('presentation_results.slide_number', { number: slideIndex + 1 })}: ${question}"\n`;
            csvContent += `"${t('presentation_results.type')}: ${formattedData.slideType}"\n`;
            csvContent += `"${t('presentation_results.total_responses')}: ${metadata.totalResponses}"\n`;
            csvContent += `"${'='.repeat(80)}"\n\n`;
            
            // Summary section
            if (summary.length > 0) {
                csvContent += `"${t('presentation_results.summary').toUpperCase()}"\n`;
                const summaryHeaders = Object.keys(summary[0]);
                csvContent += summaryHeaders.map(h => `"${h}"`).join(',') + '\n';
                summary.forEach(row => {
                    csvContent += summaryHeaders.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
                });
                csvContent += '\n';
            }
            
            // Detailed section
            if (detailed.length > 0) {
                csvContent += `"${t('presentation_results.detailed_responses').toUpperCase()}"\n`;
                const detailedHeaders = Object.keys(detailed[0]);
                csvContent += detailedHeaders.map(h => `"${h}"`).join(',') + '\n';
                detailed.forEach(row => {
                    csvContent += detailedHeaders.map(h => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
                });
            }
            
            csvContent += '\n\n';
        });
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    // Export all slides to Excel
    const exportAllSlidesToExcel = (allSlideData, filename) => {
        const wb = XLSX.utils.book_new();
        
        // Overview sheet
        const overviewData = [
            [t('presentation_results.presentation_title'), presentation?.title || t('presentation_results.untitled_presentation')],
            [t('presentation_results.exported'), new Date().toLocaleString()],
            [t('presentation_results.total_slides'), allSlideData.length],
            [''],
            [t('presentation_results.slide'), t('presentation_results.question'), t('presentation_results.type'), t('presentation_results.total_responses')]
        ];
        
        allSlideData.forEach(({ formattedData, slideIndex }) => {
            overviewData.push([
                slideIndex + 1,
                formattedData.question || 'N/A',
                formattedData.slideType || 'unknown',
                formattedData.metadata?.totalResponses || 0
            ]);
        });
        
        const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');
        
        // Create a sheet for each slide
        allSlideData.forEach(({ formattedData, slideIndex }) => {
            const { question, summary, detailed, metadata } = formattedData;
            const sheetName = `Slide ${slideIndex + 1}`.substring(0, 31); // Excel sheet name limit
            
            // Metadata
            const metadataData = [
                [t('presentation_results.question'), question],
                [t('presentation_results.type'), formattedData.slideType],
                [t('presentation_results.total_responses'), metadata.totalResponses],
                ['']
            ];
            
            // Summary
            if (summary.length > 0) {
                metadataData.push([t('presentation_results.summary').toUpperCase()]);
                const summaryHeaders = Object.keys(summary[0]);
                metadataData.push(summaryHeaders);
                summary.forEach(row => {
                    metadataData.push(summaryHeaders.map(h => row[h] || ''));
                });
                metadataData.push(['']);
            }
            
            // Detailed
            if (detailed.length > 0) {
                metadataData.push([t('presentation_results.detailed_responses').toUpperCase()]);
                const detailedHeaders = Object.keys(detailed[0]);
                metadataData.push(detailedHeaders);
                detailed.forEach(row => {
                    metadataData.push(detailedHeaders.map(h => row[h] || ''));
                });
            }
            
            const ws = XLSX.utils.aoa_to_sheet(metadataData);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };


    const handleClearResults = async () => {
        if (!presentationId) return;
        
        setIsClearing(true);
        try {
            if (clearDialogType === 'all') {
                // Clear all results
                await presentationService.clearPresentationResults(presentationId);
                toast.success(t('presentation_results.results_cleared_success'));
                
                // Clear local results state
                setResults({});
            } else if (clearDialogType === 'slide') {
                // Clear specific slide results
                let slideId = slideToClear;
                
                // If no slideToClear was set, fall back to current slide from presentation
                if (!slideId) {
                    const currentSlideIndex = presentation?.currentSlideIndex ?? 0;
                    const currentSlide = slides[currentSlideIndex];
                    
                    if (!currentSlide) {
                        toast.error(t('presentation_results.no_current_slide'));
                        setIsClearing(false);
                        setShowClearDialog(false);
                        setSlideToClear(null);
                        return;
                    }
                    
                    slideId = currentSlide.id || currentSlide._id;
                    if (!slideId) {
                        toast.error(t('presentation_results.invalid_slide'));
                        setIsClearing(false);
                        setShowClearDialog(false);
                        setSlideToClear(null);
                        return;
                    }
                }
                
                await presentationService.clearSlideResults(presentationId, slideId);
                toast.success(t('presentation_results.slide_results_cleared_success'));
                
                // Update local results state for this slide
                setResults(prevResults => {
                    if (!prevResults) return prevResults;
                    const updatedResults = { ...prevResults };
                    const slideIdStr = slideId.toString();
                    delete updatedResults[slideIdStr];
                    return updatedResults;
                });
            }
            
            // Refetch results to show updated state
            try {
                const resultsData = await presentationService.getPresentationResults(presentationId);
                setResults(resultsData.results || resultsData);
            } catch (err) {
                console.error('Failed to refresh results after clearing:', err);
            }
        } catch (error) {
            console.error('Clear results error:', error);
            toast.error(t('presentation_results.clear_results_failed'));
        } finally {
            setIsClearing(false);
            setShowClearDialog(false);
            setClearDialogType(null);
            setSlideToClear(null);
            setShowIndividualClearButtons(false); // Hide buttons after successful clear
        }
    };

    const handleClearAllClick = () => {
        setClearDialogType('all');
        setShowClearDialog(true);
        setShowClearDropdown(false);
    };

    const handleClearSlideClick = () => {
        // Enable showing individual clear buttons on each slide
        setShowIndividualClearButtons(true);
        setShowClearDropdown(false);
    };

    const handleClearSpecificSlide = (slideId) => {
        setClearDialogType('slide');
        setSlideToClear(slideId);
        setShowClearDialog(true);
    };


    // Reorder slides so leaderboards appear right after their linked quiz slides
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
                    // Get all possible string representations of the linked quiz ID
                    const linkedQuizIdStr = String(linkedQuizId);
                    const linkedQuizIdStr2 = (linkedQuizId && typeof linkedQuizId === 'object' && linkedQuizId.toString) 
                        ? linkedQuizId.toString() 
                        : linkedQuizIdStr;
                    
                    // Try to find the quiz that matches this linked ID
                    let matchingQuiz = null;
                    
                    // First try direct lookup in the ID map
                    matchingQuiz = quizIdToSlide.get(linkedQuizIdStr) || quizIdToSlide.get(linkedQuizIdStr2);
                    
                    // If not found, try comparing with all quiz IDs using the Set
                    if (!matchingQuiz) {
                        for (const [quizSlide, quizIds] of quizSlideMap.entries()) {
                            if (quizIds.has(linkedQuizIdStr) || quizIds.has(linkedQuizIdStr2)) {
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
                        // This shouldn't happen, but if it does, add to unlinked
                        console.warn('Leaderboard has linkedQuizSlideId that does not match any quiz:', {
                            leaderboardId: slide.id || slide._id,
                            linkedQuizId: linkedQuizId,
                            linkedQuizIdStr: linkedQuizIdStr,
                            availableQuizIds: Array.from(quizIdToSlide.keys()).slice(0, 5) // First 5 for debugging
                        });
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
            const leaderboardId = (leaderboard.id || leaderboard._id)?.toString();
            if (!processedLeaderboards.has(leaderboardId)) {
                orderedSlidesArray.push(leaderboard);
                processedLeaderboards.add(leaderboardId);
            }
        });
        
        // Check if there are quiz slides but no final leaderboard
        // If so, add a virtual final leaderboard slide at the end
        const hasQuizSlides = sortedSlides.some(slide => slide.type === 'quiz');
        const hasFinalLeaderboard = unlinkedLeaderboards.length > 0;
        
        if (hasQuizSlides && !hasFinalLeaderboard) {
            // Create a virtual final leaderboard slide
            const virtualFinalLeaderboard = {
                id: 'virtual-final-leaderboard',
                _id: 'virtual-final-leaderboard',
                type: 'leaderboard',
                question: 'Final Leaderboard',
                order: sortedSlides.length > 0 ? Math.max(...sortedSlides.map(s => s.order || 0)) + 1 : 0,
                leaderboardSettings: {
                    linkedQuizSlideId: null,
                    isAutoGenerated: false,
                    displayCount: 10,
                    isFinalLeaderboard: true
                }
            };
            orderedSlidesArray.push(virtualFinalLeaderboard);
        }
        
        return orderedSlidesArray;
    }, [slides]);

    if (isLoading) {
        return (
            <div className="flex-1 bg-canvas-soft p-4 sm:p-6 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto h-full flex items-center justify-center">
                    <LoaderCircle className="animate-spin text-primary" size={40} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 bg-canvas-soft p-4 sm:p-6 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto h-full flex items-center justify-center">
                    <div className="text-center p-4 text-red-600 text-sm sm:text-base">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!slides || slides.length === 0) {
        return (
            <div className="flex-1 bg-canvas-soft p-4 sm:p-6 md:p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto h-full flex items-center justify-center">
                    <div className="text-center p-4 text-ink-muted text-sm sm:text-base">
                        {t('presentation_results.no_slides')}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-canvas-soft overflow-y-auto">
            <div className="max-w-5xl mx-auto">
                {/* Sticky Header */}
                <div className="sticky top-0 z-30 bg-canvas-soft border-b border-hairline p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 overflow-visible">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ink mb-1 sm:mb-2">{t('presentation_results.title')}</h2>
                            <p className="text-sm sm:text-base text-ink-muted">{t('presentation_results.subtitle')}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 relative z-50">
                            {canExport && (
                                <div className="relative z-50">
                                    <button
                                        ref={exportButtonRef}
                                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                                        disabled={isExporting}
                                        className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 bg-primary hover:bg-primary-active text-on-primary rounded-full transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base touch-manipulation active:scale-95"
                                    >
                                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        {isExporting ? t('presentation_results.exporting') : t('presentation_results.export')}
                                        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </button>
                                    {showExportDropdown && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowExportDropdown(false)}
                                            />
                                            <div className="absolute left-0 top-full mt-1 w-48 sm:w-56 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-2)] z-[60] min-w-max">
                                                <button
                                                    onClick={() => {
                                                        handleExportData('csv');
                                                        setShowExportDropdown(false);
                                                    }}
                                                    disabled={isExporting}
                                                    className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-canvas-soft text-xs sm:text-sm text-ink disabled:opacity-50 flex items-center gap-2 touch-manipulation active:bg-canvas-soft"
                                                >
                                                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                    <span className="whitespace-nowrap">{t('presentation_results.export_csv')}</span>
                                                </button>
                                                <div className="h-px bg-hairline"></div>
                                                <button
                                                    onClick={() => {
                                                        handleExportData('excel');
                                                        setShowExportDropdown(false);
                                                    }}
                                                    disabled={isExporting}
                                                    className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-canvas-soft text-xs sm:text-sm text-ink disabled:opacity-50 flex items-center gap-2 touch-manipulation active:bg-canvas-soft"
                                                >
                                                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                    <span className="whitespace-nowrap">{t('presentation_results.export_excel')}</span>
                                                </button>
                                                <div className="h-px bg-hairline"></div>
                                                <button
                                                    onClick={() => {
                                                        handleExportData('pdf');
                                                        setShowExportDropdown(false);
                                                    }}
                                                    disabled={isExporting}
                                                    className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-canvas-soft text-xs sm:text-sm text-ink disabled:opacity-50 flex items-center gap-2 touch-manipulation active:bg-canvas-soft"
                                                >
                                                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                    <span className="whitespace-nowrap">{t('presentation_results.export_pdf')}</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className="relative z-50">
                                <button
                                    ref={clearButtonRef}
                                    onClick={() => setShowClearDropdown(!showClearDropdown)}
                                    disabled={isClearing || isExporting}
                                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-surface hover:bg-canvas-soft text-ink border border-hairline rounded-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base touch-manipulation"
                                >
                                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    {t('presentation_results.clear_results')}
                                    <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                {showClearDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowClearDropdown(false)}
                                        />
                                        <div className="absolute right-0 top-full mt-1 w-48 sm:w-56 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-2)] z-[60] min-w-max">
                                            <button
                                                onClick={handleClearAllClick}
                                                disabled={isClearing || isExporting}
                                                className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-canvas-soft text-xs sm:text-sm text-ink disabled:opacity-50 flex items-center gap-2 touch-manipulation active:bg-canvas-soft"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                <span className="whitespace-nowrap">{t('presentation_results.clear_all_results')}</span>
                                            </button>
                                            <div className="h-px bg-hairline"></div>
                                            <button
                                                onClick={handleClearSlideClick}
                                                disabled={isClearing || isExporting}
                                                className="w-full text-left px-3 sm:px-4 py-2.5 hover:bg-canvas-soft text-xs sm:text-sm text-ink disabled:opacity-50 flex items-center gap-2 touch-manipulation active:bg-canvas-soft"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                <span className="whitespace-nowrap">{t('presentation_results.clear_current_slide')}</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Content */}
                <div className="px-4 sm:px-6 md:px-8 pb-12 sm:pb-16 md:pb-20 space-y-4 sm:space-y-6 md:space-y-8">
                    <div ref={resultsRef}>
                    {orderedSlides.map((slide, index) => {
                        const slideId = slide.id || slide._id;
                        const slideTitle = typeof slide.question === 'string' 
                            ? slide.question 
                            : (slide.question?.text || slide.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
                        
                        return (
                            <div key={slideId || index} className="w-full mb-6 sm:mb-8" data-slide-type={slide.type}>
                                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                                    <h3 className="text-xl font-semibold text-ink">
                                        {t('presentation_results.slide_number', { number: index + 1 })}: {slideTitle}
                                    </h3>
                                    {slideId && showIndividualClearButtons && slide.type !== 'leaderboard' && (
                                        <button
                                            onClick={() => handleClearSpecificSlide(slideId)}
                                            disabled={isClearing}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-surface hover:bg-canvas-soft text-red-600 rounded-md transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap border border-hairline"
                                            title={t('presentation_results.clear_slide_results_tooltip')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            {t('presentation_results.clear_slide')}
                                        </button>
                                    )}
                                </div>
                                <SlideResultRenderer slide={slide} results={results} presentation={presentation} />
                            </div>
                        );
                    })}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={showClearDialog}
                title={clearDialogType === 'all' 
                    ? t('presentation_results.clear_all_results_title')
                    : t('presentation_results.clear_slide_results_title')}
                description={clearDialogType === 'all'
                    ? t('presentation_results.clear_all_results_description')
                    : (slideToClear 
                        ? t('presentation_results.clear_slide_results_description')
                        : t('presentation_results.clear_slide_results_description'))}
                confirmLabel={t('presentation_results.clear_results_confirm')}
                cancelLabel={t('presentation_results.clear_results_cancel')}
                onConfirm={handleClearResults}
                onCancel={() => {
                    setShowClearDialog(false);
                    setClearDialogType(null);
                    setSlideToClear(null);
                    setShowIndividualClearButtons(false); // Hide buttons after cancel
                }}
                isLoading={isClearing}
            />
        </div>
    );
};

export default PresentationResults;