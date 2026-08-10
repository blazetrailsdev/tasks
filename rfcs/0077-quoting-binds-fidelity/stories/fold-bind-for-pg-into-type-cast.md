---
title: "Fold PG's _bindForPg into type_cast so type_casted_binds is the only bind normalizer"
status: done
updated: 2026-08-09
rfc: "0077-quoting-binds-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6294
claim: "2026-08-09T19:29:15Z"
assignee: "fold-bind-for-pg-into-type-cast"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #6288 (`converge-temporal-bind-formatting-onto-adapter`), which
moved `_bindForPg`'s date/time handling onto `quotedDate` / `quotedTime` but
left the method itself.

Rails has exactly one bind-normalization entry point: `type_casted_binds` maps
`type_cast` over the binds (`abstract/quoting.rb:224`), and `type_cast` is the
single place the per-value arms live (`abstract/quoting.rb:95-107`, PG's
override in `postgresql/quoting.rb:206-224`). There is no second per-bind
normalizer anywhere in the adapter.

trails has one: `PostgreSQLAdapter#_bindForPg`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts`), applied
to already-`typeCast`ed binds. Its arms **restate** `type_cast`'s:

- a duck-typed `BinaryData` check (`value.bytes instanceof Uint8Array`)
  deliberately not delegating to `this.typeCast`, to survive a split module
  identity for `@blazetrails/activemodel` in the dep tree;
- `quotedDate` / `quotedTime` / the `BigDecimal.toString("F")` arm — all three
  already in `abstract/quoting.ts` `typeCast` at rb:101-104;
- a narrow re-dispatch to `this.typeCast` for `OidRange` / `ArrayData` /
  `XmlData` / `BitData`, explicitly kept narrow "so we don't reintroduce the
  bind-everything pinned-client hang";
- the PG infinity sentinels (`Number.±Infinity` → `"infinity"` /
  `"-infinity"`), which have no Rails counterpart because Ruby has no such
  sentinel.

So a PG bind is normalized twice, by two overlapping arm sets, and the second
pass is where the divergences accumulate.

## Converged shape

Fold `_bindForPg` into PG's `typeCast` (`postgresql/quoting.ts`) so
`type_casted_binds` is the only normalizer, per rb:224. The infinity sentinels
belong at the top of that `typeCast` — they are `Number.POSITIVE_INFINITY` /
`NEGATIVE_INFINITY` (`activemodel/src/type/internal/sentinels.ts:25`), so they
match the numeric arm and must be intercepted ahead of it.

Two prerequisites to establish first, both already written down in the current
call site's JSDoc:

1. the module-identity split that forced the duck-typed `BinaryData` check —
   fix the duplicate `@blazetrails/activemodel` copy, or make the check a
   shared predicate rather than a second inlined arm;
2. the "bind-everything pinned-client hang" the narrow re-dispatch avoids —
   see [[project_pg_pinned_client_write_bind_hang]]. Confirm it is still live
   before widening.

## Acceptance criteria

- [ ] `_bindForPg` is gone; `performQuery`'s bind mapping reads the
      `typeCastedBinds` output directly.
- [ ] PG's `typeCast` carries the infinity sentinels ahead of its numeric arm.
- [ ] No double normalization: a bind passes through exactly one arm set.
- [ ] PG suite green, specifically the binary round-trip (bytes 128-255), the
      date/time BC and precision cases, and the pinned-client write path.
- [ ] parity:api / parity:test delta non-negative.
