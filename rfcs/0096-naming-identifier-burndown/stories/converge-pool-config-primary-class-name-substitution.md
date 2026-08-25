---
title: "converge-pool-config-primary-class-name-substitution"
status: done
updated: 2026-08-12
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6426
claim: "2026-08-12T16:56:49Z"
assignee: "converge-pool-config-primary-class-name-substitution"
blocked-by: null
closed-reason: null
---

## Context

`PoolConfig#connection_descriptor=` (`vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb:43-50`)
builds `ConnectionDescriptor.new(connection_descriptor.name, connection_descriptor.primary_class?)` —
the class's own name, verbatim. trails
(`packages/activerecord/src/connection-adapters/pool-config.ts`, `set connectionDescriptor`)
substitutes the literal `"Base"` for the name whenever `primaryClassQ()` is true.

RFC 0096 wave 2 residue tried to converge it and could not do so in isolation:
the substitution is load-bearing for the OTHER half of the same invention.
`isPreventingWrites`' connected-to stack matching in
`packages/activerecord/src/core.ts:629` normalizes the SAME way
(`klass.primaryClassQ() ? "Base" : klass.name`), so a pool registered under
`ApplicationRecord` is invisible to a `ApplicationRecord.connectedTo(...)`
lookup. Removing only the pool-config half reds
`connection-handling.test.ts` — "primary class connectedTo (after connectsTo)
targets the Base-normalized pool".

## Acceptance criteria

- [ ] `PoolConfig#connectionDescriptor=` passes `value.name` and
      `value.primaryClassQ()`, matching pool_config.rb:43-50.
- [ ] The matching `"Base"` normalization in `core.ts` (and any sibling in
      `connection-handling.ts`) is retired with it, so the connected-to stack
      finds the primary pool under the class's real name the way Rails does.
- [ ] `connection-handling` suites green on all three lanes.
