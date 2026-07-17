export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full bg-surface text-ink text-[15px] border border-[#dddddd] rounded-xs px-3 py-2.5 outline-none transition-shadow duration-150 placeholder:text-ink-faint focus:shadow-[var(--shadow-level-1)] focus:border-primary ${className}`}
      {...props}
    />
  );
}
