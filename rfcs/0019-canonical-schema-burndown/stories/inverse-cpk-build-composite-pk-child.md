---
title: "inverse-of: composite-PK build sets inverse on child (Cpk::Author/Book/Order)"
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

`inverse-associations.test.ts > InverseHasManyTests > "inverse should be set on
composite primary key child"` is `it.skip`. Rails
(`inverse_associations_test.rb:629`) builds a Cpk::Author with
`author.books.build(id: [nil, 1], ...)`, attaches a Cpk::Order, `author.save!`,
and asserts `book.association(:order)` is loaded — composite-PK build sets the
inverse on the child. Needs Cpk::Author/Book/Order canonical wiring + composite
build-inverse.

- trails: `packages/activerecord/src/associations/inverse-associations.test.ts`
- Rails: `activerecord/test/cases/associations/inverse_associations_test.rb:629`

## Acceptance criteria

- [ ] Un-skip the test; converge composite-PK build inverse. Test name/assertion
      unchanged.
- [ ] `pnpm vitest run` for the file green.
