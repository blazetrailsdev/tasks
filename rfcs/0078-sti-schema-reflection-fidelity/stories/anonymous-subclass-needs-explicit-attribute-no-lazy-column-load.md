---
title: "Anonymous tableName-only subclass needs an explicit attribute() — no sync lazy column load"
status: done
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6702
claim: "2026-08-18T14:29:41Z"
assignee: "pair-ruby-writer-with-ts-set-accessor-not-its-reader"
blocked-by: null
closed-reason: null
---

## Context

Rails' `AdapterForeignKeyTest`
(`vendor/rails/activerecord/test/cases/adapter_test.rb:352-364`) builds an
anonymous subclass with nothing but `self.table_name = "fk_test_has_fk"` and
assigns `has_fk.fk_id = 1231231231` — the column resolves because Ruby loads
the schema lazily on first attribute access.

trails cannot do that: `packages/activerecord/src/adapter.test.ts` (the
`KlassHasFk` static block in `AdapterForeignKeyTest`) must add
`this.attribute("fk_id", "integer")`, or strict `writeFromUser`
(`packages/activemodel/src/model.ts:2451`, reached via
`attribute-assignment.ts:53`) drops the value because the class was never
schema-warmed. The declaration is a trails-only line with no Rails
counterpart, and it also suppresses DB reflection for that column.

Surfaced while landing #5268 (canonical-schema-express-foreign-keys), which
otherwise removed every workaround from that describe block.

## Acceptance criteria

- A model whose only class-level declaration is `tableName` resolves its DB
  columns on first attribute assignment, without an explicit `attribute()`
  call, on all three adapters.
- `AdapterForeignKeyTest`'s `KlassHasFk` drops the
  `this.attribute("fk_id", "integer")` line and its explanatory comment, and
  still passes.
- No test renamed; `parity:test` delta >= 0.
