import { Sparkles } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = true, message = "Loading Presento..." }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4 animate-fadeIn">
      <div className="relative flex items-center justify-center">
        {/* Pulsing Outer Ring */}
        <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        {/* Center Brand Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
          <Sparkles className="h-5 w-5 animate-pulse" />
        </div>
      </div>
      {message && (
        <p className="text-gray-500 font-bold text-xs tracking-wider uppercase">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
