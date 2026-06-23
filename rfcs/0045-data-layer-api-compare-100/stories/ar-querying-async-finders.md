---
title: "ar-querying-async-finders"
status: draft
updated: 2026-06-23
rfc: "0045-data-layer-api-compare-100"
cluster: ar-config
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

`packages/activerecord/src/querying.ts` (109/119, 10 miss) is missing the
delegated finders Rails declares in
`vendor/rails/activerecord/lib/active_record/querying.rb:16-21`
(`delegate … to: :all`): `extract_associated`, `except`, `calculate`,
`async_count`, `async_average`, `async_minimum`, `async_maximum`, `async_sum`,
`async_pluck`, `async_pick`. These same names also surface as misses on
`base.ts` (resolved transitively by the `ar-base-core-model-schema-config`
story, which depends on this one).

`extract_associated`/`except`/`calculate` delegate to Relation; the `async_*`
finders run the calculation on a background-job/thread pool in Rails. trails may
implement the sync finders already (so the delegation name is the gap) but the
`async_*` family likely has no thread-pool equivalent.

## Acceptance criteria

- `extract_associated`, `except`, `calculate` exposed as class-level delegations
  to `all` (the Relation), matching Rails — or skip-listed if already reachable
  under another name.
- `async_*` finders ported (if trails has an async query path) or added to a
  `SKIP_GROUPS` entry with reason ("Rails async finders use a thread-pool /
  ActiveJob path with no trails equivalent").
- `pnpm api:compare --package activerecord` shows querying.ts at 100%.
