import { useState } from 'react';
import { X, Sparkles, Lock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import * as presentationService from '../../services/presentationService';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

const MIN_SLIDES = 3;
const MAX_SLIDES = 15;

const AiGenerateModal = ({ isOpen, onClose, user, onGenerated }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [slideCount, setSlideCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const effectivePlan = getEffectivePlan(user?.subscription);
  const isFreePlan = !user || effectivePlan === 'free';

  const handleClose = () => {
    if (isGenerating) return;
    onClose();
  };

  const handleGenerate = async () => {
    if (isFreePlan) {
      toast.error(t('ai_generate.upgrade_required'));
      return;
    }
    if (!prompt.trim()) {
      toast.error(t('ai_generate.prompt_required'));
      return;
    }

    setIsGenerating(true);
    try {
      const data = await presentationService.generatePresentationOutline(prompt.trim(), slideCount);
      onGenerated(data.title, data.slides);
      setPrompt('');
    } catch (error) {
      console.error('AI generate error:', error);
      const code = error?.response?.data?.code;
      if (code === 'UPGRADE_REQUIRED') {
        toast.error(t('ai_generate.upgrade_required'));
      } else {
        toast.error(error?.response?.data?.error || t('ai_generate.failed'));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl bg-surface shadow-[var(--shadow-level-2)] border border-hairline max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-ink">{t('ai_generate.title')}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-canvas-soft transition-colors shrink-0"
          >
            <X className="h-5 w-5 text-ink-faint hover:text-ink" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isFreePlan && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-md bg-canvas-soft border border-hairline">
              <Lock className="h-4 w-4 text-ink-faint mt-0.5 shrink-0" />
              <p className="text-xs text-ink-muted">{t('ai_generate.upgrade_hint')}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">
              {t('ai_generate.prompt_label')}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('ai_generate.prompt_placeholder')}
              maxLength={500}
              rows={4}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-canvas border border-hairline rounded-md text-ink placeholder:text-ink-faint focus:outline-none focus:shadow-[var(--shadow-level-1)] focus:border-primary transition-shadow resize-none disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-ink-faint text-right">{prompt.length}/500</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink-secondary">
                {t('ai_generate.slide_count_label')}
              </label>
              <span className="text-sm font-semibold text-primary">{slideCount}</span>
            </div>
            <input
              type="range"
              min={MIN_SLIDES}
              max={MAX_SLIDES}
              value={slideCount}
              disabled={isGenerating}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full accent-primary disabled:opacity-60"
            />
            <div className="flex justify-between text-[11px] text-ink-faint mt-1">
              <span>{MIN_SLIDES}</span>
              <span>{MAX_SLIDES}</span>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary hover:bg-primary-active disabled:opacity-50 disabled:pointer-events-none text-on-primary rounded-full transition-colors font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('ai_generate.generating')}
              </>
            ) : isFreePlan ? (
              <>
                <Lock className="h-4 w-4" />
                {t('ai_generate.generate_button')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('ai_generate.generate_button')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiGenerateModal;
