---
title: "association-scope / inverse / assoc-callbacks → canonical schema + fixtures"
status: blocked
updated: 2026-06-11
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: ["shared-table-convergence"]
deps-rfc: []
est-loc: 450
priority: 8
pr: 3121
claim: "2026-06-11T12:35:21Z"
assignee: "associations-scope-cache-cluster"
blocked-by: "Genuine canonical conversion blocked on canonical-schema gaps: callbacks needs profiles/firms/clients; association-relation needs blogs+published; association-scope/-alias-tracker are internal scope-resolver harnesses (uuid PK, STI/namespaced-polymorphic, self-ref at_users) with no canonical analog. Requires adding missing tables to test-schema.ts first, then per-file ports. eslint-disable rejected. PR #3121 closed."
---

## Context

Umbrella cluster that motivated PR #3121 (closed). The per-file conversions are
now owned by dedicated sibling stories; this cluster tracks the **enabling
schema work** they share and is `blocked` until that lands.

Enabling work (the blocker): add the missing canonical tables/columns to
`test-helpers/test-schema.ts`, **parity-checked against Rails `schema.rb`**:

- `callbacks` (assoc) needs `profiles`/`firms`/`clients`
- `association-relation` needs `blogs` + `published`
- `association-scope` / `-alias-tracker` are internal resolver harnesses
  (uuid-PK, STI/namespaced-polymorphic, self-ref `at_users`) with no canonical
  analog — those stay file-unique, not in the shared schema.

Per-file owners (do the actual ports): `association-scope-test-canonical`,
`association-scope-alias-tracker-test-canonical`,
`association-scope-cache-test-canonical`, `association-relation-test-canonical`,
`inverse-associations-fixture-port`.

## Acceptance criteria

- [ ] Land the enabling schema additions first (one small PR): add
      `profiles`/`firms`/`clients`/`blogs`(+`published`) to `test-schema.ts`
      ONLY where Rails `schema.rb` has them; parity-check each.
- [ ] Then unblock and let the per-file sibling stories convert their files.
- [ ] No `eslint-disable` as a shortcut anywhere in the cluster.

## Definition of done

The enabling schema gaps are filled (parity with `schema.rb`) and the sibling
per-file stories are unblocked. This umbrella closes when its member files are
all out of the exclude JSON.
