---
title: "tasks CLI smoke: leaseConnection() result has no selectAll against trails 15d54db"
status: done
updated: 2026-11-10
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: tasks#336
claim: "2026-11-10T17:33:51Z"
assignee: "tasks-cli-smoke-select-all-is-not-a-function"
blocked-by: null
closed-reason: null
---

## Context

The 2026-10-30 tracking run (`~/.cache/trails-tracker/track-20261030T095738Z.log`,
candidate trails 15d54db362) failed the CLI smoke: `src/readmodel.ts:67`
(`buildIndex`) calls `conn.selectAll(...)` on `await Base.leaseConnection()`
and gets `TypeError: conn.selectAll is not a function`, failing both
"ready queue" and `bin/tasks ready --json`. The same log shows an `Rfc.writeId`
error raised from `attribute-methods/primary-key.ts:59` during assignment.

trails main still has `selectAll` (used across `packages/activerecord/src`
tests), so it is not yet known whether `leaseConnection` changed what it
returns (a framework regression: Rails' `lease_connection` returns the adapter,
which responds to `select_all`) or whether the CLI relies on something trails
never promised. Rerun against the current candidate once
track-trails-candidate-install-passes-pnpm-release-age lets a run reach the
smoke.

## Acceptance criteria

- The cause is found. If trails' `leaseConnection()` result lacks `selectAll`,
  that is filed and fixed in trails, with a test that the leased adapter
  answers `selectAll`. Otherwise the CLI is fixed.
- The `Rfc.writeId` error is explained the same way.
- `pnpm smoke` in tasks passes against a current trails main.
