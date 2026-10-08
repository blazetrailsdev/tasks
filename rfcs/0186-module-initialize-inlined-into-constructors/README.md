---
rfc: "0186-module-initialize-inlined-into-constructors"
title: "module initialize: inlined into constructors, marked @inlinedFrom, and scored by the parity gates"
status: draft
created: 2026-10-08
updated: 2026-10-08
owner: "@deanmarano"
packages:
  - "scripts"
  - "ruby-compat"
  - "activemodel"
  - "activerecord"
  - "activesupport"
  - "actionpack"
  - "actionview"
  - "activejob"
  - "trailties"
  - "rack"
  - "i18n"
clusters:
  - tooling
  - docs
  - conversion
  - retire
related-rfcs:
  - "0123-blocked-convergence-holding"
  - "0154-ruby-compat-surfaced-deviations"
  - "0174-activerecord-api-parity-100"
  - "0179-api-compare-crediting-rules"
priority: 3
---

# RFC 0186 — module `initialize`: inlined into constructors, marked `@inlinedFrom`, and scored by the parity gates

## Summary

Ruby lets a module define `initialize` and reach the next one up the ancestor
chain through `super`. trails ports that today with `initialize` methods that a
constructor calls, plus a chain walker in ruby-compat
(`initializeIncludedModules`) that runs each module's `initialize` in Ruby's
order. A reader opens a constructor and finds no work in it, and the parity
gates cannot see the module's body at all: three `initialize` definitions sit
in `SCOPED_SKIP_GROUPS`.

The owner ruled on 2026-10-08: **there are no `initialize` methods; constructor
inheritance is inlined.** This RFC carries that out in three parts:

1. A JSDoc marker, `@inlinedFrom`, that names the Ruby `initialize` each
   segment of a constructor came from.
2. Parity-script changes that read the marker: credit, call parity and
   staleness.
3. The conversions: 38 module-level `initialize` definitions across 11
   packages, then the retirement of the chain walker.

## Motivation

Two blocked stories turned on this
(`activemodel-api-initialize-concern-constructor`,
`activerecord-fixture-initialize-prepend-constructor`), and a third waits on
its consequence
(`record-init-internals-never-reaches-activemodel-validations`). `Model`'s
constructor carries `@missingRailsCall assign_attributes` at `model.ts:122`:
the call is made, but in an `initialize` function the gate does not pair with
the constructor.

### Baseline

Measured 2026-10-08 on trails `d6e8f514ff`, from
`scripts/api-compare/output/rails-api.json` (modules with an instance method
named `initialize`):

| Package          | Module `initialize` definitions |
| ---------------- | ------------------------------- |
| activerecord     | 7                               |
| actiondispatch   | 5                               |
| actionview       | 5                               |
| trailties        | 5                               |
| thor             | 4                               |
| activemodel      | 3                               |
| actioncontroller | 3                               |
| i18n             | 3                               |
| activesupport    | 1                               |
| activejob        | 1                               |
| rack             | 1                               |
| **Total**        | **38**                          |

Each conversion story lists its definitions with the Rails `file:line`.

On the trails side:

- 11 call sites of `initializeIncludedModules` outside ruby-compat:
  `action-controller/metal.ts:144`, `actionview/src/base.ts:237`,
  `helpers/tags/base.ts:64`, `activemodel/src/api.ts:24`,
  `type/value.ts:46`, `abstract-adapter.ts:912`,
  `abstract/connection-pool.ts:299`, `normalization.ts:100`,
  `generators/named-base.ts:39`, `thor/group.ts:306`, `thor/thor.ts:674`.
- 3 modules registered through `defineMethod("initialize", …)`:
  `activemodel/src/api.ts:27`, `activemodel/src/attributes.ts:71`,
  `activerecord/src/core.ts:826`.
- 3 `initialize` entries in `SCOPED_SKIP_GROUPS`
  (`scripts/parity/conventions.ts:843-891`): `messages/rotator.rb`, `api.rb`,
  and `fixtures.rb` with `encryption/encrypted_fixtures.rb`.

Not measured: how each of the 38 is ported today. Some are already inlined by
hand, some go through the chain walker, some sit in unported files. Each
conversion story starts by reading its sites.

## Design

### The rule

Ruby's `initialize` chain is written as JS constructors, by two rules.

1. **Rails class inherits from a class: use JS `super()`.** Statements before
   `super` that only compute arguments stay before it. Where Ruby does work on
   `self` and then calls `super`, and the parent's body does not read that
   work, `super()` is hoisted to the first line. That reorder is forced by the
   language (JS forbids `this` before `super()`), and CLAUDE.md records it as
   the sanctioned spelling.
2. **The next `initialize` up the chain belongs to a module, or the parent
   reads the child's setup: inline it.** The body is written into the
   constructor at the position Ruby's `super` occupies, line for line, and the
   constructor carries one `@inlinedFrom` tag for it.

A parent constructor does not call an overridable hook to let a subclass run
early. JS runs a subclass's field initializers after `super()` returns, so a
field such as `history = []` overwrites whatever the hook set.

### The marker

```ts
/**
 * @inlinedFrom ActiveRecord::Core#initialize rails/v8.0.2/activerecord/lib/active_record/core.rb:471-482
 * @inlinedFrom ActiveModel::API#initialize rails/v8.0.2/activemodel/lib/active_model/api.rb:80-84
 */
constructor(attributes = null) { … }
```

- It sits on the constructor's JSDoc. JSDoc attaches to declarations and the
  repo's comment lint strips prose inside bodies, so a block cannot be marked
  in place.
- One tag per inlined segment, in chain order. The order of the tags is the
  order of the segments.
