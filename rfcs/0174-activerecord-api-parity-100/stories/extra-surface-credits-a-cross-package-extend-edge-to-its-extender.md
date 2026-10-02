---
title: "parity: the extra-surface scorer follows a cross-package extend edge to the extender"
status: draft
updated: 2026-10-02
rfc: "0174-activerecord-api-parity-100"
cluster: receipts
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the `activerecord-audit-permanent-receipts-root-a-m` audit: the receipt below was `PERMANENT`, no CLAUDE.md section ratifies it, and it is re-tagged `CONVERGEABLE` onto this story.

`ActiveRecord::Base` gets `subclasses` and `descendants` from
`extend ActiveSupport::DescendantsTracker` (`vendor/rails/v8.0.2/activerecord/lib/active_record/base.rb:286`); `subclasses` is defined in
`vendor/rails/v8.0.2/activesupport/lib/active_support/descendants_tracker.rb`.

`packages/activerecord/src/base.ts` declares the type of that extended member,

```ts
declare static readonly subclasses: (typeof Base)[];
```

and the extra-surface scorer files it as a moved name
(`subclasses → activesupport descendants_tracker.rb ActiveSupport::DescendantsTracker.subclasses`),
so it carries `@noRailsEquivalent`. The same file's `declare static x: typeof Mod.x` lines for
modules of its own package score as inlined-from and need no receipt: the include graph resolves a
same-package `include` / `extend` edge and stops at a package boundary.

Tried in the audit PR: spelling the declaration `typeof ReloadedClassesFiltering.subclasses`. It
still scores moved, and it widens the element type to `AnyClass`, which costs casts at the readers.

## Converged shape

Either the scorer follows `extend ActiveSupport::DescendantsTracker` across the package boundary,
so a declared type for an extended member is allowed where a same-package one already is; or
`Base` is typed through `Extended<>` from `@blazetrails/activesupport` (CLAUDE.md § "Module mixins")
and the `declare` line is deleted. Prefer the second if `Extended<>` can carry the `(typeof Base)[]`
element type.

## Acceptance criteria

- [ ] `base.ts`'s `subclasses` declaration carries no receipt, or is deleted.
- [ ] If the scorer changes, a unit test in `scripts/api-compare/extra-surface.test.ts` covers a cross-package extend edge, and no other package's totals move unexplained.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:receipts:gate` stay green.
