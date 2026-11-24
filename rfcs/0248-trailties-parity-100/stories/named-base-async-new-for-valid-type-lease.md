---
title: "trailties: async NamedBase construction so valid_type? can lease a connection"
status: claimed
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: "2026-11-24T02:59:56Z"
assignee: "activestorage-index-import-loads-blob-eagerly"
blocked-by: null
closed-reason: null
---

## Context

`GeneratedAttribute.valid_type?` (`vendor/rails/v8.0.5.2/railties/lib/rails/generators/generated_attribute.rb:73-77`)
calls `ActiveRecord::Base.lease_connection.valid_type?(type)`. It is reached from
`NamedBase#initialize`'s `parse_attributes!` (`vendor/rails/v8.0.5.2/railties/lib/rails/generators/named_base.rb:11-17`).
trails' `Base.leaseConnection()` (`packages/activerecord/lib/connection-handling.ts`) is async, and
`NamedBase`'s constructor (`packages/trailties/lib/generators/named-base.ts:56-60`) is synchronous.
So `validType` (`packages/trailties/lib/generators/generated-attribute.ts:76-84`) peeks at
`activeConnection` instead.

Converged shape: per root CLAUDE.md § "Every promise has an owner", `NamedBase` becomes
`protected constructor` + `static async new` that awaits `parseAttributesBang`, which awaits
`GeneratedAttribute.parse`, which awaits `leaseConnection`. Thor's `Command#run` / `invoke`
must then build generators with `await klass.new(...)`. This conflicts with trailties
CLAUDE.md § "Thor dispatch is async" ("Constructors stay synchronous"), so the shape needs
an operator ruling before `generated-attribute-valid-type-leases-connection` can converge.

## Acceptance criteria

- [ ] Operator ruling recorded in trailties CLAUDE.md on async `NamedBase` construction.
- [ ] `validType` leases a connection as Rails does, and `generated-attribute.test.ts` no longer leases in `beforeEach`.
