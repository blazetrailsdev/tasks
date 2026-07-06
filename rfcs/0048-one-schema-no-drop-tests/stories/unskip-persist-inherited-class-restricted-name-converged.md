---
title: "Un-skip converged persist-inherited-class restricted-name test"
status: done
updated: 2026-07-06
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: 10
priority: 8
pr: 4673
claim: "2026-07-06T13:52:59Z"
assignee: "unskip-persist-inherited-class-restricted-name-converged"
blocked-by: null
closed-reason: null
---

## Context

`persistence.test.ts` skips `persist inherited class with different table name`
(persistence_test.rb:1451) as tracked-pending-convergence under
`restricted-name-attribute-reader-and-dirty-tracking`. That deviation story is
now `done`/converged: un-skipping the test and running it locally on sqlite
PASSES (verified post-merge of PR #4618) — `create({ name })` + `record.name =`
now persist/dirty-track the restricted `name` attribute, so
`Aircraft.last.name === "Wright Glider"` holds.

## Acceptance criteria

- [ ] Drop the `it.skip(` → `it(` for `persist inherited class with different
table name` in packages/activerecord/src/persistence.test.ts and remove the
      restricted-name tracking note from the surrounding block comment.
- [ ] Confirm it passes on all three adapters (sqlite/postgres/mysql) via
      test:compare (Skip count for persistence_test.rb drops from 2 to 1).
- [ ] Leave `update attribute in before validation respects callback chain`
      skipped — its async-before-validation deviation still fails when un-skipped
      (re-verified post-merge).
