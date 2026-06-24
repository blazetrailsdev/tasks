---
title: "Widen-calls significant-set knob + ratcheting baseline"
status: ready
updated: 2026-06-24
rfc: "0047-widen-call-set-parity-all-ported"
cluster: infra
deps: []
deps-rfc: []
est-loc: 140
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0044's `call-mismatches-exclude.json` ratchet (PR #4009) gates the advisory
calls dimension over the **narrow** `SIGNIFICANT_CALLS` allowlist only. This
RFC widens the population by admitting _all_ ported method names as
"significant" (every Ruby call name except `super`). The audit produced that
wide population with a throwaway env-gated edit to `compare.ts`'s `checkCalls`
(passing a `{ has: k => k !== "super" }` set as the `significant` argument to
`significantMissingCalls`, compare.ts ~line 1305). That edit was reverted — this
story promotes it into a first-class, opt-in knob plus its own ratcheting
baseline so the wide burndown has somewhere to record confirmed behavioral
equivalents and CI fails on new unexplained wide flags.

Key code:

- `scripts/api-compare/compare.ts:129` `significantMissingCalls(...,
significant = SIGNIFICANT_CALLS)` — the `significant` param is already the
  widening seam; no core-logic change needed.
- `scripts/api-compare/compare.ts:~1305` `checkCalls` — call site that today
  always uses the default narrow set.
- `scripts/api-compare/lint-call-mismatches.ts` +
  `scripts/api-compare/call-mismatches-exclude.json` — the existing
  only-shrink ratchet to mirror for the wide artifact.

Wide population to gate (regenerate with the knob enabled): activerecord 1834
flagged pairs / 5273 rows, arel 336 / 473, activemodel 218 / 378. Almost all
are bucket (b) equivalents or bucket (c) noise (see RFC README) — the baseline
seeds large and shrinks as the three convergence stories land.

## Acceptance criteria

- An opt-in widening knob for the calls check (e.g. `--wide-calls` flag or
  `API_COMPARE_WIDE_CALLS=1`) that swaps the `significant` set for
  "all ported names except `super`", writing a **separate** artifact
  (e.g. `output/call-mismatches-wide.json`) so the narrow 0044 gate and
  artifact are untouched.
- A `call-mismatches-wide-exclude.json` baseline keyed by
  `package + tsFile + rubyName + call`, each entry carrying a one-line `reason`,
  seeded from the current wide population's bucket-(b)/(c) entries (the audit's
  triaged equivalents/noise).
- An only-shrink lint check (mirroring `lint-call-mismatches.ts`) that fails on
  any wide flag not in the baseline and on stale baseline entries.
- Wired into CI alongside the existing api-compare checks; documented in the
  `compare.ts` header next to the calls-dimension note and the
  `SIGNIFICANT_CALLS` comment.

## Out of scope

- Fixing/converging any flagged entry — that is the per-cluster stories.
- Changing `SIGNIFICANT_CALLS` or the narrow `call-mismatches-exclude.json`.
