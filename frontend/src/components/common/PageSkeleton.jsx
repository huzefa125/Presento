import { useLayoutEffect, useRef, useState } from 'react';
import { snapshotBones } from 'boneyard-js';
import { Skeleton } from 'boneyard-js/react';
import { Sparkles } from 'lucide-react';

/*
 * Page skeletons powered by boneyard-js.
 *
 * Each layout below is a plain-div "blueprint" that mirrors the real page (same containers,
 * tokens and spacing). boneyard uses it two ways:
 *  - fixture:  `npm run skeletons` (boneyard CLI) snapshots it into pixel-perfect bones
 *              written to src/bones/*.bones.json and auto-registered via src/bones/registry.js.
 *  - fallback: until bones are generated, the blueprint itself renders as a pulsing skeleton.
 *
 * At runtime the blueprint is re-snapshotted with boneyard's `snapshotBones` on mount and on every
 * resize, so the shimmer bones line up exactly at any viewport size (the CLI bones only cover the
 * captured breakpoints and serve as first-paint data). The blueprint's chrome (nav bars, cards,
 * borders) stays visible under the bones via the `.presento-skeleton` rules in index.css.
 *
 * Capture routes live at /__skeletons/:variant (dev only) — see App.jsx and boneyard.config.json.
 * Keep these layouts in sync with Landing.jsx, Dashboard.jsx, Presentation.jsx and Login.jsx.
 */

// A single placeholder block. Fixed sizes keep the captured bones stable.
// `onDark` blocks sit on dark surfaces: they skip boneyard capture and pulse translucently instead.
function Bone({ w = '100%', h = 16, r = 6, circle = false, onDark = false, className = '' }) {
  return (
    <div
      data-bone={onDark ? undefined : true}
      data-no-bone={onDark || undefined}
      className={`${onDark ? 'bg-white/15 animate-pulse' : 'bg-[#e8e5e1]'} shrink-0 ${className}`}
      style={{
        width: circle ? h : w,
        height: h,
        borderRadius: circle ? '50%' : r,
      }}
    />
  );
}

// Brand badge overlay for initial loading indicator
export function BrandLoadingBadge({ message = "Loading Presento..." }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] pointer-events-none">
      <div className="flex flex-col items-center gap-3 px-8 py-5 rounded-2xl bg-white/95 shadow-xl border border-indigo-100/90 animate-fadeIn">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
        </div>
        <p className="text-indigo-950 font-bold text-xs tracking-wider uppercase">
          {message}
        </p>
      </div>
    </div>
  );
}

const SNAPSHOT_CONFIG = { excludeSelectors: ['[data-no-bone]'] };
const isBoneyardBuild = () => typeof window !== 'undefined' && window.__BONEYARD_BUILD === true;

// Shared boneyard wrapper: the blueprint is the capture fixture, the sizing child and the fallback.
function BoneyardPage({ name, layout }) {
  const hostRef = useRef(null);
  const [liveBones, setLiveBones] = useState();

  // Re-snapshot the rendered blueprint so bones match the current viewport exactly.
  useLayoutEffect(() => {
    if (isBoneyardBuild()) return;
    const content = hostRef.current?.querySelector('[data-boneyard-content]');
    if (!content) return;

    const measure = () => setLiveBones(snapshotBones(content, name, SNAPSHOT_CONFIG));
    measure();

    let frame;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    });
    observer.observe(content);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [name]);

  const fallback = <div className="animate-pulse">{layout}</div>;
  return (
    <div ref={hostRef} className="min-h-screen bg-canvas-soft">
      <Skeleton
        name={name}
        loading
        select="viewport"
        className="presento-skeleton"
        initialBones={liveBones}
        fixture={layout}
        fallback={fallback}
        snapshotConfig={SNAPSHOT_CONFIG}
      >
        {layout}
      </Skeleton>
    </div>
  );
}

// Shared pieces mirroring repeated real-UI elements
const LanguageSelectorBone = () => <Bone w={92} h={38} r={6} />;

const BrandBone = () => (
  <div className="flex items-center gap-2 shrink-0">
    <Bone w={32} h={32} r={8} />
    <Bone w={110} h={24} />
  </div>
);

const SectionHeadingBone = ({ w = 220 }) => (
  <div className="flex items-center gap-2 mb-6">
    <Bone w={20} h={20} r={4} />
    <Bone w={w} h={24} />
  </div>
);

