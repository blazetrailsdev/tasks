---
title: "parity: the pg package's denominator is the whole gem, not the surface Rails calls"
status: draft
updated: 2026-10-08
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8687 registered `pg` as an api-compare package over `vendor/pg/v1.5.9/lib/pg`
(`vendor/sources.ts`), with one TS file, `packages/activerecord/src/pg/connection.ts`. `parity:api`
reports `pg — 2/89 methods, files 1/19`, and all 19 files and 89 methods sit in the Overall
denominator.

Rails calls a small part of the gem: `PG::Connection` (`postgresql/database_statements.rb:160-193`,
`quoting.rb:70-79`), `PG::Result`, the text decoders and `PG::TypeMapByOid`
(`postgresql_adapter.rb`), tracked by `pg-gem-result-and-array-coders-score-against-the-pg-gem` and
`pg-text-decoders-and-type-map-by-oid-score-against-the-pg-gem`. The rest
(`basic_type_map_for_queries.rb`, `basic_type_registry.rb`, `binary_encoder/`, `tuple.rb`,
`copy_data` and the connect-string helpers in `connection.rb`) is reached by nothing in
`vendor/rails/v8.0.2/activerecord`.

## Acceptance criteria

- [ ] Each `lib/pg` file and each unported `connection.rb` method is either ported under
      `packages/activerecord/src/pg/` because a Rails body calls it, with the Rails `file:line`, or
      listed in `scripts/parity/unported-files/` with the reason that no Rails body reaches it.
- [ ] `parity:api`'s `pg` row reports only the surface Rails calls.
