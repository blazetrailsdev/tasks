---
title: "api:extra red on main: stale @noRailsEquivalent tag on NullConfig after #5462"
status: closed
updated: 2026-07-28
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already fixed on main: commit 638ff0bb0 dropped the stale @noRailsEquivalent block on NullConfig (connection-pool.ts:59-68 now carries only the Mirrors: line)."
---

## Context

`pnpm api:extra` fails on `main`:

```text
extra-surface: 1 STALE @noRailsEquivalent tag(s) on methods that no longer
flag as extra surface
  - activerecord  connection-adapters/abstract/connection-pool.ts  NullConfig
```

The tag is at
`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:59-67`,
on `export class NullConfig` (Rails nests it as `NullPool::NullConfig`,
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-22`).

It went stale when #5462 ("feat(api-compare): honor @noRailsEquivalent on class
declarations") taught the extractor to honor the tag on class declarations —
the class no longer flags as extra surface, so the tag suppressing it is now
redundant and the staleness lint fires.

Confirmed pre-existing on `main` (not introduced by #5476): the tag is present
in `git show origin/main:.../connection-pool.ts`.

## Acceptance criteria

- `pnpm api:extra` exits 0.
- Fixed by deleting the now-redundant tag next to the code (what the lint's own
  message prescribes), not by adding an allowlist entry.
- The `NullConfig` class, its `NullPool.NullConfig` static re-attachment, and
  the `Mirrors:` line stay as they are — only the stale `@noRailsEquivalent`
  block goes.
