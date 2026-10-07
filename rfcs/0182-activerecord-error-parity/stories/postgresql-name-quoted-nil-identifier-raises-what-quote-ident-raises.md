---
title: "activerecord: PostgreSQL::Name#quoted raises what PG quote_ident raises for a nil identifier"
status: draft
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

With the abstract-class guard removed from `Querying.deleteAll` (trails#8602, mirroring `delegate :delete_all, to: :all`, `vendor/rails/v8.0.2/activerecord/lib/active_record/querying.rb:13`), `AbstractModel.deleteAll()` reaches the adapter with a nil table name, as Rails' `Relation#delete_all` does (`relation.rb:1011-1037` never reaches `load_schema!`, the only `TableNotSpecified` raise site, `model_schema.rb:589`).

On PostgreSQL trails then throws a native JS `TypeError: Cannot read properties of undefined (reading 'replace')` from `PostgreSQL::Name#quoted` (`packages/activerecord/src/connection-adapters/postgresql/utils.ts:18-24`), whose `esc` calls `.replace` on an undefined `identifier`. Rails' `Name#quoted` (`connection_adapters/postgresql/utils.rb:22-28`) calls `PG::Connection.quote_ident(identifier)`; what that raises for `nil` was NOT verified in trails#8602 (run `ruby -rpg -e 'PG::Connection.quote_ident(nil)'`).

Seen in CI: Active Record PostgreSQL Tests (2), run 37544484768.

## Acceptance criteria

- [ ] What `PG::Connection.quote_ident(nil)` raises (class and message) is recorded from a real run.
- [ ] `Name#quoted` raises that class and message for a nil identifier, through a ported error class rather than an incidental native `TypeError`.
- [ ] A PostgreSQL-lane test pins it.
