const ACCENTS = {
  primary: 'text-primary',
  sky: 'text-accent-sky',
  purple: 'text-accent-purple-deep',
  pink: 'text-accent-pink',
  orange: 'text-accent-orange',
  teal: 'text-accent-teal',
  green: 'text-accent-green',
};

export default function Badge({ accent = 'primary', className = '', children, ...props }) {
  return (
    <span
      className={`inline-flex items-center bg-surface ${ACCENTS[accent]} text-xs font-semibold tracking-wide rounded-full px-2 py-1 ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
