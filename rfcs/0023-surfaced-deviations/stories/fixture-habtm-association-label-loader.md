---
title: "Fixture loader: materialize HABTM join rows from owner association labels"
status: done
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 4006
claim: "2026-06-23T14:18:10Z"
assignee: "fixture-habtm-association-label-loader"
blocked-by: null
---

## Context

Surfaced while porting `habtm with reflection using class name and fixtures`
(PR #3936, story `habtm-namespaced-classname`). Rails' fixture system
materializes HABTM join rows from an **association label** declared in the
owner's YAML — e.g. `developers.yml`'s `david: { shared_computers: laptop }`
produces a row in the `computers_developers` join table automatically
(activerecord/lib/active_record/fixture_set/table_rows.rb + fixtures.rb HABTM
handling).

trails has no equivalent loader: the join row had to be hand-declared in a new
`packages/activerecord/src/test-helpers/fixtures/computers-developers.ts`
(`{ david_laptop: { computer_id: ref(...), developer_id: ref(...) } }`), and
`developers.ts` carries a comment noting the omission as "the HABTM join-table
loader is a #2572 followup". The reviewer accepted the hand-declared join
fixture as a documented substitute, but it is a fidelity deviation: Rails
fixtures derive the join from the association label on the owner record, not a
separate join-table fixture file.

Reference files:

- trails: `packages/activerecord/src/test-helpers/fixtures/developers.ts`
  (the `shared_computers: laptop` comment), `.../computers-developers.ts`,
  `.../define-fixtures.ts`, `.../fixtures-registry.ts`.
- Rails: `activerecord/test/fixtures/developers.yml` (`shared_computers: laptop`),
  `activerecord/lib/active_record/fixture_set/table_rows.rb`.

## Acceptance criteria

- [ ] The fixture loader resolves a HABTM (or has_many-through) association
      label on an owner fixture (e.g. `david: { shared_computers: laptop }`)
      into the corresponding join-table row(s), matching Rails'
      `TableRows`/`HasManyThroughProxy` behavior.
- [ ] `developers.ts` declares `shared_computers: ["laptop"]` (or the
      Rails-faithful shape) on `david` and the hand-declared
      `computers-developers.ts` join fixture is removed; the
      `habtm with reflection using class name and fixtures` test still passes.
- [ ] Existing join-table fixtures (`developers-projects.ts` etc.) continue to
      work; this adds the label path, it does not remove the explicit-join path.