// 1. Landing Page Skeleton — mirrors Landing.jsx (navbar + hero)
function LandingLayout() {
  return (
    <div className="min-h-screen bg-canvas-soft font-sans">
      {/* Navbar (fixed in the real page) */}
      <div className="bg-canvas/80 border-b border-hairline">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-2 sm:gap-4">
          <BrandBone />
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <Bone w={48} h={16} r={4} />
            <Bone w={64} h={16} r={4} />
            <Bone w={72} h={16} r={4} />
            <Bone w={64} h={16} r={4} />
            <Bone w={52} h={16} r={4} />
            <LanguageSelectorBone />
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <Bone w={52} h={16} r={4} />
            <Bone w={118} h={36} r={999} />
          </div>
          <div className="lg:hidden flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSelectorBone />
            <Bone w={24} h={24} r={4} />
          </div>
        </div>
      </div>

      {/* Hero Section (real page: main pt-32 under a fixed nav) */}
      <div className="pt-[58px] pb-20">
        <section className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 bg-secondary rounded-2xl px-6 py-12 md:px-16 md:py-20">
            <div className="lg:w-[60%] w-full flex flex-col items-center lg:items-start">
              <Bone w={260} h={38} r={999} className="mb-8 max-w-full" onDark />
              <Bone w="85%" h={64} r={12} className="mb-4" onDark />
              <Bone w="65%" h={52} r={12} className="mb-6" onDark />
              <Bone w="90%" h={22} className="mb-3 max-w-2xl" onDark />
              <Bone w="70%" h={22} className="mb-10 max-w-2xl" onDark />
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Bone w={250} h={60} r={999} className="max-sm:w-full!" onDark />
                <Bone w={220} h={60} r={999} className="max-sm:w-full!" onDark />
              </div>
            </div>

            {/* Live session mockup card */}
            <div className="lg:w-[40%] w-full">
              <div className="bg-surface border border-hairline rounded-xl p-6 shadow-[var(--shadow-level-2)]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <Bone circle h={12} />
                    <Bone circle h={12} />
                    <Bone circle h={12} />
                  </div>
                  <Bone w={96} h={24} r={999} />
                </div>
                <div className="space-y-6">
                  <div className="flex justify-center"><Bone w="75%" h={30} /></div>
                  <Bone h={56} r={8} />
                  <Bone h={56} r={8} />
                  <Bone h={56} r={8} />
                </div>
                <div className="mt-8 pt-6 border-t border-hairline flex items-center justify-between gap-3">
                  <Bone w={160} h={16} r={4} />
                  <div className="flex -space-x-2">
                    <Bone circle h={32} />
                    <Bone circle h={32} />
                    <Bone circle h={32} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function LandingSkeleton() {
  return <BoneyardPage name="landing-page" layout={<LandingLayout />} />;
}

// 2. Dashboard Skeleton — mirrors Dashboard.jsx
function DashboardLayout() {
  return (
    <div className="min-h-screen bg-canvas-soft font-sans">
      {/* Top Navigation Bar (fixed in the real page) */}
      <div className="bg-canvas border-b border-hairline">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <BrandBone />
          <div className="flex gap-3 items-center">
            <Bone w={170} h={46} r={6} className="max-sm:hidden" />
            <div className="flex items-center gap-3 px-3 py-2">
              <Bone circle h={38} />
              <Bone w={90} h={16} r={4} className="hidden md:block" />
              <Bone w={16} h={16} r={4} />
            </div>
            <LanguageSelectorBone />
          </div>
        </div>
      </div>

      {/* Main Content (real page: py-28 under a fixed nav) */}
      <div className="max-w-7xl mx-auto px-6 pt-[25px] pb-28">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <Bone w={210} h={40} r={8} className="mb-2" />
            <Bone w={280} h={20} className="max-w-full" />
          </div>
          <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
            <Bone w={220} h={48} r={999} className="max-md:w-full!" />
            <Bone w={200} h={46} r={999} className="max-md:w-full!" />
            <Bone w={200} h={46} r={999} className="max-md:w-full!" />
          </div>
        </div>

        {/* Templates Section */}
        <section className="mb-12">
          <SectionHeadingBone w={210} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-hairline rounded-lg p-6">
                <Bone w={48} h={48} r={6} className="mb-4" />
                <Bone w="60%" h={26} className="mb-2" />
                <Bone w="95%" h={16} r={4} className="mb-1.5" />
                <Bone w="70%" h={16} r={4} />
              </div>
            ))}
          </div>
        </section>

        {/* Recent Presentations */}
        <section className="mb-15">
          <SectionHeadingBone w={160} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border border-hairline rounded-lg p-6">
                <Bone w={40} h={40} r={6} className="mb-4" />
                <Bone w="65%" h={26} className="mb-2" />
                <Bone w="40%" h={18} r={4} />
              </div>
            ))}
          </div>
        </section>

        {/* All Presentations */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Bone w={20} h={20} r={4} />
              <Bone w={180} h={24} />
            </div>
            <Bone h={46} r={2} className="md:w-72!" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface border border-hairline rounded-lg p-5">
                <div className="flex items-center gap-4">
                  <Bone w={40} h={40} r={6} />
                  <div className="flex-1 min-w-0"><Bone w="70%" h={20} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return <BoneyardPage name="dashboard-page" layout={<DashboardLayout />} />;
}

