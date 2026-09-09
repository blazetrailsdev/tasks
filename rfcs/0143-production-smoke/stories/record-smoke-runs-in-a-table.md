---
title: "Record every smoke run as a row"
status: draft
updated: 2026-09-09
rfc: "0143-production-smoke"
cluster: null
packages: []
deps: ["run-the-smoke-suite-on-a-schedule"]
deps-rfc: []
est-loc: 300
priority: 2
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC 0136 phase B's argument is that fleet state marshalled into JSON files
should be tables, with columns that are the struct's fields rather than a JSON
blob column "which reproduces the problem in a new place". Smoke results are
fleet state, and they are being created now — so they should start as rows
rather than be migrated into rows later.

The payoff is phase F. Its exit criterion is "every gate green throughout",
which is unanswerable today because nothing observes "throughout". With rows it
is a query.

## Acceptance criteria

- [ ] A migration adds a table whose columns are the fields — tier, assertion
      name, outcome, latency, ran-at, and the release it ran against — with no
      JSON blob column
- [ ] The suite writes one row per assertion per run
- [ ] The release identifier is the running container's image id, matching what
      `deploy.sh` treats as the honest witness
- [ ] Writing a result never fails the assertion it is recording
- [ ] Retention is decided and documented in the migration's comment

## Verification

After an hour, a `SELECT` returns rows for every tier 0–2 assertion, each
bound to the current image id.
