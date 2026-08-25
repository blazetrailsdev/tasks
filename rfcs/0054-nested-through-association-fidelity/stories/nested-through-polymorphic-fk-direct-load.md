---
title: "nested-through direct-load with polymorphic source generates wrong FK column"
status: done
updated: 2026-07-06
rfc: "0054-nested-through-association-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4662
claim: "2026-07-06T04:46:48Z"
assignee: "nested-through-polymorphic-fk-direct-load"
blocked-by: null
---

## Context

Surfaced during RFC 0019 canonical-schema burndown of
`packages/activerecord/src/associations/nested-through-associations.test.ts`.

Rails' `test_has_many_through_has_one_through_with_has_one_source_reflection`
tests `members(:groucho).nested_sponsors` which is a `has_many :through`
chain: Member → membership (has_one) → club (has_one through) → sponsors
(has_many, polymorphic `as: :sponsorable`).

On the direct-load path trails errors:
`no such column: sponsors.sponsor_club_id`

The FK on the polymorphic sponsors association is `sponsorable_id` / `sponsorable_type`,
but the nested-through direct-query builder resolves the FK using the
non-polymorphic foreign_key helper, producing `sponsor_club_id` instead.
The preload path and joins path both work correctly.

Files: `packages/activerecord/src/associations/nested-through-associations.test.ts` (line 215)
Rails source: `activerecord/test/cases/associations/nested_through_associations_test.rb` lines 144-161
Association: `Member#nested_sponsors` (through: membership→club→sponsors, polymorphic source)

## Acceptance criteria

- `members(:groucho).nested_sponsors.toArray()` returns `[sponsors(:moustache_club_sponsor_for_groucho)]`
- The `it.todo` test at line 215 of nested-through-associations.test.ts un-skips and passes on all three adapters
