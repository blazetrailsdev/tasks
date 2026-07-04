---
title: "Active Record PostgreSQL Tests failing on main @b79c16d6"
status: closed
updated: 2026-07-04
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Flaky timeout, not a regression: comment.test.ts schema-dump tests (schema dump with comments/omits blank comments/with primary key comment) exceeded the 5000ms per-test timeout under PG CI's 8-fork parallelism at b79c16d6 — the schema dump is legitimately slow on PG (~15s with retry x2 for 'schema dump with comments'). The next run on main (098e7, current HEAD) passed and the tests pass locally. Self-resolved flake; nothing to build. Re-run, don't fix."
---

## Context

## Acceptance criteria

## Definition of done

## Verification
