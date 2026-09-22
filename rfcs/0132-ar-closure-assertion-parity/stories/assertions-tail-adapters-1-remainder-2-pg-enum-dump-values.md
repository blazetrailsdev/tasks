---
title: "assertions-tail-adapters-1-remainder-2-pg-enum-dump-values"
status: done
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#7941
claim: "2026-09-21T21:25:16Z"
assignee: "assertions-tail-adapters-1-remainder-2-pg-enum-dump-values"
blocked-by: null
closed-reason: null
---

## Context

Split from `assertions-tail-adapters-1-remainder-2`. `adapters/postgresql/enum_test.rb` is at 0
count/kind mismatches but keeps six `assert_includes` value mismatches over the schema dump:
Rails (`enum_test.rb:108-117,119-137,146,156,221-226`) asserts `create_enum "mood", ["sad", "ok", "happy"]`
and `t.enum "current_mood", enum_type: "mood"`, trails' `SchemaDumper` emits TS
(`await ctx.createEnum("mood", ["sad","ok","happy"]);`, `t.enum("current_mood", { enumType: "mood" })`).
The divergence is the dumper's output format, not the assertion; converging it is a dumper
decision spanning every schema-dump test, not this file.

## Acceptance criteria

- Decide (with the dumper owner) whether the assertion comparer should normalize trails' TS
  dump spelling against Rails' Ruby DSL, or the dumper converges; then zero the six value rows.