- The value is a Ruby `Module#initialize` followed by its versioned source
  citation, `<source>/<version>/<file>:<first>-<last>`, the span of the `def`.
  The path is relative to `vendor/` and does not spell it. Nothing else: no
  prose, no story id, no `PERMANENT`.
- The Ruby name is the key. The citation is derived from `rails-api.json` and
  verified against it, so it is never maintained by hand: a tag whose citation
  does not match the active vendored version is red, and the gate's `--fix`
  rewrites it. Because the path does not start with `vendor/`,
  `pnpm vendor:recite` and `scripts/vendor-citations.test.ts` do not see it;
  this gate owns it. A vendor bump touches these tags mechanically.
- The citation is for the reader. It does not detect a changed Rails body;
  that stays the job of the body pins (`parity:api:pins`).
- It is valid only for `initialize`, and only on a constructor. arel's
  `inlined-from` bucket names the general case (a module member whose body
  sits on an including class's file) and pins it at 0; this tag is the receipt
  for the one case the language forces and must not widen that.

### Parity-script changes

- **Credit.** `parity:api` scores a module's `initialize` as covered when a
  constructor in the mirror of a file that includes the module carries the
  tag. The three `SCOPED_SKIP_GROUPS` entries go.
- **Call parity.** `parity:api:calls` and `parity:api:calls:args` compare a
  tagged constructor against the union of its own Rails `initialize` (when the
  class has one) and the tagged module bodies, in tag order, with each Rails
  `super` consumed by the next segment.
- **Staleness, both ways.** A tag naming a module with no `initialize` is red.
  A class whose Rails counterpart includes or prepends a module with an
  `initialize`, and whose constructor has no tag for it, is red. The second
  arm is enrolled per package as that package's conversion lands.
- **Lint.** `@inlinedFrom` on anything but a constructor, or naming anything
  but `#initialize`, is an error.

### `Model` and `Base`

`ActiveModel::API#initialize` (`api.rb:80-84`) is
`assign_attributes(attributes) if attributes` then `super()`.
`ActiveRecord::Core#initialize` (`core.rb:471-477`) sets `@new_record` and
`@attributes`, calls `init_internals` and `initialize_internals_callback`, and
only then calls `super`, which lands in `API#initialize`.
`ActiveRecord::Base` includes `ActiveModel::API` directly (`base.rb:283`); it
is not a subclass of `ActiveModel::Model`.

- `Model`'s constructor becomes `API#initialize`'s body, and the
  `@missingRailsCall assign_attributes` receipt is deleted.
- `Base` cannot let an inherited `Model` constructor assign attributes before
  `Core`'s setup, so `Base` stops extending `Model` and includes API's modules
  itself, as Rails does. Its constructor is `Core#initialize` with
  `API#initialize`'s line at the `super` position. This is the largest single
  change in the RFC and has its own story. Ruled by the owner on
  2026-10-08.

### Ordering

1. Extractor reads the tag; lint for its shape.
2. Credit, then call parity, then the staleness arm (enrolled empty).
3. CLAUDE.md section.
4. activemodel conversion (`API`, `Attributes`, `SerializeCastValue`).
5. `Base` includes API's modules; activerecord `Core`.
6. The remaining packages, in any order.
7. Retire `initializeIncludedModules` and the `initialize` registry in
   ruby-compat.

### Gating

Each conversion story enrolls its package in the staleness arm in the same PR,
so a later include of a module with an `initialize` cannot land untagged.

## Non-goals

- Turning modules into class factories to get a real `super`. The repo treats
  a class-factory module as a deviation.
- `initialize_copy` / `initialize_dup` / `initialize_clone`. Those are the
  `rbObjDup` / `rbObjClone` protocol and stay methods.
- Auditing all 885 Rails classes with an `initialize` for the hoisted-`super`
  case. Rule 1 is recorded; one story samples it, and a wider sweep is filed
  only if the sample finds drift.
- Any change to how `included` / `extended` hooks run.

## Alternatives considered

- **Keep `initialize` methods and the chain walker.** Faithful in behaviour,
  but the constructor is empty to a JS reader and the module body is invisible
  to the gates. Rejected by the owner.
- **Ratify the hand-written constructor as permanent.** Leaves the
  `assign_attributes` omission as a receipt for a call that is in fact made.
- **An overridable hook called from the parent constructor.** Breaks on class
  fields, as above.
- **Mark the inlined block in the body.** No JSDoc position for it, and the
  comment lint strips it.

## Rollout

One PR per story. The tooling stories land before any conversion, with the
staleness arm enrolled for no package, so nothing reds until a conversion
opts in.

## Verification

- `pnpm parity:api:extra:gate`, `parity:api:calls`, `parity:api:calls:args`
  green on every conversion PR.
- A plain-node import of the built `dist/` entry modules for any package whose
  constructors change, since vitest masks load-order faults.
- The three blocked stories named in Motivation close or unblock.

## End condition

- No `initialize` entry in `SCOPED_SKIP_GROUPS`.
- No `initializeIncludedModules`, and no `defineMethod("initialize", …)`, in
  the tree.
- Every package with a module `initialize` is enrolled in the staleness arm.

## Open questions

1. **Tag name.** `@inlinedFrom` is used here, as the owner named it. It shares
   a word with arel's debt bucket; `@inlinesInitialize` is the alternative.
2. **A module `initialize` included into many classes** is duplicated in each.
   Not counted yet; the conversion stories report it per module.

## Changelog

- 2026-10-08: drafted from the blocked-story triage session.
- 2026-10-08: the marker carries the versioned `file:first-last` citation,
  derived and autofixed, with no `vendor/` prefix, at the owner's direction.
- 2026-10-08: owner ruled that `Base` stops extending `Model` and includes
  API's modules itself; moved from Open questions into Design.
