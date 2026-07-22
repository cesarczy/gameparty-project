const PROFANITY_WORDS = [
  'porra',
  'caralho',
  'merda',
  'buceta',
  'puta',
  'viado',
  'fdp',
  'desgraça',
  'desgraca',
  'cu',
  'bosta',
  'cacete',
  'arrombado',
  'babaca',
  'otario',
  'otário',
  'idiota',
  'imbecil',
  'retardado',
];

const pattern = new RegExp(`\\b(${PROFANITY_WORDS.join('|')})\\b`, 'gi');

export function filterProfanity(text: string): string {
  return text.replace(pattern, (match) => '*'.repeat(match.length));
}

export function containsProfanity(text: string): boolean {
  return pattern.test(text);
}
