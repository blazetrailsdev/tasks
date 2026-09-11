---
title: "Delete the deprecated Base.adapter getter Rails has no counterpart for"
status: in-progress
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 10
pr: trails#7685
claim: "2026-09-11T01:02:41Z"
assignee: "delete-deprecated-base-adapter-getter"
blocked-by: null
closed-reason: null
---

## Context

trails#7679 deleted `Base.adapter=` and `_adapter`, but the deprecated reader
`static get adapter()` (`packages/activerecord/src/base.ts`, `/** @deprecated */`,
body `return this.connection;`) survives. Rails has no `ActiveRecord::Base.adapter`
at all; the only readers are `connection` / `lease_connection` / `with_connection`
(`vendor/rails/activerecord/lib/active_record/connection_handling.rb:269-311`).

Remaining readers: `packages/activerecord/src/test-fixtures.test.ts` (~30 `Base.adapter`
reads, including `connection: () => Base.adapter` fixture options), and any
`Model.adapter` read elsewhere (grep `\.adapter\b` on model classes).

## Converged shape

Delete the getter. Callers use `Base.connection` (the Rails deprecated reader) or
`await Base.leaseConnection()`, exactly as the Rails tests call
`ActiveRecord::Base.lease_connection`.

## Acceptance criteria

- [ ] `static get adapter()` is gone from `base.ts`.
- [ ] No `Base.adapter` / `Model.adapter` model-class read remains in activerecord.
- [ ] `pnpm parity:api:extra:gate` activerecord total does not rise.
