export default function Card({ elevated = false, className = '', children, ...props }) {
  return (
    <div
      className={`bg-surface text-ink rounded-lg border border-hairline p-6 ${
        elevated ? 'shadow-[var(--shadow-level-1)] border-transparent' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
