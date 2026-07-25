import { X, Check, Lock, Sparkles } from 'lucide-react';
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
      toast.error('★ Pro subscription required to use this theme! Please upgrade your plan.');
      return;
    }
    if (theme.id === currentThemeId) return;
    onSelectTheme(theme.id);
    toast.success(`Applied theme "${theme.name}"`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-xl mx-4 rounded-3xl bg-white shadow-2xl border border-gray-200 max-h-[88vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 sticky top-0 bg-white z-20">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('theme_picker.title') || 'Presentation Themes'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">3 Free themes + 5 Pro themes for subscribers</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {THEMES.map((theme) => {
              const isLocked = theme.isPremium && isFreePlan;
              const isSelected = theme.id === currentThemeId;

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme)}
                  className={`relative flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
                  } ${isLocked ? 'opacity-75' : ''}`}
                >
                  <div className="w-full h-16 rounded-xl overflow-hidden flex border border-gray-200/60 shadow-xs">
                    {theme.swatch.map((color, i) => (
                      <span key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>

                  <div className="flex items-center justify-between w-full pt-1">
                    <span className="text-xs font-bold text-gray-900 truncate">{theme.name}</span>
                    {isSelected && <Check className="h-4 w-4 text-indigo-600 shrink-0" />}
                  </div>

                  {/* Free vs Pro Badge */}
                  {theme.isPremium ? (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-xs">
                      {isLocked ? <Lock className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5" />}
                      ★ PRO
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-[9px] font-bold text-gray-600">
                      FREE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {isFreePlan && (
            <div className="mt-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-center">
              <p className="text-xs font-semibold text-indigo-900">
                Unlock all 5 PRO themes with an active subscription!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemePicker;
