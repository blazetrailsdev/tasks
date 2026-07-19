---
title: "Give comment.test.ts dump tests a 60s timeout (PG flake)"
status: draft
updated: 2026-07-19
rfc: "0028-ci-cost-optimization"
cluster: null
deps: []
deps-rfc: []
est-loc: 6
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CommentTest > schema dump with comments` / `omits blank comments` / `with
primary key comment` (`packages/activerecord/src/comment.test.ts:133/156/202`)
intermittently fail on the PostgreSQL lane with `Test timed out in 5000ms`, even
with `retry x2`. They call `SchemaDumper.dump(adapter)` — a full-DB dump walking
every table on the shared PG worker DB (hundreds of tables under parallel
forks), which legitimately exceeds vitest's 5s default.

Precedent: #4250 (commit 37621ce72) fixed the same root cause in enum.test by
bumping that scoped-dump test to a 60s timeout. comment.test's three dump tests
never got that treatment and still run on the default 5s.

Further precedent: #4976 applied the same per-test timeout bump to
`postgresql/schema.test.ts > SchemaTest > dumping schemas`, verifying that
Rails' counterpart (`schema_test.rb:530`) is plain minitest with no per-test
budget — the 5s ceiling is a vitest artifact, not Rails behavior.

## Acceptance criteria

- [ ] The three `comment.test.ts` dump tests carry an explicit timeout (60s,
      matching #4250) instead of the 5s default.
- [ ] Do NOT rename the tests (test:compare matching).
- [ ] Comment explains the timeout is a harness artifact, not Rails behavior.
