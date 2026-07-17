export default function LoadingSpinner({ fullScreen = true, message = "Loading..." }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-ink-faint/30 border-t-primary rounded-full animate-spin"></div>
      {message && <p className="text-ink-muted text-sm">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
