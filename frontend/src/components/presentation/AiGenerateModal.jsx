import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ArrowUp, Lock, Loader2, Palette, Type, BarChart3, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import * as presentationService from '../../services/presentationService';
import { getEffectivePlan } from '../../utils/subscriptionUtils';

const PROMPT_SUGGESTIONS = [
  {
    id: 'quiz',
    icon: Type,
    iconColor: 'text-emerald-600',
    label: 'Live quiz',
    prompt: 'Create a 5-question interactive live quiz about general knowledge with multiple choice options.',
    tooltip: 'Test your audience knowledge with competitive quizzes',
  },
  {
    id: 'questions',
    icon: BarChart3,
    iconColor: 'text-blue-600',
    label: 'Questions for your audience',
    prompt: 'Create an audience engagement presentation with word clouds, opinion scales, and open-ended questions.',
    tooltip: 'Engage your audience by asking questions while you present',
  },
  {
    id: 'survey',
    icon: Pencil,
    iconColor: 'text-amber-500',
    label: 'Shareable survey',
    prompt: 'Generate a customer feedback and satisfaction survey with rating scales and matrix questions.',
    tooltip: 'Collect structured feedback and ratings',
  },
];

const TYPING_PHRASES = [
  'Type your message here...',
  'Create a 5-question quiz about climate change...',
  'Build an interactive customer satisfaction survey...',
  'Generate an engaging team icebreaker presentation...',
  'Skriv ditt meddelande här...',
  'Digite sua mensagem aqui...',
];

// Mentimeter multicolor M logo icon
const MentimeterLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
    <rect x="2" y="4" width="9" height="16" rx="2" fill="#EC4899" />
    <rect x="13" y="4" width="9" height="9" rx="2" fill="#3B82F6" />
    <rect x="13" y="15" width="9" height="5" rx="2" fill="#10B981" />
  </svg>
);

// Mentimeter sketch laptop illustration
const SketchLaptop = () => (
  <div className="flex flex-col items-center justify-center opacity-70">
    <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
      <rect x="25" y="10" width="70" height="46" rx="4" stroke="#1E293B" strokeWidth="2.5" fill="white" />
      <line x1="45" y1="30" x2="75" y2="30" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="53" y1="36" x2="67" y2="36" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 56H105C107.209 56 109 57.7909 109 60V70C109 72.2091 107.209 74 105 74H15C12.7909 74 11 72.2091 11 70V60C11 57.7909 12.7909 56 15 56Z" stroke="#1E293B" strokeWidth="2.5" fill="white" />
      <rect x="54" y="62" width="12" height="6" rx="1" stroke="#1E293B" strokeWidth="2" />
    </svg>
  </div>
);

