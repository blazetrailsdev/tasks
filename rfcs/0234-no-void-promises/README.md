---
rfc: "0234-no-void-promises"
title: "No void promises; async initialize is an awaited static new"
status: active
created: 2026-11-12
updated: 2026-11-12
owner: "@deanmarano"
packages:
  - "actioncable"
  - "actionmailbox"
  - "actionmailer"
  - "actionpack"
  - "actiontext"
  - "actionview"
  - "activejob"
  - "activemodel"
  - "activerecord"
  - "activestorage"
  - "activesupport"
  - "arel"
  - "date"
  - "mail"
  - "mini-magick"
  - "net-smtp"
  - "rack"
  - "rackup"
  - "rake"
  - "ruby-compat"
  - "solid-cable"
  - "solid-queue"
  - "thor"
  - "trails-tsc"
  - "trailties"
  - "website"
  - "zeitwerk"
clusters:
  - gate
  - constructors
  - discarded-calls
  - background-work
  - tests
priority: 2
---

# RFC 0234 — No void promises; async initialize is an awaited static new

## Summary

Every promise in trails is awaited, returned, combined into one that is, or
owned by a ruby-compat `Thread`. `void <promise>` and an unawaited empty
rejection handler (`p.catch(() => {})`) are banned outright, with no receipt
tag. A constructor never creates a promise: where Rails' `initialize` does
work that is async in JS, the class gets a `protected` constructor and a
`static async new`, and every caller writes `await Klass.new(...)`, the Rails
call. Work Rails runs on a background thread is a `Thread`, awaited through
`join` / `value`. Lint enforces all of it against only-shrink marks.

## Motivation

An unawaited promise loses ordering (the caller runs on before the work
finishes) and errors (a rejection has no handler, or an empty one). The shape
spreads because each new instance copies a neighbour, and the one lint rule
that would catch it is narrow:

- `@typescript-eslint/no-floating-promises` runs on `activemodel/lib`,
  `activerecord/src` and `scripts` only (`eslint.config.mjs:1233-1241`, added
  by RFC 0063), with the default `ignoreVoid: true`, so `void p` passes.

Survey of trails `main` at 20fdbe9f43, 2026-11-12. The lint figure is exact;
the others are regex counts (`^\s*void <expr>` statements, and
`.catch(() => {} | undefined | null)` not preceded by `await`) and include a
few `void` operands that are not promises. The gate story replaces them with
the rule's own numbers.

| Shape                                       | Source | Tests |
| ------------------------------------------- | -----: | ----: |
| bare floating promise (lint, outside scope) |     19 |     — |
| `void <expr>` and unawaited empty `.catch`  |    147 |   408 |
| constructor that starts a promise           |      6 |     — |

Source by package: activerecord 44, trailties 24 (17 are generators'
`void this.sourceRoot(...)`), actionpack 13, activemodel 10, activesupport 9,
ruby-compat 8, actioncable 6, rake 5, website 4, and 1–3 each in eleven more.
Tests: activerecord 298, of which ~120 are `void X.resetColumnInformation()`;
activemodel 41; 1–13 each in sixteen more.

Concrete losses already visible:

- PostgreSQL's `dealloc` is async (`postgresql-adapter.ts:2035`), so
  `statement-pool.ts:47,55,67`'s `void this.dealloc(…)` drops a failed
  `DEALLOCATE`.
- `_assignAttributes`' `void this._assignAttribute(k, v)`
  (`activemodel/lib/attribute-assignment.ts:64`) returns from mass assignment
  before a nested writer finishes.
- `Mutex#synchronize` runs a sync block inline only when uncontended; when
  contended it queues the block and returns a promise
  (`ruby-compat/lib/mutex.ts:139-183`). The 15 call sites that drop that
  result (`actioncable/.../redis.ts`, `zeitwerk/lib/cref/map.ts`,
  `zeitwerk/lib/loader/config.ts`, `zeitwerk/lib/loader.ts:646`) continue
  before their critical section has run.
- Six constructors start a promise: `connection-pool.ts:291`,
  `rackup/lib/server.ts:300`, `trailties/lib/commands/console.ts:59-60`,
  `solid-cable.ts:86`, `actiontext/lib/content.ts:73`,
  `activerecord/src/schema-dumper.ts:80`.

## Design

### 1. The rule

A promise-valued expression is one of:

- `await`ed;
- `return`ed;
- an element of an array passed to `Promise.all` / `Promise.allSettled`
  that is itself awaited or returned;
- handed to a ruby-compat `Thread`, which owns it.

Two lint rules hold this, repo-wide, tests included:

- `no-floating-promises` with `ignoreVoid: false`: `void <promise>` is an
  error.
