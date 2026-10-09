---
title: "activerecord: registerModel is ratified as the model seat and absorbs registerSubclass"
status: in-progress
updated: 2026-10-09
rfc: "0180-activerecord-receipt-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8711
claim: "2026-10-09T14:17:56Z"
assignee: "pg-lookup-cast-type-from-column-floats-its-verify"
blocked-by: null
closed-reason: null
---

## Context

Split from `model-registry-and-register-model-are-deleted` (trails#8701, merged 2026-10-09), which
shipped the src convergence: `modelRegistry`, `registerModelConstant`, the pending counter-cache
deferral and the flush loop in `support/canonical-model-index.ts` are deleted,
`Inheritance.registerSubclass` no longer seats a constant, and no canonical model file under
`test-helpers/models/` calls `registerModel`.

**Direction change (Dean, 2026-10-09), replacing this story's original premise:**

1. `registerModel` is **kept as the interface**. It is not deleted, and the 1,796 `registerModel`
   references across 233 `*.test.ts` files stay exactly as they are.
2. `registerModel` **also handles the subclass case**, so a caller never reaches for a separate
   `registerSubclass`.

Why `registerModel` is ratifiable rather than convergeable: a Ruby
`class Foo < ActiveRecord::Base` seats the constant `Foo` by itself — the `class` keyword binds it,
and Zeitwerk autoloads the file that does — and `inherited`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:287-294`) fires at the same
moment to register the subclass. A JS `class Foo extends Base {}` binds a module-scope identifier,
seats nothing a `rbConstGet` / `computeType` lookup can find, and fires no hook; trails has no
autoloader (root CLAUDE.md § "Trails has no autoloader") and no `inherited`
(`packages/activerecord/CLAUDE.md` § "`inherited` is deferred to own-property memo guards"). So a
trails model needs an explicit seat where Ruby needs none, and the two halves Ruby does together —
bind the constant, register the subclass — are what `registerModel` does in one call.

`registerConstant` (`packages/ruby-compat/src/variable.ts:44`) is the general seat;
`registerModel` (`packages/activerecord/src/associations.ts:113-143`) is the model-specific one: it
checks the argument is a `Base` subclass, seats the qualified `rbModName` when it differs from the
JS name, and **today registers the subclass only in its array form** (`:121-131`), behind the guard
`proto !== Function.prototype && proto !== frameworkBase(m)`.

### Two different `registerSubclass`es

Only the one-argument wrapper is in scope:

- `packages/activerecord/src/inheritance.ts:123-128`, `registerSubclass(klass)` — derives the parent
  with `rbClassSuperclass` and forwards to `DescendantsTracker.registerSubclass`. This carries the
  receipt pointing at this story, and this is what `registerModel` absorbs.
- `@blazetrails/activesupport`'s two-argument `registerSubclass(parent, child)` — the port of
  `DescendantsTracker.register_subclass`, which **has** a Rails counterpart and is untouched. Its
  callers (`packages/activemodel/src/attribute-registration.ts:149`,
  `packages/activerecord/src/attributes.ts:59`) stay as they are.

The one-argument form has 93 call sites, all inside activerecord: `associations.ts:126` and six test
files — `base.trails.test.ts`, `model-schema-sync-load.trails.test.ts`,
`attribute-methods.trails.test.ts`, `model-schema-reload-recursion.trails.test.ts`,
`model-schema-load-own-table-descendant.trails.test.ts`, and `inheritance.test.ts`. It is exported
from `packages/activerecord/src/index.ts:82`.

**`inheritance.test.ts` is Rails-matched, not a `.trails.` file.** Its `registerSubclass` calls are
trails-only setup lines inside Rails-named tests, so they convert to `registerModel` like the rest,
but the test names and assertions do not move (root CLAUDE.md, "NEVER rename or reword test names").

### Register always, as `inherited` does (Dean, 2026-10-09)

`registerModel` registers the subclass for **every** model, including a direct
`class Foo extends Base`. Rails' `inherited` fires for every subclass, so registering always is the
faithful shape; the array form's guard exists only because it was the sole caller.

So the guard `proto && proto !== Function.prototype && proto !== frameworkBase(m)`
(`associations.ts:121-131`) is deleted outright rather than moved into the single-model path.
`frameworkBase` walks to the class owning `_isActiveRecordBase`
(`associations.ts:95-102`) — i.e. `ActiveRecord::Base` itself — so that guard was skipping
registration exactly for direct children of `Base`, the case Rails registers.

Nothing new is needed to protect the top of the chain: `rbClassSuperclass`
(`packages/ruby-compat/src/object.ts:199-205`) answers `null` once the superclass is
`Function.prototype`, and the absorbed body returns early on a null parent, so a `Base` receiver
seats its constant and registers nothing.

### Ordering constraint

Both live receipts name this story's slug (`associations.ts:113`, `inheritance.ts:123`). Closing
this story before they stop naming it leaves them citing a closed story, which is what
`scripts/stale-story-references.test.ts` reds on — it took down every open PR on 2026-10-08. The
trails PR below is what makes this story closable, so it lands first.

## Acceptance criteria

- [ ] A CLAUDE.md section ratifies the model seat: a Ruby `class` keyword binds a constant and fires
      `inherited`, a JS `class` declaration does neither, so `registerModel` is the port of that
      pair rather than invented surface. It states that `registerModel` is the interface application
      and test code uses, and that its 1,796 call sites are correct as written.
- [ ] `registerModel` registers the subclass in every form, for every model, as `inherited` does —
      a direct `class Foo extends Base` registers too, and the array form's
      `proto !== frameworkBase(m)` guard is deleted rather than relocated.
- [ ] The one-argument `registerSubclass` is gone from `inheritance.ts`, from the `index.ts:82`
      export and from all 93 call sites, which read `registerModel` instead. Its `@noRailsEquivalent`
      receipt goes with it.
- [ ] activesupport's two-argument `registerSubclass` and its callers in `attribute-registration.ts`
      and `attributes.ts` are untouched.
- [ ] `associations.ts:113` reads `@noRailsEquivalent PERMANENT`, citing the new section.
- [ ] No receipt names this story's slug once it closes, so
      `pnpm vitest run scripts/stale-story-references.test.ts` stays green.
- [ ] `registerModel`, its `index.ts` export and its two `*.trails.test.ts` files
      (`register-model-batch`, `register-model-canonical-guard`) stay; no test is rewritten to
      `registerConstant`, and no Rails-matched test name changes.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
