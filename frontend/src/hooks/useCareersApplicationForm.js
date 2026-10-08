import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { translateError } from '../utils/errorTranslator';
import api from '../config/api';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/config';

/**
 * Open-positions loading (with live Socket.IO updates when postings
 * change) plus all state and handlers for the job-application modal/form.
 * Split out of Careers.jsx; see CODE_STANDARDS.md. `whyJoinUs`/`benefits`
 * (static, translation-driven content arrays that embed JSX icons) and the
 * render tree were left in the component.
 */
export function useCareersApplicationForm(t) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resumeFile, setResumeFile] = useState(null);
    const [resumePreview, setResumePreview] = useState(null);
    const [openPositions, setOpenPositions] = useState([]);
    const [loadingPositions, setLoadingPositions] = useState(true);
    const [expandedJobs, setExpandedJobs] = useState({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        linkedinUrl: '',
        portfolioUrl: '',
        githubUrl: '',
        position: '',
        department: '',
        expectedSalary: '',
        availability: '1 month',
        experience: [],
        education: [],
        skills: {
            technical: [],
            soft: []
        },
        coverLetter: '',
        whyInavora: '',
        additionalInfo: ''
    });

    // Fetch job postings from backend
    useEffect(() => {
        const fetchJobPostings = async () => {
            try {
                setLoadingPositions(true);
                const response = await api.get('/job-postings/active');
                if (response.data.success) {
                    setOpenPositions(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching job postings:', error);
                // Fallback to empty array if API fails
                setOpenPositions([]);
            } finally {
                setLoadingPositions(false);
            }
        };

        fetchJobPostings();

        // Set up Socket.IO for real-time updates
        const socket = io(getSocketUrl());
        
        socket.on('job-posting-created', () => {
            fetchJobPostings();
        });

        socket.on('job-posting-updated', () => {
            fetchJobPostings();
        });

        socket.on('job-posting-deleted', () => {
            fetchJobPostings();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    const toggleJobExpansion = (jobId) => {
        setExpandedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    const handleOpenModal = (positionTitle, department) => {
        setSelectedPosition(positionTitle);
        setFormData(prev => ({ ...prev, position: positionTitle, department: department }));
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPosition('');
        setResumeFile(null);
        setResumePreview(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            location: '',
            linkedinUrl: '',
            portfolioUrl: '',
            githubUrl: '',
            position: '',
            department: '',
            expectedSalary: '',
            availability: '1 month',
            experience: [],
            education: [],
            skills: {
                technical: [],
                soft: []
            },
            coverLetter: '',
            whyInavora: '',
            additionalInfo: ''
        });
    };

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('toasts.careers.resume_size_error'));
                return;
            }
            if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
                toast.error(t('toasts.careers.resume_format_error'));
                return;
            }
            setResumeFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setResumePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!resumeFile) {
            toast.error(t('toasts.careers.resume_required'));
            return;
        }

        setIsSubmitting(true);

        try {
            const applicationData = {
                ...formData,
                resume: {
                    base64: resumePreview,
                    fileName: resumeFile.name,
                    fileSize: resumeFile.size
                }
            };

            const response = await api.post('/careers/apply', applicationData);

            if (response.data.success) {
                toast.success(response.data.message || t('careers.application_submitted'));
                handleCloseModal();
            }
        } catch (error) {
            console.error('Application submission error:', error);
            toast.error(translateError(error, t, 'careers.application_submit_error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        isModalOpen,
        selectedPosition,
        isSubmitting,
        resumeFile,
        openPositions,
        loadingPositions,
        expandedJobs,
        formData,
        setFormData,
        toggleJobExpansion,
        handleOpenModal,
        handleCloseModal,
        handleResumeChange,
        handleSubmit,
    };
}
