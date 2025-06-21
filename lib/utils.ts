import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Core utility for combining class names with Tailwind CSS
 * Handles conditional classes, removes duplicates, and resolves conflicts
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}