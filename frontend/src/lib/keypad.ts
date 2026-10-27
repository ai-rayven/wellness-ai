// The text of a number typed on the in-app number pad.

export type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'backspace';

/** How many digits the text can have before and after the decimal point. */
export interface KeypadLimits {
  whole: number;
  decimals: number;
}

/** The text after `key`. A key that would break `limits` changes nothing. */
export function pressKey(text: string, key: Key, limits: KeypadLimits): string {
  if (!Number.isInteger(limits.whole) || limits.whole < 1) throw new RangeError('whole must be 1 or more');
  if (!Number.isInteger(limits.decimals) || limits.decimals < 0) throw new RangeError('decimals must be 0 or more');

  if (key === 'backspace') return text.slice(0, -1);

  const [whole, decimals] = text.split('.');
  if (key === '.') {
    if (decimals !== undefined || limits.decimals === 0) return text;
    return `${whole || '0'}.`;
  }

  if (decimals !== undefined) return decimals.length < limits.decimals ? text + key : text;
  if (whole === '0') return key;
  return whole.length < limits.whole ? text + key : text;
}
