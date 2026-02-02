import { writable } from 'svelte/store';
import type { Language, MultilingualText } from '../types';

// Global language store
export const language = writable<Language>('es');

// Helper function to get text in current language
export function t(obj: MultilingualText | undefined, lang: Language): string {
  if (!obj) return '';
  const val = obj[lang] ?? obj['en'] ?? '';
  return Array.isArray(val) ? val.join('\n') : val;
}

// Translate to list of strings (for multiple paragraphs)
export function tl(obj: MultilingualText | undefined, lang: Language): string[] {
  if (!obj) return [];
  const val = obj[lang] ?? obj['en'] ?? [];
  return Array.isArray(val) ? val : [val];
}
