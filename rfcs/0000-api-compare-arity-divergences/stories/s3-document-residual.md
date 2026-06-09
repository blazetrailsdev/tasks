---
title: "Document the convention-noise residual ledger"
status: draft
updated: 2026-06-09
rfc: "0000-api-compare-arity-divergences"
cluster: api-compare-arity-divergences
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

After the genuine divergences are fixed (s1, s2), the bulk of the 171-mismatch
non-arel residual remains — and is _expected_. It is the unavoidable cost of the
port's conventions: ivar-state spelled positionally, kwargs collapsed to an
options object, receivers spelled positionally, blocks ported as callbacks, and
Ruby/TS extractor limitations. PR #3045 already established this at a bucket
level; this story commits a **per-method verdict ledger** so a future audit reads
the verdict instead of re-deriving it from scratch.

Per the RFC's design decision, the arity **heuristic is not changed** and no
`ARITY_OVERRIDES` entries are added — the noise is recorded in prose so the
advisory signal stays complete (a future regression in any of these methods still
shows up).

## Acceptance criteria

- [ ] A markdown ledger lives under `scripts/api-compare/` (e.g.
      `arity-residual.md`) listing every non-arel arity mismatch with: package,
      method, Ruby sig, TS sig, bucket, and a one-line justification.
- [ ] Buckets match the RFC's taxonomy: ivar-state→positional, kwargs→options,
      receiver, block/callback, Ruby-side extractor miss, structural/native-equivalent,
      genuine (cross-referenced to s1/s2).
- [ ] The doc states explicitly that these are advisory and expected, names the
      `this`-mixin convention (`CLAUDE.md`) as the cause of the dominant bucket,
      and points at the #3045 extractor-level follow-ups (capture TS param types)
      as the only principled way to absorb them — explicitly out of scope here.
- [ ] No change to `arity.ts`, `compare.ts`, `conventions.ts`, or any heuristic
      code. Docs-only (exempt from the LOC ceiling).

## Notes

- Generate the raw list with `pnpm api:compare --arity` →
  `scripts/api-compare/output/arity-mismatches.json` (exclude the 132 arel
  `visitors/**` rows owned by RFC 0017-arel-collector-threading).
- This is the canonical answer to "why are there N advisory arity mismatches?" so
  future agents don't re-audit. Keep it terse and table-driven.
- Do last (depends on s1/s2 having settled the genuine vs noise split).
