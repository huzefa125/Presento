const VARIANT_CLASSES = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-active active:scale-90 rounded-full',
  secondary:
    'bg-surface text-ink border border-hairline shadow-[var(--shadow-level-1)] hover:bg-canvas-soft active:scale-90 rounded-full',
  utility:
    'bg-surface text-ink border border-hairline hover:bg-canvas-soft rounded-md',
  ghost:
    'bg-transparent text-ink-secondary hover:bg-canvas-soft rounded-md',
};

const SIZE_CLASSES = {
  md: 'px-6 py-2.5 text-base',
  sm: 'px-3.5 text-sm py-1',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
