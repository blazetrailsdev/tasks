---
title: "api-compare: key ts-api cache on extractor output-schema version so new fields (e.g. calls) bust stale entries"
status: ready
updated: 2026-06-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The api-compare TS extractor caches per-package method manifests in a shared
cross-worktree store (`scripts/api-compare/output/ts-api-cache`, see done
stories `api-compare-shared-worktree-cache` / `api-compare-shared-cache-eviction`).
The cache key does NOT incorporate the _output schema_ the extractor emits, so
when a new per-method field is added — most recently `"calls"` (the RFC 0044
call-set dimension) — previously-cached entries are served verbatim WITHOUT the
new field. The extractor only re-runs for packages whose source changed.

Observed during PR #4020: a fresh local `pnpm api:compare` analyzed only the
activerecord call-pairs (`Calls (advisory): 2591 matched pairs`) because every
non-AR package (activesupport, rack, trailties, actionpack, …) served a stale
cached manifest lacking `"calls"`. CI — which builds a fresh cache — analyzed
the full surface (`5354 matched pairs`). The local `lint-call-mismatches.ts`
gate therefore reported the inverse of reality (12 phantom "stale" baseline
entries that actually still flag in CI), and a blind `--write` would have
deleted real baseline rows, turning a 1-NEW failure into 13-NEW. Only
`API_COMPARE_FORCE=1 pnpm exec tsx scripts/api-compare/extract-ts-api.ts`
recovered fidelity.

This is a correctness trap for any future story that adds an extractor output
field: the gate can be silently false-green locally on stale caches.

## Acceptance criteria

- The ts-api-cache (and the analogous ruby-api cache if it shares the flaw)
  cache key includes an extractor output-schema/version token, bumped whenever
  a new per-method field (`calls`, future dimensions) is added, so stale entries
  missing the field are evicted automatically — no `API_COMPARE_FORCE=1` needed.
- A regression guard: extracting with an older schema token does not serve
  entries to a newer comparator (or the comparator detects missing fields and
  forces re-extraction for those packages).
- Document the version-bump step next to the extractor field definitions.
