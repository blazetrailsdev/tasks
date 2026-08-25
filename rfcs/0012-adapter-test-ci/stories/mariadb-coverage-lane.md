---
title: "MariaDB coverage lane — exercise the never-run MariaDB-specific branches"
status: done
updated: 2026-06-23
rfc: "0012-adapter-test-ci"
cluster: ci-lane
deps:
  - wire-adapter-dir-lane
deps-rfc: []
est-loc: 80
priority: 1000008
pr: 3109
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced post-merge during PRs #3051 (MySQL EXPLAIN options + optimizer hints)
and #3058 (MySQL check-constraint introspection + charset/collation dump). CI runs
**only `mysql:8`** (`.github/workflows/ci.yml:598`, `image: mysql:8`) — the
MariaDB service was deliberately dropped (RFC §"mysql:8 CI cost": owner accepted
mysql:8 for dialect fidelity). As a result, every MariaDB-specific adapter branch
is **logic-only, never executed**:

- `AbstractMysqlAdapter.analyzeWithoutExplain()` / `_explainClause()` — the
  bare-`ANALYZE` clause (MariaDB ≥ 10.1) and `supports_analyze?` /
  `EXPLAIN EXTENDED` branches in `mysql-explain.test.ts` (#3051). On mysql:8 only
  the `EXPLAIN ANALYZE` branch runs.
- `OptimizerHintsTest` MariaDB skip arm (#3051).
- `checkConstraints` `_mariadb` `cc.table_name` filter + the `\'`→`'` un-escape,
  and the `isMariaDb` assertion arm of `charset-collation.test.ts` (#3058).

All mirror Rails exactly and are gated correctly, but none are verified against a
live MariaDB server — a real (if low-severity) coverage hole.

**This story is gated on a cost/scope decision** (see RFC §"mysql:8 CI cost"):
adding a MariaDB service is a second MySQL-family CI lane, which the owner
previously traded away. Confirm the lane is wanted before building it; if the
decision is "accept unverified," close this story as won't-do and record the
rationale rather than leaving it open.

## Acceptance criteria

- A MariaDB lane exists that runs the MySQL-family adapter-dir tests under a live
  MariaDB server (mirrors the existing `mysql:8` lane wired by
  `wire-adapter-dir-lane`, with `ARCONN=mysql2` against a MariaDB service), **or**
  a scripted local-verification path that exercises the same branches if a full CI
  lane is declined.
- The MariaDB-specific branches actually execute: `analyzeWithoutExplain()` /
  bare-`ANALYZE`, the `supports_analyze?` / `EXPLAIN EXTENDED` test arms,
  `OptimizerHintsTest`'s MariaDB skip, and `checkConstraints`' `_mariadb` filter +
  un-escape + the `isMariaDb` charset-collation arm.
- If a lane is added: CI cost is measured and recorded (the original mysql:8 swap
  was a cost decision); the lane runs only the MySQL-family adapter dirs, not the
  full suite.
- If declined: the won't-do rationale is recorded here and in RFC §"mysql:8 CI
  cost", and the affected tests' MariaDB arms are documented as
  logic-only/unverified.

## Notes

Builds on the now-`done` `wire-adapter-dir-lane` (#2938). The MariaDB-vs-mysql:8
cost tension is the crux — this is as much a decision as an implementation. RFC
0008's `phase2-mariadb-template` is a _test-perf_ template primitive, not a
coverage lane; this story is orthogonal to it.
