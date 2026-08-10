---
title: "extra-surface: mixin pseudo-modules leak the whole host interface"
status: done
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: extra-surface
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5336
claim: "2026-07-26T02:22:52Z"
assignee: "extra-surface-mixin-pseudo-module-host-leak"
blocked-by: null
closed-reason: null
---

## Context

Found by the `extra-surface-activerecord-top-files-inventory` spike
(2026-07-25). The story's original hypothesis — that `inheritance.ts`'s novel
list containing `loadBelongsTo`, `restoreAttribute`,
`savedChangeToAttributeValues` meant re-export double-counting — is confirmed,
but the mechanism is the **mixin pseudo-module the extractor synthesizes**,
not re-exports.

`scripts/api-compare/extract-ts-api.ts` synthesizes a pseudo-module for any
exported function whose RETURN type has construct signatures (the
`getConstructSignatures()` branch, `extract-ts-api.ts:691-706`), keyed
`<file>:<fnName>__mixin`, whose `instanceMethods` are the members of the
returned constructor's instance type. There is no `this`-parameter handling
anywhere in the extractor: the `inheritance.ts` helpers match because they
return `typeof Base`, not because they are `this`-typed. Selecting files by
grepping for `this:` picks the wrong set. `inheritance.ts` yields seven of them
(`computeType__mixin`, `baseClass__mixin`, `getStiBase__mixin`,
`findStiClass__mixin`, `stiClassFor__mixin`, `polymorphicClassFor__mixin`,
`discriminateClassForRecord__mixin`) and **each carries all 136 members of the
host type** — none of which `inheritance.ts` declares. Verify with:

```text
grep -n "isEqual\|toSlug\|attributeNamesList\|loadBelongsTo" \
  packages/activerecord/src/inheritance.ts   # → no matches
```

`toSlug` is declared once, at `packages/activerecord/src/base.ts:4486`;
`attributeNamesList` at `attribute-methods.ts:126`; `loadBelongsTo` at
`associations.ts:1413`. `extra-surface.ts:395-419` (`collectTsFileNames`)
buckets modules by `ClassInfo.file`, so the whole host interface lands on
whichever file declares the mixin function.

Scale (measured against `pnpm parity:api:extra --package activerecord --json`,
cross-referenced with `ts-api.json`): only 6 activerecord files declare
`__mixin` pseudo-modules, but they account for **343 of the package's 2084
moved extras (16%) and 14 of 776 novel**, entirely fabricated:

| file                         | moved extras | mixin-only |
| ---------------------------- | ------------ | ---------- |
| `associations.ts`            | 94           | 94         |
| `inheritance.ts`             | 98           | 94         |
| `relation/delegation.ts`     | 97           | 93         |
| `migration/compatibility.ts` | 63           | 62         |

Novel leakage is the same five names on three files: `attributeNamesList`,
`isEqual`, `toSlug`, `loadBelongsTo`, `loadHasOne`.

A host-interface member is by definition declared elsewhere; it is never this
file's surface. The `__mixin` pseudo-module exists so the parity:api
Rails-layout check can see which host a mixin attaches to — that use is
legitimate; the bug is that extra-surface treats it as declared surface.

## Acceptance criteria

- `extra-surface.ts` no longer counts members of `<file>:<fn>__mixin`
  pseudo-modules as that file's own surface. The mixin _function's own name_
  (`computeType`, `baseClass`, …) must still be counted — it really is
  declared there, and it usually arrives via `fileFunctions` anyway; assert
  that explicitly so the fix doesn't over-filter.
- The filter keys off how the extractor marks these entries, not a `__mixin`
  substring match on user-controllable names — if no marker field exists, add
  one in `extract-ts-api.ts`.
- Test in `scripts/api-compare/extra-surface.test.ts` with a fixture file
  declaring one exported function returning a constructor whose instance type
  has a member the file does not declare; assert the member is absent from extras
  and the function name is present.
- `pnpm parity:api && pnpm parity:api:extra --package activerecord`: moved drops by
  ~343 and novel by ~14; `associations.ts` moved 94 → ~0, `inheritance.ts`
  98 → ~4, `relation/delegation.ts` 97 → ~4, `migration/compatibility.ts`
  63 → ~1. Record exact numbers.
- Confirm no other api-compare consumer depends on `__mixin` entries carrying
  the host interface before changing the extractor shape.
