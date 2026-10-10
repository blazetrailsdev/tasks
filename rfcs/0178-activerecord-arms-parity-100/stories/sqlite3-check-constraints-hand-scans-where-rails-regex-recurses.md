---
title: "activerecord: sqlite3 check_constraints balances parentheses by hand where Rails' regex recurses"
status: done
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: ["activerecord", "ruby-compat"]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8759
claim: "2026-10-10T16:39:42Z"
assignee: "base-load-schema-primary-key-warm-arm-moves-to-primary-key-resolution"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::SchemaStatements#check_constraints`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3/schema_statements.rb`,
`def check_constraints`) scans the table SQL with one regex whose `expression` group calls itself,
`\((?<expression>(:?[^()]|\(\g<expression>\))+)\)`. JS `RegExp` has no subexpression call, so the port
(`packages/activerecord/src/connection-adapters/sqlite3/schema-statements.ts`) matches the
`CONSTRAINT name CHECK (` prefix and balances parentheses in a hand-written loop. It carries
`@inventedArm loop` and `@inventedArm if`, both `CONVERGEABLE` against this story.

## Acceptance criteria

- [ ] The balanced-parenthesis scan lives behind one ruby-compat entry point that stands for Ruby's
      `String#scan` with a recursive group, cited to MRI, and `checkConstraints` is the single
      `scan(...).map` Rails has; or the repo owner rules the hand scan permanent and CLAUDE.md records it.
- [ ] The two receipts on `checkConstraints` are deleted or read `PERMANENT`.
