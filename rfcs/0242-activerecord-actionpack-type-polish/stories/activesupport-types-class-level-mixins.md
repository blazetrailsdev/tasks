---
title: "activesupport class-level mixins typed without any or double casts"
status: done
updated: 2026-11-19
rfc: "0242-activerecord-actionpack-type-polish"
cluster: type-polish-neighbours
packages: [activesupport]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 450
priority: null
pr: trails#10340
claim: "2026-11-19T03:02:14Z"
assignee: "activesupport-types-class-level-mixins"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/class-attribute.ts` (11 hits), `callbacks.ts`
(9), `current-attributes.ts` (8), `rescuable.ts` (9) and `module-ext.ts` (7)
type the class-level machinery activerecord and actionpack build on. Casts
there (`as unknown as T`, `AnyClass`, 19 casts to `Record` across the
package) erase the subclass type before it reaches a model or controller.
Rails: `vendor/rails/v8.0.2/activesupport/lib/active_support/class_attribute.rb`,
`callbacks.rb`, `current_attributes.rb`, `rescuable.rb`.

## Acceptance criteria

- [ ] Hits in the files above fall from 44 to ≤ 18 (at least 60%).
- [ ] `classAttribute()` reads and writes keep the declared value type on a
      subclass, shown by a type-level test.
- [ ] A `Record<string, unknown>` cast on an options hash becomes a typed
      options interface or a narrowing guard.

## Verification

Count hits from `packages/activesupport/lib`, before and after, and record both in
the PR body:

```sh
grep -Po ': any|as any|as unknown as' class-attribute.ts callbacks.ts current-attributes.ts rescuable.ts module-ext.ts | wc -l
```

This is the RFC's Motivation command, which counts matches, not lines.
`pnpm typecheck`, `pnpm parity:lint:counts`, `pnpm test:types`,
`pnpm parity:api` and `pnpm parity:test` are green, with non-negative parity
deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
