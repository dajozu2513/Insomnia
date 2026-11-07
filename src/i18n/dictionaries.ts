import { en } from './en';
import { es } from './es';
import type { Dictionary, Lang } from './types';

/** Indexed by Lang, so adding a language to LANGS without a dictionary fails to compile. */
export const dictionaries: Record<Lang, Dictionary> = { es, en };
