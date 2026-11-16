---
title: "activesupport class-level mixins typed without any or double casts"
status: draft
updated: 2026-11-16
rfc: "0000-activerecord-actionpack-type-polish"
cluster: type-polish-neighbours
packages: [activesupport]
deps: [type-polish-count-double-casts]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/lib/class-attribute.ts` (11 hits), `callbacks.ts`
(8), `current-attributes.ts` (8), `rescuable.ts` (7) and `module-ext.ts` (7)
type the class-level machinery activerecord and actionpack build on. Casts
there (`as unknown as T`, `AnyClass`, 19 casts to `Record` across the
package) erase the subclass type before it reaches a model or controller.
Rails: `vendor/rails/v8.0.2/activesupport/lib/active_support/class_attribute.rb`,
`callbacks.rb`, `current_attributes.rb`, `rescuable.rb`.

## Acceptance criteria

- [ ] Combined `: any` / `as any` / `as unknown as` in those five files fall
      by at least 60%.
- [ ] `classAttribute()` reads and writes keep the declared value type on a
      subclass, shown by a type-level test.
- [ ] A `Record<string, unknown>` cast on an options hash becomes a typed
      options interface or a narrowing guard.

## Verification

Before and after counts, recorded in the PR body, from the trails root:
`grep -rPc ': any\b|as any\b|as unknown as' packages/activesupport/lib --include=*.ts`
over the files named above. `pnpm typecheck`, `pnpm parity:lint:counts`,
`pnpm test:types`, `pnpm parity:api` and `pnpm parity:test` are green, with
non-negative parity deltas.

## Definition of done

Renaming a Rails method, parameter or local, reordering control flow, or
adding a wrapper to avoid a cast does not close this story.
