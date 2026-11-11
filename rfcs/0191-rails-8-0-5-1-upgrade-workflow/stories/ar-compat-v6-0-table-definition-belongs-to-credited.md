---
title: "Compatibility::V6_0::TableDefinition#belongs_to is credited"
status: ready
updated: 2026-11-11
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: entry
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 15
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the 8.0.2 entry check (trails `876804dd8b`): `parity:api` reports
`ActiveRecord::Migration::Compatibility::V6_0::TableDefinition#belongs_to`
missing from `migration/compatibility.ts` (35/36).

Rails: `alias :belongs_to :references` inside `V6_0::TableDefinition`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/migration/compatibility.rb:234-239`).
trails seats it in a static block after the module literal
(`packages/activerecord/src/migration/compatibility.ts:330-332`,
`V6_0.TableDefinition.belongsTo = V6_0.TableDefinition.references`). V5_0
and V4_2 use the same shape (`:482`, `:591`) and are credited, so compare
them to see what the extractor misses on V6_0.

## Acceptance criteria

- [ ] `V6_0::TableDefinition#belongs_to` is credited, with the alias written
      the same way as the V5_0 and V4_2 aliases.
- [ ] `parity:api` shows `migration/compatibility.rb` at 36/36.
