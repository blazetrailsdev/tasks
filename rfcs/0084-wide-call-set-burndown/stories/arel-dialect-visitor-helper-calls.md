---
title: "arel-dialect-visitor-helper-calls"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages:
  - arel
deps: []
deps-rfc: []
est-loc: null
pr: 6357
claim: "2026-08-11T13:46:07Z"
assignee: "arel-dialect-visitor-helper-calls"
blocked-by: null
closed-reason: null
---

# Converge dialect-visitor helper calls (B1 slice 2/3)

## Context

B1 slice, from the 2026-08-04 re-measure (arel carries 41 live wide rows,
matching the baseline exactly). This slice is the 12 rows across the three
dialect visitors — small, mechanical, non-overlapping with the to-sql.ts
slice.

- `packages/arel/src/visitors/mysql.ts` (5 rows):
  `visitArelNodesSelectStatement` (`mysql.ts:44`) misses Rails' `new`
  (`vendor/rails/activerecord/lib/arel/visitors/mysql.rb:22` builds a
  `Nodes::Limit`); `visitArelNodesSelectCore` (`mysql.ts:84`) misses `sql`
  (`mysql.rb:29`); `visitArelNodesRegexp` / `visitArelNodesNotRegexp`
  (`mysql.ts:125`, `mysql.ts:132`) miss `infix_value` (`mysql.rb:54`,
  `mysql.rb:58`); `buildSubselect` (`mysql.ts:222`) misses `sql`
  (`mysql.rb:93`).
- `packages/arel/src/visitors/postgresql.ts` (4 rows): `visitArelNodesMatches`
  (`postgresql.ts:12`), `visitArelNodesDoesNotMatch` (`postgresql.ts:20`),
  `visitArelNodesRegexp` (`postgresql.ts:31`), `visitArelNodesNotRegexp`
  (`postgresql.ts:35`) each miss `infix_value`
  (`vendor/rails/activerecord/lib/arel/visitors/postgresql.rb:7-37`).
- `packages/arel/src/visitors/sqlite.ts` (3 rows):
  `visitArelNodesSelectStatement` (`sqlite.ts:17`) misses `new`
  (`vendor/rails/activerecord/lib/arel/visitors/sqlite.rb:12` builds
  `Nodes::Limit`); `visitArelNodesIsNotDistinctFrom` (`sqlite.ts:64`) and
  `visitArelNodesIsDistinctFrom` (`sqlite.ts:77`) miss `visit`
  (`sqlite.rb:25`, `sqlite.rb:31`).

Note the two `new` rows may prove to be the constructor-idiom extractor gap
(Ruby `X.new` ports to `new X()`, which `extractCalls` does not record — 7
baseline rows already carry that reviewed reason). If so they are 0083
tooling artifact / `@missingRailsCall` material, not convergence — classify,
don't force.

Baseline rows retired: package `arel`, files `visitors/mysql.ts`
(`visit_Arel_Nodes_SelectStatement` [`new`], `visit_Arel_Nodes_SelectCore`
[`sql`], `visit_Arel_Nodes_Regexp` / `visit_Arel_Nodes_NotRegexp`
[`infix_value`], `build_subselect` [`sql`]), `visitors/postgresql.ts`
(`visit_Arel_Nodes_Matches`, `visit_Arel_Nodes_DoesNotMatch`,
`visit_Arel_Nodes_Regexp`, `visit_Arel_Nodes_NotRegexp` — all
[`infix_value`]), `visitors/sqlite.ts` (`visit_Arel_Nodes_SelectStatement`
[`new`], `visit_Arel_Nodes_IsNotDistinctFrom` /
`visit_Arel_Nodes_IsDistinctFrom` [`visit`]).

## Acceptance criteria

- Each listed method makes the call its Rails body makes, in the same order;
  genuine non-applicability gets a reasoned `@missingRailsCall` tag at the
  call site (constructor-idiom rows may instead be filed against
  `0083-wide-call-ratchet-noise-reduction` as extractor artifact). Never a
  broadened baseline reason.
- The listed wide baseline rows are deleted by hand (only-shrink; no
  `--write` reseed).
- Bodies verified against the vendored Rails dialect visitors; arel visitor
  test files stay green.
- Single PR under the LOC ceiling; does not touch `visitors/to-sql.ts`.
