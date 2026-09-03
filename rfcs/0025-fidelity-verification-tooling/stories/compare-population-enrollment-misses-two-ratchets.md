---
title: "Enrolling a gem in the compare population silently misses two population-keyed ratchets"
status: draft
updated: 2026-09-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Enrolling a gem in the compare population is a two-list edit in the story
prose (`MANIFEST_PACKAGES`, the test-compare `pkgDirs`) but a four-list edit in
reality: two further registries are keyed by that population and treat an
absent package as a FAILURE rather than a no-op. Both reds land in CI, after
every local `parity:*` gate has passed, because both are enforced by jobs that
run the whole population rather than by the compare commands themselves.

PR #7459 (rack-test, RFC 0137) hit both:

- `scripts/test-compare/lint-assertion-mismatches.ts` — refuses an unmarked
  package outright: "1 package(s) are absent from
  `scripts/test-compare/assertion-mismatch-mark.json`. An unmarked package
  would let its whole assertion debt in unmeasured." Red in the
  `Rails API/Test Comparison` job.
- `scripts/api-compare/lint-ruby-compat-calls.ts:88-96` — `ENROLLED_PACKAGES`
  is asserted equal to `PACKAGES` by
  `scripts/api-compare/lint-ruby-compat-calls.test.ts:39`, so a new compare
  package fails that test until it joins. Red in the `Unit Tests` job.

Neither is discoverable from the enrollment story's own checklist, and neither
`pnpm parity:api` nor `pnpm parity:test` mentions them — the only signal is a
red CI round. rack-session (RFC 0133) predates the assertion ratchet and the
whole-population `ENROLLED_PACKAGES` assertion, so its enrollment PR is not a
precedent that would have warned the next one.

This is the compare-population sibling of
`make-new-package-registration-self-maintaining`, which covers the Website /
Guides typecheck registries for a new WORKSPACE package. Different registries,
different trigger (a `vendor/sources.ts` entry, not a `packages/` directory),
so it is filed separately rather than folded in.

## Acceptance criteria

- [ ] A package present in `apiComparePackages()` / the test-compare package
      list but absent from `assertion-mismatch-mark.json` or
      `ENROLLED_PACKAGES` is reported by a LOCAL command a story author already
      runs — either `pnpm parity:api` / `pnpm parity:test` printing the gap, or
      a single `pnpm parity:enroll:check`-style verb the enrollment checklist
      names.
- [ ] The message names the file and the exact edit, as the assertion ratchet's
      does today.
- [ ] Either the CLAUDE.md "Before you open the PR" list or the RFC 0137/0133
      enrollment-story template names the full four-list set, so the next gem
      port does not rediscover it.
- [ ] No registry is made optional or auto-seeded to satisfy this: a zero row
      is still a reviewed edit, since the row IS the measurement enrollment.
