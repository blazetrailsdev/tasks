---
title: "Emit call-set/call-args parity stats per package, not only package='all'"
status: draft
updated: 2026-08-13
rfc: "0097-parity-output-sharding"
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

PR #6466's scoreboard audit: `api_calls_stats` and `api_call_args_stats` in
stats.db carry a single row per merge with `package='all'` (verified over the
full 2026-06-24 → 2026-08-12 history). The other three parity tables are
per-package. Consequence: per-package convergence on the RFC 0047 call-set and
RFC 0095 call-args gates is not measurable from the scoreboard — the audit had
to approximate in-scope share from `call-mismatches-exclude/` row counts
(1,946 rows, 1,307 in the AR closure) instead of from the stats feed.

The compare already knows the package for every mismatch (rows in
`call-mismatches-exclude/<pkg>/…` are keyed by package; the lint reads
`call-mismatches.json` from `compare.ts --calls`). The stats emitter just
aggregates before writing.

## Acceptance criteria

- The call-set and call-args stats emit one row per package per merge
  (keeping or replacing the `all` rollup — sync consumer's choice, documented).
- Backfill is out of scope; forward-only is fine.
