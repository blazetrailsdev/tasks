---
title: "Create the run-db-adapters label the draft deferral documents"
status: done
updated: 2026-08-08
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: 6192
claim: "2026-08-07T18:48:45Z"
assignee: "strptime-sec-fraction-numerator-is-a-number"
blocked-by: null
closed-reason: null
---

## Context

PR #5749 shipped the draft deferral for `postgres-tests` / `maria-tests`. A
draft PR that does not touch adapter paths can force those suites back on with
the `run-db-adapters` label (`.github/workflows/ci.yml`, both jobs' `if:`, and
`DB_ADAPTERS_DRAFT_DEFERRED` in the `ci` aggregate).

**The label does not exist in the repo.** Sibling opt-in labels do
(`run-sqlite-mem`, `run-parity-sqlite`, `run-parity-postgres`,
`run-parity-mysql`). `contains()` over an absent label is simply false, so
nothing is broken — the documented escape hatch is just unreachable, and anyone
applying it via `gh pr edit --add-label` gets an error.

Not done as part of #5749 because creating a label is a repo-settings mutation
and the PR was unmerged at the time.

## Acceptance criteria

- [ ] Label created, description and colour consistent with the `run-*` siblings:

      gh label create run-db-adapters \
        --description "Run the PG + MariaDB AR suites on a draft PR" --color 0E8A16

- [ ] Applying it to a draft PR that touches no adapter path starts both suites,
      and the `ci` aggregate reports success rather than "unexpectedly skipped".
