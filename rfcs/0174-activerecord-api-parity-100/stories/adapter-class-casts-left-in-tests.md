---
title: "activerecord: tests call adapterClass() quoting methods without a cast"
status: draft
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left from trails PR 8763, which typed `ConnectionHandling#adapterClass` as `typeof AbstractAdapter`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_handling.rb:338-340`) and deleted the
casts in source. Test files still reach the quoting class methods through a cast that is no longer
needed:

- `packages/activerecord/src/associations.test.ts:59` (`as unknown as { quoteTableName(n: string): string }`)
- `packages/activerecord/src/base.test.ts:1438,1442` (`as any`)
- `packages/activerecord/src/relation/quoting-via-adapter-class.trails.test.ts:19`
- `packages/activerecord/src/relation/preprocess-order-args-order-column.trails.test.ts:52-53` (`as never` on the spy target)
- `packages/activerecord/src/database-configurations/hash-config.trails.test.ts:98,106,111` (`as { name: string }`)

## Acceptance criteria

- [ ] Each cast on an `adapterClass()` result listed above is deleted and `pnpm typecheck` is clean.
- [ ] No test name changes.
