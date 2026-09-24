---
title: "base-subclasses-onto-descendants-tracker"
status: claimed
updated: 2026-09-24
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 9
pr: null
claim: "2026-09-24T13:40:32Z"
assignee: "adapter-class-sync-retires-with-eager-adapter-resolution"
blocked-by: null
closed-reason: null
---

## Context

Split out of `relocate-core-ext-shaped-permanent-receipts`. `Base.subclasses`
(`packages/activerecord/src/base.ts`, the static getter above `descendants`) scores
`moved`. In Rails, `ActiveRecord::Base.subclasses` is Ruby's native `Class#subclasses`
(3.1+), filtered by `ActiveSupport::DescendantsTracker::ReloadedClassesFiltering#subclasses`.
That filter is prepended onto `Class` in
`activesupport/lib/active_support/core_ext/class/subclasses.rb:23`, and
`DescendantsTracker.subclasses(klass)` (`descendants_tracker.rb:98`) just calls
`klass.subclasses`. `Base` gets `descendants` from `extend ActiveSupport::DescendantsTracker`
(`activerecord/lib/active_record/base.rb:286`, `descendants_tracker.rb:106-109`).

Trails keeps two subclass registries, and the getter merges them:

- `_subclasses`, an own-property array written by activerecord's
  `inheritance.ts` `registerSubclass` (itself `@noRailsEquivalent PERMANENT`).
- activesupport's `DescendantsTracker` WeakSet map (`descendants-tracker.ts`), fed by
  activemodel's `attribute-registration.ts` and activerecord's `attributes.ts`.

In trails, `DescendantsTracker.subclasses(klass)` reads its own map. Rails reverses
this: the singleton method delegates to `klass.subclasses`.

## Acceptance criteria

- One subclass registry: activerecord's `registerSubclass` feeds
  `DescendantsTracker`, and the `_subclasses` own-property array goes away.
- `Base.subclasses` moves off `base.ts` to the activesupport file that mirrors
  `core_ext/class/subclasses.rb` / `descendants_tracker.rb`, and is mixed into `Base`
  the way `extend ActiveSupport::DescendantsTracker` does it. Otherwise it carries a
  receipt that cites the specific TS shortcoming (JS has no `Class#subclasses`).
- `Base.descendants` follows `DescendantsTracker#descendants`
  (`DescendantsTracker.reject!(self.subclasses)` then the recursive concat).
- `pnpm parity:api:extra:gate` is green.
