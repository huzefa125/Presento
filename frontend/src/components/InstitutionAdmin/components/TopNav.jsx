import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Presentation, Plus, Lock, User, ChevronDown, Settings, LogOut, MessageSquare, Mail } from 'lucide-react';
import LanguageSelector from '../../common/LanguageSelector/LanguageSelector';
import { JoinPresentationDialog } from '../../common/JoinPresentationDialog';
import { useState, useRef, useEffect } from 'react';
import { getBrandingColors } from '../utils/brandingColors';

const TopNav = ({ institution, onLogout, onOpenProfile }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef(null);
    const [logoError, setLogoError] = useState(false);
    const { primaryColor, secondaryColor } = getBrandingColors(institution);

    // Reset logo error when logo URL changes
    useEffect(() => {
        setLogoError(false);
    }, [institution?.branding?.logoUrl]);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };

        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const getInitials = (name) => {
        if (!name) return 'A';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-canvas border-b border-hairline">
                <div className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => navigate('/')}
                        >
                            {institution?.branding?.logoUrl && !logoError ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-canvas-soft border border-hairline">
                                    <img
                                        src={institution.branding.logoUrl}
                                        alt={institution?.name || 'Institution Logo'}
                                        className="w-full h-full object-contain p-1"
                                        onError={() => setLogoError(true)}
                                    />
                                </div>
                            ) : (
                                <div 
                                    className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg"
                                    style={{
                                        background: `linear-gradient(to bottom right, ${primaryColor}, ${secondaryColor})`,
                                        boxShadow: `0 10px 15px -3px ${primaryColor}40`
                                    }}
                                >
                                    <span className="text-xl font-bold text-on-primary">
                                        {institution?.name?.charAt(0)?.toUpperCase() || '𝑖'}
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-lg font-semibold text-ink">Presento</span>
                                <span className="text-xs text-ink-muted">{institution?.name || 'Institution Admin'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <LanguageSelector />
                        <button
                            onClick={() => setIsJoinDialogOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                            style={{
                                color: institution?.branding?.secondaryColor || '#14b8a6',
                            }}
                            onMouseEnter={(e) => {
                                const color = institution?.branding?.secondaryColor || '#14b8a6';
                                e.target.style.color = color;
                                e.target.style.backgroundColor = `${color}1A`;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.color = institution?.branding?.secondaryColor || '#14b8a6';
                                e.target.style.backgroundColor = 'transparent';
                            }}
                        >
                            <Presentation className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('institution_admin.join_presentation')}</span>
                        </button>
                        <button
                            onClick={() => navigate('/presentation/new', { state: { fromInstitutionAdmin: true } })}
                            className="flex items-center gap-2 px-4 py-2.5 text-on-primary text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                            style={{
                                background: institution?.branding?.primaryColor && institution?.branding?.secondaryColor
                                    ? `linear-gradient(to right, ${institution.branding.primaryColor}, ${institution.branding.secondaryColor})`
                                    : 'linear-gradient(to right, #2563eb, #14b8a6)',
                                boxShadow: institution?.branding?.secondaryColor 
                                    ? `0 10px 15px -3px ${institution.branding.secondaryColor}40`
                                    : '0 10px 15px -3px rgba(20, 184, 166, 0.25)'
                            }}
                            onMouseEnter={(e) => {
                                const shadowColor = institution?.branding?.secondaryColor || '#14b8a6';
                                e.target.style.boxShadow = `0 10px 15px -3px ${shadowColor}60`;
                            }}
                            onMouseLeave={(e) => {
                                const shadowColor = institution?.branding?.secondaryColor || '#14b8a6';
                                e.target.style.boxShadow = `0 10px 15px -3px ${shadowColor}40`;
                            }}
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('institution_admin.new_presentation')}</span>
                        </button>
                        
                        {/* Profile Dropdown */}
                        <div className="relative" ref={profileMenuRef}>
                            <button
                                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-ink-secondary hover:text-ink hover:bg-canvas-soft rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary text-sm font-semibold">
                                    {getInitials(institution?.adminName)}
                                </div>
                                <span className="hidden md:inline max-w-[120px] truncate">
                                    {institution?.adminName || 'Admin'}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'transform rotate-180' : ''}`} />
                            </button>

                            {/* Profile Dropdown Menu */}
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-2)] overflow-hidden">
                                    <div className="p-4 border-b border-hairline">
                                        <p className="text-sm font-semibold text-ink truncate">
                                            {institution?.adminName || 'Admin'}
                                        </p>
                                        <p className="text-xs text-ink-muted truncate mt-1">
                                            {institution?.adminEmail || ''}
                                        </p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                                if (onOpenProfile) onOpenProfile();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink-secondary hover:bg-canvas-soft hover:text-ink transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            {t('institution_admin.profile') || 'Profile'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                                setTimeout(() => navigate('/testimonials'), 100);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink-secondary hover:bg-canvas-soft hover:text-ink transition-colors"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                            {t('dashboard.share_feedback')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                                setTimeout(() => navigate('/contact'), 100);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-ink-secondary hover:bg-canvas-soft hover:text-ink transition-colors"
                                        >
                                            <Mail className="w-4 h-4" />
                                            {t('dashboard.contact_support')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsProfileMenuOpen(false);
                                                onLogout();
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            {t('institution_admin.logout')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>
            {isJoinDialogOpen && (
                <JoinPresentationDialog onCancel={() => setIsJoinDialogOpen(false)} />
            )}
        </>
    );
};

export default TopNav;
