---
title: "rails-error-parity-exclude grandfathers activerecord/callbacks.ts, which has no throws"
status: done
updated: 2026-09-09
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: 12
pr: trails#7640
claim: "2026-09-09T12:54:47Z"
assignee: "pg-and-mysql2-execute-return-rows-not-internal-execute-result"
blocked-by: null
closed-reason: null
---

## Context

`eslint/rails-error-parity-exclude.json:18` grandfathers
`packages/activerecord/src/callbacks.ts` from `blazetrails/rails-error-parity`.
That file contains no `throw` at all — `grep -n "throw new "` returns nothing —
so the row suppresses nothing and the baseline is one row wider than the debt
it measures.

The baseline is only-shrink by construction, so a row that no longer
corresponds to a violation is free to delete: it costs one line and lowers the
count that the RFC 0111 `exclude-burndown` cluster is burning down.

Found while removing the sibling row for
`packages/activesupport/src/callbacks.ts` in PR #7589
(`callbacks-strict-sync-guard-needs-ported-error-class`), which converged that
file's raise sites onto `ArgumentError` / `NoMethodError` / `RuntimeError`.

## Converged shape

`packages/activerecord/src/callbacks.ts` is removed from
`eslint/rails-error-parity-exclude.json`.

Sweep the rest of the list for the same shape while the context is loaded —
other rows may name files whose violations were converged by an earlier story
without the row being retired.

## Acceptance criteria

- [ ] The `packages/activerecord/src/callbacks.ts` row is gone.
- [ ] Any other row in `rails-error-parity-exclude.json` naming a file with no
      remaining bare throw is gone too.
- [ ] `pnpm lint` green with no new suppression comments and no new rows.