- `blazetrails/no-swallowed-rejection`: a `.catch(fn)` or `.then(_, fn)` whose
  `fn` is empty or only returns a constant is an error **unless the whole
  expression is awaited**. `await p.catch(() => null)` is the port of Ruby's
  `rescue nil` and stays; `p.catch(() => {})` as a statement does not.

"Pre-observe now, await later" (`callbacks.ts:1021-1043`,
`connection-pool.ts:737,802`, `mirror-service.ts:125`) attaches an empty
handler to silence an early rejection. It converges to awaiting in order, or
to `Promise.allSettled` over the whole set, awaited, with each rejection
re-raised or reported. There is no exemption tag.

### 2. A constructor never creates a promise; async `initialize` is an awaited `static new`

`blazetrails/constructor-creates-no-promise` reports, inside a `constructor`
body, a thenable-typed call whose result is dropped, voided, stored or
chained; any `.then` / `.catch` / `.finally`; and an `async` IIFE. Where Rails'
`initialize`, or a segment inlined into the constructor under RFC 0188, does
work that is async in JS, the port takes one of two shapes and no others.

**(a) `static async new` with a protected constructor.** Ruby builds an object
with `Klass.new`; here that spelling is what JS needs, a call that can be
awaited:

```ts
protected constructor(...)            // the synchronous part of initialize
static async new<T extends Klass>(this: { prototype: T }, ...args): Promise<T> {
  const obj = rbClassNewInstance(this, ...args);
  // the async remainder of initialize, in Rails' order
  return obj;
}
```

