---
title: "Fix MySQL updatable-view insert auto-assigned primary key"
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

Follow-up to `gate-wrong-gate-body-convergence` (RFC 0032). The gate for
`view.test.ts` `UpdateableViewTest` "insert record" was converged to
`mysql,postgresql|views` (matching Rails) by gating
`itIfSupports.skipIf(adapterType === "sqlite")("views", ...)` and skipping MySQL
at runtime via `ctx.skip(adapterType === "mysql")` with a BLOCKED note.

The MySQL skip is a real impl gap: an updatable view's NOT-NULL `id` reports
default "0" (via `SHOW FULL FIELDS`) and `NO_AUTO_VALUE_ON_ZERO` keeps `id=0` in
`attributesForCreate`, so the INSERT stores literal `0` instead of letting the
underlying `books` table auto-assign. PG/Trilogy are unaffected. Fix the
view-insert path so MySQL assigns the underlying table's auto-increment id, then
drop the `ctx.skip(adapterType === "mysql")` guard so the test runs on MySQL.

Rails: vendor/rails/activerecord/test/cases/view_test.rb (UpdateableViewTest).

## Acceptance criteria

- [ ] Fix MySQL updatable-view insert so the underlying table auto-assigns the
      primary key (handle NO_AUTO_VALUE_ON_ZERO / id-default "0").
- [ ] Remove the `ctx.skip(adapterType === "mysql")` guard in
      `view.test.ts` "insert record"; the test passes on the mysql lane.
- [ ] Gate unchanged (`mysql,postgresql|views`); no wrong-gate regression. Test
      name unchanged.
