---
title: "move-module-mixin-primitives"
status: closed
updated: 2026-08-31
rfc: "0089-corelib-primitives"
cluster: null
deps: ["corelib-package-scaffold"]
deps-rfc: []
est-loc: 300
priority: 4
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "re-scoped into 0129-ruby-compat/move-module-mixin-primitives-to-ruby-compat"
---

## Context

Moves the Ruby object-model / module-mixin primitives to `packages/corelib/src/`.
Non-overlapping files with the other two move stories.

- `packages/activesupport/src/include.ts` (239 lines) — `Module#include` and
  `Module#extend`, the `included`/`extended` hook symbols (`include.ts:31-32`),
  the last-included-wins ancestry emulation (`include.ts:36-45`), **and the
  type-level halves: `Included<>` (`include.ts:94`), `Extended<>`
  (`include.ts:187`), and the shared `CallableMethods` helper they are both
  defined in terms of (`include.ts:63`)**. Header: _"Mirrors: Ruby's
  Module#include (core language feature)"_ (`include.ts:10`).

  The runtime functions and the types are one unit and move together —
  `Included<typeof QueryMethodBangs>` is how a mixed-in surface is declared
  (`include.ts:92`), so splitting them would leave the type alias in a package
  that no longer owns the mechanism it describes. **18 non-test files** across
  the workspace reference `Included<>` / `Extended<>` today.

- `packages/activesupport/src/prepend.ts` (117 lines) — `Module#prepend`, with
  `super` as an explicit first argument because TS has no runtime `super`
  (`prepend.ts:12-15`).

Neither has a `.rb` counterpart — verified: no `include*.rb` or `prepend*.rb`
anywhere under `vendor/rails/activesupport/lib/`. They are Ruby language
primitives, and CLAUDE.md's "Module mixins" section documents `include()` /
`Included<>` as the settled trails idiom for them, making them load-bearing for
every package.

**What does NOT move.** `packages/activesupport/src/concern.ts` (141 lines) has a
real counterpart at
`vendor/rails/activesupport/lib/active_support/concern.rb` — it is
`ActiveSupport::Concern`, a Rails class, and it stays where it is measurable.
Same for `delegation.ts` (`delegation.rb`), `class-attribute.ts`
(`class_attribute.rb`), `descendants-tracker.ts` (`descendants_tracker.rb`), and
`module-ext.ts` (mostly Rails: `delegate`, `mattr_accessor`, `cattr_accessor`,
`attr_internal`, all with `core_ext/module/*.rb` counterparts).

## Acceptance criteria

- [ ] `include.ts`, `prepend.ts` (+ tests) moved to `packages/corelib/src/`.
- [ ] **`corelib` is the definition site for `include()`, `extend`, `prepend()`,
      `Included<>`, `Extended<>` and the `included`/`extended` hook symbols** —
      the runtime and type-level halves stay in one file, as they are today.
- [ ] `concern.ts` **stays** in activesupport and imports from `@blazetrails/corelib`
      if it needs `include()`.
- [ ] All existing `include()` / `Included<>` / `Extended<>` call sites updated —
      **18 non-test files** reference the type-level pair; re-export from
      `activesupport/src/index.ts` if that keeps the diff under the LOC ceiling,
      and say so in the PR body rather than leaving a silent compatibility shim.
- [ ] The `Symbol.for("@blazetrails/activesupport:included")` keys
      (`include.ts:31-32`) are **renamed to a `corelib` namespace** — or the move
      is explicitly documented as keeping them for compatibility. `Symbol.for` is
      cross-realm global, so a rename is a behavior change and must be a
      deliberate call, not an accident.
- [ ] `pnpm typecheck` green; `include`/`prepend`/`concern` tests pass.
