import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Sparkles } from 'lucide-react';

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

// 1. Landing Page Skeleton
export function LandingSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#f8fafc" duration={1.2}>
      <div className="relative min-h-screen bg-[#F8FAFC] overflow-hidden font-sans">

        {/* Top Navbar */}
        <div className="h-20 border-b border-gray-200/80 bg-white px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton circle width={36} height={36} />
            <Skeleton width={140} height={24} borderRadius={6} />
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <Skeleton width={80} height={18} borderRadius={4} />
            <Skeleton width={90} height={18} borderRadius={4} />
            <Skeleton width={70} height={18} borderRadius={4} />
            <Skeleton width={80} height={18} borderRadius={4} />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton width={80} height={38} borderRadius={10} />
            <Skeleton width={120} height={38} borderRadius={10} />
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-12 flex flex-col items-center text-center">
          <Skeleton width={160} height={28} borderRadius={20} className="mb-6" />
          <Skeleton width="80%" height={48} borderRadius={12} className="mb-4 max-w-3xl" />
          <Skeleton width="60%" height={24} borderRadius={8} className="mb-8 max-w-xl" />

          {/* CTA Buttons */}
          <div className="flex items-center gap-4 mb-14">
            <Skeleton width={160} height={48} borderRadius={12} />
            <Skeleton width={140} height={48} borderRadius={12} />
          </div>

          {/* Hero Presentation Preview Frame */}
          <div className="w-full max-w-4xl aspect-[16/9] bg-white rounded-3xl p-6 border border-gray-200/90 shadow-lg flex flex-col gap-4">
            <div className="h-10 border-b border-gray-100 flex items-center justify-between pb-3">
              <Skeleton width={180} height={20} borderRadius={6} />
              <div className="flex gap-2">
                <Skeleton width={60} height={28} borderRadius={6} />
                <Skeleton width={80} height={28} borderRadius={6} />
              </div>
            </div>
            <div className="flex-1 flex gap-4">
              <div className="w-40 space-y-3 hidden sm:block border-r border-gray-100 pr-3">
                <Skeleton height={60} borderRadius={8} />
                <Skeleton height={60} borderRadius={8} />
                <Skeleton height={60} borderRadius={8} />
              </div>
              <div className="flex-1 bg-gray-50/70 rounded-xl p-6 flex flex-col justify-center items-center gap-4">
                <Skeleton width="70%" height={28} borderRadius={6} />
                <Skeleton width="40%" height={18} borderRadius={6} />
                <div className="w-full max-w-md space-y-3 mt-4">
                  <Skeleton height={40} borderRadius={8} />
                  <Skeleton height={40} borderRadius={8} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}

// 2. Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#ffffff" duration={1.2}>
      <div className="relative min-h-screen bg-[#F8FAFC] font-sans">

        {/* Top Navbar */}
        <div className="h-16 border-b border-gray-200/80 bg-white px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton circle width={36} height={36} />
            <Skeleton width={120} height={22} borderRadius={6} />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton width={130} height={36} borderRadius={8} />
            <Skeleton circle width={36} height={36} />
            <Skeleton width={40} height={36} borderRadius={8} />
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
            <div>
              <Skeleton width={240} height={32} borderRadius={8} className="mb-2" />
              <Skeleton width={340} height={16} borderRadius={6} />
            </div>
            <div className="flex gap-3">
              <Skeleton width={140} height={42} borderRadius={10} />
              <Skeleton width={160} height={42} borderRadius={10} />
            </div>
          </div>

          {/* Quick Action Templates Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-gray-200/70 shadow-xs flex items-center gap-3">
                <Skeleton circle width={40} height={40} />
                <div className="flex-1 space-y-1">
                  <Skeleton width="80%" height={16} />
                  <Skeleton width="50%" height={12} />
                </div>
              </div>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs flex flex-col gap-3">
                <Skeleton height={140} borderRadius={12} />
                <Skeleton width="70%" height={20} borderRadius={6} />
                <Skeleton width="45%" height={14} borderRadius={4} />
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <Skeleton width={80} height={14} />
                  <Skeleton width={50} height={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}

// 3. Presentation Editor Skeleton
export function PresentationEditorSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#ffffff" duration={1.2}>
      <div className="relative min-h-screen bg-[#F1F5F9] flex flex-col font-sans">

        {/* Top Navbar */}
        <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton circle width={32} height={32} />
            <Skeleton width={160} height={20} borderRadius={6} />
            <Skeleton width={60} height={16} borderRadius={4} />
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Skeleton width={80} height={16} borderRadius={4} />
            <Skeleton width={80} height={16} borderRadius={4} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={80} height={32} borderRadius={20} />
            <Skeleton width={120} height={32} borderRadius={20} />
          </div>
        </div>

        {/* Editor Body Layout */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Left Slide Sidebar */}
          <div className="w-44 bg-white border-r border-gray-200 p-3 space-y-3 hidden sm:block">
            <Skeleton height={36} borderRadius={20} className="mb-4" />
            <Skeleton height={88} borderRadius={10} />
            <Skeleton height={88} borderRadius={10} />
            <Skeleton height={88} borderRadius={10} />
          </div>

          {/* Center 16:9 Canvas */}
          <div className="flex-1 flex items-center justify-center p-6 bg-[#F1F5F9]">
            <div className="w-full max-w-4xl aspect-[16/9] bg-white rounded-[24px] border border-gray-200 shadow-xs p-8 flex flex-col items-center justify-center gap-4 relative overflow-hidden">
              <Skeleton width={380} height={32} borderRadius={8} />
              <Skeleton width={220} height={18} borderRadius={6} className="mb-4" />
              <div className="w-full max-w-md space-y-3">
                <Skeleton height={42} borderRadius={10} />
                <Skeleton height={42} borderRadius={10} />
                <Skeleton height={42} borderRadius={10} />
              </div>
            </div>
          </div>

          {/* Right Toolbar */}
          <div className="w-14 py-6 hidden lg:flex flex-col items-center gap-4 border-l border-gray-200/80 bg-white">
            <Skeleton circle width={32} height={32} />
            <Skeleton circle width={32} height={32} />
            <Skeleton circle width={32} height={32} />
            <Skeleton circle width={32} height={32} />
          </div>
        </div>
      </div>
    </SkeletonTheme>
  );
}

