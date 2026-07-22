export const PROFILE_CHANGE_COOLDOWN_DAYS = 20;

export function profileChangeCooldownMs(): number {
  return PROFILE_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

export function canChangeAfter(changedAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - changedAt.getTime() >= profileChangeCooldownMs();
}

export function nextChangeAfter(changedAt: Date): Date {
  return new Date(changedAt.getTime() + profileChangeCooldownMs());
}

export const canChangeDisplayName = canChangeAfter;
export const nextDisplayNameChangeAt = nextChangeAfter;
export const canChangeEmail = canChangeAfter;
export const nextEmailChangeAt = nextChangeAfter;