const AiGenerateModal = ({ isOpen, onClose, user, onGenerated, initialPrompt = '' }) => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [slideCount, setSlideCount] = useState(6);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [generatedPreview, setGeneratedPreview] = useState(null);

  // Typing animation state
  const [typingIndex, setTypingIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [placeholderText, setPlaceholderText] = useState('');

  useEffect(() => {
    if (isOpen && initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  // Typing animation loop for textarea placeholder
  useEffect(() => {
    if (!isOpen || prompt) return;

    const currentPhrase = TYPING_PHRASES[typingIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setPlaceholderText(currentPhrase.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);

        if (charIndex + 1 === currentPhrase.length) {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        setPlaceholderText(currentPhrase.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);

        if (charIndex - 1 === 0) {
          setIsDeleting(false);
          setTypingIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [isOpen, charIndex, isDeleting, typingIndex, prompt]);

  if (!isOpen) return null;

  const effectivePlan = getEffectivePlan(user?.subscription);
  const isFreePlan = !user || effectivePlan === 'free';

  const handleClose = () => {
    if (isGenerating) return;
    onClose();
  };

  const handleGenerate = async (overridePrompt) => {
    const promptToUse = overridePrompt || prompt;
    if (!promptToUse.trim()) {
      toast.error('Please enter a topic or prompt for AI generation');
      return;
    }

    setIsGenerating(true);
    try {
      const data = await presentationService.generatePresentationOutline(promptToUse.trim(), slideCount);
      setGeneratedPreview(data);
      if (onGenerated) {
        onGenerated(data.title, data.slides);
      }
    } catch (error) {
      console.error('AI generate error:', error);
      toast.error(error?.response?.data?.error || 'AI Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      {/* Split Modal Window matching Mentimeter Screenshots 2, 3 & 4 */}
      <div className="relative w-full max-w-5xl h-[85vh] max-h-[680px] bg-white rounded-3xl shadow-2xl flex overflow-hidden border border-gray-200">
        {/* Mobile Close Button */}
        <button
          onClick={handleClose}
          className="md:hidden absolute top-4 right-4 z-30 p-1.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Left Control Panel (Width ~360px) */}
        <div className="w-full md:w-[380px] bg-white p-6 sm:p-7 flex flex-col justify-between border-r border-gray-200 overflow-y-auto">
          <div>
            {/* Logo & Header */}
            <div className="mb-6">
              <MentimeterLogo />
              <h2 className="text-xl font-bold text-gray-900 mt-4 leading-tight">
                Let's get started! What would you like to create?
              </h2>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="flex flex-wrap gap-2 mb-6 relative">
              {PROMPT_SUGGESTIONS.map((item) => {
                const IconComp = item.icon;
                return (
                  <div key={item.id} className="relative">
                    <button
                      onClick={() => {
                        setPrompt(item.prompt);
                      }}
                      onMouseEnter={() => setActiveTooltip(item.id)}
                      onMouseLeave={() => setActiveTooltip(null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 text-xs font-semibold text-gray-700 hover:text-indigo-700 transition-all cursor-pointer"
                    >
                      <IconComp className={`h-3.5 w-3.5 ${item.iconColor} shrink-0`} />
                      <span>{item.label}</span>
                    </button>

                    {/* Tooltip */}
                    {activeTooltip === item.id && (
                      <div className="absolute left-0 bottom-full mb-2 z-30 px-3 py-1.5 bg-black text-white text-xs rounded-lg shadow-lg whitespace-nowrap max-w-xs animate-fadeIn">
                        {item.tooltip}
                        <div className="absolute left-4 top-full w-2 h-2 bg-black rotate-45 -mt-1"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Textarea with Dynamic Typing Animation Placeholder */}
            <div className="relative bg-gray-50 border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 rounded-2xl p-3.5 transition-all">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholderText ? `${placeholderText}|` : 'Type your message here...'}
                rows={5}
                disabled={isGenerating}
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none font-normal leading-relaxed"
              />

              {/* Submit Button inside Textarea bottom-right */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-gray-400 font-medium">{prompt.length}/500</span>
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-black text-gray-700 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center font-bold cursor-pointer"
                  title="Generate presentation"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin text-gray-900" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 text-center font-normal">
              AI can make mistakes, always check the details in your Presento.
            </p>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="hidden md:flex flex-1 bg-[#F8FAFC] flex-col">
          {/* Right Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
              <Palette className="h-4 w-4" />
              <span>Change theme</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 px-3 py-1.5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClose}
                disabled={!generatedPreview}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400 disabled:opacity-60 enabled:bg-[#4F46E5] enabled:text-white enabled:hover:bg-indigo-700 transition-all cursor-pointer"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Right Preview Body */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-4 animate-fadeIn">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <h3 className="text-base font-bold text-gray-900">Creating your interactive presentation...</h3>
                <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                  Generating questions, polls, quizzes, and structured slides based on your prompt.
                </p>
              </div>
            ) : generatedPreview ? (
              <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 shadow-md animate-fadeIn text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  GENERATED PREVIEW
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2 mb-1">{generatedPreview.title}</h3>
                <p className="text-xs text-gray-500 mb-4">{generatedPreview.slides?.length || 0} slides generated</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {generatedPreview.slides?.map((slide, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-semibold text-gray-800 flex items-center justify-between">
                      <span className="truncate">{idx + 1}. {slide.title || slide.question || 'Slide'}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">{slide.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <SketchLaptop />
                <p className="text-sm font-semibold text-gray-500">
                  Your preview will appear here
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AiGenerateModal;
