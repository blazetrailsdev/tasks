---
rfc: "0000-no-void-promises"
title: "No void promises; a constructor never starts async work"
status: draft
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  [
    activemodel,
    activerecord,
    actioncable,
    actionpack,
    actiontext,
    activestorage,
    activesupport,
    rack,
    rackup,
    rake,
    ruby-compat,
    solid-cable,
    solid-queue,
    trailties,
    website,
    zeitwerk,
  ]
clusters:
  - gate
  - constructors
  - discarded-calls
  - background-work
---

<!-- Unnumbered until merge: copy this dir to `rfcs/0000-your-slug`, keep `rfc:`
     as 0000-your-slug and the H1 below number-free. `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge. Never use a `draft-` prefix —
     `draft` is a lifecycle status, not a dir prefix (see top-level README). -->

# RFC — No void promises; a constructor never starts async work

## Summary

Every promise in trails is awaited, returned, or owned by a ruby-compat
`Thread`. `void promise` and `.catch(() => {})` are banned outright, and a
constructor never creates a promise. Where Rails' `initialize` does work that
is async in JS, there are exactly two sanctioned shapes: the caller awaits the
async step **before** `new` and passes the result in, or the work is the
`Thread` Rails already runs it on, and it is awaited through `Thread#join` /
`#value`. Both are enforced by lint, against an only-shrink baseline.

## Motivation

An unawaited promise loses two things: ordering (the caller runs on before the
work finishes) and errors (a rejection has no handler, or an empty one). The
pattern has been propagating, because each new instance copies a neighbour.
Survey of `main` at 20fdbe9f43, 2026-11-12:

- **`no-floating-promises` covers three trees only**
  (`eslint.config.mjs:1233-1241`: `activemodel/lib`, `activerecord/src`,
  `scripts`), and with its default `ignoreVoid: true`. Run over every
  package's `lib/` and `src/` it reports **19** bare floating promises: 15
  dropped `Mutex#synchronize` results (`actioncable/lib/subscription-adapter/redis.ts`
  ×5, `zeitwerk/lib/cref/map.ts` ×3, `zeitwerk/lib/loader/config.ts` ×5,
  `zeitwerk/lib/loader.ts:646`), `debug-view.ts:37`, `benchmarkable.ts:84`,
  `callbacks.ts:566`, `trailties/lib/commands/version.ts:10`.
- **~40 `void <call>` statements** in non-test sources, plus **~17**
  `void this.sourceRoot(...)` in generators (`Base.sourceRoot` is
  `static async`, `trailties/lib/generators/base.ts:181`).
- **~8 `.catch(() => {})` swallowers**: `activemodel/lib/attribute-assignment.ts:37,144,174`,
  `activerecord/src/connection-adapters/schema-cache.ts:195`,
  `activestorage/lib/attached/one.ts:62`, `trailties/lib/commands/console.ts:60`,
  `solid-cable/lib/action-cable/subscription-adapter/solid-cable.ts:86`,
  `website/src/lib/frontiers/sw-client.ts:167`.
- **6 constructors that start a promise**:
  `connection-pool.ts:291` (`void this.reaper.run()`),
  `rackup/lib/server.ts:300` (`this._ready = this.parseOptions(ARGV).then(…)`),
  `trailties/lib/commands/console.ts:59-60`, `solid-cable.ts:86`,
  `actiontext/lib/content.ts:73`, `activerecord/src/schema-dumper.ts:80`.

Concrete losses: PostgreSQL's `dealloc` is async
(`postgresql-adapter.ts:2035`), so `statement-pool.ts:47,55,67`'s
`void this.dealloc(…)` drops a failed `DEALLOCATE`; `_assignAttributes`'
`void this._assignAttribute(k, v)` (`attribute-assignment.ts:64`) lets
mass assignment return before a nested writer finishes.

The counts are regex- and lint-based; the gate story produces the exact
baseline.

## Design

### 1. The rule

A promise-valued expression is one of: `await`ed, `return`ed, passed as an
argument to a function that takes a promise (`Promise.all`, a `Thread`'s
block result), or stored where a later `await` reads it **in the same
function**. Nothing else.

- `void <promise>` is an error (`no-floating-promises` with
  `ignoreVoid: false`).
- A `.catch` / `.then` rejection handler with an empty body, or one that only
  returns, is an error (a new `blazetrails/no-swallowed-rejection` rule). A
  real handler (logs, re-raises, routes to `Thread#report_on_exception`) is
  fine.
- Both apply repo-wide, tests included.

### 2. A constructor never creates a promise; async `initialize` is an awaited `static new`

`blazetrails/constructor-creates-no-promise` reports, inside a `constructor`
body: an `await`-able call whose result is dropped, voided, stored, or
chained; a `.then` / `.catch` / `.finally`; an `async` IIFE. Where Rails'
`initialize` (or its inlined `@inlinedFrom` segments) does work that is async
in JS, the port takes one of **two shapes and no others**:

**(a) `static async new` with a protected constructor.** Ruby builds an object
with `Klass.new`, and here that spelling is what JS needs: a method that can be
awaited. The class gets

