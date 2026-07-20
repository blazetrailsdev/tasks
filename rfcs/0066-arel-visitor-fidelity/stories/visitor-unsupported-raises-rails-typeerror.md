---
title: "visitor-unsupported-raises-rails-typeerror"
status: ready
updated: 2026-07-20
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Visitor#visit` raises Ruby's `TypeError` with the message
`"Cannot visit #{object.class}"` (`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:39`).

trails' `packages/arel/src/visitors/visitor.ts` instead throws
`UnsupportedVisitError` with `"Unknown node type: <class>"` — a different
error class AND a different message from Rails.

`Dot` is the visitor that kept the Rails-faithful shape: its tests assert
`new TypeError("Cannot visit Money")` / `"Cannot visit Config"`
(`packages/arel/src/visitors/dot.test.ts:270-281,543`). After PR #5003 routed
`Dot` onto the inherited class dispatch, `Dot#visit` catches the base
`UnsupportedVisitError` and re-throws it as the Rails-shaped `TypeError`
(`dot.ts`, in the `withNode` block). That catch is pure adapter residue: it
exists only because the base visitor diverges.

## Acceptance criteria

- [ ] `Visitor#visit` raises Rails' `TypeError` with the message
      `Cannot visit <class>` (visitor.rb:39), or `UnsupportedVisitError`
      extends `TypeError` and carries that exact message.
- [ ] The `UnsupportedVisitError` → `TypeError` catch in `Dot#visit` is
      deleted; `dot.test.ts` stays green with no test-name changes.
- [ ] `to-sql.test.ts` and the other visitor suites updated to the Rails
      message where they assert the old one.
- [ ] api:compare / test:compare delta non-negative.
