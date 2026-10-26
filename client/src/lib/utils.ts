import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cloudinary serves a resized WebP/AVIF when the transform is in the URL;
// originals are ~4x heavier. Non-Cloudinary URLs pass through untouched.
export function thumb(url: string | undefined, width = 600) {
  return url?.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width},c_limit/`)
}
