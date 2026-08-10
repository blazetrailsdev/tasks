---
title: "resolve-libsql-whole-file-no-counterpart-case"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6229
claim: "2026-08-08T10:51:58Z"
assignee: "resolve-libsql-whole-file-no-counterpart-case"
blocked-by: null
closed-reason: null
---

## Context

`extra-surface-resolve-remaining-whole-file-cases` (RFC 0072) resolved two of
its three whole-file no-counterpart cases with file-level `@noRailsEquivalent
PERMANENT` reasons:

- `connection-adapters/abstract/sql-datetime.ts` — 12 novel, 0 moved
- `connection-adapters/abstract/temporal-wire.ts` — 10 novel, 0 moved

The third, `packages/activerecord/src/sqlite/libsql.ts` (13 novel, **5 moved**),
was deliberately left out: `fileTagVerdict`
(`scripts/api-compare/extra-surface.ts:359-366`) refuses a file-level tag —
hard failure, not a silent no-op — whenever any extra in the file scores
`moved`, and libsql.ts has five: `close`, `databaseExists`, `isOpen`, `open`,
`prepare`.

Those five are on `LibsqlConnection` / the `libsqlDriver` object literals: a
binding to the `libsql` npm client (`sqlite/libsql.ts:26,70,297`). Ruby binds
exactly one SQLite driver (`gem "sqlite3"`, sqlite3_adapter.rb:14) and the C
extension, not Rails, owns `open`/`prepare`/`close`, so there is no Rails
method for these to relocate onto — which is exactly the reason
`connection-adapters/libsql-adapter.ts` already carries a file-level
`PERMANENT` tag for its sibling subclass. The `moved` verdict here looks like
bare-short-name resolution against unrelated Rails methods rather than a real
misplaced port.

So neither of the story's two answers applies as written, and it needs its own
judgement: either establish that the five `moved` scores are comparator
coincidence and give `fileTagVerdict` a way to say so, or find the real Rails
counterpart each one is being credited against and act on it.

## Acceptance criteria

- [ ] For each of `close`, `databaseExists`, `isOpen`, `open`, `prepare` in
      `sqlite/libsql.ts`, the Rails name the report credits it against is
      identified and stated (which `.rb` file/method the `moved` edge resolves
      to).
- [ ] `sqlite/libsql.ts` is resolved: either the file takes a file-level
      `@noRailsEquivalent PERMANENT` reason (with whatever `fileTagVerdict`
      change that soundly requires, reviewed on its own terms), or the names
      that genuinely are misplaced ports move to their Rails-layout home.
- [ ] No name is tagged `CONVERGEABLE` as a way of deferring.
- [ ] `pnpm parity:api:extra --package activerecord` and
      `pnpm vitest run scripts/api-compare/extra-surface.test.ts` pass; the
      novel-total movement is stated in the PR body.
