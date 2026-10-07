---
title: "Lowering for mixins, macros, super and the async fixpoint: the marker count falls"
status: draft
updated: 2026-10-07
rfc: "0000-ruby-ts-codegen"
cluster: tooling
packages: []
deps: ["codegen-lowering-and-first-output"]
deps-rfc: []
est-loc: 1300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`codegen-lowering-and-first-output` declines every `include`/`extend`, `class_attribute`, `delegate`,
`attr_*`, `super` and every call that should carry an `await`. This story
lowers them, and is measured by how far the activejob marker count falls
against that story's recorded baseline.

**Mixins and macros.** `include M` lowers to `include()` with `Included<>`
on the type side, `extend M` to `extend()` with `Extended<>`; a Concern's
`included do` becomes the symbol-keyed `included` callback and
`class_methods do` the extended module, in the shape trails PR 8574 gave
`AbstractController::Helpers` (CLAUDE.md "Module mixins"). `class_attribute`
lowers to activesupport `classAttribute()` plus a declared static;
`delegate` to activesupport's `delegate()` (`module-ext.d.ts`) plus a
declared member whose kind and signature are copied from the checker's view
of the target; `attr_*` to fields and accessors; `alias_method` assigns the
same member; a `private` section to TS `private`/`protected` plus
`@internal`. `delegate_missing_to`, `method_missing` and `define_method`
stay declined.

**`super`.** In a class method, `super.m(...)`, with zsuper rebuilding the
def's own parameters into the options idiom. In a module function there is
no JS `super`; it stays declined with `module-super`. The retired tool's
static linearization is not carried over.

**Async.** Seeds are calls whose resolved signature returns `Promise` or
`PromiseLike`. A def containing an awaited call is async; its skeleton return
type becomes a promise; the pass repeats to a fixpoint over resolved edges
only. A block containing an await becomes an async arrow only when the
callee's parameter type accepts one; `each` with an awaiting body lowers to
`for...of`; otherwise the statement declines. An await inside `initialize`
or an async override of a synchronous trails member (TS2416) declines the
def. A def containing a decline is async-undetermined and emitted as
inferred so far; if the finishing agent makes it async, the type system
reports every caller that used the value synchronously. On activejob the
cascade lands in `enqueuing.rb`, `execution.rb` and `callbacks.rb`
(`perform_now`, `enqueue`, `execute`), which RFC 0169's Design already
treats as async.

## Acceptance criteria

- [ ] Each macro and mixin form above has a lowering and a unit test; the
      emitted shapes match the ones `packages/actionpack/src/abstract-controller/helpers.ts`
      uses.
- [ ] `super` in class methods lowers; zsuper forwards the def's parameters;
      module `super` declines with `module-super`.
- [ ] The async fixpoint runs over resolved edges, inserts `await`, lowers
      `each`-with-await to `for...of`, and declines the two hard stops; a
      test shows `ActiveJob::Base.perform_now` and `enqueue` come out async.
- [ ] The `codegen-lowering-and-first-output` test (generate activejob, run
      `tsc`) still passes.
- [ ] The marker count on activejob is recorded before and after, by reason,
      and the `include`/`extend`/`class_attribute`/`delegate`/`super`/
      `await` reasons are at or near zero after.

## Verification

`pnpm codegen activejob --out /tmp/aj && pnpm exec tsc -p /tmp/aj` is green;
the PR body carries the before/after marker table.
