---
title: "Enroll thor in the extra-surface ratchet and run it scoped in the thor comparison job"
status: draft
updated: 2026-10-01
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The extra-surface ratchet (`scripts/api-compare/lint-extra-surface-ratchet.ts`, marks in `extra-surface-mark.json`) gates only `GATED_PACKAGES` in `scripts/api-compare/extra-surface-mark.ts` (`arel`, `ruby-compat`, `activerecord`). `thor` is not in it, so a public TS name under `packages/trailties/src/thor/` with no counterpart in `vendor/thor/v1.3.2/lib/thor/` is reported by `parity:api:extra --package thor` and fails nothing.

Measured while implementing trails#8337: adding `export function inventedHelper(): void {}` to `packages/trailties/src/thor/actions.ts` is listed as 1 novel name by the tag-gate step and leaves both the whole-surface `rails-comparison` job and `rails-comparison-thor` green. Thor's surface is 0 novel / 0 moved today, so it can be enrolled pinned, the way `arel` is (`TAGGED_ONLY_PACKAGES`), before the port grows.

`scripts/ci/thor-comparison.sh` skips this ratchet on the premise that thor is ungated; the premise is asserted in `scripts/api-compare/scope.test.ts` and recorded in `THOR_COMPARISON_SKIPS` (`scripts/ci-suite-coverage.test.ts`), so enrolling thor reds both until the driver runs it.

## Acceptance criteria

- [ ] `thor` is enrolled in the extra-surface ratchet at zero (pinned or rowless, whichever its measured `novel` / `total` allow), with no mark raised to admit existing surface.
- [ ] `lint-extra-surface-ratchet.ts` gains a `--package` arm through `scripts/api-compare/scope.ts` (only thor's marks held against a thor-only measurement; a wider or narrower measurement refused).
- [ ] `scripts/ci/thor-comparison.sh` runs it scoped, and its entry leaves `THOR_COMPARISON_SKIPS`; `scope.test.ts`'s premise for it is removed.
- [ ] A seeded extra public name in `packages/trailties/src/thor/` reds `rails-comparison-thor` and `rails-comparison`.
