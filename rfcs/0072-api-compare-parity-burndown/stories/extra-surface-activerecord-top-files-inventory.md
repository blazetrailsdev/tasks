---
title: "spike: inventory + classify activerecord extra-surface top-20 files"
status: ready
updated: 2026-07-25
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: ["extra-surface-reasoned-allowlist"]
deps-rfc: []
est-loc: 50
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Spike/audit (done-when-closed). The activerecord extra-surface counts are far
too large for direct stories: 793 novel / 2315 moved (`pnpm api:extra`,
2026-07-25). Top offenders:

- `connection-adapters.ts` — 48 novel, 568 moved (legacy monolith; most
  "moved" names belong in `connection-adapters/…` Rails-layout files)
- `associations.ts` — 39 novel, 171 moved
- `inheritance.ts` — 33 novel, 176 moved (novel list includes obvious
  cross-file leakage: `loadBelongsTo`, `restoreAttribute`,
  `savedChangeToAttributeValues` — suggests shared-helper files being
  re-exported and double-counted)
- `connection-adapters/abstract-mysql-adapter.ts` — 30 novel (mostly `ER_*` /
  `CR_*` error-code constants — probable allowlist-with-reason candidates)
- `relation/finder-methods.ts` — 30 novel, `relation/delegation.ts` — 25
  novel/173 moved, `base.ts` — 20/155, `postgresql-adapter.ts` — 19/149.

The job: classify each top-20 file's novel/moved names into (a) invention to
remove, (b) allowlist-with-reason, (c) misplaced port to relocate, (d)
extractor artifact (re-export double-counting — cross-check against
`project_api_compare_ts_cache_under_reports_calls` class of issues), then
register per-cluster follow-up stories with `pnpm tasks new
api-compare-parity-burndown <slug> --body-file …`, each carrying the
classified name list and file:line context so implementers don't re-derive.

## Acceptance criteria

- A written inventory (in this story body on close, or a linked audit
  report) covering at least the top-20 activerecord files by novel count,
  with per-name classification counts.
- Follow-up stories registered in this RFC for each actionable cluster, each
  with real `## Context` refs and acceptance criteria (no skeleton stubs).
- Any extractor double-counting bug found is filed as its own tooling story.
- No implementation PRs from this story itself.
