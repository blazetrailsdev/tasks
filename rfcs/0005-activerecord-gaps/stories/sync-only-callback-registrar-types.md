---
title: "Type afterInitialize/afterFind registrars to reject async callbacks"
status: done
updated: 2026-07-31
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5731
claim: "2026-07-31T18:14:54Z"
assignee: "sync-only-callback-registrar-types"
blocked-by: null
closed-reason: null
---

## Context

`after_initialize` and `after_find` are the only two AR callback chains trails
runs **synchronously**. Every invocation passes `strict: "sync"`:

- `packages/activerecord/src/base.ts:3043` — `find` chain (row instantiation)
- `packages/activerecord/src/base.ts:3044` — `initialize` chain (row instantiation)
- `packages/activerecord/src/base.ts:3259`, `:3356` — the `new` paths
- `packages/activerecord/src/base.ts:5003` — `initializeDup`

`strict: "sync"` is honored in the activesupport filters
(`packages/activesupport/src/callbacks.ts:388`, `:405`, `:430`, `:508`, `:886`,
`:981`, `:1028`, `:1367`): if a callback returns a thenable it calls
`swallowRejection` (`:111`) and throws
`Async callback on sync chain "<name>" — <kind> returned a Promise`. That is
what lets the call sites `void` the result — see the contract comment at
`base.ts:3042`.

This has to be sync: Rails runs `_run_initialize_callbacks` inside
`initialize` (`vendor/rails/activerecord/lib/active_record/core.rb:481`), and
JS constructors cannot await. It is also the hot read path — Rails fires the
same chain from `init_with` for every materialized row
(`core.rb:516-517`) and from `initialize_dup` (`core.rb:553`), so an async
variant would mean one await per loaded record.

**The gap:** the registrars are typed to _accept_ async callbacks.
`packages/activerecord/src/callbacks.ts:190` (`afterInitialize`) and `:175`
(`afterFind`) both declare
`fn: (record: InstanceType<T>) => void | Promise<void>` — the shared shape
copied from the genuinely-async registrars (`afterDestroy` at `:160`, etc.).
So `Model.afterInitialize(async (r) => { ... })` typechecks and fails only at
runtime, on the first record constructed.

**Do not "fix" this by changing the return type to `void`.** TypeScript's
void-return assignability rule makes `(r) => Promise<void>` assignable to
`(r) => void`, so that change is a silent no-op. Verified against the repo's
own tsc (`--strict --target es2022`):

```ts
declare function voidSig(fn: (r: number) => void): void;
voidSig(async (r) => {}); // NO ERROR
```

A narrow union constraint (`R extends void | boolean`) does reject async, but
also produces false positives on value-returning arrows, which real callers
use — e.g. `test-helpers/models/bulb.ts:31`:

```ts
A((r) => (r.c = "red")); // ERROR: Type 'string' is not assignable to 'boolean | void'
```

The verified-working recipe is a conditional rejection with `R` unconstrained:

```ts
type SyncOnly<R> = R extends PromiseLike<unknown> ? never : R;
declare function B<R>(fn: (r: Rec) => SyncOnly<R>): void;
```

Checked against repo tsc — rejects `async (r) => {}`, `(r) => Promise.resolve(1)`,
and `(r) => somePromiseVar`; accepts `(r) => {}`, `(r) => false`,
`(r) => (r.c = "red")`, and `function (r) { return; }`.

Because the runtime already throws on async callbacks in these two chains, no
working caller can currently be async — the tightening should be behavior-
preserving and is a pure compile-time guardrail.

## Acceptance criteria

- [ ] `afterInitialize` (`packages/activerecord/src/callbacks.ts:190`) and
      `afterFind` (`:175`) reject `Promise`-returning callbacks at compile time.
- [ ] Non-async callbacks keep compiling, including value-returning arrows and
      `boolean`-returning callbacks — verify against the existing registrations
      in `packages/activerecord/src/test-helpers/models/` (`bulb.ts:31`,
      `topic.ts:128`, `author.ts:688`, `secure-token.ts:81`, and the rest of
      the ~15 sites).
- [ ] Type-level tests pin both directions (async rejected, each sync form
      accepted). An `@ts-expect-error` on the async case is the cheapest form
      and fails loudly if the guard ever regresses to a no-op.
- [ ] The other registrars (`afterDestroy`, `beforeSave`, …) are left on
      `void | Promise<void>` — their chains are genuinely async. Only the two
      `only: :after` sync chains change.
- [ ] The existing runtime `strict: "sync"` throw stays — it still covers
      dynamically-registered and untyped callers.

## Out of scope

- The empty-chain inconsistency noted at
  `packages/activemodel/src/callbacks.ts:483`: activesupport's `runAllCallbacks`
  throws on a thenable _block_ under `strict: "sync"`, but the activemodel
  wrapper deliberately does not propagate it (flagged there as a trails
  invention surviving on the rails-error-parity grandfather list). It does not
  affect `after_initialize`/`after_find`, which are `only: :after` and pass no
  block. Register separately if it is worth converging.
