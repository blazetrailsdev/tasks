---
title: "non-attribute-read-is-a-compile-error"
status: done
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7222
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`converge-non-attribute-read-write-raises` is blocked: the read half of Ruby's
`method_missing` needs a `Proxy` `get` trap on every ActiveModel object, and
that was measured at 4.9x on an attribute read and 11x on an internal `_field`
read against no proxy (PR #7208). The write half shipped; the read half did not.

A `get` trap is not the only way to close it, and probably not the right one.
Ruby raises at run time because it has no other moment; TypeScript has an
earlier one. Reading an undefined name off a record should be a **compile
error**, which costs nothing at run time and is caught before the code ships.

It does not error today because of one line with no Rails counterpart:

```ts
// packages/activemodel/src/model.ts:47
export class Model {
  [key: string]: unknown;
```

That index signature resolves `topic.mumbo` to `unknown` for every model in the
repo. Ruby has nothing like it; it is a pure TS escape hatch.

Measured blast radius of deleting it (`pnpm typecheck`, 2026-08-29, against
PR #7208's branch): **610 errors across 102 files**, splitting as

- **6 source files** — `base.ts`, `enum.ts`, `model-schema.ts`,
  `serialization.ts`, `cases/json-shared-test-cases.ts`,
  `connection-adapters/abstract-mysql-adapter.ts`. Nearly all one shape:
  `Argument of type 'typeof Base' is not assignable to parameter of type
'SchemaHost'` (TS2345) and its `this`-context twin (TS2684). The index
  signature had been silently making `typeof Base` structurally satisfy
  interfaces that declare one.
- **96 test files**, and the dominant error — **329 of the 610** (TS2339) — is
  _legitimate_ attributes: `Property 'name' does not exist on type
'SliceModel'`. Root cause: an ad-hoc test model declares its attributes at
  run time inside `static { this.attribute("name", "string") }`, and a static
  block cannot contribute to its own class's type. The canonical models already
  do this correctly, pairing the runtime call with `declare title: string`.

So the index signature is load-bearing for runtime-declared attributes, and the
work is mostly bringing ad-hoc test models up to the convention the repo already
mandates — which is also what RFC 0059 wants.

CI already runs a `Virtualized DX Type Tests` job, so the resulting compile
error can be pinned with `@ts-expect-error` the way a runtime raise is pinned by
a test.

Residue this does NOT cover, and where a runtime raise would still be the only
answer: dynamic access (`record[name]`, mass assignment, `readAttribute`
fallbacks) and plain-JS consumers. That residue is far narrower than today's
"every undefined read silently answers `undefined`".

## Acceptance criteria

- [ ] `[key: string]: unknown` is gone from `ActiveModel::Model`, or the story
      is blocked with the specific reason it cannot be.
- [ ] Ad-hoc test models declare their attributes on the type side beside the
      runtime `attribute()` call, the way the canonical models do.
- [ ] The `SchemaHost` structural assignability in the 6 source files is fixed
      at the interface, not with casts.
- [ ] A type test pins that a read of an undefined name is a compile error.
- [ ] `pnpm typecheck` clean; AR suite green on all three lanes.
