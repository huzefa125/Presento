export default function LoadingSpinner({ fullScreen = true, message = "Loading..." }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
      {message && <p className="text-gray-400 text-sm">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

