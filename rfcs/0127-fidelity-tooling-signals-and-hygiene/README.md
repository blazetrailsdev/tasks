---
rfc: "0127-fidelity-tooling-signals-and-hygiene"
title: "Fidelity verification tooling — new signals, guards, and ratchet hygiene"
status: draft
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
  - "0126-fidelity-tooling-continuation"
  - "0025-fidelity-verification-tooling"
  - "0108-call-gate-false-positives"
  - "0120-extra-surface-gating-rollout"
  - "0121-internal-tag-accounting"
priority: 6
---

# RFC 0127 — Fidelity verification tooling: new signals, guards, and ratchet hygiene

## Summary

The lower-priority half of the 2026-08-27 split of RFC 0126. RFC 0126 was
carved out of `0025-fidelity-verification-tooling` earlier the same day as one
honest dimension — "make the fidelity tooling see and score what it currently
misses" — and immediately turned out to be too big to schedule against: 86
open stories, 10,235 est-LOC, no story-level `priority` set, so the ready
queue served them in arbitrary order.

The split is on **priority, not subject**. RFC 0126 keeps every story whose
deliverable changes a verdict the tooling emits on today's `main` — a parity
number, a baseline row, a gate result that is wrong right now. This RFC takes
everything else: measurement dimensions that do not exist yet, guards against
failure modes that have not fired, ratchet/reseed/report mechanics, baseline
and register hygiene, CI-cost and ergonomics work, and docs.

Carried in at creation, less one story returned to 0126 on 2026-08-27:
**41 stories, 4,820 est-LOC** (4 stories unsized).

## Charter

A tooling story belongs here when **no number, row, or verdict on today's
`main` changes value when it lands**. That is the whole test, and it is
answerable from the story body alone: if the body cannot point at a specific
measured falsehood — a matched count that credits a non-port, a baseline row
that can never converge, a `gate-mismatch` that should be zero and is not, a
green ratchet that verified nothing — the story is this RFC's.

Concretely, the shapes that land here:

- **New measurement dimensions and detectors.** Visibility parity, raise-message
  parity, an arity ratchet, `Mirrors:` anchor integrity,
  dead-shim / dead-override / unwired-override detection, a deliberate-gate
  deviation marker. Each adds a signal the toolchain does not emit today; none
  changes what an existing signal says.
- **Guards against latent failures.** Manifest truncation and staleness guards,
  the worker-dispatch TDZ hazard in `extract-ts-api.ts`, entity-level fields in
  the extractor cache token, cache-key wiring tests, the schema-compare
  baseline encoding check, the `included do extend X end` extractor split whose
  heuristic is still right over today's corpus. The verdicts are correct now;
  these keep them correct.
- **Ratchet, reseed and report mechanics.** Package-scoped assertion reseed,
  stable reseed ordering, assertion report mode, the hard-gate pricing spike,
  the `parity:api:build` rollout (`api-build-*`), receipt-shape validation.
- **Register and baseline hygiene.** Triage of generic-seed baseline reasons,
  stale lint-allowlist and unported-file entries, `parity:query` known-gap
  drift, `TS_ALWAYS_ALLOWED` reasons, the recorded `get#{Name}` decision.
- **CI cost, ergonomics, and docs.** Single-rule ESLint configs, inert-rule
  registration, `lint:rewritten`, the pre-PR checklist, restored rationale
  comments, positional-parameter cleanup.

## Out of scope (and where it lives instead)

- **Anything that corrects a verdict the tooling emits today** — RFC
  `0126-fidelity-tooling-continuation`. If a story's first paragraph says a
  faithful port is scored as missing / novel / a dropped call, or a divergence
  is scored as a match, or a gate is red for faithful code or green for
  unfaithful code, it is 0126's regardless of which script it touches. The
  extractor and comparator defects (`api-compare-*`, `extract-*`,
  `extractor-*`, `compare-*`, `credit-*`, `gate-extractor-*`,
  `test-compare-*` collisions, the call-gate blind spots and false-positive
  classes) all live there.
- **Port-convergence work** — a deliverable under `packages/**` — stays in
  0025 or `0023-surfaced-deviations`, as 0126's charter already says.
- **Extra-surface enrollment and gating rollout** — RFC 0120.
- **`@noRailsEquivalent` / privates-manifest accounting** — RFC 0121.
- **Call-argument descriptor grammar** — RFC 0099 / 0095.

The one-line test for a claimer filing a new tooling story: **does a committed
number, row, or verdict change value when this lands?** Yes → 0126. No → here.

## Rollout

No phase gating; the stories are independent and parallel-safe. Story-level
`priority` (markdown-owned frontmatter) was set at the split, in tiers 6–10 so
that every story here sorts behind RFC 0126's tiers 1–5 in the global ready
queue, on this order:

1. **Detectors for bug classes that have already shipped as real bugs**
   (`detect-dual-spelling-dead-overrides`, `detect-dead-rails-name-duplicate-shims`,
   `detect-ported-adapter-overrides-never-wired-to-the-class`) and the
   receipt-shape validator, which is what keeps the `CONVERGEABLE` ledger
   honest.
2. **New dimensions that CLAUDE.md already mandates and nothing measures**
   (visibility, raise-message; the arity ratchet).
3. **Guards whose failure mode is silent** (manifest truncation, Ruby-manifest
   staleness, the worker-dispatch TDZ).
4. Ratchet mechanics, hygiene, and ergonomics, roughly by est-LOC ascending.

`add-visibility-parity-gate` depends on 0126's
`extract-ts-api-stamp-mixin-section-visibility` (a plain `deps` story id —
cross-RFC edges use the story id, never `deps-rfc`).

## Notes for claimers

Every carried story was audited on 2026-08-27 for premise survival, but the
same drift caveats as 0126 apply — **re-derive numeric claims before starting**:

- RFC 0084 folded `call-mismatches-wide-exclude/` into the single
  `call-mismatches-exclude/` tree. The four `api-build-*` stories, the two
  reseed-ordering stories and `triage-generic-seed-wide-baseline-by-call-cluster`
  all cite the wide tree and need re-expressing against the merged one.
- `conventions.ts`, `types.ts`, `shared-cache.ts` and `write-json-manifest.ts`
  moved from `scripts/api-compare/` to `scripts/parity/`.
- `scripts/api-compare/extra-surface-allow.json` no longer exists (RFC 0080);
  `extra-surface-fold-ts-always-allowed` is phrased against it and must be
  re-expressed against `@noRailsEquivalent` receipts.

## Changelog

- 2026-08-27: created by splitting RFC 0126 on priority; 42 stories / 4,820
  est-LOC carried here, 44 / 5,415 kept in 0126.
- 2026-08-27: parked as `draft` — the lower-priority half stays out of the ready
  queue until RFC 0126 (measurement correctness) has burnt down.
- 2026-08-27: `parity-api-compares-parameter-names-beside-arity` moved to RFC
  0126 at the owner's direction; 41 stories remain.
