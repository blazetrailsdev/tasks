---
title: "Camelize generated attribute/ivar reads instead of emitting raw snake_case"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

While sweeping `TOKEN_CANON` for PR #5825 I measured the scorer's divergent
skeletons and found the generator emits Ruby attribute/ivar reads
**un-camelized**, as raw snake_case, while every other callee is camelized.
The port side is correctly camelCase, so each one shows up as a pure-naming
`ref:` mismatch that is not a real divergence.

Measured pairs (gen token vs port token), one per divergent def:

- `persistence.rb :: isNewRecord`, `isPersisted` — `ref:new_record` vs `ref:newRecord`
- `persistence.rb :: isPreviouslyNewRecord` — `ref:previously_new_record` vs `ref:previouslyNewRecord`
- `persistence.rb :: hasQueryConstraints` — `ref:has_query_constraints` vs `ref:hasQueryConstraints`
- `core.rb :: isStrictLoading` — `ref:strict_loading` vs `ref:strictLoading`
- `core.rb :: isStrictLoadingNPlusOneOnly`, `isStrictLoadingAll` — `ref:strict_loading_mode` vs `ref:strictLoadingMode`
- `core.rb :: arelTable` — `ref:arel_table`
- `relation.rb :: isAlreadyInScope` — `ref:delegate_to_model` vs `ref:delegateToModel`
- `model_schema.rb :: isSchemaLoaded` — `ref:schema_loaded` vs `ref:ownSchemaMemo`
- `associations.rb :: initInternals`, `associationInstanceGet`, `associationInstanceSet` — `ref:association_cache`
- also observed: `ref:connection_class`

This is a codegen naming-path bug, **not** a `TOKEN_CANON` question: papering
over it with per-name canon entries would be one entry per attribute forever.
The fix belongs in whatever path emits attribute reads, alongside the existing
callee camelization.

## Acceptance criteria

- Attribute/ivar reads are camelized on the generated side using the same
  naming path as ordinary callees.
- Golden output snapshots regenerated.
- Report the `pnpm codegen:score` matched count before and after; several of
  the defs above become `matched` if the spelling is their only divergence
  (`isNewRecord`, `isPersisted`, `isStrictLoading*`, `hasQueryConstraints`,
  `isAlreadyInScope` each show exactly one gen-only + one port-only token).
- `pnpm codegen:score --guard` stays green.
