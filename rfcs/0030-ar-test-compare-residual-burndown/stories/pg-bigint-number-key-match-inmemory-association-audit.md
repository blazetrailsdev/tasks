---
title: "Audit non-preloader in-memory association matching for BigInt-PK/number-FK key mismatch"
status: in-progress
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 3
pr: 4622
claim: "2026-07-05T16:37:27Z"
assignee: "pg-bigint-number-key-match-inmemory-association-audit"
blocked-by: null
---

## Context

Follow-up to `pg-bigint-pk-number-fk-association-key-match` (PR #4010), which
fixed the BigInt-PK / number-FK key mismatch in the **preloader** only
(`packages/activerecord/src/associations/preloader/association.ts` `_convertKey`).
On the PG bigserial-PK lane, node-postgres parses an int8 PK to `BigInt` and an
int4 `integer`/`references` FK to `number`; `1n !== 1` as JS Map/Set keys.

The preloader path is fixed, but the same artifact can affect **other in-memory
association matching paths** that build Maps/Sets keyed by owner PK and look up
by child FK (or vice versa), which PR #4010 deliberately scoped out:

- has_many_through in-memory join matching (`through-association.ts`,
  `has-many-through-association.ts`)
- collection-association in-memory target matching / `find_target` dedup
- inverse-association wiring that keys by id

## Acceptance criteria

- [ ] Audit `packages/activerecord/src/associations/**` for owner-PK / child-FK
      comparisons or Map/Set keying that would mismatch a `BigInt` against a
      `number` (grep for `.get(`/`.set(`/`new Set`/`Map` keyed on id/fk).
- [ ] Normalize key type on both sides (mirror the preloader's `_convertKey`
      bigint→number-within-safe-range-else-string approach), so matching is
      width-agnostic like Ruby `Integer ==`.
- [ ] Add a regression test per fixed site forcing a BigInt owner PK
      (via `writeCastValue`) and asserting matches; green on all three lanes.
- [ ] If no remaining sites are found, close as a verified no-op audit.
