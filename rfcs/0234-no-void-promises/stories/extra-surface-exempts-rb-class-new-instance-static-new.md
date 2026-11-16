---
title: "extra-surface does not score a static new built by rbClassNewInstance"
status: ready
updated: 2026-11-16
rfc: "0234-no-void-promises"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0234 § Design 2(a) makes an async `initialize` a `protected constructor` plus
`static async new` that builds the object with `rbClassNewInstance(this, ...)`
(MRI `rb_class_new_instance`, `vendor/ruby/v3.3.11/object.c:2158`). That is Ruby's
`Class#new`, not invented surface. But `scripts/api-compare/extra-surface.ts`
still counts such a member as novel/total extra surface, so trails#10178 had to
receipt `MiniMagick::Image.new` (`packages/mini-magick/lib/image.ts`) and
`Thor::Actions::Directory.new` (`packages/thor/lib/actions/directory.ts`) with
`@noRailsEquivalent PERMANENT`. Every later conversion would need the same tag.

trails#10178 already folds such a `static new` into the constructor for the call
gates (`foldStaticNewIntoConstructor`, `extract-ts-api.ts`) and leaves a
non-public constructor out of `countTsInternalNames`.

## Acceptance criteria

- [ ] `extra-surface.ts` does not score a `static new` that calls
      `rbClassNewInstance` beside a non-public constructor, with a unit test.
- [ ] The two `@noRailsEquivalent PERMANENT` receipts on those `static async new`
      members are removed and `pnpm parity:api:extra:gate` stays green.
