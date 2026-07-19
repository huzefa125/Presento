import { X, Check, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { THEMES } from '../../constants/themes';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

const ThemePicker = ({ isOpen, onClose, currentThemeId, user, onSelectTheme }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const effectivePlan = getEffectivePlan(user?.subscription);
  const isFreePlan = !user || effectivePlan === 'free';

  const handleSelect = (theme) => {
    if (theme.isPremium && isFreePlan) {
      toast.error(t('toasts.presentation.upgrade_to_use_theme'));
      return;
    }
    if (theme.id === currentThemeId) return;
    onSelectTheme(theme.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl bg-surface shadow-[var(--shadow-level-2)] border border-hairline max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <div>
            <h2 className="text-xl font-semibold text-ink">{t('theme_picker.title')}</h2>
            <p className="text-sm text-ink-muted mt-0.5">{t('theme_picker.description')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-canvas-soft transition-colors shrink-0"
          >
            <X className="h-5 w-5 text-ink-faint hover:text-ink" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map((theme) => {
              const isLocked = theme.isPremium && isFreePlan;
              const isSelected = theme.id === currentThemeId;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-primary bg-canvas-soft'
                      : 'border-hairline bg-surface hover:bg-canvas-soft'
                  } ${isLocked ? 'opacity-70' : ''}`}
                >
                  <div className="w-full h-14 rounded-md overflow-hidden flex">
                    {theme.swatch.map((color, i) => (
                      <span key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 w-full">
                    <span className="text-sm font-medium text-ink truncate">{theme.name}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-auto" />}
                  </div>

                  {theme.isPremium && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/60 text-[10px] font-semibold text-white">
                      {isLocked && <Lock className="h-2.5 w-2.5" />}
                      {t('theme_picker.premium_badge')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isFreePlan && (
            <p className="mt-4 text-xs text-ink-faint text-center">
              {t('theme_picker.upgrade_hint')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemePicker;
