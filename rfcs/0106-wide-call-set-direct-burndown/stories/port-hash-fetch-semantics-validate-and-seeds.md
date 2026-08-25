---
title: "Port Hash#fetch semantics in validate? / seeds? (a stored nil is not the default)"
status: done
updated: 2026-08-17
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6673
claim: "2026-08-17T22:18:04Z"
assignee: "converge-collection-association-reader-reload-and-proxy"
blocked-by: null
closed-reason: null
---

# Port Hash#fetch semantics in validate? / seeds? (a stored nil is not the default)

## Context

Two option readers use Ruby's `Hash#fetch` with a default:

- `ForeignKeyDefinition#validate?` / `CheckConstraintDefinition#validate?` —
  `options.fetch(:validate, true)`
  (activerecord/lib/active_record/connection_adapters/abstract/schema_definitions.rb:153,
  :181)
- `HashConfig#seeds?` — `configuration_hash.fetch(:seeds, primary?)`
  (activerecord/lib/active_record/database_configurations/hash_config.rb:138)

`fetch` returns the STORED value whenever the key is present — including a
stored `nil`/`false` — and substitutes the default only when the key is absent.
trails spells both as `??` / `!== undefined`
(packages/activerecord/src/connection-adapters/abstract/schema-definitions.ts,
packages/activerecord/src/database-configurations/hash-config.ts), which
substitutes the default for a stored null too. That is the documented
`fetch` vs `??` trap in CLAUDE.md, and it changes behaviour for an explicit
`validate: null` / `seeds: null`.

Surfaced by RFC 0106 wave 3, which recorded the shape as per-row justifications
on `validate? | fetch` and `seeds? | fetch` in the exclude tree.

## Converged shape

Read by key presence (`"validate" in this.options ? ... : true`), so a stored
null survives exactly as Ruby's `fetch` returns it. Keep the reasons' rows only
if the gate still flags the (call-form-less) `fetch` after the semantics match.

## Acceptance criteria

- [ ] Both readers return a stored null/false instead of the default.
- [ ] A test covers the stored-null case for at least one of them.
