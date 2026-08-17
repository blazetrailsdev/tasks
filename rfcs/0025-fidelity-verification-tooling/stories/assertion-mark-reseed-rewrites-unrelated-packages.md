---
title: "assertion-mismatch mark reseed silently ratchets packages the PR never touched"
status: draft
updated: 2026-08-06
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Hit while enrolling `date` in `parity:test` (#6148).

Seeding one new package into `scripts/test-compare/assertion-mismatch-mark.json`
requires `pnpm parity:test:assertions:reseed`, which rewrites **every** package's
counters, not just the one being added. On #6148 the reseed also silently
ratcheted `activerecord` down from `{1987, 4069, 54}` to `{1977, 4060, 51}` —
movement earned by a sibling agent's convergence that this PR had nothing to do
with. It was caught only because the diff was read by hand and reverted.

That is the same failure mode `wide-ratchet-reseed-rewrites-unrelated-files`
(done, RFC 0025) fixed for the wide call-mismatch reseed. This ratchet did not
get the same treatment.

Why it matters beyond tidiness: the counters are only-shrink, so an unintended
tightening is not inert. It pins a sibling branch mid-flight to a high-water mark
earned on a different branch, reddening CI there for work its author did not do —
and the tightening rides in on a PR whose reviewer has no reason to look at
another package's numbers.

Relevant code:

- `scripts/test-compare/assertion-ratchet.ts:126` — `nextMark` walks every
  package in the artifact and takes `Math.min` per counter.
- `scripts/test-compare/lint-assertion-mismatches.ts` — the `--write` entry point
  (`pnpm parity:test:assertions:reseed`).
- `scripts/api-compare/lint-call-mismatches.ts` — the wide ratchet, for the
  already-solved shape to mirror.

## Acceptance criteria

- [ ] `--write` accepts a package scope (e.g. `--package <name>`), and with it
      set, every other package's counters are written back byte-identical.
- [ ] Unscoped `--write` keeps its current whole-tree behaviour — this is about
      making the scoped reseed possible, not removing the global one.
- [ ] Seeding a package absent from the mark file works under the scoped flag,
      since that is the case that forces a reseed today.
- [ ] A test covers the regression directly: reseed scoped to package A against
      an artifact where package B has also shrunk, and assert B's row is
      unchanged.
- [ ] The `parity:test:assertions:reseed` script entry and any contributor doc
      that names it point at the scoped form as the default advice.

## Re-verified 2026-08-17 (draft sweep)

Still valid. `scripts/test-compare/lint-assertion-mismatches.ts` has no
`--package` flag (3 incidental `package` matches, none a CLI scope), so a reseed
still rewrites every package's counters.
