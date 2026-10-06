---
title: "activerecord: quote/typeCast JS Date guard arms have no Rails counterpart"
status: draft
updated: 2026-10-06
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`quote` and `typeCast` in `packages/activerecord/src/connection-adapters/abstract/quoting.ts` each carry an `if (value instanceof Date) throw new TypeError("…JS Date is not accepted — use a Temporal type…")` guard ahead of the fall-through raise. Rails' bodies have no such branch: `when Date, Time` quotes the value (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb:85` and `:104`) and everything else reaches `else raise TypeError, "can't quote #{value.class.name}"` (`:87`, `:105`).

A JS `Date` is not a trails Time value, so the guard is an arm the port adds. Deleting it is not enough on its own: `rbObjClassname` names a JS `Date` as `Time`, so the fall-through reads `can't quote Time` for a class Rails quotes. `postgresql/oid/range.ts`'s local `inspect` carries the same guard.

Trails tests pin the guidance message: `quoting.test.ts` ("quote(new Date()) throws with Temporal guidance"), `connection-adapters/postgresql/quoting.trails.test.ts`, `mysql/quoting.trails.test.ts`, `sqlite3/quoting.trails.test.ts`, `postgresql/oid/range.trails.test.ts`.

Both functions carry `@inventedArm if — CONVERGEABLE` receipts pointing here (trails#8600).

## Acceptance criteria

- [ ] Decide the convergent answer for a JS `Date` reaching `quote` / `typeCast` (quote it as Rails quotes a `Time`, or fall through with a classname that is not `Time`) and remove the guard arms.
- [ ] Remove both `@inventedArm if` receipts, and the same guard in `OID::Range`'s `inspect`.
- [ ] `pnpm parity:api:arms:throws` green.
