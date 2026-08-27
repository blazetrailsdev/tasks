---
title: "arel: 300 TS-only tests live inside Rails-named test files; one Rails-named body is weaker than Rails"
status: draft
updated: 2026-08-27
rfc: "0105-ar-deps-test-parity-100"
cluster: test-placement
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` reports arel at 707/707 (100%) — and 300 "extra (TS only)"
tests. 1,404 TS tests exist against 707 Rails ones, and most of the surplus
sits inside the Rails-named files rather than the `.trails.test.ts` twins the
package already has for exactly this purpose:

| Rails-named TS file | Rails tests | TS-only tests in it | `.trails` twin exists |
| --- | --- | --- | --- |
| `visitors/to-sql.test.ts` | 131 | 112 | yes (29 tests) |
| `select-manager.test.ts` | 113 | 42 | yes (10) |
| `visitors/dot.test.ts` | 16 | 35 | yes (6) |
| `table.test.ts` | 25 | 25 | yes (4) |
| `nodes/node.test.ts` | 2 | 21 | no |
| `nodes/casted.test.ts` | 1 | 18 | no |
| `nodes/homogeneous-in.test.ts` | 2 | 14 | no |
| `nodes/bound-sql-literal.test.ts` | 2 | 13 | no |
| `nodes/binary.test.ts` | 2 | 12 | no |

Nine further files have no Rails counterpart at all but lack the `.trails`
suffix: `attribute-alignment.test.ts`, `expression-mixins.test.ts`,
`math.test.ts`, `nodes/function.test.ts`, `nodes/matches.test.ts`,
`nodes/unary-reparent.test.ts`, `predications-privates.test.ts`,
`predications.test.ts`, `visitors/visitor.test.ts` (`describe("Arel::Nodes::FunctionTest")`
even borrows a Rails-style suite name that does not exist upstream).

One Rails-named test also asserts something weaker than Rails:
`collectors/sql-string.test.ts:18-23` "returned sql uses utf8 encoding" builds
its own `SQLString`, appends `"SELECT"` and checks `typeof result === "string"`;
`vendor/rails/activerecord/test/cases/arel/collectors/sql_string_test.rb:35-38`
compiles `ast_with_binds` and asserts on its encoding. It credits on
`parity:test` while exercising nothing the Rails test exercises.

Two `.trails` tests reuse a Rails test name verbatim
(`delete-manager.trails.test.ts` "handles limit properly",
`visitors/sqlite.trails.test.ts` "does not support boolean"), which is how a
trails-only test can be mistaken for the ported one.

## Acceptance criteria

- Every `it()` in a Rails-named arel test file has a same-named Rails test;
  TS-only tests move to the sibling `.trails.test.ts` (created where missing),
  bodies unchanged, names unchanged.
- The nine unsuffixed TS-only files are renamed to `*.trails.test.ts`.
- `collectors/sql-string.test.ts` "returned sql uses utf8 encoding" compiles
  `astWithBinds()` as Rails does (the encoding assertion becomes the nearest
  TS-expressible check on that compiled string).
- The two duplicated-name `.trails` tests are renamed (they are trails-only,
  so the never-rename rule does not apply) or deleted if redundant.
- `pnpm parity:test` stays 707/707 for arel with the extra count at 0 for
  Rails-named files.
