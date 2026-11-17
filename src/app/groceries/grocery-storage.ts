import { Grocery } from './grocery.model';

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;
export const MAX_NAME_LENGTH = 100;

interface StoredGroceryCandidate {
  readonly id?: unknown;
  readonly name?: unknown;
  readonly quantity?: unknown;
  readonly done?: unknown;
}

/**
 * Reads back the list stored in localStorage without trusting it: the data
 * may come from an older version of the app (missing field) or have been corrupted.
 * An entry without a usable name is discarded; the other fields are repaired.
 */
export function parseStoredGroceries(raw: string | null): Grocery[] {
  const parsed = safeJsonParse(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry: unknown) => {
    const grocery = toGrocery(entry);
    return grocery ? [grocery] : [];
  });
}

function safeJsonParse(raw: string | null): unknown {
  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toGrocery(entry: unknown): Grocery | null {
  if (typeof entry !== 'object' || entry === null) {
    return null;
  }

  const candidate = entry as StoredGroceryCandidate;
  const name = toName(candidate.name);

  if (!name) {
    return null;
  }

  return {
    id: typeof candidate.id === 'string' && candidate.id ? candidate.id : crypto.randomUUID(),
    name,
    quantity: toQuantity(candidate.quantity),
    done: candidate.done === true,
  };
}

function toName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, MAX_NAME_LENGTH);
}

function toQuantity(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return MIN_QUANTITY;
  }

  return Math.min(Math.max(Math.round(value), MIN_QUANTITY), MAX_QUANTITY);
}
