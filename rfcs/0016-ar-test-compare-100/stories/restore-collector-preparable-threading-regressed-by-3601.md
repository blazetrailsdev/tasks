---
title: "fix(arel): restore collector.preparable threading reverted by #3601's stale squash"
status: ready
updated: 2026-06-20
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

PR #3598 (`thread-collector-preparable-for-statement-cache`, RFC 0016) landed the `collector.preparable` threading and was marked **done**, but **PR #3601** ("converge OverridingAssociationsTest to canonical") was branched before #3598 merged and its squash **accidentally reverted every one of #3598's changes** — confirmed: `git merge-base --is-ancestor 7c733678b HEAD` is true, yet `git show e9810acf4` (#3601) contains the inverse diff across all of #3598's files. The story remains marked `done (pr 3598)` so the regression is currently untracked.

Reverted infrastructure (all absent from `main` as of PR #3641, verified via `git show origin/main:...`):

- `arel` `Composite` collector starting `preparable = true` (`packages/arel/src/collectors/composite.ts` — currently `false`).
- `visit_Arel_Nodes_SqlLiteral` marking `collector.preparable = false` (to_sql.rb plain-string non-preparable; `packages/arel/src/visitors/to-sql.ts`).
- `compileWithBinds` returning the 4-tuple `[sql, binds, retryable, preparable]` (currently 3-tuple).
- `Relation` capturing `_lastSelectPreparable` and passing it via `selectAll`'s `opts.preparable` (`relation.ts`).
- `DatabaseStatements.selectAll` using `opts.preparable ?? (binds.length > 0)` instead of the bind-presence-only proxy (`connection-adapters/abstract/database-statements.ts:1512`).
- The `bind-parameter.test.ts` `statement cache with sql string literal` un-skip + `assert_includes`-equivalent (currently `it.skip`).

The original #3598 diff is recoverable verbatim: `git show 7c733678b` applies cleanly onto the current files (they are byte-identical to #3598's parent for the non-test files). Note that #3628 later re-touched `query-methods.ts` (added `normalizeBoundValue` + a NOTE deferring the `where` → `BoundSqlLiteral` wiring to `converge-build-where-clause-bound-sql-literal`), so the restore must be reconciled with #3628 rather than blindly re-applied to that file.

This was surfaced during PR #3641 (`bound-sql-literal-addbind-visitor`): the `statement cache with sql string literal` convergence depends on this infra, so that test stayed skipped there.

## Acceptance criteria

- [ ] Restore #3598's `collector.preparable` threading (Composite default-true, SqlLiteral non-preparable, `compileWithBinds` 4-tuple, `Relation._lastSelectPreparable`, `selectAll opts.preparable`), reconciled with #3628's `query-methods.ts` changes (do not clobber `normalizeBoundValue` / the deferral NOTE).
- [ ] `arel` + `bind-parameter` + `statement-cache` + `query-cache` tests pass; no regression to the IN-clause-array `not.toContain` assertion.
- [ ] Coordinate with `converge-build-where-clause-bound-sql-literal`: the `statement cache with sql string literal` un-skip needs BOTH this preparable threading AND the `where` → `BoundSqlLiteral` routing, so sequence/land them together or gate the un-skip on whichever merges second.
- [ ] Re-mark `thread-collector-preparable-for-statement-cache` appropriately, or note this story supersedes it.

## Notes

Process gap worth flagging: a test-only PR (#3601) silently reverted a merged feature PR (#3598) with no CI signal because the dependent test was left skipped. Consider whether stale-base squash detection or an un-skip guard would have caught it.
