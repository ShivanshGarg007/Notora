// src/lib/utils.js
/**
 * A simple `cn(…)` function that joins truthy class names.
 * You can swap this out for `clsx` or any other utility if you prefer.
 */
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
