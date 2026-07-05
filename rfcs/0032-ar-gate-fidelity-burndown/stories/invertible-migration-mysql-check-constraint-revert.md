---
title: "Converge check-constraint revert test; verify mysql revert path"
status: draft
updated: 2026-07-05
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Follow-up to `gate-wrong-gate-body-convergence` (RFC 0032).
`invertible-migration.test.ts` "migrate revert add check constraint with invalid
option" is `wrong-gate`: rails `features=[check_constraints]` / ts
`adapters=[postgresql,sqlite]` (body `it.skipIf(adapterType === "mysql")` around
line 487). `check_constraints` spans all three adapters (supports.ts: ALL), so
the gate should be feature-only. The body skips mysql — verify why (the mysql
revert path for an add-check-constraint-with-invalid-option migration) and either
fix the mysql revert path or keep a BLOCKED ctx.skip with a registered impl
sub-story.

Rails: vendor/rails/activerecord/test/cases/invertible_migration_test.rb.

## Acceptance criteria

- [ ] Investigate the mysql check-constraint revert path; fix it or document the
      BLOCKED reason with a registered impl sub-story.
- [ ] Gate the test `itIfSupports("check_constraints")` (feature-only) so the
      extracted gate is `*|check_constraints`; skip mysql at runtime via ctx.skip
      (not a static adapter gate) if still blocked.
- [ ] `test:compare --gates` reports no wrong-gate for this test. Test name
      unchanged.
