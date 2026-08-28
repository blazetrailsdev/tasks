---
title: "extractor-schema-entity-level-fields"
status: ready
updated: 2026-07-27
rfc: "0000-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 10
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

Raised in review of PR #5336 (`extra-surface-mixin-pseudo-module-host-leak`).

`scripts/api-compare/extractor-schema.ts:52` — `EXTRACTOR_OUTPUT_FIELDS` is the
auditable half of the ts-api cache token (the PR #4020 trap: a field added to
the extractor without a token bump makes stale cache entries serve manifests
missing that field, and the dependent gate reports the inverse of reality).

The list is scoped to per-METHOD fields mirroring `MethodInfo`. Entity-level
`ClassInfo` fields are not tracked and never have been: `includes`, `extends`,
`superclass`, `name`, `file`, and now `synthesizedMixin`
(`scripts/api-compare/types.ts:105`, emitted at
`scripts/api-compare/extract-ts-api.ts:587`).

No live gap today. An entity-level field only needs its own token input when it
can change without any per-method field changing, and every entity-level field
so far shipped alongside the per-method field its consumer reads —
`synthesizedMixin` pairs with `declaredIn`
(`scripts/api-compare/extra-surface.ts:412`, which gates on BOTH), so
registering `declaredIn` already evicts every entry predating the pair.

The gap is forward-looking: a future change that adds or re-semantics an
entity-level field ALONE, or a consumer change that starts depending on an
existing entity-level field in a new way, would not bust the token. The
source-hash backstop (`EXTRACTOR_SOURCES`) covers edits to the extractor
scripts but not edits confined to a consumer such as `extra-surface.ts`.

## Acceptance criteria

- Decide and implement one of: (a) a second declared list —
  `EXTRACTOR_ENTITY_FIELDS` — folded into `extractorSchemaToken` alongside
  `EXTRACTOR_OUTPUT_FIELDS`, seeded with the existing `ClassInfo` keys
  including `synthesizedMixin`; or (b) an explicit documented decision that
  entity-level fields stay out of the token, with the invariant that makes it
  safe stated where a future author will hit it.
- If (a): confirm the one-time cache bust is acceptable and that
  `extractor-schema.test.ts` pins the new list the way it pins `calls` and
  `declaredIn`.
- Either way, remove the pointer to this story from the
  `EXTRACTOR_OUTPUT_FIELDS` JSDoc once resolved.

## Path refresh — 2026-08-17

Citations in this body predate the RFC 0092 `parity:*` consolidation, which moved
several modules out of `scripts/api-compare/` into `scripts/parity/`. Verified
current locations:

- `scripts/api-compare/types.ts` -> `scripts/parity/types.ts`

## Re-verified 2026-08-17 (ready sweep)

`scripts/api-compare/types.ts` moved to `scripts/parity/types.ts`;
`extractor-schema.ts` stayed in `scripts/api-compare/`.
