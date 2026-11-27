---
title: "smoke-hub-migrate seeds hub rows, so data-moving migrations run their per-row code"
status: draft
updated: 2026-11-27
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trailmap#206 added `scripts/smoke-hub-migrate.sh`. It brings the hub up to the version before the earliest hub migration the branch changes, then runs `bin/trails db:prepare`. The hub's tables exist, but they hold no rows. A data-moving migration like 20261119000008 (`rfc_refines` → `refinements`) therefore runs its per-row code (create, `summary.attach`, `updateColumn`) over zero rows. A defect in that loop passes CI.

## Acceptance criteria

- Before the release command runs, the script inserts at least one row into each hub table that exists at `start` (or loads a small hub fixture).
- Reintroducing a per-row bug into 20261119000008's `up` (for example, attaching to the wrong record) makes the step fail.
