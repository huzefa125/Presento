import { ArrowLeft, Settings as SettingsIcon, Share2, Palette, Sparkles, HelpCircle, LayoutGrid } from 'lucide-react';
import SlideBar from '../presentation/SlideBar';
import NewSlideDropdown from '../presentation/NewSlideDropdown';
import SlideTypePreview from '../presentation/SlideTypePreview';
import SlideCanvas from '../presentation/SlideCanvas';
import SlideEditor from '../presentation/SlideEditor';
import EmptyState from '../presentation/EmptyState';
import ShareModal from '../presentation/ShareModal';
import ThemePicker from '../presentation/ThemePicker';
import AiGenerateModal from '../presentation/AiGenerateModal';
import TemplatesModal from '../presentation/TemplatesModal';
import { getThemeStyleVars } from '../../constants/themes';
import ConfirmDialog from '../common/ConfirmDialog';
import PresentationResults from '../presentation/PresentationResults';
import { PresentationEditorSkeleton } from '../common/PageSkeleton';
import { usePresentationEditor } from '../../hooks/usePresentationEditor';

export default function Presentation() {
  const {
    activeTab,
    aiPrompt,
    currentSlideIndex,
    deleteDialog,
    draftDialog,
    exitDialog,
    handleAddSlide,
    handleAiSlidesGenerated,
    handleApplyTemplate,
    handleBackToDashboard,
    handleCancelExit,
    handleConfirmDeleteSlide,
    handleConfirmExit,
    handleDeleteSlide,
    handleDiscardDraft,
    handleExitWithoutSaving,
    handleExplodePowerPointToSlides,
    handlePresent,
    handleRestoreDraft,
    handleSlideReorder,
    handleSlideUpdate,
    handleThemeSelect,
    handleTitleChange,
    handleToggleRequireApproval,
    hoveredSlideType,
    isFreePlan,
    isLoading,
    isSaving,
    navigate,
    presentation,
    setActiveTab,
    setAiPrompt,
    setCurrentSlideIndex,
    setDeleteDialog,
    setHoveredSlideType,
    setShowAiGenerateModal,
    setShowNewSlideDropdown,
    setShowShareModal,
    setShowSlideEditor,
    setShowTemplatesModal,
    setShowThemeModal,
    showAiGenerateModal,
    showNewSlideDropdown,
    showShareModal,
    showSlideEditor,
    showTemplatesModal,
    showThemeModal,
    slides,
    t,
    user
  } = usePresentationEditor();

  if (isLoading) {
    return <PresentationEditorSkeleton />;
  }

  if (!presentation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft text-ink">
        <div className="text-xl text-ink">{t('presentation.not_found')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas-soft text-ink flex flex-col">
      {/* Mentimeter Top Black Upgrade Banner Bar for Free Users */}
      {isFreePlan && (
        <div className="bg-black text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm z-50">
          <div className="flex items-center gap-3">
            <span className="font-semibold hidden sm:inline">
              Unlock unlimited participants to reach more people.
            </span>
            <span className="font-semibold sm:hidden">
              Reach more participants
            </span>
            <button
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold transition-all active:scale-95 text-xs shadow-sm"
            >
              <span>★</span>
              <span>Upgrade</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span>1/50 Participants this month</span>
            <div className="w-12 sm:w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden hidden sm:block">
              <div className="h-full bg-emerald-500 w-1/5"></div>
            </div>
            <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-pointer" />
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        {/* Main Navbar Row */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 min-h-[56px]">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              onClick={handleBackToDashboard}
              className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              title={t('presentation.back_to_dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={presentation.title}
                onChange={handleTitleChange}
                className="text-xs sm:text-sm font-semibold text-gray-900 bg-transparent hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none px-2 py-1 rounded-lg transition-all truncate w-28 sm:w-44 md:w-60"
                placeholder={t('presentation.untitled')}
              />

              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-400 border-l border-gray-200 pl-2">
                <span>{slides.length} {slides.length === 1 ? 'slide' : 'slides'}</span>
                {isSaving && (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    {t('presentation.saving')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Tabs Section - Only on Large Desktop */}
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-1.5 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'create'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              {t('presentation.create_tab') || 'Create'}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`py-1.5 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === 'results'
                  ? 'text-indigo-600 border-indigo-600 font-bold'
                  : 'text-gray-500 border-transparent hover:text-gray-900'
              }`}
            >
              <span>{t('presentation.results_tab') || 'Results'}</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-semibold">0</span>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setShowThemeModal(true)}
              className="hidden sm:flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-all"
            >
              <Palette className="h-4 w-4 text-gray-600" />
              <span>Theme</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-all flex items-center gap-1"
              title={t('presentation.share')}
            >
              <Share2 className="h-4 w-4 text-gray-600" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              onClick={handlePresent}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-full text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95 shrink-0 whitespace-nowrap leading-none cursor-pointer"
            >
              <span className="hidden lg:inline">Start presentation</span>
              <span className="lg:hidden">Present</span>
              <span className="text-[10px]">▾</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Sub-Navbar Row - Shown on screens below lg (<1024px) */}
        <div className="lg:hidden border-t border-gray-200 px-3 sm:px-4 bg-white flex items-center justify-between min-h-[40px]">
          <div className="flex items-center gap-4 sm:gap-6 py-1.5">
            <button
              onClick={() => setActiveTab('create')}
              className={`text-xs sm:text-sm font-bold pb-1 border-b-2 transition-all ${
                activeTab === 'create'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {t('presentation.create_tab') || 'Create'}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`text-xs sm:text-sm font-semibold pb-1 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'results'
                  ? 'text-indigo-600 border-indigo-600 font-bold'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              <span>{t('presentation.results_tab') || 'Results'}</span>
              <span className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">0</span>
            </button>
          </div>

          {/* Quick Toolbar Action Buttons for Mobile/Tablet */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowAiGenerateModal(true)}
              className="px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold transition-all flex items-center gap-1"
              title={t('presentation.generate_with_ai')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold">AI</span>
            </button>

            <button
              onClick={() => setShowTemplatesModal(true)}
              className="px-2.5 py-1 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-all flex items-center gap-1"
              title="Templates"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold hidden xs:inline">Templates</span>
            </button>

            <button
              onClick={() => setShowThemeModal(true)}
              className="sm:hidden p-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center"
              title="Theme"
            >
              <Palette className="h-3.5 w-3.5 text-gray-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Session Code Display - Clean Flow without overlapping headers or clipping canvas */}
      {slides.length > 0 && presentation.accessCode && activeTab !== 'results' && (
        <div className="w-full bg-[#F1F5F9] border-b border-gray-200 py-2 px-4 flex justify-center items-center z-30 shrink-0">
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 px-4 py-1.5 bg-white rounded-full border border-gray-200 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-medium text-gray-600">{t('presentation.ready_to_share')}</span>
            </div>
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="text-center">
              <p className="text-xs text-gray-800 flex flex-row justify-center items-center gap-1.5 whitespace-nowrap">
                <span className="text-gray-500">{t('presentation.join_at')}</span>
                <span className="font-bold text-gray-900">{typeof window !== 'undefined' ? (window.location.host || 'inavora.com') : 'inavora.com'}</span>
                <span>|</span>
                <span className="text-sm font-bold text-indigo-600">{presentation.accessCode}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0 overflow-hidden bg-canvas-soft h-full">

        {/* Slide Sidebar - Only show in create mode */}
        {activeTab === 'create' && (
          <>
            {/* Desktop Sidebar - Always visible */}
            <div className="hidden lg:block absolute inset-y-0 left-0 z-30">
              <div className="relative h-full">
                <SlideBar
                  slides={slides}
                  currentSlideIndex={currentSlideIndex}
                  onSlideSelect={(index) => {
                    setCurrentSlideIndex(index);
                  }}
                  onDeleteSlide={handleDeleteSlide}
                  onNewSlideClick={() => setShowNewSlideDropdown(!showNewSlideDropdown)}
                  showNewSlideDropdown={showNewSlideDropdown}
                  onSlideReorder={handleSlideReorder}
                  isHorizontal={false}
                  theme={presentation?.theme}
                  onAiGenerateClick={() => setShowAiGenerateModal(true)}
                />

                {showNewSlideDropdown && (
                  <NewSlideDropdown
                    onSelectType={(type) => {
                      handleAddSlide(type);
                      setShowNewSlideDropdown(false);
                      setHoveredSlideType(null);
                    }}
                    onClose={() => {
                      setShowNewSlideDropdown(false);
                      setHoveredSlideType(null);
                    }}
                    onHoverType={setHoveredSlideType}
                    user={user}
                  />
                )}
              </div>
            </div>

            {/* Mobile/Tablet Horizontal Slide Bar - Fixed at bottom */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
              <SlideBar
                slides={slides}
                currentSlideIndex={currentSlideIndex}
                onSlideSelect={(index) => {
                  setCurrentSlideIndex(index);
                }}
                onDeleteSlide={handleDeleteSlide}
                onNewSlideClick={() => setShowNewSlideDropdown(!showNewSlideDropdown)}
                showNewSlideDropdown={showNewSlideDropdown}
                onSlideReorder={handleSlideReorder}
                isHorizontal={true}
                theme={presentation?.theme}
                onEditSlide={(index) => {
                  setCurrentSlideIndex(index);
                  setShowSlideEditor(true);
                }}
              />

              {showNewSlideDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 px-4">
                  <NewSlideDropdown
                    onSelectType={(type) => {
                      handleAddSlide(type);
                      setShowNewSlideDropdown(false);
                    }}
                    onClose={() => setShowNewSlideDropdown(false)}
                    isHorizontal={true}
                    user={user}
                  />
                </div>
              )}
            </div>
          </>
        )}

        <div className={`flex-1 flex ${activeTab === 'create' ? 'lg:ml-44' : ''} bg-canvas-soft ${activeTab === 'create' ? 'pb-24 sm:pb-24 lg:pb-0' : ''}`}>
          {activeTab === 'create' ? (
            <>
              {/* Canvas Area */}
              <div className="flex-1 bg-[#F1F5F9] flex items-center justify-center p-3 sm:p-6 lg:p-8 min-w-0 overflow-y-auto w-full h-full my-auto">
                {/* Fixed-size 16:9 Slide Canvas Frame - Never changes size on hover */}
                {(() => {
                  const themeStyleVars = getThemeStyleVars(presentation?.theme);
                  return (
                    <div
                      className="w-full max-w-3xl lg:max-w-4xl aspect-[16/9] border border-[#E2E8F0] rounded-[24px] shadow-md flex items-center justify-center relative overflow-hidden shrink-0 transition-all duration-300"
                      style={{
                        backgroundColor: themeStyleVars['--color-canvas'] || '#ffffff',
                        color: themeStyleVars['--color-ink'] || '#0f172a',
                        ...themeStyleVars,
                      }}
                    >
                      {showNewSlideDropdown && hoveredSlideType ? (
                        <SlideTypePreview
                          type={hoveredSlideType.type}
                          label={hoveredSlideType.label}
                          icon={hoveredSlideType.icon}
                          theme={presentation?.theme}
                        />
                      ) : slides.length === 0 ? (
                        <EmptyState
                          onAiGenerate={(prompt) => {
                            setAiPrompt(prompt || '');
                            setShowAiGenerateModal(true);
                          }}
                          onStartFromScratch={() => setShowNewSlideDropdown(true)}
                        />
                      ) : (
                        <SlideCanvas
                          slide={slides[currentSlideIndex]}
                          presentation={presentation}
                          theme={presentation?.theme}
                        />
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Slide Editor Panel */}
              {slides.length > 0 && slides[currentSlideIndex]?.type !== 'instruction' && (
                <SlideEditor
                  slide={slides[currentSlideIndex]}
                  onUpdate={handleSlideUpdate}
                  onExplodePowerPointToSlides={handleExplodePowerPointToSlides}
                  onClose={() => setShowSlideEditor(false)}
                  isOpen={showSlideEditor}
                />
              )}

              {/* Mentimeter-style Right Vertical Toolbar */}
              <div className="hidden lg:flex flex-col items-center gap-3 fixed right-4 top-1/2 -translate-y-1/2 z-30 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-md">
                <button
                  onClick={() => setShowAiGenerateModal(true)}
                  className="p-2.5 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all hover:scale-105 group relative"
                  title={t('presentation.generate_with_ai')}
                >
                  <Sparkles className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowTemplatesModal(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all hover:scale-105 group relative"
                  title="Templates"
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all hover:scale-105 group relative"
                  title={t('presentation.theme')}
                >
                  <Palette className="h-5 w-5" />
                </button>
                {slides.length > 0 && (
                  <button
                    onClick={() => setShowSlideEditor(!showSlideEditor)}
                    className={`p-2.5 rounded-xl transition-all hover:scale-105 group relative ${
                      showSlideEditor ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                    title={t('presentation.edit_slide')}
                  >
                    <SettingsIcon className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all hover:scale-105 group relative"
                  title={t('presentation.share')}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>

              {/* Bottom Right Floating Help Circle */}
              <div className="fixed right-4 bottom-4 z-40">
                <button
                  className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  title="Help & Support"
                >
                  ?
                </button>
              </div>
            </>
          ) : (
            <PresentationResults
              slides={slides}
              presentationId={presentation?.id}
            />
          )}
        </div>
      </div>
      <ConfirmDialog
        isOpen={draftDialog.open}
        title={t('presentation.restore_draft_title')}
        description={t('presentation.restore_draft_description')}
        confirmLabel={t('presentation.restore')}
        cancelLabel={t('presentation.discard')}
        onConfirm={handleRestoreDraft}
        onCancel={handleDiscardDraft}
      />
      <ConfirmDialog
        isOpen={exitDialog.open}
        title={t('presentation.save_before_exit_title')}
        description={t('presentation.save_before_exit_description')}
        confirmLabel={t('presentation.save_and_exit')}
        cancelLabel={t('presentation.cancel')}
        onConfirm={handleConfirmExit}
        onCancel={handleCancelExit}
        isLoading={exitDialog.isProcessing}
        secondaryAction={{
          label: t('presentation.exit_without_saving'),
          onClick: handleExitWithoutSaving
        }}
      />
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        accessCode={presentation?.accessCode}
        presentationId={presentation?.id}
        requireApproval={Boolean(presentation?.requireApproval)}
        onToggleRequireApproval={handleToggleRequireApproval}
      />
      <ThemePicker
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        currentThemeId={presentation?.theme}
        user={user}
        onSelectTheme={handleThemeSelect}
      />
      <AiGenerateModal
        isOpen={showAiGenerateModal}
        onClose={() => setShowAiGenerateModal(false)}
        user={user}
        onGenerated={handleAiSlidesGenerated}
        initialPrompt={aiPrompt}
      />
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onApplyTemplate={handleApplyTemplate}
      />
      <ConfirmDialog
        isOpen={deleteDialog.open}
        title={t('presentation.delete_slide_title')}
        description={t('presentation.delete_slide_description')}
        confirmLabel={t('presentation.delete')}
        cancelLabel={t('presentation.cancel')}
        onConfirm={handleConfirmDeleteSlide}
        onCancel={() => setDeleteDialog({ open: false, slideIndex: null })}
      />

      {/* Mentimeter-style Bottom Right Help Button */}
      <button
        className="fixed bottom-4 right-4 z-40 w-9 h-9 rounded-full bg-ink text-canvas flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all text-sm font-semibold"
        title="Help"
      >
        ?
      </button>

    </div>
  );
}
