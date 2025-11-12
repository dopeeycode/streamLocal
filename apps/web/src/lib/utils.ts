import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Remove file extensions from media titles
export function cleanMediaTitle(title: string): string {
	return title.replace(/\.(mp3|wav|flac|ogg|m4a|aac)$/i, '');
}
