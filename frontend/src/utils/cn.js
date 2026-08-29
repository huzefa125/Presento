import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind class names; later/consumer classes win on conflict.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
