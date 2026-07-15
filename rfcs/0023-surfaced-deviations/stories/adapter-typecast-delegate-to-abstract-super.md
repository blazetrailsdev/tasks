---
title: "sqlite3/mysql typeCast should delegate to abstract (else super) instead of duplicating the chain"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
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

Rails' adapter `type_cast` overrides special-case only what they need and fall
through to the abstract implementation with `else super`:

- `vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/quoting.rb:112-124`
  — `when BigDecimal, Rational then value.to_f`, `when String ... else super`.
- `vendor/rails/activerecord/lib/active_record/connection_adapters/mysql/quoting.rb:94+`
  — `when ActiveSupport::TimeWithZone ... when Time ... else super`.

So every arm of the abstract `type_cast` (`abstract/quoting.rb:94-107`) is
automatically inherited by both adapters.

Trails' equivalents are **standalone chains** that re-implement the abstract arms
and terminate in their own `throw` rather than delegating:

- `packages/activerecord/src/connection-adapters/sqlite3/quoting.ts` `typeCast`
  — ends `throw new TypeError("can't cast ... to a SQLite3 type")`.
- `packages/activerecord/src/connection-adapters/mysql/quoting.ts` `typeCast`
  — ends `throw new TypeError("can't cast ...")`.

The cost is concrete and was paid in #4891: porting the single rb:96 arm
(`when Symbol, ActiveSupport::Multibyte::Chars, Type::Binary::Data then
value.to_s`) required inlining it **three times** — once in abstract, once in
sqlite3, once in mysql — because the adapters cannot inherit it. Any future
abstract `type_cast` arm has the same three-way tax, and each copy is a chance to
drift. It is also a live bug source: before #4891 both adapters raised
`can't cast [object Object]` on a value the abstract layer handles.

Note the divergence is not uniform: SQLite's `typeCast` has real trails-only
behavior the port must preserve (BigInt returns so better-sqlite3 binds
SQLITE_INTEGER rather than FLOAT — see the comment at its boolean/number arms),
and MySQL's has its own. This is a restructure, not a deletion: the adapter-specific
arms stay and only the tail delegates.

Related but distinct: `abstract/quoting.rb:96`'s counterpart arms are now present
in all three, so this is about structure/duplication, not current behavior. See also
`type-casted-binds-payload-self-dispatch` (the other half of the type_cast
producer divergence).

## Acceptance criteria

- [ ] `sqlite3` and `mysql` `typeCast` keep only their adapter-specific arms and
      end by delegating to the abstract `typeCast` with `this` threaded, mirroring
      Ruby's `else super`.
- [ ] The adapters' existing trails-only behavior is preserved exactly —
      in particular SQLite's BigInt integer/boolean binds (guard with the existing
      tests; a regression here silently changes bind types).
- [ ] The abstract `typeCast`'s raise remains the single terminal error path;
      confirm the adapter-specific error text change (if any) is intentional and
      no test asserts the old strings.
- [ ] Adding a new arm to the abstract `typeCast` requires exactly one edit —
      demonstrate with the rb:96 binary arm by removing the two inlined copies.
- [ ] Binary, temporal, boolean and integer binds round-trip unchanged on all
      three adapters; api:compare / test:compare delta non-negative.
