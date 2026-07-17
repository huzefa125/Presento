import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
    Key,
    Webhook,
    Plus,
    Trash2,
    Copy,
    Eye,
    EyeOff,
    CheckCircle,
    XCircle,
    Calendar,
    ExternalLink,
    RefreshCw,
    AlertCircle,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const APIManagement = ({ 
    apiKeys, 
    webhooks, 
    loading, 
    onOpenApiKeyModal, 
    onOpenWebhookModal, 
    onCreateApiKey, 
    onDeleteApiKey, 
    onCreateWebhook, 
    onDeleteWebhook, 
    onFetchApiKeys, 
    onFetchWebhooks 
}) => {
    const { t } = useTranslation();
    const [revealedKeys, setRevealedKeys] = useState({});
    const [copiedKey, setCopiedKey] = useState(null);

    // Fetch data on mount only
    useEffect(() => {
        onFetchApiKeys();
        onFetchWebhooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Toggle key visibility
    const toggleKeyVisibility = (keyId) => {
        setRevealedKeys(prev => ({
            ...prev,
            [keyId]: !prev[keyId]
        }));
    };

    // Copy to clipboard
    const copyToClipboard = async (text, keyId) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(keyId);
            toast.success(t('institution_admin.copied_to_clipboard') || 'Copied to clipboard!');
            setTimeout(() => setCopiedKey(null), 2000);
        } catch (error) {
            toast.error(t('institution_admin.copy_failed') || 'Failed to copy');
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Mask API key
    const maskApiKey = (key) => {
        if (!key) return '';
        if (key.length <= 8) return '•'.repeat(key.length);
        return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8"
        >
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-ink mb-2">
                    {t('institution_admin.api_management')}
                </h1>
                <p className="text-ink-muted">
                    {t('institution_admin.api_management_description')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* API Keys Section */}
                <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-hairline flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                                <Key className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-ink">
                                    {t('institution_admin.api_keys')}
                                </h2>
                                <p className="text-sm text-ink-muted">
                                    {apiKeys?.length || 0} {t('institution_admin.keys_configured') || 'keys configured'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onOpenApiKeyModal}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-active text-on-primary font-medium rounded-full transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t('institution_admin.create_api_key')}
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <RefreshCw className="w-6 h-6 mx-auto mb-3 text-primary animate-spin" />
                                <p className="text-ink-muted">{t('institution_admin.loading') || 'Loading...'}</p>
                            </div>
                        ) : !apiKeys || apiKeys.length === 0 ? (
                            <div className="text-center py-12">
                                <Key className="w-12 h-12 mx-auto mb-4 text-ink-faint opacity-50" />
                                <p className="text-ink-muted mb-4">{t('institution_admin.no_api_keys')}</p>
                                <button
                                    onClick={onOpenApiKeyModal}
                                    className="text-primary hover:underline transition-colors text-sm font-medium"
                                >
                                    {t('institution_admin.create_first_api_key') || 'Create your first API key'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {apiKeys.map((apiKey) => (
                                    <motion.div
                                        key={apiKey.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-surface border border-hairline rounded-md p-4 hover:bg-canvas-soft transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-ink">
                                                        {apiKey.name || t('institution_admin.unnamed_key') || 'Unnamed Key'}
                                                    </h3>
                                                    {apiKey.active !== false ? (
                                                        <span className="px-2 py-0.5 bg-accent-green/10 text-accent-green text-xs rounded-full flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            {t('institution_admin.active') || 'Active'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-canvas-soft text-ink-muted text-xs rounded-full flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" />
                                                            {t('institution_admin.inactive') || 'Inactive'}
                                                        </span>
                                                    )}
                                                </div>
                                                {apiKey.createdAt && (
                                                    <p className="text-xs text-ink-muted flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {t('institution_admin.created_on') || 'Created'} {formatDate(apiKey.createdAt)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => onDeleteApiKey(apiKey.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title={t('institution_admin.delete') || 'Delete'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* API Key Value */}
                                        <div className="bg-canvas-soft rounded-md p-3 mb-3">
                                            <div className="flex items-center gap-2">
                                                <code className="flex-1 text-sm font-mono text-ink-secondary break-all">
                                                    {revealedKeys[apiKey.id] ? apiKey.key : maskApiKey(apiKey.key)}
                                                </code>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => toggleKeyVisibility(apiKey.id)}
                                                        className="p-1.5 text-ink-muted hover:text-ink transition-colors"
                                                        title={revealedKeys[apiKey.id] ? (t('institution_admin.hide') || 'Hide') : (t('institution_admin.show') || 'Show')}
                                                    >
                                                        {revealedKeys[apiKey.id] ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                                                        className="p-1.5 text-ink-muted hover:text-ink transition-colors"
                                                        title={t('institution_admin.copy') || 'Copy'}
                                                    >
                                                        {copiedKey === apiKey.id ? (
                                                            <CheckCircle className="w-4 h-4 text-accent-green" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Warning */}
                                        <div className="flex items-start gap-2 p-2 bg-accent-orange/10 border border-accent-orange/30 rounded-md">
                                            <AlertCircle className="w-4 h-4 text-accent-orange mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-accent-orange">
                                                {t('institution_admin.api_key_warning') || 'Keep your API keys secure. Never share them publicly.'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Webhooks Section */}
                <div className="bg-surface border border-hairline rounded-lg overflow-hidden">
                    <div className="p-6 border-b border-hairline flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-purple/20 rounded-md">
                                <Webhook className="w-5 h-5 text-accent-purple-deep" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-ink">
                                    {t('institution_admin.webhooks')}
                                </h2>
                                <p className="text-sm text-ink-muted">
                                    {webhooks?.length || 0} {t('institution_admin.webhooks_configured') || 'webhooks configured'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onOpenWebhookModal}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-active text-on-primary font-medium rounded-full transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            {t('institution_admin.create_webhook')}
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="text-center py-8">
                                <RefreshCw className="w-6 h-6 mx-auto mb-3 text-primary animate-spin" />
                                <p className="text-ink-muted">{t('institution_admin.loading') || 'Loading...'}</p>
                            </div>
                        ) : !webhooks || webhooks.length === 0 ? (
                            <div className="text-center py-12">
                                <Webhook className="w-12 h-12 mx-auto mb-4 text-ink-faint opacity-50" />
                                <p className="text-ink-muted mb-4">{t('institution_admin.no_webhooks')}</p>
                                <button
                                    onClick={onOpenWebhookModal}
                                    className="text-primary hover:underline transition-colors text-sm font-medium"
                                >
                                    {t('institution_admin.create_first_webhook') || 'Create your first webhook'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {webhooks.map((webhook) => (
                                    <motion.div
                                        key={webhook.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-surface border border-hairline rounded-md p-4 hover:bg-canvas-soft transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {webhook.active !== false ? (
                                                        <span className="px-2 py-0.5 bg-accent-green/10 text-accent-green text-xs rounded-full flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" />
                                                            {t('institution_admin.active') || 'Active'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 bg-canvas-soft text-ink-muted text-xs rounded-full flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" />
                                                            {t('institution_admin.inactive') || 'Inactive'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <ExternalLink className="w-4 h-4 text-ink-muted flex-shrink-0" />
                                                    <a
                                                        href={webhook.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary hover:underline break-all"
                                                    >
                                                        {webhook.url}
                                                    </a>
                                                </div>
                                                {webhook.createdAt && (
                                                    <p className="text-xs text-ink-muted flex items-center gap-1 mt-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {t('institution_admin.created_on') || 'Created'} {formatDate(webhook.createdAt)}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => onDeleteWebhook(webhook.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                                                title={t('institution_admin.delete') || 'Delete'}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Events */}
                                        {webhook.events && webhook.events.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-ink-muted mb-2">
                                                    {t('institution_admin.events') || 'Events'}:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {webhook.events.map((event, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-sm"
                                                        >
                                                            {event}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Secret */}
                                        {webhook.secret && (
                                            <div className="bg-canvas-soft rounded-md p-2 mb-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-ink-muted">
                                                        {t('institution_admin.secret') || 'Secret'}:
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs font-mono text-ink-secondary">
                                                            {webhook.secret.substring(0, 8)}...
                                                        </code>
                                                        <button
                                                            onClick={() => copyToClipboard(webhook.secret, `webhook-${webhook.id}`)}
                                                            className="p-1 text-ink-muted hover:text-ink transition-colors"
                                                            title={t('institution_admin.copy') || 'Copy'}
                                                        >
                                                            {copiedKey === `webhook-${webhook.id}` ? (
                                                                <CheckCircle className="w-3 h-3 text-accent-green" />
                                                            ) : (
                                                                <Copy className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Info */}
                                        <div className="flex items-start gap-2 p-2 bg-primary/10 border border-primary/30 rounded-md">
                                            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-primary">
                                                {t('institution_admin.webhook_info') || 'Webhooks will receive POST requests when configured events occur.'}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default APIManagement;
