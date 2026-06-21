---
title: "inverse-of: has_one :through automatic inverse (Firm/Project/Developer lead_developer)"
status: in-progress
updated: 2026-06-21
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3752
claim: "2026-06-20T23:59:25Z"
assignee: "inverse-hasone-through-inverse-of"
blocked-by: null
---

## Context

`inverse-associations.test.ts > InverseAssociationTests > "this inverse stuff"`
is `it.skip`. Rails (`inverse_associations_test.rb:313`) creates Firm/Project/
Developer and asserts `Project.reflect_on_association(:lead_developer).inverse_of`
is present and `new_project.lead_developer` is present — has_one :through with
automatic inverse_of. Needs canonical Firm/Project/Developer models with the
`lead_developer` has_one :through and through-inverse derivation.

- trails: `packages/activerecord/src/associations/inverse-associations.test.ts`
- Rails: `activerecord/test/cases/associations/inverse_associations_test.rb:313`

## Acceptance criteria

- [ ] Un-skip the test; wire canonical Firm/Project/Developer + has_one :through
      inverse_of. Test name/assertion unchanged.
- [ ] `pnpm vitest run` for the file green.
