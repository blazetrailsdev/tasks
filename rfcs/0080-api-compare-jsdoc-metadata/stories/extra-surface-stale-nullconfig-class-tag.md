---
title: "extra-surface-stale-nullconfig-class-tag"
status: closed
updated: 2026-07-28
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded: fixed in PR 5467 (the stale tag became prose on the same declaration)"
---

## Context

`pnpm api:extra` fails on `main` with one STALE `@noRailsEquivalent` tag:

    activerecord  connection-adapters/abstract/connection-pool.ts  NullConfig

The tag sits on the `NullConfig` CLASS declaration
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:62`)
and argues that Rails nests the class inside `NullPool`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:14-22`),
so TS exports it as a sibling re-attached as `NullPool.NullConfig`.

It is stale because `collectTsFileNames` (scripts/api-compare/extra-surface.ts)
builds the extra set from MEMBER names only, so the static
`NullPool.NullConfig` no longer flags — the tag can never match. This was
observed while working
`extra-surface-skip-duck-typed-interface-members`, which is scoped to the
duck-typed-interface population and deliberately left this class alone.

## Acceptance criteria

- Decide whether the class tag should be deleted (the message's prescription)
  or whether the nested-class-as-static shape should keep flagging as extra
  and the tag kept matching.
- `pnpm api:extra` exits 0 with no stale tags.
