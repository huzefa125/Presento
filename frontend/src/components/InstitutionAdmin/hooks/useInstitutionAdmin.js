import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../../config/api';
import { getSocketUrl } from '../../../utils/config';
import { translateError } from '../../../utils/errorTranslator';

export const useInstitutionAdmin = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [institution, setInstitution] = useState(null);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [adminUserId, setAdminUserId] = useState(null);

    // Check authentication on mount
    useEffect(() => {
        const token = sessionStorage.getItem('institutionAdminToken');
        if (token) {
            verifyToken();
        } else {
            navigate('/login', { state: { from: '/institution-admin' } });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Socket.IO connection for real-time updates
    useEffect(() => {
        if (!isAuthenticated) return;

        const socket = io(getSocketUrl());
        
        socket.on('presentation-started', () => {
            fetchStats();
        });

        socket.on('presentation-ended', () => {
            fetchStats();
        });

        return () => {
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const verifyToken = async () => {
        try {
            const response = await api.get('/institution-admin/verify');
            if (response.data.success) {
                setIsAuthenticated(true);
                setInstitution(response.data.institution);
                fetchStats();
                fetchAdminUserAccount();
            } else {
                sessionStorage.removeItem('institutionAdminToken');
                setIsAuthenticated(false);
                navigate('/login', { state: { from: '/institution-admin' } });
            }
        } catch (error) {
            console.error('Token verification error:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                sessionStorage.removeItem('institutionAdminToken');
                setIsAuthenticated(false);
                navigate('/login', { state: { from: '/institution-admin' } });
            }
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/institution-admin/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchAdminUserAccount = async () => {
        try {
            const response = await api.get('/institution-admin/my-account');
            if (response.data.success) {
                if (response.data.data.hasUserAccount && response.data.data.userId) {
                    setAdminUserId(response.data.data.userId);
                } else {
                    setAdminUserId(null);
                }
            }
        } catch (error) {
            console.error('Error fetching admin user account:', error);
            setAdminUserId(null);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('institutionAdminToken');
        setIsAuthenticated(false);
        toast.success(t('institution_admin.logout_success'));
        navigate('/login');
    };

    const refreshInstitution = async () => {
        try {
            const response = await api.get('/institution-admin/verify');
            if (response.data.success) {
                setInstitution(response.data.institution);
            }
        } catch (error) {
            console.error('Error refreshing institution:', error);
        }
    };

    return {
        isAuthenticated,
        institution,
        stats,
        loading,
        adminUserId,
        setLoading,
        fetchStats,
        handleLogout,
        refreshInstitution
    };
};

