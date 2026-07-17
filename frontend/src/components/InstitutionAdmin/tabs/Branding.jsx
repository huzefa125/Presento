import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import {
    Palette,
    Image as ImageIcon,
    Save,
    Eye,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Link as LinkIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../../config/api';
import { getRgbaColor, hexToRgb } from '../utils/brandingColors';

const Branding = ({ branding, setBranding, loading, onUpdateBranding, institution }) => {
    const { t } = useTranslation();
    // Use current branding colors from state for UI elements
    const primaryColor = branding?.primaryColor || '#3b82f6';
    const secondaryColor = branding?.secondaryColor || '#14b8a6';
    const [previewMode, setPreviewMode] = useState(false);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoError, setLogoError] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'

    // Initialize branding from institution when available
    useEffect(() => {
        if (institution?.branding) {
            const newBranding = {
                primaryColor: institution.branding.primaryColor || '#3b82f6',
                secondaryColor: institution.branding.secondaryColor || '#14b8a6',
                logoUrl: institution.branding.logoUrl || ''
            };
            setBranding(newBranding);
            if (institution.branding.logoUrl) {
                setLogoPreview(institution.branding.logoUrl);
            } else {
                setLogoPreview(null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [institution?.branding?.primaryColor, institution?.branding?.secondaryColor, institution?.branding?.logoUrl]);

    // Update logo preview when logoUrl changes
    useEffect(() => {
        if (branding.logoUrl) {
            setLogoPreview(branding.logoUrl);
            setLogoError(false);
        } else {
            setLogoPreview(null);
        }
    }, [branding.logoUrl]);

    const handleColorChange = (field, value) => {
        setBranding(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleLogoUrlChange = (e) => {
        const url = e.target.value;
        setBranding(prev => ({
            ...prev,
            logoUrl: url
        }));
    };

    const handleLogoError = () => {
        setLogoError(true);
        setLogoPreview(null);
    };

    const handleLogoLoad = () => {
        setLogoError(false);
    };

    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            toast.error(t('institution_admin.invalid_image_file') || 'Please select an image file');
            return;
        }

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error(t('institution_admin.image_too_large') || 'Image size must be less than 10MB');
            return;
        }

        setIsUploadingLogo(true);

        try {
            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const base64Image = event.target.result;
                    const response = await api.post('/institution-admin/branding/upload-logo', {
                        image: base64Image
                    });

                    if (response.data.success) {
                        setBranding(prev => ({
                            ...prev,
                            logoUrl: response.data.data.logoUrl
                        }));
                        setLogoPreview(response.data.data.logoUrl);
                        toast.success(t('institution_admin.logo_uploaded_success') || 'Logo uploaded successfully');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    const errorMessage = error?.response?.data?.error || error?.message || 'Failed to upload logo';
                    toast.error(errorMessage);
                } finally {
                    setIsUploadingLogo(false);
                    // Reset file input
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }
            };
            
            reader.onerror = () => {
                toast.error(t('institution_admin.failed_read_image') || 'Failed to read image file');
                setIsUploadingLogo(false);
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Image processing error:', error);
            toast.error(t('institution_admin.upload_failed') || 'Failed to upload logo');
            setIsUploadingLogo(false);
        }
    };

    const handleRemoveLogo = () => {
        setBranding(prev => ({
            ...prev,
            logoUrl: ''
        }));
        setLogoPreview(null);
        setLogoError(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate colors
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        if (!colorRegex.test(branding.primaryColor)) {
            toast.error(t('institution_admin.invalid_primary_color') || 'Invalid primary color format');
            return;
        }
        if (!colorRegex.test(branding.secondaryColor)) {
            toast.error(t('institution_admin.invalid_secondary_color') || 'Invalid secondary color format');
            return;
        }

        await onUpdateBranding(e);
    };

    const resetToDefaults = () => {
        setBranding({
            primaryColor: '#3b82f6',
            secondaryColor: '#14b8a6',
            logoUrl: ''
        });
        setLogoPreview(null);
        setLogoError(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8"
        >
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                    {t('institution_admin.custom_branding')}
                </h1>
                <p className="text-gray-400">
                    {t('institution_admin.customize_branding')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Branding Settings Form */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Primary Color */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <Palette className="w-4 h-4" style={{ color: secondaryColor }} />
                                {t('institution_admin.primary_color')}
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={branding.primaryColor}
                                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                                    className="w-20 h-12 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={branding.primaryColor}
                                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                                    placeholder="#3b82f6"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = secondaryColor;
                                        e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {t('institution_admin.primary_color_desc') || 'Main brand color used throughout the platform'}
                            </p>
                        </div>

                        {/* Secondary Color */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <Palette className="w-4 h-4" style={{ color: secondaryColor }} />
                                {t('institution_admin.secondary_color')}
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    value={branding.secondaryColor}
                                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                                    className="w-20 h-12 rounded-lg border border-white/20 cursor-pointer bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={branding.secondaryColor}
                                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                                    className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none"
                                    placeholder="#14b8a6"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = secondaryColor;
                                        e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {t('institution_admin.secondary_color_desc') || 'Accent color for highlights and secondary elements'}
                            </p>
                        </div>

                        {/* Logo URL */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                            <label className="block text-sm font-medium text-white mb-3 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" style={{ color: secondaryColor }} />
                                {t('institution_admin.logo') || 'Logo'}
                            </label>
                            
                            {/* Upload Method Toggle */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('file')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        uploadMethod === 'file'
                                            ? 'text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                    style={uploadMethod === 'file' ? { backgroundColor: secondaryColor } : {}}
                                >
                                    <Upload className="w-4 h-4 inline mr-2" />
                                    {t('institution_admin.upload_file') || 'Upload File'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadMethod('url')}
                                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        uploadMethod === 'url'
                                            ? 'text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                                    style={uploadMethod === 'url' ? { backgroundColor: secondaryColor } : {}}
                                >
                                    <LinkIcon className="w-4 h-4 inline mr-2" />
                                    {t('institution_admin.add_url') || 'Add URL'}
                                </button>
                            </div>

                            {uploadMethod === 'file' ? (
                                <div className="space-y-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        disabled={isUploadingLogo || loading}
                                        className="hidden"
                                        id="logo-upload"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                                            isUploadingLogo || loading
                                                ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                                                : ''
                                        }`}
                                        style={!(isUploadingLogo || loading) ? {
                                            borderColor: getRgbaColor(secondaryColor, 0.5),
                                            color: secondaryColor
                                        } : {}}
                                        onMouseEnter={(e) => {
                                            if (!(isUploadingLogo || loading)) {
                                                e.target.style.borderColor = secondaryColor;
                                                e.target.style.backgroundColor = getRgbaColor(secondaryColor, 0.1);
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!(isUploadingLogo || loading)) {
                                                e.target.style.borderColor = getRgbaColor(secondaryColor, 0.5);
                                                e.target.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        {isUploadingLogo ? (
                                            <>
                                                <div 
                                                    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                                                    style={{ borderColor: `${secondaryColor} transparent transparent transparent` }}
                                                ></div>
                                                <span>{t('institution_admin.uploading') || 'Uploading...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4" />
                                                <span>{t('institution_admin.choose_file') || 'Choose File'}</span>
                                            </>
                                        )}
                                    </label>
                                    <p className="text-xs text-gray-400">
                                        {t('institution_admin.max_file_size') || 'Max file size: 10MB (PNG, JPG, SVG)'}
                                    </p>
                                    {branding.logoUrl && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" />
                                            {t('institution_admin.remove_logo') || 'Remove Logo'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="url"
                                        value={branding.logoUrl}
                                        onChange={handleLogoUrlChange}
                                        disabled={loading}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none disabled:opacity-50"
                                        onFocus={(e) => {
                                            if (!e.target.disabled) {
                                                e.target.style.borderColor = secondaryColor;
                                                e.target.style.boxShadow = `0 0 0 2px ${getRgbaColor(secondaryColor, 0.2)}`;
                                            }
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        placeholder="https://example.com/logo.png"
                                    />
                                    {branding.logoUrl && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" />
                                            {t('institution_admin.remove_logo') || 'Remove Logo'}
                                        </button>
                                    )}
                                </div>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-2">
                                {t('institution_admin.logo_url_desc') || 'Enter the URL of your institution logo (PNG, JPG, or SVG)'}
                            </p>
                            
                            {/* Logo Preview */}
                            {logoPreview && !logoError && (
                                <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-2">Preview:</p>
                                    <div className="flex items-center justify-center p-4 bg-white/5 rounded-lg">
                                        <img
                                            src={logoPreview}
                                            alt="Logo preview"
                                            onError={handleLogoError}
                                            onLoad={handleLogoLoad}
                                            className="max-h-24 max-w-full object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {logoError && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <p className="text-xs text-red-400">
                                        {t('institution_admin.logo_load_error') || 'Failed to load logo. Please check the URL.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ backgroundColor: secondaryColor }}
                                onMouseEnter={(e) => {
                                    if (!e.target.disabled) {
                                        const rgb = hexToRgb(secondaryColor);
                                        if (rgb) {
                                            e.target.style.backgroundColor = `rgb(${Math.max(0, rgb.r - 20)}, ${Math.max(0, rgb.g - 20)}, ${Math.max(0, rgb.b - 20)})`;
                                        }
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = secondaryColor;
                                }}
                            >
                                <Save className="w-4 h-4" />
                                {loading ? (t('institution_admin.saving') || 'Saving...') : (t('institution_admin.save_branding') || 'Save Branding')}
                            </button>
                            
                            <button
                                type="button"
                                onClick={resetToDefaults}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-4 h-4" />
                                {t('institution_admin.reset_to_defaults') || 'Reset to Defaults'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Eye className="w-5 h-5" style={{ color: secondaryColor }} />
                                {t('institution_admin.preview') || 'Preview'}
                            </h3>
                            <button
                                onClick={() => setPreviewMode(!previewMode)}
                                className="text-xs text-gray-400 hover:text-white transition-colors"
                            >
                                {previewMode ? t('institution_admin.hide_preview') || 'Hide' : t('institution_admin.show_preview') || 'Show'}
                            </button>
                        </div>

                        {previewMode && (
                            <div className="space-y-4">
                                {/* Preview Card */}
                                <div 
                                    className="rounded-lg p-6 border-2 transition-all"
                                    style={{
                                        borderColor: branding.primaryColor,
                                        backgroundColor: `${branding.primaryColor}15`
                                    }}
                                >
                                    {/* Logo Preview */}
                                    {logoPreview && !logoError ? (
                                        <div className="mb-4 flex justify-center">
                                            <img
                                                src={logoPreview}
                                                alt="Logo"
                                                className="max-h-16 max-w-full object-contain"
                                                onError={handleLogoError}
                                            />
                                        </div>
                                    ) : (
                                        <div className="mb-4 flex justify-center">
                                            <div 
                                                className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                                                style={{ backgroundColor: branding.primaryColor }}
                                            >
                                                {institution?.name?.charAt(0)?.toUpperCase() || 'I'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Institution Name */}
                                    <h4 className="text-lg font-semibold text-white mb-2 text-center">
                                        {institution?.name || 'Institution Name'}
                                    </h4>

                                    {/* Color Swatches */}
                                    <div className="flex gap-2 justify-center mt-4">
                                        <div
                                            className="w-8 h-8 rounded-full border-2 border-white/20"
                                            style={{ backgroundColor: branding.primaryColor }}
                                            title="Primary Color"
                                        />
                                        <div
                                            className="w-8 h-8 rounded-full border-2 border-white/20"
                                            style={{ backgroundColor: branding.secondaryColor }}
                                            title="Secondary Color"
                                        />
                                    </div>

                                    {/* Sample Button */}
                                    <button
                                        className="w-full mt-4 py-2 rounded-lg text-white font-medium transition-all"
                                        style={{ backgroundColor: branding.primaryColor }}
                                        onMouseEnter={(e) => {
                                            e.target.style.opacity = '0.9';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.opacity = '1';
                                        }}
                                    >
                                        {t('institution_admin.sample_button') || 'Sample Button'}
                                    </button>

                                    {/* Secondary Button */}
                                    <button
                                        className="w-full mt-2 py-2 rounded-lg font-medium transition-all border-2"
                                        style={{
                                            borderColor: branding.secondaryColor,
                                            color: branding.secondaryColor,
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        {t('institution_admin.sample_secondary') || 'Secondary Action'}
                                    </button>
                                </div>

                                {/* Info Note */}
                                <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                                    <p className="text-xs text-gray-400">
                                        {t('institution_admin.preview_note') || 'This is a preview of how your branding will appear to users.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!previewMode && (
                            <div className="text-center py-8">
                                <Eye className="w-12 h-12 mx-auto mb-3 text-gray-500 opacity-50" />
                                <p className="text-sm text-gray-400">
                                    {t('institution_admin.click_to_preview') || 'Click "Show" to preview your branding'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Branding;
