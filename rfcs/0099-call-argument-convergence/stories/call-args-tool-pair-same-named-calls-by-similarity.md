---
title: "Comparator: pair same-named call occurrences by argument similarity, not source order (15 rows)"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6351
claim: "2026-08-11T11:44:00Z"
assignee: "call-args-tool-pair-same-named-calls-by-similarity"
blocked-by: null
closed-reason: null
---

## Context

Filed by the RFC 0099 classification pass over the 410 `activerecord`
`kind: "args"` rows (PR #6348), which found 15 rows that are pure comparator
artifacts of pairing same-named calls **positionally**.

When a body calls the same name more than once, the extractor zips the Ruby
occurrences to the TS occurrences by index, so the Nth TS call is compared
against the Nth Ruby call even when they are plainly different constructions:

- `connection_adapters/sqlite3_adapter.rb:477` `SQLite3Adapter::Version.new(query_value(...))`
  vs the port's three `new Version(...)` — the row compares Rails' single
  construction against the port's `new Version("0.0.0")` guard arm.
- `associations/preloader/through_association.rb:13` `if loaded?(owner)` and
  `:20` `owners.first.association(through_reflection.name).loaded?` — the
  port's single `loaded(owner)` was paired against the receiver-less
  occurrence, so a 1-arg call was compared against a 0-arg one.
- 12 more `new` rows across `command_recorder.rb`, `query_methods.rb`,
  `transaction.rb`, `config.rb`, `aes256_gcm.rb`, `database_config.rb`,
  `abstract_mysql_adapter.rb`, `connection_handler.rb`, `signed_id.rb`.

All 15 are baselined with a reviewed bucket-(c) reason today. They are debt the
tool created, and they will keep being created: every future port with two
`new`s in one body seeds another row.

## Acceptance criteria

1. Same-named call occurrences within a matched method pair are matched by
   best argument-list similarity (arity first, then literal/ref agreement),
   not by source order.
2. Where no acceptable match exists, the occurrence is reported as unmatched
   rather than paired against an unrelated one.
3. The 15 bucket-(c) rows named above go stale and are deleted from
   `scripts/api-compare/call-mismatches-exclude/activerecord/**.json`.
4. `pnpm parity:api:calls:args` and `pnpm parity:api:calls` are green, and the
   total row count strictly decreases.
