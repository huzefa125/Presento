import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/config';
import * as presentationService from '../services/presentationService';
import api from '../config/api';

/**
 * Loads a presentation's results (plus a final leaderboard fetch for quiz
 * presentations that don't have one in the response) and keeps them live
 * via a dedicated Socket.IO connection. Split out of PresentationResults.jsx;
 * see CODE_STANDARDS.md.
 *
 * setResults is returned (not just results) because the component's own
 * clear-results handlers also need to update this state directly, outside
 * any of the real-time events this hook listens for.
 */
export function usePresentationResultsData({ presentationId, slides, t }) {
    const [results, setResults] = useState(null);
    const [presentation, setPresentation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const socketRef = useRef(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            if (!presentationId) return;

            setIsLoading(true);
            try {
                // Fetch both results and presentation data
                const [resultsData, presentationData] = await Promise.all([
                    presentationService.getPresentationResults(presentationId),
                    presentationService.getPresentationById(presentationId)
                ]);
                
                const results = resultsData.results || resultsData;
                
                // Debug: Log results structure to help diagnose issues
                console.log('Fetched results:', {
                    hasResults: !!results,
                    resultKeys: results ? Object.keys(results) : [],
                    resultsDataStructure: resultsData
                });
                
                // Check if there are quiz slides but no final leaderboard in results
                // If so, fetch the final leaderboard data
                const hasQuizSlides = presentationData.slides?.some(slide => slide.type === 'quiz');
                const hasFinalLeaderboardSlide = presentationData.slides?.some(slide => 
                    slide.type === 'leaderboard' && !slide.leaderboardSettings?.linkedQuizSlideId
                );
                
                if (hasQuizSlides && !hasFinalLeaderboardSlide) {
                    try {
                        // Fetch final leaderboard data
                        const leaderboardResponse = await api.get(`/presentations/${presentationId}/leaderboard?limit=10`);
                        // API response structure: { success: true, finalLeaderboard: [...], perQuizLeaderboards: [...] }
                        const finalLeaderboard = leaderboardResponse.data?.finalLeaderboard || 
                                                 leaderboardResponse.data?.data?.finalLeaderboard;
                        
                        if (finalLeaderboard && Array.isArray(finalLeaderboard)) {
                            // Add final leaderboard to results with a special key
                            results['virtual-final-leaderboard'] = {
                                type: 'leaderboard',
                                leaderboard: finalLeaderboard,
                                totalResponses: finalLeaderboard.length
                            };
                            console.log('Final leaderboard fetched:', finalLeaderboard.length, 'participants');
                        } else {
                            console.warn('Final leaderboard data not found in response:', leaderboardResponse.data);
                        }
                    } catch (err) {
                        console.error('Failed to fetch final leaderboard:', err);
                        // Continue without final leaderboard
                    }
                }
                
                setResults(results);
                setPresentation(presentationData.presentation);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError(t('presentation_results.failed_to_load'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [presentationId, t]);

    // Setup WebSocket connection for real-time updates
    useEffect(() => {
        if (!presentationId) return;

        // Initialize socket connection
        const socket = io(getSocketUrl());
        socketRef.current = socket;

        // Join presentation room to receive updates
        const joinRoom = () => {
            socket.emit('join-presentation-results', { presentationId });
        };

        // Join immediately if already connected, otherwise wait for connect event
        if (socket.connected) {
            joinRoom();
        } else {
            socket.on('connect', joinRoom);
        }

        // Handle response updates - replace with complete data from backend
        const handleResponseUpdated = (data) => {
            if (!data || !data.slideId) return;

            setResults(prevResults => {
                const slideId = data.slideId.toString();
                const updatedResults = { ...prevResults };
                
                // Get slide type from slides array or existing result
                const slide = slides?.find(s => {
                    const id = s.id || s._id;
                    return id && id.toString() === slideId;
                });
                const slideType = slide?.type || updatedResults[slideId]?.type || 'unknown';

                // Replace with complete data from backend (backend sends complete state, not diff)
                updatedResults[slideId] = {
                    slideId: slideId,
                    type: slideType,
                    // Include all data from backend - this is the complete updated state
                    ...data,
                    // Ensure totalResponses is set
                    totalResponses: data.totalResponses !== undefined ? data.totalResponses : (updatedResults[slideId]?.totalResponses || 0)
                };

                return updatedResults;
            });
        };

        // Handle slide changes (refresh all results)
        const handleSlideChanged = async () => {
            // Refetch all results when slide changes
            try {
                const resultsData = await presentationService.getPresentationResults(presentationId);
                const newResults = resultsData.results || resultsData;
                
                // Re-fetch final leaderboard if needed
                const hasQuizSlides = slides?.some(slide => slide.type === 'quiz');
                const hasFinalLeaderboardSlide = slides?.some(slide => 
                    slide.type === 'leaderboard' && !slide.leaderboardSettings?.linkedQuizSlideId
                );
                
                if (hasQuizSlides && !hasFinalLeaderboardSlide) {
                    try {
                        const leaderboardResponse = await api.get(`/presentations/${presentationId}/leaderboard?limit=10`);
                        const finalLeaderboard = leaderboardResponse.data?.finalLeaderboard || 
                                                 leaderboardResponse.data?.data?.finalLeaderboard;
                        
                        if (finalLeaderboard && Array.isArray(finalLeaderboard)) {
                            newResults['virtual-final-leaderboard'] = {
                                type: 'leaderboard',
                                leaderboard: finalLeaderboard,
                                totalResponses: finalLeaderboard.length
                            };
                        }
                    } catch (err) {
                        console.error('Failed to refresh final leaderboard:', err);
                    }
                }
                
                setResults(newResults);
            } catch (err) {
                console.error('Failed to refresh results:', err);
            }
        };

        // Handle slide results cleared (refresh all results)
        const handleSlideResultsCleared = async () => {
            // Refetch all results when a slide's results are cleared
            try {
                const resultsData = await presentationService.getPresentationResults(presentationId);
                const newResults = resultsData.results || resultsData;
                
                // Re-fetch final leaderboard if needed
                const hasQuizSlides = slides?.some(slide => slide.type === 'quiz');
                const hasFinalLeaderboardSlide = slides?.some(slide => 
                    slide.type === 'leaderboard' && !slide.leaderboardSettings?.linkedQuizSlideId
                );
                
                if (hasQuizSlides && !hasFinalLeaderboardSlide) {
                    try {
                        const leaderboardResponse = await api.get(`/presentations/${presentationId}/leaderboard?limit=10`);
                        const finalLeaderboard = leaderboardResponse.data?.finalLeaderboard || 
                                                 leaderboardResponse.data?.data?.finalLeaderboard;
                        
                        if (finalLeaderboard && Array.isArray(finalLeaderboard)) {
                            newResults['virtual-final-leaderboard'] = {
                                type: 'leaderboard',
                                leaderboard: finalLeaderboard,
                                totalResponses: finalLeaderboard.length
                            };
                        }
                    } catch (err) {
                        console.error('Failed to refresh final leaderboard after clear:', err);
                    }
                }
                
                setResults(newResults);
            } catch (err) {
                console.error('Failed to refresh results after clearing:', err);
            }
        };

        // Handle leaderboard updates in real-time
        const handleLeaderboardUpdated = async (data) => {
            if (!data || !data.presentationId || presentationId !== data.presentationId) return;
            
            try {
                // Refresh final leaderboard if it exists
                const hasQuizSlides = slides?.some(slide => slide.type === 'quiz');
                const hasFinalLeaderboardSlide = slides?.some(slide => 
                    slide.type === 'leaderboard' && !slide.leaderboardSettings?.linkedQuizSlideId
                );
                
                if (hasQuizSlides && !hasFinalLeaderboardSlide && data.leaderboard) {
                    setResults(prevResults => {
                        const updatedResults = { ...prevResults };
                        updatedResults['virtual-final-leaderboard'] = {
                            type: 'leaderboard',
                            leaderboard: data.leaderboard,
                            totalResponses: data.leaderboard.length
                        };
                        return updatedResults;
                    });
                }
                
                // Also update any leaderboard slides that might be showing
                if (data.leaderboard) {
                    // Find all leaderboard slides and update their data
                    slides?.forEach(slide => {
                        if (slide.type === 'leaderboard') {
                            const slideId = (slide.id || slide._id)?.toString();
                            if (slideId) {
                                setResults(prevResults => {
                                    const updatedResults = { ...prevResults };
                                    // For linked leaderboards, we might need to fetch specific data
                                    // For now, update final leaderboard
                                    if (!slide.leaderboardSettings?.linkedQuizSlideId) {
                                        updatedResults[slideId] = {
                                            ...updatedResults[slideId],
                                            leaderboard: data.leaderboard,
                                            totalResponses: data.leaderboard.length
                                        };
                                    }
                                    return updatedResults;
                                });
                            }
                        }
                    });
                }
            } catch (err) {
                console.error('Failed to update leaderboard:', err);
            }
        };

        // Listen for events
        socket.on('response-updated', handleResponseUpdated);
        socket.on('slide-changed', handleSlideChanged);
        socket.on('slide-results-cleared', handleSlideResultsCleared);
        socket.on('leaderboard-updated', handleLeaderboardUpdated);
        socket.on('connect', () => {
            console.log('Connected to presentation results socket');
        });
        socket.on('disconnect', () => {
            console.log('Disconnected from presentation results socket');
        });
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        // Cleanup on unmount
        return () => {
            socket.off('response-updated', handleResponseUpdated);
            socket.off('slide-changed', handleSlideChanged);
            socket.off('slide-results-cleared', handleSlideResultsCleared);
            socket.off('leaderboard-updated', handleLeaderboardUpdated);
            socket.off('connect');
            socket.off('disconnect');
            socket.off('error');
            socket.disconnect();
        };
    }, [presentationId, slides]);

    return { results, setResults, presentation, isLoading, error };
}
