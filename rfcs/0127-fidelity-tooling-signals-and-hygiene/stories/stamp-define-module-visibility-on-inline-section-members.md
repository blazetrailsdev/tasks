---
title: "Stamp defineModule section visibility on INLINE section members too"
status: draft
updated: 2026-09-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7351 (RFC 0126) taught `scripts/api-compare/extract-ts-api.ts` to read
`defineModule(publicSection, protectedSection?, privateSection?)`
(`packages/activesupport/src/include.ts:261-279`) and stamp
`visibility: "protected" | "private"` plus `internal: true` onto the TOP-LEVEL
FUNCTIONS a protected/private section references — the Ruby analogue of
statement-position `private` / `protected` in a module body
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1604`,
`:1663`, `:1677`; `relation/spawn_methods.rb:71`).

A section member written INLINE is not covered:

```ts
export const Mod = defineModule({ pub() {} }, undefined, { priv() {} });
```

`collectModuleSectionVisibility` skips a `MethodDeclaration` /
accessor / function-expression property, because there is no top-level function
entry to stamp. The member is still extracted — `harvestObjectLiteralMethods`
records it onto the host class (and the synthesized `__mixin` module) — and it
lands there as `visibility: "public"`, exactly the inaccuracy the parent story
existed to remove, one declaration shape over.

Latent today: both non-test `defineModule` call sites
(`packages/activerecord/src/relation/query-methods.ts:1952`,
`relation/spawn-methods.ts:78`) spell every member as a reference to a top-level
function, so nothing is currently mis-stamped. But nothing stops the next mixin
from writing a private helper inline, and `add-visibility-parity-gate` will
consume this field.

## Converged shape

Have `harvestObjectLiteralMethods` take the section verdict
`collectModuleSectionVisibility` already computes, keyed by property NAME within
the section object rather than by referenced function name, and apply the same
`visibility` / `internal: true` stamp it applies to a referenced top-level
function. One reader, two declaration shapes — do not add a second visibility
mechanism beside it.

## Acceptance criteria

- An inline `defineModule({...}, undefined, { priv() {} })` member extracts as
  `visibility: "private"`, `internal: true`, both on the host class entry and on
  the synthesized `__mixin` module entry.
- The same for a `protected` inline section, and for an inline arrow-valued
  property (`{ priv: () => {} }`).
- A public-section inline member stays `visibility: "public"` with no
  `internal`.
- Unit cover in `scripts/api-compare/extract-ts-api.test.ts` beside the four
  cases #7351 added.
- `pnpm parity:api:extra` totals are UNCHANGED (the Ruby allowed set already
  includes private and protected methods, `extra-surface.ts:1199-1207`), and
  `pnpm parity:api:extra:gate` stays OK.