// 3. Presentation Editor Skeleton — mirrors Presentation.jsx (create tab)
function PresentationEditorLayout() {
  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-3 px-4 py-2 min-h-[56px]">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bone circle h={36} />
            <Bone w={176} h={28} r={8} className="max-sm:w-28!" />
            <Bone w={52} h={14} r={4} className="hidden sm:block" />
          </div>
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            <Bone w={52} h={22} r={4} />
            <Bone w={80} h={22} r={4} />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Bone w={82} h={32} r={999} className="hidden sm:block" />
            <Bone w={80} h={32} r={999} className="max-sm:w-8!" />
            <Bone w={150} h={36} r={999} className="max-lg:w-24!" />
          </div>
        </div>
        {/* Mobile & tablet sub-navbar */}
        <div className="lg:hidden border-t border-gray-200 px-3 sm:px-4 flex items-center justify-between min-h-[40px]">
          <div className="flex items-center gap-4 sm:gap-6 py-1.5">
            <Bone w={48} h={18} r={4} />
            <Bone w={72} h={18} r={4} />
          </div>
          <div className="flex items-center gap-1.5">
            <Bone w={48} h={26} r={999} />
            <Bone w={40} h={26} r={999} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative min-h-0">
        {/* Desktop slide sidebar */}
        <div className="hidden lg:flex absolute inset-y-0 left-0 w-44 bg-canvas border-r border-hairline flex-col">
          <div className="p-3 border-b border-hairline">
            <Bone h={40} r={999} />
          </div>
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-2 pt-3">
                <Bone h={84} r={4} />
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex lg:ml-44 bg-[#F1F5F9] items-center justify-center p-3 sm:p-6 lg:p-8 min-w-0">
          <div className="w-full max-w-3xl lg:max-w-4xl aspect-[16/9] bg-white border border-[#E2E8F0] rounded-[24px] shadow-md flex flex-col items-center justify-center gap-4 p-6 sm:p-12">
            <Bone w="60%" h={36} r={8} />
            <Bone w="35%" h={18} className="mb-4" />
            <div className="w-full max-w-xl space-y-3">
              <Bone h={44} r={10} />
              <Bone h={44} r={10} />
              <Bone h={44} r={10} />
            </div>
          </div>
        </div>

        {/* Right vertical toolbar (fixed in the real page) */}
        <div className="hidden lg:flex flex-col items-center gap-3 absolute right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-md">
          {[1, 2, 3, 4].map((i) => <Bone key={i} w={44} h={44} r={12} />)}
        </div>
      </div>

      {/* Mobile & tablet horizontal slide bar (fixed bottom in the real page) */}
      <div className="lg:hidden bg-canvas border-t border-hairline">
        <div className="flex items-center gap-3 px-4 py-3 overflow-hidden">
          <Bone w={80} h={80} r={12} />
          {[1, 2, 3].map((i) => <Bone key={i} w={128} h={80} r={12} />)}
        </div>
      </div>
    </div>
  );
}

export function PresentationEditorSkeleton() {
  return <BoneyardPage name="presentation-editor" layout={<PresentationEditorLayout />} />;
}

// 4. Auth Pages Skeleton — mirrors Login.jsx (also used for register / forgot password)
function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-5 relative font-sans">
      {/* Back to home pill */}
      <div className="absolute top-10 left-10">
        <Bone w={150} h={38} r={999} />
      </div>

      <div className="bg-surface border border-hairline rounded-lg shadow-[var(--shadow-level-1)] p-8 md:p-10 w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <Bone w={240} h={36} r={8} className="mb-2 max-w-full" />
          <Bone w={200} h={18} r={4} />
        </div>

        <div className="space-y-5">
          <div>
            <Bone w={110} h={18} r={4} className="mb-2" />
            <Bone h={46} r={2} />
          </div>
          <div>
            <Bone w={80} h={18} r={4} className="mb-2" />
            <Bone h={46} r={2} />
          </div>
          <div className="flex justify-end">
            <Bone w={120} h={18} r={4} />
          </div>
          <Bone h={44} r={999} className="mt-2" />
        </div>

        <div className="flex justify-center mt-8">
          <Bone w={230} h={18} r={4} />
        </div>
      </div>
    </div>
  );
}

export function AuthSkeleton() {
  return <BoneyardPage name="auth-page" layout={<AuthLayout />} />;
}

const VARIANTS = {
  landing: LandingSkeleton,
  dashboard: DashboardSkeleton,
  presentation: PresentationEditorSkeleton,
  auth: AuthSkeleton,
};

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/verify-otp'];

// Smart Route-matching Skeleton Selector
export default function PageSkeleton({ variant }) {
  // Explicit variant overrides
  const Explicit = VARIANTS[variant];
  if (Explicit) return <Explicit />;

  // Auto-detect based on current URL path
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/presentation/') || path.startsWith('/present/')) {
    return <PresentationEditorSkeleton />;
  }
  if (path === '/dashboard' || path === '/testimonials') {
    return <DashboardSkeleton />;
  }
  if (AUTH_PATHS.includes(path)) {
    return <AuthSkeleton />;
  }

  // Default to Landing Skeleton for root `/` and general pages
  return <LandingSkeleton />;
}

export const InitPageSkeleton = PageSkeleton;