```ts
protected constructor(...)            // the synchronous part of initialize
static async new<T extends Klass>(this: { prototype: T }, ...args): Promise<T> {
  const obj = new (this as unknown as new (...a: never[]) => T)(...args);
  // the async remainder of initialize, line for line, at its Rails position
  return obj;
}
```

and callers write `await Klass.new(...)`, which is the Rails call. The
constructor is `protected`, so `new Klass(...)` outside the class hierarchy is
a type error: there is **one** way to build the object, which is what the
operator's rejection of a static `new` beside a public constructor
(trails#8659, `packages/activerecord/CLAUDE.md` § "A record is built with
`new Klass` only") guarded against. A subclass gets the same `new` through
`this` and comes back typed as itself (checked with `tsc --strict`,
2026-11-12). A subclass whose `initialize` adds async work overrides
`static async new` and calls `super.new`. This applies only to classes whose
`initialize` has async work; every other class, `ActiveRecord::Base` and its
models included, keeps `new Klass` and a public constructor, and trails#8659
stands for them. The cast inside `new` lives in one ruby-compat helper
(`rbClassNewInstance`, MRI `rb_class_new_instance`) so the shape is identical
everywhere.

**(b) A `Thread`.** When Rails runs the work on a background thread
(`Reaper#run`'s `Thread.new`, Action Cable's listener threads, Solid Queue's
processes), the port is ruby-compat's `Thread`, constructed where Rails
constructs it. The `Thread` owns the promise, reports an exception as
`report_on_exception` does, and anyone who waits does so through
`thread.join()` / `thread.value()`, as Ruby does. A constructor may create a
`Thread`; it may not hold the `Thread`'s promise itself.

There is no `ready` field, no `whenReady()`, no `create()` factory, and no
lazy first-call initialisation. "How do I await a constructor promise?" has
one answer: `await Klass.new(...)`.

### 3. A sync caller of an async method becomes async

`void this.asyncThing()` inside a synchronous method is converged by making the
method async and awaiting, up the call chain, until a caller already is. Where
a Rails sync entry point must stay sync (mass assignment's
`assertAssignedSynchronously` path), it asserts synchronously and raises; it
never drops the promise.

### 4. `Mutex#synchronize`

`synchronize(block: () => T): T | Promise<T>` (`ruby-compat/lib/mutex.ts:139`)
makes every sync-block call site look floating. The sync overload returns `T`
when the block is sync and the lock is uncontended, and the contended arm is
awaited; the story decides which by reading `mutex.ts`, and either the type
narrows to `T` or every caller awaits.

### 5. Gate

The rule changes land with a per-package count mark that is **only-shrink**
with no reseed, matching every other ratchet in `docs/parity-gates.md`. A
converged site is removed and the mark tightened. No receipt tag exempts a
void promise: there is no `@floatingPromise` and none is to be added.

## Non-goals

- **Unhandled-rejection process handlers.** A global `unhandledRejection`
  listener hides the symptom; this RFC removes the cause.
- **Converting Rails' sync APIs to async beyond the call chain a site needs.**
  Each convergence goes up only as far as the first already-async caller.

## Alternatives considered

- **A `ready: Promise` field awaited by every method.** This is the pattern
  being retired: each method must remember the await, and the rejection has no
  owner until a method is called.
- **Static async factory under an invented name (`await Klass.create(...)`).**
  Invented surface; `Klass.new` is the Rails name for the same call.
- **Awaited step at the call site before a synchronous `new`.** Moves part of
  `initialize` into every caller, so each caller must repeat it and a caller
  that forgets builds a half-initialised object.
- **`static async new` beside a public constructor.** Rejected for records in
  trails#8659: two spellings, and the bare one skips the async half. The
  protected constructor is what removes the second spelling.
- **Allowing `void` with a receipt tag.** Every current `void` would gain a
  tag; the ledger would never burn down.

## Rollout

1. Gate and helper: `ruby-compat-rb-class-new-instance`, `no-floating-promises-repo-wide-ignore-void-false`,
   `no-swallowed-rejection-lint-rule`, `constructor-creates-no-promise-lint-rule`
   (baselines seeded at today's counts).
2. Constructors: `constructor-promises-become-awaited-steps`,
   `constructor-promises-become-threads`.
3. Discarded calls: `activerecord-void-async-calls-are-awaited`,
   `activemodel-void-async-calls-are-awaited`,
   `generators-await-source-root`, `mutex-synchronize-sync-block-is-not-a-promise`.
4. Background work: `fire-and-forget-sites-run-on-a-thread`.

## Verification

- `no-floating-promises` (with `ignoreVoid: false`) and both new rules run on
  every package, tests included, and their marks reach **0**.
- `grep -rnE "^\s*void [A-Za-z_]" packages --include=*.ts` outside `dist/`
  returns 0 hits whose operand is a promise.
- No `constructor` body in `packages/**` creates a promise.

## Open questions

1. **Tests included from day one?** Recommendation: yes; a test that drops a
   promise is an assertion that may never run. Seed their count in the same
   mark.

## Changelog

- 2026-11-12: initial RFC
- 2026-11-12: async `initialize` is `static async new` with a protected constructor, replacing the awaited step at the call site
