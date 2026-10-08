---
title: "sqlite3: enroll the gem's tests for the wrapped methods in parity:test"
status: draft
updated: 2026-10-08
rfc: "0000-sqlite3-gem-port"
cluster: package
packages: ["sqlite3", "scripts"]
deps: ["sqlite3-database-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/sqlite3/v2.6.0/test/` holds 20 Minitest files. Four cover the surface this RFC ports: `test_database.rb`,
`test_statement.rb`, `test_pragmas.rb`, `test_integration_statement.rb`. `vendor/sources.ts`'s
`sqlite3` package has no `testPath`, so `parity:test` does not see the package;
`packages/activerecord/src/sqlite/pragmas.test.ts` exists but is matched by nothing.

Gated on RFC 0000-sqlite3-gem-port open question 4. If the answer is "no", close with that reason.

## Acceptance criteria

- [ ] `vendor/sources.ts` sets `testPath: "test"`; `scripts/test-compare/` enrolls `sqlite3` (four registrations, mark row by hand); `vendor/sources.test.ts`'s `testPathsManifest` lists it.
- [ ] The 16 files for unported surface are `unported-files` rows with the rule-1 reason; tests in the four ported files for unported methods are skips with the same reason.
- [ ] Tests for the 20 methods are ported under their Minitest names; the existing `pragmas.test.ts` matches.
- [ ] They run against better-sqlite3 in CI; `pnpm parity:test` delta for every other package is zero.

## Verification

```bash
pnpm parity:test && pnpm parity:test:assertions
```