// 4. Auth Pages Skeleton (Login, Register, Forgot Password)
export function AuthSkeleton() {
  return (
    <SkeletonTheme baseColor="#e2e8f0" highlightColor="#ffffff" duration={1.2}>
      <div className="relative min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">

        {/* Back Link */}
        <div className="absolute top-6 left-6">
          <Skeleton width={100} height={20} borderRadius={6} />
        </div>

        {/* Auth Form Box */}
        <div className="w-full max-w-md bg-white rounded-2xl p-8 border border-gray-200/80 shadow-md flex flex-col gap-5">
          <div className="flex flex-col items-center text-center gap-2 mb-2">
            <Skeleton circle width={48} height={48} className="mb-1" />
            <Skeleton width={200} height={26} borderRadius={8} />
            <Skeleton width={260} height={16} borderRadius={6} />
          </div>

          {/* Input Fields */}
          <div className="space-y-4">
            <div>
              <Skeleton width={80} height={14} borderRadius={4} className="mb-2" />
              <Skeleton height={44} borderRadius={10} />
            </div>
            <div>
              <Skeleton width={80} height={14} borderRadius={4} className="mb-2" />
              <Skeleton height={44} borderRadius={10} />
            </div>
          </div>

          {/* Action Button */}
          <Skeleton height={46} borderRadius={10} className="mt-2" />

          {/* Social Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1"><Skeleton height={1} /></div>
            <Skeleton width={30} height={12} />
            <div className="flex-1"><Skeleton height={1} /></div>
          </div>

          {/* Google Button */}
          <Skeleton height={44} borderRadius={10} />
        </div>
      </div>
    </SkeletonTheme>
  );
}

// Smart Route-matching Skeleton Selector
export default function PageSkeleton({ variant, message }) {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';

  // Explicit variant overrides
  if (variant === 'dashboard') return <DashboardSkeleton message={message} />;
  if (variant === 'presentation') return <PresentationEditorSkeleton message={message} />;
  if (variant === 'auth') return <AuthSkeleton message={message} />;
  if (variant === 'landing') return <LandingSkeleton message={message} />;

  // Auto-detect based on current URL path
  if (path.startsWith('/presentation/') || path.startsWith('/present/')) {
    return <PresentationEditorSkeleton message={message} />;
  }
  if (path === '/dashboard' || path === '/testimonials') {
    return <DashboardSkeleton message={message} />;
  }
  if (path === '/login' || path === '/register' || path === '/forgot-password' || path === '/reset-password' || path === '/verify-email' || path === '/verify-otp') {
    return <AuthSkeleton message={message} />;
  }

  // Default to Landing Skeleton for root `/` and general pages
  return <LandingSkeleton message={message} />;
}

export const InitPageSkeleton = PageSkeleton;