- Callers write `await Klass.new(...)`. The constructor is `protected`, so
  `new Klass(...)` outside the hierarchy is a type error and there is one way
  to build the object. That is what the operator's rejection of a static
  `new` beside a public constructor guarded against (trails#8659,
  `packages/activerecord/CLAUDE.md` § "A record is built with `new Klass`
  only").
- A subclass inherits `new` through `this` and comes back typed as itself
  (checked with `tsc --strict`, 2026-11-12). A subclass whose `initialize`
  adds async work overrides `static async new` and calls `super.new(...)`.
- `rbClassNewInstance` (ruby-compat, MRI `rb_class_new_instance`,
  `vendor/ruby/v3.3.11/object.c:2158`) holds the one cast that reaches the
  protected constructor.
- `@inlinedFrom` tags for the segments that now sit in `static new` move
  there with them; `eslint/inlined-from-placement.mjs` accepts the tag on a
  `static new` member.
- Scope: only classes whose `initialize` has async work. `ActiveRecord::Base`,
  its models, and every class with a synchronous `initialize` keep a public
  constructor and `new Klass`, and trails#8659 stands for them. No record class
  with async `initialize` work is known; if one turns up, it is an operator
  decision filed as a story, not a `static new` on a record.
- A subclass whose own `initialize` is synchronous does not re-declare
  `static new`; it inherits it through `this` (`ruby-compat-rb-class-new-instance`
  records the type and runtime tests). `SchemaDumper` (subclassed by
  `TestSchemaDumper` in `mysql/schema-dumper.trails.test.ts`) is the
  case in this RFC.

**(b) A `Thread`.** Where Rails runs the work on a background thread
(`Reaper#run`'s `Thread.new`, Action Cable's listener threads, Solid Queue's
processes), the port is ruby-compat's `Thread`, constructed where Rails
constructs it. The `Thread` owns the promise and reports an exception as
`report_on_exception` does; a waiter uses `thread.join()` / `thread.value()`.
A constructor may create a `Thread`; it may not hold the `Thread`'s promise.

There is no `ready` field, no `whenReady()`, no factory under another name,
and no lazy first-call initialisation. "How do I await a constructor
promise?" has one answer: `await Klass.new(...)`.

### 3. A sync caller of an async method becomes async

`void this.asyncThing()` inside a synchronous method converges by making the
method async and awaiting, up the call chain to the first caller that already
is. Where Rails' entry point must stay synchronous (mass assignment's
`assertAssignedSynchronously` path), it raises when handed a promise; it never
drops one. Where the async member is async only by accident of the port
(`Base.sourceRoot`'s writer, `resetColumnInformation`), the story first checks
whether the Rails method is synchronous and makes the port match before
adding awaits.

### 4. `Mutex#synchronize`

Its `T | Promise<T>` return type is accurate (§ Motivation) and stays. A
caller either:

- awaits it, becoming async up to the first already-async caller, where that
  chain stops inside the port (Action Cable's Redis adapter); or
- **at a Rails-synchronous public entry point** (Zeitwerk's `Loader#setup`,
  its `Config` setters, `Cref::Map`), stays synchronous: the block runs
  inline, and if `synchronize` hands back a promise because the lock is
  contended, the caller raises `ThreadError` instead of continuing. This is
  the sync-entry rule of § 3 applied to a lock. Ruby would block the thread
  there; JS cannot, and silently continuing is the bug this RFC removes.

### 5. Gate and ratification

- Each rule has its own per-package mark: `floating`
  (`no-floating-promises`), `swallowed` (`no-swallowed-rejection`) and
  `constructor` (`constructor-creates-no-promise`). Each is only-shrink with no
  reseed, documented in trails `docs/parity-gates.md`. Every story names the
  mark or marks it drives down.
- Each mark counts its own rule's findings. A site two rules both report
  (`void p.catch(() => {})` is a `floating` and a `swallowed` finding) counts
  once in each mark; there is no shared site count. Converging it lowers both.
- `promise-gate-marks-retire` owns the final tighten and deletes the marks.
- Trails `CLAUDE.md` gains a section ratifying §1–§2, so the rule is read
  where agents read rules, and `packages/activerecord/CLAUDE.md` § "A record
  is built with `new Klass` only" points at it for the scope boundary.

## Non-goals

- **A global `unhandledRejection` listener.** It hides the symptom; this RFC
  removes the cause.
- **Converting Rails' synchronous APIs to async beyond the chain a site
  needs.** Each convergence stops at the first already-async caller.
- **Records built with `static new`.** `Base` keeps `new Klass` (trails#8659).

## Alternatives considered

- **A `ready: Promise` field awaited by every method.** The pattern being
  retired: every method must remember the await, and a rejection has no owner
  until one is called.
- **An awaited step at the call site before a synchronous `new`.** Moves part
  of `initialize` into every caller; one that forgets builds a half-initialised
  object.
- **A factory under an invented name (`await Klass.create(...)`).** Invented
  surface; `Klass.new` is the Rails name for the same call.
- **`static async new` beside a public constructor.** Rejected in trails#8659:
  two spellings, and the bare one skips the async half. The protected
  constructor removes the second spelling.
- **Allowing `void` with a receipt tag.** Every current `void` would gain a
  tag, and the ledger would not burn down.

## Rollout

1. Gate and helpers, no deps:
   `no-floating-promises-repo-wide-ignore-void-false`,
   `no-swallowed-rejection-lint-rule`,
   `constructor-creates-no-promise-lint-rule`,
   `ruby-compat-rb-class-new-instance`,
   `inlined-from-placement-accepts-static-new`. Then
   `claude-md-ratifies-no-void-promises`, after all five.
2. Constructors, after the constructor rule and both helpers:
   `async-initialize-becomes-static-new`,
   `constructor-promises-become-threads` (constructor rule only).
3. Source sites, after the `floating` and/or `swallowed` rule:
   `mutex-synchronize-callers-await`,
   `zeitwerk-mutex-callers-stay-synchronous`,
   `reset-column-information-is-awaited`,
   `activerecord-adapter-void-calls-are-awaited`,
   `activerecord-relation-and-association-void-calls-are-awaited`,
   `activemodel-void-async-calls-are-awaited`,
   `activesupport-callbacks-stop-pre-observing-promises`,
   `actionpack-void-calls-are-awaited`, `generators-await-source-root`,
   `fire-and-forget-sites-run-on-a-thread`,
   `remaining-source-void-promises`. These are independent of each other.
4. Tests: `activerecord-tests-drop-no-promises` (after
   `reset-column-information-is-awaited`),
   `activemodel-and-remaining-tests-drop-no-promises`.
5. `promise-gate-marks-retire`, after every story in phases 2–4.

Each story's `deps` encodes exactly these edges.

## Verification

- `no-floating-promises` (with `ignoreVoid: false`),
  `no-swallowed-rejection` and `constructor-creates-no-promise` run on every
  package, tests included, and every package's mark for all three reads **0**.
- The mark files are deleted once they read 0, leaving the rules as plain
  `error`s.
- The baselines are the marks as seeded: `constructor` at 6, and `floating`
  and `swallowed` at the counts their gate stories record in their PRs. The
  § Motivation table is an estimate of the union of the last two. Burndown is
  tracked per mark.

## Open questions

None. Tests are in the gate from day one (resolved 2026-11-12): a test that
drops a promise has an assertion that may never run, and their count is
seeded into the same marks.

## Changelog

- 2026-11-12: initial RFC
- 2026-11-12: async `initialize` is `static async new` with a protected
  constructor, replacing the awaited step at the call site
- 2026-11-12: survey widened to tests and unawaited empty handlers; awaited
  `.catch(() => null)` carved out as `rescue nil`; Mutex arm stated from
  `mutex.ts`; stories split to fit the LOC ceiling; ratification and
  `@inlinedFrom` placement stories added
- 2026-11-12: review: named marks and double-count rule, Mutex sync-entry
  rule and zeitwerk split, explicit rollout edges, retirement story, story
  packages filled, subclass and record scope stated
