---
title: "parity:api:build mis-keys an order: row's migrated tag, reporting it as both STALE and NEW"
status: ready
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while migrating call-set baseline rows to `@missingRailsCall` receipts in
PR #6849 (RFC 0106 wave 5).

`parity:api:build` migrates a curated baseline row to a call-site tag. For an
ordinary row this round-trips: the flag and the tag agree on the key, so the
migrated tag suppresses exactly the flag whose row was dropped.

An **`order:` row does not round-trip**. The two sides key it differently:

- the flag is keyed on the **Ruby** name — `copy_table`, as it appears in
  `call-mismatches.json` and in the baseline row's `rubyName`;
- `parity:api:build` writes the tag onto the TS declaration and keys it on the
  **camelCased** name — `copyTable`.

So migrating one `order:` row makes the gate report the same divergence twice,
from both arms at once:

    call-mismatches ratchet: 1 STALE @missingRailsCall tag(s) whose call is no longer flagged.
      - activerecord  connection-adapters/sqlite3-adapter.ts  copyTable  order:columns,createTable

    call-mismatches ratchet: 1 NEW mismatch(es) not in the baseline.
      + activerecord  connection-adapters/sqlite3-adapter.ts  copy_table  order:columns,createTable

Reproduced on `activerecord/connection-adapters/sqlite3-adapter.json`,
`copy_table` / `order:columns,createTable`. The workaround taken in #6849 was to
leave that row baselined and record the trap in its `reason`; the six follow-up
wave stories (`wave-5b-head-sweep` … `wave-5-tail-sweep`) each repeat the
warning so the next sweep does not rediscover it.

## Converged shape

`parity:api:build` should either

- normalize the `order:` key to the Ruby name when it writes the tag, so the tag
  suppresses the flag it was migrated from; **or**
- refuse to migrate an `order:` row at all, with a message naming the keying
  asymmetry, so the row stays baselined by construction rather than by a
  reviewer noticing a red gate afterwards.

The second is the smaller change and matches how the rows are actually handled
today. Either way `pnpm parity:api:calls` must stay green across a migrate run
that includes an `order:` row.

## Acceptance criteria

- [ ] Migrating a shard containing an `order:` row leaves `parity:api:calls`
      green — no STALE tag, no NEW mismatch.
- [ ] A regression test covers the `order:` row path in `build.ts` and fails on
      the current behaviour.
- [ ] The `order:`-trap warnings in the RFC 0106 wave-5 follow-up stories can be
      dropped once this lands; note that in the PR body.
