---
title: "EncryptionContext is a second frame type Rails does not have"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6114
claim: "2026-08-05T02:30:05Z"
assignee: "refresh-stale-eslint-exclude-baselines"
blocked-by: null
closed-reason: null
---

## Context

Rails has exactly one type for an encryption context frame: `Context`
(activerecord/lib/active_record/encryption/context.rb:12). `default_context` is
a `Context` (contexts.rb:18), `reset_default_context` builds a `Context`
(contexts.rb:71-73), and every custom frame is `default_context.dup` — also a
`Context` (contexts.rb:35).

`packages/activerecord/src/encryption/context.ts` carries a second, invented
type alongside it: `interface EncryptionContext` (:80-86), a bare bag with an
`[key: string]: unknown` index signature. The stack (`contextStack`), the
default slot (`_defaultContext`), and every exported accessor are typed on it,
not on `Context`.

PR #6108 converged the _values_: `_defaultContext` and `resetDefaultContext` now
construct real `Context` instances, and `withEncryptionContext` builds its frame
with a prototype-preserving `Object.assign(Object.create(getPrototypeOf(...)))`
dup instead of a flat spread, so the `keyProvider` accessor and its memo survive
into a custom frame. But the _types_ still say `EncryptionContext`, which forces
two `as unknown as EncryptionContext` casts (:88, :100) and leaves the interface
as extra surface with no Ruby counterpart.

## Converged shape

Type the stack, the default slot, and the exported accessors on `Context`, and
delete `EncryptionContext`. The index signature is what the interface exists for
— callers pass partial override bags to `withEncryptionContext` — so the
override parameter likely wants `Partial<Context>` rather than a new bag type.
Both casts should fall out.

Two compatibility shims in the same file, `isEncryptionDisabled` (:170-172) and
`isProtectedMode` (:174-176), are already flagged in a comment as dead once
`contexts.test.ts` becomes a DB-backed faithful port; check whether they can go
in the same pass.

## Acceptance criteria

- [ ] No `EncryptionContext` interface remains under `encryption/`.
- [ ] No `as unknown as` cast in `context.ts`.
- [ ] `pnpm parity:api:extra --package activerecord` for `encryption/context.ts` drops
      by the removed names; encryption suites green on all three lanes.
