---
title: "setBelongsTo composite foreign-key inference convergence"
status: ready
updated: 2026-06-18
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced while clearing the trails-specific bodies from the first
`AssociationsTest` describe in `packages/activerecord/src/associations.test.ts`
(RFC 0019 `assoc-associations-test-wave-final-drop-exclude`). Two bespoke tests —
`setBelongsTo infers composite foreign key from target primary key` and
`setBelongsTo nullifies inferred composite foreign key` — ratified a trails
deviation, so they were removed rather than converted (deviation policy: always
converge, never ratify).

`setBelongsTo` (packages/activerecord/src/associations.ts:2762-2767) infers a
_composite_ foreign key for a `belongs_to` whose target has a composite primary
key by mapping each PK component to `${underscore(assocName)}_${col}` — e.g.
`belongs_to :infParent` against a `[region_id, id]` PK yields
`[inf_parent_region_id, inf_parent_id]`.

Rails does NOT do this. `ActiveRecord::Reflection#derive_foreign_key`
(vendor/rails/activerecord/activerecord/lib/active*record/reflection.rb:827) returns the
scalar `"#{name}_id"` for `belongs_to?`, and composite foreign keys are derived
from `query_constraints` via `derive_fk_query_constraints`
(reflection.rb:839) — never per-component `<name>*<pkcol>`. So the trails
inference is a deviation with no Rails counterpart and no canonical model that
exercises it.

## Acceptance criteria

- [ ] Converge `setBelongsTo`'s default foreign-key derivation to Rails: scalar
      `"#{name}_id"` for `belongs_to`, with composite keys resolved through
      `query_constraints` (matching `derive_fk_query_constraints`), not
      `<name>_<pkcol>` per-component mapping.
- [ ] Add Rails-faithful coverage on canonical CPK/Sharded models (e.g.
      `CpkBook`/`CpkOrder` or `Sharded::Comment`/`Sharded::BlogPost`) for the
      composite `belongs_to` assign + nullify paths.
- [ ] test:compare delta non-negative.
