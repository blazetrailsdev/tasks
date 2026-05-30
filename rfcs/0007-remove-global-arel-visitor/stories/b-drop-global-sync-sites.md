---
title: "Phase B — drop AR's global-visitor sync sites"
status: ready
rfc: "0007-remove-global-arel-visitor"
cluster: arel-visitor
deps: ["a4-sweep-remaining-callers"]
deps-rfc: []
est-loc: 80
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Once no production caller depends on the global visitor: delete the
`setToSqlVisitor` call in the `Base.adapter =` setter (`base.ts:978`), and stop
`test-setup.ts` resetting it (the reset becomes a no-op once nothing syncs it).

`setToSqlVisitor` and the registry default (`ToSql`) **stay in the arel package**
— arel is dialect-agnostic and its own tests rely on the default. What's removed
is _AR injecting a dialect into that global_ and depending on it.

See RFC 0007 §Plan (Phase B) and §What stays.

## Acceptance criteria

- [ ] `setToSqlVisitor` call deleted from the `Base.adapter =` setter
- [ ] `test-setup.ts` no longer resets the global visitor
- [ ] arel's `setToSqlVisitor` + default `ToSql` untouched
- [ ] No production path regresses (dialect SQL unchanged)

## Notes

From the arel-visitor plan (Phase B). Test files calling bare `.toSql()` that
relied on the synced dialect either move to `connection.toSql` or accept the
default `ToSql` output — counted here.
