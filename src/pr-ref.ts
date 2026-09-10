/**
 * A PR reference, always qualified by repo: `trails#7228`, `tasks#94`,
 * `trailmap#22`, `tasks-legacy#28`.
 *
 * `pr` was a bare integer while every stamped PR was a trails PR. It stopped
 * being true: tasks and trailmap PRs started closing stories, and their small
 * numbers collide with each other and with tasks-legacy's (`tasks#25`,
 * `trailmap#20` and `tasks-legacy#28` were all sitting in the column as bare
 * `25`, `20`, `28`, indistinguishable from trails PRs). A bare number is
 * refused rather than defaulted to trails, because guessing is exactly how the
 * collision got in.
 *
 * The repo is the bare repo name under the blazetrailsdev org — the shape
 * already used in prose across the backlog (`trails#7069`).
 */
export const PR_REF_RE = /^([a-z0-9][a-z0-9._-]*)#([1-9]\d*)$/;

export interface PrRef {
  repo: string;
  number: number;
}

export function parsePrRef(value: string): PrRef | null {
  const m = PR_REF_RE.exec(value.trim());
  return m ? { repo: m[1], number: Number(m[2]) } : null;
}

/** Normalized text form, or null when `value` is not a valid `repo#N`. */
export function normalizePrRef(value: string): string | null {
  const ref = parsePrRef(value);
  return ref ? `${ref.repo}#${ref.number}` : null;
}

export const PR_REF_USAGE = "--pr takes repo#N, e.g. trails#7228 or tasks#94";
