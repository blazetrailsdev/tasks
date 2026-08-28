---
rfc: "0126-fidelity-tooling-continuation"
title: "Fidelity verification tooling — continuation: what the extractors and comparators still cannot see"
status: active
created: 2026-08-27
updated: 2026-08-27
owner: "@deanmarano"
packages:
  - activemodel
  - activerecord
  - activesupport
  - arel
clusters:
  - api-compare
  - lint
related-rfcs:
  - "0025-fidelity-verification-tooling"
  - "0108-call-gate-false-positives"
  - "0110-parity-skip-register-correctness"
  - "0120-extra-surface-gating-rollout"
  - "0121-internal-tag-accounting"
priority: 2
---

# RFC 0126 — Fidelity verification tooling, continuation

## Summary

The active successor to `0025-fidelity-verification-tooling`. RFC 0025 has been
`postponed` since its five original tools were scoped, and `effectiveStoryStatus`
downgrades every `ready` story under a non-`active` parent to `draft` — so 116
open stories, almost all of them live defects in the parity toolchain, were
unreachable from the ready queue. This RFC carries the schedulable ones and is
`active`; RFC 0025 keeps the remainder and stays parked.

This follows the split precedent set by RFC 0108 (call-gate false positives),
RFC 0110 (skip-register correctness) and RFC 0120 (extra-surface gating): pull a
coherent slice out of 0025 so it can actually be worked.

## Charter

One dimension: **make the fidelity tooling see and score what it currently
misses**. A story belongs here when its deliverable is a change to the
verification machinery itself —

- `scripts/api-compare/**` and `scripts/parity/**` — the Ruby and TS extractors,
  the comparator, the call/arity/assertion sub-reports, `parity:api:build`
- `scripts/test-compare/**` — test and gate extraction, the assertion ratchet
- `scripts/build-rails-*-manifest.ts` and the generated-manifest ESLint rules
  they feed
- the baselines, marks and ratchets those tools write, and their staleness and
  truncation guards

— and its effect is that a real Rails/trails divergence stops being invisible,
or a false mismatch stops costing an agent a round of analysis.

## Out of scope (and where it lives instead)

Deliberately **not** carried from 0025:

- **Port-convergence work** — stories whose deliverable is a change under
  `packages/**` (autosave describe moves, arel assertion shapes, XmlMini layout,
  TimeZone table verification, vendoring i18n). They are fidelity work but not
  tooling work; they stay in 0025 or belong in `0023-surfaced-deviations`.
- **Extra-surface enrollment and gating** — owned by RFC 0120. `GATED_PACKAGES`
  is already `["arel", "activerecord"]` on `main`; scoring-correctness stories
  are carried here, rollout stories are not.
- **`@noRailsEquivalent` / privates-manifest accounting** — owned by RFC 0121.
- **Call-argument descriptor grammar** — owned by RFC 0099 / 0095.
- **Repo infrastructure that is not fidelity measurement** — the `tasks` CLI,
  `sync-stats`, website ESLint ignores, new-package registration, CI job-filter
  drift guards.

## Rollout

No phase gating: the carried stories are independent defects in distinct files
and are parallel-safe. Order by the existing `priority` where set, otherwise by
what unblocks measurement first — extractor correctness before the ratchets and
triage campaigns that consume its output.

## Notes for claimers

Every carried story was audited against `trails` `origin/main` on 2026-08-27 for
premise survival, but **numeric claims in bodies have drifted** and must be
re-derived before work starts:

- RFC 0084 folded `call-mismatches-wide-exclude/` into the single
  `call-mismatches-exclude/` tree. Any body citing the wide tree, a file inside
  it, or a row count against it is stale — `triage-generic-seed-wide-baseline-by-call-cluster`
  re-counted 1,637 rows / 1,115 generic-seed against the original 5,101 / 4,871.
- `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
  moved from `scripts/api-compare/` to `scripts/parity/`. Bodies citing the old
  path with a line anchor need the anchor re-derived.
- `scripts/api-compare/extra-surface-allow.json` no longer exists (RFC 0080).

## Changelog

- 2026-08-27: created; 86 open stories carried from RFC 0025, which stays
  `postponed` with 32 open stories (port-convergence, infra, and slices owned by
  RFCs 0099/0110/0120/0121).
