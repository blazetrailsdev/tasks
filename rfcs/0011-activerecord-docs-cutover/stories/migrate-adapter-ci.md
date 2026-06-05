---
title: "RFC from adapter-test-ci + ci-gates"
status: done
updated: 2026-06-04
rfc: "0011-activerecord-docs-cutover"
cluster: migrate
deps: ["reconcile-existing-rfcs"]
deps-rfc: []
est-loc: 150
pr: 4
claim: null
assignee: null
blocked-by: null
---

## Context

`adapter-test-ci-coverage-plan.md` (live-DB adapter CI lanes, the sqlite/
postgres/mysql:8 job model + the I-5 live-dir story) and `ci-gates-plan.md`
become one RFC. This is active work — `adapter-test-ci-coverage-plan.md` was
being edited as recently as the current branch. See RFC 0011 §Phase 2.

## Acceptance criteria

- [ ] New RFC authored from both docs via the placeholder → PR flow.
- [ ] Open lane/gate work → dep-aware stories; the §4/§5 sequencing and the
      proven-infeasible notes (parallel-fork advisory-lock exhaustion, etc.)
      preserved in the RFC body.
- [ ] Cross-reference the memory facts on the adapter-CI model so shipped lanes
      aren't re-storied.
- [ ] Both docs queued for deletion in `decommission-docs`.

## Notes

See memory: CI runs sqlite/postgres/mysql:8; full live-adapter drop proven
infeasible; live dirs gated on §4/§5 fixes.
