---
title: "generated-attribute-valid-type-leases-connection"
status: ready
updated: 2026-11-21
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`GeneratedAttribute.valid_type?` (`vendor/rails/v8.0.2/railties/lib/rails/generators/generated_attribute.rb:74-78`)
asks `ActiveRecord::Base.lease_connection.valid_type?(type)`. trails'
`Base.leaseConnection()` (`packages/activerecord/lib/connection-handling.ts:213`)
is async, and `GeneratedAttribute.parse` runs synchronously from
`NamedBase`'s constructor (`parseAttributesBang`,
`packages/trailties/lib/generators/named-base.ts:59,242`), so
`packages/trailties/lib/generators/generated-attribute.ts`' `validType` reads
`Base.connectionPool().activeConnection` instead, and
`test/generators/generated-attribute.test.ts` leases in `beforeEach`.

## Acceptance criteria

- [ ] `validType` leases a connection as Rails does (an awaited parse, or a
      prewarmed lease at the generator's async entry), and the
      `@missingRailsCall lease_connection` receipt is removed.
- [ ] The test's `beforeEach` drops its `await Base.leaseConnection()`.
