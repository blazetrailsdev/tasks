---
title: "activemodel: receipt the no-counterpart utility files — sentinels, codecs, index barrel, trailtie, _accessor, MutableModule, TypeRegistry"
status: ready
updated: 2026-09-01
rfc: "0134-activemodel-surfaced-deviations"
cluster: receipt-hygiene
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The remaining unreceipted novel surface outside the big Type/ValueType story
(`pnpm parity:api:extra --package activemodel`, 2026-09-01):

- `index.ts` — 18 novel: the `*Type` re-export aliases (fall out of the
  Type/ValueType story), plus `typeRegistry`, `getDefaultTimezone`,
  `isUtcTimezone`, `isDateInfinity`, `isDateNegativeInfinity`,
  `dirtyInitAttributes` — barrel-level invented names; fold, delete, or
  receipt each.
- `type/internal/sentinels.ts` (3 novel) and `attribute-set/codecs/{codec,json,yaml}.ts`
  (4 novel incl. `AttributeSetCodecError`) — whole no-counterpart files; the
  codecs replace Ruby `Marshal`/`YAML`, plausibly PERMANENT-able, currently
  unreceipted.
- `validations/_accessor.ts` `inspectAccessor`, `type/helpers/mutable.ts`
  `MutableModule`, `type/registry.ts` `TypeRegistry` (Rails: `Registry`,
  `type/registry.rb`), `trailtie.ts` `initialize`/`Trailtie`,
  `attribute-methods.ts` `attrName` + `AttributeMethods` grouping object,
  `naming.ts` `toJSON` (moved).

Each name gets one of the three sanctioned dispositions: delete, fold into the
ported member, or a legal `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>`
receipt. `TypeRegistry` is a rename question — check what
`docs/ruby-ts-conventions.md` produces from `Registry` before receipting.

## Acceptance criteria

- Every listed name receipted, folded, or deleted; activemodel's unreceipted
  novel count in `parity:api:extra` reflects only the Type/ValueType story's
  remainder.
- No baseline/mark widened anywhere.
