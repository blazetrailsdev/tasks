---
title: "Type CollectionProxy#push/concat stripped return as then-less"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`prefer-await-relation` (widened in #5233) relies on the `receiverIsThenable`
type gate for soundness: a receiver whose static type is then-less (e.g.
`LoadedRelation = Omit<this, "then">`, returned by `Relation#load`/`reload`) is
correctly excluded, because `await`-ing it would not resolve to the array.

`CollectionProxy#push` and `#concat` (`packages/activerecord/src/associations/
collection-proxy.ts:1993`, `2111`) break that contract: they return
`stripThenable(this._proxySelf ?? this) as this` — the runtime value is a
then-less `Proxy` view, but the static return type is cast to `this`, which IS
thenable. Compare `reload()` (`collection-proxy.ts:2105`) which honestly types
its stripped result as `Omit<this, "then">`.

Today no call site does `await somePush.toArray()`, so the widened rule is safe
in practice (verified during #5233 review). But the type is lying: if such a
binding is ever written, `receiverIsThenable` will trust the `this` type, say
"thenable", and autofix `await pushResult.toArray()` → `await pushResult`,
which resolves to the view object, not the array — the exact class of bug
that PR #5233 fixed for `this` receivers.

## Acceptance criteria

- Type `push`/`concat`'s stripped return as then-less (mirror `reload`'s
  `Omit<this, "then">`) so the static type reflects the runtime view, keeping
  the `prefer-await-relation` type gate sound for their results.
- Confirm Rails' chaining ergonomics for `push`/`<<`/`concat` (they return
  `self` for chaining, `collection_proxy.rb`) still type-check at existing call
  sites; adjust callers if the then-less type breaks a chain.
- No behavior change — this is a type-annotation fidelity fix.
