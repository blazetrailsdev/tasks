---
title: "ArelConnection has no quotedDate/quotedTime, so type_cast's Temporal arms cannot dispatch"
status: done
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5020
claim: "2026-07-20T23:16:44Z"
assignee: "arel-connection-lacks-quoted-date-time-self-dispatch"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5010, which converged `typeCastArrayElement`
(`packages/arel/src/quote-array.ts`) onto Rails' `type_cast` closed set
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:94-107`).

Two of Rails' arms could not be ported there:

```ruby
when Type::Time::Value then quoted_time(value)   # :102
when Date, Time        then quoted_date(value)   # :103
```

Both are **connection self-dispatches**, and `ArelConnection`
(`packages/arel/src/visitors/connection.ts:21-37`) carries no
`quotedDate`/`quotedTime` — it has only `quotedBinary`, `quotedTrue`,
`quotedFalse`, `unquotedTrue`, `unquotedFalse`. Rails puts `quoted_date` /
`quoted_time` on the adapter, not on Arel, so adding them to `ArelConnection`
is itself a design question, not a mechanical port.

The consequence is an asymmetry in what the `formatElement` hook claims.
`postgresqlDefaultQuoter.quote` (`visitors/default-quoter.ts:231`) routes
elements through `isDateLike` (`:37`), a `toISOString` duck-type. So:

- a **JS `Date`** IS claimed — the type trails rejects AR-wide (see
  `project_js_date_rejected_temporal_is_time_analogue`, #939);
- a **Temporal** value, trails' actual `Time`/`Type::Time::Value` analogue, is
  NOT claimed (Temporal exposes no `toISOString`) and hits `type_cast`'s
  terminal `TypeError`.

PR #5010 documented this at the call site (`default-quoter.ts:226-236`) rather
than fixing it, and verified the raise is unreachable for a real
`timestamp[]`: `postgresqlDefaultQuoter` serves only the connection-less
`new Visitors.PostgreSQL()` debug path, and every adapter construction site
passes a real connection (`postgresql-adapter.ts` `arelVisitor`,
`insert-all.ts:786-788`), whose own `type_cast_array` -> `type_cast`
(`connection-adapters/postgresql/quoting.ts:445-449`) owns the Temporal arms
and never reaches `quoteArrayLiteral`.

Note the pre-convergence behaviour was not better: a Temporal fell through to
`JSON.stringify` and encoded as `{}`. The raise is strictly an improvement;
this story is about closing the arm properly.

**Overlaps `arel-quote-array-duplicates-adapter-encode-array`** (in-progress):
this is a fourth instance of exactly the drift that story names — an arm
correct in the adapter copy and missing in the Arel copy. If that story lands
by sharing/delegating to the adapter's `encodeArray`, this arm closes for free
and this story should be closed as superseded. File separately because the
missing arm stands on its own if the dedup is instead resolved by pinning the
copy with a test.

## Acceptance criteria

- [ ] Decide and record whether `quotedDate`/`quotedTime` belong on
      `ArelConnection` at all, given Rails puts them on the adapter.
- [ ] Either: the Temporal analogue of `Type::Time::Value` routes through a
      `quotedTime` equivalent and the Temporal date types through
      `quotedDate`, mirroring `abstract/quoting.rb:102-103`; or the decision
      not to is recorded at the call site with the Rails justification.
- [ ] `isDateLike`'s asymmetry is resolved: it should not claim a JS `Date`
      (rejected AR-wide) while missing Temporal, whichever way the above goes.
- [ ] No behaviour change on the real adapter path — this is the
      connection-less debug quoter only.
- [ ] api:compare / test:compare delta non-negative.

## Notes

Fidelity/structural, low urgency: blast radius is the connection-less
`Node#toSql()` debug path only, and the current behaviour is an honest raise,
not silent mis-encoding.
