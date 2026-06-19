---
title: "inverse-of: polymorphic eager-load preloading shares parent instance"
status: ready
updated: 2026-06-19
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`inverse-associations.test.ts > InversePolymorphicBelongsToTests > "eager loaded
child instance should be shared with parent on find"` is `it.skip`. Rails
(`inverse_associations_test.rb:939`) eager-loads a polymorphic belongs_to via
`includes(:human)` and asserts the parent/child instances are shared. In trails
polymorphic `includes()` throws EagerLoadPolymorphicError — preloading (separate
per-type queries, as Rails does) is not yet implemented for polymorphic
associations.

- trails: `packages/activerecord/src/associations/inverse-associations.test.ts`
- Rails: `activerecord/test/cases/associations/inverse_associations_test.rb:939`

## Acceptance criteria

- [ ] Un-skip the test; implement polymorphic preloading so the eager-loaded
      child shares the parent instance. Name/assertion unchanged.
- [ ] `pnpm vitest run` for the file green.
