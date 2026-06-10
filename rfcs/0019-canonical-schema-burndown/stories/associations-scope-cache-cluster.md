---
title: "association-scope / inverse / assoc-callbacks → canonical schema + fixtures"
status: ready
updated: 2026-06-09
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 450
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Convert the association-scope / cache / inverse / callbacks files (RFC §Rollout
phase 3).

Files (remove each from the exclude JSON as it lands):

- `associations/association-relation.test.ts` → `relations_test.rb` (AssociationRelation cases)
- `associations/association-scope.test.ts` → trails-internal scope resolver (no dedicated Rails file; behavior covered across the association suites)
- `associations/association-scope-alias-tracker.test.ts` → trails-internal AliasTracker (no dedicated Rails file)
- `associations/association-scope-cache.test.ts` → trails-internal scope cache (no dedicated Rails file)
- `associations/bidirectional-destroy-dependencies.test.ts` → `associations/bidirectional_destroy_dependencies_test.rb`
- `associations/callbacks.test.ts` → `associations/callbacks_test.rb`
- `associations/inverse-associations.test.ts` → `associations/inverse_associations_test.rb`

## Acceptance criteria

- [ ] Each file rides `TEST_SCHEMA` + canonical models + `fixtures`/`name(:label)`
      lookups where Rails does.
- [ ] Each test body matches its Rails counterpart word-for-word; test names
      unchanged.
- [ ] `pnpm vitest run` passes; zero `require-canonical-schema` errors; files
      removed from the exclude JSON.

## Notes

- `associations/callbacks.test.ts` body-port already landed (#2838, memory
  `assoc_callbacks_fixture_parity_blocked`) but the file is still on the exclude
  list — likely a near-mechanical schema-ref swap; verify body fidelity.
- `inverse-associations` dedup already shipped (#2583); schema/fixtures conversion
  only.
